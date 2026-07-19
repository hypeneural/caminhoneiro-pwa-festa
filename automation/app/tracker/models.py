"""Modelos de dados do serviço de rastreamento."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class VehicleSnapshot:
    """Dados de um veículo extraídos do endpoint /public/state."""
    vehicle_id: str
    name: str
    vehicle_type: str  # "main", "truck", "support"
    lat: float
    lng: float
    speed_kmh: float
    bearing: float
    accuracy: Optional[float]
    battery: Optional[int]
    updated_at: datetime  # UTC
    server_time: datetime  # UTC
    stale: bool
    status: str  # "live", "stale", "offline"
    # Preenchido pelo geocoder
    address: Optional[str] = None
    street_name: Optional[str] = None
    city: Optional[str] = None

    @classmethod
    def from_api(cls, vehicle: dict, server_time_str: str) -> "VehicleSnapshot":
        """Cria instância a partir do JSON da API."""
        from dateutil.parser import isoparse
        return cls(
            vehicle_id=vehicle["id"],
            name=vehicle.get("name", "Veículo"),
            vehicle_type=vehicle.get("type", "truck"),
            lat=vehicle["lat"],
            lng=vehicle["lng"],
            speed_kmh=vehicle.get("speedKmh", 0),
            bearing=vehicle.get("bearing", 0),
            accuracy=vehicle.get("accuracy"),
            battery=vehicle.get("battery"),
            updated_at=isoparse(vehicle["updatedAt"]).astimezone(timezone.utc),
            server_time=isoparse(server_time_str).astimezone(timezone.utc),
            stale=vehicle.get("stale", False),
            status=vehicle.get("status", "offline"),
        )


@dataclass
class VehicleState:
    """Estado persistido no SQLite para cada veículo."""
    vehicle_id: str
    current_status: str = "UNKNOWN"  # MOVING, STOPPING, STOPPED, DELAYED, OFFLINE_SERVER, OFFLINE_TRACKER, UNKNOWN
    previous_status: Optional[str] = None
    last_processed_updated_at: Optional[datetime] = None
    last_motion_at: Optional[datetime] = None
    stationary_since: Optional[datetime] = None
    last_observed_lat: Optional[float] = None
    last_observed_lng: Optional[float] = None
    last_location_sent_at: Optional[datetime] = None
    last_location_sent_lat: Optional[float] = None
    last_location_sent_lng: Optional[float] = None
    last_image_attempt_at: Optional[datetime] = None
    last_image_unavailable_at: Optional[datetime] = None
    last_image_unavailable_lat: Optional[float] = None
    last_image_unavailable_lng: Optional[float] = None
    last_image_sent_at: Optional[datetime] = None
    last_image_sent_lat: Optional[float] = None
    last_image_sent_lng: Optional[float] = None
    last_image_street: Optional[str] = None
    last_alert_key: Optional[str] = None
    last_message_id: Optional[str] = None
    message_sequence: int = 0
    last_map_attempt_at: Optional[datetime] = None
    last_map_sent_at: Optional[datetime] = None
    last_map_sent_lat: Optional[float] = None
    last_map_sent_lng: Optional[float] = None
    last_map_sent_progress_m: Optional[float] = None
    last_route_progress_m: Optional[float] = None
    last_route_segment_index: Optional[int] = None


@dataclass
class MovementResult:
    """Resultado da detecção de movimento."""
    is_moving: bool
    distance_from_previous_m: float
    speed_kmh: float
