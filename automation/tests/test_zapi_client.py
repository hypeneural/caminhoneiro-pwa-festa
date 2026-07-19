from __future__ import annotations

import base64
import threading
import time
import unittest
from unittest.mock import MagicMock, patch

import httpx

from app.tracker.zapi_client import ZAPIClient


class ZAPIClientTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = ZAPIClient("instance", "token", "client-token")

    def tearDown(self) -> None:
        self.client.close()

    @staticmethod
    def mock_response(status_code: int, json_value):
        response = MagicMock()
        response.status_code = status_code
        if isinstance(json_value, Exception):
            response.json.side_effect = json_value
        else:
            response.json.return_value = json_value
        return response

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_sends_jpeg_as_base64_data_uri(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            {"messageId": "message-1"},
        )
        image_bytes = b"\xff\xd8jpeg-data\xff\xd9"

        result = self.client.send_image_bytes(
            "5548999999999",
            image_bytes,
            "Legenda",
        )

        self.assertEqual(result["messageId"], "message-1")
        payload = http_client.post.call_args.kwargs["json"]
        prefix, encoded = payload["image"].split(",", 1)
        self.assertEqual(prefix, "data:image/jpeg;base64")
        self.assertEqual(base64.b64decode(encoded), image_bytes)
        self.assertEqual(payload["phone"], "5548999999999")
        self.assertIsNone(self.client.get_last_failure())

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_normalizes_phone_and_sends_text_payload(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            {"messageId": "text-1", "zaapId": "zaap-text-1"},
        )

        result = self.client.send_text(
            "+55 (48) 99655-3954",
            "Teste controlado",
        )

        self.assertEqual(result["messageId"], "text-1")
        self.assertEqual(
            http_client.post.call_args.kwargs["json"],
            {"phone": "5548996553954", "message": "Teste controlado"},
        )

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_preserves_modern_and_legacy_group_ids(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.side_effect = (
            self.mock_response(200, {"messageId": "group-modern"}),
            self.mock_response(200, {"messageId": "group-legacy"}),
        )

        modern = "120363407707102690-group"
        legacy = "5511999999999-1623275280"

        self.assertIsNotNone(self.client.send_text(modern, "Moderno"))
        self.assertIsNotNone(self.client.send_text(legacy, "Legado"))

        payloads = [call.kwargs["json"] for call in http_client.post.call_args_list]
        self.assertEqual(payloads[0]["phone"], modern)
        self.assertEqual(payloads[1]["phone"], legacy)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_sends_location_payload(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            {"messageId": "location-1"},
        )

        result = self.client.send_location(
            "+55 48 99655-3954",
            -27.241,
            -48.646,
            "Veículo de teste",
            "Tijucas/SC",
        )

        self.assertEqual(result["messageId"], "location-1")
        self.assertEqual(
            http_client.post.call_args.kwargs["json"],
            {
                "phone": "5548996553954",
                "latitude": "-27.241",
                "longitude": "-48.646",
                "title": "Veículo de teste",
                "address": "Tijucas/SC",
            },
        )

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_invalid_phone_is_rejected_before_post(self, client_class) -> None:
        invalid_values = (
            "",
            "+",
            "123456789",
            "1234567890123456",
            "+55 48 CALL-ME",
            "55+48996553954",
            "120363407707102690-GROUP",
            "120363407707102690-group-extra",
            "123-group",
            "120363407707102690_group",
            None,
        )

        for value in invalid_values:
            with self.subTest(phone=value):
                self.assertIsNone(self.client.send_text(value, "Oi"))
                failure = self.client.get_last_failure()
                self.assertEqual(failure.code, "invalid_phone")
                self.assertFalse(failure.retryable)

        client_class.assert_not_called()

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_timeout_is_retryable_without_sensitive_log(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.side_effect = httpx.ReadTimeout(
            "https://api.z-api.io/token/SEGREDO-NAO-LOGAR"
        )

        with self.assertLogs("app.tracker.zapi_client", level="ERROR") as logs:
            result = self.client.send_text("5548996553954", "Oi")

        self.assertIsNone(result)
        failure = self.client.get_last_failure()
        self.assertEqual(failure.code, "timeout")
        self.assertTrue(failure.retryable)
        self.assertEqual(failure.exception_type, "ReadTimeout")
        output = "\n".join(logs.output)
        self.assertNotIn("SEGREDO", output)
        self.assertNotIn("https://", output)
        self.assertNotIn("Oi", output)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_429_is_retryable_and_401_is_terminal(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(429, {})

        self.assertIsNone(self.client.send_text("5548996553954", "Um"))
        failure = self.client.get_last_failure()
        self.assertEqual(failure.status_code, 429)
        self.assertTrue(failure.retryable)

        http_client.post.return_value = self.mock_response(401, {})
        self.assertIsNone(self.client.send_text("5548996553954", "Dois"))
        failure = self.client.get_last_failure()
        self.assertEqual(failure.status_code, 401)
        self.assertFalse(failure.retryable)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_preserves_real_message_id_and_separate_zaap_id(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            {
                "messageId": "whatsapp-real",
                "zaapId": "zapi-internal",
                "id": "compatibility-id",
            },
        )

        result = self.client.send_text("5548996553954", "Oi")

        self.assertEqual(result["messageId"], "whatsapp-real")
        self.assertEqual(result["zaapId"], "zapi-internal")
        self.assertEqual(result["id"], "compatibility-id")

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_fallback_ids_only_when_message_id_is_missing(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        http_client.post.side_effect = (
            self.mock_response(
                200,
                {"id": "compatibility-id", "zaapId": "zapi-one"},
            ),
            self.mock_response(200, {"zaapId": "zapi-two"}),
        )

        first = self.client.send_text("5548996553954", "Um")
        second = self.client.send_text("5548996553954", "Dois")

        self.assertEqual(first["messageId"], "compatibility-id")
        self.assertEqual(first["zaapId"], "zapi-one")
        self.assertEqual(second["messageId"], "zapi-two")
        self.assertEqual(second["zaapId"], "zapi-two")

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_missing_all_ids_is_terminal(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(200, {"ok": True})

        self.assertIsNone(self.client.send_text("5548996553954", "Oi"))
        failure = self.client.get_last_failure()
        self.assertEqual(failure.code, "missing_message_id")
        self.assertFalse(failure.retryable)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_invalid_json_is_retryable(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            ValueError("conteúdo potencialmente sensível"),
        )

        self.assertIsNone(self.client.send_text("5548996553954", "Oi"))
        failure = self.client.get_last_failure()
        self.assertEqual(failure.code, "invalid_json")
        self.assertTrue(failure.retryable)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_reuses_client_and_closes_it(self, client_class) -> None:
        http_client = client_class.return_value
        http_client.post.return_value = self.mock_response(
            200,
            {"messageId": "message-1"},
        )

        self.client.send_text("5548996553954", "Um")
        self.client.send_text("5548996553954", "Dois")
        self.client.close()

        client_class.assert_called_once_with()
        self.assertEqual(http_client.post.call_count, 2)
        http_client.close.assert_called_once_with()

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_close_timeout_defers_pool_close_until_request_finishes(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        request_started = threading.Event()
        release_request = threading.Event()

        def blocking_post(*args, **kwargs):
            request_started.set()
            release_request.wait(2)
            return self.mock_response(200, {"messageId": "late"})

        http_client.post.side_effect = blocking_post
        results = []
        sender = threading.Thread(
            target=lambda: results.append(
                self.client.send_text("5548996553954", "Mensagem em andamento")
            ),
            daemon=True,
        )
        sender.start()
        self.assertTrue(request_started.wait(1))

        started_at = time.monotonic()
        with self.assertLogs("app.tracker.zapi_client", level="WARNING"):
            closed = self.client.close(timeout=0.02)
        elapsed = time.monotonic() - started_at

        self.assertFalse(closed)
        self.assertLess(elapsed, 0.2)
        http_client.close.assert_not_called()

        release_request.set()
        sender.join(timeout=1)
        self.assertFalse(sender.is_alive())
        self.assertEqual(results[0]["messageId"], "late")
        http_client.close.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
