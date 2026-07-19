from __future__ import annotations

import tempfile
import threading
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path

from app.tracker.engine import TrackerEngine
from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.notifications import AsyncZAPIDispatcher
from app.tracker.panorama import PanoramaDispatcher
from app.tracker.streetview import PanoramaArtifact, StreetViewUnavailable
from app.tracker.tracker_db import TrackerDB


class RecordingZAPI:
    def __init__(
        self,
        *,
        fail_image: bool = False,
        location_failures: int = 0,
    ) -> None:
        self.fail_image = fail_image
        self.location_failures = location_failures
        self.location_calls = 0
        self.lock = threading.Lock()
        self.attempts: list[dict] = []
        self.delivered: list[dict] = []

    def _record(self, channel: str, payload: dict, *, succeeds: bool = True):
        with self.lock:
            entry = {"channel": channel, **payload}
            self.attempts.append(entry)
            if not succeeds:
                return None
            self.delivered.append(entry)
            count = len(self.delivered)
        return {"messageId": f"{channel}-{count}"}

    def send_text(self, phone: str, message: str):
        return self._record(
            "text",
            {"phone": phone, "message": message},
        )

    def send_location(
        self,
        phone: str,
        latitude: float,
        longitude: float,
        title: str,
        address: str,
    ):
        self.location_calls += 1
        return self._record(
            "location",
            {
                "phone": phone,
                "latitude": latitude,
                "longitude": longitude,
                "title": title,
                "address": address,
            },
            succeeds=self.location_calls > self.location_failures,
        )

    def send_image_bytes(
        self,
        phone: str,
        image_bytes: bytes,
        caption: str,
    ):
        return self._record(
            "image",
            {
                "phone": phone,
                "image_bytes": image_bytes,
                "caption": caption,
            },
            succeeds=not self.fail_image,
        )

    def get_last_failure(self):
        return None


