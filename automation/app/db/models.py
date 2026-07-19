from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, Boolean, DECIMAL, Enum, JSON, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from app.db.engine import Base

class FotoIngestJob(Base):
    __tablename__ = "foto_ingest_jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    zapi_instance_id = Column(String(64), nullable=False)
    zapi_message_id = Column(String(128), nullable=False)
    sender_phone = Column(String(32), nullable=True)
    sender_lid = Column(String(128), nullable=True)
    connected_phone = Column(String(32), nullable=True)
    media_url = Column(Text, nullable=False)
    media_mime_reported = Column(String(100), nullable=True)
    caption = Column(Text, nullable=True)
    source_width = Column(Integer, nullable=True)
    source_height = Column(Integer, nullable=True)
    is_view_once = Column(Boolean, nullable=False, default=False)
    status = Column(String(30), nullable=False, default="queued")
    attempt_count = Column(Integer, nullable=False, default=0)
    next_attempt_at = Column(DateTime, nullable=True)
    locked_at = Column(DateTime, nullable=True)
    locked_by = Column(String(100), nullable=True)
    foto_id = Column(BigInteger, nullable=True)
    content_sha256 = Column(String(64), nullable=True)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    raw_payload = Column(JSON, nullable=True)
    received_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))


class FotoGaleria(Base):
    __tablename__ = "foto_galeria"

    id_foto = Column(BigInteger, primary_key=True, autoincrement=True)
    id_fotografo = Column(Integer, nullable=True, default=1)
    id_grupo_whatsapp = Column(Integer, nullable=True, default=12) # padrão geral
    url_imagem_original_zapi = Column(String(1024), nullable=True)
    url_imagem_processada = Column(String(1024), nullable=True)
    url_thumbnail = Column(String(1024), nullable=True)
    largura_px = Column(Integer, nullable=True)
    altura_px = Column(Integer, nullable=True)
    orientation = Column(Enum("portrait", "landscape"), nullable=True)
    aspect_ratio = Column(DECIMAL(6, 4), nullable=True)
    dominant_color = Column(String(7), nullable=True)
    blur_hash = Column(String(128), nullable=True)
    mime_type = Column(String(50), nullable=True)
    data_envio_msg = Column(DateTime, nullable=False)
    descricao_foto = Column(Text, nullable=True)
    aprovada = Column(Boolean, nullable=True, default=True)
    destaque = Column(Boolean, nullable=True, default=False)
    visualizacoes = Column(Integer, nullable=True, default=0)
    zapi_message_id = Column(String(100), nullable=False, unique=True)
    status = Column(String(30), nullable=False, default="published")
    uuid = Column(String(36), nullable=True)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))

    variants = relationship("FotoVariante", back_populates="foto", cascade="all, delete-orphan")


class FotoVariante(Base):
    __tablename__ = "foto_variantes"

    id_variant = Column(BigInteger, primary_key=True, autoincrement=True)
    id_foto = Column(BigInteger, ForeignKey("foto_galeria.id_foto"), nullable=False)
    variant = Column(Enum("thumbnail", "preview", "full_1x", "full_2x"), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    color_depth = Column(Integer, nullable=True, default=8)
    url_avif = Column(String(1024), nullable=True)
    url_webp = Column(String(1024), nullable=False)
    url_jpg = Column(String(1024), nullable=False)
    placeholder = Column(Text, nullable=True) # Mini Base64 LQIP
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    foto = relationship("FotoGaleria", back_populates="variants")
