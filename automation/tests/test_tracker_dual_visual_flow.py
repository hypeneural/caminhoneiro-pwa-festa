"""Regressões do fluxo: localização, conteúdo principal, mapa e separadores."""

from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.tracker.engine import PanoramaDecision, TrackerEngine
from app.tracker.maps.dispatcher import MapDispatcher
from app.tracker.maps.models import MapArtifact
from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.tracker_db import TrackerDB


PHONE = "5548996553954"


class FakeZAPI:
    def __init__(self) -> None:
        self.images: list[dict] = []

    def send_image_bytes(self, phone, image_bytes, caption, mime_type="image/jpeg"):
        self.images.append(
            {
                "phone": phone,
                "image_bytes": image_bytes,
                "caption": caption,
                "mime_type": mime_type,
            }
        )
        return {"messageId": f"image-{len(self.images)}"}

    def send_text(self, phone, message):
        return {"messageId": "text-direct"}

    def send_location(self, phone, lat, lng, title, address):
        return {"messageId": "location-direct"}


class PersistingNotifications:
    def __init__(self, db: TrackerDB) -> None:
        self.db = db
        self.text_wakes = 0

    def wake_text(self) -> None:
        self.text_wakes += 1

    def try_submit_location(
        self,
        vehicle_id,
        dedupe_key,
        phone,
        latitude,
        longitude,
        title,
        address,
        *,
        created_at=None,
        expires_at=None,
    ):
        return self.db.enqueue_notification(
            vehicle_id=vehicle_id,
            channel="location",
            dedupe_key=dedupe_key,
            payload={
                "phone": phone,
                "latitude": latitude,
                "longitude": longitude,
                "title": title,
                "address": address,
            },
            created_at=created_at,
            expires_at=expires_at,
        )

    def try_submit_text(
        self,
        vehicle_id,
        dedupe_key,
        phone,
        message,
        *,
        created_at=None,
        expires_at=None,
        content_key=None,
        completion_separator_count=0,
        completion_wait_channel=None,
        completion_wait_dedupe_key=None,
    ):
        expiry = expires_at or created_at + timedelta(hours=1)
        return self.db.enqueue_notification(
            vehicle_id=vehicle_id,
            channel="text",
            dedupe_key=dedupe_key,
            content_key=content_key,
            payload={"phone": phone, "message": message},
            created_at=created_at,
            expires_at=expiry,
            completion_separator_count=completion_separator_count,
            completion_separator_phone=phone,
            completion_separator_expires_at=expiry,
            completion_wait_channel=completion_wait_channel,
            completion_wait_dedupe_key=completion_wait_dedupe_key,
        )


class PersistingPanorama:
    def __init__(self, db: TrackerDB) -> None:
        self.db = db
        self.jobs = []

    def try_submit(self, job):
        self.jobs.append(job)
        return self.db.enqueue_notification(
            vehicle_id=job.vehicle_id,
            channel="panorama",
            dedupe_key=job.dedupe_key,
            content_key=job.content_key,
            payload={
                "phone": job.phone,
                "fallback_payload": {
                    "phone": job.phone,
                    "message": job.fallback_message,
                },
                "fallback_dedupe_key": job.fallback_dedupe_key,
                "fallback_max_attempts": 5,
                "fallback_expires_at": (
                    job.requested_at + timedelta(hours=1)
                ).isoformat(),
            },
            created_at=job.requested_at,
            completion_separator_count=job.completion_separator_count,
            completion_separator_phone=job.phone,
            completion_separator_expires_at=(
                job.requested_at + timedelta(hours=1)
            ),
            completion_wait_channel=(
                "location" if job.completion_location_dedupe_key else None
            ),
            completion_wait_dedupe_key=job.completion_location_dedupe_key,
        )


class PersistingMap:
    def __init__(self, db: TrackerDB, *, accept: bool = True) -> None:
        self.db = db
        self.accept = accept
        self.calls: list[dict] = []
        self.route_repo = SimpleNamespace(
            total_length_m=2_000.0,
            version="route-test-v1",
        )

    def try_submit(self, **kwargs):
        self.calls.append(kwargs)
        if not self.accept:
            return False
        return self.db.enqueue_notification(
            vehicle_id=kwargs["vehicle_id"],
            channel="map",
            dedupe_key=kwargs["dedupe_key"],
            content_key=kwargs["content_key"],
            payload={
                **kwargs,
                "updated_at": kwargs["updated_at"].isoformat(),
                "fallback_payload": {
                    "phone": kwargs["phone"],
                    "message": kwargs["fallback_message"],
                },
                "fallback_expires_at": kwargs[
                    "fallback_expires_at"
                ].isoformat(),
            },
            created_at=kwargs["updated_at"],
            completion_separator_count=kwargs[
                "completion_separator_count"
            ],
            completion_separator_phone=kwargs["phone"],
            completion_separator_expires_at=kwargs[
                "fallback_expires_at"
            ],
            completion_wait_channel=(
                "location"
                if kwargs["completion_location_dedupe_key"]
                else None
            ),
            completion_wait_dedupe_key=kwargs[
                "completion_location_dedupe_key"
            ],
        )


