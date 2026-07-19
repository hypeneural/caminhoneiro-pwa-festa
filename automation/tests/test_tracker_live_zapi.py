from __future__ import annotations

import json
import os
import tempfile
import time
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.config import settings
from app.tracker.engine import TrackerEngine
from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.notifications import AsyncZAPIDispatcher
from app.tracker.panorama import PanoramaDispatcher
from app.tracker.streetview import PanoramaArtifact, StreetViewUnavailable
from app.tracker.tracker_db import TrackerDB
from app.tracker.zapi_client import ZAPIClient


LIVE_ENABLED = os.getenv("RUN_LIVE_TRACKER_ZAPI") == "1"
EXPECTED_PHONE = "5548996553954"


class StaticGeocoder:
    def __init__(self, address: str, street_name: str) -> None:
        self.address = address
        self.street_name = street_name

    def reverse_geocode(self, latitude: float, longitude: float) -> dict:
        return {
            "address": self.address,
            "street_name": self.street_name,
            "city": "São Paulo",
        }


class JpegArtifactGenerator:
    def __init__(self, path: Path) -> None:
        self.jpeg = path.read_bytes()
        if not self.jpeg.startswith(b"\xff\xd8") or not self.jpeg.endswith(b"\xff\xd9"):
            raise ValueError("LIVE_TRACKER_PANORAMA_PATH não contém um JPEG válido")
        self.generate_calls = 0

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        return PanoramaArtifact(
            jpeg_bytes=self.jpeg,
            width=1280,
            height=952,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def close(self) -> None:
        return None

    def cancel(self) -> None:
        return None


class NoCoverageGenerator:
    def __init__(self) -> None:
        self.generate_calls = 0

    def generate(self, **kwargs) -> PanoramaArtifact:
        self.generate_calls += 1
        raise StreetViewUnavailable("live_validation_no_coverage")

    def close(self) -> None:
        return None

    def cancel(self) -> None:
        return None


@unittest.skipUnless(
    LIVE_ENABLED,
    "Defina RUN_LIVE_TRACKER_ZAPI=1 para autorizar mensagens reais.",
)
class LiveTrackerZAPIValidation(unittest.TestCase):
    def setUp(self) -> None:
        phone = os.getenv("LIVE_TRACKER_ZAPI_PHONE", "")
        self.assertEqual(
            phone,
            EXPECTED_PHONE,
            "O telefone de confirmação não corresponde ao destino autorizado.",
        )
        self.assertTrue(settings.ZAPI_INSTANCE_ID)
        self.assertTrue(settings.ZAPI_TOKEN)
        self.assertTrue(settings.ZAPI_CLIENT_TOKEN)

        panorama_path = Path(os.getenv("LIVE_TRACKER_PANORAMA_PATH", ""))
        self.assertTrue(panorama_path.is_file(), "Informe LIVE_TRACKER_PANORAMA_PATH")
        self.panorama_path = panorama_path

        self._tmp = tempfile.TemporaryDirectory()
        self.db = TrackerDB(str(Path(self._tmp.name) / "live-validation.db"))
        self.zapi = ZAPIClient(
            settings.ZAPI_INSTANCE_ID,
            settings.ZAPI_TOKEN,
            settings.ZAPI_CLIENT_TOKEN,
        )
        self.notifications = AsyncZAPIDispatcher(
            zapi=self.zapi,
            db=self.db,
            text_ttl_seconds=180,
            location_ttl_seconds=180,
            max_attempts=1,
            retry_backoff_seconds=(0.1,),
            lease_seconds=30,
            idle_poll_seconds=0.05,
        )
        self.panoramas: list[PanoramaDispatcher] = []

    def tearDown(self) -> None:
        for panorama in reversed(self.panoramas):
            panorama.close(timeout=5)
        self.notifications.close(timeout=10)
        self.zapi.close(timeout=5)
        self._tmp.cleanup()

    def _panorama(self, generator) -> PanoramaDispatcher:
        dispatcher = PanoramaDispatcher(
            generator=generator,
            zapi=self.zapi,
            db=self.db,
            notification_dispatcher=self.notifications,
            max_job_age_seconds=120,
            send_attempts=1,
            send_retry_delays=(),
            lease_seconds=30,
            idle_poll_seconds=0.05,
            fallback_max_attempts=1,
            fallback_ttl_seconds=180,
            recovery_cutoff=datetime.now(timezone.utc),
        )
        self.panoramas.append(dispatcher)
        return dispatcher

    def _engine(
        self,
        panorama: PanoramaDispatcher,
        *,
        address: str,
        street_name: str,
    ) -> TrackerEngine:
        return TrackerEngine(
            zapi=self.zapi,
            db=self.db,
            geocoder=StaticGeocoder(address, street_name),
            phone=EXPECTED_PHONE,
            panorama_dispatcher=panorama,
            notification_dispatcher=self.notifications,
            combined_message_enabled=True,
            panorama_caption_max_chars=900,
        )

    @staticmethod
    def _snapshot(
        vehicle_id: str,
        *,
        name: str,
        speed: float,
        battery: int,
        latitude: float,
        longitude: float,
        now: datetime,
    ) -> VehicleSnapshot:
        return VehicleSnapshot(
            vehicle_id=vehicle_id,
            name=name,
            vehicle_type="support",
            lat=latitude,
            lng=longitude,
            speed_kmh=speed,
            bearing=90,
            accuracy=5,
            battery=battery,
            updated_at=now,
            server_time=now,
            stale=False,
            status="live",
        )

    def _wait_content(self, content_key: str, timeout: float = 45.0):
        deadline = time.monotonic() + timeout
        record = self.db.get_notification_by_content_key(content_key)
        while (
            (record is None or record.status in {"queued", "retry", "inflight"})
            and time.monotonic() < deadline
        ):
            time.sleep(0.1)
            record = self.db.get_notification_by_content_key(content_key)
        self.assertIsNotNone(record)
        self.assertEqual(record.status, "sent", record.last_error)
        self.assertTrue(record.provider_message_id)
        return record

    def _wait_location(self, dedupe_key: str, timeout: float = 45.0):
        deadline = time.monotonic() + timeout
        record = self.db.get_notification(channel="location", dedupe_key=dedupe_key)
        while (
            (record is None or record.status in {"queued", "retry", "inflight"})
            and time.monotonic() < deadline
        ):
            time.sleep(0.1)
            record = self.db.get_notification(channel="location", dedupe_key=dedupe_key)
        self.assertIsNotNone(record)
        self.assertEqual(record.status, "sent", record.last_error)
        self.assertTrue(record.provider_message_id)
        return record

    def test_three_real_production_scenarios(self) -> None:
        run_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        results: dict[str, dict[str, str]] = {}

        image_generator = JpegArtifactGenerator(self.panorama_path)
        image_dispatcher = self._panorama(image_generator)

        # 1/3: caminho feliz, cartão + imagem com legenda completa.
        now = datetime.now(timezone.utc)
        first_id = f"live-image-{run_id}"
        first = self._snapshot(
            first_id,
            name="[VALIDAÇÃO PRODUÇÃO 1/3] Procissão de São Cristóvão",
            speed=12,
            battery=73,
            latitude=-23.5614,
            longitude=-46.6559,
            now=now,
        )
        first_state = VehicleState(vehicle_id=first_id, current_status="MOVING")
        first_engine = self._engine(
            image_dispatcher,
            address="VALIDAÇÃO 1/3 — Avenida Paulista, São Paulo/SP",
            street_name="Avenida Paulista",
        )
        first_engine.process_snapshot(first, first_state, now)
        first_anchor = f"moving:{first.updated_at.isoformat()}"
        first_content_key = f"{first_id}:{first_anchor}:content"
        first_content = self._wait_content(first_content_key)
        first_location = self._wait_location(f"{first_id}:{first_anchor}:location")

        self.assertEqual(first_content.channel, "panorama")
        self.assertEqual(image_generator.generate_calls, 1)
        caption = first_content.payload["caption"]
        self.assertIn("🚗 *Em deslocamento:* *12 km/h*", caption)
        self.assertIn("🔋 *Bateria:* *73%*", caption)
        self.assertIn("Procissão de São Cristóvão", caption)
        self.assertIn("Imagem panorâmica aproximada", caption)

        # A repetição do mesmo alerta não pode gerar uma chamada externa nova.
        count_before_duplicate = self.db.count_notifications()
        duplicate_state = VehicleState(vehicle_id=first_id, current_status="MOVING")
        first_engine.process_snapshot(
            first,
            duplicate_state,
            now + timedelta(seconds=1),
        )
        time.sleep(0.5)
        self.assertEqual(self.db.count_notifications(), count_before_duplicate)
        self.assertEqual(image_generator.generate_calls, 1)
        results["1_image"] = {
            "location": first_location.provider_message_id,
            "image": first_content.provider_message_id,
        }

        # 2/3: cooldown torna o panorama inelegível; cartão + texto imediato.
        now = datetime.now(timezone.utc)
        second_id = f"live-cooldown-{run_id}"
        second = self._snapshot(
            second_id,
            name="[VALIDAÇÃO PRODUÇÃO 2/3] Procissão de São Cristóvão",
            speed=5,
            battery=19,
            latitude=-23.5620,
            longitude=-46.6554,
            now=now,
        )
        second_state = VehicleState(
            vehicle_id=second_id,
            current_status="MOVING",
            last_image_attempt_at=now,
        )
        second_engine = self._engine(
            image_dispatcher,
            address="VALIDAÇÃO 2/3 — Avenida Paulista, São Paulo/SP",
            street_name="Avenida Paulista",
        )
        second_engine.process_snapshot(second, second_state, now)
        second_anchor = f"moving:{second.updated_at.isoformat()}"
        second_content = self._wait_content(
            f"{second_id}:{second_anchor}:content"
        )
        second_location = self._wait_location(
            f"{second_id}:{second_anchor}:location"
        )

        self.assertEqual(second_content.channel, "text")
        second_message = second_content.payload["message"]
        self.assertIn("🐢 *Marcha lenta:* *5 km/h*", second_message)
        self.assertIn("🪫 *Bateria fraca:* *19%*", second_message)
        self.assertEqual(image_generator.generate_calls, 1)
        results["2_cooldown_text"] = {
            "location": second_location.provider_message_id,
            "text": second_content.provider_message_id,
        }

        # 3/3: ausência de cobertura promove a mesma linha para texto.
        image_dispatcher.close(timeout=5)
        unavailable_generator = NoCoverageGenerator()
        unavailable_dispatcher = self._panorama(unavailable_generator)
        now = datetime.now(timezone.utc)
        third_id = f"live-no-coverage-{run_id}"
        third = self._snapshot(
            third_id,
            name="[VALIDAÇÃO PRODUÇÃO 3/3] Procissão de São Cristóvão",
            speed=0,
            battery=20,
            latitude=-23.5630,
            longitude=-46.6545,
            now=now,
        )
        stationary_since = now - timedelta(minutes=4)
        third_state = VehicleState(
            vehicle_id=third_id,
            current_status="STOPPING",
            stationary_since=stationary_since,
            last_observed_lat=third.lat,
            last_observed_lng=third.lng,
        )
        third_engine = self._engine(
            unavailable_dispatcher,
            address="VALIDAÇÃO 3/3 — Avenida Paulista, São Paulo/SP",
            street_name="Avenida Paulista",
        )
        third_engine.process_snapshot(third, third_state, now)
        third_anchor = f"stopped:{stationary_since.isoformat()}"
        third_content = self._wait_content(
            f"{third_id}:{third_anchor}:content"
        )
        third_location = self._wait_location(
            f"{third_id}:{third_anchor}:location"
        )

        self.assertEqual(third_content.channel, "text")
        third_message = third_content.payload["message"]
        self.assertIn("🛑 *Parado:* *0 km/h*", third_message)
        self.assertIn("🔋 *Bateria:* *20%*", third_message)
        self.assertEqual(unavailable_generator.generate_calls, 1)
        third_runtime = self.db.load_state(third_id)
        self.assertIsNotNone(third_runtime.last_image_unavailable_at)
        results["3_no_coverage_text"] = {
            "location": third_location.provider_message_id,
            "text": third_content.provider_message_id,
        }

        self.assertTrue(self.notifications.wait_for_idle(timeout=15))
        print("LIVE_ZAPI_RESULTS=" + json.dumps(results, ensure_ascii=False))

