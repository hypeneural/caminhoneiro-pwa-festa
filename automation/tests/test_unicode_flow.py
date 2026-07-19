from __future__ import annotations

import json
import tempfile
import threading
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import httpx

from app.tracker.models import VehicleSnapshot, VehicleState
from app.tracker.notifications import AsyncZAPIDispatcher
from app.tracker.templates import build_message_context, render_message
from app.tracker.tracker_db import TrackerDB
from app.tracker.zapi_client import ZAPIClient


UNICODE_MESSAGE = (
    "🧪 Acentuação: Procissão, localização, veículo — São Cristóvão. 📍"
)


class CapturingZAPI:
    def __init__(self) -> None:
        self.message = None
        self.called = threading.Event()

    def send_text(self, phone, message):
        self.message = message
        self.called.set()
        return {"messageId": "unicode-1"}

    def send_location(self, *args, **kwargs):
        raise AssertionError("canal não usado")

    def get_last_failure(self):
        return None


class UnicodeFlowTests(unittest.TestCase):
    def test_http_json_body_preserves_accents_and_emoji(self) -> None:
        received = []

        def handler(request: httpx.Request) -> httpx.Response:
            received.append(json.loads(request.content.decode("utf-8")))
            return httpx.Response(200, json={"messageId": "unicode-http"})

        transport_client = httpx.Client(
            transport=httpx.MockTransport(handler)
        )
        with patch(
            "app.tracker.zapi_client.httpx.Client",
            return_value=transport_client,
        ):
            zapi = ZAPIClient("instance", "token", "client-token")
            try:
                result = zapi.send_text("5548996553954", UNICODE_MESSAGE)
            finally:
                zapi.close()

        self.assertEqual(result["messageId"], "unicode-http")
        self.assertEqual(received[0]["message"], UNICODE_MESSAGE)

    def test_sqlite_outbox_round_trip_preserves_unicode(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = TrackerDB(str(Path(directory) / "tracker.db"))
            zapi = CapturingZAPI()
            dispatcher = AsyncZAPIDispatcher(
                zapi=zapi,
                db=db,
                max_attempts=1,
                retry_backoff_seconds=(0,),
                idle_poll_seconds=0.01,
            )
            try:
                self.assertTrue(
                    dispatcher.try_submit_text(
                        "v1",
                        "unicode:text",
                        "5548996553954",
                        UNICODE_MESSAGE,
                    )
                )
                self.assertTrue(zapi.called.wait(1))
                self.assertTrue(dispatcher.wait_for_idle(timeout=1))
            finally:
                dispatcher.close(timeout=1)

            self.assertEqual(zapi.message, UNICODE_MESSAGE)
            stored = db.get_notification(
                channel="text",
                dedupe_key="unicode:text",
            )
            self.assertEqual(stored.payload["message"], UNICODE_MESSAGE)

    def test_real_message_template_is_unicode(self) -> None:
        now = datetime.now(timezone.utc)
        snapshot = VehicleSnapshot(
            vehicle_id="v1",
            name="Procissão de São Cristóvão",
            vehicle_type="main",
            lat=-27.24,
            lng=-48.63,
            speed_kmh=12,
            bearing=90,
            accuracy=5,
            battery=80,
            updated_at=now,
            server_time=now,
            stale=False,
            status="live",
            address="Avenida dos Caminhoneiros",
            street_name="Avenida dos Caminhoneiros",
            city="Tijucas",
        )
        state = VehicleState(vehicle_id="v1")
        message = render_message(
            "moving",
            build_message_context(snapshot, state, now),
            0,
        )

        self.assertIn("Procissão de São Cristóvão", message)
        self.assertIn("Localização Atual", message)
        self.assertIn("📍", message)


if __name__ == "__main__":
    unittest.main()
