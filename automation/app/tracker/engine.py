"""Motor principal da máquina de estados do rastreamento."""

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Any

from .models import VehicleSnapshot, VehicleState
from .movement import (
    detect_movement,
    haversine_m,
    LOCATION_INTERVAL_MINUTES,
    LOCATION_MIN_DISTANCE_M,
    IMAGE_INTERVAL_MINUTES,
    IMAGE_MIN_DISTANCE_M,
    DELAYED_AFTER_MINUTES,
    OFFLINE_AFTER_MINUTES,
    STOP_CONFIRM_MINUTES,
)
from .templates import (
    build_message_context,
    render_message,
    build_location_title,
    format_datetime,
)
from .geocoder import normalize, ReverseGeocoder
from .location_format import display_address
from .zapi_client import ZAPIClient
from .tracker_db import TrackerDB
from .panorama import (
    PanoramaDispatcher,
    PanoramaJob,
    build_combined_panorama_caption,
)
from app.tracker.maps.dispatcher import MapDispatcher
from app.tracker.maps.policy import MapSendPolicy, VisualContentPolicy
from app.tracker.maps.route_matcher import RouteProgressService

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PanoramaDecision:
    """Resultado observável das regras de envio de panorama."""

    eligible: bool

    reason: str
    distance_m: Optional[float] = None

@dataclass(frozen=True)
class PreparedAlert:
    """Conteúdo imutável compartilhado por legenda e fallback textual."""

    message: str
    anchor: str
    text_dedupe_key: str
    content_key: str


def _valid_coordinates(latitude: float, longitude: float) -> bool:
    return (
        not isinstance(latitude, bool)
        and not isinstance(longitude, bool)
        and isinstance(latitude, (int, float))
        and isinstance(longitude, (int, float))
        and math.isfinite(latitude)
        and math.isfinite(longitude)
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
        and not (latitude == 0 and longitude == 0)
    )


def _valid_accuracy(value, *, maximum: float) -> bool:
    if value is None:
        return True
    if isinstance(value, bool):
        return False
    try:
        accuracy = float(value)
    except (TypeError, ValueError):
        return False
    return (
        math.isfinite(accuracy)
        and accuracy > 0
        and accuracy <= maximum
    )


