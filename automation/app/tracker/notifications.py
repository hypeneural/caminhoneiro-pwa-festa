"""Outbox duravel e workers independentes para notificacoes da Z-API."""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence

from .tracker_db import NotificationOutboxJob, TrackerDB
from .zapi_client import ZAPIClient

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AsyncZAPIDispatcher:
    """Envia texto e localizacao em workers totalmente independentes.

    A fila real e a tabela notification_outbox. Os eventos de thread servem
    somente para acordar os workers rapidamente; portanto, reiniciar o
    processo nao perde trabalhos aceitos.
    """

    _CHANNELS = ("text", "location")

    def __init__(
        self,
        *,
        zapi: ZAPIClient,
        db: TrackerDB,
        text_ttl_seconds: float = 3600.0,
        location_ttl_seconds: float = 300.0,
        max_attempts: int = 5,
        retry_backoff_seconds: Sequence[float] = (2.0, 5.0, 15.0, 45.0, 120.0),
        lease_seconds: float = 60.0,
        idle_poll_seconds: float = 0.25,
    ):
        if max_attempts < 1:
            raise ValueError("max_attempts deve ser positivo")
        if lease_seconds <= 0:
            raise ValueError("lease_seconds deve ser positivo")
        if idle_poll_seconds <= 0:
            raise ValueError("idle_poll_seconds deve ser positivo")
        if not retry_backoff_seconds:
            raise ValueError("retry_backoff_seconds nao pode ser vazio")
        if any(delay < 0 for delay in retry_backoff_seconds):
            raise ValueError("retry_backoff_seconds nao aceita valores negativos")

        self.zapi = zapi
        self.db = db
        self.text_ttl_seconds = max(0.0, float(text_ttl_seconds))
        self.location_ttl_seconds = max(0.0, float(location_ttl_seconds))
        self.max_attempts = max_attempts
        self.retry_backoff_seconds = tuple(float(v) for v in retry_backoff_seconds)
        self.lease_seconds = float(lease_seconds)
        self.idle_poll_seconds = float(idle_poll_seconds)

        self._instance_id = uuid.uuid4().hex
        self._stop_event = threading.Event()
        self._wake_events = {
            channel: threading.Event() for channel in self._CHANNELS
        }
        self._state_lock = threading.Lock()
        self._idle_condition = threading.Condition()
        self._accepting = True
        self._threads: dict[str, threading.Thread] = {}

        for channel in self._CHANNELS:
            thread = threading.Thread(
                target=self._worker,
                args=(channel,),
                name=f"tracker-zapi-{channel}",
                daemon=True,
            )
            self._threads[channel] = thread
            thread.start()

    @staticmethod
    def _normalise_time(value: Optional[datetime]) -> datetime:
        if value is None:
            return _utc_now()
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def _default_expiry(
        self,
        *,
        created_at: datetime,
        expires_at: Optional[datetime],
        ttl_seconds: float,
    ) -> datetime:
        if expires_at is not None:
            return self._normalise_time(expires_at)
        return created_at + timedelta(seconds=ttl_seconds)

    def _enqueue(
        self,
        *,
        vehicle_id: str,
        channel: str,
        dedupe_key: str,
        payload: dict,
        created_at: Optional[datetime],
        expires_at: Optional[datetime],
        ttl_seconds: float,
        content_key: Optional[str] = None,
        completion_separator_count: int = 0,
        completion_wait_channel: Optional[str] = None,
        completion_wait_dedupe_key: Optional[str] = None,
    ) -> bool:
        with self._state_lock:
            if not self._accepting:
                return False

        created = self._normalise_time(created_at)
        expiry = self._default_expiry(
            created_at=created,
            expires_at=expires_at,
            ttl_seconds=ttl_seconds,
        )
        try:
            inserted = self.db.enqueue_notification(
                vehicle_id=vehicle_id,
                channel=channel,
                dedupe_key=dedupe_key,
                payload=payload,
                content_key=content_key,
                max_attempts=self.max_attempts,
                created_at=created,
                expires_at=expiry,
                completion_separator_count=completion_separator_count,
                completion_separator_phone=(
                    str(payload.get("phone") or "")
                    if completion_separator_count
                    else None
                ),
                completion_separator_expires_at=expiry,
                completion_wait_channel=completion_wait_channel,
                completion_wait_dedupe_key=completion_wait_dedupe_key,
            )
        except Exception:
            logger.exception(
                "Falha ao persistir notificacao %s/%s",
                channel,
                dedupe_key,
            )
            return False

        if inserted:
            self._wake_events[channel].set()
            with self._idle_condition:
                self._idle_condition.notify_all()
        return inserted

    def try_submit_text(
        self,
        vehicle_id: str,
        dedupe_key: str,
        phone: str,
        message: str,
        *,
        created_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        content_key: Optional[str] = None,
        completion_separator_count: int = 0,
        completion_wait_channel: Optional[str] = None,
        completion_wait_dedupe_key: Optional[str] = None,
    ) -> bool:
        """Persiste texto e separadores finais sem executar rede no chamador."""

        if not vehicle_id or not dedupe_key or not phone or not message:
            return False
        return self._enqueue(
            vehicle_id=vehicle_id,
            channel="text",
            dedupe_key=dedupe_key,
            payload={"phone": phone, "message": message},
            created_at=created_at,
            expires_at=expires_at,
            ttl_seconds=self.text_ttl_seconds,
            content_key=content_key,
            completion_separator_count=completion_separator_count,
            completion_wait_channel=completion_wait_channel,
            completion_wait_dedupe_key=completion_wait_dedupe_key,
        )

    def wake_text(self) -> None:
        """Acorda o worker de texto após uma promoção externa na outbox."""

        self._wake_events["text"].set()
        with self._idle_condition:
            self._idle_condition.notify_all()

    def try_submit_location(
        self,
        vehicle_id: str,
        dedupe_key: str,
        phone: str,
        latitude: float,
        longitude: float,
        title: str,
        address: str,
        *,
        created_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
    ) -> bool:
        """Persiste uma localizacao e retorna sem executar rede no chamador."""

        if not vehicle_id or not dedupe_key or not phone or not title:
            return False
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            return False
        return self._enqueue(
            vehicle_id=vehicle_id,
            channel="location",
            dedupe_key=dedupe_key,
            payload={
                "phone": phone,
                "latitude": float(latitude),
                "longitude": float(longitude),
                "title": title,
                "address": address,
            },
            created_at=created_at,
            expires_at=expires_at,
            ttl_seconds=self.location_ttl_seconds,
        )

    def _retry_delay(self, attempts: int) -> float:
        index = min(max(0, attempts - 1), len(self.retry_backoff_seconds) - 1)
        return self.retry_backoff_seconds[index]

    @staticmethod
    def _provider_message_id(result: object) -> Optional[str]:
        if not isinstance(result, dict):
            return None
        value = result.get("messageId") or result.get("zaapId") or result.get("id")
        return str(value) if value else None

    def _send(self, job: NotificationOutboxJob) -> object:
        payload = job.payload
        if job.channel == "text":
            return self.zapi.send_text(payload["phone"], payload["message"])
        if job.channel == "location":
            return self.zapi.send_location(
                payload["phone"],
                payload["latitude"],
                payload["longitude"],
                payload["title"],
                payload.get("address", ""),
            )
        raise ValueError(f"canal nao suportado: {job.channel}")

    def _process(self, job: NotificationOutboxJob, owner: str) -> None:
        now = _utc_now()
        if job.expires_at is not None and job.expires_at <= now:
            self.db.mark_notification_expired(
                job.id,
                lease_owner=owner,
                expired_at=now,
                error="ttl_expired_before_send",
            )
            return

        try:
            result = self._send(job)
        except Exception as exc:
            error = type(exc).__name__
            logger.error(
                "Falha inesperada no envio %s da outbox id=%s (%s)",
                job.channel,
                job.id,
                error,
            )
            self.db.mark_notification_retry(
                job.id,
                lease_owner=owner,
                error=error,
                retry_at=_utc_now() + timedelta(
                    seconds=self._retry_delay(job.attempts)
                ),
            )
            return

        provider_message_id = self._provider_message_id(result)
        if provider_message_id:
            self.db.mark_notification_success(
                job.id,
                lease_owner=owner,
                provider_message_id=provider_message_id,
                sent_at=_utc_now(),
            )
            return

        failure_getter = getattr(self.zapi, "get_last_failure", None)
        failure = failure_getter() if callable(failure_getter) else None
        failure_code = getattr(failure, "code", None)
        if failure is not None and not getattr(failure, "retryable", True):
            self.db.mark_notification_dead(
                job.id,
                lease_owner=owner,
                error=failure_code or "zapi_terminal_failure",
                failed_at=_utc_now(),
            )
            return

        self.db.mark_notification_retry(
            job.id,
            lease_owner=owner,
            error=failure_code or "zapi_rejected_or_unavailable",
            retry_at=_utc_now() + timedelta(
                seconds=self._retry_delay(job.attempts)
            ),
        )

    def _worker(self, channel: str) -> None:
        owner = f"{self._instance_id}:{channel}"
        wake = self._wake_events[channel]
        try:
            while not self._stop_event.is_set():
                try:
                    job = self.db.claim_notification(
                        channel=channel,
                        lease_owner=owner,
                        lease_seconds=self.lease_seconds,
                    )
                except Exception:
                    logger.exception("Falha ao reclamar item da outbox %s", channel)
                    wake.wait(self.idle_poll_seconds)
                    wake.clear()
                    continue

                if job is None:
                    wait_seconds = self.db.notification_wait_seconds(
                        channel,
                        default=self.idle_poll_seconds,
                        maximum=self.idle_poll_seconds,
                    )
                    wake.wait(wait_seconds)
                    wake.clear()
                    continue

                if self._stop_event.is_set():
                    self.db.release_notification_lease(job.id, owner)
                    break

                try:
                    self._process(job, owner)
                except Exception as exc:
                    logger.exception(
                        "Worker %s nao conseguiu finalizar outbox id=%s",
                        channel,
                        job.id,
                    )
                    try:
                        self.db.mark_notification_retry(
                            job.id,
                            lease_owner=owner,
                            error=f"worker_error:{type(exc).__name__}",
                            retry_at=_utc_now() + timedelta(
                                seconds=self._retry_delay(job.attempts)
                            ),
                        )
                    except Exception:
                        logger.exception(
                            "Falha ao devolver outbox id=%s para retry",
                            job.id,
                        )
                finally:
                    with self._idle_condition:
                        self._idle_condition.notify_all()
        finally:
            try:
                self.db.release_notification_leases(owner)
            except Exception:
                logger.exception("Falha ao liberar leases do worker %s", channel)
            with self._idle_condition:
                self._idle_condition.notify_all()

    def wait_for_idle(self, timeout: float = 30.0) -> bool:
        """Espera ate nao haver itens queued/retry/inflight nos dois canais."""

        deadline = time.monotonic() + max(0.0, timeout)
        with self._idle_condition:
            while self.db.count_notifications(
                statuses=("queued", "retry", "inflight"),
                channels=self._CHANNELS,
            ):
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    return False
                self._idle_condition.wait(min(remaining, self.idle_poll_seconds))
        return True

    def close(self, timeout: float = 10.0) -> None:
        """Para novas entradas e preserva no SQLite o que nao terminou."""

        with self._state_lock:
            self._accepting = False
        self._stop_event.set()
        for wake in self._wake_events.values():
            wake.set()

        deadline = time.monotonic() + max(0.0, timeout)
        for thread in self._threads.values():
            remaining = max(0.0, deadline - time.monotonic())
            thread.join(remaining)
            if thread.is_alive():
                logger.warning(
                    "Worker %s nao encerrou em %.1fs; lease sera recuperado",
                    thread.name,
                    timeout,
                )

    @property
    def closed(self) -> bool:
        with self._state_lock:
            return not self._accepting

