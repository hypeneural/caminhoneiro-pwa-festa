"""Captura e composição de vistas do Google Street View sem API paga.

O módulo abre URLs documentadas do Google Maps em um Chrome controlado por
Selenium. Ele não usa técnicas de stealth, não remove elementos da interface e
não oculta atribuições. As quatro vistas são mantidas em memória e combinadas
em um mosaico JPEG com Pillow.
"""

from __future__ import annotations

import io
import logging
import math
import os
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Protocol, Sequence
from urllib.parse import urlencode

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps, ImageStat

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ViewSpec:
    """Uma direção que será capturada no Street View."""

    label: str
    heading: int


CARDINAL_VIEWS: tuple[ViewSpec, ...] = (
    ViewSpec("Norte", 0),
    ViewSpec("Leste", 90),
    ViewSpec("Sul", 180),
    ViewSpec("Oeste", 270),
)


@dataclass(frozen=True)
class StreetViewCaptureConfig:
    """Configuração do Chrome e das validações de captura."""

    headless: bool = True
    chrome_binary: str = ""
    chromedriver_path: str = ""
    window_width: int = 1280
    window_height: int = 720
    page_timeout_seconds: float = 25.0
    settle_seconds: float = 2.5
    sample_interval_seconds: float = 0.8
    retries: int = 1
    use_swiftshader: bool = True
    no_sandbox: bool = False
    min_canvas_width: int = 640
    min_canvas_height: int = 360
    min_png_bytes: int = 15_000
    max_dark_ratio: float = 0.92
    max_light_ratio: float = 0.95
    min_luminance_stddev: float = 9.0
    min_edge_score: float = 1.5
    max_blank_grid_tiles: int = 5
    stable_frame_delta: float = 18.0
    require_panorama_semantics: bool = True
    no_imagery_grace_seconds: float = 10.0


@dataclass(frozen=True)
class PanoramaComposeConfig:
    """Dimensões e compressão do mosaico enviado ao WhatsApp."""

    tile_width: int = 640
    tile_height: int = 360
    label_height: int = 40
    header_height: int = 104
    footer_height: int = 48
    jpeg_quality: int = 85
    max_jpeg_bytes: int = 2_000_000


@dataclass
class CapturedView:
    """Imagem validada de uma direção."""

    spec: ViewSpec
    image: Image.Image
    source_url: str
    image_date: Optional[str] = None


@dataclass(frozen=True)
class PanoramaArtifact:
    """Resultado final, pronto para ser enviado pela Z-API."""

    jpeg_bytes: bytes
    width: int
    height: int
    headings: tuple[int, ...]
    captured_at: datetime


class StreetViewCaptureError(RuntimeError):
    """Falha transitória ou permanente ao capturar uma vista."""


class StreetViewUnavailable(StreetViewCaptureError):
    """A página informou que não há Street View para a coordenada."""


class StreetViewConsentBlocked(StreetViewCaptureError):
    """A página de consentimento impediu o acesso ao panorama."""


class StreetViewCaptureCancelled(StreetViewCaptureError):
    """O desligamento do serviço cancelou uma captura em andamento."""

class PanoramaGenerator(Protocol):
    """Contrato usado pelo despachante assíncrono."""

    def generate(
        self,
        *,
        latitude: float,
        longitude: float,
        header_lines: Sequence[str],
    ) -> PanoramaArtifact:
        ...

    def cancel(self) -> None:
        ...

    def close(self) -> None:
        ...


def validate_coordinates(latitude: float, longitude: float) -> None:
    """Valida coordenadas antes de passá-las ao navegador."""

    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        raise ValueError(f"Latitude inválida: {latitude!r}")
    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        raise ValueError(f"Longitude inválida: {longitude!r}")


