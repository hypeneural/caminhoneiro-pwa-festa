"""Script para baixar arquivos estáticos do Leaflet 1.9.4 para uso local."""

import os
import httpx
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LEAFLET_DIR = os.path.join(BASE_DIR, "assets", "leaflet")
IMAGES_DIR = os.path.join(LEAFLET_DIR, "images")

FILES_TO_DOWNLOAD = {
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js": os.path.join(LEAFLET_DIR, "leaflet.js"),
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css": os.path.join(LEAFLET_DIR, "leaflet.css"),
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png": os.path.join(IMAGES_DIR, "marker-icon.png"),
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png": os.path.join(IMAGES_DIR, "marker-icon-2x.png"),
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png": os.path.join(IMAGES_DIR, "marker-shadow.png"),
}


def download_leaflet():
    """Cria os diretórios e baixa os arquivos do Leaflet."""
    os.makedirs(LEAFLET_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)

    with httpx.Client(timeout=30.0) as client:
        for url, dest_path in FILES_TO_DOWNLOAD.items():
            if os.path.exists(dest_path):
                logger.info(f"Arquivo já existe: {dest_path}")
                continue

            logger.info(f"Baixando {url} -> {dest_path}")
            try:
                response = client.get(url)
                response.raise_for_status()
                with open(dest_path, "wb") as f:
                    f.write(response.content)
                logger.info(f"Download concluído com sucesso!")
            except Exception as e:
                logger.error(f"Erro ao baixar {url}: {e}")
                raise


if __name__ == "__main__":
    download_leaflet()
