"""Regressoes da mesclagem concorrente do estado de mapas."""

from datetime import datetime, timedelta, timezone

from app.tracker.models import VehicleState
from app.tracker.tracker_db import TrackerDB


def test_stale_save_preserves_concurrent_map_updates_and_accepts_newer_values(
    tmp_path,
):
    db = TrackerDB(str(tmp_path / "tracker.db"))
    vehicle_id = "vehicle-1"
    initial_at = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)

    db.save_state(
        VehicleState(
            vehicle_id=vehicle_id,
            current_status="MOVING",
            last_map_attempt_at=initial_at,
            last_map_sent_at=initial_at,
            last_map_sent_lat=-27.0,
            last_map_sent_lng=-48.0,
            last_map_sent_progress_m=100.0,
        )
    )

    stale_before_attempt = db.load_state(vehicle_id)
    attempted_at = initial_at + timedelta(minutes=1)
    db.mark_map_attempt(vehicle_id, attempted_at)

    stale_before_attempt.current_status = "STOPPING"
    db.save_state(stale_before_attempt)

    after_attempt = db.load_state(vehicle_id)
    assert after_attempt.current_status == "STOPPING"
    assert after_attempt.last_map_attempt_at == attempted_at

    stale_before_completion = db.load_state(vehicle_id)
    completed_at = initial_at + timedelta(minutes=2)
    assert db.enqueue_notification(
        vehicle_id=vehicle_id,
        channel="map",
        dedupe_key="map:concurrent-merge",
        payload={"kind": "map"},
        created_at=attempted_at,
    )
    job = db.claim_notification(
        channel="map",
        lease_owner="map-worker",
        now=attempted_at,
    )
    assert job is not None
    assert db.complete_map_notification(
        job.id,
        lease_owner="map-worker",
        provider_message_id="map-new",
        sent_at=completed_at,
        latitude=-27.2,
        longitude=-48.6,
        progress_m=300.0,
    )

    stale_before_completion.current_status = "STOPPED"
    db.save_state(stale_before_completion)

    after_completion = db.load_state(vehicle_id)
    assert after_completion.current_status == "STOPPED"
    assert after_completion.last_map_attempt_at == completed_at
    assert after_completion.last_map_sent_at == completed_at
    assert after_completion.last_map_sent_lat == -27.2
    assert after_completion.last_map_sent_lng == -48.6
    assert after_completion.last_map_sent_progress_m == 300.0

    same_timestamp = db.load_state(vehicle_id)
    same_timestamp.current_status = "DELAYED"
    same_timestamp.last_map_sent_lat = 0.0
    same_timestamp.last_map_sent_lng = 0.0
    same_timestamp.last_map_sent_progress_m = 0.0
    db.save_state(same_timestamp)

    unchanged_map = db.load_state(vehicle_id)
    assert unchanged_map.current_status == "DELAYED"
    assert unchanged_map.last_map_sent_lat == -27.2
    assert unchanged_map.last_map_sent_lng == -48.6
    assert unchanged_map.last_map_sent_progress_m == 300.0

    newer_attempt_at = completed_at + timedelta(minutes=1)
    newer_sent_at = completed_at + timedelta(minutes=2)
    unchanged_map.last_map_attempt_at = newer_attempt_at
    unchanged_map.last_map_sent_at = newer_sent_at
    unchanged_map.last_map_sent_lat = -27.3
    unchanged_map.last_map_sent_lng = -48.7
    unchanged_map.last_map_sent_progress_m = 500.0
    db.save_state(unchanged_map)

    updated = db.load_state(vehicle_id)
    assert updated.last_map_attempt_at == newer_attempt_at
    assert updated.last_map_sent_at == newer_sent_at
    assert updated.last_map_sent_lat == -27.3
    assert updated.last_map_sent_lng == -48.7
    assert updated.last_map_sent_progress_m == 500.0