def build_streetview_url(
    latitude: float,
    longitude: float,
    heading: float,
    *,
    pitch: int = 0,
    fov: int = 90,
) -> str:
    """Monta uma URL interativa do Google Maps para o panorama solicitado."""

    validate_coordinates(latitude, longitude)
    normalized_heading = int(round(heading)) % 360
    if not 10 <= int(fov) <= 120:
        raise ValueError("FOV deve estar entre 10 e 120 graus.")
    if not -90 <= int(pitch) <= 90:
        raise ValueError("Pitch deve estar entre -90 e 90 graus.")

    parameters = {
        "api": 1,
        "map_action": "pano",
        "viewpoint": f"{latitude:.7f},{longitude:.7f}",
        "heading": normalized_heading,
        "pitch": int(pitch),
        "fov": int(fov),
    }
    return "https://www.google.com/maps/@?" + urlencode(parameters)


def _mean_frame_delta(first: Image.Image, second: Image.Image) -> float:
    """Mede quanto dois frames sucessivos mudaram."""

    first_sample = first.convert("RGB").resize((160, 90), Image.Resampling.BILINEAR)
    second_sample = second.convert("RGB").resize((160, 90), Image.Resampling.BILINEAR)
    difference = ImageChops.difference(first_sample, second_sample)
    channels = ImageStat.Stat(difference).mean
    return sum(channels) / max(1, len(channels))


def _edge_score(grayscale: Image.Image) -> float:
    """Calcula uma medida simples de variação entre pixels adjacentes."""

    width, height = grayscale.size
    pixels = grayscale.tobytes()
    if width < 2 or height < 2 or not pixels:
        return 0.0

    horizontal = 0
    horizontal_count = 0
    vertical = 0
    vertical_count = 0

    for y in range(height):
        row_start = y * width
        for x in range(width - 1):
            horizontal += abs(pixels[row_start + x + 1] - pixels[row_start + x])
            horizontal_count += 1

    for y in range(height - 1):
        row_start = y * width
        next_row = (y + 1) * width
        for x in range(width):
            vertical += abs(pixels[next_row + x] - pixels[row_start + x])
            vertical_count += 1

    total_count = horizontal_count + vertical_count
    return (horizontal + vertical) / total_count if total_count else 0.0


def validate_rendered_image(
    image: Image.Image,
    *,
    png_size: int,
    config: StreetViewCaptureConfig,
) -> dict[str, float]:
    """Rejeita frames vazios, pretos, brancos ou praticamente uniformes."""

    if image.width < config.min_canvas_width or image.height < config.min_canvas_height:
        raise StreetViewCaptureError(
            f"frame_too_small:{image.width}x{image.height}"
        )
    if png_size < config.min_png_bytes:
        raise StreetViewCaptureError(f"frame_too_small_bytes:{png_size}")

    sample = ImageOps.fit(
        image.convert("RGB"),
        (160, 90),
        method=Image.Resampling.BILINEAR,
        centering=(0.5, 0.5),
    ).convert("L")
    grid_sample = ImageOps.fit(
        image.convert("RGB"),
        (160, 90),
        method=Image.Resampling.NEAREST,
        centering=(0.5, 0.5),
    ).convert("L")
    histogram = sample.histogram()
    pixel_count = sample.width * sample.height
    dark_ratio = sum(histogram[:20]) / pixel_count
    light_ratio = sum(histogram[236:]) / pixel_count
    luminance_stddev = float(ImageStat.Stat(sample).stddev[0])
    edge_score = _edge_score(sample)

    if dark_ratio > config.max_dark_ratio:
        raise StreetViewCaptureError(f"black_frame:{dark_ratio:.3f}")
    if light_ratio > config.max_light_ratio:
        raise StreetViewCaptureError(f"white_frame:{light_ratio:.3f}")
    if (
        luminance_stddev < config.min_luminance_stddev
        and edge_score < config.min_edge_score
    ):
        raise StreetViewCaptureError(
            "flat_frame:"
            f"stddev={luminance_stddev:.2f},edges={edge_score:.2f}"
        )

    grid_columns = 4
    grid_rows = 3
    blank_grid_tiles = 0
    for row in range(grid_rows):
        for column in range(grid_columns):
            left = column * grid_sample.width // grid_columns
            top = row * grid_sample.height // grid_rows
            right = (column + 1) * grid_sample.width // grid_columns
            bottom = (row + 1) * grid_sample.height // grid_rows
            tile = grid_sample.crop((left, top, right, bottom))
            tile_histogram = tile.histogram()
            tile_pixels = max(1, tile.width * tile.height)
            tile_dark_ratio = sum(tile_histogram[:12]) / tile_pixels
            tile_light_ratio = sum(tile_histogram[244:]) / tile_pixels
            tile_stddev = float(ImageStat.Stat(tile).stddev[0])
            if (
                (tile_dark_ratio > 0.97 or tile_light_ratio > 0.97)
                and tile_stddev < 8.0
            ):
                blank_grid_tiles += 1

    if blank_grid_tiles > config.max_blank_grid_tiles:
        raise StreetViewCaptureError(
            f"partial_blank_frame:tiles={blank_grid_tiles}"
        )

    return {
        "dark_ratio": dark_ratio,
        "light_ratio": light_ratio,
        "luminance_stddev": luminance_stddev,
        "edge_score": edge_score,
        "blank_grid_tiles": float(blank_grid_tiles),
    }


