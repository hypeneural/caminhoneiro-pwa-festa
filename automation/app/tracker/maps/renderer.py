"""Módulo de renderização de mapas do rastreamento usando Chrome headless e Leaflet."""

import json
import logging
import os
import threading
import time
from datetime import timezone
from typing import Any, List, Tuple, Optional
from zoneinfo import ZoneInfo
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from .models import MapJob, MapArtifact
from .server import LocalAssetServer
from .composer import MapCollageComposer

logger = logging.getLogger(__name__)
DISPLAY_TIMEZONE = ZoneInfo("America/Sao_Paulo")


class MapRenderError(RuntimeError):
    """Erro ao renderizar o mosaico de mapas."""
    pass


class LeafletMapRenderer:
    """Orquestra a captura da página do mapa no Chrome controlado via Selenium."""

    def __init__(
        self,
        chrome_binary: str = "",
        chromedriver_path: str = "",
        headless: bool = True,
        use_swiftshader: bool = True,
        no_sandbox: bool = False,
        page_timeout_seconds: float = 20.0,
        max_jpeg_bytes: int = 2_000_000,
    ):
        self.chrome_binary = chrome_binary
        self.chromedriver_path = chromedriver_path
        self.headless = headless
        self.use_swiftshader = use_swiftshader
        self.no_sandbox = no_sandbox
        self.page_timeout_seconds = page_timeout_seconds

        self.assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
        self.server = LocalAssetServer(self.assets_dir)
        self.composer = MapCollageComposer(max_jpeg_bytes=max_jpeg_bytes)

        self._driver: Optional[webdriver.Chrome] = None
        self._lock = threading.Lock()
        self._server_port: int = 0

    def _create_driver(self) -> webdriver.Chrome:
        """Cria e configura o driver do Chrome Headless."""
        options = Options()
        if self.headless:
            options.add_argument("--headless=new")
        
        # Dimensões da janela correspondentes ao canvas final
        options.add_argument("--window-size=1200,1600")
        options.add_argument("--force-device-scale-factor=1")
        options.add_argument("--lang=pt-BR")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-features=MediaRouter")
        options.add_argument("--log-level=3")

        if self.use_swiftshader:
            options.add_argument("--use-gl=swiftshader")
            options.add_argument("--enable-unsafe-swiftshader")
        if self.no_sandbox:
            options.add_argument("--no-sandbox")
        if self.chrome_binary:
            options.binary_location = self.chrome_binary

        options.page_load_strategy = "eager"

        if self.chromedriver_path:
            service = Service(executable_path=self.chromedriver_path)
        else:
            service = Service()

        try:
            driver = webdriver.Chrome(service=service, options=options)
            driver.set_page_load_timeout(self.page_timeout_seconds)
            driver.set_script_timeout(self.page_timeout_seconds)
            return driver
        except Exception as exc:
            raise MapRenderError(f"Falha ao iniciar o Chrome/Selenium: {exc}") from exc

    def _get_driver(self) -> webdriver.Chrome:
        """Obtém ou cria a instância do driver Chrome (thread-safe)."""
        if self._driver is None:
            logger.info("Inicializando Chrome headless para o mapa vetorial local...")
            self._driver = self._create_driver()
        return self._driver

    def _reset_driver(self) -> None:
        """Encerra e limpa o driver atual."""
        if self._driver is not None:
            try:
                self._driver.quit()
            except Exception:
                logger.debug("Falha ao encerrar Chrome durante reset", exc_info=True)
            self._driver = None

    @staticmethod
    def _snapped_coordinates(job: MapJob) -> List[float]:
        snapped_lat = getattr(job, 'snapped_lat', None)
        snapped_lng = getattr(job, 'snapped_lng', None)
        return [
            job.latitude if snapped_lat is None else snapped_lat,
            job.longitude if snapped_lng is None else snapped_lng,
        ]

    @staticmethod
    def _display_timestamp(updated_at: Any) -> str:
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        return updated_at.astimezone(DISPLAY_TIMEZONE).strftime("%d/%m/%Y \u00e0s %H:%M:%S")

    @staticmethod
    def _validate_render_result(result: Any) -> None:
        """Valida o contrato retornado pelo template vetorial local."""
        if not isinstance(result, dict):
            raise MapRenderError('Resultado do mapa vetorial invalido: esperado um objeto')
        if result.get('ready') is not True:
            raise MapRenderError('Resultado do mapa vetorial invalido: ready deve ser true')
        if result.get('error'):
            raise MapRenderError('Erro no script do mapa vetorial: %s' % result['error'])

        base_feature_count = result.get('baseFeatureCount')
        if (
            isinstance(base_feature_count, bool)
            or not isinstance(base_feature_count, (int, float))
            or base_feature_count < 100
        ):
            raise MapRenderError('Base vetorial local invalida: minimo de 100 feicoes')

        external_requests = result.get('externalRequests')
        if (
            isinstance(external_requests, bool)
            or not isinstance(external_requests, (int, float))
            or external_requests != 0
        ):
            raise MapRenderError('Renderizacao offline invalida: externalRequests deve ser 0')

    def render_collage(
        self,
        job: MapJob,
        route_wgs84: List[Tuple[float, float]],
        progress_wgs84: List[Tuple[float, float]],
        start_coords: Tuple[float, float],
        total_length_m: float
    ) -> MapArtifact:
        """Renderiza o mosaico de mapas e retorna o MapArtifact comprimido."""
        # Carregar theme.json se existir
        theme = {}
        theme_path = os.path.join(self.assets_dir, "theme.json")
        if os.path.exists(theme_path):
            try:
                with open(theme_path, "r", encoding="utf-8") as f:
                    theme = json.load(f)
            except Exception as e:
                logger.warning(f"Falha ao ler theme.json: {e}")

        # Preparar dados para injecao no mapa vetorial local.
        payload = {
            "routeWgs84": route_wgs84,
            "progressWgs84": progress_wgs84,
            "current": [job.latitude, job.longitude],
            "snapped": self._snapped_coordinates(job),
            "start": start_coords,
            "bearing": job.bearing,
            "speedKmh": job.speed_kmh,
            "status": "Em movimento" if job.event_type in ("moving", "resumed", "recovered_moving") else "Parado",
            "isMoving": job.event_type in ("moving", "resumed", "recovered_moving"),
            "timestamp": self._display_timestamp(job.updated_at),
            "address": job.address or "",
            "progressM": job.progress_m,
            "totalLengthM": total_length_m,
            "theme": theme
        }

        with self._lock:
            # 1. Iniciar servidor local se necessário
            if self._server_port == 0:
                self._server_port = self.server.start()

            url = f"http://127.0.0.1:{self._server_port}/map_collage.html"
            
            # Tentar capturar, reiniciando o driver em caso de falha de comunicação
            for attempt in range(2):
                try:
                    driver = self._get_driver()
                    
                    logger.info(f"Navegando para o template do mapa vetorial: {url}")
                    driver.get(url)

                    # Injetar os dados e inicializar os mapas
                    logger.info("Injetando dados da rota no mapa vetorial...")
                    driver.execute_script("initMaps(arguments[0])", payload)

                    # Esperar a base local e a renderizacao sinalizarem prontidao.
                    logger.info(
                        "Aguardando carregamento da base vetorial local e renderizacao..."
                    )
                    WebDriverWait(driver, self.page_timeout_seconds).until(
                        lambda d: d.execute_script("return window.__MAP_RENDER_RESULT?.ready === true")
                    )

                    # Validar o contrato offline informado pelo template.
                    result = driver.execute_script("return window.__MAP_RENDER_RESULT")
                    self._validate_render_result(result)
                    logger.info(
                        "Base vetorial local validada com %s feicoes e nenhuma requisicao externa.",
                        result["baseFeatureCount"],
                    )

                    # Encontrar o elemento #map-collage e capturar a screenshot
                    collage_element = driver.find_element(By.ID, "map-collage")
                    png_bytes = collage_element.screenshot_as_png
                    logger.info("Screenshot capturada com sucesso!")

                    # Processar e comprimir com Pillow
                    return self.composer.compose(png_bytes, job.progress_m)

                except Exception as exc:
                    logger.error(f"Tentativa {attempt + 1} falhou ao renderizar mapa: {exc}")
                    self._reset_driver()
                    if attempt == 1:
                        raise MapRenderError(f"Falha persistente ao renderizar mapa: {exc}") from exc
                    time.sleep(1.0)

    def close(self):
        """Encerra o driver do navegador e o servidor local."""
        with self._lock:
            self._reset_driver()
            self.server.stop()
            self._server_port = 0
