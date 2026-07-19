"""Cliente HTTP robusto para envios WhatsApp pela Z-API."""

from __future__ import annotations

import base64
import logging
import math
import re
import threading
import time
from dataclasses import dataclass
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# A URL da Z-API contém o token no path. Evita que os loggers internos do
# HTTPX/httpcore exponham a URL ou headers quando o log raiz estiver em INFO.
for _logger_name in ("httpx", "httpcore"):
    _dependency_logger = logging.getLogger(_logger_name)
    if _dependency_logger.level < logging.WARNING:
        _dependency_logger.setLevel(logging.WARNING)

_PHONE_SEPARATORS_RE = re.compile(r"[\s().-]+")
_MODERN_GROUP_ID_RE = re.compile(r"^[0-9]{18}-group$")
_LEGACY_GROUP_ID_RE = re.compile(r"^[0-9]{10,15}-[0-9]{9,20}$")
_IMAGE_MIME_RE = re.compile(r"^image/[A-Za-z0-9.+-]+$")


@dataclass(frozen=True)
class ZAPIFailure:
    """Diagnóstico seguro para retry, sem payload ou autenticação.

    A falha é armazenada por thread. Workers concorrentes podem consultar
    ``get_last_failure()`` logo após um envio retornar ``None`` sem que outro
    worker sobrescreva o diagnóstico.
    """

    code: str
    retryable: bool
    status_code: Optional[int] = None
    exception_type: Optional[str] = None