class SeleniumStreetViewCapture:
    """Controla um Chrome persistente e captura o maior canvas visível."""

    _NO_IMAGERY_PHRASES = (
        "street view is not available here",
        "no street view imagery available",
        "no street view available",
        "não há imagens do street view disponíveis",
        "o street view não está disponível aqui",
        "street view no está disponible aquí",
    )
    _CONSENT_PHRASES = (
        "before you continue to google",
        "antes de continuar para o google",
        "antes de continuar no google",
        "consent.google.com",
    )
    _ACCEPT_BUTTON_TEXTS = {
        "accept all",
        "aceitar tudo",
        "aceito",
        "i agree",
        "concordo",
        "aceptar todo",
    }

    def __init__(self, config: StreetViewCaptureConfig):
        self.config = config
        self._driver = None
        self._lock = threading.Lock()

        self._cancel_event = threading.Event()

    def _raise_if_cancelled(self) -> None:
        if self._cancel_event.is_set():
            raise StreetViewCaptureCancelled("capture_cancelled")

    def cancel(self) -> None:
        """Sinaliza cancelamento sem esperar pelo lock da captura."""

        self._cancel_event.set()

    def _create_driver(self):
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
        except ImportError as exc:
            raise StreetViewCaptureError(
                "Selenium não está instalado. Execute: pip install -r requirements.txt"
            ) from exc

        options = Options()
        if self.config.headless:
            options.add_argument("--headless=new")
        options.add_argument(
            f"--window-size={self.config.window_width},{self.config.window_height}"
        )
        options.add_argument("--force-device-scale-factor=1")
        options.add_argument("--lang=pt-BR")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-features=MediaRouter")
        options.add_argument("--log-level=3")

        if self.config.use_swiftshader:
            options.add_argument("--use-gl=swiftshader")
            options.add_argument("--enable-unsafe-swiftshader")
        if self.config.no_sandbox:
            options.add_argument("--no-sandbox")
        if self.config.chrome_binary:
            options.binary_location = self.config.chrome_binary

        options.page_load_strategy = "eager"

        if self.config.chromedriver_path:
            service = Service(executable_path=self.config.chromedriver_path)
        else:
            service = Service()

        driver = webdriver.Chrome(service=service, options=options)
        driver.set_page_load_timeout(self.config.page_timeout_seconds)
        driver.set_script_timeout(self.config.page_timeout_seconds)
        return driver

    def _get_driver(self):
        if self._driver is None:
            logger.info("Inicializando Chrome headless para panoramas do tracker")
            self._driver = self._create_driver()
        return self._driver

    def _reset_driver(self) -> None:
        if self._driver is not None:
            try:
                self._driver.quit()
            except Exception:
                logger.debug("Falha ao encerrar Chrome durante reset", exc_info=True)
        self._driver = None

    @staticmethod
    def _page_text(driver) -> str:
        try:
            from selenium.webdriver.common.by import By

            return driver.find_element(By.TAG_NAME, "body").text.lower()
        except Exception:
            return ""

    def _accept_consent_if_present(self, driver) -> None:
        """Aceita apenas botões de consentimento com texto conhecido."""

        try:
            from selenium.webdriver.common.by import By

            for button in driver.find_elements(By.CSS_SELECTOR, "button"):
                if not button.is_displayed() or not button.is_enabled():
                    continue
                text = " ".join((button.text or "").strip().lower().split())
                aria = " ".join(
                    (button.get_attribute("aria-label") or "").strip().lower().split()
                )
                if text in self._ACCEPT_BUTTON_TEXTS or aria in self._ACCEPT_BUTTON_TEXTS:
                    button.click()
                    time.sleep(0.5)
                    return
        except Exception:
            logger.debug("Não foi possível interagir com consentimento", exc_info=True)

    def _raise_for_page_error(self, driver) -> None:
        current_url = (driver.current_url or "").lower()
        body_text = self._page_text(driver)
        combined = f"{current_url}\n{body_text}"

        if any(phrase in combined for phrase in self._CONSENT_PHRASES):
            raise StreetViewConsentBlocked("consent_blocked")
        if "captcha" in combined or "unusual traffic" in combined:
            raise StreetViewCaptureError("captcha_or_unusual_traffic")

    def _page_has_no_imagery_message(self, driver) -> bool:
        body_text = self._page_text(driver)
        return any(
            phrase in body_text
            for phrase in self._NO_IMAGERY_PHRASES
        )

    @staticmethod
    def _url_has_no_panorama(driver) -> bool:
        try:
            return ",0a," in (driver.current_url or "").lower()
        except Exception:
            return False

    def _is_panorama_mode(self, driver) -> bool:
        """Distingue um panorama real de um canvas de mapa comum."""

        if not self.config.require_panorama_semantics:
            return True

        current_url = (driver.current_url or "").lower()
        # O Maps usa ",3a," ao entrar num panorama real. Uma URL com
        # ",0a," e `panoid` vazio ainda pode conter `!1e1`, mas representa
        # apenas o canvas preto exibido quando não há cobertura.
        if ",3a," in current_url:
            return True

        body_text = self._page_text(driver)
        semantic_markers = (
            "captura da imagem:",
            "image capture:",
            "captura de imagen:",
            "as imagens podem ter direitos autorais",
            "imagery may be subject to copyright",
        )
        return any(marker in body_text for marker in semantic_markers)

    @staticmethod
    def _dismiss_panorama_notice(driver) -> bool:
        """Fecha somente o snackbar dispensável, sem ocultar UI ou atribuição."""

        try:
            return bool(
                driver.execute_script(
                    """
                    const button = document.querySelector(
                        'button[jsaction="snackbar.dismiss"]'
                    );
                    if (!button) return false;
                    button.click();
                    return true;
                    """
                )
            )
        except Exception:
            logger.debug(
                "Não foi possível dispensar o aviso do panorama",
                exc_info=True,
            )
            return False

    def _largest_canvas(self, driver) -> Optional[dict]:
        return driver.execute_script(
            """
            const minWidth = arguments[0];
            const minHeight = arguments[1];
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const candidates = Array.from(document.querySelectorAll('canvas'))
                .map((canvas, index) => {
                    const rect = canvas.getBoundingClientRect();
                    const style = window.getComputedStyle(canvas);
                    const visibleWidth =
                        Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
                    const visibleHeight =
                        Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
                    return {
                        index,
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        visibleWidth,
                        visibleHeight,
                        bufferWidth: canvas.width,
                        bufferHeight: canvas.height,
                        display: style.display,
                        visibility: style.visibility,
                        opacity: Number(style.opacity || 1),
                        area: visibleWidth * visibleHeight,
                        viewportWidth,
                        viewportHeight,
                        devicePixelRatio: window.devicePixelRatio || 1,
                    };
                })
                .filter(item =>
                    item.display !== 'none' &&
                    item.visibility !== 'hidden' &&
                    item.opacity > 0 &&
                    item.visibleWidth >= minWidth &&
                    item.visibleHeight >= minHeight &&
                    item.bufferWidth > 0 &&
                    item.bufferHeight > 0
                )
                .sort((a, b) => b.area - a.area);

            return candidates.length ? candidates[0] : null;
            """,
            self.config.min_canvas_width,
            self.config.min_canvas_height,
        )

    @staticmethod
    def _crop_canvas_screenshot(png_data: bytes, canvas: dict) -> Image.Image:
        screenshot = Image.open(io.BytesIO(png_data)).convert("RGB")
        viewport_width = max(1.0, float(canvas["viewportWidth"]))
        viewport_height = max(1.0, float(canvas["viewportHeight"]))
        scale_x = screenshot.width / viewport_width
        scale_y = screenshot.height / viewport_height

        left = max(0, int(round(float(canvas["x"]) * scale_x)))
        top = max(0, int(round(float(canvas["y"]) * scale_y)))
        right = min(
            screenshot.width,
            int(round((float(canvas["x"]) + float(canvas["width"])) * scale_x)),
        )
        bottom = min(
            screenshot.height,
            int(round((float(canvas["y"]) + float(canvas["height"])) * scale_y)),
        )
        if right <= left or bottom <= top:
            raise StreetViewCaptureError("invalid_canvas_bounds")
        return screenshot.crop((left, top, right, bottom))

    def _wait_for_rendered_frame(self, driver) -> Image.Image:
        started_at = time.monotonic()
        deadline = time.monotonic() + self.config.page_timeout_seconds
        first_valid_at: Optional[float] = None
        previous_image: Optional[Image.Image] = None
        last_error = "canvas_not_ready"
        notice_dismissed = False

        while time.monotonic() < deadline:
            self._raise_if_cancelled()
            self._raise_for_page_error(driver)
            canvas = self._largest_canvas(driver)
            if canvas is None:
                self._cancel_event.wait(0.25)
                continue

            try:
                panorama_mode = self._is_panorama_mode(driver)
                if (
                    panorama_mode
                    and not notice_dismissed
                    and self._dismiss_panorama_notice(driver)
                ):
                    notice_dismissed = True
                    first_valid_at = None
                    previous_image = None
                    self._cancel_event.wait(0.35)
                    continue

                png_data = driver.get_screenshot_as_png()
                if not png_data:
                    raise StreetViewCaptureError("empty_screenshot")
                image = self._crop_canvas_screenshot(png_data, canvas)
                metrics = validate_rendered_image(
                    image,
                    png_size=len(png_data),
                    config=self.config,
                )
                if not panorama_mode:
                    raise StreetViewCaptureError("not_panorama_mode")

                now = time.monotonic()
                if first_valid_at is None:
                    first_valid_at = now

                if previous_image is not None:
                    delta = _mean_frame_delta(previous_image, image)
                    settled_for = now - first_valid_at
                    if (
                        settled_for >= self.config.settle_seconds
                        and delta <= self.config.stable_frame_delta
                    ):
                        logger.debug(
                            "Street View renderizado: delta=%.2f dark=%.3f "
                            "light=%.3f stddev=%.2f edges=%.2f",
                            delta,
                            metrics["dark_ratio"],
                            metrics["light_ratio"],
                            metrics["luminance_stddev"],
                            metrics["edge_score"],
                        )
                        return image

                previous_image = image
                last_error = "frame_not_stable"
            except StreetViewCaptureError as exc:
                last_error = str(exc)

            if (
                (
                    self._page_has_no_imagery_message(driver)
                    or self._url_has_no_panorama(driver)
                )
                and not self._is_panorama_mode(driver)
                and time.monotonic() - started_at
                >= self.config.no_imagery_grace_seconds
            ):
                raise StreetViewUnavailable("no_streetview_imagery")

            self._cancel_event.wait(self.config.sample_interval_seconds)

        raise StreetViewCaptureError(f"render_timeout:{last_error}")

    def _capture_once(self, url: str) -> Image.Image:
        self._raise_if_cancelled()
        driver = self._get_driver()
        try:
            driver.get(url)
        except Exception as exc:
            self._raise_if_cancelled()
            raise StreetViewCaptureError(f"navigation_failed:{exc}") from exc

        self._accept_consent_if_present(driver)
        return self._wait_for_rendered_frame(driver)

    def capture(self, url: str) -> Image.Image:
        """Captura uma URL, reiniciando o driver após falhas transitórias."""

        with self._lock:
            self._raise_if_cancelled()
            last_error: Optional[Exception] = None
            for attempt in range(self.config.retries + 1):
                try:
                    return self._capture_once(url)
                except StreetViewCaptureCancelled:
                    raise
                except StreetViewUnavailable:
                    raise
                except StreetViewConsentBlocked:
                    raise
                except Exception as exc:
                    last_error = exc
                    logger.warning(
                        "Falha na captura Street View (tentativa %d/%d): %s",
                        attempt + 1,
                        self.config.retries + 1,
                        exc,
                    )
                    self._reset_driver()
                    if attempt < self.config.retries:
                        self._cancel_event.wait(min(2.0, 0.5 * (attempt + 1)))

            raise StreetViewCaptureError(
                f"capture_failed:{last_error or 'unknown_error'}"
            )

    def close(self) -> None:
        self.cancel()
        with self._lock:
            self._reset_driver()


