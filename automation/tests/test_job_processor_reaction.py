from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

import httpx

from app.config import settings
from app.workers.job_processor import JobProcessor


class JobProcessorReactionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.setting_patchers = (
            patch.object(settings, "ZAPI_INSTANCE_ID", "instance-from-env"),
            patch.object(settings, "ZAPI_TOKEN", "token-from-env"),
            patch.object(settings, "ZAPI_CLIENT_TOKEN", "client-from-env"),
        )
        for patcher in self.setting_patchers:
            patcher.start()

    def tearDown(self) -> None:
        for patcher in reversed(self.setting_patchers):
            patcher.stop()

    @staticmethod
    def configured_http_client(client_class):
        context = client_class.return_value
        return context.__enter__.return_value

    @patch("app.workers.job_processor.httpx.Client")
    def test_uses_configured_credentials_payload_and_bounded_timeout(
        self,
        client_class,
    ) -> None:
        http_client = self.configured_http_client(client_class)
        http_client.post.return_value = MagicMock(status_code=202)

        JobProcessor.send_reaction_zapi(
            "5548996553954",
            "message-id",
            "📸",
        )

        timeout = client_class.call_args.kwargs["timeout"]
        self.assertEqual(timeout.connect, 5.0)
        self.assertEqual(timeout.read, 10.0)
        http_client.post.assert_called_once_with(
            (
                "https://api.z-api.io/instances/instance-from-env/"
                "token/token-from-env/send-reaction"
            ),
            json={
                "phone": "5548996553954",
                "reaction": "📸",
                "messageId": "message-id",
            },
            headers={
                "Client-Token": "client-from-env",
                "Content-Type": "application/json",
            },
        )

    @patch("app.workers.job_processor.httpx.Client")
    def test_missing_configuration_skips_request_without_exposing_values(
        self,
        client_class,
    ) -> None:
        with patch.object(settings, "ZAPI_TOKEN", "   "):
            with self.assertLogs(
                "app.workers.job_processor",
                level="WARNING",
            ) as logs:
                JobProcessor.send_reaction_zapi(
                    "5548996553954",
                    "message-id",
                    "📸",
                )

        client_class.assert_not_called()
        output = "\n".join(logs.output)
        self.assertIn("configuração de autenticação incompleta", output)
        self.assertNotIn("instance-from-env", output)
        self.assertNotIn("client-from-env", output)

    @patch("app.workers.job_processor.httpx.Client")
    def test_http_error_does_not_log_response_or_credentials(
        self,
        client_class,
    ) -> None:
        http_client = self.configured_http_client(client_class)
        response = MagicMock(status_code=500)
        response.text = "resposta-sensível"
        http_client.post.return_value = response

        with self.assertLogs(
            "app.workers.job_processor",
            level="ERROR",
        ) as logs:
            JobProcessor.send_reaction_zapi(
                "5548996553954",
                "message-id",
                "📸",
            )

        output = "\n".join(logs.output)
        self.assertIn("HTTP 500", output)
        self.assertNotIn("resposta-sensível", output)
        self.assertNotIn("token-from-env", output)
        self.assertNotIn("client-from-env", output)
        self.assertNotIn("5548996553954", output)
        self.assertIn("3954", output)

    @patch("app.workers.job_processor.httpx.Client")
    def test_timeout_is_contained_without_logging_secret_url(
        self,
        client_class,
    ) -> None:
        http_client = self.configured_http_client(client_class)
        http_client.post.side_effect = httpx.ReadTimeout(
            "https://api.z-api.io/token/SEGREDO-NAO-LOGAR"
        )

        with self.assertLogs(
            "app.workers.job_processor",
            level="ERROR",
        ) as logs:
            JobProcessor.send_reaction_zapi(
                "5548996553954",
                "message-id",
                "📸",
            )

        output = "\n".join(logs.output)
        self.assertIn("ReadTimeout", output)
        self.assertNotIn("SEGREDO", output)
        self.assertNotIn("https://", output)


if __name__ == "__main__":
    unittest.main()
