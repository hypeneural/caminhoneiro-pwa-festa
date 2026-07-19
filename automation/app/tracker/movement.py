"""Detecção de movimento com histerese para rastreamento veicular."""

import math
import logging
from .models import VehicleSnapshot, VehicleState, MovementResult

logger = logging.getLogger(__name__)

# === Constantes de detecção de movimento ===
MOVING_SPEED_MIN_KMH = 3       # Velocidade mínima para considerar movimento
STOP_SPEED_MAX_KMH = 1          # Velocidade máxima para considerar parada
GPS_JITTER_RADIUS_M = 30        # Raio de jitter GPS (metros)
STOP_CONFIRM_MINUTES = 3        # Minutos para confirmar parada

# === Constantes de envio ===
LOCATION_INTERVAL_MINUTES = 10  # Intervalo mínimo entre envios de localização
LOCATION_MIN_DISTANCE_M = 100   # Distância mínima para enviar localização
IMAGE_INTERVAL_MINUTES = 15     # Intervalo mínimo entre envios de imagem
IMAGE_MIN_DISTANCE_M = 250      # Distância mínima para enviar imagem

# === Constantes de status de conexão ===
DELAYED_AFTER_MINUTES = 5       # Minutos para considerar atrasado
OFFLINE_AFTER_MINUTES = 30      # Minutos para considerar offline


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calcula a distância em metros entre dois pontos usando a fórmula de Haversine.
    """
    R = 6_371_000  # Raio da Terra em metros

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    a = min(1.0, max(0.0, a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def detect_movement(snapshot: VehicleSnapshot, state: VehicleState) -> MovementResult:
    """
    Detecta movimento com histerese de velocidade e tolerância à precisão GPS.

    - >= 3 km/h confirma movimento;
    - entre 1 e 3 km/h mantém MOVING, mas não inicia movimento sozinho;
    - deslocamento só confirma movimento quando supera jitter + precisão atual.
    """
    try:
        speed = float(snapshot.speed_kmh)
    except (TypeError, ValueError):
        speed = 0.0
    if not math.isfinite(speed) or speed < 0:
        speed = 0.0

    try:
        accuracy = (
            float(snapshot.accuracy)
            if snapshot.accuracy is not None
            else 0.0
        )
    except (TypeError, ValueError):
        accuracy = 0.0
    if not math.isfinite(accuracy) or accuracy <= 0:
        accuracy = 0.0

    if (
        state.last_observed_lat is not None
        and state.last_observed_lng is not None
    ):
        distance = haversine_m(
            state.last_observed_lat,
            state.last_observed_lng,
            snapshot.lat,
            snapshot.lng,
        )
    else:
        distance = 0.0

    distance_threshold = max(
        40.0,
        GPS_JITTER_RADIUS_M + accuracy,
    )
    moved_beyond_uncertainty = distance >= distance_threshold

    if speed >= MOVING_SPEED_MIN_KMH:
        is_moving = True
    elif (
        speed > STOP_SPEED_MAX_KMH
        and state.current_status == "MOVING"
    ):
        # Zona intermediária: não oscila para parada por uma leitura isolada.
        is_moving = True
    else:
        is_moving = moved_beyond_uncertainty

    return MovementResult(
        is_moving=is_moving,
        distance_from_previous_m=distance,
        speed_kmh=speed,
    )