class PillowPanoramaComposer:
    """Monta um mosaico 2x2 previsível e adequado ao WhatsApp."""

    def __init__(self, config: PanoramaComposeConfig):
        self.config = config

    @staticmethod
    def _font_candidates(*, bold: bool) -> list[Path]:
        windows = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
        if bold:
            names = ("arialbd.ttf", "segoeuib.ttf", "DejaVuSans-Bold.ttf")
        else:
            names = ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf")
        return [
            *(windows / name for name in names),
            *(Path("/usr/share/fonts/truetype/dejavu") / name for name in names),
            *(Path("/usr/share/fonts/dejavu") / name for name in names),
        ]

    @classmethod
    def _load_font(cls, size: int, *, bold: bool = False) -> ImageFont.ImageFont:
        for candidate in cls._font_candidates(bold=bold):
            if candidate.exists():
                try:
                    return ImageFont.truetype(str(candidate), size=size)
                except OSError:
                    continue
        return ImageFont.load_default()

    def _prepare_tile(self, captured: CapturedView) -> Image.Image:
        config = self.config
        panel = Image.new(
            "RGB",
            (config.tile_width, config.label_height + config.tile_height),
            "#101820",
        )
        draw = ImageDraw.Draw(panel)
        label_font = self._load_font(22, bold=True)
        draw.text(
            (14, 7),
            f"{captured.spec.label} · {captured.spec.heading}°",
            font=label_font,
            fill="white",
        )

        prepared = ImageOps.fit(
            captured.image.convert("RGB"),
            (config.tile_width, config.tile_height),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 1.0),
        )
        panel.paste(prepared, (0, config.label_height))
        return panel

    def _render_canvas(
        self,
        views: Sequence[CapturedView],
        header_lines: Sequence[str],
    ) -> Image.Image:
        if len(views) != 4:
            raise ValueError("O mosaico requer exatamente quatro vistas.")

        config = self.config
        panel_height = config.label_height + config.tile_height
        width = config.tile_width * 2
        height = config.header_height + panel_height * 2 + config.footer_height
        canvas = Image.new("RGB", (width, height), "#f4f6f8")
        draw = ImageDraw.Draw(canvas)

        title_font = self._load_font(28, bold=True)
        detail_font = self._load_font(18)
        footer_font = self._load_font(15)

        title = header_lines[0] if header_lines else "Visão panorâmica do local"
        details = " · ".join(line for line in header_lines[1:] if line)
        draw.text((22, 14), title, font=title_font, fill="#111827")
        if details:
            draw.text((22, 58), details, font=detail_font, fill="#374151")

        positions = (
            (0, config.header_height),
            (config.tile_width, config.header_height),
            (0, config.header_height + panel_height),
            (config.tile_width, config.header_height + panel_height),
        )
        for captured, position in zip(views, positions):
            canvas.paste(self._prepare_tile(captured), position)

        footer_y = height - config.footer_height
        draw.rectangle((0, footer_y, width, height), fill="#111827")
        draw.text(
            (18, footer_y + 13),
            "Imagem aproximada do Google Street View; o registro visual pode estar desatualizado.",
            font=footer_font,
            fill="#f9fafb",
        )
        return canvas

    @staticmethod
    def _encode_jpeg(image: Image.Image, quality: int) -> bytes:
        buffer = io.BytesIO()
        image.save(
            buffer,
            format="JPEG",
            quality=quality,
            optimize=True,
            progressive=False,
            subsampling="4:2:0",
        )
        return buffer.getvalue()

    def compose(
        self,
        views: Sequence[CapturedView],
        header_lines: Sequence[str],
    ) -> PanoramaArtifact:
        canvas = self._render_canvas(views, header_lines)
        quality = min(95, max(55, self.config.jpeg_quality))
        jpeg_bytes = self._encode_jpeg(canvas, quality)

        while len(jpeg_bytes) > self.config.max_jpeg_bytes and quality > 60:
            quality -= 5
            jpeg_bytes = self._encode_jpeg(canvas, quality)

        while len(jpeg_bytes) > self.config.max_jpeg_bytes and canvas.width > 900:
            canvas = canvas.resize(
                (
                    max(900, int(canvas.width * 0.85)),
                    max(600, int(canvas.height * 0.85)),
                ),
                Image.Resampling.LANCZOS,
            )
            jpeg_bytes = self._encode_jpeg(canvas, max(60, quality))

        if len(jpeg_bytes) > self.config.max_jpeg_bytes:
            raise StreetViewCaptureError(
                f"panorama_too_large:{len(jpeg_bytes)}"
            )

        return PanoramaArtifact(
            jpeg_bytes=jpeg_bytes,
            width=canvas.width,
            height=canvas.height,
            headings=tuple(view.spec.heading for view in views),
            captured_at=datetime.now(timezone.utc),
        )


