"""Módulo de compressão e codificação JPEG do mapa de rastreamento."""

import io
import logging
from datetime import datetime, timezone
from PIL import Image
from .models import MapArtifact

logger = logging.getLogger(__name__)


class MapCollageComposer:
    """Valida, redimensiona e codifica a captura do mapa para JPEG abaixo do limite do WhatsApp."""

    def __init__(self, max_jpeg_bytes: int = 2_000_000, initial_quality: int = 85):
        self.max_jpeg_bytes = max_jpeg_bytes
        self.initial_quality = initial_quality

    def _encode_jpeg(self, image: Image.Image, quality: int) -> bytes:
        """Codifica a imagem PIL para bytes JPEG com parâmetros de otimização."""
        buffer = io.BytesIO()
        image.save(
            buffer,
            format="JPEG",
            quality=quality,
            optimize=True,
            progressive=True,  # Carregamento progressivo é ideal para web/celular
            subsampling="4:2:0"
        )
        return buffer.getvalue()

    def compose(self, png_bytes: bytes, progress_m: float) -> MapArtifact:
        """Processa a captura PNG do Selenium e retorna o MapArtifact em JPEG otimizado."""
        # Converter PNG para PIL Image RGB
        image = Image.open(io.BytesIO(png_bytes)).convert("RGB")
        width, height = image.size

        quality = min(95, max(55, self.initial_quality))
        jpeg_bytes = self._encode_jpeg(image, quality)

        # Redução progressiva de qualidade se exceder limite
        while len(jpeg_bytes) > self.max_jpeg_bytes and quality > 60:
            quality -= 5
            jpeg_bytes = self._encode_jpeg(image, quality)
            logger.info(f"Tamanho do JPEG ({len(jpeg_bytes)} bytes) excede limite. Reduzindo qualidade para {quality}")

        # Redução de escala se ainda exceder o limite
        scale = 0.90
        while len(jpeg_bytes) > self.max_jpeg_bytes and image.width > 600:
            new_width = int(image.width * scale)
            new_height = int(image.height * scale)
            logger.info(f"Tamanho do JPEG ({len(jpeg_bytes)} bytes) ainda excede. Reduzindo escala para {new_width}x{new_height}")
            
            resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            jpeg_bytes = self._encode_jpeg(resized, quality)
            image = resized  # Atualiza a imagem para a próxima iteração se necessário

        if len(jpeg_bytes) > self.max_jpeg_bytes:
            raise ValueError(f"Não foi possível comprimir a imagem do mapa abaixo do limite de {self.max_jpeg_bytes} bytes (Tamanho final: {len(jpeg_bytes)} bytes)")

        return MapArtifact(
            jpeg_bytes=jpeg_bytes,
            width=image.width,
            height=image.height,
            progress_m=progress_m,
            captured_at=datetime.now(timezone.utc)
        )
