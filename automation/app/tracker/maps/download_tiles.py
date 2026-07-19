"""Script para baixar tiles raster do OpenStreetMap para uso offline na rota de Tijucas."""

import os
import math
import time
import httpx
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TILES_DIR = os.path.join(BASE_DIR, "assets", "tiles")

# Bounding box da rota em Tijucas
LAT_MIN, LAT_MAX = -27.26, -27.22
LNG_MIN, LNG_MAX = -48.67, -48.61

ZOOM_LEVELS = range(12, 19)  # Zoom 12 a 18 (inclusivo)
USER_AGENT = "festadoscaminhoneiros-tracker-downloader/1.0 (https://festadoscaminhoneiros.com.br/)"


def deg2num(lat_deg: float, lon_deg: float, zoom: int) -> tuple[int, int]:
    """Converte coordenadas geográficas para coordenadas de tile x, y."""
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return xtile, ytile


def get_tile_ranges(zoom: int) -> tuple[range, range]:
    """Retorna os ranges de x e y para o zoom atual com base na bounding box."""
    x1, y1 = deg2num(LAT_MAX, LNG_MIN, zoom)  # Noroeste (lat_max, lng_min)
    x2, y2 = deg2num(LAT_MIN, LNG_MAX, zoom)  # Sudeste (lat_min, lng_max)

    # Ordenar ranges para garantir que min < max
    x_min, x_max = min(x1, x2), max(x1, x2)
    y_min, y_max = min(y1, y2), max(y1, y2)

    # Estender por 1 tile de margem para segurança nas bordas
    return range(x_min - 1, x_max + 2), range(y_min - 1, y_max + 2)


def download_tiles():
    """Baixa os tiles em lotes com limite de taxa para respeitar o OSM."""
    os.makedirs(TILES_DIR, exist_ok=True)

    headers = {"User-Agent": USER_AGENT}
    total_downloaded = 0
    total_skipped = 0

    with httpx.Client(timeout=10.0, headers=headers) as client:
        for zoom in ZOOM_LEVELS:
            x_range, y_range = get_tile_ranges(zoom)
            logger.info(f"Zoom {zoom}: X [{x_range.start}..{x_range.stop-1}], Y [{y_range.start}..{y_range.stop-1}]")
            
            for x in x_range:
                for y in y_range:
                    dest_dir = os.path.join(TILES_DIR, str(zoom), str(x))
                    os.makedirs(dest_dir, exist_ok=True)
                    dest_path = os.path.join(dest_dir, f"{y}.png")

                    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
                        total_skipped += 1
                        continue

                    url = f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"
                    try:
                        logger.info(f"Baixando tile {zoom}/{x}/{y}...")
                        response = client.get(url)
                        
                        if response.status_code == 200:
                            with open(dest_path, "wb") as f:
                                f.write(response.content)
                            total_downloaded += 1
                        elif response.status_code == 404:
                            logger.warning(f"Tile não existe (404): {zoom}/{x}/{y}")
                        else:
                            logger.error(f"Erro HTTP {response.status_code} para {zoom}/{x}/{y}")
                            time.sleep(1.0)  # Pausa maior em erro
                        
                        # Respeitar os termos de serviço (rate limit)
                        time.sleep(0.15)
                    except Exception as e:
                        logger.error(f"Falha de rede ao baixar tile {zoom}/{x}/{y}: {e}")
                        time.sleep(1.0)

    logger.info(f"Concluído! Baixados: {total_downloaded}, Pulados: {total_skipped}")


if __name__ == "__main__":
    download_tiles()