class EligibleMapPolicy:
    def check_eligibility(self, snapshot, state, route_match, now):
        return SimpleNamespace(eligible=True, reason="test")


def _snapshot(now: datetime) -> VehicleSnapshot:
    return VehicleSnapshot(
        vehicle_id="vehicle-1",
        name="Veículo de teste",
        vehicle_type="truck",
        lat=-27.2445,
        lng=-48.6369,
        speed_kmh=28.0,
        bearing=90.0,
        accuracy=5.0,
        battery=82,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live",
        address="Rua de Teste, Tijucas - SC",
    )


def _engine(db, notifications, panorama, maps) -> TrackerEngine:
    engine = TrackerEngine(
        zapi=FakeZAPI(),
        db=db,
        geocoder=SimpleNamespace(),
        phone=PHONE,
        notification_dispatcher=notifications,
        panorama_dispatcher=panorama,
        map_dispatcher=maps,
        map_policy=EligibleMapPolicy(),
        combined_message_enabled=True,
        completion_separator_count=3,
    )
    engine._panorama_decision = lambda *args: PanoramaDecision(
        True, "test"
    )
    return engine


def _route_match():
    return SimpleNamespace(
        progress_m=750.0,
        segment_index=3,
        snapped_lat=-27.2446,
        snapped_lng=-48.6368,
        is_off_route=False,
    )


def test_dual_flow_uses_distinct_keys_and_map_owns_final_separators(tmp_path):
    db = TrackerDB(str(tmp_path / "dual.db"))
    notifications = PersistingNotifications(db)
    panorama = PersistingPanorama(db)
    maps = PersistingMap(db)
    engine = _engine(db, notifications, panorama, maps)
    now = datetime.now(timezone.utc)

    engine._send_paired_alert(
        "moving",
        _snapshot(now),
        VehicleState(vehicle_id="vehicle-1"),
        now,
        alert_key="movement-1",
        route_match=_route_match(),
    )

    assert len(panorama.jobs) == 1
    assert panorama.jobs[0].completion_separator_count == 0
    assert len(maps.calls) == 1
    map_call = maps.calls[0]
    assert map_call["primary_content_key"] == panorama.jobs[0].content_key
    assert map_call["content_key"] == f"{panorama.jobs[0].content_key}:map"
    assert map_call["content_key"] != panorama.jobs[0].content_key
    assert map_call["completion_separator_count"] == 3
    assert map_call["snapped_lat"] == -27.2446
    assert map_call["snapped_lng"] == -48.6368

    for position in range(1, 4):
        separator = db.get_notification(
            channel="text",
            dedupe_key=f"{map_call['content_key']}:separator:{position}",
        )
        assert separator is not None
        assert separator.payload == {"message": ".", "phone": PHONE}
    assert db.get_notification(
        channel="text",
        dedupe_key=f"{panorama.jobs[0].content_key}:separator:1",
    ) is None


def test_map_enqueue_failure_moves_separators_back_to_primary(tmp_path):
    db = TrackerDB(str(tmp_path / "map-fallback.db"))
    notifications = PersistingNotifications(db)
    panorama = PersistingPanorama(db)
    maps = PersistingMap(db, accept=False)
    engine = _engine(db, notifications, panorama, maps)
    now = datetime.now(timezone.utc)

    engine._send_paired_alert(
        "moving",
        _snapshot(now),
        VehicleState(vehicle_id="vehicle-1"),
        now,
        alert_key="movement-2",
        route_match=_route_match(),
    )

    primary_key = panorama.jobs[0].content_key
    assert db.get_notification_by_content_key(f"{primary_key}:map") is None
    for position in range(1, 4):
        assert db.get_notification(
            channel="text",
            dedupe_key=f"{primary_key}:separator:{position}",
        ) is not None


class RecordingRenderer:
    def __init__(self) -> None:
        self.rendered = threading.Event()
        self.progress_coords = None

    def render_collage(
        self,
        job,
        route_wgs84,
        progress_wgs84,
        start_coords,
        total_length_m,
    ):
        self.progress_coords = progress_wgs84
        self.rendered.set()
        return MapArtifact(
            jpeg_bytes=b"jpeg",
            width=1080,
            height=1350,
            progress_m=job.progress_m,
            captured_at=datetime.now(timezone.utc),
        )

    def close(self):
        return None


