"""Outbox durável para gerar e enviar panoramas do rastreamento."""

from __future__ import annotations

import logging
import math
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence

from .streetview import PanoramaGenerator, StreetViewUnavailable
from .location_format import clean_location_text, coordinate_fallback
from .templates import format_datetime
from .tracker_db import NotificationOutboxJob, TrackerDB
from .zapi_client import ZAPIClient

logger = logging.getLogger(__name__)
_ACTIVE_STATUSES = ("queued", "retry", "inflight")


def _utc_datetime(value: datetime, *, field: str) -> datetime:
    if not isinstance(value, datetime):
        raise ValueError(f"{field} deve ser datetime")
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_datetime(value: object, *, field: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{field} ausente ou inválido")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field} inválido") from exc
    return _utc_datetime(parsed, field=field)


def _optional_text(value: object) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _finite_float(value: object, *, field: str) -> float:
    if isinstance(value, bool):
        raise ValueError(f"{field} inválido")
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} inválido") from exc
    if not math.isfinite(number):
        raise ValueError(f"{field} inválido")
    return number


@dataclass(frozen=True)
class PanoramaJob:
    """Snapshot imutável persistido antes de iniciar Chrome ou rede."""

    vehicle_id: str
    phone: str
    latitude: float
    longitude: float
    vehicle_name: str
    address: Optional[str]
    street_name: Optional[str]
    speed_kmh: float
    battery: Optional[int]
    updated_at: datetime
    requested_at: datetime
    event_type: str
    dedupe_key: Optional[str] = None
    content_key: Optional[str] = None
    caption: Optional[str] = None
    fallback_message: Optional[str] = None
    fallback_dedupe_key: Optional[str] = None
    completion_separator_count: int = 0
    completion_location_dedupe_key: Optional[str] = None


def build_combined_panorama_caption(text: str) -> str:
    """Acrescenta ao status completo um aviso visual curto e discreto."""

    message = str(text or "").strip()
    warning = (
        "📷 _Imagem panorâmica aproximada; o Street View pode ser de outra data._"
    )
    return f"{message}\n\n{warning}" if message else warning


def build_panorama_caption(job: PanoramaJob) -> str:
    """Legenda curta usada apenas pelo fluxo legado sem texto combinado."""

    location = (
        clean_location_text(job.address)
        or clean_location_text(job.street_name)
        or coordinate_fallback(job.latitude, job.longitude)
    )
    return (
        "📷 *Visão panorâmica aproximada do local*\n"
        f"📍 {location}\n"
        f"🕒 GPS atualizado em {format_datetime(job.updated_at)}\n\n"
        "_As imagens do Street View podem ter sido registradas em outra data._"
    )


