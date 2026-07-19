from __future__ import annotations

import sqlite3
import tempfile
import threading
import time
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.tracker.engine import TrackerEngine
from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.panorama import PanoramaDispatcher, PanoramaJob
from app.tracker.streetview import PanoramaArtifact, StreetViewUnavailable
from app.tracker.tracker_db import TrackerDB, _CREATE_TABLE_SQL


class FakeDispatcher:
    def __init__(self) -> None:
        self.jobs = []
        self.pending = False

    def has_pending(self, vehicle_id: str) -> bool:
        return self.pending

    def try_submit(self, job: PanoramaJob) -> bool:
        if self.pending:
            return False
        self.jobs.append(job)
        self.pending = True
        return True


def snapshot(now: datetime, *, lat: float = -27.24, lng: float = -48.63):
    return VehicleSnapshot(
        vehicle_id="sao-cristovao",
        name="Procissão",
        vehicle_type="main",
        lat=lat,
        lng=lng,
        speed_kmh=12,
        bearing=90,
        accuracy=5,
        battery=80,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live",
        address="Rua A, Tijucas/SC",
        street_name="Rua A",
        city="Tijucas",
    )


class PanoramaPolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.dispatcher = FakeDispatcher()
        self.engine = TrackerEngine(
            zapi=object(),
            db=object(),
            geocoder=object(),
            phone="5548999999999",
            panorama_dispatcher=self.dispatcher,
            image_retry_cooldown_minutes=5,
            image_street_change_min_distance_m=60,
        )
        self.now = datetime(2026, 7, 16, 15, 0, tzinfo=timezone.utc)

    def test_first_panorama_is_eligible(self) -> None:
        self.assertTrue(
            self.engine._should_schedule_panorama(
                "moving",
                snapshot(self.now),
                VehicleState(vehicle_id="sao-cristovao"),
                self.now,
            )
        )

    def test_retry_cooldown_blocks_attempt(self) -> None:
        state = VehicleState(
            vehicle_id="sao-cristovao",
            last_image_attempt_at=self.now - timedelta(minutes=4),
        )
        self.assertFalse(
            self.engine._should_schedule_panorama(
                "moving",
                snapshot(self.now),
                state,
                self.now,
            )
        )

    def test_distance_threshold_allows_after_interval(self) -> None:
        state = VehicleState(
            vehicle_id="sao-cristovao",
            last_image_sent_at=self.now - timedelta(minutes=16),
            last_image_sent_lat=-27.24,
            last_image_sent_lng=-48.63,
            last_image_street="Rua A",
        )
        self.assertTrue(
            self.engine._should_schedule_panorama(
                "moving",
                snapshot(self.now, lat=-27.243),
                state,
                self.now,
            )
        )

    def test_changed_street_requires_minimum_distance(self) -> None:
        state = VehicleState(
            vehicle_id="sao-cristovao",
            last_image_sent_at=self.now - timedelta(minutes=16),
            last_image_sent_lat=-27.24,
            last_image_sent_lng=-48.63,
            last_image_street="Rua Antiga",
        )
        near = snapshot(self.now, lat=-27.2402)
        near.street_name = "Rua Nova"
        far = snapshot(self.now, lat=-27.2407)
        far.street_name = "Rua Nova"

        self.assertFalse(
            self.engine._should_schedule_panorama(
                "moving",
                near,
                state,
                self.now,
            )
        )
        self.assertTrue(
            self.engine._should_schedule_panorama(
                "moving",
                far,
                state,
                self.now,
            )
        )

    def test_no_imagery_cooldown_uses_time_and_distance(self) -> None:
        state = VehicleState(
            vehicle_id="sao-cristovao",
            last_image_attempt_at=self.now - timedelta(hours=1),
            last_image_unavailable_at=self.now - timedelta(hours=1),
            last_image_unavailable_lat=-27.24,
            last_image_unavailable_lng=-48.63,
        )

        self.assertFalse(
            self.engine._should_schedule_panorama(
                "moving", snapshot(self.now), state, self.now
            )
        )
        self.assertTrue(
            self.engine._should_schedule_panorama(
                "moving",
                snapshot(self.now, lat=-27.246),
                state,
                self.now,
            )
        )

        later = self.now + timedelta(hours=7)
        self.assertTrue(
            self.engine._should_schedule_panorama(
                "moving", snapshot(later), state, later
            )
        )

    def test_stale_or_non_live_snapshot_is_blocked(self) -> None:
        stale = snapshot(self.now)
        stale.stale = True
        non_live = snapshot(self.now)
        non_live.status = "stale"
        state = VehicleState(vehicle_id="sao-cristovao")

        self.assertFalse(
            self.engine._should_schedule_panorama(
                "moving", stale, state, self.now
            )
        )
        self.assertFalse(
            self.engine._should_schedule_panorama(
                "moving", non_live, state, self.now
            )
        )
    def test_schedule_uses_tracker_phone(self) -> None:
        state = VehicleState(vehicle_id="sao-cristovao")
        self.engine._schedule_panorama(
            "moving",
            snapshot(self.now),
            state,
            self.now,
        )
        self.assertEqual(len(self.dispatcher.jobs), 1)
        self.assertEqual(self.dispatcher.jobs[0].phone, "5548999999999")
        self.assertEqual(state.last_image_attempt_at, self.now)


