"""Geocodificacao reversa em background sem bloquear o polling do tracker."""

from __future__ import annotations

import logging
import math
import queue
import threading
import time
from dataclasses import dataclass
from typing import Optional

from .models import VehicleSnapshot
from .movement import haversine_m
from .location_format import clean_location_text, coordinate_fallback

logger = logging.getLogger(__name__)

def _normalize_geocode_data(value: object) -> Optional[dict]:
    if not isinstance(value, dict):
        return None

    address = clean_location_text(value.get("address"))
    street = clean_location_text(value.get("street_name"))
    city = clean_location_text(value.get("city"))
    state = clean_location_text(value.get("state"))
    if address is None and street:
        locality = "/".join(item for item in (city, state) if item)
        address = ", ".join(item for item in (street, locality or None) if item)
    if not address:
        return None
    return {
        "address": address,
        "street_name": street,
        "city": city,
        "state": state,
    }
@dataclass(frozen=True)
class _GeocodeJob:
    vehicle_id: str
    latitude: float
    longitude: float
    requested_monotonic: float


@dataclass(frozen=True)
class _CacheEntry:
    latitude: float
    longitude: float
    created_monotonic: float
    data: dict


class AsyncReverseGeocoder:
    """Mantem um cache por veiculo e resolve apenas a coordenada mais recente."""

    _STOP = object()

    def __init__(
        self,
        backend,
        *,
        cache_ttl_seconds: float = 21_600,
        cache_distance_m: float = 150,
        stale_cache_ttl_seconds: float = 604_800,
        stale_cache_distance_m: Optional[float] = None,
        max_job_age_seconds: float = 120,
        max_attempts: int = 3,
        retry_base_seconds: float = 0.25,
    ) -> None:
        self.backend = backend
        self.cache_ttl_seconds = max(1.0, float(cache_ttl_seconds))
        self.cache_distance_m = max(0.0, float(cache_distance_m))
        self.stale_cache_ttl_seconds = max(
            self.cache_ttl_seconds,
            float(stale_cache_ttl_seconds),
        )
        if stale_cache_distance_m is None:
            stale_cache_distance_m = self.cache_distance_m
        self.stale_cache_distance_m = max(
            0.0,
            float(stale_cache_distance_m),
        )
        self.max_job_age_seconds = max(1.0, float(max_job_age_seconds))
        self.max_attempts = max(1, int(max_attempts))
        self.retry_base_seconds = max(0.0, float(retry_base_seconds))
        self._cache: dict[str, _CacheEntry] = {}
        self._latest: dict[str, _GeocodeJob] = {}
        self._scheduled: set[str] = set()
        self._lock = threading.Lock()
        self._queue: queue.Queue[object] = queue.Queue()
        self._closed = False
        self._stop_event = threading.Event()
        self._thread = threading.Thread(
            target=self._run,
            name="tracker-geocoder",
            daemon=True,
        )
        self._thread.start()

    @staticmethod
    def _valid_coordinates(latitude: float, longitude: float) -> bool:
        return (
            math.isfinite(latitude)
            and math.isfinite(longitude)
            and -90 <= latitude <= 90
            and -180 <= longitude <= 180
            and not (latitude == 0 and longitude == 0)
        )

    @staticmethod
    def _apply(snapshot: VehicleSnapshot, data: dict) -> bool:
        normalized = _normalize_geocode_data(data)
        if normalized is None:
            return False
        snapshot.address = normalized["address"]
        snapshot.street_name = (
            normalized.get("street_name") or snapshot.street_name
        )
        snapshot.city = normalized.get("city") or snapshot.city
        return True

    def _enrich_from_cache(
        self,
        snapshot: VehicleSnapshot,
        *,
        max_age_seconds: float,
        max_distance_m: float,
    ) -> bool:
        now = time.monotonic()
        with self._lock:
            entry = self._cache.get(snapshot.vehicle_id)

        if entry is None or now - entry.created_monotonic > max_age_seconds:
            return False
        if (
            haversine_m(
                entry.latitude,
                entry.longitude,
                snapshot.lat,
                snapshot.lng,
            )
            > max_distance_m
        ):
            return False

        return self._apply(snapshot, entry.data)

    def enrich_from_cache(self, snapshot: VehicleSnapshot) -> bool:
        """Aplica um resultado recente e próximo, sem fazer I/O."""

        return self._enrich_from_cache(
            snapshot,
            max_age_seconds=self.cache_ttl_seconds,
            max_distance_m=self.cache_distance_m,
        )

    def enrich_from_stale_cache(self, snapshot: VehicleSnapshot) -> bool:
        """Usa dado antigo próximo enquanto agenda sua atualização."""

        return self._enrich_from_cache(
            snapshot,
            max_age_seconds=self.stale_cache_ttl_seconds,
            max_distance_m=self.stale_cache_distance_m,
        )

    def request(self, snapshot: VehicleSnapshot) -> bool:
        """Registra a coordenada mais recente; retorna imediatamente."""

        if not self._valid_coordinates(snapshot.lat, snapshot.lng):
            return False

        job = _GeocodeJob(
            vehicle_id=snapshot.vehicle_id,
            latitude=snapshot.lat,
            longitude=snapshot.lng,
            requested_monotonic=time.monotonic(),
        )
        should_queue = False
        with self._lock:
            if self._closed:
                return False
            self._latest[job.vehicle_id] = job
            if job.vehicle_id not in self._scheduled:
                self._scheduled.add(job.vehicle_id)
                should_queue = True

        if should_queue:
            self._queue.put_nowait(job.vehicle_id)
        return True

    def enrich(self, snapshot: VehicleSnapshot) -> bool:
        """Usa cache disponivel e agenda refresh sem esperar pelo backend."""

        if self.enrich_from_cache(snapshot):
            return True

        stale = self.enrich_from_stale_cache(snapshot)
        self.request(snapshot)
        if stale:
            return True

        existing = _normalize_geocode_data(
            {
                "address": snapshot.address,
                "street_name": snapshot.street_name,
                "city": snapshot.city,
            }
        )
        if existing is None:
            snapshot.street_name = None
            snapshot.address = coordinate_fallback(snapshot.lat, snapshot.lng)
        return False

    def _finish_vehicle(self, vehicle_id: str, job: _GeocodeJob) -> bool:
        """Retorna True quando surgiu uma coordenada mais nova para o veiculo."""

        with self._lock:
            latest = self._latest.get(vehicle_id)
            if latest is not None and latest != job and not self._stop_event.is_set():
                return True
            self._latest.pop(vehicle_id, None)
            self._scheduled.discard(vehicle_id)
            return False

    def _process_vehicle(self, vehicle_id: str) -> None:
        while not self._stop_event.is_set():
            with self._lock:
                job: Optional[_GeocodeJob] = self._latest.get(vehicle_id)
            if job is None:
                with self._lock:
                    self._scheduled.discard(vehicle_id)
                return

            age = time.monotonic() - job.requested_monotonic
            if age <= self.max_job_age_seconds:
                data: Optional[dict] = None
                for attempt in range(1, self.max_attempts + 1):
                    with self._lock:
                        if self._latest.get(vehicle_id) != job:
                            break
                    try:
                        candidate = self.backend.reverse_geocode(
                            job.latitude,
                            job.longitude,
                        )
                        data = _normalize_geocode_data(candidate)
                        if data is not None:
                            break
                        reason = "resultado sem endereco utilizavel"
                    except Exception as exc:
                        reason = type(exc).__name__
                    logger.warning(
                        "Geocodificacao em background falhou "
                        "(%s, tentativa %d/%d)",
                        reason,
                        attempt,
                        self.max_attempts,
                    )
                    if attempt < self.max_attempts and self._stop_event.wait(
                        self.retry_base_seconds * (2 ** (attempt - 1))
                    ):
                        return

                if data is not None:
                    with self._lock:
                        if self._latest.get(vehicle_id) == job:
                            self._cache[vehicle_id] = _CacheEntry(
                                latitude=job.latitude,
                                longitude=job.longitude,
                                created_monotonic=time.monotonic(),
                                data=data,
                            )

            if not self._finish_vehicle(vehicle_id, job):
                return

    def _run(self) -> None:
        while True:
            item = self._queue.get()
            try:
                if item is self._STOP:
                    return
                if isinstance(item, str):
                    self._process_vehicle(item)
            finally:
                self._queue.task_done()

    def close(self, timeout: float = 8.0) -> None:
        with self._lock:
            first_close = not self._closed
            self._closed = True
        if first_close:
            self._stop_event.set()
            self._queue.put_nowait(self._STOP)
        self._thread.join(timeout=max(0.0, timeout))
        if self._thread.is_alive():
            logger.warning(
                "Worker de geocodificacao nao encerrou em %.1fs",
                timeout,
            )