class StreetViewPanoramaService:
    """Orquestra as quatro capturas e a composição final."""

    def __init__(
        self,
        capture: SeleniumStreetViewCapture,
        composer: PillowPanoramaComposer,
        *,
        views: Sequence[ViewSpec] = CARDINAL_VIEWS,
    ):
        self.capture = capture
        self.composer = composer
        self.views = tuple(views)

    @staticmethod
    def _ensure_distinct_views(views: Sequence[CapturedView]) -> None:
        for index, first in enumerate(views):
            for second in views[index + 1 :]:
                delta = _mean_frame_delta(first.image, second.image)
                if delta < 0.75:
                    raise StreetViewCaptureError(
                        "duplicate_headings:"
                        f"{first.spec.heading},{second.spec.heading},delta={delta:.2f}"
                    )

    def generate(
        self,
        *,
        latitude: float,
        longitude: float,
        header_lines: Sequence[str],
    ) -> PanoramaArtifact:
        validate_coordinates(latitude, longitude)
        captured: list[CapturedView] = []

        for spec in self.views:
            url = build_streetview_url(latitude, longitude, spec.heading)
            logger.debug(
                "Capturando Street View %s (%d°) em %.6f, %.6f",
                spec.label,
                spec.heading,
                latitude,
                longitude,
            )
            image = self.capture.capture(url)
            captured.append(
                CapturedView(
                    spec=spec,
                    image=image,
                    source_url=url,
                )
            )

        self._ensure_distinct_views(captured)
        return self.composer.compose(captured, header_lines)

    def cancel(self) -> None:
        self.capture.cancel()

    def close(self) -> None:
        self.capture.close()