class TrackerDBImageTests(unittest.TestCase):
    def test_migrates_previous_schema(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.db"
            previous_schema = _CREATE_TABLE_SQL
            for column_line in (
                "    last_image_attempt_at  TEXT,\n",
                "    last_image_unavailable_at TEXT,\n",
                "    last_image_unavailable_lat REAL,\n",
                "    last_image_unavailable_lng REAL,\n",
            ):
                previous_schema = previous_schema.replace(column_line, "")
            conn = sqlite3.connect(path)
            try:
                conn.execute(previous_schema)
                conn.commit()
            finally:
                conn.close()

            TrackerDB(str(path))
            conn = sqlite3.connect(path)
            try:
                columns = {
                    row[1]
                    for row in conn.execute(
                        "PRAGMA table_info(runtime_state)"
                    ).fetchall()
                }
            finally:
                conn.close()

            self.assertIn("last_image_attempt_at", columns)
            self.assertIn("last_image_unavailable_at", columns)
            self.assertIn("last_image_unavailable_lat", columns)
            self.assertIn("last_image_unavailable_lng", columns)

    def test_stale_state_save_does_not_overwrite_image_result(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = TrackerDB(str(Path(directory) / "state.db"))
            initial = VehicleState(
                vehicle_id="v1",
                current_status="MOVING",
            )
            db.save_state(initial)
            stale_copy = db.load_state("v1")
            sent_at = datetime.now(timezone.utc)

            db.record_image_sent(
                vehicle_id="v1",
                sent_at=sent_at,
                latitude=-27.2,
                longitude=-48.6,
                street="Rua Persistida",
            )
            stale_copy.current_status = "STOPPED"
            db.save_state(stale_copy)

            loaded = db.load_state("v1")
            self.assertEqual(loaded.current_status, "STOPPED")
            self.assertEqual(loaded.last_image_street, "Rua Persistida")
            self.assertEqual(loaded.last_image_sent_lat, -27.2)

    def test_unavailable_result_persists_and_success_clears(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = TrackerDB(str(Path(directory) / "state.db"))
            unavailable_at = datetime.now(timezone.utc)
            db.record_image_unavailable(
                vehicle_id="v1",
                unavailable_at=unavailable_at,
                latitude=-27.2,
                longitude=-48.6,
            )

            loaded = db.load_state("v1")
            self.assertEqual(loaded.last_image_unavailable_at, unavailable_at)
            self.assertEqual(loaded.last_image_unavailable_lat, -27.2)
            self.assertEqual(loaded.last_image_unavailable_lng, -48.6)

            sent_at = unavailable_at + timedelta(minutes=10)
            db.record_image_sent(
                vehicle_id="v1",
                sent_at=sent_at,
                latitude=-27.21,
                longitude=-48.61,
                street="Rua Com Cobertura",
            )

            loaded = db.load_state("v1")
            self.assertIsNone(loaded.last_image_unavailable_at)
            self.assertIsNone(loaded.last_image_unavailable_lat)
            self.assertIsNone(loaded.last_image_unavailable_lng)

class FakeGenerator:
    def __init__(self) -> None:
        self.closed = False
        self.cancelled = False
        self.generate_calls = 0

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        return PanoramaArtifact(
            jpeg_bytes=b"\xff\xd8fake-jpeg\xff\xd9",
            width=1280,
            height=952,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def cancel(self) -> None:
        self.cancelled = True

    def close(self) -> None:
        self.closed = True


class UnavailableGenerator(FakeGenerator):
    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        raise StreetViewUnavailable("no_streetview_imagery")


class SlowGenerator(FakeGenerator):
    def __init__(self, delay: float = 0.1) -> None:
        super().__init__()
        self.delay = delay
        self.started = threading.Event()

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.started.set()
        time.sleep(self.delay)
        return super().generate(**kwargs)


class FakeZAPI:
    def __init__(self, result: bool = True, results=None) -> None:
        self.result = result
        self.results = list(results) if results is not None else None
        self.calls = []
        self.called = threading.Event()

    def send_image_bytes(self, phone, image_bytes, caption):
        self.calls.append((phone, image_bytes, caption))
        self.called.set()
        value = self.result
        if self.results is not None and self.results:
            value = self.results.pop(0)
        if isinstance(value, Exception):
            raise value
        if isinstance(value, dict):
            return value
        return {"messageId": "image-1"} if value else None


class PanoramaDispatcherTests(unittest.TestCase):
    @staticmethod
    def _job(
        vehicle_id: str = "v-dispatcher",
        requested_at: datetime | None = None,
    ) -> PanoramaJob:
        now = datetime.now(timezone.utc)
        return PanoramaJob(
            vehicle_id=vehicle_id,
            phone="5548999999999",
            latitude=-27.2,
            longitude=-48.6,
            vehicle_name="Vehicle",
            address="Road A",
            street_name="Road A",
            speed_kmh=10,
            battery=90,
            updated_at=now,
            requested_at=requested_at or now,
            event_type="moving",
        )

    @staticmethod
    def _wait_for_idle(
        dispatcher: PanoramaDispatcher,
        vehicle_id: str,
        timeout: float = 3.0,
    ) -> bool:
        deadline = time.monotonic() + timeout
        while dispatcher.has_pending(vehicle_id) and time.monotonic() < deadline:
            time.sleep(0.01)
        return not dispatcher.has_pending(vehicle_id)
    def test_sends_and_persists_success(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = TrackerDB(str(Path(directory) / "state.db"))
            generator = FakeGenerator()
            zapi = FakeZAPI()
            dispatcher = PanoramaDispatcher(
                generator=generator,
                zapi=zapi,
                db=db,
            )
            now = datetime.now(timezone.utc)
            job = PanoramaJob(
                vehicle_id="v1",
                phone="5548999999999",
                latitude=-27.2,
                longitude=-48.6,
                vehicle_name="Veículo",
                address="Rua A",
                street_name="Rua A",
                speed_kmh=10,
                battery=90,
                updated_at=now,
                requested_at=now,
                event_type="moving",
            )
            try:
                self.assertTrue(dispatcher.try_submit(job))
                self.assertFalse(dispatcher.try_submit(job))
                self.assertTrue(zapi.called.wait(3))

                deadline = time.monotonic() + 3
                loaded = db.load_state("v1")
                while loaded.last_image_sent_at is None and time.monotonic() < deadline:
                    time.sleep(0.02)
                    loaded = db.load_state("v1")

                self.assertEqual(zapi.calls[0][0], job.phone)
                self.assertEqual(loaded.last_image_street, "Rua A")
            finally:
                dispatcher.close(timeout=3)

            self.assertTrue(generator.closed)
            self.assertFalse(generator.cancelled)

    def test_persists_no_imagery_without_calling_zapi(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = TrackerDB(str(Path(directory) / "state.db"))
            generator = UnavailableGenerator()
            zapi = FakeZAPI()
            dispatcher = PanoramaDispatcher(
                generator=generator,
                zapi=zapi,
                db=db,
            )
            now = datetime.now(timezone.utc)
            job = PanoramaJob(
                vehicle_id="v-no-imagery",
                phone="5548999999999",
                latitude=-27.2,
                longitude=-48.6,
                vehicle_name="Vehicle",
                address="Road A",
                street_name="Road A",
                speed_kmh=10,
                battery=90,
                updated_at=now,
                requested_at=now,
                event_type="moving",
            )
            try:
                self.assertTrue(dispatcher.try_submit(job))
                deadline = time.monotonic() + 3
                loaded = db.load_state(job.vehicle_id)
                while (
                    loaded.last_image_unavailable_at is None
                    and time.monotonic() < deadline
                ):
                    time.sleep(0.02)
                    loaded = db.load_state(job.vehicle_id)

                self.assertIsNotNone(loaded.last_image_unavailable_at)
                self.assertEqual(loaded.last_image_unavailable_lat, job.latitude)
                self.assertEqual(loaded.last_image_unavailable_lng, job.longitude)
                self.assertEqual(zapi.calls, [])
            finally:
                dispatcher.close(timeout=3)

            self.assertTrue(generator.closed)
            self.assertFalse(generator.cancelled)

if __name__ == "__main__":
    unittest.main()
