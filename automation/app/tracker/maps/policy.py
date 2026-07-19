"""Módulo de política de envio de imagens de mapa (regras de elegibilidade e cooldowns)."""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.tracker.models import VehicleSnapshot, VehicleState
from .models import RouteMatch

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MapDecision:
    """Resultado legível e estruturado sobre a elegibilidade de envio do mapa."""
    eligible: bool
    reason: str
    progress_delta_m: Optional[float] = None


class MapSendPolicy:
    """Encapsula as regras de envio do mapa para evitar spam e garantir relevância visual."""

    def __init__(
        self,
        enabled: bool = True,
        min_interval_minutes: int = 15,
        max_interval_minutes: int = 45,
        min_progress_meters: float = 400.0,
        max_accuracy_meters: float = 75.0,
        max_fix_age_seconds: float = 120.0,
        transition_cooldown_minutes: int = 5,
    ):
        self.enabled = enabled
        self.min_interval = timedelta(minutes=min_interval_minutes)
        self.max_interval = timedelta(minutes=max_interval_minutes)
        self.min_progress = min_progress_meters
        self.max_accuracy = max_accuracy_meters
        self.max_fix_age = timedelta(seconds=max_fix_age_seconds)
        self.transition_cooldown = timedelta(minutes=transition_cooldown_minutes)

    def check_eligibility(
        self,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        route_match: RouteMatch,
        now: datetime,
    ) -> MapDecision:
        """Determina se é o momento ideal para gerar e enviar um mapa da rota."""
        if not self.enabled:
            return MapDecision(eligible=False, reason="map_disabled")

        # 1. Validações Básicas de GPS e Rota
        if snapshot.lat == 0.0 or snapshot.lng == 0.0:
            return MapDecision(eligible=False, reason="invalid_coordinates")

        # Verificar precisão do GPS
        if snapshot.accuracy is not None and snapshot.accuracy > self.max_accuracy:
            return MapDecision(eligible=False, reason=f"gps_accuracy_poor:{snapshot.accuracy:.1f}m")

        # Verificar idade do sinal GPS
        fix_age = now - snapshot.updated_at
        if fix_age > self.max_fix_age:
            return MapDecision(eligible=False, reason=f"gps_fix_stale:{fix_age.total_seconds():.0f}s")

        # Ignorar se o veículo estiver fora da rota
        if route_match.is_off_route:
            return MapDecision(eligible=False, reason="vehicle_off_route")

        # 2. Concorrência: Evitar disparos duplicados se já houver tentativa recente em andamento
        if state.last_map_attempt_at is not None:
            time_since_attempt = now - state.last_map_attempt_at
            if time_since_attempt < timedelta(minutes=3):
                return MapDecision(eligible=False, reason="map_attempt_in_progress")

        # 3. Primeiro Envio
        if state.last_map_sent_at is None or state.last_map_sent_progress_m is None:
            return MapDecision(eligible=True, reason="first_map_send", progress_delta_m=route_match.progress_m)

        # 4. Cálculo de Intervalos e Deslocamento desde o último envio
        time_since_last_send = now - state.last_map_sent_at
        progress_delta = route_match.progress_m - state.last_map_sent_progress_m

        # 5. Tratamento de transições importantes ( stopped / resumed )
        status_changed = state.current_status != state.previous_status
        is_stopped_transition = state.current_status == "STOPPED" and status_changed
        is_resumed_transition = state.current_status == "MOVING" and state.previous_status == "STOPPED"

        if is_stopped_transition or is_resumed_transition:
            # Transições importantes têm cooldown menor (ex: 5 minutos)
            if time_since_last_send >= self.transition_cooldown:
                # Evitar mandar outro mapa se a distância percorrida for irrelevante
                if abs(progress_delta) >= 50.0:
                    return MapDecision(
                        eligible=True,
                        reason=f"transition_state_{state.current_status.lower()}",
                        progress_delta_m=progress_delta
                    )
                else:
                    return MapDecision(eligible=False, reason="transition_distance_too_small")
            else:
                return MapDecision(eligible=False, reason="transition_cooldown_active")

        # 6. Regras de deslocamento normal em trânsito (MOVING)
        # Regra AND: Tempo mínimo de intervalo atingido E progresso mínimo alcançado
        if time_since_last_send >= self.min_interval and progress_delta >= self.min_progress:
            return MapDecision(
                eligible=True,
                reason="interval_and_progress_met",
                progress_delta_m=progress_delta
            )

        # Regra Safety Timeout: Tempo máximo decorrido com algum progresso básico
        if time_since_last_send >= self.max_interval and progress_delta >= 50.0:
            return MapDecision(
                eligible=True,
                reason="safety_timeout_met",
                progress_delta_m=progress_delta
            )

        # Caso contrário, não qualifica
        return MapDecision(
            eligible=False,
            reason="policy_not_met",
            progress_delta_m=progress_delta
        )


class VisualContentPolicy:
    """Implementa a decisão de qual mídia principal (mapa, panorama, texto) deve ser enviada por ciclo."""

    @staticmethod
    def select_best_media(
        map_eligible: bool,
        panorama_eligible: bool,
        is_important_event: bool = False
    ) -> str:
        """
        Retorna a melhor mídia principal a enviar: 'map', 'panorama' ou 'text'.
        Prioridade: map (novo marco de rota) > panorama (detalhes locais) > texto.
        """
        if map_eligible:
            return "map"
        if panorama_eligible:
            return "panorama"
        return "text"