class ZAPIClient:
    """Cliente thread-safe e compatível com o contrato histórico da Z-API.

    Um único ``httpx.Client`` é criado de forma lazy e compartilhado entre
    threads, reaproveitando conexões. Os métodos continuam retornando ``dict``
    em caso de aceite ou ``None`` em caso de falha. Depois de ``None``, use
    :meth:`get_last_failure` na mesma thread para decidir sobre retry.

    Chame :meth:`close` somente após encerrar os workers que usam a instância.
    """

    def __init__(self, instance_id: str, token: str, client_token: str):
        self.base_url = (
            f"https://api.z-api.io/instances/{instance_id}/token/{token}"
        )
        self.headers = {
            "Client-Token": client_token,
            "Content-Type": "application/json",
        }
        self._client: Optional[httpx.Client] = None
        self._client_condition = threading.Condition()
        self._active_requests = 0
        self._closed = False
        self._failure_local = threading.local()

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Normaliza telefone internacional ou preserva ID de grupo.

        Aceita um ``+`` inicial e separadores comuns: espaços, parênteses,
        pontos e hífens em telefones. IDs de grupo modernos ``...-group`` e
        legados ``telefone-timestamp`` são preservados sem alteração.
        """

        if not isinstance(phone, str):
            raise ValueError("invalid_phone")

        value = phone.strip()
        if (
            _MODERN_GROUP_ID_RE.fullmatch(value)
            or _LEGACY_GROUP_ID_RE.fullmatch(value)
        ):
            return value
        if value.startswith("+"):
            value = value[1:]
        digits = _PHONE_SEPARATORS_RE.sub("", value)
        if not digits.isascii() or not digits.isdigit():
            raise ValueError("invalid_phone")
        if not 10 <= len(digits) <= 15:
            raise ValueError("invalid_phone")
        return digits

    def get_last_failure(self) -> Optional[ZAPIFailure]:
        """Retorna a última falha da thread, ou ``None`` após sucesso."""

        return getattr(self._failure_local, "value", None)

    def _clear_failure(self) -> None:
        self._failure_local.value = None

    def _set_failure(
        self,
        code: str,
        *,
        retryable: bool,
        status_code: Optional[int] = None,
        exception_type: Optional[str] = None,
    ) -> None:
        self._failure_local.value = ZAPIFailure(
            code=code,
            retryable=retryable,
            status_code=status_code,
            exception_type=exception_type,
        )

    def _invalid_payload(
        self,
        action: str,
        code: str = "invalid_payload",
    ) -> None:
        self._set_failure(code, retryable=False)
        logger.error("Z-API %s: payload rejeitado (%s)", action, code)
        return None

    def _prepare_phone(self, action: str, phone: str) -> Optional[str]:
        self._clear_failure()
        try:
            return self.normalize_phone(phone)
        except (TypeError, ValueError):
            self._invalid_payload(action, "invalid_phone")
            return None

    def _acquire_client(self) -> Optional[httpx.Client]:
        with self._client_condition:
            if self._closed:
                return None
            if self._client is None:
                self._client = httpx.Client()
            self._active_requests += 1
            return self._client

    def _release_client(self) -> None:
        client_to_close: Optional[httpx.Client] = None
        with self._client_condition:
            self._active_requests -= 1
            if self._active_requests == 0:
                self._client_condition.notify_all()
                # If close() reached its deadline, the last request owns the
                # deferred pool close instead of blocking the shutdown caller.
                if self._closed and self._client is not None:
                    client_to_close = self._client
                    self._client = None

        if client_to_close is not None:
            self._close_http_client(client_to_close)


    @staticmethod
    def _is_retryable_status(status_code: int) -> bool:
        return status_code in {408, 429} or status_code >= 500

    @staticmethod
    def _identifier(value: object) -> Optional[str]:
        if isinstance(value, str) and value.strip():
            return value
        if isinstance(value, int):
            return str(value)
        return None

    def _post(
        self,
        action: str,
        payload: dict,
        *,
        timeout_seconds: float = 10.0,
    ) -> Optional[dict]:
        """Executa POST e classifica falhas sem registrar dados sensíveis."""

        self._clear_failure()
        acquired = False
        try:
            client = self._acquire_client()
            if client is None:
                self._set_failure("client_closed", retryable=False)
                logger.error("Z-API %s: cliente encerrado", action)
                return None
            acquired = True

            response = client.post(
                f"{self.base_url}/{action}",
                json=payload,
                headers=self.headers,
                timeout=timeout_seconds,
            )
            status_code = response.status_code
            if not 200 <= status_code < 300:
                retryable = self._is_retryable_status(status_code)
                self._set_failure(
                    "http_status",
                    retryable=retryable,
                    status_code=status_code,
                )
                logger.error(
                    "Z-API %s: HTTP %s (retryable=%s)",
                    action,
                    status_code,
                    retryable,
                )
                return None

            try:
                result = response.json()
            except ValueError:
                self._set_failure(
                    "invalid_json",
                    retryable=True,
                    status_code=status_code,
                )
                logger.error("Z-API %s: resposta JSON inválida", action)
                return None

            if not isinstance(result, dict):
                self._set_failure(
                    "invalid_response",
                    retryable=False,
                    status_code=status_code,
                )
                logger.error(
                    "Z-API %s: estrutura de resposta inesperada",
                    action,
                )
                return None

            # messageId é o ID real do WhatsApp. zaapId permanece separado.
            # id/zaapId são fallback apenas quando messageId está ausente.
            message_id = self._identifier(result.get("messageId"))
            if message_id is None:
                message_id = (
                    self._identifier(result.get("id"))
                    or self._identifier(result.get("zaapId"))
                )
                if message_id is not None:
                    result["messageId"] = message_id

            if message_id is None:
                self._set_failure(
                    "missing_message_id",
                    retryable=False,
                    status_code=status_code,
                )
                logger.error("Z-API %s: resposta sem identificador", action)
                return None

            logger.info(
                "Z-API %s: HTTP %s | messageId=%s",
                action,
                status_code,
                message_id,
            )
            return result
        except httpx.TimeoutException as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "timeout",
                retryable=True,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: timeout (%s)",
                action,
                exception_type,
            )
            return None
        except httpx.RequestError as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "network_error",
                retryable=True,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: falha de rede (%s)",
                action,
                exception_type,
            )
            return None
        except Exception as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "client_error",
                retryable=False,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: falha interna (%s)",
                action,
                exception_type,
            )
            return None
        finally:
            if acquired:
                self._release_client()

    def _get(
        self,
        action: str,
        *,
        timeout_seconds: float = 10.0,
    ) -> Optional[dict]:
        """Executa GET e classifica falhas sem registrar autenticação."""

        self._clear_failure()
        acquired = False
        try:
            client = self._acquire_client()
            if client is None:
                self._set_failure("client_closed", retryable=False)
                logger.error("Z-API %s: cliente encerrado", action)
                return None
            acquired = True

            response = client.get(
                f"{self.base_url}/{action}",
                headers=self.headers,
                timeout=timeout_seconds,
            )
            status_code = response.status_code
            if not 200 <= status_code < 300:
                retryable = self._is_retryable_status(status_code)
                self._set_failure(
                    "http_status",
                    retryable=retryable,
                    status_code=status_code,
                )
                logger.error(
                    "Z-API %s: HTTP %s (retryable=%s)",
                    action,
                    status_code,
                    retryable,
                )
                return None

            try:
                result = response.json()
            except ValueError:
                self._set_failure(
                    "invalid_json",
                    retryable=True,
                    status_code=status_code,
                )
                logger.error("Z-API %s: resposta JSON inválida", action)
                return None

            if not isinstance(result, dict):
                self._set_failure(
                    "invalid_response",
                    retryable=False,
                    status_code=status_code,
                )
                logger.error(
                    "Z-API %s: estrutura de resposta inesperada",
                    action,
                )
                return None

            logger.info("Z-API %s: HTTP %s", action, status_code)
            return result
        except httpx.TimeoutException as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "timeout",
                retryable=True,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: timeout (%s)",
                action,
                exception_type,
            )
            return None
        except httpx.RequestError as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "network_error",
                retryable=True,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: falha de rede (%s)",
                action,
                exception_type,
            )
            return None
        except Exception as exc:
            exception_type = type(exc).__name__
            self._set_failure(
                "client_error",
                retryable=False,
                exception_type=exception_type,
            )
            logger.error(
                "Z-API %s: falha interna (%s)",
                action,
                exception_type,
            )
            return None
        finally:
            if acquired:
                self._release_client()

    def get_instance_status(self) -> Optional[dict]:
        """Retorna o estado validado da instância e do smartphone conectado."""

        result = self._get("status")
        if result is None:
            return None
        if (
            not isinstance(result.get("connected"), bool)
            or not isinstance(result.get("smartphoneConnected"), bool)
        ):
            self._set_failure("invalid_response", retryable=False)
            logger.error(
                "Z-API status: campos de conectividade ausentes ou inválidos"
            )
            return None
        return result

    def send_text(self, phone: str, message: str) -> Optional[dict]:
        """Envia mensagem de texto."""

        normalized_phone = self._prepare_phone("send-text", phone)
        if normalized_phone is None:
            return None
        if not isinstance(message, str) or not message.strip():
            return self._invalid_payload("send-text")
        return self._post(
            "send-text",
            {"phone": normalized_phone, "message": message},
        )

    def send_location(
        self,
        phone: str,
        lat: float,
        lng: float,
        title: str,
        address: str,
    ) -> Optional[dict]:
        """Envia cartão de localização."""

        normalized_phone = self._prepare_phone("send-location", phone)
        if normalized_phone is None:
            return None
        try:
            latitude = float(lat)
            longitude = float(lng)
        except (TypeError, ValueError):
            return self._invalid_payload("send-location")
        if (
            not math.isfinite(latitude)
            or not math.isfinite(longitude)
            or not -90 <= latitude <= 90
            or not -180 <= longitude <= 180
            or not isinstance(title, str)
            or not title.strip()
            or not isinstance(address, str)
            or not address.strip()
        ):
            return self._invalid_payload("send-location")
        return self._post(
            "send-location",
            {
                "phone": normalized_phone,
                "latitude": str(lat),
                "longitude": str(lng),
                "title": title,
                "address": address,
            },
        )

    def send_image(
        self,
        phone: str,
        image_url: str,
        caption: str = "",
    ) -> Optional[dict]:
        """Envia imagem por URL ou Data URI."""

        normalized_phone = self._prepare_phone("send-image", phone)
        if normalized_phone is None:
            return None
        if (
            not isinstance(image_url, str)
            or not image_url.strip()
            or not isinstance(caption, str)
        ):
            return self._invalid_payload("send-image")
        payload = {"phone": normalized_phone, "image": image_url}
        if caption:
            payload["caption"] = caption
        return self._post("send-image", payload)

    def send_image_bytes(
        self,
        phone: str,
        image_bytes: bytes,
        caption: str = "",
        *,
        mime_type: str = "image/jpeg",
    ) -> Optional[dict]:
        """Envia bytes como Data URI Base64, sem hospedagem externa."""

        normalized_phone = self._prepare_phone("send-image", phone)
        if normalized_phone is None:
            return None
        if (
            not isinstance(image_bytes, (bytes, bytearray, memoryview))
            or not image_bytes
            or not isinstance(caption, str)
            or not isinstance(mime_type, str)
            or _IMAGE_MIME_RE.fullmatch(mime_type) is None
        ):
            return self._invalid_payload("send-image")

        encoded = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "phone": normalized_phone,
            "image": f"data:{mime_type};base64,{encoded}",
        }
        if caption:
            payload["caption"] = caption
        return self._post("send-image", payload, timeout_seconds=30.0)

    @staticmethod
    def _close_http_client(client: httpx.Client) -> None:
        try:
            client.close()
        except Exception as exc:
            logger.error(
                "Z-API: falha ao fechar cliente HTTP (%s)",
                type(exc).__name__,
            )

    def close(self, timeout: float = 5.0) -> bool:
        """Fecha o pool com espera limitada por requisições ativas.

        Se o prazo expirar, a última requisição fecha o pool com segurança.
        """

        deadline = time.monotonic() + max(0.0, float(timeout))
        with self._client_condition:
            self._closed = True
            while self._active_requests:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    logger.warning(
                        "Z-API: encerramento adiado; %d requisição(ões) ativa(s)",
                        self._active_requests,
                    )
                    return False
                self._client_condition.wait(timeout=remaining)
            client = self._client
            self._client = None

        if client is not None:
            self._close_http_client(client)
        return True

    def __enter__(self) -> "ZAPIClient":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.close()
