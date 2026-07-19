"""Módulo de envio assíncrono e persistente dos mapas de rastreamento via outbox SQLite."""

import json
import logging
import threading
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from dateutil.parser import isoparse

from app.tracker.tracker_db import TrackerDB, NotificationOutboxJob
from app.tracker.zapi_client import ZAPIClient
from .renderer import LeafletMapRenderer, MapRenderError
from .models import MapJob
from .route_repository import RouteRepository

logger = logging.getLogger(__name__)


def _optional_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _finite_float(value: Any, field: str) -> float:
    try:
        val = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"campo {field} deve ser float") from exc
    import math
    if not math.isfinite(val):
        raise ValueError(f"campo {field} deve ser finito")
    return val


class MapDispatcher:
    """Consome a outbox para gerar mosaicos de mapa e enviar pelo WhatsApp."""

    def __init__(
        self,
        *,
        db: TrackerDB,
        renderer: LeafletMapRenderer,
        zapi: ZAPIClient,
        route_repo: RouteRepository,
        lease_seconds: float = 60.0,
        max_job_age_seconds: float = 300.0,
        idle_poll_seconds: float = 1.0,
        send_attempts: int = 3,
        send_retry_delay_seconds: float = 5.0,
        instance_id: str = "default",
        notification_dispatcher=None,
    ):
        self.db = db
        self.renderer = renderer
        self.zapi = zapi
        self.route_repo = route_repo
        self.lease_seconds = lease_seconds
        self.max_job_age_seconds = max_job_age_seconds
        self.idle_poll_seconds = idle_poll_seconds
        self.send_attempts = send_attempts
        self.send_retry_delay_seconds = send_retry_delay_seconds
        self.notification_dispatcher = notification_dispatcher

        self._owner = f"map-worker-{instance_id}-{id(self)}"
        self._stop_event = threading.Event()
        self._wake_event = threading.Event()
        self._worker_thread = None
        self.start()

    def start(self) -> None:
        """Inicia a thread de processamento da outbox."""
        if self._worker_thread is not None:
            return
        self._stop_event.clear()
        self._wake_event.clear()
        self._worker_thread = threading.Thread(
            target=self._run,
            name="tracker-map-dispatcher",
            daemon=True
        )
        self._worker_thread.start()
        logger.info(f"MapDispatcher iniciado com owner={self._owner}")

    def stop(self) -> None:
        """Encerra a thread do despachador e o renderer de mapas."""
        if self._worker_thread is None:
            return
        self._stop_event.set()
        self.wake()
        self._worker_thread.join(timeout=10.0)
        self._worker_thread = None
        self.renderer.close()
        logger.info("MapDispatcher finalizado.")

    def close(self, timeout: Optional[float] = None) -> None:
        """Compatibilidade para encerramento automático."""
        self.stop()

    def wake(self) -> None:
        """Acorda o loop do despachador imediatamente."""
        self._wake_event.set()

    def _wake_text(self) -> None:
        """Acorda o canal textual após mapa/fallback liberar os separadores."""

        wake = getattr(self.notification_dispatcher, "wake_text", None)
        if not callable(wake):
            return
        try:
            wake()
        except Exception:
            logger.exception("Falha ao acordar worker de texto do fluxo de mapa")

    def try_submit(
        self,
        *,
        vehicle_id: str,
        phone: str,
        latitude: float,
        longitude: float,
        bearing: float,
        speed_kmh: float,
        battery: Optional[int],
        address: Optional[str],
        updated_at: datetime,
        event_type: str,
        progress_m: float,
        segment_index: int,
        route_version: str,
        caption: str,
        fallback_message: str,
        fallback_dedupe_key: str,
        fallback_max_attempts: int = 5,
        fallback_expires_at: Optional[datetime] = None,
        dedupe_key: str,
        content_key: str,
        expires_at: Optional[datetime] = None,
        snapped_lat: Optional[float] = None,
        snapped_lng: Optional[float] = None,
        primary_content_key: Optional[str] = None,
        completion_separator_count: int = 0,
        completion_location_dedupe_key: Optional[str] = None,
    ) -> bool:
        """Enfileira um novo mosaico de mapa para envio assíncrono."""
        payload = {
            "vehicle_id": vehicle_id,
            "phone": phone,
            "latitude": latitude,
            "longitude": longitude,
            "bearing": bearing,
            "speed_kmh": speed_kmh,
            "battery": battery,
            "address": address,
            "updated_at": updated_at.isoformat(),
            "event_type": event_type,
            "progress_m": progress_m,
            "segment_index": segment_index,
            "route_version": route_version,
            "caption": caption,
            "fallback_message": fallback_message,
            "fallback_dedupe_key": fallback_dedupe_key,
            "fallback_max_attempts": fallback_max_attempts,
            "fallback_expires_at": fallback_expires_at.isoformat() if fallback_expires_at else None,
            "snapped_lat": snapped_lat,
            "snapped_lng": snapped_lng,
            "primary_content_key": primary_content_key,
            "completion_separator_count": int(completion_separator_count),
            "completion_location_dedupe_key": completion_location_dedupe_key,
        }

        # Cria uma notificação padrão na outbox text para ser o fallback caso esta imagem fale permanentemente
        fallback_payload = {
            "phone": phone,
            "message": fallback_message,
        }
        payload["fallback_payload"] = fallback_payload

        # Enfileira na outbox na categoria 'map'
        enqueued = self.db.enqueue_notification(
            vehicle_id=vehicle_id,
            channel="map",
            dedupe_key=dedupe_key,
            content_key=content_key,
            payload=payload,
            max_attempts=self.send_attempts,
            expires_at=expires_at,
            completion_separator_count=int(completion_separator_count),
            completion_separator_phone=phone,
            completion_separator_expires_at=fallback_expires_at,
            completion_wait_channel=(
                "location" if completion_location_dedupe_key else None
            ),
            completion_wait_dedupe_key=completion_location_dedupe_key,
        )

        if enqueued:
            logger.info(f"Novo mapa enfileirado com sucesso! Dedupe: {dedupe_key}")
            self.wake()
        return enqueued

    def _recover_abandoned(self) -> None:
        """Promove fallbacks de mapas que foram travados em execuções anteriores."""
        try:
            now = datetime.now(timezone.utc)
            # Qualquer job criado há mais de 10 minutos é considerado abandonado
            recovered = self.db.recover_map_fallbacks(
                created_before=now - timedelta(minutes=10),
                now=now
            )
            if recovered > 0:
                logger.warning(f"MapDispatcher: {recovered} jobs de mapa abandonados promovidos para texto.")
        except Exception:
            logger.exception("Falha ao recuperar fallbacks de mapas abandonados")

    def _run(self) -> None:
        owner = self._owner
        while not self._stop_event.is_set():
            try:
                record = self.db.claim_notification(
                    channel="map",
                    lease_owner=owner,
                    lease_seconds=self.lease_seconds,
                )
            except Exception:
                logger.exception("Falha ao reclamar mapa da outbox")
                self._wake_event.wait(self.idle_poll_seconds)
                self._wake_event.clear()
                continue

            if record is None:
                try:
                    wait_seconds = self.db.notification_wait_seconds(
                        "map",
                        default=self.idle_poll_seconds,
                        maximum=self.idle_poll_seconds,
                    )
                except Exception:
                    wait_seconds = self.idle_poll_seconds
                self._wake_event.wait(wait_seconds)
                self._wake_event.clear()
                continue

            # Inicia thread de batimento cardíaco (lease renewal)
            heartbeat_finished = threading.Event()
            lease_lost = threading.Event()
            heartbeat = threading.Thread(
                target=self._heartbeat,
                args=(record.id, owner, heartbeat_finished, lease_lost),
                name=f"tracker-map-lease-{record.id}",
                daemon=True,
            )
            heartbeat.start()

            try:
                self._process(record, owner, lease_lost)
            except Exception as exc:
                logger.exception(f"Falha inesperada no processamento de mapa id={record.id}")
                if not lease_lost.is_set():
                    self._promote_to_text(
                        record.id,
                        owner,
                        f"map_worker_error:{type(exc).__name__}",
                    )
            finally:
                heartbeat_finished.set()
                heartbeat.join(timeout=min(1.0, self.lease_seconds))

    def _heartbeat(
        self,
        record_id: int,
        owner: str,
        finished: threading.Event,
        lease_lost: threading.Event,
    ) -> None:
        """Renova periodicamente a custódia do job enquanto ele está em andamento."""
        half_ttl = max(1.0, self.lease_seconds / 2.0)
        while not finished.wait(half_ttl) and not self._stop_event.is_set():
            try:
                renewed = self.db.renew_notification_lease(
                    record_id,
                    lease_owner=owner,
                    lease_seconds=self.lease_seconds,
                )
                if not renewed:
                    logger.error(f"Custódia perdida para mapa id={record_id}")
                    lease_lost.set()
                    break
            except Exception:
                logger.exception(f"Erro ao renovar lease do mapa id={record_id}")

    def _job_from_outbox(self, record: NotificationOutboxJob) -> MapJob:
        payload = record.payload
        battery_raw = payload.get("battery")
        
        return MapJob(
            vehicle_id=str(payload.get("vehicle_id") or record.vehicle_id),
            phone=str(payload.get("phone")),
            latitude=_finite_float(payload.get("latitude"), "latitude"),
            longitude=_finite_float(payload.get("longitude"), "longitude"),
            bearing=_finite_float(payload.get("bearing"), "bearing"),
            speed_kmh=_finite_float(payload.get("speed_kmh"), "speed_kmh"),
            battery=int(battery_raw) if battery_raw is not None else None,
            address=_optional_text(payload.get("address")),
            updated_at=isoparse(payload["updated_at"]),
            requested_at=record.created_at,
            event_type=str(payload.get("event_type", "moving")),
            progress_m=_finite_float(payload.get("progress_m"), "progress_m"),
            segment_index=int(payload.get("segment_index", 0)),
            route_version=str(payload.get("route_version", "v1")),
            caption=_optional_text(payload.get("caption")),
            dedupe_key=record.dedupe_key,
            content_key=record.content_key,
            snapped_lat=(
                _finite_float(payload.get("snapped_lat"), "snapped_lat")
                if payload.get("snapped_lat") is not None
                else None
            ),
            snapped_lng=(
                _finite_float(payload.get("snapped_lng"), "snapped_lng")
                if payload.get("snapped_lng") is not None
                else None
            ),
            primary_content_key=_optional_text(
                payload.get("primary_content_key")
            ),
        )

    def _wait_for_primary_terminal(
        self,
        job: MapJob,
        lease_lost: threading.Event,
    ) -> bool:
        """Gera em paralelo, mas só libera o POST após o conteúdo principal."""

        content_key = _optional_text(job.primary_content_key)
        if not content_key:
            return True

        while True:
            try:
                primary = self.db.get_notification_by_content_key(content_key)
            except Exception:
                logger.exception(
                    "Falha ao consultar conteúdo principal %s", content_key
                )
                self._stop_event.wait(
                    max(0.05, min(0.5, self.idle_poll_seconds))
                )
                continue

            if primary is None:
                logger.error(
                    "Conteúdo principal ausente para o mapa: %s; "
                    "o mapa seguirá como recuperação autônoma",
                    content_key,
                )
                return True

            if primary.status in ("sent", "dead", "expired"):
                return True

            if self._stop_event.is_set() or lease_lost.is_set():
                return False

            self._stop_event.wait(
                max(0.05, min(0.5, self.idle_poll_seconds))
            )

        return False

    def _promote_after_primary(
        self,
        record: NotificationOutboxJob,
        owner: str,
        job: MapJob,
        lease_lost: threading.Event,
        error: str,
    ) -> bool:
        """Mantém também o fallback curto atrás do conteúdo principal."""

        if not self._wait_for_primary_terminal(job, lease_lost):
            return False
        if lease_lost.is_set() or self._stop_event.is_set():
            return False
        return self._promote_to_text(record.id, owner, error)

    def _process(
        self,
        record: NotificationOutboxJob,
        owner: str,
        lease_lost: threading.Event,
    ) -> None:
        try:
            job = self._job_from_outbox(record)
        except Exception as exc:
            logger.error(f"Payload inválido no mapa id={record.id} ({type(exc).__name__})")
            self._promote_to_text(record.id, owner, "map_payload_invalid")
            return

        # Verificar se expirou
        age = (datetime.now(timezone.utc) - record.created_at).total_seconds()
        if age > self.max_job_age_seconds:
            self._promote_after_primary(
                record, owner, job, lease_lost, "map_job_expired"
            )
            return

        try:
            self.db.mark_map_attempt(job.vehicle_id, datetime.now(timezone.utc))
        except Exception:
            logger.exception(f"Falha ao registrar tentativa do mapa id={record.id}")

        if lease_lost.is_set():
            return

        # 1. Gerar o mosaico de mapas usando o renderer local
        try:
            # Recortar a rota a partir do índice de segmentos do snap
            route_coords = self.route_repo.coords_wgs84
            segment_index = min(
                max(0, int(job.segment_index)),
                max(0, len(route_coords) - 2),
            )
            progress_coords = list(route_coords[:segment_index + 1])
            if not progress_coords:
                progress_coords = [route_coords[0]]
            snapped = (
                job.snapped_lng if job.snapped_lng is not None else job.longitude,
                job.snapped_lat if job.snapped_lat is not None else job.latitude,
            )
            if progress_coords[-1] != snapped:
                progress_coords.append(snapped)

            start_coords = (self.route_repo.start_wgs84.y, self.route_repo.start_wgs84.x) # lat, lng

            logger.info(f"Iniciando renderização de mapa para {job.vehicle_id}")
            artifact = self.renderer.render_collage(
                job=job,
                route_wgs84=self.route_repo.coords_wgs84,
                progress_wgs84=progress_coords,
                start_coords=start_coords,
                total_length_m=self.route_repo.total_length_m
            )
        except MapRenderError as exc:
            logger.error(f"Falha ao renderizar mapa id={record.id}: {exc}")
            if not lease_lost.is_set():
                self._promote_after_primary(
                    record,
                    owner,
                    job,
                    lease_lost,
                    f"map_render_failed:{type(exc).__name__}",
                )
            return
        except Exception as exc:
            logger.exception(f"Erro inesperado ao gerar mapa id={record.id}")
            if not lease_lost.is_set():
                self._promote_after_primary(
                    record,
                    owner,
                    job,
                    lease_lost,
                    f"map_render_fatal:{type(exc).__name__}",
                )
            return

        if lease_lost.is_set():
            return

        # Os dois workers geram as imagens sem se bloquear. A serialização é
        # feita somente antes do envio para manter a conversa na ordem certa.
        if not self._wait_for_primary_terminal(job, lease_lost):
            return

        # 2. Enviar a imagem JPEG final via Z-API
        caption = job.caption or f"📍 Acompanhamento de rota da procissão."
        result, error = self._send_image_with_retry(
            record,
            owner,
            job,
            artifact.jpeg_bytes,
            caption,
            lease_lost
        )

        if result is None:
            if error != "map_lease_lost" and not lease_lost.is_set():
                self._promote_to_text(record.id, owner, error)
            return

        provider_message_id = result.get("messageId")
        if not provider_message_id:
            self._promote_to_text(record.id, owner, "map_provider_message_id_missing")
            return

        # 3. Confirmar atomicamente o sucesso e atualizar o VehicleState
        if not self._complete_success(
            record, owner, job, provider_message_id, lease_lost
        ):
            logger.critical(
                f"Mapa id={record.id} aceito pela Z-API, mas não concluído no SQLite"
            )

    def _send_image_with_retry(
        self,
        record: NotificationOutboxJob,
        owner: str,
        job: MapJob,
        image_bytes: bytes,
        caption: str,
        lease_lost: threading.Event,
    ) -> tuple[Optional[dict], str]:
        """Envia imagem para a Z-API com política de retry."""
        for attempt_index in range(self.send_attempts):
            if attempt_index > 0 and self._stop_event.is_set():
                return None, "map_dispatcher_stopped"
            if lease_lost.is_set():
                return None, "map_lease_lost"

            logger.info(
                f"Enviando mapa id={record.id} (tentativa {attempt_index + 1}/{self.send_attempts})..."
            )
            try:
                result = self.zapi.send_image_bytes(
                    phone=job.phone,
                    image_bytes=image_bytes,
                    caption=caption,
                    mime_type="image/jpeg"
                )
                if result is not None and "messageId" in result:
                    return result, ""
                
                # ZAPI retornou resposta inesperada ou erro HTTP
                logger.warning(
                    f"Z-API rejeitou envio de imagem id={record.id} (status: {result})"
                )
            except Exception as e:
                logger.warning(f"Erro ao disparar Z-API para mapa id={record.id}: {e}")

            if attempt_index < self.send_attempts - 1:
                time.sleep(self.send_retry_delay_seconds)

        return None, "map_zapi_send_failed"

    def _complete_success(
        self,
        record: NotificationOutboxJob,
        owner: str,
        job: MapJob,
        provider_message_id: str,
        lease_lost: threading.Event,
    ) -> bool:
        """Finaliza o job com sucesso no banco (transacional)."""
        if lease_lost.is_set():
            return False
        try:
            completed = self.db.complete_map_notification(
                record.id,
                lease_owner=owner,
                provider_message_id=provider_message_id,
                sent_at=datetime.now(timezone.utc),
                latitude=job.latitude,
                longitude=job.longitude,
                progress_m=job.progress_m
            )
            if completed:
                logger.info(f"Notificação de mapa id={record.id} concluída com sucesso.")
                self._wake_text()
            return completed
        except Exception:
            logger.exception(f"Falha ao consolidar sucesso do mapa id={record.id}")
            return False

    def _promote_to_text(self, record_id: int, owner: str, error: str) -> bool:
        """Promove a notificação para seu fallback de texto."""
        try:
            promoted = self.db.promote_map_to_text(
                record_id,
                lease_owner=owner,
                error=error,
                now=datetime.now(timezone.utc)
            )
        except Exception:
            logger.exception(f"Falha ao promover mapa id={record_id} para texto")
            return False
        if promoted:
            logger.warning(f"Mapa id={record_id} falhou ({error}). Promovido para fallback textual.")
            self._wake_text()
        return promoted
