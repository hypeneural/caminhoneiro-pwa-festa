from __future__ import annotations

import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.tracker.models import VehicleState
from app.tracker.notifications import AsyncZAPIDispatcher
from app.tracker.tracker_db import TrackerDB


class FakeZAPI:
    def __init__(
        self,
        *,
        text_failures: int = 0,
        block_location: bool = False,
    ) -> None:
        self.text_failures = text_failures
        self.block_location = block_location
        self.text_calls = 0
        self.location_calls = 0
        self._lock = threading.Lock()
        self.text_sent = threading.Event()
        self.location_started = threading.Event()
        self.location_release = threading.Event()

    def send_text(self, phone: str, message: str):
        with self._lock:
            self.text_calls += 1
            call_number = self.text_calls
        if call_number <= self.text_failures:
            return None
        self.text_sent.set()
        return {"messageId": f"text-{call_number}"}

    def send_location(
        self,
        phone: str,
        latitude: float,
        longitude: float,
        title: str,
        address: str,
    ):
        with self._lock:
            self.location_calls += 1
            call_number = self.location_calls
        self.location_started.set()
        if self.block_location:
            self.location_release.wait(3.0)
        return {"messageId": f"location-{call_number}"}


class NotificationOutboxTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db = TrackerDB(str(Path(self._tmp.name) / "tracker.db"))
        self.dispatchers: list[AsyncZAPIDispatcher] = []

    def tearDown(self) -> None:
        for dispatcher in self.dispatchers:
            dispatcher.close(timeout=1.0)
        self._tmp.cleanup()

    def dispatcher(self, zapi: FakeZAPI, **kwargs) -> AsyncZAPIDispatcher:
        options = {
            "zapi": zapi,
            "db": self.db,
            "retry_backoff_seconds": (0.01, 0.02),
            "lease_seconds": 1.0,
            "idle_poll_seconds": 0.005,
            "text_ttl_seconds": 5.0,
            "location_ttl_seconds": 5.0,
        }
        options.update(kwargs)
        result = AsyncZAPIDispatcher(**options)
        self.dispatchers.append(result)
        return result

    def test_blocked_location_does_not_block_text(self) -> None:
        zapi = FakeZAPI(block_location=True)
        dispatcher = self.dispatcher(zapi)

        self.assertTrue(
            dispatcher.try_submit_location(
                "vehicle-1",
                "location:one",
                "5548999999999",
                -27.24,
                -48.63,
                "Localizacao",
                "Rua A",
            )
        )
        self.assertTrue(zapi.location_started.wait(1.0))

        self.assertTrue(
            dispatcher.try_submit_text(
                "vehicle-1",
                "text:one",
                "5548999999999",
                "Mensagem independente",
            )
        )
        self.assertTrue(
            zapi.text_sent.wait(1.0),
            "worker de texto ficou bloqueado pelo worker de localizacao",
        )
        self.assertFalse(zapi.location_release.is_set())

        zapi.location_release.set()
        self.assertTrue(dispatcher.wait_for_idle(timeout=2.0))

    def test_concurrent_dedupe_inserts_exactly_once(self) -> None:
        zapi = FakeZAPI()
        dispatcher = self.dispatcher(zapi)

        def submit(index: int) -> bool:
            return dispatcher.try_submit_text(
                "vehicle-1",
                "same-dedupe",
                "5548999999999",
                f"Mensagem {index}",
            )

        with ThreadPoolExecutor(max_workers=20) as pool:
            accepted = list(pool.map(submit, range(20)))

        self.assertEqual(sum(accepted), 1)
        self.assertTrue(dispatcher.wait_for_idle(timeout=2.0))
        self.assertEqual(
            self.db.count_notifications(
                channels=("text",),
                dedupe_key="same-dedupe",
            ),
            1,
        )
        self.assertEqual(zapi.text_calls, 1)

        original = self.db.get_notification(
            channel="text",
            dedupe_key="same-dedupe",
        )
        self.assertIsNotNone(original)
        self.assertFalse(
            dispatcher.try_submit_text(
                "vehicle-1",
                "same-dedupe",
                "5548999999999",
                "Nao pode sobrescrever",
            )
        )
        self.assertNotEqual(original.payload["message"], "Nao pode sobrescrever")

    def test_text_content_key_is_persisted(self) -> None:
        zapi = FakeZAPI()
        dispatcher = self.dispatcher(zapi)
        accepted = dispatcher.try_submit_text(
            "vehicle-1",
            "text:content-key",
            "5548999999999",
            "Mensagem de fallback",
            content_key="movement:vehicle-1:42",
        )
        self.assertTrue(accepted)
        self.assertTrue(dispatcher.wait_for_idle(timeout=2.0))
        job = self.db.get_notification(
            channel="text",
            dedupe_key="text:content-key",
        )
        self.assertIsNotNone(job)
        self.assertEqual(job.content_key, "movement:vehicle-1:42")

    def test_wake_text_sets_worker_event(self) -> None:
        zapi = FakeZAPI()
        dispatcher = self.dispatcher(zapi)
        dispatcher.close(timeout=1.0)
        wake = threading.Event()
        dispatcher._wake_events["text"] = wake
        dispatcher.wake_text()
        self.assertTrue(wake.is_set())

    def test_expired_lease_is_recovered_atomically(self) -> None:
        now = datetime.now(timezone.utc)
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="text",
                dedupe_key="lease",
                payload={"phone": "1", "message": "teste"},
                created_at=now,
                expires_at=now + timedelta(minutes=1),
                max_attempts=3,
            )
        )

        first = self.db.claim_notification(
            channel="text",
            lease_owner="worker-a",
            lease_seconds=1,
            now=now,
        )
        self.assertIsNotNone(first)
        second = self.db.claim_notification(
            channel="text",
            lease_owner="worker-b",
            lease_seconds=1,
            now=now + timedelta(seconds=2),
        )
        self.assertIsNotNone(second)
        self.assertEqual(first.id, second.id)
        self.assertEqual(second.attempts, 2)
        self.assertEqual(second.lease_owner, "worker-b")

    def test_retry_then_success(self) -> None:
        zapi = FakeZAPI(text_failures=1)
        dispatcher = self.dispatcher(zapi)
        self.assertTrue(
            dispatcher.try_submit_text(
                "vehicle-1",
                "retry",
                "5548999999999",
                "Tentar novamente",
            )
        )

        self.assertTrue(dispatcher.wait_for_idle(timeout=2.0))
        job = self.db.get_notification(channel="text", dedupe_key="retry")
        self.assertIsNotNone(job)
        self.assertEqual(job.status, "sent")
        self.assertEqual(job.attempts, 2)
        self.assertEqual(job.provider_message_id, "text-2")
        self.assertEqual(zapi.text_calls, 2)
        self.assertEqual(
            self.db.load_state("vehicle-1").last_message_id,
            "text-2",
        )

    def test_stale_state_save_does_not_erase_delivery_message_id(self) -> None:
        stale = VehicleState(vehicle_id="vehicle-1")
        self.db.save_state(stale)
        self.db.record_delivery_message_id("vehicle-1", "provider-123")

        stale.current_status = "MOVING"
        stale.last_message_id = None
        self.db.save_state(stale)

        loaded = self.db.load_state("vehicle-1")
        self.assertEqual(loaded.last_message_id, "provider-123")
        self.assertEqual(loaded.current_status, "MOVING")

    def test_ttl_expires_without_calling_zapi(self) -> None:
        now = datetime.now(timezone.utc)
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="text",
                dedupe_key="expired",
                payload={"phone": "1", "message": "velha"},
                created_at=now - timedelta(seconds=2),
                expires_at=now - timedelta(seconds=1),
            )
        )
        zapi = FakeZAPI()
        dispatcher = self.dispatcher(zapi)

        self.assertTrue(dispatcher.wait_for_idle(timeout=1.0))
        job = self.db.get_notification(channel="text", dedupe_key="expired")
        self.assertIsNotNone(job)
        self.assertEqual(job.status, "expired")
        self.assertEqual(zapi.text_calls, 0)

    def test_shutdown_preserves_not_yet_due_job(self) -> None:
        now = datetime.now(timezone.utc)
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="text",
                dedupe_key="future",
                payload={"phone": "1", "message": "futura"},
                created_at=now,
                available_at=now + timedelta(minutes=1),
                expires_at=now + timedelta(minutes=2),
            )
        )
        zapi = FakeZAPI()
        dispatcher = self.dispatcher(zapi)
        dispatcher.close(timeout=1.0)

        job = self.db.get_notification(channel="text", dedupe_key="future")
        self.assertIsNotNone(job)
        self.assertEqual(job.status, "queued")
        self.assertEqual(job.attempts, 0)
        self.assertEqual(zapi.text_calls, 0)


if __name__ == "__main__":
    unittest.main()
