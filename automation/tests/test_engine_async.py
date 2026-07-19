from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from app.tracker.engine import TrackerEngine
from app.tracker.models import VehicleSnapshot, VehicleState


class UnexpectedZAPI:
    def send_text(self, *args, **kwargs):
        raise AssertionError("envio síncrono de texto não deveria ocorrer")

    def send_location(self, *args, **kwargs):
        raise AssertionError("envio síncrono de localização não deveria ocorrer")


class FakeDB:
    def __init__(self) -> None:
        self.saved = []
        self.contents = {}

    def save_state(self, state: VehicleState) -> None:
        self.saved.append(state)

    def get_notification_by_content_key(self, content_key: str):
        return self.contents.get(content_key)

    def get_notification(self, *, channel: str, dedupe_key: str):
        return None


class FakeAsyncGeocoder:
    def __init__(self) -> None:
        self.calls = 0

    def enrich(self, snapshot: VehicleSnapshot) -> bool:
        self.calls += 1
        snapshot.address = "Rua Assíncrona, São José"
        snapshot.street_name = "Rua Assíncrona"
        return True


class FakeNotifications:
    def __init__(
        self,
        db: FakeDB,
        *,
        raise_location: bool = False,
        raise_text: bool = False,
    ) -> None:
        self.db = db
        self.raise_location = raise_location
        self.raise_text = raise_text
        self.locations = []
        self.texts = []

    def try_submit_location(self, **payload) -> bool:
        if self.raise_location:
            raise RuntimeError("location blocked")
        self.locations.append(payload)
        return True

    def try_submit_text(self, **payload) -> bool:
        if self.raise_text:
            raise RuntimeError("text blocked")
        content_key = payload.get("content_key")
        if content_key and content_key in self.db.contents:
            return False
        self.texts.append(payload)
        if content_key:
            self.db.contents[content_key] = payload
        return True


class FakePanorama:
    def __init__(self, db: FakeDB, *, accept: bool = True) -> None:
        self.db = db
        self.accept = accept
        self.jobs = []
        self.submissions = []

    def has_pending(self, vehicle_id: str) -> bool:
        return False

    def try_submit(self, job) -> bool:
        self.submissions.append(job)
        if not self.accept:
            return False
        if job.content_key in self.db.contents:
            return False
        self.jobs.append(job)
        self.db.contents[job.content_key] = job
        return True


def make_snapshot(
    now: datetime,
    *,
    lat: float = -27.24,
    lng: float = -48.63,
    accuracy: float | None = 5,
) -> VehicleSnapshot:
    return VehicleSnapshot(
        vehicle_id="sao-cristovao",
        name="Procissão de São Cristóvão",
        vehicle_type="main",
        lat=lat,
        lng=lng,
        speed_kmh=12,
        bearing=90,
        accuracy=accuracy,
        battery=19,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live",
    )


