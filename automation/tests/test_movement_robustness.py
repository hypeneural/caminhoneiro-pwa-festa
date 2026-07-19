from __future__ import annotations

import unittest
from datetime import datetime, timezone

from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.movement import detect_movement


def snapshot(
    *,
    lat: float = -27.24,
    speed: float = 0,
    accuracy: float | None = 5,
) -> VehicleSnapshot:
    now = datetime.now(timezone.utc)
    return VehicleSnapshot(
        vehicle_id="v1",
        name="Veículo",
        vehicle_type="main",
        lat=lat,
        lng=-48.63,
        speed_kmh=speed,
        bearing=0,
        accuracy=accuracy,
        battery=80,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live",
    )


class MovementRobustnessTests(unittest.TestCase):
    def state(self, status: str = "STOPPED") -> VehicleState:
        return VehicleState(
            vehicle_id="v1",
            current_status=status,
            last_observed_lat=-27.24,
            last_observed_lng=-48.63,
        )

    def test_bad_accuracy_does_not_turn_gps_jump_into_movement(self) -> None:
        result = detect_movement(
            snapshot(lat=-27.23963, accuracy=75),
            self.state(),
        )
        self.assertGreater(result.distance_from_previous_m, 40)
        self.assertFalse(result.is_moving)

    def test_precise_displacement_above_threshold_confirms_movement(self) -> None:
        result = detect_movement(
            snapshot(lat=-27.23963, accuracy=5),
            self.state(),
        )
        self.assertTrue(result.is_moving)

    def test_intermediate_speed_keeps_existing_movement(self) -> None:
        result = detect_movement(
            snapshot(speed=2),
            self.state("MOVING"),
        )
        self.assertTrue(result.is_moving)

    def test_intermediate_speed_does_not_start_from_stopped(self) -> None:
        result = detect_movement(
            snapshot(speed=2),
            self.state("STOPPED"),
        )
        self.assertFalse(result.is_moving)

    def test_confirmed_speed_always_marks_movement(self) -> None:
        result = detect_movement(
            snapshot(speed=3, accuracy=200),
            self.state("STOPPED"),
        )
        self.assertTrue(result.is_moving)


if __name__ == "__main__":
    unittest.main()