class FakeGenerator:
    def __init__(self, *, unavailable: bool = False) -> None:
        self.unavailable = unavailable
        self.calls: list[dict] = []
        self.closed = False

    def generate(self, **kwargs):
        self.calls.append(kwargs)
        if self.unavailable:
            raise StreetViewUnavailable("sem cobertura para a coordenada")
        return PanoramaArtifact(
            jpeg_bytes=b"\xff\xd8flow\xff\xd9",
            width=1280,
            height=952,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def close(self):
        self.closed = True

    def cancel(self):
        pass


class CachedGeocoder:
    def enrich(self, snapshot) -> bool:
        snapshot.address = "Avenida São José, Área Central"
        snapshot.street_name = "Avenida São José"
        return True


class TrackerFlowIntegrationTests(unittest.TestCase):
    PHONE = "5548996553954"
    VEHICLE_ID = "sao-cristovao"

    @staticmethod
    def _snapshot(now: datetime) -> VehicleSnapshot:
        return VehicleSnapshot(
            vehicle_id="sao-cristovao",
            name="Procissão de São Cristóvão",
            vehicle_type="main",
            lat=-27.24,
            lng=-48.63,
            speed_kmh=12,
            bearing=90,
            accuracy=5,
            battery=19,
            updated_at=now,
            server_time=now,
            stale=False,
            status="live",
        )

    def _runtime(
        self,
        directory: str,
        *,
        zapi,
        generator,
        notification_max_attempts: int = 1,
        notification_retry_backoff=(0,),
    ):
        db = TrackerDB(str(Path(directory) / "tracker.db"))
        notifications = AsyncZAPIDispatcher(
            zapi=zapi,
            db=db,
            max_attempts=notification_max_attempts,
            retry_backoff_seconds=notification_retry_backoff,
            lease_seconds=2,
            idle_poll_seconds=0.01,
        )
        panorama = PanoramaDispatcher(
            generator=generator,
            zapi=zapi,
            db=db,
            notification_dispatcher=notifications,
            max_job_age_seconds=60,
            send_attempts=1,
            send_retry_delays=(),
            lease_seconds=2,
            idle_poll_seconds=0.01,
            fallback_max_attempts=1,
            fallback_ttl_seconds=60,
        )
        engine = TrackerEngine(
            zapi=zapi,
            db=db,
            geocoder=object(),
            phone=self.PHONE,
            notification_dispatcher=notifications,
            panorama_dispatcher=panorama,
            geocode_dispatcher=CachedGeocoder(),
        )
        return db, notifications, panorama, engine

    def _wait_for_flow(self, panorama, notifications) -> None:
        deadline = time.monotonic() + 3
        while (
            panorama.has_pending(self.VEHICLE_ID)
            and time.monotonic() < deadline
        ):
            time.sleep(0.01)
        self.assertFalse(
            panorama.has_pending(self.VEHICLE_ID),
            "o panorama não concluiu ou não promoveu o fallback",
        )
        self.assertTrue(notifications.wait_for_idle(timeout=3))

    @staticmethod
    def _channels(entries: list[dict]) -> list[str]:
        return [entry["channel"] for entry in entries]

    def _assert_three_final_separators(self, zapi: RecordingZAPI) -> list[dict]:
        self.assertGreaterEqual(len(zapi.delivered), 3)
        separators = zapi.delivered[-3:]
        self.assertEqual(
            [(item["channel"], item.get("message")) for item in separators],
            [("text", "."), ("text", "."), ("text", ".")],
        )
        self.assertTrue(all(item["phone"] == self.PHONE for item in separators))
        return zapi.delivered[:-3]

    @staticmethod
    def _content_key(now: datetime, anchor: str | None = None) -> str:
        actual_anchor = anchor or f"moving:{now.isoformat()}"
        return f"sao-cristovao:{actual_anchor}:content"

    def test_success_sends_location_and_image_with_full_caption_only(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI()
            generator = FakeGenerator()
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)

            try:
                state = db.load_state(snapshot.vehicle_id)
                engine.process_snapshot(snapshot, state, now)
                self._wait_for_flow(panorama, notifications)

                flow_entries = self._assert_three_final_separators(zapi)
                delivered_channels = self._channels(flow_entries)
                self.assertCountEqual(delivered_channels, ["location", "image"])
                self.assertNotIn("text", delivered_channels)
                image = next(
                    entry for entry in zapi.delivered if entry["channel"] == "image"
                )
                caption = image["caption"]
                self.assertIn("Procissão de São Cristóvão", caption)
                self.assertIn("Avenida São José", caption)
                self.assertIn("🚗 *Em deslocamento:* *12 km/h*", caption)
                self.assertIn("🪫 *Bateria fraca:* *19%*", caption)
                self.assertIn("Em tempo real:", caption)
                self.assertIn("Imagem panorâmica aproximada", caption)
                self.assertNotIn("?", caption)
                self.assertEqual(caption.encode("utf-8").decode("utf-8"), caption)

                content_key = self._content_key(now)
                content = db.get_notification_by_content_key(content_key)
                self.assertIsNotNone(content)
                self.assertEqual(content.channel, "panorama")
                self.assertEqual(content.status, "sent")
                self.assertEqual(db.count_notifications(content_key=content_key), 1)
                self.assertEqual(db.notification_counts()["sent"], 5)
                loaded = db.load_state(snapshot.vehicle_id)
                self.assertIsNotNone(loaded.last_image_sent_at)
                self.assertIsNotNone(loaded.last_message_id)
                self.assertEqual(loaded.current_status, "MOVING")
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)

    def test_no_street_view_promotes_same_content_to_text(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI()
            generator = FakeGenerator(unavailable=True)
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)

            try:
                state = db.load_state(snapshot.vehicle_id)
                engine.process_snapshot(snapshot, state, now)
                self._wait_for_flow(panorama, notifications)

                flow_entries = self._assert_three_final_separators(zapi)
                delivered_channels = self._channels(flow_entries)
                self.assertCountEqual(delivered_channels, ["location", "text"])
                self.assertNotIn("image", delivered_channels)
                self.assertNotIn("image", self._channels(zapi.attempts))
                fallback = next(
                    entry
                    for entry in flow_entries
                    if entry["channel"] == "text"
                )["message"]
                self.assertIn("Procissão de São Cristóvão", fallback)
                self.assertIn("Avenida São José", fallback)
                self.assertIn("🚗 *Em deslocamento:* *12 km/h*", fallback)
                self.assertIn("🪫 *Bateria fraca:* *19%*", fallback)
                self.assertNotIn("?", fallback)
                self.assertEqual(fallback.encode("utf-8").decode("utf-8"), fallback)

                content_key = self._content_key(now)
                content = db.get_notification_by_content_key(content_key)
                self.assertIsNotNone(content)
                self.assertEqual(content.channel, "text")
                self.assertEqual(content.status, "sent")
                self.assertEqual(db.count_notifications(content_key=content_key), 1)
                self.assertEqual(
                    db.count_notifications(channels=("panorama",)),
                    0,
                )
                loaded = db.load_state(snapshot.vehicle_id)
                self.assertIsNotNone(loaded.last_image_unavailable_at)
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)

    def test_image_api_failure_falls_back_to_text_without_duplicate(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI(fail_image=True)
            generator = FakeGenerator()
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)

            try:
                state = db.load_state(snapshot.vehicle_id)
                engine.process_snapshot(snapshot, state, now)
                self._wait_for_flow(panorama, notifications)

                flow_entries = self._assert_three_final_separators(zapi)
                self.assertCountEqual(
                    self._channels(flow_entries),
                    ["location", "text"],
                )
                self.assertEqual(self._channels(zapi.attempts).count("image"), 1)
                self.assertNotIn("image", self._channels(zapi.delivered))
                attempted_caption = next(
                    entry for entry in zapi.attempts if entry["channel"] == "image"
                )["caption"]
                fallback = next(
                    entry
                    for entry in flow_entries
                    if entry["channel"] == "text"
                )["message"]
                self.assertIn(fallback, attempted_caption)
                self.assertNotIn("?", attempted_caption)

                content_key = self._content_key(now)
                content = db.get_notification_by_content_key(content_key)
                self.assertEqual(content.channel, "text")
                self.assertEqual(content.status, "sent")
                self.assertEqual(db.count_notifications(content_key=content_key), 1)
                self.assertEqual(db.notification_counts()["sent"], 5)
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)

    def test_panorama_cooldown_sends_location_and_text_without_capture(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI()
            generator = FakeGenerator()
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)

            try:
                state = db.load_state(snapshot.vehicle_id)
                state.last_image_attempt_at = now
                db.save_state(state)
                engine.process_snapshot(snapshot, state, now)
                self._wait_for_flow(panorama, notifications)

                flow_entries = self._assert_three_final_separators(zapi)
                self.assertCountEqual(
                    self._channels(flow_entries),
                    ["location", "text"],
                )
                self.assertNotIn("image", self._channels(zapi.attempts))
                self.assertEqual(generator.calls, [])
                content_key = self._content_key(now)
                content = db.get_notification_by_content_key(content_key)
                self.assertEqual(content.channel, "text")
                self.assertEqual(content.status, "sent")
                self.assertEqual(db.count_notifications(content_key=content_key), 1)
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)

    def test_repeated_logical_alert_keeps_one_content_row_and_one_send(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI()
            generator = FakeGenerator()
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)
            snapshot.address = "Avenida São José, Área Central"
            snapshot.street_name = "Avenida São José"
            alert_key = "moving:evento-único"

            try:
                engine._send_paired_alert(
                    "moving",
                    snapshot,
                    VehicleState(vehicle_id=snapshot.vehicle_id),
                    now,
                    alert_key=alert_key,
                )
                engine._send_paired_alert(
                    "moving",
                    snapshot,
                    VehicleState(vehicle_id=snapshot.vehicle_id),
                    now,
                    alert_key=alert_key,
                )
                self._wait_for_flow(panorama, notifications)

                content_key = self._content_key(now, alert_key)
                self.assertEqual(db.count_notifications(content_key=content_key), 1)
                self.assertEqual(
                    db.count_notifications(
                        content_key=content_key,
                        channels=("panorama",),
                        statuses=("sent",),
                    ),
                    1,
                )
                self.assertEqual(
                    db.count_notifications(
                        content_key=content_key,
                        channels=("text",),
                    ),
                    0,
                )
                self.assertEqual(self._channels(zapi.delivered).count("image"), 1)
                self.assertEqual(self._channels(zapi.delivered).count("text"), 3)
                self.assertEqual(self._channels(zapi.delivered).count("location"), 1)
                self.assertEqual(len(generator.calls), 1)
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)

    def test_location_retry_cannot_be_overtaken_by_final_separators(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            zapi = RecordingZAPI(location_failures=1)
            generator = FakeGenerator()
            db, notifications, panorama, engine = self._runtime(
                directory,
                zapi=zapi,
                generator=generator,
                notification_max_attempts=2,
                notification_retry_backoff=(0.05,),
            )
            now = datetime.now(timezone.utc)
            snapshot = self._snapshot(now)

            try:
                state = db.load_state(snapshot.vehicle_id)
                engine.process_snapshot(snapshot, state, now)
                self._wait_for_flow(panorama, notifications)

                flow_entries = self._assert_three_final_separators(zapi)
                self.assertCountEqual(
                    self._channels(flow_entries),
                    ["location", "image"],
                )
                self.assertEqual(
                    self._channels(zapi.attempts).count("location"),
                    2,
                )
                self.assertLess(
                    next(
                        index
                        for index, entry in enumerate(zapi.delivered)
                        if entry["channel"] == "location"
                    ),
                    len(zapi.delivered) - 3,
                )
            finally:
                panorama.close(timeout=2)
                notifications.close(timeout=2)


if __name__ == "__main__":
    unittest.main()
