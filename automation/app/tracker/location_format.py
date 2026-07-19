"""Formata endereços e fallbacks de localização de modo consistente."""

from __future__ import annotations

import math
import re
import unicodedata
from typing import Optional

_UNKNOWN_LOCATION_LABELS = {
    "endereco nao identificado",
    "endereco desconhecido",
    "local nao identificado",
    "local desconhecido",
    "nao identificado",
    "unknown address",
    "unknown location",
}


def _comparison_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(
        character
        for character in normalized
        if not unicodedata.combining(character)
    )
    return re.sub(r"\s+", " ", normalized).casefold().strip()


def clean_location_text(value: object) -> Optional[str]:
    """Retorna texto utilizável ou ``None`` para rótulos genéricos."""

    if not isinstance(value, str):
        return None
    cleaned = re.sub(r"\s+", " ", value).strip(" ,;-\t\r\n")
    if not cleaned or _comparison_key(cleaned) in _UNKNOWN_LOCATION_LABELS:
        return None
    return cleaned


def coordinate_fallback(latitude: object, longitude: object) -> str:
    """Produz um fallback informativo sem inventar rua ou bairro."""

    try:
        lat = float(latitude)
        lng = float(longitude)
    except (TypeError, ValueError):
        return "Posição disponível no mapa"
    if (
        not math.isfinite(lat)
        or not math.isfinite(lng)
        or not -90 <= lat <= 90
        or not -180 <= lng <= 180
        or (lat == 0 and lng == 0)
    ):
        return "Posição disponível no mapa"
    return f"Coordenadas GPS: {lat:.6f}, {lng:.6f}"


def display_address(
    value: object,
    latitude: object,
    longitude: object,
) -> str:
    """Mantém um endereço válido ou usa coordenadas verificáveis."""

    return clean_location_text(value) or coordinate_fallback(latitude, longitude)
