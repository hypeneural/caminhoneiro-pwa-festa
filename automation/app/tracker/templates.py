"""Templates de mensagens WhatsApp para o serviço de rastreamento."""

import math
from datetime import datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from .location_format import clean_location_text, display_address

LOCAL_TIMEZONE = ZoneInfo("America/Sao_Paulo")


def format_datetime(value: datetime) -> str:
    """Formata datetime para exibição no fuso de Brasília."""
    local = value.astimezone(LOCAL_TIMEZONE)
    return local.strftime("%d/%m/%Y às %H:%M:%S")


def human_duration(duration: timedelta) -> str:
    """Converte timedelta para texto legível em português."""
    total_minutes = max(0, int(duration.total_seconds() // 60))

    if total_minutes < 1:
        return "menos de 1 minuto"

    if total_minutes < 60:
        return f"{total_minutes} minutos"

    hours, minutes = divmod(total_minutes, 60)

    if minutes == 0:
        return f"{hours} hora" if hours == 1 else f"{hours} horas"

    hour_text = "hora" if hours == 1 else "horas"
    return f"{hours} {hour_text} e {minutes} minutos"


MESSAGE_TEMPLATES = {
    "moving": [
        (
            "⚡ *{vehicle_name} em Movimento* ⚡\n\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Localização Atual:* _{street_or_address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
        (
            "🛣️ *Procissão em Deslocamento* 🛣️\n\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Passando por:* _{street_or_address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
        (
            "📍 *Nova Posição da Procissão* 📍\n\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Local:* _{street_or_address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
    ],
    "stopped": [
        (
            "🅿️ *{vehicle_name} Parado* 🅿️\n\n"
            "▫️ Tempo sem movimento: *{stopped_duration}*\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Parado em:* _{address}_\n"
            "🕒 *Última leitura GPS:* {updated_at}"
        ),
        (
            "⏸️ *Procissão Temporariamente Parada* ⏸️\n\n"
            "▫️ Tempo aproximado parado: *{stopped_duration}*\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Localização:* _{address}_\n"
            "🕒 *Última leitura GPS:* {updated_at}"
        ),
    ],
    "resumed": [
        (
            "▶️ *Movimento Retomado* ▶️\n\n"
            "▫️ Permaneceu parado por: _{stopped_duration}_\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Em trânsito por:* _{street_or_address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
        (
            "🚗 *Deslocamento Retomado* 🚗\n\n"
            "▫️ Tempo que ficou parado: _{stopped_duration}_\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Saindo de:* _{address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
    ],
    "offline_server": [
        (
            "⚠️ *ALERTA: Servidor Offline* ⚠️\n\n"
            "▫️ Sem resposta do servidor há: *{update_age}*\n"
            "🕒 *Última atualização registrada:* {server_time}\n\n"
            "_Os envios de rastreamento automático foram temporariamente suspensos._"
        ),
    ],
    "offline_tracker": [
        (
            "⚠️ *ALERTA: Rastreador Offline* ⚠️\n\n"
            "▫️ Sem sinal do veículo há: *{update_age}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Último local conhecido:* _{address}_\n"
            "🕒 *Último sinal recebido:* {updated_at}\n\n"
            "_Aguardando recuperação do sinal GPS do veículo para retomar o envio._"
        ),
    ],
    "recovered_moving": [
        (
            "✅ *Rastreamento Restaurado* ✅\n\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Posição atual:* _{street_or_address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
    ],
    "recovered_stopped": [
        (
            "✅ *Rastreamento Restaurado* ✅\n\n"
            "{speed_emoji} *{speed_label}:* *{speed_display}*\n"
            "{battery_emoji} *{battery_label}:* *{battery_display}*\n"
            "📍 *Localização:* _{address}_\n"
            "🕒 *Atualizado em:* {updated_at}"
        ),
    ],
}


def _optional_number(value) -> Optional[float]:
    if value is None or isinstance(value, bool):
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(numeric):
        return None
    return numeric


def _battery_status(value) -> dict[str, object]:
    numeric = _optional_number(value)
    if numeric is None or not 0 <= numeric <= 100:
        return {
            "battery": None,
            "battery_emoji": "🔋",
            "battery_label": "Bateria",
            "battery_display": "Não informada",
        }

    battery = round(numeric)
    is_low = numeric < 20
    return {
        "battery": battery,
        "battery_emoji": "🪫" if is_low else "🔋",
        "battery_label": "Bateria fraca" if is_low else "Bateria",
        "battery_display": f"{battery}%",
    }


def _speed_status(value) -> dict[str, object]:
    numeric = _optional_number(value)
    if numeric is None:
        return {
            "speed_kmh": None,
            "speed_emoji": "🚗",
            "speed_label": "Velocidade",
            "speed_display": "Não informada",
        }

    speed = max(0, round(numeric))
    if speed == 0:
        emoji, label = "🛑", "Parado"
    elif speed < 10:
        emoji, label = "🐢", "Marcha lenta"
    else:
        emoji, label = "🚗", "Em deslocamento"

    return {
        "speed_kmh": speed,
        "speed_emoji": emoji,
        "speed_label": label,
        "speed_display": f"{speed} km/h",
    }


def build_message_context(
    snapshot,
    state,
    now: datetime,
    stopped_duration: Optional[timedelta] = None,
) -> dict:
    """Constrói o contexto unificado para renderização de templates."""
    speed_status = _speed_status(snapshot.speed_kmh)
    battery_status = _battery_status(snapshot.battery)
    address = display_address(
        snapshot.address,
        getattr(snapshot, "lat", None),
        getattr(snapshot, "lng", None),
    )
    return {
        "vehicle_name": snapshot.name or "Procissão de São Cristóvão",
        "address": address,
        "street_or_address": (
            clean_location_text(snapshot.street_name)
            or address
        ),
        "updated_at": format_datetime(snapshot.updated_at),
        "server_time": format_datetime(snapshot.server_time),
        "update_age": human_duration(now - snapshot.updated_at),
        "stopped_duration": human_duration(
            stopped_duration or timedelta()
        ),
        **speed_status,
        **battery_status,
    }


def render_message(
    message_type: str,
    context: dict,
    sequence: int = 0,
) -> str:
    """Renderiza uma mensagem a partir do template e contexto.

    Usa rotação determinística baseada no sequence para variar as mensagens.
    """
    templates = MESSAGE_TEMPLATES.get(message_type, [])
    if not templates:
        return f"[Tipo de mensagem desconhecido: {message_type}]"

    template = templates[sequence % len(templates)]
    rendered = template.format_map(context)

    # Rodapé obrigatório com a rota em tempo real
    footer = "\n\nEm tempo real: https://festadoscaminhoneiros.com.br/rota-completa"
    return rendered + footer


def build_location_title(
    event_type: str,
    snapshot,
    state,
) -> str:
    """Constrói o título para o cartão de localização no WhatsApp."""
    speed_display = _speed_status(snapshot.speed_kmh)["speed_display"]

    titles = {
        "moving": f"🚗 Em movimento • {speed_display}",
        "resumed": f"▶️ Retomou o movimento • {speed_display}",
        "recovered_moving": f"✅ Rastreamento recuperado • {speed_display}",
        "stopped": "🅿️ Veículo parado",
        "recovered_stopped": "✅ Rastreamento recuperado (parado)",
    }

    return titles.get(
        event_type,
        f"📍 Posição atual • {speed_display}",
    )
