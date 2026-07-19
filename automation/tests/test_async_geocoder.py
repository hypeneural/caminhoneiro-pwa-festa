from __future__ import annotations

import threading
import time
import unittest
from datetime import datetime, timezone

from app.tracker.async_geocoder import AsyncReverseGeocoder
from app.tracker.models import VehicleSnapshot


def make_snapshot(
    *,
    lat: float = -27.24,
    lng: float = -48.63,
) -> VehicleSnapshot:
    now = datetime.now(timezone.utc)
    return VehicleSnapshot(
        vehicle_id="vehicle-1",
        name="Veículo",
        vehicle_type="main",
        lat=lat,
        lng=lng,
        speed_kmh=10,
        bearing=0,
        accuracy=5,
        battery=90,
        updated_at=now,
        server_time=now,
        stale=False,
        status="live",
    )


class BlockingGeocoder:
    def __init__(self) -> None:
        self.started = threading.Event()
        self.release = threading.Event()
        self.calls: list[tuple[float, float]] = []

    def reverse_geocode(self, latitude: float, longitude: float) -> dict:
        self.calls.append((latitude, longitude))
        self.started.set()
        self.release.wait(3)
        return {
            "address": f"Rua {latitude:.4f}",
            "street_name": f"Rua {latitude:.4f}",
            "city": "Tijucas",
        }


class SequenceGeocoder:
    def __init__(self, results: list[object]) -> None:
        self.results = list(results)
        self.calls = 0

    def reverse_geocode(self, latitude: float, longitude: float) -> dict:
        index = min(self.calls, len(self.results) - 1)
        self.calls += 1
        result = self.results[index]
        if isinstance(result, Exception):
            raise result
        return dict(result)


class AsyncReverseGeocoderTests(unittest.TestCase):
    def test_enrich_never_waits_for_slow_backend(self) -> None:
        backend = BlockingGeocoder()
        geocoder = AsyncReverseGeocoder(backend)
        snapshot = make_snapshot()
        try:
            started = time.monotonic()
            cached = geocoder.enrich(snapshot)
            elapsed = time.monotonic() - started

            self.assertFalse(cached)
            self.assertLess(elapsed, 0.2)
            self.assertEqual(
                snapshot.address,
                "Coordenadas GPS: -27.240000, -48.630000",
            )
            self.assertNotIn("não identificado", snapshot.address.casefold())
            self.assertTrue(backend.started.wait(1))

            backend.release.set()
            deadline = time.monotonic() + 2
            probe = make_snapshot()
            while (
                not geocoder.enrich_from_cache(probe)
                and time.monotonic() < deadline
            ):
                time.sleep(0.01)

            self.assertEqual(probe.city, "Tijucas")
            self.assertTrue(probe.address.startswith("Rua "))
        finally:
            backend.release.set()
            geocoder.close(timeout=2)

    def test_latest_coordinate_wins_while_lookup_is_active(self) -> None:
        backend = BlockingGeocoder()
        geocoder = AsyncReverseGeocoder(backend)
        first = make_snapshot(lat=-27.2400)
        latest = make_snapshot(lat=-27.2500)
        try:
            self.assertTrue(geocoder.request(first))
            self.assertTrue(backend.started.wait(1))
            self.assertTrue(geocoder.request(latest))
            backend.release.set()

            deadline = time.monotonic() + 2
            probe = make_snapshot(lat=-27.2500)
            while (
                not geocoder.enrich_from_cache(probe)
                and time.monotonic() < deadline
            ):
                time.sleep(0.01)

            self.assertGreaterEqual(len(backend.calls), 2)
            self.assertEqual(backend.calls[-1][0], latest.lat)
            self.assertEqual(probe.street_name, "Rua -27.2500")
        finally:
            backend.release.set()
            geocoder.close(timeout=2)

    def test_stale_cache_is_used_while_refresh_runs(self) -> None:
        backend = SequenceGeocoder(
            [
                {
                    "address": "Rua Cache, Tijucas/SC",
                    "street_name": "Rua Cache",
                    "city": "Tijucas",
                    "state": "SC",
                }
            ]
        )
        geocoder = AsyncReverseGeocoder(
            backend,
            cache_ttl_seconds=1,
            stale_cache_ttl_seconds=60,
            retry_base_seconds=0,
        )
        try:
            self.assertTrue(geocoder.request(make_snapshot()))
            deadline = time.monotonic() + 2
            probe = make_snapshot()
            while (
                not geocoder.enrich_from_cache(probe)
                and time.monotonic() < deadline
            ):
                time.sleep(0.01)
            self.assertEqual(probe.address, "Rua Cache, Tijucas/SC")

            with geocoder._lock:
                current = geocoder._cache["vehicle-1"]
                geocoder._cache["vehicle-1"] = type(current)(
                    latitude=current.latitude,
                    longitude=current.longitude,
                    created_monotonic=time.monotonic() - 2,
                    data=current.data,
                )

            stale_probe = make_snapshot()
            self.assertTrue(geocoder.enrich(stale_probe))
            self.assertEqual(stale_probe.address, "Rua Cache, Tijucas/SC")

            deadline = time.monotonic() + 2
            while backend.calls < 2 and time.monotonic() < deadline:
                time.sleep(0.01)
            self.assertGreaterEqual(backend.calls, 2)
        finally:
            geocoder.close(timeout=2)

    def test_retries_unknown_result_and_caches_only_real_address(self) -> None:
        unknown = {
            "address": "Endereço não identificado",
            "street_name": None,
            "city": "Tijucas",
        }
        real = {
            "address": "Rua Recuperada, Tijucas/SC",
            "street_name": "Rua Recuperada",
            "city": "Tijucas",
            "state": "SC",
        }
        backend = SequenceGeocoder([unknown, unknown, real])
        geocoder = AsyncReverseGeocoder(
            backend,
            max_attempts=3,
            retry_base_seconds=0,
        )
        try:
            self.assertTrue(geocoder.request(make_snapshot()))
            deadline = time.monotonic() + 2
            probe = make_snapshot()
            while (
                not geocoder.enrich_from_cache(probe)
                and time.monotonic() < deadline
            ):
                time.sleep(0.01)

            self.assertEqual(backend.calls, 3)
            self.assertEqual(probe.address, "Rua Recuperada, Tijucas/SC")
            self.assertEqual(probe.street_name, "Rua Recuperada")
        finally:
            geocoder.close(timeout=2)


if __name__ == "__main__":
    unittest.main()
