import os
import logging
from PIL import Image, ImageOps
from app.config import settings

logger = logging.getLogger(__name__)

class ImageProcessor:
    @staticmethod
    def get_dominant_color(img: Image.Image) -> str:
        """
        Calcula a cor dominante da imagem redimensionando para 1x1 pixel.
        Retorna o código hexadecimal da cor (ex: #2f3336).
        """
        # Redimensiona para 1x1
        tiny_img = img.resize((1, 1), resample=Image.Resampling.BILINEAR)
        pixel = tiny_img.getpixel((0, 0))
        
        # Garante o formato RGB
        if isinstance(pixel, int):
            r = g = b = pixel
        elif len(pixel) >= 3:
            r, g, b = pixel[:3]
        else:
            r = g = b = 0
            
        return f"#{r:02x}{g:02x}{b:02x}"

    @staticmethod
    def process_image(file_path: str, job_uuid: str) -> dict:
        """
        Processa a imagem original, corrige a rotação de acordo com metadados EXIF,
        calcula metadados, e cria as 4 variantes de tamanho em WebP e JPG.
        Retorna dicionário contendo os metadados do processamento e caminhos de saída.
        """
        # Abre e valida a imagem
        try:
            img = Image.open(file_path)
            img.verify() # Verifica integridade básica
            img = Image.open(file_path) # Reabre para ler os pixels
        except Exception as e:
            raise ValueError(f"O arquivo fornecido não é uma imagem válida ou está corrompido: {e}")

        # Proteção contra Decompression Bomb (Pillow tem proteção nativa, mas limitamos ainda mais se necessário)
        # Ex: se img.width * img.height > 89478485

        # Transposição EXIF para rotacionar corretamente a imagem tirada em celular vertical/invertido
        img = ImageOps.exif_transpose(img)

        # Garante conversão para RGB
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        orig_w, orig_h = img.size
        aspect_ratio = orig_w / orig_h
        orientation = "landscape" if aspect_ratio >= 1.0 else "portrait"
        dominant_color = ImageProcessor.get_dominant_color(img)

        # Pasta de variantes local
        variants_dir = os.path.join(settings.SPOOL_DIR, "variants", job_uuid)
        os.makedirs(variants_dir, exist_ok=True)

        # Definição das variantes (tipo -> largura_alvo)
        resolutions = {
            "thumbnail": 400,
            "preview": 800,
            "full_1x": 1280,
            "full_2x": 1600
        }

        variant_results = {}

        for variant_type, target_w in resolutions.items():
            # Não faz upscale (se a imagem original for menor que o alvo, mantém dimensões originais)
            if orig_w <= target_w:
                w = orig_w
                h = orig_h
            else:
                w = target_w
                h = int(target_w / aspect_ratio)

            # Redimensionamento de alta qualidade com Lanczos
            resized_img = img.resize((w, h), resample=Image.Resampling.LANCZOS)

            # Caminhos locais para salvar
            webp_path = os.path.join(variants_dir, f"{variant_type}.webp")
            jpg_path = os.path.join(variants_dir, f"{variant_type}.jpg")

            # Salva variante em WebP
            resized_img.save(
                webp_path,
                format="WEBP",
                quality=80,
                method=4
            )

            # Salva variante em JPG (Progressivo e Otimizado)
            resized_img.save(
                jpg_path,
                format="JPEG",
                quality=84,
                optimize=True,
                progressive=True
            )

            variant_results[variant_type] = {
                "w": w,
                "h": h,
                "size_webp": os.path.getsize(webp_path),
                "size_jpg": os.path.getsize(jpg_path),
                "local_webp_path": webp_path,
                "local_jpg_path": jpg_path
            }

        return {
            "width": orig_w,
            "height": orig_h,
            "aspect_ratio": aspect_ratio,
            "orientation": orientation,
            "dominant_color": dominant_color,
            "mime_type": "image/webp",
            "variants": variant_results
        }
