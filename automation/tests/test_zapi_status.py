from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

import httpx

from app.tracker.zapi_client import ZAPIClient


class ZAPIStatusTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = ZAPIClient(
            "instance-secret",
            "token-secret",
            "client-token-secret",
        )

    def tearDown(self) -> None:
        self.client.close()

    @staticmethod
    def response(status_code: int, json_value):
        response = MagicMock()
        response.status_code = status_code
        if isinstance(json_value, Exception):
            response.json.side_effect = json_value
        else:
            response.json.return_value = json_value
        return response

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_gets_validated_status_without_requiring_message_id(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        expected = {
            "connected": True,
            "smartphoneConnected": True,
            "session": "optional-extra-field",
        }
        http_client.get.return_value = self.response(200, expected)

        result = self.client.get_instance_status()

        self.assertEqual(result, expected)
        http_client.get.assert_called_once_with(
            (
                "https://api.z-api.io/instances/instance-secret/"
                "token/token-secret/status"
            ),
            headers={
                "Client-Token": "client-token-secret",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        http_client.post.assert_not_called()
        self.assertIsNone(self.client.get_last_failure())

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_false_connectivity_values_are_valid_status(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        http_client.get.return_value = self.response(
            200,
            {"connected": False, "smartphoneConnected": False},
        )

        result = self.client.get_instance_status()

        self.assertEqual(
            result,
            {"connected": False, "smartphoneConnected": False},
        )
        self.assertIsNone(self.client.get_last_failure())

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_reuses_pool_for_status_and_send(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        http_client.get.return_value = self.response(
            200,
            {"connected": True, "smartphoneConnected": True},
        )
        http_client.post.return_value = self.response(
            200,
            {"messageId": "message-1"},
        )

        self.assertIsNotNone(self.client.get_instance_status())
        self.assertIsNotNone(
            self.client.send_text("5548996553954", "Teste controlado")
        )

        client_class.assert_called_once_with()
        self.assertEqual(http_client.get.call_count, 1)
        self.assertEqual(http_client.post.call_count, 1)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_rejects_missing_or_non_boolean_connectivity_fields(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        invalid_values = (
            {"connected": True},
            {"connected": 1, "smartphoneConnected": True},
            {"connected": True, "smartphoneConnected": "true"},
        )
        http_client.get.side_effect = [
            self.response(200, value) for value in invalid_values
        ]

        for value in invalid_values:
            with self.subTest(value=value):
                self.assertIsNone(self.client.get_instance_status())
                failure = self.client.get_last_failure()
                self.assertEqual(failure.code, "invalid_response")
                self.assertFalse(failure.retryable)

    @patch("app.tracker.zapi_client.httpx.Client")
    def test_http_and_timeout_failures_are_safe_and_classified(
        self,
        client_class,
    ) -> None:
        http_client = client_class.return_value
        http_client.get.return_value = self.response(503, {"secret": "body"})

        with self.assertLogs(
            "app.tracker.zapi_client",
            level="ERROR",
        ) as http_logs:
            self.assertIsNone(self.client.get_instance_status())
        failure = self.client.get_last_failure()
        self.assertEqual(failure.status_code, 503)
        self.assertTrue(failure.retryable)
        self.assertNotIn("body", "\n".join(http_logs.output))

        http_client.get.side_effect = httpx.ReadTimeout(
            "https://api.z-api.io/token/TOKEN-NAO-LOGAR"
        )
        with self.assertLogs(
            "app.tracker.zapi_client",
            level="ERROR",
        ) as timeout_logs:
            self.assertIsNone(self.client.get_instance_status())

        failure = self.client.get_last_failure()
        self.assertEqual(failure.code, "timeout")
        self.assertTrue(failure.retryable)
        output = "\n".join(timeout_logs.output)
        self.assertNotIn("TOKEN-NAO-LOGAR", output)
        self.assertNotIn("https://", output)


if __name__ == "__main__":
    unittest.main()