def test_map_renders_in_parallel_but_sends_only_after_primary(tmp_path):
    db = TrackerDB(str(tmp_path / "ordered.db"))
    now = datetime.now(timezone.utc)
    primary_key = "vehicle-1:movement-3:content"
    assert db.enqueue_notification(
        vehicle_id="vehicle-1",
        channel="panorama",
        dedupe_key="primary-panorama",
        content_key=primary_key,
        payload={"kind": "primary"},
        created_at=now,
    )

    repo = SimpleNamespace(
        coords_wgs84=[
            (-27.2450, -48.6375),
            (-27.2448, -48.6372),
            (-27.2444, -48.6367),
        ],
        start_wgs84=SimpleNamespace(y=-27.2450, x=-48.6375),
        total_length_m=1_000.0,
    )
    renderer = RecordingRenderer()
    zapi = FakeZAPI()
    notifications = PersistingNotifications(db)
    dispatcher = MapDispatcher(
        db=db,
        renderer=renderer,
        zapi=zapi,
        route_repo=repo,
        lease_seconds=30.0,
        max_job_age_seconds=300.0,
        idle_poll_seconds=0.05,
        send_attempts=1,
        instance_id="ordered-test",
        notification_dispatcher=notifications,
    )
    dispatcher.stop()
    dispatcher._stop_event.clear()

    assert dispatcher.try_submit(
        vehicle_id="vehicle-1",
        phone=PHONE,
        latitude=-27.2445,
        longitude=-48.6369,
        bearing=90.0,
        speed_kmh=28.0,
        battery=82,
        address="Rua de Teste",
        updated_at=now,
        event_type="moving",
        progress_m=750.0,
        segment_index=1,
        route_version="v1",
        caption="Mapa",
        fallback_message="Mapa indisponível",
        fallback_dedupe_key="map-fallback",
        fallback_expires_at=now + timedelta(hours=1),
        dedupe_key="map-1",
        content_key=f"{primary_key}:map",
        snapped_lat=-27.2446,
        snapped_lng=-48.6368,
        primary_content_key=primary_key,
        completion_separator_count=3,
    )
    record = db.claim_notification(
        channel="map",
        lease_owner=dispatcher._owner,
        lease_seconds=30.0,
    )
    assert record is not None

    worker = threading.Thread(
        target=dispatcher._process,
        args=(record, dispatcher._owner, threading.Event()),
    )
    worker.start()
    assert renderer.rendered.wait(1.0)
    time.sleep(0.1)
    assert zapi.images == []

    primary = db.claim_notification(
        channel="panorama",
        lease_owner="primary-worker",
        lease_seconds=30.0,
    )
    assert primary is not None
    assert db.mark_notification_success(
        primary.id,
        lease_owner="primary-worker",
        provider_message_id="primary-sent",
        sent_at=datetime.now(timezone.utc),
    )

    worker.join(timeout=2.0)
    assert not worker.is_alive()
    assert len(zapi.images) == 1
    # As geometrias GeoJSON usam a ordem longitude, latitude.
    assert renderer.progress_coords[-1] == (-48.6368, -27.2446)
    map_row = db.get_notification_by_content_key(f"{primary_key}:map")
    assert map_row is not None
    assert map_row.status == "sent"
    assert notifications.text_wakes == 1
    dispatcher._stop_event.set()


def test_map_fallback_is_database_gated_behind_primary(tmp_path):
    db = TrackerDB(str(tmp_path / "fallback-order.db"))
    now = datetime.now(timezone.utc)
    primary_key = "vehicle-1:movement-4:content"
    assert db.enqueue_notification(
        vehicle_id="vehicle-1",
        channel="panorama",
        dedupe_key="primary-4",
        content_key=primary_key,
        payload={"kind": "primary"},
        created_at=now,
    )
    assert db.enqueue_notification(
        vehicle_id="vehicle-1",
        channel="map",
        dedupe_key="map-4",
        content_key=f"{primary_key}:map",
        payload={
            "primary_content_key": primary_key,
            "fallback_payload": {
                "phone": PHONE,
                "message": "Mapa indisponível",
            },
            "fallback_dedupe_key": "map-4-fallback",
            "fallback_max_attempts": 3,
            "fallback_expires_at": (now + timedelta(hours=1)).isoformat(),
        },
        created_at=now,
    )
    map_job = db.claim_notification(
        channel="map",
        lease_owner="map-worker",
        lease_seconds=30.0,
    )
    assert map_job is not None
    assert db.promote_map_to_text(
        map_job.id,
        lease_owner="map-worker",
        error="render_failed",
        now=now,
    )
    fallback = db.get_notification(
        channel="text",
        dedupe_key="map-4-fallback",
    )
    primary = db.get_notification_by_content_key(primary_key)
    assert fallback is not None
    assert primary is not None
    assert fallback.wait_for_terminal_id == primary.id
    assert db.claim_notification(
        channel="text",
        lease_owner="text-worker",
        lease_seconds=30.0,
    ) is None

    claimed_primary = db.claim_notification(
        channel="panorama",
        lease_owner="primary-worker",
        lease_seconds=30.0,
    )
    assert claimed_primary is not None
    assert db.mark_notification_success(
        claimed_primary.id,
        lease_owner="primary-worker",
        provider_message_id="primary-4-sent",
        sent_at=now,
    )
    released = db.claim_notification(
        channel="text",
        lease_owner="text-worker",
        lease_seconds=30.0,
    )
    assert released is not None
    assert released.id == fallback.id
