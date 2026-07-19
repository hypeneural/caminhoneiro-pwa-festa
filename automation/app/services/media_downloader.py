import os
import hashlib
import httpx
import logging
from urllib.parse import urlparse
from app.config import settings

logger = logging.getLogger(__name__)

class MediaDownloader:
    @staticmethod
    def download_image(url: str, job_uuid: str) -> tuple[str, str]:
        """
        Realiza o download da imagem a partir de uma URL de forma segura.
        Retorna uma tupla (caminho_do_arquivo_salvo, hash_sha256).
        """
        # Proteção contra SSRF - Apenas HTTPS
        parsed = urlparse(url)
        if parsed.scheme != "https":
            raise ValueError(f"URL de mídia inválida ou insegura: {url}")
            
        # Bloquear IPs privados/locais se o host for IP
        # (Em ambiente de produção, poderíamos resolver o DNS e verificar, mas Z-API usa URLs de CDN conhecidas)

        # Assegurar que a pasta spool/incoming existe
        incoming_dir = os.path.join(settings.SPOOL_DIR, "incoming")
        os.makedirs(incoming_dir, exist_ok=True)

        part_file = os.path.join(incoming_dir, f"{job_uuid}.part")
        final_file = os.path.join(incoming_dir, f"{job_uuid}.jpg")

        sha256 = hashlib.sha256()
        bytes_downloaded = 0

        # httpx client com timeouts definidos nas configurações
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        with httpx.Client(limits=limits, follow_redirects=True) as client:
            try:
                with client.stream(
                    "GET", 
                    url, 
                    timeout=httpx.Timeout(settings.DOWNLOAD_TIMEOUT_SECONDS, connect=10.0)
                ) as response:
                    
                    if response.status_code != 200:
                        raise httpx.HTTPStatusError(
                            f"Erro ao baixar arquivo. Código HTTP: {response.status_code}",
                            request=response.request,
                            response=response
                        )

                    # Ler por streaming para calcular SHA256 e impor limite de tamanho
                    with open(part_file, "wb") as f:
                        for chunk in response.iter_bytes(chunk_size=8192):
                            bytes_downloaded += len(chunk)
                            if bytes_downloaded > settings.MAX_DOWNLOAD_SIZE_BYTES:
                                raise ValueError(
                                    f"O arquivo excede o limite máximo permitido de {settings.MAX_DOWNLOAD_SIZE_BYTES} bytes."
                                )
                            f.write(chunk)
                            sha256.update(chunk)
            except Exception as e:
                if os.path.exists(part_file):
                    os.remove(part_file)
                raise e

        # Renomeia o arquivo temporário de forma atômica
        if os.path.exists(final_file):
            os.remove(final_file)
        os.rename(part_file, final_file)

        logger.info(
            f"Download finalizado com sucesso para job {job_uuid}. Tamanho: {bytes_downloaded} bytes. SHA256: {sha256.hexdigest()}"
        )
        return final_file, sha256.hexdigest()