class TrackerEngine:
    """Orquestra o fluxo completo da máquina de estados do rastreamento."""

    _SYSTEM_ALERT_EVENTS = frozenset({"offline_tracker"})

    def __init__(
        self,
        zapi: ZAPIClient,
        db: TrackerDB,
        geocoder: ReverseGeocoder,
        phone: str,
        system_alert_phone: Optional[str] = None,
        panorama_dispatcher: Optional[PanoramaDispatcher] = None,
        map_dispatcher: Optional[MapDispatcher] = None,
        map_policy: Optional[MapSendPolicy] = None,
        route_progress_service: Optional[RouteProgressService] = None,
        notification_dispatcher=None,
        geocode_dispatcher=None,
        image_retry_cooldown_minutes: int = 5,
        image_no_imagery_cooldown_minutes: int = 360,
        image_no_imagery_retry_distance_m: int = 500,
        image_street_change_min_distance_m: int = 60,
        location_max_accuracy_m: float = 100,
        panorama_max_fix_age_seconds: int = 120,
        panorama_future_tolerance_seconds: int = 30,
        panorama_max_accuracy_m: float = 75,
        combined_message_enabled: bool = True,
        panorama_caption_max_chars: int = 900,
        completion_separator_count: int = 3,
    ):
        self.zapi = zapi
        self.db = db
        self.geocoder = geocoder
        self.phone = phone
        self.system_alert_phone = (
            str(system_alert_phone or "").strip() or self.phone
        )
        self.panorama_dispatcher = panorama_dispatcher
        self.map_dispatcher = map_dispatcher
        self.map_policy = map_policy
        self.route_progress_service = route_progress_service
        self.notification_dispatcher = notification_dispatcher
        self.geocode_dispatcher = geocode_dispatcher
        self.image_retry_cooldown_minutes = max(
            1,
            image_retry_cooldown_minutes,
        )
        self.image_no_imagery_cooldown_minutes = max(
            1,
            image_no_imagery_cooldown_minutes,
        )
        self.image_no_imagery_retry_distance_m = max(
            0,
            image_no_imagery_retry_distance_m,
        )
        self.image_street_change_min_distance_m = max(
            0,
            image_street_change_min_distance_m,
        )
        self.location_max_accuracy_m = max(
            1.0,
            float(location_max_accuracy_m),
        )
        self.panorama_max_fix_age_seconds = max(
            1,
            panorama_max_fix_age_seconds,
        )
        self.panorama_future_tolerance_seconds = max(
            0,
            panorama_future_tolerance_seconds,
        )
        self.panorama_max_accuracy_m = max(
            1.0,
            float(panorama_max_accuracy_m),
        )

        self.combined_message_enabled = bool(combined_message_enabled)
        self.panorama_caption_max_chars = max(
            200,
            int(panorama_caption_max_chars),
        )
        if isinstance(completion_separator_count, bool):
            raise ValueError("completion_separator_count invalido")
        if not 0 <= int(completion_separator_count) <= 10:
            raise ValueError("completion_separator_count deve estar entre 0 e 10")
        self.completion_separator_count = int(completion_separator_count)

    def _recipient_for_event(self, event_type: str) -> str:
        """Separa alertas operacionais sem alterar o destino do rastreamento."""

        if (
            event_type in self._SYSTEM_ALERT_EVENTS
            or event_type.startswith("recovered_")
        ):
            return self.system_alert_phone
        return self.phone

    def _enrich_snapshot(self, snapshot: VehicleSnapshot) -> None:
        """Enriquece o snapshot com dados de geocodificação."""
        if self.geocode_dispatcher is not None:
            try:
                self.geocode_dispatcher.enrich(snapshot)
            except Exception as exc:
                logger.warning(
                    "Geocodificação assíncrona falhou (%s)",
                    type(exc).__name__,
                )
            snapshot.address = display_address(
                snapshot.address,
                snapshot.lat,
                snapshot.lng,
            )
            return

        try:
            geo = self.geocoder.reverse_geocode(snapshot.lat, snapshot.lng)
            snapshot.address = display_address(
                geo.get("address"),
                snapshot.lat,
                snapshot.lng,
            )
            snapshot.street_name = geo.get("street_name")
            snapshot.city = geo.get("city")
        except Exception as exc:
            logger.warning(
                "Geocodificação falhou (%s)",
                type(exc).__name__,
            )
            snapshot.address = display_address(
                snapshot.address,
                snapshot.lat,
                snapshot.lng,
            )

    def _notification_accepted(
        self,
        *,
        inserted: bool,
        channel: str,
        dedupe_key: str,
        content_key: Optional[str] = None,
    ) -> bool:
        """Trata um item já existente como aceito após reinício."""
        if inserted:
            return True

        if content_key:
            content_getter = getattr(
                self.db,
                "get_notification_by_content_key",
                None,
            )
            if callable(content_getter):
                try:
                    if content_getter(content_key) is not None:
                        return True
                except Exception as exc:
                    logger.warning(
                        "Falha ao consultar conteúdo lógico (%s)",
                        type(exc).__name__,
                    )
        getter = getattr(self.db, "get_notification", None)
        if not callable(getter):
            return False
        try:
            return (
                getter(channel=channel, dedupe_key=dedupe_key)
                is not None
            )
        except Exception as exc:
            logger.warning(
                "Falha ao consultar deduplicação (%s)",
                type(exc).__name__,
            )
            return False

    def _prepare_alert(
        self,
        message_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        stopped_duration: Optional[timedelta] = None,
        alert_key: Optional[str] = None,
    ) -> PreparedAlert:
        """Renderiza uma única vez o conteúdo usado nas duas alternativas."""

        context = build_message_context(snapshot, state, now, stopped_duration)
        message = render_message(message_type, context, state.message_sequence)
        anchor = alert_key or f"{message_type}:{snapshot.updated_at.isoformat()}"
        content_key = f"{snapshot.vehicle_id}:{anchor}:content"
        return PreparedAlert(
            message=message,
            anchor=anchor,
            text_dedupe_key=f"{snapshot.vehicle_id}:{anchor}:text",
            content_key=content_key,
        )

    @staticmethod
    def _mark_alert_accepted(state: VehicleState, alert_key: Optional[str]) -> None:
        state.message_sequence += 1
        if alert_key:
            state.last_alert_key = alert_key

    def _send_text_alert(
        self,
        message_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        stopped_duration: Optional[timedelta] = None,
        alert_key: Optional[str] = None,
        prepared: Optional[PreparedAlert] = None,
        location_dedupe_key: Optional[str] = None,
        completion_separator_count: Optional[int] = None,
    ) -> bool:
        """Enfileira texto com deduplicação; não espera pela Z-API."""
        if alert_key and alert_key == state.last_alert_key:
            logger.debug("Alerta de texto já aceito: %s", alert_key)
            return True

        if prepared is None:
            prepared = self._prepare_alert(
                message_type,
                snapshot,
                state,
                now,
                stopped_duration,
                alert_key,
            )
        message = prepared.message
        dedupe_key = prepared.text_dedupe_key
        recipient = self._recipient_for_event(message_type)
        separator_count = (
            self.completion_separator_count
            if completion_separator_count is None
            else int(completion_separator_count)
        )

        dispatcher = self.notification_dispatcher
        if dispatcher is not None:
            accepted = dispatcher.try_submit_text(
                vehicle_id=snapshot.vehicle_id,
                dedupe_key=dedupe_key,
                phone=recipient,
                message=message,
                created_at=now,
                content_key=prepared.content_key,
                completion_separator_count=separator_count,
                completion_wait_channel=(
                    "location" if location_dedupe_key else None
                ),
                completion_wait_dedupe_key=location_dedupe_key,
            )
            accepted = self._notification_accepted(
                inserted=accepted,
                channel="text",
                dedupe_key=dedupe_key,
                content_key=prepared.content_key,
            )
            if accepted:
                self._mark_alert_accepted(state, alert_key)
                logger.info("Alerta '%s' enfileirado", message_type)
            return accepted

        result = self.zapi.send_text(recipient, message)
        if not result:
            return False

        state.last_message_id = result.get("messageId")
        self._mark_alert_accepted(state, alert_key)
        logger.info("Alerta '%s' enviado", message_type)
        return True

    def _send_location_update(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        dedupe_anchor: Optional[str] = None,
    ) -> bool:
        """Enfileira localização; o worker deste canal faz o envio."""
        if not _valid_coordinates(snapshot.lat, snapshot.lng):
            logger.warning(
                "Localização descartada: coordenadas inválidas para %s",
                snapshot.vehicle_id,
            )
            return False
        if not _valid_accuracy(
            snapshot.accuracy,
            maximum=self.location_max_accuracy_m,
        ):
            logger.warning(
                "Localização descartada: precisão GPS insuficiente para %s",
                snapshot.vehicle_id,
            )
            return False

        title = build_location_title(event_type, snapshot, state)
        location_label = display_address(
            snapshot.address,
            snapshot.lat,
            snapshot.lng,
        )
        address_line = (
            f"{location_label} — "
            f"Atualizado em {format_datetime(snapshot.updated_at)}"
        )
        anchor = (
            dedupe_anchor
            or f"{event_type}:{snapshot.updated_at.isoformat()}"
        )
        dedupe_key = f"{snapshot.vehicle_id}:{anchor}:location"
        recipient = self._recipient_for_event(event_type)

        dispatcher = self.notification_dispatcher
        if dispatcher is not None:
            accepted = dispatcher.try_submit_location(
                vehicle_id=snapshot.vehicle_id,
                dedupe_key=dedupe_key,
                phone=recipient,
                latitude=snapshot.lat,
                longitude=snapshot.lng,
                title=title,
                address=address_line,
                created_at=now,
            )
            accepted = self._notification_accepted(
                inserted=accepted,
                channel="location",
                dedupe_key=dedupe_key,
            )
            if accepted:
                state.last_location_sent_at = now
                state.last_location_sent_lat = snapshot.lat
                state.last_location_sent_lng = snapshot.lng
                logger.info("Localização '%s' enfileirada", event_type)
            return accepted

        result = self.zapi.send_location(
            recipient,
            snapshot.lat,
            snapshot.lng,
            title,
            address_line,
        )
        if not result:
            return False

        state.last_location_sent_at = now
        state.last_location_sent_lat = snapshot.lat
        state.last_location_sent_lng = snapshot.lng
        state.last_message_id = result.get("messageId")
        logger.info("Localização '%s' enviada", event_type)
        return True

    def _try_submit_combined_content(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        prepared: PreparedAlert,
        alert_key: Optional[str],
        location_dedupe_key: Optional[str],
        completion_separator_count: Optional[int] = None,
    ) -> bool:
        """Persiste uma única alternativa: panorama ou fallback textual."""
        if (
            not self.combined_message_enabled
            or self.notification_dispatcher is None
            or self.panorama_dispatcher is None
        ):
            return False

        decision = self._panorama_decision(
            event_type,
            snapshot,
            state,
            now,
        )
        if not decision.eligible:
            logger.debug(
                "Conteúdo combinado usará texto para %s: %s",
                snapshot.vehicle_id,
                decision.reason,
            )
            return False

        caption = build_combined_panorama_caption(prepared.message)
        if len(caption) > self.panorama_caption_max_chars:
            logger.warning(
                "Legenda combinada excede o teto interno (%d > %d)",
                len(caption),
                self.panorama_caption_max_chars,
            )
            return False

        dispatcher = self.panorama_dispatcher
        separator_count = (
            self.completion_separator_count
            if completion_separator_count is None
            else int(completion_separator_count)
        )
        job = PanoramaJob(
            vehicle_id=snapshot.vehicle_id,
            phone=self._recipient_for_event(event_type),
            latitude=snapshot.lat,
            longitude=snapshot.lng,
            vehicle_name=snapshot.name or "Procissão de São Cristóvão",
            address=display_address(
                snapshot.address,
                snapshot.lat,
                snapshot.lng,
            ),
            street_name=snapshot.street_name,
            speed_kmh=snapshot.speed_kmh,
            battery=snapshot.battery,
            updated_at=snapshot.updated_at,
            requested_at=now,
            event_type=event_type,
            dedupe_key=f"{prepared.content_key}:panorama",
            content_key=prepared.content_key,
            caption=caption,
            fallback_message=prepared.message,
            fallback_dedupe_key=prepared.text_dedupe_key,
            completion_separator_count=separator_count,
            completion_location_dedupe_key=location_dedupe_key,
        )
        inserted = dispatcher.try_submit(job)
        accepted = self._notification_accepted(
            inserted=inserted,
            channel="panorama",
            dedupe_key=job.dedupe_key or "",
            content_key=prepared.content_key,
        )
        if not accepted:
            logger.error(
                "Panorama não persistido para '%s'; usando texto",
                event_type,
            )
            return False

        self._mark_alert_accepted(state, alert_key)
        if inserted:
            state.last_image_attempt_at = now
        logger.info(
            "Conteúdo '%s' persistido como panorama com fallback",
            event_type,
        )
        return True

    def _try_submit_map_content(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        prepared: PreparedAlert,
        alert_key: Optional[str],
        location_dedupe_key: Optional[str],
        route_match: Any,
    ) -> bool:
        """Enfileira o mapa complementar, independente do conteúdo principal."""
        if self.map_dispatcher is None or self.map_policy is None:
            return False

        # Formata legenda bonita para o mapa
        progress_pct = 0.0
        total_len = self.map_dispatcher.route_repo.total_length_m
        if total_len > 0:
            progress_pct = min(100.0, max(0.0, (route_match.progress_m / total_len) * 100.0))

        # Criar a barra de progresso visual no texto [=====>.....]
        bar_len = 15
        filled = min(bar_len, max(0, int((progress_pct / 100.0) * bar_len)))
        if filled < bar_len:
            bar = "=" * filled + ">" + "." * (bar_len - filled - 1)
        else:
            bar = "=" * bar_len

        caption_lines = [
            "🗺️ *Progresso estimado na rota oficial*",
            "",
            f"🚗 Velocidade: *{round(snapshot.speed_kmh)} km/h*",
        ]
        if snapshot.battery is not None:
            caption_lines.append(f"🔋 Bateria: {snapshot.battery}%")
        
        address = display_address(
            snapshot.address,
            snapshot.lat,
            snapshot.lng,
        )
        caption_lines.append(f"📍 {address}")
        caption_lines.append(f"🏁 Progresso estimado na rota oficial: *{progress_pct:.1f}%* `[{bar}]`")
        caption_lines.append(f"🕒 Atualizado em {format_datetime(snapshot.updated_at)}")

        caption = "\n".join(caption_lines)

        # Deduplicação por bucket de progresso (ex: 250m)
        progress_bucket = int(route_match.progress_m // 250)
        route_ver = self.map_dispatcher.route_repo.version
        dedupe_key = f"{snapshot.vehicle_id}:{route_ver}:{progress_bucket}:{event_type}:map"
        map_content_key = f"{prepared.content_key}:map"
        map_fallback_message = (
            "🗺️ O mapa da rota oficial não ficou disponível "
            "nesta atualização."
        )

        from app.config import settings
        inserted = self.map_dispatcher.try_submit(
            vehicle_id=snapshot.vehicle_id,
            phone=self._recipient_for_event(event_type),
            latitude=snapshot.lat,
            longitude=snapshot.lng,
            bearing=snapshot.bearing,
            speed_kmh=snapshot.speed_kmh,
            battery=snapshot.battery,
            address=address,
            updated_at=snapshot.updated_at,
            event_type=event_type,
            progress_m=route_match.progress_m,
            segment_index=route_match.segment_index,
            route_version=route_ver,
            caption=caption,
            fallback_message=map_fallback_message,
            fallback_dedupe_key=f"{map_content_key}:fallback-text",
            dedupe_key=dedupe_key,
            content_key=map_content_key,
            # A linha de mapa não expira: se a renderização falhar, o mesmo
            # item lógico é promovido ao fallback textual durável.
            expires_at=None,
            snapped_lat=route_match.snapped_lat,
            snapped_lng=route_match.snapped_lng,
            primary_content_key=prepared.content_key,
            completion_separator_count=self.completion_separator_count,
            completion_location_dedupe_key=location_dedupe_key,
            fallback_expires_at=(
                now
                + timedelta(
                    seconds=settings.TRACKER_NOTIFICATION_TEXT_TTL_SECONDS
                )
            ),
        )

        accepted = self._notification_accepted(
            inserted=inserted,
            channel="map",
            dedupe_key=dedupe_key,
            content_key=map_content_key,
        )

        if not accepted:
            logger.error("Mapa não persistido para '%s'; usando Street View ou texto", event_type)
            return False

        logger.info(
            "Mapa complementar '%s' persistido com fallback curto",
            event_type,
        )
        return True

    def _ensure_completion_separators(
        self,
        *,
        snapshot: VehicleSnapshot,
        event_type: str,
        content_key: str,
        location_dedupe_key: Optional[str],
        now: datetime,
    ) -> bool:
        """Anexa os separadores ao conteúdo principal se o mapa não persistir."""

        if self.completion_separator_count <= 0:
            return True
        try:
            parent = self.db.get_notification_by_content_key(content_key)
            if parent is None:
                return False

            from app.config import settings

            self.db.enqueue_notification(
                vehicle_id=parent.vehicle_id,
                channel=parent.channel,
                dedupe_key=parent.dedupe_key,
                content_key=parent.content_key,
                payload=parent.payload,
                max_attempts=parent.max_attempts,
                created_at=now,
                available_at=now,
                expires_at=parent.expires_at,
                completion_separator_count=self.completion_separator_count,
                completion_separator_phone=self._recipient_for_event(
                    event_type
                ),
                completion_separator_expires_at=(
                    now
                    + timedelta(
                        seconds=(
                            settings.TRACKER_NOTIFICATION_TEXT_TTL_SECONDS
                        )
                    )
                ),
                completion_wait_channel=(
                    "location" if location_dedupe_key else None
                ),
                completion_wait_dedupe_key=location_dedupe_key,
            )
            last_separator = self.db.get_notification(
                channel="text",
                dedupe_key=(
                    f"{content_key}:separator:"
                    f"{self.completion_separator_count}"
                ),
            )
            return last_separator is not None
        except Exception:
            logger.exception(
                "Falha ao anexar separadores ao conteúdo principal de %s",
                snapshot.vehicle_id,
            )
            return False

    def _send_paired_alert(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
        stopped_duration: Optional[timedelta] = None,
        alert_key: Optional[str] = None,
        route_match: Optional[Any] = None,
    ) -> None:
        """Envia localização e persiste uma única alternativa de conteúdo."""
        anchor = alert_key or f"{event_type}:{snapshot.updated_at.isoformat()}"
        location_dedupe_key = f"{snapshot.vehicle_id}:{anchor}:location"

        try:
            self._send_location_update(
                event_type,
                snapshot,
                state,
                now,
                dedupe_anchor=anchor,
            )
        except Exception as exc:
            logger.error(
                "Falha ao enfileirar localização (%s)",
                type(exc).__name__,
            )

        if alert_key and alert_key == state.last_alert_key:
            logger.debug("Conteúdo já aceito: %s", alert_key)
            return

        prepared = self._prepare_alert(
            event_type,
            snapshot,
            state,
            now,
            stopped_duration,
            alert_key,
        )

        try:
            map_eligible = False
            if self.map_policy is not None and route_match is not None:
                map_decision = self.map_policy.check_eligibility(
                    snapshot, state, route_match, now
                )
                map_eligible = map_decision.eligible
                logger.debug(
                    "Política do mapa para %s: %s",
                    snapshot.vehicle_id,
                    map_decision.reason,
                )

            # Street View (ou seu fallback textual) é o conteúdo principal.
            # Quando existe mapa complementar, os separadores pertencem ao
            # mapa; assim nenhum "." pode ultrapassar a segunda imagem.
            primary_separator_count = (
                0 if map_eligible else self.completion_separator_count
            )
            primary_accepted = self._try_submit_combined_content(
                event_type,
                snapshot,
                state,
                now,
                prepared,
                alert_key,
                location_dedupe_key,
                completion_separator_count=primary_separator_count,
            )
            if not primary_accepted:
                primary_accepted = self._send_text_alert(
                    event_type,
                    snapshot,
                    state,
                    now,
                    stopped_duration,
                    alert_key,
                    prepared=prepared,
                    location_dedupe_key=location_dedupe_key,
                    completion_separator_count=primary_separator_count,
                )

            if not primary_accepted or not map_eligible:
                return

            map_accepted = False
            try:
                map_accepted = self._try_submit_map_content(
                    event_type,
                    snapshot,
                    state,
                    now,
                    prepared,
                    alert_key,
                    location_dedupe_key,
                    route_match,
                )
            except Exception:
                logger.exception(
                    "Falha ao persistir mapa complementar de %s",
                    snapshot.vehicle_id,
                )
                # A transação pode ter sido confirmada antes de um erro de
                # sinalização do worker. Consultar evita dois grupos de pontos.
                map_accepted = (
                    self.db.get_notification_by_content_key(
                        f"{prepared.content_key}:map"
                    )
                    is not None
                )

            if not map_accepted:
                attached = self._ensure_completion_separators(
                    snapshot=snapshot,
                    event_type=event_type,
                    content_key=prepared.content_key,
                    location_dedupe_key=location_dedupe_key,
                    now=now,
                )
                if not attached:
                    logger.critical(
                        "Conteúdo principal de %s ficou sem os separadores",
                        snapshot.vehicle_id,
                    )
        except Exception as exc:
            logger.error(
                "Falha ao enfileirar fluxo de conteúdo (%s)",
                type(exc).__name__,
                exc_info=True,
            )

    def _panorama_decision(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
    ) -> PanoramaDecision:
        """Explica por que um panorama pode ou não entrar na fila."""
        dispatcher = self.panorama_dispatcher
        if dispatcher is None:
            return PanoramaDecision(False, "dispatcher_disabled")

        allowed_events = {
            "moving",
            "stopped",
            "resumed",
            "recovered_moving",
            "recovered_stopped",
        }
        if event_type not in allowed_events:
            return PanoramaDecision(False, "event_not_supported")
        if not _valid_coordinates(snapshot.lat, snapshot.lng):
            return PanoramaDecision(False, "invalid_coordinates")
        if snapshot.stale or snapshot.status != "live":
            return PanoramaDecision(False, "non_live_snapshot")

        try:
            fix_age = now - snapshot.updated_at
            server_age = now - snapshot.server_time
        except TypeError:
            return PanoramaDecision(False, "invalid_timestamp")

        future_tolerance = timedelta(
            seconds=self.panorama_future_tolerance_seconds
        )
        if fix_age < -future_tolerance or server_age < -future_tolerance:
            return PanoramaDecision(False, "future_snapshot")

        maximum_age = timedelta(
            seconds=self.panorama_max_fix_age_seconds
        )
        if fix_age > maximum_age or server_age > maximum_age:
            return PanoramaDecision(False, "stale_fix")

        if not _valid_accuracy(
            snapshot.accuracy,
            maximum=self.panorama_max_accuracy_m,
        ):
            return PanoramaDecision(False, "invalid_accuracy")

        if dispatcher.has_pending(snapshot.vehicle_id):
            return PanoramaDecision(False, "already_pending")

        if state.last_image_attempt_at is not None:
            retry_elapsed = now - state.last_image_attempt_at
            if retry_elapsed < timedelta(
                minutes=self.image_retry_cooldown_minutes
            ):
                return PanoramaDecision(False, "retry_cooldown")

        if state.last_image_unavailable_at is not None:
            unavailable_elapsed = now - state.last_image_unavailable_at
            if unavailable_elapsed < timedelta(
                minutes=self.image_no_imagery_cooldown_minutes
            ):
                unavailable_lat = state.last_image_unavailable_lat
                unavailable_lng = state.last_image_unavailable_lng
                if (
                    unavailable_lat is None
                    or unavailable_lng is None
                    or not _valid_coordinates(
                        unavailable_lat,
                        unavailable_lng,
                    )
                ):
                    return PanoramaDecision(
                        False,
                        "no_imagery_cooldown",
                    )

                unavailable_distance = haversine_m(
                    unavailable_lat,
                    unavailable_lng,
                    snapshot.lat,
                    snapshot.lng,
                )
                if (
                    unavailable_distance
                    < self.image_no_imagery_retry_distance_m
                ):
                    return PanoramaDecision(
                        False,
                        "no_imagery_cooldown",
                        unavailable_distance,
                    )

        if state.last_image_sent_at is None:
            return PanoramaDecision(True, "first_image")

        if now - state.last_image_sent_at < timedelta(
            minutes=IMAGE_INTERVAL_MINUTES
        ):
            return PanoramaDecision(False, "minimum_interval")

        previous_lat = state.last_image_sent_lat
        previous_lng = state.last_image_sent_lng
        if (
            previous_lat is None
            or previous_lng is None
            or not _valid_coordinates(previous_lat, previous_lng)
        ):
            return PanoramaDecision(True, "missing_previous_coordinates")

        distance = haversine_m(
            previous_lat,
            previous_lng,
            snapshot.lat,
            snapshot.lng,
        )
        if distance >= IMAGE_MIN_DISTANCE_M:
            return PanoramaDecision(True, "minimum_distance", distance)

        previous_street = normalize(state.last_image_street)
        current_street = normalize(snapshot.street_name)
        street_changed = (
            bool(previous_street)
            and bool(current_street)
            and previous_street != current_street
        )
        if (
            street_changed
            and distance >= self.image_street_change_min_distance_m
        ):
            return PanoramaDecision(True, "street_changed", distance)

        return PanoramaDecision(False, "insufficient_movement", distance)

    def _should_schedule_panorama(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
    ) -> bool:
        return self._panorama_decision(
            event_type,
            snapshot,
            state,
            now,
        ).eligible

    def _schedule_panorama(
        self,
        event_type: str,
        snapshot: VehicleSnapshot,
        state: VehicleState,
        now: datetime,
    ) -> None:
        decision = self._panorama_decision(
            event_type,
            snapshot,
            state,
            now,
        )
        if not decision.eligible:
            logger.debug(
                "Panorama não agendado para %s: %s",
                snapshot.vehicle_id,
                decision.reason,
            )
            return

        dispatcher = self.panorama_dispatcher
        if dispatcher is None:
            return

        job = PanoramaJob(
            vehicle_id=snapshot.vehicle_id,
            phone=self._recipient_for_event(event_type),
            latitude=snapshot.lat,
            longitude=snapshot.lng,
            vehicle_name=snapshot.name or "Procissão de São Cristóvão",
            address=display_address(
                snapshot.address,
                snapshot.lat,
                snapshot.lng,
            ),
            street_name=snapshot.street_name,
            speed_kmh=snapshot.speed_kmh,
            battery=snapshot.battery,
            updated_at=snapshot.updated_at,
            requested_at=now,
            event_type=event_type,
        )
        if dispatcher.try_submit(job):
            state.last_image_attempt_at = now
        else:
            logger.debug(
                "Panorama não agendado: fila ocupada ou veículo pendente"
            )

    def process_regular_moving_sends(self, snapshot: VehicleSnapshot, state: VehicleState, now: datetime, route_match: Optional[Any] = None) -> None:
        """Processa envios regulares de localização e mensagem de texto durante movimento."""

        # === Localização e Texto ===
        location_due = (
            state.last_location_sent_at is None
            or (now - state.last_location_sent_at) >= timedelta(minutes=LOCATION_INTERVAL_MINUTES)
        )

        if location_due:
            if state.last_location_sent_lat is not None and state.last_location_sent_lng is not None:
                dist = haversine_m(
                    state.last_location_sent_lat, state.last_location_sent_lng,
                    snapshot.lat, snapshot.lng,
                )
                location_changed = dist >= LOCATION_MIN_DISTANCE_M
            else:
                location_changed = True  # Primeiro envio

            if location_changed:
                self._send_paired_alert("moving", snapshot, state, now, route_match=route_match)

    def process_stopped_state(self, snapshot: VehicleSnapshot, state: VehicleState, now: datetime, route_match: Optional[Any] = None) -> None:
        """Gerencia a transição STOPPING → STOPPED com histerese e envios periódicos a cada 15 minutos."""
        if state.stationary_since is None:
            # Se o status anterior era UNKNOWN (primeira inicialização do serviço),
            # inicia diretamente como STOPPED para evitar enviar alertas falsos de parada.
            if state.current_status == "UNKNOWN":
                state.previous_status = "UNKNOWN"
                state.current_status = "STOPPED"
                state.stationary_since = snapshot.updated_at
                return

            state.stationary_since = snapshot.updated_at
            state.previous_status = state.current_status
            state.current_status = "STOPPING"
            logger.debug("Possível parada detectada, aguardando confirmação")
            return

        stopped_duration = snapshot.updated_at - state.stationary_since

        if state.current_status == "STOPPING":
            if stopped_duration < timedelta(minutes=STOP_CONFIRM_MINUTES):
                return

            # Transição STOPPING -> STOPPED confirmada pela primeira vez
            state.previous_status = state.current_status
            state.current_status = "STOPPED"

            self._enrich_snapshot(snapshot)

            alert_key = f"stopped:{state.stationary_since.isoformat()}"
            self._send_paired_alert(
                "stopped", snapshot, state, now,
                stopped_duration=stopped_duration,
                alert_key=alert_key,
                route_match=route_match,
            )
            logger.info(f"Veículo parado há {stopped_duration} (confirmado)")
            return

        if state.current_status == "STOPPED":
            # Já está parado. Verificar se passou 15 minutos desde o último envio
            time_since_last_send = timedelta(minutes=999)
            if state.last_location_sent_at is not None:
                time_since_last_send = now - state.last_location_sent_at

            if time_since_last_send >= timedelta(minutes=15):
                self._enrich_snapshot(snapshot)
                self._send_paired_alert(
                    "stopped", snapshot, state, now,
                    stopped_duration=stopped_duration,
                    route_match=route_match,
                )
                logger.info(f"Envio periódico de parada: veículo parado há {stopped_duration}")

    def process_snapshot(self, snapshot: VehicleSnapshot, state: VehicleState, now: datetime) -> None:
        """Fluxo principal da máquina de estados."""
        if not _valid_coordinates(snapshot.lat, snapshot.lng):
            logger.warning(
                "Snapshot descartado: coordenadas inválidas para %s",
                snapshot.vehicle_id,
            )
            return

        server_age = now - snapshot.server_time
        tracker_age = now - snapshot.updated_at

        # 1. O endpoint inteiro parou de atualizar
        if server_age >= timedelta(minutes=OFFLINE_AFTER_MINUTES):
            if state.current_status != "OFFLINE_SERVER":
                self._enrich_snapshot(snapshot)
                alert_key = f"offline_server:{snapshot.server_time.isoformat()}"
                self._send_paired_alert(
                    "offline_server", snapshot, state, now, alert_key=alert_key
                )
                state.previous_status = state.current_status
                state.current_status = "OFFLINE_SERVER"
            self.db.save_state(state)
            return

        # 2. O servidor funciona, mas o celular não atualiza
        if tracker_age >= timedelta(minutes=OFFLINE_AFTER_MINUTES):
            if state.current_status != "OFFLINE_TRACKER":
                self._enrich_snapshot(snapshot)
                alert_key = f"offline_tracker:{snapshot.updated_at.isoformat()}"
                self._send_paired_alert(
                    "offline_tracker", snapshot, state, now, alert_key=alert_key
                )
                state.previous_status = state.current_status
                state.current_status = "OFFLINE_TRACKER"
            self.db.save_state(state)
            return

        # 3. Posição temporariamente atrasada
        if snapshot.stale or tracker_age >= timedelta(minutes=DELAYED_AFTER_MINUTES):
            state.current_status = "DELAYED"
            self.db.save_state(state)
            logger.debug(f"Posição atrasada ({tracker_age}), aguardando")
            return

        # 4. Não processar repetidamente o mesmo updatedAt
        if (
            state.last_processed_updated_at is not None
            and snapshot.updated_at <= state.last_processed_updated_at
        ):
            logger.debug("updatedAt não mudou, ignorando")
            return

        # Enriquecer com geocodificação
        self._enrich_snapshot(snapshot)

        # Snapear posição na rota oficial e persistir progresso
        route_match = None
        if self.route_progress_service is not None:
            try:
                route_match = self.route_progress_service.match_position(
                    lat=snapshot.lat,
                    lng=snapshot.lng,
                    bearing=snapshot.bearing,
                    speed_kmh=snapshot.speed_kmh,
                    previous_progress_m=state.last_route_progress_m,
                    previous_segment=state.last_route_segment_index,
                )
                state.last_route_progress_m = route_match.progress_m
                state.last_route_segment_index = route_match.segment_index
            except Exception:
                logger.exception("Falha ao snapar posição na rota")

        movement = detect_movement(snapshot, state)

        # 5. Verificar recuperação de OFFLINE/DELAYED
        recovered = state.current_status in {
            "OFFLINE_SERVER", "OFFLINE_TRACKER", "DELAYED",
        }
        previous_status = state.current_status

        if movement.is_moving:
            previous_stationary_since = state.stationary_since
            state.current_status = "MOVING"
            state.stationary_since = None
            state.last_motion_at = snapshot.updated_at

            if recovered:
                # Voltou do offline/delayed em movimento
                self._send_paired_alert("recovered_moving", snapshot, state, now, route_match=route_match)
                state.previous_status = previous_status

            elif previous_status == "STOPPED":
                # Retomou o movimento após parada
                stopped_duration = timedelta()
                if previous_stationary_since:
                    stopped_duration = (
                        snapshot.updated_at - previous_stationary_since
                    )

                self._send_paired_alert(
                    "resumed", snapshot, state, now,
                    stopped_duration=stopped_duration,
                    route_match=route_match,
                )
                state.previous_status = previous_status

            else:
                # Movimento regular
                self.process_regular_moving_sends(snapshot, state, now, route_match=route_match)

        else:
            # Sem movimento
            if recovered:
                # Voltou do offline/delayed mas parado
                self._send_paired_alert("recovered_stopped", snapshot, state, now, route_match=route_match)
                state.previous_status = previous_status
                state.current_status = "STOPPED"
                state.stationary_since = snapshot.updated_at
            else:
                self.process_stopped_state(snapshot, state, now, route_match=route_match)

        # Compatibilidade: no modo antigo a imagem continua independente.
        # No modo combinado ela só nasce junto de um alerta lógico.
        if not self.combined_message_enabled:
            try:
                panorama_event = (
                    "moving" if movement.is_moving else "stopped"
                )
                self._schedule_panorama(
                    panorama_event,
                    snapshot,
                    state,
                    now,
                )
            except Exception:
                logger.exception("Falha ao agendar panorama do tracker")

        # Atualizar estado observado
        state.last_processed_updated_at = snapshot.updated_at
        state.last_observed_lat = snapshot.lat
        state.last_observed_lng = snapshot.lng

        self.db.save_state(state)
