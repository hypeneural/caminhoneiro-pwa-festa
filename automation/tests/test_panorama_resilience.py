from __future__ import annotations

import tempfile
import threading
import time
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.tracker.panorama import (
    PanoramaDispatcher,
    PanoramaJob,
    build_combined_panorama_caption,
)
from app.tracker.streetview import PanoramaArtifact, StreetViewUnavailable
from app.tracker.tracker_db import TrackerDB


class WakeSpy:
    def __init__(self) -> None:
        self.calls = 0
        self.called = threading.Event()

    def wake_text(self) -> None:
        self.calls += 1
        self.called.set()


class FakeGenerator:
    def __init__(
        self,
        *,
        delay: float = 0.0,
        unavailable: bool = False,
    ) -> None:
        self.delay = delay
        self.unavailable = unavailable
        self.generate_calls = 0
        self.started = threading.Event()
        self.closed = False
        self.cancelled = False
        self.jpeg = b"\xff\xd8durable-panorama\xff\xd9"

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        self.started.set()
        if self.delay:
            time.sleep(self.delay)
        if self.unavailable:
            raise StreetViewUnavailable("no_streetview_imagery")
        return PanoramaArtifact(
            jpeg_bytes=self.jpeg,
            width=1280,
            height=952,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def close(self) -> None:
        self.closed = True

    def cancel(self) -> None:
        self.cancelled = True


class BlockingGenerator(FakeGenerator):
    def __init__(self) -> None:
        super().__init__()
        self.release = threading.Event()

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        self.started.set()
        self.release.wait(5)
        if self.cancelled:
            raise RuntimeError("cancelled")
        return PanoramaArtifact(
            jpeg_bytes=self.jpeg,
            width=1280,
            height=952,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def cancel(self) -> None:
        self.cancelled = True
        self.release.set()


class FakeZAPI:
    def __init__(self, results=None) -> None:
        self.results = list(results or [])
        self.calls: list[tuple[str, bytes, str]] = []
        self.called = threading.Event()

    def send_image_bytes(self, phone, image_bytes, caption):
        self.calls.append((phone, image_bytes, caption))
        self.called.set()
        if self.results:
            value = self.results.pop(0)
            if isinstance(value, Exception):
                raise value
            return value
        return None

    def get_last_failure(self):
        return None


def make_job(
    vehicle_id: str = "vehicle-1",
    *,
    requested_at: datetime | None = None,
    fallback: bool = True,
) -> PanoramaJob:
    now = datetime.now(timezone.utc)
    message = "🚗 *Em deslocamento*\n🔋 *Bateria:* 90%\n📍 Avenida Paulista"
    return PanoramaJob(
        vehicle_id=vehicle_id,
        phone="5548996553954",
        latitude=-23.5614,
        longitude=-46.6559,
        vehicle_name="Veículo de apoio",
        address="Avenida Paulista, São Paulo/SP",
        street_name="Avenida Paulista",
        speed_kmh=18,
        battery=90,
        updated_at=now,
        requested_at=requested_at or now,
        event_type="moving",
        dedupe_key=f"panorama:{vehicle_id}",
        content_key=f"content:{vehicle_id}" if fallback else None,
        caption=build_combined_panorama_caption(message) if fallback else None,
        fallback_message=message if fallback else None,
        fallback_dedupe_key=f"text:{vehicle_id}" if fallback else None,
    )


class PanoramaDurableTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db = TrackerDB(str(Path(self._tmp.name) / "tracker.db"))
        self.dispatchers: list[PanoramaDispatcher] = []

    def tearDown(self) -> None:
        for dispatcher in self.dispatchers:
            dispatcher.close(timeout=1)
        self._tmp.cleanup()

    def dispatcher(self, generator, zapi, **kwargs) -> PanoramaDispatcher:
        options = {
            "generator": generator,
            "zapi": zapi,
            "db": self.db,
            "idle_poll_seconds": 0.01,
            "lease_seconds": 0.3,
            "send_retry_delays": (),
        }
        options.update(kwargs)
        dispatcher = PanoramaDispatcher(**options)
        self.dispatchers.append(dispatcher)
        return dispatcher

    def wait_content(self, content_key: str, *, timeout: float = 3.0):
        deadline = time.monotonic() + timeout
        record = self.db.get_notification_by_content_key(content_key)
        while (
            (record is None or record.status in ("queued", "retry", "inflight"))
            and time.monotonic() < deadline
        ):
            time.sleep(0.01)
            record = self.db.get_notification_by_content_key(content_key)
        return record

    def wait_legacy(self, dedupe_key: str, *, timeout: float = 3.0):
        deadline = time.monotonic() + timeout
        record = self.db.get_notification(
            channel="panorama",
            dedupe_key=dedupe_key,
        )
        while (
            (record is None or record.status in ("queued", "retry", "inflight"))
            and time.monotonic() < deadline
        ):
            time.sleep(0.01)
            record = self.db.get_notification(
                channel="panorama",
                dedupe_key=dedupe_key,
            )
        return record

    def test_combined_caption_preserves_status_and_adds_short_warning(self) -> None:
        status = "🚗 *Em deslocamento*\n🔋 *Bateria:* 90%"
        caption = build_combined_panorama_caption(status)
        self.assertTrue(caption.startswith(status))
        self.assertIn("Imagem panorâmica aproximada", caption)
        self.assertIn("outra data", caption)

    def test_success_uses_caption_and_completes_outbox_and_state(self) -> None:
        generator = FakeGenerator()
        zapi = FakeZAPI([{"messageId": "image-123"}])
        dispatcher = self.dispatcher(generator, zapi)
        current = make_job("success")

        self.assertTrue(dispatcher.try_submit(current))
        self.assertFalse(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "")

        self.assertIsNotNone(record)
        self.assertEqual(record.channel, "panorama")
        self.assertEqual(record.status, "sent")
        self.assertEqual(record.provider_message_id, "image-123")
        self.assertEqual(zapi.calls[0][2], current.caption)
        state = self.db.load_state(current.vehicle_id)
        self.assertIsNotNone(state.last_image_sent_at)
        self.assertEqual(state.last_image_street, current.street_name)
        self.assertEqual(state.last_message_id, "image-123")
        self.assertFalse(dispatcher.has_pending(current.vehicle_id))

    def test_retry_reuses_one_capture_and_the_same_jpeg(self) -> None:
        generator = FakeGenerator()
        zapi = FakeZAPI([None, {"messageId": "image-retry"}])
        dispatcher = self.dispatcher(generator, zapi, send_attempts=3)
        current = make_job("retry")

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "")

        self.assertEqual(record.status, "sent")
        self.assertEqual(generator.generate_calls, 1)
        self.assertEqual(len(zapi.calls), 2)
        self.assertEqual(zapi.calls[0][1], zapi.calls[1][1])

    def test_exhausted_send_promotes_same_row_and_wakes_text(self) -> None:
        generator = FakeGenerator()
        zapi = FakeZAPI([None, None, None])
        wake = WakeSpy()
        dispatcher = self.dispatcher(
            generator,
            zapi,
            notification_dispatcher=wake,
            send_attempts=3,
        )
        current = make_job("fallback")

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "")

        self.assertEqual(record.channel, "text")
        self.assertEqual(record.dedupe_key, current.fallback_dedupe_key)
        self.assertEqual(record.payload["message"], current.fallback_message)
        self.assertEqual(record.payload["phone"], current.phone)
        self.assertEqual(generator.generate_calls, 1)
        self.assertEqual(len(zapi.calls), 3)
        self.assertTrue(wake.called.wait(1))
        self.assertGreaterEqual(wake.calls, 1)

    def test_expired_job_promotes_without_capture(self) -> None:
        generator = FakeGenerator()
        zapi = FakeZAPI([])
        wake = WakeSpy()
        dispatcher = self.dispatcher(
            generator,
            zapi,
            notification_dispatcher=wake,
            max_job_age_seconds=0.1,
        )
        current = make_job(
            "expired",
            requested_at=datetime.now(timezone.utc) - timedelta(seconds=2),
        )

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "")

        self.assertEqual(record.channel, "text")
        self.assertEqual(generator.generate_calls, 0)
        self.assertEqual(zapi.calls, [])
        self.assertTrue(wake.called.wait(1))

    def test_streetview_unavailable_promotes_same_row_and_records_state(self) -> None:
        generator = FakeGenerator(unavailable=True)
        zapi = FakeZAPI([])
        wake = WakeSpy()
        dispatcher = self.dispatcher(
            generator,
            zapi,
            notification_dispatcher=wake,
        )
        current = make_job("unavailable")

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "")

        self.assertEqual(record.channel, "text")
        self.assertEqual(record.id, self.db.get_notification_by_content_key(
            current.content_key or ""
        ).id)
        state = self.db.load_state(current.vehicle_id)
        self.assertIsNotNone(state.last_image_unavailable_at)
        self.assertEqual(state.last_image_unavailable_lat, current.latitude)
        self.assertEqual(zapi.calls, [])
        self.assertTrue(wake.called.wait(1))

    def test_heartbeat_keeps_short_lease_during_slow_capture(self) -> None:
        generator = FakeGenerator(delay=0.45)
        zapi = FakeZAPI([{"messageId": "heartbeat-ok"}])
        renew_calls = []
        original = self.db.renew_notification_lease

        def recording_renew(*args, **kwargs):
            renew_calls.append(args[0])
            return original(*args, **kwargs)

        self.db.renew_notification_lease = recording_renew
        dispatcher = self.dispatcher(
            generator,
            zapi,
            lease_seconds=0.15,
        )
        current = make_job("heartbeat")

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_content(current.content_key or "", timeout=4)

        self.assertEqual(record.status, "sent")
        self.assertGreaterEqual(len(renew_calls), 3)
        self.assertEqual(len(zapi.calls), 1)

    def test_lost_lease_during_capture_prevents_zapi_call(self) -> None:
        generator = FakeGenerator(delay=0.3)
        zapi = FakeZAPI([{"messageId": "must-not-send"}])
        lease_lost = threading.Event()

        def reject_renewal(*args, **kwargs):
            lease_lost.set()
            return False

        self.db.renew_notification_lease = reject_renewal
        dispatcher = self.dispatcher(
            generator,
            zapi,
            lease_seconds=0.12,
        )
        current = make_job("lease-lost")

        self.assertTrue(dispatcher.try_submit(current))
        self.assertTrue(generator.started.wait(1))
        self.assertTrue(lease_lost.wait(1))
        dispatcher.close(timeout=1)

        self.assertEqual(zapi.calls, [])

    def test_startup_recovers_old_queued_panorama_as_text(self) -> None:
        old = make_job(
            "restart",
            requested_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        fallback_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        payload = {
            "vehicle_id": old.vehicle_id,
            "phone": old.phone,
            "latitude": old.latitude,
            "longitude": old.longitude,
            "vehicle_name": old.vehicle_name,
            "address": old.address,
            "street_name": old.street_name,
            "speed_kmh": old.speed_kmh,
            "battery": old.battery,
            "updated_at": old.updated_at.isoformat(),
            "requested_at": old.requested_at.isoformat(),
            "event_type": old.event_type,
            "caption": old.caption,
            "fallback_dedupe_key": old.fallback_dedupe_key,
            "fallback_payload": {
                "phone": old.phone,
                "message": old.fallback_message,
            },
            "fallback_max_attempts": 5,
            "fallback_expires_at": fallback_expiry.isoformat(),
        }
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id=old.vehicle_id,
                channel="panorama",
                dedupe_key=old.dedupe_key or "",
                content_key=old.content_key,
                payload=payload,
                max_attempts=3,
                created_at=old.requested_at,
            )
        )
        wake = WakeSpy()
        generator = FakeGenerator()
        self.dispatcher(
            generator,
            FakeZAPI([]),
            notification_dispatcher=wake,
            recovery_cutoff=datetime.now(timezone.utc),
        )

        record = self.wait_content(old.content_key or "")
        self.assertEqual(record.channel, "text")
        self.assertEqual(record.payload["message"], old.fallback_message)
        self.assertEqual(generator.generate_calls, 0)
        self.assertTrue(wake.called.wait(1))

    def test_legacy_job_without_fallback_becomes_dead(self) -> None:
        generator = FakeGenerator(unavailable=True)
        zapi = FakeZAPI([])
        wake = WakeSpy()
        dispatcher = self.dispatcher(
            generator,
            zapi,
            notification_dispatcher=wake,
        )
        current = make_job("legacy", fallback=False)

        self.assertTrue(dispatcher.try_submit(current))
        record = self.wait_legacy(current.dedupe_key or "")

        self.assertEqual(record.channel, "panorama")
        self.assertEqual(record.status, "dead")
        self.assertEqual(record.last_error, "panorama_fallback_invalid")
        self.assertEqual(wake.calls, 0)

    def test_close_is_bounded_and_cancels_blocked_capture(self) -> None:
        generator = BlockingGenerator()
        zapi = FakeZAPI([])
        wake = WakeSpy()
        dispatcher = self.dispatcher(
            generator,
            zapi,
            notification_dispatcher=wake,
        )
        current = make_job("close")
        self.assertTrue(dispatcher.try_submit(current))
        self.assertTrue(generator.started.wait(1))

        started = time.monotonic()
        dispatcher.close(timeout=0.05)
        elapsed = time.monotonic() - started

        self.assertLess(elapsed, 0.5)
        self.assertTrue(generator.cancelled)
        self.assertTrue(generator.closed)
        self.assertEqual(zapi.calls, [])


if __name__ == "__main__":
    unittest.main()
