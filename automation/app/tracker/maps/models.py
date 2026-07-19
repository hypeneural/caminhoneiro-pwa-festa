"""Modelos de dados do módulo de geração de mapas."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class RouteMatch:
    """Resultado do alinhamento (snap) da coordenada GPS com a rota."""
    progress_m: float
    segment_index: int
    snapped_lat: float
    snapped_lng: float
    distance_to_route_m: float
    confidence: str  # "HIGH", "MEDIUM", "LOW"
    is_off_route: bool


@dataclass(frozen=True)
class MapJob:
    """Trabalho persistido na outbox para geração de mapa de rastreamento."""
    vehicle_id: str
    phone: str
    latitude: float
    longitude: float
    bearing: float
    speed_kmh: float
    battery: Optional[int]
    address: Optional[str]
    updated_at: datetime
    requested_at: datetime
    event_type: str
    progress_m: float
    segment_index: int
    route_version: str
    dedupe_key: Optional[str] = None
    content_key: Optional[str] = None
    caption: Optional[str] = None
    snapped_lat: Optional[float] = None
    snapped_lng: Optional[float] = None
    primary_content_key: Optional[str] = None


@dataclass(frozen=True)
class MapArtifact:
    """Resultado da geração e composição do mapa, pronto para envio."""
    jpeg_bytes: bytes
    width: int
    height: int
    progress_m: float
    captured_at: datetime