class PanoramaDispatcher:
    """Reclama panoramas da outbox e mantém o lease durante o trabalho."""

    def __init__(
        self,
        *,
        generator: PanoramaGenerator,
        zapi: ZAPIClient,
        db: TrackerDB,
        queue_size: int = 1,
        max_job_age_seconds: float = 120.0,
        send_attempts: int = 3,
        send_retry_delays: Sequence[float] = (1.0, 3.0),
        notification_dispatcher=None,
        lease_seconds: float = 60.0,
        idle_poll_seconds: float = 0.25,
        fallback_max_attempts: int = 5,
        fallback_ttl_seconds: float = 3600.0,
        recovery_cutoff: Optional[datetime] = None,
    ):
        if lease_seconds <= 0:
            raise ValueError("lease_seconds deve ser positivo")
        if idle_poll_seconds <= 0:
            raise ValueError("idle_poll_seconds deve ser positivo")
        if fallback_max_attempts < 1:
            raise ValueError("fallback_max_attempts deve ser positivo")
        if any(float(delay) < 0 for delay in send_retry_delays):
            raise ValueError("send_retry_delays não aceita valores negativos")

        self.generator = generator
        self.zapi = zapi
        self.db = db
        self.notification_dispatcher = notification_dispatcher
        self.max_job_age_seconds = max(0.0, float(max_job_age_seconds))
        self.send_attempts = min(10, max(1, int(send_attempts)))
        self.send_retry_delays = tuple(
            max(0.0, float(delay)) for delay in send_retry_delays
        )
        self.lease_seconds = float(lease_seconds)
        self.idle_poll_seconds = float(idle_poll_seconds)
        self.fallback_max_attempts = int(fallback_max_attempts)
        self.fallback_ttl_seconds = max(0.0, float(fallback_ttl_seconds))
        # Mantido para configurações antigas; a capacidade real agora é o SQLite.
        self.queue_size = max(1, int(queue_size))

        now = datetime.now(timezone.utc)
        self._recovery_cutoff = _utc_datetime(
            recovery_cutoff or now,
            field="recovery_cutoff",
        )
        self._instance_id = uuid.uuid4().hex
        self._owner = f"{self._instance_id}:panorama"
        self._stop_event = threading.Event()
        self._wake_event = threading.Event()
        self._state_lock = threading.Lock()
        self._closed = False

        self._recover_abandoned()
        self._thread = threading.Thread(
            target=self._run,
            name="tracker-panorama",
            daemon=True,
        )
        self._thread.start()

    def _wake_text(self) -> None:
        wake = getattr(self.notification_dispatcher, "wake_text", None)
        if not callable(wake):
            return
        try:
            wake()
        except Exception:
            logger.exception("Falha ao acordar worker do fallback textual")

    def _recover_abandoned(self) -> int:
        """Promove jobs anteriores ao processo quando seus leases permitem."""

        try:
            recovered = self.db.recover_panorama_fallbacks(
                created_before=self._recovery_cutoff,
                now=datetime.now(timezone.utc),
            )
        except Exception:
            logger.exception("Falha ao recuperar panoramas anteriores")
            return 0
        if recovered:
            logger.info(
                "%d panorama(s) anterior(es) convertido(s) em texto",
                recovered,
            )
            self._wake_text()
        return recovered

    def _has_pending_db(self, vehicle_id: str) -> bool:
        return bool(
            self.db.count_notifications(
                statuses=_ACTIVE_STATUSES,
                channels=("panorama",),
                vehicle_id=vehicle_id,
            )
        )

    def has_pending(self, vehicle_id: str) -> bool:
        """Consulta a fonte durável, inclusive trabalhos de outro processo."""

        vehicle_id = str(vehicle_id or "").strip()
        if not vehicle_id:
            return False
        try:
            return self._has_pending_db(vehicle_id)
        except Exception:
            logger.exception(
                "Falha ao consultar panorama pendente de %s",
                vehicle_id,
            )
            return True

    def _validate_job(self, job: PanoramaJob) -> None:
        if not isinstance(job, PanoramaJob):
            raise TypeError("job deve ser PanoramaJob")
        if not str(job.vehicle_id or "").strip():
            raise ValueError("vehicle_id é obrigatório")
        if not str(job.phone or "").strip():
            raise ValueError("phone é obrigatório")
        latitude = _finite_float(job.latitude, field="latitude")
        longitude = _finite_float(job.longitude, field="longitude")
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError("coordenadas fora do intervalo")
        _finite_float(job.speed_kmh, field="speed_kmh")
        _utc_datetime(job.updated_at, field="updated_at")
        _utc_datetime(job.requested_at, field="requested_at")
        if isinstance(job.completion_separator_count, bool):
            raise ValueError("completion_separator_count invalido")
        if not 0 <= int(job.completion_separator_count) <= 10:
            raise ValueError("completion_separator_count deve estar entre 0 e 10")

    def _payload_for(self, job: PanoramaJob) -> dict:
        requested_at = _utc_datetime(job.requested_at, field="requested_at")
        updated_at = _utc_datetime(job.updated_at, field="updated_at")
        fallback_expires_at = requested_at + timedelta(
            seconds=self.fallback_ttl_seconds
        )
        fallback_payload = None
        if job.fallback_message and job.fallback_dedupe_key:
            fallback_payload = {
                "phone": str(job.phone),
                "message": str(job.fallback_message),
            }
        return {
            "schema_version": 1,
            "vehicle_id": str(job.vehicle_id),
            "phone": str(job.phone),
            "latitude": float(job.latitude),
            "longitude": float(job.longitude),
            "vehicle_name": str(job.vehicle_name),
            "address": job.address,
            "street_name": job.street_name,
            "speed_kmh": float(job.speed_kmh),
            "battery": job.battery,
            "updated_at": updated_at.isoformat(),
            "requested_at": requested_at.isoformat(),
            "event_type": str(job.event_type),
            "dedupe_key": job.dedupe_key,
            "content_key": job.content_key,
            "caption": job.caption,
            "fallback_message": job.fallback_message,
            "fallback_dedupe_key": job.fallback_dedupe_key,
            "completion_separator_count": int(
                job.completion_separator_count
            ),
            "completion_location_dedupe_key": (
                job.completion_location_dedupe_key
            ),
            "fallback_payload": fallback_payload,
            "fallback_max_attempts": self.fallback_max_attempts,
            "fallback_expires_at": fallback_expires_at.isoformat(),
        }

    @staticmethod
    def _default_dedupe_key(job: PanoramaJob) -> str:
        requested_at = _utc_datetime(job.requested_at, field="requested_at")
        return f"panorama:{job.vehicle_id}:{requested_at.isoformat()}"

    def try_submit(self, job: PanoramaJob) -> bool:
        """Persiste o job completo antes de retornar ao polling do tracker."""

        try:
            self._validate_job(job)
            payload = self._payload_for(job)
            dedupe_key = _optional_text(job.dedupe_key) or self._default_dedupe_key(
                job
            )
            content_key = _optional_text(job.content_key)
        except (TypeError, ValueError):
            logger.exception("Panorama rejeitado por payload inválido")
            return False

        with self._state_lock:
            if self._closed:
                return False
            try:
                if self._has_pending_db(job.vehicle_id):
                    return False
                inserted = self.db.enqueue_notification(
                    vehicle_id=job.vehicle_id,
                    channel="panorama",
                    dedupe_key=dedupe_key,
                    content_key=content_key,
                    payload=payload,
                    max_attempts=self.send_attempts,
                    created_at=_utc_datetime(job.requested_at, field="requested_at"),
                    # A expiração da captura promove fallback; não expira a linha.
                    expires_at=None,
                    completion_separator_count=int(
                        job.completion_separator_count
                    ),
                    completion_separator_phone=job.phone,
                    completion_separator_expires_at=(
                        _utc_datetime(job.requested_at, field="requested_at")
                        + timedelta(seconds=self.fallback_ttl_seconds)
                    ),
                    completion_wait_channel=(
                        "location"
                        if job.completion_location_dedupe_key
                        else None
                    ),
                    completion_wait_dedupe_key=(
                        job.completion_location_dedupe_key
                    ),
                )
            except Exception:
                logger.exception("Falha ao persistir panorama %s", dedupe_key)
                return False

        if inserted:
            self._wake_event.set()
            logger.info("Panorama persistido para %s", job.vehicle_id)
        return inserted

    @staticmethod
    def _job_from_outbox(record: NotificationOutboxJob) -> PanoramaJob:
        payload = record.payload
        fallback_payload = payload.get("fallback_payload")
        fallback_message = _optional_text(payload.get("fallback_message"))
        if fallback_message is None and isinstance(fallback_payload, dict):
            fallback_message = _optional_text(fallback_payload.get("message"))

        battery_raw = payload.get("battery")
        if battery_raw is None:
            battery = None
        elif isinstance(battery_raw, bool):
            raise ValueError("battery inválida")
        else:
            battery = int(battery_raw)

        latitude = _finite_float(payload.get("latitude"), field="latitude")
        longitude = _finite_float(payload.get("longitude"), field="longitude")
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError("coordenadas fora do intervalo")

        vehicle_id = str(payload.get("vehicle_id") or record.vehicle_id).strip()
        phone = str(payload.get("phone") or "").strip()
        if not vehicle_id or not phone:
            raise ValueError("vehicle_id e phone são obrigatórios")

        return PanoramaJob(
            vehicle_id=vehicle_id,
            phone=phone,
            latitude=latitude,
            longitude=longitude,
            vehicle_name=str(payload.get("vehicle_name") or vehicle_id),
            address=_optional_text(payload.get("address")),
            street_name=_optional_text(payload.get("street_name")),
            speed_kmh=_finite_float(payload.get("speed_kmh", 0), field="speed_kmh"),
            battery=battery,
            updated_at=_parse_datetime(payload.get("updated_at"), field="updated_at"),
            requested_at=_parse_datetime(
                payload.get("requested_at"), field="requested_at"
            ),
            event_type=str(payload.get("event_type") or "unknown"),
            dedupe_key=record.dedupe_key,
            content_key=record.content_key,
            caption=_optional_text(payload.get("caption")),
            fallback_message=fallback_message,
            fallback_dedupe_key=_optional_text(payload.get("fallback_dedupe_key")),
            completion_separator_count=int(
                payload.get("completion_separator_count") or 0
            ),
            completion_location_dedupe_key=_optional_text(
                payload.get("completion_location_dedupe_key")
            ),
        )

    @staticmethod
    def _header_lines(job: PanoramaJob) -> tuple[str, ...]:
        location = (
            clean_location_text(job.street_name)
            or clean_location_text(job.address)
            or coordinate_fallback(job.latitude, job.longitude)
        )
        return (
            f"{job.vehicle_name} · visão panorâmica",
            location,
            f"GPS: {format_datetime(job.updated_at)}",
        )

    def _job_is_expired(self, job: PanoramaJob) -> bool:
        requested_at = _utc_datetime(job.requested_at, field="requested_at")
        age_seconds = (datetime.now(timezone.utc) - requested_at).total_seconds()
        return age_seconds > self.max_job_age_seconds

    def _send_retry_delay(self, failed_attempt_index: int) -> float:
        if not self.send_retry_delays:
            return 0.0
        return self.send_retry_delays[
            min(failed_attempt_index, len(self.send_retry_delays) - 1)
        ]

    @staticmethod
    def _provider_message_id(result: object) -> Optional[str]:
        if not isinstance(result, dict):
            return None
        value = result.get("messageId") or result.get("zaapId") or result.get("id")
        return str(value).strip() if value else None

    def _renew_lease(self, record_id: int, owner: str) -> bool:
        try:
            return bool(
                self.db.renew_notification_lease(
                    record_id,
                    lease_owner=owner,
                    lease_seconds=self.lease_seconds,
                )
            )
        except Exception:
            logger.exception("Falha ao renovar lease do panorama id=%s", record_id)
            return False

    def _heartbeat(
        self,
        record_id: int,
        owner: str,
        finished: threading.Event,
        lease_lost: threading.Event,
    ) -> None:
        interval = max(0.01, min(5.0, self.lease_seconds / 3.0))
        while not finished.wait(interval):
            if not self._renew_lease(record_id, owner):
                lease_lost.set()
                return

    def _promote_to_text(self, record_id: int, owner: str, error: str) -> bool:
        try:
            promoted = self.db.promote_panorama_to_text(
                record_id,
                lease_owner=owner,
                error=error,
                now=datetime.now(timezone.utc),
            )
        except Exception:
            logger.exception("Falha ao promover panorama id=%s para texto", record_id)
            return False
        if promoted:
            self._wake_text()
        return promoted

    def _send_image_with_retry(
        self,
        record: NotificationOutboxJob,
        owner: str,
        job: PanoramaJob,
        image_bytes: bytes,
        caption: str,
        lease_lost: threading.Event,
    ) -> tuple[Optional[dict], str]:
        """Repete somente a Z-API, reutilizando exatamente o mesmo JPEG."""

        for attempt_index in range(self.send_attempts):
            if attempt_index > 0 and self._stop_event.is_set():
                return None, "panorama_shutdown_during_retry"
            if lease_lost.is_set() or not self._renew_lease(record.id, owner):
                lease_lost.set()
                return None, "panorama_lease_lost"

            attempt_number = attempt_index + 1
            try:
                result = self.zapi.send_image_bytes(job.phone, image_bytes, caption)
            except Exception as exc:
                result = None
                logger.warning(
                    "Falha transitória no panorama de %s (%d/%d, %s)",
                    job.vehicle_id,
                    attempt_number,
                    self.send_attempts,
                    type(exc).__name__,
                )

            if isinstance(result, dict) and result:
                return result, ""

            failure_getter = getattr(self.zapi, "get_last_failure", None)
            failure = failure_getter() if callable(failure_getter) else None
            if failure is not None and not getattr(failure, "retryable", True):
                code = getattr(failure, "code", "terminal_failure")
                return None, f"panorama_terminal:{code}"

            if attempt_number >= self.send_attempts:
                break
            delay = self._send_retry_delay(attempt_index)
            if delay > 0 and self._stop_event.wait(delay):
                return None, "panorama_shutdown_during_retry"

        return None, "panorama_send_attempts_exhausted"

    def _complete_success(
        self,
        record: NotificationOutboxJob,
        owner: str,
        job: PanoramaJob,
        provider_message_id: str,
        lease_lost: threading.Event,
    ) -> bool:
        for attempt in range(3):
            if lease_lost.is_set() or not self._renew_lease(record.id, owner):
                lease_lost.set()
                return False
            try:
                completed = self.db.complete_panorama_notification(
                    record.id,
                    lease_owner=owner,
                    provider_message_id=provider_message_id,
                    sent_at=datetime.now(timezone.utc),
                    latitude=job.latitude,
                    longitude=job.longitude,
                    street=job.street_name,
                )
            except Exception:
                completed = False
                logger.exception(
                    "Falha ao concluir panorama enviado id=%s (%d/3)",
                    record.id,
                    attempt + 1,
                )
            if completed:
                return True
            if attempt < 2 and not self._stop_event.wait(0.1 * (attempt + 1)):
                continue
            break
        return False

    def _process(
        self,
        record: NotificationOutboxJob,
        owner: str,
        lease_lost: threading.Event,
    ) -> None:
        try:
            job = self._job_from_outbox(record)
        except Exception as exc:
            logger.error(
                "Payload inválido no panorama id=%s (%s)",
                record.id,
                type(exc).__name__,
            )
            self._promote_to_text(record.id, owner, "panorama_payload_invalid")
            return

        if self._job_is_expired(job):
            self._promote_to_text(record.id, owner, "panorama_job_expired")
            return

        try:
            self.db.mark_image_attempt(job.vehicle_id, datetime.now(timezone.utc))
        except Exception:
            logger.exception("Falha ao registrar tentativa do panorama id=%s", record.id)

        if lease_lost.is_set():
            return
        try:
            artifact = self.generator.generate(
                latitude=job.latitude,
                longitude=job.longitude,
                header_lines=self._header_lines(job),
            )
        except StreetViewUnavailable:
            try:
                self.db.record_image_unavailable(
                    vehicle_id=job.vehicle_id,
                    unavailable_at=datetime.now(timezone.utc),
                    latitude=job.latitude,
                    longitude=job.longitude,
                )
            except Exception:
                logger.exception(
                    "Falha ao registrar Street View indisponível id=%s", record.id
                )
            if not lease_lost.is_set():
                self._promote_to_text(
                    record.id, owner, "panorama_streetview_unavailable"
                )
            return
        except Exception as exc:
            logger.error(
                "Falha ao gerar panorama id=%s (%s)",
                record.id,
                type(exc).__name__,
            )
            if not lease_lost.is_set():
                self._promote_to_text(
                    record.id,
                    owner,
                    f"panorama_generation_failed:{type(exc).__name__}",
                )
            return

        if lease_lost.is_set():
            return
        caption = job.caption or build_panorama_caption(job)
        result, error = self._send_image_with_retry(
            record,
            owner,
            job,
            artifact.jpeg_bytes,
            caption,
            lease_lost,
        )
        if result is None:
            if error != "panorama_lease_lost" and not lease_lost.is_set():
                self._promote_to_text(record.id, owner, error)
            return

        provider_message_id = self._provider_message_id(result)
        if not provider_message_id:
            self._promote_to_text(
                record.id, owner, "panorama_provider_message_id_missing"
            )
            return

        if not self._complete_success(
            record, owner, job, provider_message_id, lease_lost
        ):
            logger.critical(
                "Panorama id=%s aceito pela Z-API, mas não concluído no SQLite",
                record.id,
            )
            return

        self._wake_text()

        logger.info(
            "Panorama %dx%d enviado (messageId=%s)",
            artifact.width,
            artifact.height,
            provider_message_id,
        )

    def _run(self) -> None:
        owner = self._owner
        try:
            while not self._stop_event.is_set():
                self._recover_abandoned()
                try:
                    record = self.db.claim_notification(
                        channel="panorama",
                        lease_owner=owner,
                        lease_seconds=self.lease_seconds,
                    )
                except Exception:
                    logger.exception("Falha ao reclamar panorama da outbox")
                    self._wake_event.wait(self.idle_poll_seconds)
                    self._wake_event.clear()
                    continue

                if record is None:
                    try:
                        wait_seconds = self.db.notification_wait_seconds(
                            "panorama",
                            default=self.idle_poll_seconds,
                            maximum=self.idle_poll_seconds,
                        )
                    except Exception:
                        wait_seconds = self.idle_poll_seconds
                    self._wake_event.wait(wait_seconds)
                    self._wake_event.clear()
                    continue

                heartbeat_finished = threading.Event()
                lease_lost = threading.Event()
                heartbeat = threading.Thread(
                    target=self._heartbeat,
                    args=(record.id, owner, heartbeat_finished, lease_lost),
                    name=f"tracker-panorama-lease-{record.id}",
                    daemon=True,
                )
                heartbeat.start()
                try:
                    self._process(record, owner, lease_lost)
                except Exception as exc:
                    logger.exception("Falha inesperada no panorama id=%s", record.id)
                    if not lease_lost.is_set():
                        self._promote_to_text(
                            record.id,
                            owner,
                            f"panorama_worker_error:{type(exc).__name__}",
                        )
                finally:
                    heartbeat_finished.set()
                    heartbeat.join(timeout=min(1.0, self.lease_seconds))
        finally:
            try:
                self.db.release_notification_leases(owner)
            except Exception:
                logger.exception("Falha ao liberar leases do panorama")
            try:
                self.generator.close()
            except Exception:
                logger.exception("Falha ao encerrar gerador de panoramas")

    def close(self, timeout: float = 35.0) -> None:
        """Para novas entradas e dá prazo ao trabalho já reclamado."""

        with self._state_lock:
            self._closed = True
        self._stop_event.set()
        self._wake_event.set()

        graceful_timeout = max(0.0, float(timeout))
        self._thread.join(timeout=graceful_timeout)
        if self._thread.is_alive():
            cancel = getattr(self.generator, "cancel", None)
            if callable(cancel):
                try:
                    cancel()
                except Exception:
                    logger.exception("Falha ao cancelar gerador de panorama")
            self._thread.join(timeout=min(2.0, max(0.1, graceful_timeout)))

        if self._thread.is_alive():
            logger.warning(
                "Worker de panorama não encerrou dentro de %.1fs", timeout
            )

    @property
    def closed(self) -> bool:
        with self._state_lock:
            return self._closed
