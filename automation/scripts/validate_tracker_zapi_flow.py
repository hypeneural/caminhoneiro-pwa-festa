"""Bateria real, controlada e auditavel do fluxo WhatsApp do tracker.

Este arquivo nunca envia nada sem ``--confirm-live-send``. Cada execucao usa
um SQLite novo e permanente, identificado por ``run_id``, para permitir uma
auditoria posterior sem tocar no banco de producao.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
import threading
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional, Sequence


AUTOMATION_ROOT = Path(__file__).resolve().parents[1]
if str(AUTOMATION_ROOT) not in sys.path:
    sys.path.insert(0, str(AUTOMATION_ROOT))

MAIN_PHONE = "5548996553954"
SYSTEM_GROUP = "120363407707102690-group"
SEPARATOR_COUNT = 3
MAIN_ITEM_COUNT = 6
GROUP_ITEM_COUNT = 5
TOTAL_ITEM_COUNT = MAIN_ITEM_COUNT + GROUP_ITEM_COUNT
ACTIVE_STATUSES = frozenset({"queued", "retry", "inflight"})
BAD_TERMINAL_STATUSES = frozenset({"dead", "expired"})
RUN_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$")
DEFAULT_STREETVIEW_IMAGE_PATH = (
    AUTOMATION_ROOT / "scratch" / "validation_streetview_real.jpg"
)
DEFAULT_MAP_IMAGE_PATH = AUTOMATION_ROOT / "scratch" / "test_render_collage.jpg"
STREETVIEW_IMAGE_ENV = "TRACKER_VALIDATION_STREETVIEW_IMAGE"
MAP_IMAGE_ENV = "TRACKER_VALIDATION_MAP_IMAGE"
RUNS_ROOT = AUTOMATION_ROOT / "data" / "tracker-zapi-live-validations"

LATITUDE = -27.2426
LONGITUDE = -48.6337

MAIN_CAPTION = (
    "\U0001f9ea *VALIDA\u00c7\u00c3O CONTROLADA \u2014 N\u00c3O \u00c9 EVENTO REAL*\n\n"
    "Street View de teste do fluxo principal do rastreamento.\n"
    "Esta mensagem existe somente para validar a integra\u00e7\u00e3o Z-API."
)
MAIN_FALLBACK = (
    "\U0001f9ea *VALIDA\u00c7\u00c3O CONTROLADA \u2014 N\u00c3O \u00c9 EVENTO REAL*\n\n"
    "O Street View de teste n\u00e3o foi aceito; este \u00e9 o fallback controlado."
)
MAP_CAPTION = (
    "\U0001f5fa\ufe0f *MAPA DE ROTA \u2014 VALIDA\u00c7\u00c3O CONTROLADA*\n\n"
    "Progresso estimado na rota oficial. N\u00c3O \u00c9 EVENTO NEM ALERTA REAL."
)
MAP_FALLBACK = (
    "\u26a0\ufe0f Mapa de rota indispon\u00edvel nesta valida\u00e7\u00e3o controlada. "
    "N\u00c3O \u00c9 ALERTA REAL."
)
GROUP_MESSAGE = (
    "\U0001f9ea *VALIDA\u00c7\u00c3O CONTROLADA \u2014 N\u00c3O \u00c9 ALERTA REAL*\n\n"
    "Fluxo operacional do rastreamento: cart\u00e3o de localiza\u00e7\u00e3o, "
    "texto de teste e tr\u00eas separadores finais.\n"
    "Nenhum rastreador ficou offline e este texto n\u00e3o representa recupera\u00e7\u00e3o."
)


class ValidationError(RuntimeError):
    """Falha segura de preflight, envio ou auditoria."""


@dataclass(frozen=True)
class FlowKeys:
    vehicle_id: str
    anchor: str
    location: str
    content: str
    content_dedupe: str
    fallback_dedupe: Optional[str] = None
    map_content: Optional[str] = None
    map_dedupe: Optional[str] = None
    map_fallback_dedupe: Optional[str] = None


@dataclass(frozen=True)
class ProviderCall:
    sequence: int
    action: str
    phone: str
    provider_message_id: Optional[str]
    completed_at_utc: str
    message: Optional[str] = None
    caption: Optional[str] = None
    title: Optional[str] = None
    image_bytes: Optional[int] = None


@dataclass(frozen=True)
class ValidatedJpeg:
    role: str
    path: Path
    jpeg_bytes: bytes
    width: int
    height: int
    sha256: str


def default_run_id() -> str:
    return datetime.now(timezone.utc).strftime("zapi-%Y%m%dT%H%M%S-%fZ")


def validate_run_id(value: str) -> str:
    run_id = str(value or "").strip()
    if RUN_ID_RE.fullmatch(run_id) is None:
        raise ValidationError(
            "run_id invalido; use apenas letras, numeros, '_' e '-' (3-80 caracteres)"
        )
    return run_id


def build_keys(run_id: str, recipient: str) -> FlowKeys:
    suffix = "main" if recipient == MAIN_PHONE else "system-group"
    vehicle_id = f"live-validation-{suffix}-{run_id}"
    anchor = f"controlled:{run_id}:{suffix}"
    is_main = recipient == MAIN_PHONE
    return FlowKeys(
        vehicle_id=vehicle_id,
        anchor=anchor,
        location=f"{vehicle_id}:{anchor}:location",
        content=f"{vehicle_id}:{anchor}:content",
        content_dedupe=f"{vehicle_id}:{anchor}:content-send",
        fallback_dedupe=(f"{vehicle_id}:{anchor}:fallback" if is_main else None),
        map_content=(f"{vehicle_id}:{anchor}:map" if is_main else None),
        map_dedupe=(f"{vehicle_id}:{anchor}:map-send" if is_main else None),
        map_fallback_dedupe=(
            f"{vehicle_id}:{anchor}:map-fallback" if is_main else None
        ),
    )


def _provider_message_id(result: object) -> Optional[str]:
    if not isinstance(result, dict):
        return None
    value = result.get("messageId") or result.get("zaapId") or result.get("id")
    return str(value).strip() if value else None


class AuditedZAPI:
    """Proxy do cliente real que registra somente metadados nao secretos."""

    def __init__(self, client: Any) -> None:
        self.client = client
        self._lock = threading.Lock()
        self._calls: list[ProviderCall] = []

    def _record(
        self,
        *,
        action: str,
        phone: str,
        result: object,
        message: Optional[str] = None,
        caption: Optional[str] = None,
        title: Optional[str] = None,
        image_bytes: Optional[int] = None,
    ) -> None:
        with self._lock:
            self._calls.append(
                ProviderCall(
                    sequence=len(self._calls) + 1,
                    action=action,
                    phone=phone,
                    provider_message_id=_provider_message_id(result),
                    completed_at_utc=datetime.now(timezone.utc).isoformat(),
                    message=message,
                    caption=caption,
                    title=title,
                    image_bytes=image_bytes,
                )
            )

    def send_text(self, phone: str, message: str):
        result = self.client.send_text(phone, message)
        self._record(
            action="text",
            phone=phone,
            result=result,
            message=message,
        )
        return result

    def send_location(
        self,
        phone: str,
        latitude: float,
        longitude: float,
        title: str,
        address: str,
    ):
        result = self.client.send_location(
            phone,
            latitude,
            longitude,
            title,
            address,
        )
        self._record(
            action="location",
            phone=phone,
            result=result,
            title=title,
        )
        return result

    def send_image_bytes(
        self,
        phone: str,
        image_bytes: bytes,
        caption: str,
        *,
        mime_type: str = "image/jpeg",
    ):
        result = self.client.send_image_bytes(
            phone,
            image_bytes,
            caption,
            mime_type=mime_type,
        )
        self._record(
            action="image",
            phone=phone,
            result=result,
            caption=caption,
            image_bytes=len(image_bytes),
        )
        return result

    def get_last_failure(self):
        return self.client.get_last_failure()

    @property
    def calls(self) -> list[ProviderCall]:
        with self._lock:
            return list(self._calls)

    @property
    def post_count(self) -> int:
        with self._lock:
            return len(self._calls)


def resolve_image_path(
    cli_value: Optional[str],
    *,
    env_name: str,
    default: Path,
) -> Path:
    """Resolve CLI > ambiente > padrao local, sem acessar a rede."""

    raw = str(cli_value or os.getenv(env_name) or default).strip()
    if not raw:
        raise ValidationError(f"caminho de imagem vazio ({env_name})")
    return Path(raw).expanduser().resolve()


def validate_jpeg(path: Path, *, role: str) -> ValidatedJpeg:
    """Decodifica o JPEG inteiro e aplica invariantes especificos do papel."""

    from PIL import Image, ImageStat

    if role not in {"streetview", "map"}:
        raise ValidationError(f"papel de imagem desconhecido: {role}")
    if not path.is_file():
        raise ValidationError(f"JPEG {role} ausente: {path}")
    try:
        jpeg = path.read_bytes()
    except OSError as exc:
        raise ValidationError(f"nao foi possivel ler o JPEG {role}: {path}") from exc
    if len(jpeg) < 10_000:
        raise ValidationError(f"JPEG {role} pequeno demais ({len(jpeg)} bytes)")
    if not jpeg.startswith(b"\xff\xd8") or not jpeg.endswith(b"\xff\xd9"):
        raise ValidationError(f"arquivo {role} nao possui envelope JPEG valido")

    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            if image.format != "JPEG":
                raise ValidationError(f"arquivo {role} nao foi decodificado como JPEG")
            width, height = image.size
            image.load()
            extrema = ImageStat.Stat(image.convert("L")).extrema[0]
    except ValidationError:
        raise
    except Exception as exc:
        raise ValidationError(f"JPEG {role} esta truncado ou corrompido") from exc

    if extrema[1] - extrema[0] < 4:
        raise ValidationError(f"JPEG {role} parece vazio ou uniforme")
    if role == "map" and (width, height) != (1080, 1350):
        raise ValidationError(
            f"mapa deve medir exatamente 1080x1350; recebido {width}x{height}"
        )
    if role == "streetview" and (
        width < 800 or height < 600 or width <= height
    ):
        raise ValidationError(
            "Street View deve ser um mosaico paisagem de pelo menos 800x600; "
            f"recebido {width}x{height}"
        )

    return ValidatedJpeg(
        role=role,
        path=path,
        jpeg_bytes=jpeg,
        width=width,
        height=height,
        sha256=hashlib.sha256(jpeg).hexdigest(),
    )


def validate_image_pair(
    streetview_path: Path,
    map_path: Path,
) -> tuple[ValidatedJpeg, ValidatedJpeg]:
    streetview = validate_jpeg(streetview_path, role="streetview")
    map_image = validate_jpeg(map_path, role="map")
    if streetview.sha256 == map_image.sha256:
        raise ValidationError("Street View e mapa nao podem ser o mesmo JPEG")
    return streetview, map_image


def _image_report(image: ValidatedJpeg) -> dict[str, Any]:
    return {
        "role": image.role,
        "path": str(image.path),
        "bytes": len(image.jpeg_bytes),
        "width": image.width,
        "height": image.height,
        "sha256": image.sha256,
    }


class StaticJpegGenerator:
    """Entrega ao PanoramaDispatcher o Street View previamente validado."""

    def __init__(self, image: ValidatedJpeg) -> None:
        if image.role != "streetview":
            raise ValidationError("StaticJpegGenerator exige imagem streetview")
        self.image = image
        self.generate_calls = 0

    def generate(self, **_: object):
        from app.tracker.streetview import PanoramaArtifact

        self.generate_calls += 1
        return PanoramaArtifact(
            jpeg_bytes=self.image.jpeg_bytes,
            width=self.image.width,
            height=self.image.height,
            headings=(0, 90, 180, 270),
            captured_at=datetime.now(timezone.utc),
        )

    def close(self) -> None:
        return None

    def cancel(self) -> None:
        return None


class StaticMapRenderer:
    """Entrega ao MapDispatcher o mosaico 1080x1350 previamente validado."""

    def __init__(self, image: ValidatedJpeg) -> None:
        if image.role != "map":
            raise ValidationError("StaticMapRenderer exige imagem map")
        self.image = image
        self.render_calls = 0

    def render_collage(self, *, job: Any, **_: object):
        from app.tracker.maps.models import MapArtifact

        self.render_calls += 1
        return MapArtifact(
            jpeg_bytes=self.image.jpeg_bytes,
            width=self.image.width,
            height=self.image.height,
            progress_m=float(job.progress_m),
            captured_at=datetime.now(timezone.utc),
        )

    def close(self) -> None:
        return None


@dataclass(frozen=True)
class _Point:
    x: float
    y: float


class StaticRouteRepository:
    """Geometria minima e deterministica usada somente pela bateria controlada."""

    def __init__(self) -> None:
        self.coords_wgs84 = [
            (LATITUDE, LONGITUDE),
            (LATITUDE + 0.0001, LONGITUDE + 0.0001),
        ]
        self.start_wgs84 = _Point(x=LONGITUDE, y=LATITUDE)
        self.total_length_m = 20.0


def _read_rows(db_path: Path) -> list[dict[str, Any]]:
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            """
            SELECT id, vehicle_id, channel, dedupe_key, content_key,
                   depends_on_id, wait_for_terminal_id, payload_json,
                   status, attempts, provider_message_id, last_error,
                   created_at, updated_at, sent_at
            FROM notification_outbox
            ORDER BY id ASC
            """
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


def _iter_strings(value: object) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from _iter_strings(key)
            yield from _iter_strings(item)
    elif isinstance(value, (list, tuple)):
        for item in value:
            yield from _iter_strings(item)


def _assert_unicode(value: object, label: str) -> None:
    for text in _iter_strings(value):
        if "\ufffd" in text:
            raise ValidationError(f"caractere U+FFFD encontrado em {label}")
        if text.encode("utf-8").decode("utf-8") != text:
            raise ValidationError(f"round-trip UTF-8 falhou em {label}")


def _parse_utc(value: object, label: str) -> datetime:
    if not isinstance(value, str):
        raise ValidationError(f"timestamp ausente em {label}")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError(f"timestamp invalido em {label}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _decode_flow_rows(
    *, rows: Sequence[dict[str, Any]], keys: FlowKeys, phone: str, expected_count: int
) -> tuple[list[dict[str, Any]], dict[int, dict[str, Any]]]:
    flow_rows = [row for row in rows if row["vehicle_id"] == keys.vehicle_id]
    if len(flow_rows) != expected_count:
        raise ValidationError(
            f"{keys.vehicle_id}: esperado {expected_count} rows, "
            f"encontrado {len(flow_rows)}"
        )
    if any(row["status"] != "sent" for row in flow_rows):
        raise ValidationError(f"{keys.vehicle_id}: nem todos os itens estao sent")

    decoded: dict[int, dict[str, Any]] = {}
    for row in flow_rows:
        try:
            payload = json.loads(row["payload_json"])
        except (TypeError, json.JSONDecodeError) as exc:
            raise ValidationError(f"payload JSON invalido no row {row['id']}") from exc
        _assert_unicode(payload, f"payload row {row['id']}")
        if payload.get("phone") != phone:
            raise ValidationError(f"destinatario divergente no row {row['id']}")
        decoded[int(row["id"])] = payload
    return flow_rows, decoded


def _find_unique(
    rows: Sequence[dict[str, Any]], *, label: str, predicate: Any
) -> dict[str, Any]:
    matches = [row for row in rows if predicate(row)]
    if len(matches) != 1:
        raise ValidationError(f"{label}: esperado 1 row; encontrado {len(matches)}")
    return matches[0]


def _assert_separator_chain(
    *,
    flow_rows: Sequence[dict[str, Any]],
    decoded: dict[int, dict[str, Any]],
    phone: str,
    anchor: dict[str, Any],
    anchor_content_key: str,
    location: dict[str, Any],
) -> list[dict[str, Any]]:
    separators = sorted(
        [
            row
            for row in flow_rows
            if row["dedupe_key"].startswith(f"{anchor_content_key}:separator:")
        ],
        key=lambda row: row["dedupe_key"],
    )
    expected_dedupes = [
        f"{anchor_content_key}:separator:{position}"
        for position in range(1, SEPARATOR_COUNT + 1)
    ]
    if [row["dedupe_key"] for row in separators] != expected_dedupes:
        raise ValidationError(f"{phone}: sequencia de separadores invalida")

    predecessor_id = int(anchor["id"])
    previous_sent_at = max(
        _parse_utc(anchor["sent_at"], "ancora dos separadores"),
        _parse_utc(location["sent_at"], "localizacao"),
    )
    for index, row in enumerate(separators):
        payload = decoded[int(row["id"])]
        if row["channel"] != "text" or payload != {"message": ".", "phone": phone}:
            raise ValidationError(f"separador invalido no row {row['id']}")
        if row["depends_on_id"] != predecessor_id:
            raise ValidationError(f"dependencia invalida no separador row {row['id']}")
        expected_wait = int(location["id"]) if index == 0 else None
        if row["wait_for_terminal_id"] != expected_wait:
            raise ValidationError(f"espera de localizacao invalida no row {row['id']}")
        sent_at = _parse_utc(row["sent_at"], f"separador {index + 1}")
        if sent_at < previous_sent_at:
            raise ValidationError(f"separador {index + 1} foi enviado antes do fluxo")
        previous_sent_at = sent_at
        predecessor_id = int(row["id"])
    return separators


def _assert_main_rows(
    *, rows: Sequence[dict[str, Any]], keys: FlowKeys
) -> dict[str, Any]:
    if not keys.map_content:
        raise ValidationError("chave de mapa ausente no fluxo principal")
    flow_rows, decoded = _decode_flow_rows(
        rows=rows,
        keys=keys,
        phone=MAIN_PHONE,
        expected_count=MAIN_ITEM_COUNT,
    )

    location = _find_unique(
        flow_rows,
        label="localizacao principal",
        predicate=lambda row: row["channel"] == "location"
        and row["dedupe_key"] == keys.location,
    )
    primary = _find_unique(
        flow_rows,
        label="Street View principal",
        predicate=lambda row: row["content_key"] == keys.content,
    )
    map_row = _find_unique(
        flow_rows,
        label="mapa principal",
        predicate=lambda row: row["content_key"] == keys.map_content,
    )
    if primary["channel"] != "panorama" or map_row["channel"] != "map":
        raise ValidationError(
            f"canais principais divergentes: {primary['channel']}, {map_row['channel']}"
        )
    if decoded[int(primary["id"])].get("caption") != MAIN_CAPTION:
        raise ValidationError("legenda do Street View diverge do teste controlado")
    map_payload = decoded[int(map_row["id"])]
    if map_payload.get("caption") != MAP_CAPTION:
        raise ValidationError("legenda do mapa diverge do teste controlado")
    if map_payload.get("primary_content_key") != keys.content:
        raise ValidationError("mapa nao referencia o conteudo principal")

    timeline = [
        _parse_utc(location["sent_at"], "localizacao principal"),
        _parse_utc(primary["sent_at"], "Street View"),
        _parse_utc(map_row["sent_at"], "mapa"),
    ]
    if timeline != sorted(timeline):
        raise ValidationError("ordem principal deve ser localizacao, Street View e mapa")
    separators = _assert_separator_chain(
        flow_rows=flow_rows,
        decoded=decoded,
        phone=MAIN_PHONE,
        anchor=map_row,
        anchor_content_key=keys.map_content,
        location=location,
    )

    return {
        "phone": MAIN_PHONE,
        "vehicle_id": keys.vehicle_id,
        "location_message_id": location["provider_message_id"],
        "streetview_message_id": primary["provider_message_id"],
        "map_message_id": map_row["provider_message_id"],
        "separator_message_ids": [row["provider_message_id"] for row in separators],
    }


def _assert_group_rows(
    *, rows: Sequence[dict[str, Any]], keys: FlowKeys
) -> dict[str, Any]:
    flow_rows, decoded = _decode_flow_rows(
        rows=rows,
        keys=keys,
        phone=SYSTEM_GROUP,
        expected_count=GROUP_ITEM_COUNT,
    )
    location = _find_unique(
        flow_rows,
        label="localizacao do grupo",
        predicate=lambda row: row["channel"] == "location"
        and row["dedupe_key"] == keys.location,
    )
    content = _find_unique(
        flow_rows,
        label="texto do grupo",
        predicate=lambda row: row["content_key"] == keys.content,
    )
    if content["channel"] != "text":
        raise ValidationError("conteudo do grupo nao e send-text")
    if decoded[int(content["id"])] != {"phone": SYSTEM_GROUP, "message": GROUP_MESSAGE}:
        raise ValidationError("texto do grupo diverge do aviso NAO E ALERTA REAL")
    if _parse_utc(location["sent_at"], "localizacao do grupo") > _parse_utc(
        content["sent_at"], "texto do grupo"
    ):
        raise ValidationError("texto do grupo saiu antes da localizacao")
    separators = _assert_separator_chain(
        flow_rows=flow_rows,
        decoded=decoded,
        phone=SYSTEM_GROUP,
        anchor=content,
        anchor_content_key=keys.content,
        location=location,
    )
    return {
        "phone": SYSTEM_GROUP,
        "vehicle_id": keys.vehicle_id,
        "location_message_id": location["provider_message_id"],
        "text_message_id": content["provider_message_id"],
        "separator_message_ids": [row["provider_message_id"] for row in separators],
    }


def audit_run(
    *,
    db_path: Path,
    calls: Sequence[ProviderCall],
    main_keys: FlowKeys,
    group_keys: FlowKeys,
    streetview: ValidatedJpeg,
    map_image: ValidatedJpeg,
) -> dict[str, Any]:
    rows = _read_rows(db_path)
    if len(rows) != TOTAL_ITEM_COUNT:
        raise ValidationError(
            f"esperado total de {TOTAL_ITEM_COUNT} rows; encontrado {len(rows)}"
        )

    statuses = {str(row["status"]) for row in rows}
    if statuses & ACTIVE_STATUSES:
        raise ValidationError(f"itens ainda ativos: {sorted(statuses & ACTIVE_STATUSES)}")
    if statuses & BAD_TERMINAL_STATUSES:
        raise ValidationError(
            f"terminais ruins encontrados: {sorted(statuses & BAD_TERMINAL_STATUSES)}"
        )
    if statuses != {"sent"}:
        raise ValidationError(f"status inesperado na outbox: {sorted(statuses)}")

    message_ids = [str(row["provider_message_id"] or "") for row in rows]
    if any(not value for value in message_ids):
        raise ValidationError("ha row sent sem provider_message_id")
    if len(set(message_ids)) != TOTAL_ITEM_COUNT:
        raise ValidationError(
            f"os {TOTAL_ITEM_COUNT} provider_message_id nao sao distintos"
        )

    _assert_unicode(rows, "outbox")
    main_result = _assert_main_rows(rows=rows, keys=main_keys)
    group_result = _assert_group_rows(rows=rows, keys=group_keys)

    if len(calls) != TOTAL_ITEM_COUNT:
        raise ValidationError(
            f"esperado {TOTAL_ITEM_COUNT} POSTs; registrado {len(calls)}"
        )
    call_ids = [call.provider_message_id for call in calls]
    if any(not value for value in call_ids) or set(call_ids) != set(message_ids):
        raise ValidationError("IDs registrados nos POSTs divergem da outbox")
    _assert_unicode([asdict(call) for call in calls], "registro de POSTs")

    main_calls = [call for call in calls if call.phone == MAIN_PHONE]
    if [call.action for call in main_calls] != [
        "location", "image", "image", "text", "text", "text"
    ]:
        raise ValidationError("ordem externa principal diverge de location/imagens/pontos")
    if main_calls[1].caption != MAIN_CAPTION or main_calls[2].caption != MAP_CAPTION:
        raise ValidationError("ordem das duas imagens principais esta invertida")
    if main_calls[1].image_bytes != len(streetview.jpeg_bytes):
        raise ValidationError("bytes enviados no Street View divergem do arquivo validado")
    if main_calls[2].image_bytes != len(map_image.jpeg_bytes):
        raise ValidationError("bytes enviados no mapa divergem do arquivo validado")
    if any(call.message != "." for call in main_calls[3:]):
        raise ValidationError("separadores principais nao sao tres send-text de ponto")

    group_calls = [call for call in calls if call.phone == SYSTEM_GROUP]
    if [call.action for call in group_calls] != [
        "location", "text", "text", "text", "text"
    ]:
        raise ValidationError("ordem externa do grupo diverge de location/texto/pontos")
    if group_calls[1].message != GROUP_MESSAGE:
        raise ValidationError("mensagem externa do grupo nao explicita NAO E ALERTA REAL")
    if any(call.message != "." for call in group_calls[2:]):
        raise ValidationError("separadores do grupo nao sao tres send-text de ponto")

    return {
        "status": "validated",
        "rows": len(rows),
        "provider_message_ids_distinct": len(set(message_ids)),
        "active": 0,
        "bad_terminal": 0,
        "order": {
            "main": ["location", "streetview", "map", ".", ".", "."],
            "system_group": ["location", "test_text", ".", ".", "."],
        },
        "main": main_result,
        "system_group": group_result,
    }


def _wait_for_outbox(db_path: Path, *, timeout_seconds: float) -> None:
    deadline = time.monotonic() + timeout_seconds
    last_summary = "outbox vazia"
    while time.monotonic() < deadline:
        rows = _read_rows(db_path)
        counts: dict[str, int] = {}
        for row in rows:
            status = str(row["status"])
            counts[status] = counts.get(status, 0) + 1
        last_summary = json.dumps(counts, sort_keys=True)
        if len(rows) == TOTAL_ITEM_COUNT and all(
            row["status"] == "sent" for row in rows
        ):
            return
        if any(row["status"] in BAD_TERMINAL_STATUSES for row in rows):
            errors = [
                {
                    "id": row["id"],
                    "channel": row["channel"],
                    "status": row["status"],
                    "error": row["last_error"],
                }
                for row in rows
                if row["status"] in BAD_TERMINAL_STATUSES
            ]
            raise ValidationError(f"falha terminal na outbox: {errors}")
        time.sleep(0.1)
    raise ValidationError(
        f"timeout aguardando {TOTAL_ITEM_COUNT} itens sent; "
        f"ultimo estado: {last_summary}"
    )


def _assert_production_destinations(settings: Any, zapi_client_type: Any) -> None:
    configured_main = zapi_client_type.normalize_phone(settings.TRACKER_NOTIFY_PHONE)
    configured_group = zapi_client_type.normalize_phone(
        settings.TRACKER_SYSTEM_ALERT_PHONE
    )
    if configured_main != MAIN_PHONE:
        raise ValidationError("TRACKER_NOTIFY_PHONE nao e o telefone autorizado")
    if configured_group != SYSTEM_GROUP:
        raise ValidationError(
            "TRACKER_SYSTEM_ALERT_PHONE nao e o grupo operacional autorizado"
        )
    if not (
        settings.ZAPI_INSTANCE_ID
        and settings.ZAPI_TOKEN
        and settings.ZAPI_CLIENT_TOKEN
    ):
        raise ValidationError("credenciais Z-API ausentes")


def _submit_locations(
    *,
    notifications: Any,
    main_keys: FlowKeys,
    group_keys: FlowKeys,
    now: datetime,
) -> dict[str, bool]:
    main_location = notifications.try_submit_location(
        vehicle_id=main_keys.vehicle_id,
        dedupe_key=main_keys.location,
        phone=MAIN_PHONE,
        latitude=LATITUDE,
        longitude=LONGITUDE,
        title="VALIDACAO CONTROLADA - NAO E EVENTO REAL",
        address="Coordenada exclusiva da bateria controlada da Z-API",
        created_at=now,
    )
    group_location = notifications.try_submit_location(
        vehicle_id=group_keys.vehicle_id,
        dedupe_key=group_keys.location,
        phone=SYSTEM_GROUP,
        latitude=LATITUDE,
        longitude=LONGITUDE,
        title="VALIDACAO CONTROLADA - NAO E ALERTA REAL",
        address="Coordenada exclusiva da bateria controlada da Z-API",
        created_at=now,
    )
    return {
        "main_location": main_location,
        "group_location": group_location,
    }


def _wait_for_locations(
    db_path: Path,
    *,
    main_keys: FlowKeys,
    group_keys: FlowKeys,
    timeout_seconds: float,
) -> None:
    expected = {main_keys.location, group_keys.location}
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        rows = _read_rows(db_path)
        locations = {
            str(row["dedupe_key"]): row
            for row in rows
            if row["channel"] == "location" and row["dedupe_key"] in expected
        }
        if set(locations) == expected and all(
            row["status"] == "sent" for row in locations.values()
        ):
            return
        terminal = [
            row
            for row in locations.values()
            if row["status"] in BAD_TERMINAL_STATUSES
        ]
        if terminal:
            raise ValidationError(f"localizacao falhou antes do conteudo: {terminal}")
        time.sleep(0.05)
    raise ValidationError("timeout aguardando as duas localizacoes antes do conteudo")


def _submit_contents(
    *,
    notifications: Any,
    panoramas: Any,
    maps: Any,
    main_keys: FlowKeys,
    group_keys: FlowKeys,
    now: datetime,
) -> dict[str, bool]:
    from app.tracker.panorama import PanoramaJob

    if not (
        main_keys.fallback_dedupe
        and main_keys.map_content
        and main_keys.map_dedupe
        and main_keys.map_fallback_dedupe
    ):
        raise ValidationError("chaves de conteudo principal incompletas")
    main_streetview = panoramas.try_submit(
        PanoramaJob(
            vehicle_id=main_keys.vehicle_id,
            phone=MAIN_PHONE,
            latitude=LATITUDE,
            longitude=LONGITUDE,
            vehicle_name="Validacao controlada do rastreamento",
            address="Coordenada exclusiva da bateria controlada da Z-API",
            street_name="Validacao controlada",
            speed_kmh=0,
            battery=None,
            updated_at=now,
            requested_at=now,
            event_type="controlled_validation",
            dedupe_key=main_keys.content_dedupe,
            content_key=main_keys.content,
            caption=MAIN_CAPTION,
            fallback_message=MAIN_FALLBACK,
            fallback_dedupe_key=main_keys.fallback_dedupe,
            completion_separator_count=0,
            completion_location_dedupe_key=None,
        )
    )
    main_map = maps.try_submit(
        vehicle_id=main_keys.vehicle_id,
        phone=MAIN_PHONE,
        latitude=LATITUDE,
        longitude=LONGITUDE,
        bearing=0.0,
        speed_kmh=0.0,
        battery=None,
        address="Coordenada exclusiva da bateria controlada da Z-API",
        updated_at=now,
        event_type="controlled_validation",
        progress_m=10.0,
        segment_index=0,
        route_version="controlled-v1",
        caption=MAP_CAPTION,
        fallback_message=MAP_FALLBACK,
        fallback_dedupe_key=main_keys.map_fallback_dedupe,
        fallback_max_attempts=1,
        dedupe_key=main_keys.map_dedupe,
        content_key=main_keys.map_content,
        snapped_lat=LATITUDE,
        snapped_lng=LONGITUDE,
        primary_content_key=main_keys.content,
        completion_separator_count=SEPARATOR_COUNT,
        completion_location_dedupe_key=main_keys.location,
    )
    group_content = notifications.try_submit_text(
        vehicle_id=group_keys.vehicle_id,
        dedupe_key=group_keys.content_dedupe,
        phone=SYSTEM_GROUP,
        message=GROUP_MESSAGE,
        created_at=now,
        content_key=group_keys.content,
        completion_separator_count=SEPARATOR_COUNT,
        completion_wait_channel="location",
        completion_wait_dedupe_key=group_keys.location,
    )
    return {
        "main_streetview": main_streetview,
        "main_map": main_map,
        "group_content": group_content,
    }


def _write_report(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def run_live_validation(
    *,
    run_id: str,
    timeout_seconds: float,
    streetview: ValidatedJpeg,
    map_image: ValidatedJpeg,
) -> Path:
    """Executa a bateria real. O chamador deve aplicar o guard antes."""

    from app.config import settings
    from app.tracker.maps.dispatcher import MapDispatcher
    from app.tracker.notifications import AsyncZAPIDispatcher
    from app.tracker.panorama import PanoramaDispatcher
    from app.tracker.tracker_db import TrackerDB
    from app.tracker.zapi_client import ZAPIClient

    run_id = validate_run_id(run_id)
    run_dir = RUNS_ROOT / run_id
    db_path = run_dir / "validation.sqlite3"
    report_path = run_dir / "report.json"
    if run_dir.exists():
        raise ValidationError(
            f"run_id ja utilizado; nenhuma mensagem foi enviada: {run_dir}"
        )
    run_dir.mkdir(parents=True, exist_ok=False)

    main_keys = build_keys(run_id, MAIN_PHONE)
    group_keys = build_keys(run_id, SYSTEM_GROUP)
    started_at = datetime.now(timezone.utc)
    base_report: dict[str, Any] = {
        "run_id": run_id,
        "started_at_utc": started_at.isoformat(),
        "database": str(db_path),
        "mode": "live",
        "expected_posts": TOTAL_ITEM_COUNT,
        "images": {
            "streetview": _image_report(streetview),
            "map": _image_report(map_image),
        },
        "recipients": [MAIN_PHONE, SYSTEM_GROUP],
    }

    raw_zapi = None
    notifications = None
    panoramas = None
    maps = None
    audited_zapi = None
    generator = None
    map_renderer = None
    try:
        db = TrackerDB(str(db_path))
        _assert_production_destinations(settings, ZAPIClient)
        generator = StaticJpegGenerator(streetview)
        map_renderer = StaticMapRenderer(map_image)

        raw_zapi = ZAPIClient(
            settings.ZAPI_INSTANCE_ID,
            settings.ZAPI_TOKEN,
            settings.ZAPI_CLIENT_TOKEN,
        )
        status = raw_zapi.get_instance_status()
        if not isinstance(status, dict):
            raise ValidationError("preflight Z-API nao retornou status valido")
        if status.get("connected") is not True:
            raise ValidationError("preflight falhou: connected != true")
        if status.get("smartphoneConnected") is not True:
            raise ValidationError("preflight falhou: smartphoneConnected != true")

        audited_zapi = AuditedZAPI(raw_zapi)
        notifications = AsyncZAPIDispatcher(
            zapi=audited_zapi,
            db=db,
            text_ttl_seconds=300,
            location_ttl_seconds=300,
            max_attempts=1,
            retry_backoff_seconds=(0.1,),
            lease_seconds=45,
            idle_poll_seconds=0.05,
        )
        panoramas = PanoramaDispatcher(
            generator=generator,
            zapi=audited_zapi,
            db=db,
            notification_dispatcher=notifications,
            max_job_age_seconds=300,
            send_attempts=1,
            send_retry_delays=(),
            lease_seconds=45,
            idle_poll_seconds=0.05,
            fallback_max_attempts=1,
            fallback_ttl_seconds=300,
            recovery_cutoff=datetime.now(timezone.utc),
        )
        maps = MapDispatcher(
            db=db,
            renderer=map_renderer,
            zapi=audited_zapi,
            route_repo=StaticRouteRepository(),
            lease_seconds=45,
            max_job_age_seconds=300,
            idle_poll_seconds=0.05,
            send_attempts=1,
            send_retry_delay_seconds=0.1,
            instance_id=f"controlled-{run_id}",
            notification_dispatcher=notifications,
        )

        first_locations = _submit_locations(
            notifications=notifications,
            main_keys=main_keys,
            group_keys=group_keys,
            now=started_at,
        )
        if not all(first_locations.values()):
            raise ValidationError(
                f"enfileiramento inicial das localizacoes recusado: {first_locations}"
            )
        _wait_for_locations(
            db_path,
            main_keys=main_keys,
            group_keys=group_keys,
            timeout_seconds=min(timeout_seconds, 30.0),
        )
        first_contents = _submit_contents(
            notifications=notifications,
            panoramas=panoramas,
            maps=maps,
            main_keys=main_keys,
            group_keys=group_keys,
            now=started_at,
        )
        if not all(first_contents.values()):
            raise ValidationError(
                f"primeiro enfileiramento dos conteudos recusado: {first_contents}"
            )
        first_submit = {**first_locations, **first_contents}

        _wait_for_outbox(db_path, timeout_seconds=timeout_seconds)
        if not notifications.wait_for_idle(timeout=5):
            raise ValidationError("workers de texto/localizacao nao ficaram ociosos")

        posts_before_duplicate = audited_zapi.post_count
        rows_before_duplicate = _read_rows(db_path)
        duplicate_locations = _submit_locations(
            notifications=notifications,
            main_keys=main_keys,
            group_keys=group_keys,
            now=started_at,
        )
        duplicate_contents = _submit_contents(
            notifications=notifications,
            panoramas=panoramas,
            maps=maps,
            main_keys=main_keys,
            group_keys=group_keys,
            now=started_at,
        )
        duplicate_submit = {**duplicate_locations, **duplicate_contents}
        if any(duplicate_submit.values()):
            raise ValidationError(
                f"reenfileiramento duplicado foi aceito: {duplicate_submit}"
            )
        time.sleep(0.5)
        if audited_zapi.post_count != posts_before_duplicate:
            raise ValidationError("reenfileiramento duplicado gerou POST externo")
        if _read_rows(db_path) != rows_before_duplicate:
            raise ValidationError("reenfileiramento duplicado alterou a outbox")
        if generator.generate_calls != 1:
            raise ValidationError(
                f"Street View processado {generator.generate_calls} vezes; esperado 1"
            )
        if map_renderer.render_calls != 1:
            raise ValidationError(
                f"mapa processado {map_renderer.render_calls} vezes; esperado 1"
            )

        audit = audit_run(
            db_path=db_path,
            calls=audited_zapi.calls,
            main_keys=main_keys,
            group_keys=group_keys,
            streetview=streetview,
            map_image=map_image,
        )
        report = {
            **base_report,
            "finished_at_utc": datetime.now(timezone.utc).isoformat(),
            "preflight": {
                "connected": True,
                "smartphoneConnected": True,
            },
            "first_submit": first_submit,
            "duplicate_submit": duplicate_submit,
            "dedupe_generated_post": False,
            "render_counts": {"streetview": 1, "map": 1},
            "provider_calls": [asdict(call) for call in audited_zapi.calls],
            "audit": audit,
        }
        _assert_unicode(report, "relatorio final")
        _write_report(report_path, report)
        return report_path
    except Exception as exc:
        failure_report = {
            **base_report,
            "finished_at_utc": datetime.now(timezone.utc).isoformat(),
            "status": "failed",
            "error_type": type(exc).__name__,
            "error": str(exc),
            "provider_calls": (
                [asdict(call) for call in audited_zapi.calls]
                if audited_zapi is not None
                else []
            ),
            "outbox": _read_rows(db_path) if db_path.exists() else [],
        }
        _write_report(report_path, failure_report)
        raise
    finally:
        if maps is not None:
            maps.close(timeout=10)
        if panoramas is not None:
            panoramas.close(timeout=10)
        if notifications is not None:
            notifications.close(timeout=10)
        if raw_zapi is not None:
            raw_zapi.close(timeout=5)


def _dry_run_report(
    *,
    run_id: str,
    timeout_seconds: float,
    streetview: ValidatedJpeg,
    map_image: ValidatedJpeg,
) -> dict[str, Any]:
    return {
        "status": "dry-run-valid",
        "mode": "dry-run",
        "run_id": run_id,
        "network_requests": 0,
        "provider_posts": 0,
        "live_send_requires": "--confirm-live-send",
        "timeout_seconds": timeout_seconds,
        "recipients": {
            "main": MAIN_PHONE,
            "system_group": SYSTEM_GROUP,
        },
        "expected_live_posts": TOTAL_ITEM_COUNT,
        "images": {
            "streetview": _image_report(streetview),
            "map": _image_report(map_image),
        },
        "flow": {
            "main": ["send-location", "streetview-jpeg", "map-jpeg", ".", ".", "."],
            "system_group": [
                "send-location",
                "send-text: NAO E ALERTA REAL",
                ".",
                ".",
                ".",
            ],
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Valida com envios reais os dois fluxos autorizados da Z-API. "
            "Destinos fixos; banco isolado e retido por run_id."
        )
    )
    parser.add_argument(
        "--confirm-live-send",
        action="store_true",
        help=f"autoriza explicitamente os {TOTAL_ITEM_COUNT} POSTs reais desta bateria",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="valida tudo localmente e faz zero chamadas externas (modo padrao)",
    )
    parser.add_argument(
        "--streetview-image",
        default=None,
        help=(
            f"JPEG de Street View (CLI > {STREETVIEW_IMAGE_ENV} > "
            f"{DEFAULT_STREETVIEW_IMAGE_PATH})"
        ),
    )
    parser.add_argument(
        "--map-image",
        default=None,
        help=(
            f"JPEG de mapa 1080x1350 (CLI > {MAP_IMAGE_ENV} > "
            f"{DEFAULT_MAP_IMAGE_PATH})"
        ),
    )
    parser.add_argument(
        "--run-id",
        default=None,
        help="identificador unico; omitido gera um valor UTC automaticamente",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=90.0,
        help="limite total para a outbox concluir (padrao: 90)",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    if args.confirm_live_send and args.dry_run:
        print("BLOQUEADO: escolha --dry-run ou --confirm-live-send, nao ambos.", file=sys.stderr)
        return 2
    if args.timeout_seconds <= 0 or args.timeout_seconds > 600:
        print("BLOQUEADO: --timeout-seconds deve estar entre 0 e 600.", file=sys.stderr)
        return 2
    try:
        run_id = validate_run_id(args.run_id or default_run_id())
        streetview_path = resolve_image_path(
            args.streetview_image,
            env_name=STREETVIEW_IMAGE_ENV,
            default=DEFAULT_STREETVIEW_IMAGE_PATH,
        )
        map_path = resolve_image_path(
            args.map_image,
            env_name=MAP_IMAGE_ENV,
            default=DEFAULT_MAP_IMAGE_PATH,
        )
        streetview, map_image = validate_image_pair(streetview_path, map_path)
        if not args.confirm_live_send:
            dry_report = _dry_run_report(
                run_id=run_id,
                timeout_seconds=float(args.timeout_seconds),
                streetview=streetview,
                map_image=map_image,
            )
            _assert_unicode(dry_report, "relatorio dry-run")
            print(json.dumps(dry_report, ensure_ascii=False, indent=2, sort_keys=True))
            return 0
        report_path = run_live_validation(
            run_id=run_id,
            timeout_seconds=float(args.timeout_seconds),
            streetview=streetview,
            map_image=map_image,
        )
    except Exception as exc:
        print(f"FALHA: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1

    print(
        f"VALIDADO: {TOTAL_ITEM_COUNT} mensagens aceitas e auditadas. "
        f"Relatorio: {report_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