class TrackerEngineAsyncTests(unittest.TestCase):
    def setUp(self) -> None:
        self.now = datetime(2026, 7, 16, 15, 0, tzinfo=timezone.utc)

    def build_engine(
        self,
        *,
        raise_location: bool = False,
        raise_text: bool = False,
        accept_panorama: bool = True,
        db: FakeDB | None = None,
        panorama: FakePanorama | None = None,
        system_alert_phone: str | None = None,
    ):
        db = db or FakeDB()
        notifications = FakeNotifications(
            db,
            raise_location=raise_location,
            raise_text=raise_text,
        )
        panorama = panorama or FakePanorama(db, accept=accept_panorama)
        geocoder = FakeAsyncGeocoder()
        engine = TrackerEngine(
            zapi=UnexpectedZAPI(),
            db=db,
            geocoder=object(),
            phone="5548996553954",
            system_alert_phone=system_alert_phone,
            panorama_dispatcher=panorama,
            notification_dispatcher=notifications,
            geocode_dispatcher=geocoder,
        )
        return engine, db, panorama, notifications, geocoder

    def test_routes_only_tracker_offline_and_recovery_to_system_group(self) -> None:
        group = "120363407707102690-group"
        system_events = (
            "offline_tracker",
            "recovered_moving",
            "recovered_stopped",
        )
        regular_events = ("moving", "stopped", "resumed", "offline_server")

        for event_type in system_events:
            with self.subTest(event_type=event_type):
                engine, _, _, notifications, _ = self.build_engine(
                    accept_panorama=False,
                    system_alert_phone=group,
                )
                state = VehicleState(vehicle_id="sao-cristovao")
                engine._send_paired_alert(
                    event_type,
                    make_snapshot(self.now),
                    state,
                    self.now,
                    alert_key=f"{event_type}:routing",
                )
                self.assertEqual(notifications.locations[0]["phone"], group)
                self.assertEqual(notifications.texts[0]["phone"], group)

        for event_type in regular_events:
            with self.subTest(event_type=event_type):
                engine, _, _, notifications, _ = self.build_engine(
                    accept_panorama=False,
                    system_alert_phone=group,
                )
                state = VehicleState(vehicle_id="sao-cristovao")
                engine._send_paired_alert(
                    event_type,
                    make_snapshot(self.now),
                    state,
                    self.now,
                    alert_key=f"{event_type}:routing",
                )
                self.assertEqual(
                    notifications.locations[0]["phone"],
                    "5548996553954",
                )
                self.assertEqual(
                    notifications.texts[0]["phone"],
                    "5548996553954",
                )

    def test_routes_recovery_panorama_to_system_group(self) -> None:
        group = "120363407707102690-group"
        engine, _, panorama, notifications, _ = self.build_engine(
            system_alert_phone=group,
        )
        state = VehicleState(vehicle_id="sao-cristovao")

        engine._send_paired_alert(
            "recovered_moving",
            make_snapshot(self.now),
            state,
            self.now,
            alert_key="recovered_moving:panorama-routing",
        )

        self.assertEqual(notifications.locations[0]["phone"], group)
        self.assertEqual(panorama.jobs[0].phone, group)
        self.assertEqual(notifications.texts, [])

    def test_empty_system_destination_falls_back_to_main_phone(self) -> None:
        engine, _, _, notifications, _ = self.build_engine(
            accept_panorama=False,
            system_alert_phone="",
        )
        state = VehicleState(vehicle_id="sao-cristovao")

        engine._send_paired_alert(
            "offline_tracker",
            make_snapshot(self.now),
            state,
            self.now,
            alert_key="offline_tracker:fallback-routing",
        )

        self.assertEqual(notifications.locations[0]["phone"], "5548996553954")
        self.assertEqual(notifications.texts[0]["phone"], "5548996553954")

    def test_location_failure_does_not_stop_combined_image(self) -> None:
        engine, db, panorama, notifications, geocoder = self.build_engine(
            raise_location=True,
        )
        state = VehicleState(vehicle_id="sao-cristovao")

        engine.process_snapshot(make_snapshot(self.now), state, self.now)

        self.assertEqual(notifications.texts, [])
        self.assertEqual(len(panorama.jobs), 1)
        self.assertEqual(len(db.saved), 1)
        self.assertEqual(geocoder.calls, 1)

    def test_panorama_enqueue_failure_falls_back_to_text(self) -> None:
        engine, db, panorama, notifications, _ = self.build_engine(
            accept_panorama=False,
        )
        state = VehicleState(vehicle_id="sao-cristovao")

        engine.process_snapshot(make_snapshot(self.now), state, self.now)

        self.assertEqual(len(notifications.locations), 1)
        self.assertEqual(len(notifications.texts), 1)
        self.assertEqual(len(panorama.submissions), 1)
        self.assertEqual(panorama.jobs, [])
        self.assertEqual(len(db.saved), 1)

    def test_text_failure_does_not_stop_location_when_panorama_ineligible(self) -> None:
        engine, db, panorama, notifications, _ = self.build_engine(
            raise_text=True,
        )
        state = VehicleState(
            vehicle_id="sao-cristovao",
            last_image_attempt_at=self.now,
        )

        engine.process_snapshot(make_snapshot(self.now), state, self.now)

        self.assertEqual(len(notifications.locations), 1)
        self.assertEqual(panorama.jobs, [])
        self.assertEqual(len(db.saved), 1)

    def test_panorama_is_not_scheduled_when_alert_is_not_due(self) -> None:
        engine, _, panorama, notifications, _ = self.build_engine()
        state = VehicleState(
            vehicle_id="sao-cristovao",
            current_status="MOVING",
            last_processed_updated_at=self.now - timedelta(minutes=1),
            last_location_sent_at=self.now,
            last_location_sent_lat=-27.24,
            last_location_sent_lng=-48.63,
        )

        engine.process_snapshot(make_snapshot(self.now), state, self.now)

        self.assertEqual(notifications.locations, [])
        self.assertEqual(notifications.texts, [])
        self.assertEqual(panorama.jobs, [])

    def test_invalid_coordinates_stop_before_every_channel(self) -> None:
        engine, db, panorama, notifications, geocoder = self.build_engine()
        state = VehicleState(vehicle_id="sao-cristovao")

        engine.process_snapshot(
            make_snapshot(self.now, lat=0, lng=0),
            state,
            self.now,
        )

        self.assertEqual(notifications.locations, [])
        self.assertEqual(notifications.texts, [])
        self.assertEqual(panorama.jobs, [])
        self.assertEqual(db.saved, [])
        self.assertEqual(geocoder.calls, 0)

    def test_panorama_rejects_invalid_or_unreliable_fixes(self) -> None:
        engine, _, _, _, _ = self.build_engine()
        state = VehicleState(vehicle_id="sao-cristovao")

        invalid = make_snapshot(self.now, lat=0, lng=0)
        self.assertEqual(
            engine._panorama_decision(
                "moving",
                invalid,
                state,
                self.now,
            ).reason,
            "invalid_coordinates",
        )

        stale = make_snapshot(self.now - timedelta(seconds=121))
        self.assertEqual(
            engine._panorama_decision(
                "moving",
                stale,
                state,
                self.now,
            ).reason,
            "stale_fix",
        )

        inaccurate = make_snapshot(self.now, accuracy=76)
        self.assertEqual(
            engine._panorama_decision(
                "moving",
                inaccurate,
                state,
                self.now,
            ).reason,
            "invalid_accuracy",
        )

        future = make_snapshot(self.now + timedelta(seconds=31))
        self.assertEqual(
            engine._panorama_decision(
                "moving",
                future,
                state,
                self.now,
            ).reason,
            "future_snapshot",
        )

    def test_combined_caption_contains_full_status_with_unicode(self) -> None:
        engine, _, panorama, notifications, _ = self.build_engine()
        state = VehicleState(vehicle_id="sao-cristovao")

        engine.process_snapshot(make_snapshot(self.now), state, self.now)

        self.assertEqual(notifications.texts, [])
        self.assertEqual(len(panorama.jobs), 1)
        caption = panorama.jobs[0].caption
        self.assertIn("Procissão de São Cristóvão", caption)
        self.assertEqual(panorama.jobs[0].address, "Rua Assíncrona, São José")
        self.assertIn("Rua Assíncrona", caption)
        self.assertIn("🚗 *Em deslocamento:* *12 km/h*", caption)
        self.assertIn("🪫 *Bateria fraca:* *19%*", caption)
        self.assertIn("Em tempo real:", caption)
        self.assertNotIn("?", caption)
        self.assertEqual(caption.encode("utf-8").decode("utf-8"), caption)

    def test_same_logical_content_is_not_duplicated_after_restart(self) -> None:
        db = FakeDB()
        panorama = FakePanorama(db)
        first_engine, _, _, first_notifications, _ = self.build_engine(
            db=db,
            panorama=panorama,
        )
        snapshot = make_snapshot(self.now)
        first_state = VehicleState(vehicle_id=snapshot.vehicle_id)

        first_engine._send_paired_alert(
            "moving",
            snapshot,
            first_state,
            self.now,
            alert_key="moving:evento-único",
        )

        second_engine, _, _, second_notifications, _ = self.build_engine(
            db=db,
            panorama=panorama,
        )
        restarted_state = VehicleState(vehicle_id=snapshot.vehicle_id)
        second_engine._send_paired_alert(
            "moving",
            snapshot,
            restarted_state,
            self.now,
            alert_key="moving:evento-único",
        )

        self.assertEqual(len(panorama.jobs), 1)
        self.assertEqual(len(panorama.submissions), 2)
        self.assertEqual(first_notifications.texts, [])
        self.assertEqual(second_notifications.texts, [])
        content_key = panorama.jobs[0].content_key
        self.assertEqual(
            content_key,
            "sao-cristovao:moving:evento-único:content",
        )
        self.assertEqual(list(db.contents), [content_key])


if __name__ == "__main__":
    unittest.main()
