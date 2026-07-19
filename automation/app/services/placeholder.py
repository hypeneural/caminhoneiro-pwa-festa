import io
import base64
from PIL import Image

class PlaceholderGenerator:
    @staticmethod
    def generate_lqip_base64(file_path: str, max_size: int = 32) -> str:
        """
        Gera uma miniatura Base64 (LQIP - Low Quality Image Placeholder) a partir da imagem original.
        A miniatura tem tamanho máximo (largura/altura) de 32px e baixa qualidade (quality=20).
        """
        img = Image.open(file_path)
        
        # Corrige rotação se houver metadados EXIF
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
        
        # Garante modo RGB
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        w, h = img.size
        # Calcula nova dimensão preservando aspect ratio
        if w > h:
            new_w = max_size
            new_h = int(max_size * (h / w))
        else:
            new_h = max_size
            new_w = int(max_size * (w / h))
            
        # Redimensiona para miniatura usando redimensionador bilinear mais rápido
        mini_img = img.resize((new_w, new_h), resample=Image.Resampling.BILINEAR)
        
        # Salva em buffer na memória como JPEG com qualidade muito baixa (quality=20)
        buffer = io.BytesIO()
        mini_img.save(buffer, format="JPEG", quality=20, optimize=True)
        
        # Codifica em Base64
        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return f"data:image/jpeg;base64,{base64_data}"
