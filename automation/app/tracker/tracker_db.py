"""Persistência de estado no SQLite para o serviço de rastreamento."""

import sqlite3
import logging
import os
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Optional
from .models import VehicleState

logger = logging.getLogger(__name__)

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS runtime_state (
    vehicle_id            TEXT PRIMARY KEY,
    current_status        TEXT NOT NULL DEFAULT 'UNKNOWN',
    previous_status       TEXT,
    last_processed_updated_at TEXT,
    last_motion_at        TEXT,
    stationary_since      TEXT,
    last_observed_lat     REAL,
    last_observed_lng     REAL,
    last_location_sent_at TEXT,
    last_location_sent_lat REAL,
    last_location_sent_lng REAL,
    last_image_attempt_at  TEXT,
    last_image_unavailable_at TEXT,
    last_image_unavailable_lat REAL,
    last_image_unavailable_lng REAL,
    last_image_sent_at    TEXT,
    last_image_sent_lat   REAL,
    last_image_sent_lng   REAL,
    last_image_street     TEXT,
    last_alert_key        TEXT,
    last_message_id       TEXT,
    message_sequence      INTEGER NOT NULL DEFAULT 0,
    last_map_attempt_at   TEXT,
    last_map_sent_at      TEXT,
    last_map_sent_lat     REAL,
    last_map_sent_lng     REAL,
    last_map_sent_progress_m REAL,
    last_route_progress_m REAL,
    last_route_segment_index INTEGER
);
"""
_CREATE_NOTIFICATION_OUTBOX_SQL = """
CREATE TABLE IF NOT EXISTS notification_outbox (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id          TEXT NOT NULL,
    channel             TEXT NOT NULL,
    dedupe_key          TEXT NOT NULL,
    content_key         TEXT,
    depends_on_id       INTEGER,
    wait_for_terminal_id INTEGER,
    payload_json        TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'queued'
                        CHECK(status IN (
                            'queued', 'inflight', 'retry', 'sent',
                            'dead', 'expired'
                        )),
    attempts            INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
    max_attempts        INTEGER NOT NULL CHECK(max_attempts > 0),
    next_attempt_at     TEXT NOT NULL,
    lease_owner         TEXT,
    lease_until         TEXT,
    expires_at          TEXT,
    provider_message_id TEXT,
    last_error          TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    sent_at             TEXT,
    UNIQUE(channel, dedupe_key)
);
"""

_CREATE_NOTIFICATION_OUTBOX_DUE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_notification_outbox_due
ON notification_outbox(channel, status, next_attempt_at, lease_until);
"""
_CREATE_NOTIFICATION_OUTBOX_CONTENT_INDEX_SQL = """
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_outbox_content_key
ON notification_outbox(content_key)
WHERE content_key IS NOT NULL;
"""

_CREATE_NOTIFICATION_OUTBOX_DEPENDENCY_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_notification_outbox_dependency
ON notification_outbox(depends_on_id)
WHERE depends_on_id IS NOT NULL;
"""

_CREATE_NOTIFICATION_OUTBOX_TERMINAL_WAIT_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_notification_outbox_terminal_wait
ON notification_outbox(wait_for_terminal_id)
WHERE wait_for_terminal_id IS NOT NULL;
"""

_CREATE_NOTIFICATION_DEPENDENCIES_SQL = """
CREATE TABLE IF NOT EXISTS notification_dependencies (
    notification_id INTEGER NOT NULL,
    dependency_id   INTEGER NOT NULL,
    gate            TEXT NOT NULL CHECK(gate IN ('claim', 'send')),
    required_state  TEXT NOT NULL CHECK(required_state IN ('sent', 'terminal')),
    PRIMARY KEY(notification_id, dependency_id, gate)
);
"""

_CREATE_NOTIFICATION_DEPENDENCIES_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_notification_dependencies_gate
ON notification_dependencies(notification_id, gate);
"""


_CREATE_TRACKER_LEASE_SQL = """
CREATE TABLE IF NOT EXISTS tracker_leases (
    lease_name  TEXT PRIMARY KEY,
    lease_owner TEXT NOT NULL,
    lease_until TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
"""

_ACTIVE_NOTIFICATION_STATUSES = ("queued", "inflight", "retry")


@dataclass(frozen=True)
class NotificationOutboxJob:
    """Registro imutavel reclamado da outbox por um worker."""

    id: int
    vehicle_id: str
    channel: str
    dedupe_key: str
    content_key: Optional[str]
    depends_on_id: Optional[int]
    wait_for_terminal_id: Optional[int]
    payload_json: str
    status: str
    attempts: int
    max_attempts: int
    next_attempt_at: datetime
    lease_owner: Optional[str]
    lease_until: Optional[datetime]
    expires_at: Optional[datetime]
    provider_message_id: Optional[str]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime]

    @property
    def payload(self) -> dict[str, Any]:
        """Desserializa uma copia; o JSON persistido nunca e alterado."""

        value = json.loads(self.payload_json)
        if not isinstance(value, dict):
            raise ValueError("payload da notificacao deve ser um objeto JSON")
        return value




def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    """Converte string ISO para datetime UTC."""
    if value is None:
        return None
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _format_dt(value: Optional[datetime]) -> Optional[str]:
    """Converte datetime para string ISO."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class TrackerDB:
    """Gerencia a persistência de estado dos veículos no SQLite."""

    def __init__(
        self,
        db_path: str,
        connection_timeout_seconds: float = 5.0,
    ):
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)
        self.db_path = db_path
        self.connection_timeout_seconds = max(
            0.1,
            float(connection_timeout_seconds),
        )
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            timeout=self.connection_timeout_seconds,
        )
        conn.execute(
            f"PRAGMA busy_timeout={int(self.connection_timeout_seconds * 1000)}"
        )
        return conn

    def _init_db(self):
        """Cria a tabela e aplica migrações aditivas seguras."""
        conn = self._connect()
        try:
            conn.execute(_CREATE_TABLE_SQL)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute(_CREATE_NOTIFICATION_OUTBOX_SQL)
            conn.execute(_CREATE_NOTIFICATION_OUTBOX_DUE_INDEX_SQL)
            conn.execute(_CREATE_TRACKER_LEASE_SQL)
            outbox_columns = {
                row[1]
                for row in conn.execute(
                    "PRAGMA table_info(notification_outbox)"
                ).fetchall()
            }
            if "content_key" not in outbox_columns:
                conn.execute(
                    "ALTER TABLE notification_outbox "
                    "ADD COLUMN content_key TEXT"
                )
            if "depends_on_id" not in outbox_columns:
                conn.execute(
                    "ALTER TABLE notification_outbox "
                    "ADD COLUMN depends_on_id INTEGER"
                )
            if "wait_for_terminal_id" not in outbox_columns:
                conn.execute(
                    "ALTER TABLE notification_outbox "
                    "ADD COLUMN wait_for_terminal_id INTEGER"
                )
            conn.execute(_CREATE_NOTIFICATION_OUTBOX_CONTENT_INDEX_SQL)
            conn.execute(_CREATE_NOTIFICATION_OUTBOX_DEPENDENCY_INDEX_SQL)
            conn.execute(_CREATE_NOTIFICATION_OUTBOX_TERMINAL_WAIT_INDEX_SQL)
            existing_columns = {
                row[1]
                for row in conn.execute("PRAGMA table_info(runtime_state)").fetchall()
            }
            migrations = {
                "last_image_attempt_at": (
                    "ALTER TABLE runtime_state ADD COLUMN last_image_attempt_at TEXT"
                ),
                "last_image_unavailable_at": (
                    "ALTER TABLE runtime_state ADD COLUMN last_image_unavailable_at TEXT"
                ),
                "last_image_unavailable_lat": (
                    "ALTER TABLE runtime_state ADD COLUMN last_image_unavailable_lat REAL"
                ),
                "last_image_unavailable_lng": (
                    "ALTER TABLE runtime_state ADD COLUMN last_image_unavailable_lng REAL"
                ),
                "last_map_attempt_at": (
                    "ALTER TABLE runtime_state ADD COLUMN last_map_attempt_at TEXT"
                ),
                "last_map_sent_at": (
                    "ALTER TABLE runtime_state ADD COLUMN last_map_sent_at TEXT"
                ),
                "last_map_sent_lat": (
                    "ALTER TABLE runtime_state ADD COLUMN last_map_sent_lat REAL"
                ),
                "last_map_sent_lng": (
                    "ALTER TABLE runtime_state ADD COLUMN last_map_sent_lng REAL"
                ),
                "last_map_sent_progress_m": (
                    "ALTER TABLE runtime_state ADD COLUMN last_map_sent_progress_m REAL"
                ),
                "last_route_progress_m": (
                    "ALTER TABLE runtime_state ADD COLUMN last_route_progress_m REAL"
                ),
                "last_route_segment_index": (
                    "ALTER TABLE runtime_state ADD COLUMN last_route_segment_index INTEGER"
                ),
            }
            for column, statement in migrations.items():
                if column not in existing_columns:
                    conn.execute(statement)
            conn.commit()
        finally:
            conn.close()
        logger.info(f"SQLite inicializado em {self.db_path}")

    def load_state(self, vehicle_id: str) -> VehicleState:
        """Carrega o estado de um veículo. Retorna estado padrão se não existir."""
        conn = self._connect()
        try:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM runtime_state WHERE vehicle_id = ?",
                (vehicle_id,)
            ).fetchone()
        finally:
            conn.close()

        if row is None:
            return VehicleState(vehicle_id=vehicle_id)

        row_dict = dict(row)
        return VehicleState(
            vehicle_id=row_dict["vehicle_id"],
            current_status=row_dict["current_status"],
            previous_status=row_dict["previous_status"],
            last_processed_updated_at=_parse_dt(row_dict["last_processed_updated_at"]),
            last_motion_at=_parse_dt(row_dict["last_motion_at"]),
            stationary_since=_parse_dt(row_dict["stationary_since"]),
            last_observed_lat=row_dict["last_observed_lat"],
            last_observed_lng=row_dict["last_observed_lng"],
            last_location_sent_at=_parse_dt(row_dict["last_location_sent_at"]),
            last_location_sent_lat=row_dict["last_location_sent_lat"],
            last_location_sent_lng=row_dict["last_location_sent_lng"],
            last_image_attempt_at=_parse_dt(row_dict["last_image_attempt_at"]),
            last_image_unavailable_at=_parse_dt(row_dict["last_image_unavailable_at"]),
            last_image_unavailable_lat=row_dict["last_image_unavailable_lat"],
            last_image_unavailable_lng=row_dict["last_image_unavailable_lng"],
            last_image_sent_at=_parse_dt(row_dict["last_image_sent_at"]),
            last_image_sent_lat=row_dict["last_image_sent_lat"],
            last_image_sent_lng=row_dict["last_image_sent_lng"],
            last_image_street=row_dict["last_image_street"],
            last_alert_key=row_dict["last_alert_key"],
            last_message_id=row_dict["last_message_id"],
            message_sequence=row_dict["message_sequence"],
            last_map_attempt_at=_parse_dt(row_dict.get("last_map_attempt_at")),
            last_map_sent_at=_parse_dt(row_dict.get("last_map_sent_at")),
            last_map_sent_lat=row_dict.get("last_map_sent_lat"),
            last_map_sent_lng=row_dict.get("last_map_sent_lng"),
            last_map_sent_progress_m=row_dict.get("last_map_sent_progress_m"),
            last_route_progress_m=row_dict.get("last_route_progress_m"),
            last_route_segment_index=row_dict.get("last_route_segment_index"),
        )

    def save_state(self, state: VehicleState) -> None:
        """Persiste o estado de um veículo (upsert)."""
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (
                    vehicle_id, current_status, previous_status,
                    last_processed_updated_at, last_motion_at, stationary_since,
                    last_observed_lat, last_observed_lng,
                    last_location_sent_at, last_location_sent_lat, last_location_sent_lng,
                    last_image_attempt_at,
                    last_image_unavailable_at, last_image_unavailable_lat, last_image_unavailable_lng,
                    last_image_sent_at, last_image_sent_lat, last_image_sent_lng, last_image_street,
                    last_alert_key, last_message_id, message_sequence,
                    last_map_attempt_at, last_map_sent_at, last_map_sent_lat, last_map_sent_lng,
                    last_map_sent_progress_m, last_route_progress_m, last_route_segment_index
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    current_status = excluded.current_status,
                    previous_status = excluded.previous_status,
                    last_processed_updated_at = excluded.last_processed_updated_at,
                    last_motion_at = excluded.last_motion_at,
                    stationary_since = excluded.stationary_since,
                    last_observed_lat = excluded.last_observed_lat,
                    last_observed_lng = excluded.last_observed_lng,
                    last_location_sent_at = excluded.last_location_sent_at,
                    last_location_sent_lat = excluded.last_location_sent_lat,
                    last_location_sent_lng = excluded.last_location_sent_lng,
                    last_alert_key = excluded.last_alert_key,
                    -- last_message_id belongs to delivery workers
                    message_sequence = excluded.message_sequence,
                    last_map_attempt_at = CASE
                        WHEN excluded.last_map_attempt_at IS NOT NULL
                         AND (
                            runtime_state.last_map_attempt_at IS NULL
                            OR excluded.last_map_attempt_at
                               > runtime_state.last_map_attempt_at
                         )
                        THEN excluded.last_map_attempt_at
                        ELSE runtime_state.last_map_attempt_at
                    END,
                    last_map_sent_at = CASE
                        WHEN excluded.last_map_sent_at IS NOT NULL
                         AND (
                            runtime_state.last_map_sent_at IS NULL
                            OR excluded.last_map_sent_at
                               > runtime_state.last_map_sent_at
                         )
                        THEN excluded.last_map_sent_at
                        ELSE runtime_state.last_map_sent_at
                    END,
                    last_map_sent_lat = CASE
                        WHEN excluded.last_map_sent_at IS NOT NULL
                         AND (
                            runtime_state.last_map_sent_at IS NULL
                            OR excluded.last_map_sent_at
                               > runtime_state.last_map_sent_at
                         )
                        THEN excluded.last_map_sent_lat
                        ELSE runtime_state.last_map_sent_lat
                    END,
                    last_map_sent_lng = CASE
                        WHEN excluded.last_map_sent_at IS NOT NULL
                         AND (
                            runtime_state.last_map_sent_at IS NULL
                            OR excluded.last_map_sent_at
                               > runtime_state.last_map_sent_at
                         )
                        THEN excluded.last_map_sent_lng
                        ELSE runtime_state.last_map_sent_lng
                    END,
                    last_map_sent_progress_m = CASE
                        WHEN excluded.last_map_sent_at IS NOT NULL
                         AND (
                            runtime_state.last_map_sent_at IS NULL
                            OR excluded.last_map_sent_at
                               > runtime_state.last_map_sent_at
                         )
                        THEN excluded.last_map_sent_progress_m
                        ELSE runtime_state.last_map_sent_progress_m
                    END,
                    last_route_progress_m = excluded.last_route_progress_m,
                    last_route_segment_index = excluded.last_route_segment_index
                """,
                (
                    state.vehicle_id, state.current_status, state.previous_status,
                    _format_dt(state.last_processed_updated_at),
                    _format_dt(state.last_motion_at),
                    _format_dt(state.stationary_since),
                    state.last_observed_lat, state.last_observed_lng,
                    _format_dt(state.last_location_sent_at),
                    state.last_location_sent_lat, state.last_location_sent_lng,
                    _format_dt(state.last_image_attempt_at),
                    _format_dt(state.last_image_unavailable_at),
                    state.last_image_unavailable_lat, state.last_image_unavailable_lng,
                    _format_dt(state.last_image_sent_at),
                    state.last_image_sent_lat, state.last_image_sent_lng,
                    state.last_image_street,
                    state.last_alert_key, state.last_message_id,
                    state.message_sequence,
                    _format_dt(state.last_map_attempt_at),
                    _format_dt(state.last_map_sent_at),
                    state.last_map_sent_lat,
                    state.last_map_sent_lng,
                    state.last_map_sent_progress_m,
                    state.last_route_progress_m,
                    state.last_route_segment_index,
                )
            )
            conn.commit()
        finally:
            conn.close()

    def mark_image_attempt(
        self,
        vehicle_id: str,
        attempted_at: datetime,
    ) -> None:
        """Registra uma tentativa sem sobrescrever a máquina de estados."""

        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (vehicle_id, last_image_attempt_at)
                VALUES (?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_image_attempt_at = excluded.last_image_attempt_at
                """,
                (vehicle_id, _format_dt(attempted_at)),
            )
            conn.commit()
        finally:
            conn.close()

    def mark_map_attempt(
        self,
        vehicle_id: str,
        attempted_at: datetime,
    ) -> None:
        """Registra uma tentativa de geração de mapa sem alterar outros estados."""

        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (vehicle_id, last_map_attempt_at)
                VALUES (?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_map_attempt_at = excluded.last_map_attempt_at
                """,
                (vehicle_id, _format_dt(attempted_at)),
            )
            conn.commit()
        finally:
            conn.close()

    def complete_map_notification(
        self,
        job_id: int,
        *,
        lease_owner: str,
        provider_message_id: str,
        sent_at: datetime,
        latitude: float,
        longitude: float,
        progress_m: float,
    ) -> bool:
        """Confirma a notificação de mapa e atualiza o estado em um commit transacional."""

        lease_owner = str(lease_owner).strip()
        provider_message_id = str(provider_message_id).strip()
        if not lease_owner or not provider_message_id:
            raise ValueError(
                "lease_owner e provider_message_id sao obrigatorios"
            )
        completed_at = _parse_dt(_format_dt(sent_at))
        if completed_at is None:
            raise ValueError("sent_at invalido")
        completed_text = _format_dt(completed_at)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT vehicle_id
                FROM notification_outbox
                WHERE id = ?
                  AND channel = 'map'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return False

            vehicle_id = row["vehicle_id"]
            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'sent',
                    provider_message_id = ?,
                    sent_at = ?,
                    updated_at = ?,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = NULL
                WHERE id = ?
                  AND channel = 'map'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (
                    provider_message_id,
                    completed_text,
                    completed_text,
                    job_id,
                    lease_owner,
                ),
            )
            if cursor.rowcount != 1:
                conn.rollback()
                return False

            conn.execute(
                """
                INSERT INTO runtime_state (
                    vehicle_id,
                    last_map_attempt_at,
                    last_map_sent_at,
                    last_map_sent_lat,
                    last_map_sent_lng,
                    last_map_sent_progress_m,
                    last_message_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_map_attempt_at = excluded.last_map_attempt_at,
                    last_map_sent_at = excluded.last_map_sent_at,
                    last_map_sent_lat = excluded.last_map_sent_lat,
                    last_map_sent_lng = excluded.last_map_sent_lng,
                    last_map_sent_progress_m = excluded.last_map_sent_progress_m,
                    last_message_id = excluded.last_message_id
                """,
                (
                    vehicle_id,
                    completed_text,
                    completed_text,
                    latitude,
                    longitude,
                    progress_m,
                    provider_message_id,
                ),
            )
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def record_image_unavailable(
        self,
        *,
        vehicle_id: str,
        unavailable_at: datetime,
        latitude: float,
        longitude: float,
    ) -> None:
        """Registra uma coordenada sem cobertura sem alterar outros estados."""

        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (
                    vehicle_id,
                    last_image_attempt_at,
                    last_image_unavailable_at,
                    last_image_unavailable_lat,
                    last_image_unavailable_lng
                ) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_image_attempt_at = excluded.last_image_attempt_at,
                    last_image_unavailable_at = excluded.last_image_unavailable_at,
                    last_image_unavailable_lat = excluded.last_image_unavailable_lat,
                    last_image_unavailable_lng = excluded.last_image_unavailable_lng
                """,
                (
                    vehicle_id,
                    _format_dt(unavailable_at),
                    _format_dt(unavailable_at),
                    latitude,
                    longitude,
                ),
            )
            conn.commit()
        finally:
            conn.close()

    def record_image_sent(
        self,
        *,
        vehicle_id: str,
        sent_at: datetime,
        latitude: float,
        longitude: float,
        street: Optional[str],
    ) -> None:
        """Atualiza apenas os campos de imagem após confirmação da Z-API."""

        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (
                    vehicle_id,
                    last_image_attempt_at,
                    last_image_unavailable_at,
                    last_image_unavailable_lat,
                    last_image_unavailable_lng,
                    last_image_sent_at,
                    last_image_sent_lat,
                    last_image_sent_lng,
                    last_image_street
                ) VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_image_attempt_at = excluded.last_image_attempt_at,
                    last_image_unavailable_at = NULL,
                    last_image_unavailable_lat = NULL,
                    last_image_unavailable_lng = NULL,
                    last_image_sent_at = excluded.last_image_sent_at,
                    last_image_sent_lat = excluded.last_image_sent_lat,
                    last_image_sent_lng = excluded.last_image_sent_lng,
                    last_image_street = excluded.last_image_street
                """,
                (
                    vehicle_id,
                    _format_dt(sent_at),
                    _format_dt(sent_at),
                    latitude,
                    longitude,
                    street,
                ),
            )
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def _notification_from_row(row: sqlite3.Row) -> NotificationOutboxJob:
        def required_datetime(column: str) -> datetime:
            value = _parse_dt(row[column])
            if value is None:
                raise ValueError(f"timestamp invalido na outbox: {column}")
            return value

        return NotificationOutboxJob(
            id=row["id"],
            vehicle_id=row["vehicle_id"],
            channel=row["channel"],
            dedupe_key=row["dedupe_key"],
            content_key=row["content_key"],
            depends_on_id=row["depends_on_id"],
            wait_for_terminal_id=row["wait_for_terminal_id"],
            payload_json=row["payload_json"],
            status=row["status"],
            attempts=row["attempts"],
            max_attempts=row["max_attempts"],
            next_attempt_at=required_datetime("next_attempt_at"),
            lease_owner=row["lease_owner"],
            lease_until=_parse_dt(row["lease_until"]),
            expires_at=_parse_dt(row["expires_at"]),
            provider_message_id=row["provider_message_id"],
            last_error=row["last_error"],
            created_at=required_datetime("created_at"),
            updated_at=required_datetime("updated_at"),
            sent_at=_parse_dt(row["sent_at"]),
        )

    @staticmethod
    def _panorama_fallback_from_payload(
        payload_json: str,
    ) -> tuple[str, str, int, Optional[datetime]]:
        """Valida e serializa o fallback de texto de um panorama."""

        try:
            payload = json.loads(payload_json)
        except (json.JSONDecodeError, TypeError) as exc:
            raise ValueError("payload de panorama invalido") from exc
        if not isinstance(payload, dict):
            raise ValueError("payload de panorama deve ser um objeto JSON")

        dedupe_key = str(payload.get("fallback_dedupe_key") or "").strip()
        fallback_payload = payload.get("fallback_payload")
        max_attempts = payload.get("fallback_max_attempts", 5)
        expires_raw = payload.get("fallback_expires_at")
        if not dedupe_key:
            raise ValueError("fallback_dedupe_key e obrigatorio")
        if not isinstance(fallback_payload, dict):
            raise ValueError("fallback_payload deve ser um objeto JSON")
        if (
            isinstance(max_attempts, bool)
            or not isinstance(max_attempts, int)
            or max_attempts < 1
        ):
            raise ValueError("fallback_max_attempts deve ser positivo")

        expires_at = None
        if expires_raw is not None:
            expires_at = _parse_dt(expires_raw)
            if expires_at is None:
                raise ValueError("fallback_expires_at invalido")

        fallback_json = json.dumps(
            fallback_payload,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        return dedupe_key, fallback_json, max_attempts, expires_at

    @staticmethod
    def _promote_panorama_row(
        conn: sqlite3.Connection,
        row: sqlite3.Row,
        *,
        error: str,
        current: datetime,
    ) -> bool:
        """Transforma o mesmo item logico em fallback de texto."""

        current_text = _format_dt(current)
        try:
            (
                dedupe_key,
                fallback_json,
                max_attempts,
                expires_at,
            ) = TrackerDB._panorama_fallback_from_payload(row["payload_json"])
        except (TypeError, ValueError):
            conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'dead',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = 'panorama_fallback_invalid',
                    updated_at = ?
                WHERE id = ? AND channel = 'panorama'
                """,
                (current_text, row["id"]),
            )
            return False

        expired = expires_at is not None and expires_at <= current
        status = "expired" if expired else "queued"
        last_error = "fallback_expired" if expired else str(error)[:2000]
        cursor = conn.execute(
            """
            UPDATE OR IGNORE notification_outbox
            SET channel = 'text',
                dedupe_key = ?,
                payload_json = ?,
                status = ?,
                attempts = 0,
                max_attempts = ?,
                next_attempt_at = ?,
                lease_owner = NULL,
                lease_until = NULL,
                expires_at = ?,
                provider_message_id = NULL,
                last_error = ?,
                updated_at = ?,
                sent_at = NULL
            WHERE id = ? AND channel = 'panorama'
            """,
            (
                dedupe_key,
                fallback_json,
                status,
                max_attempts,
                current_text,
                _format_dt(expires_at),
                last_error,
                current_text,
                row["id"],
            ),
        )
        if cursor.rowcount == 1:
            return True

        conn.execute(
            """
            UPDATE notification_outbox
            SET status = 'dead',
                lease_owner = NULL,
                lease_until = NULL,
                last_error = 'panorama_fallback_duplicate',
                updated_at = ?
            WHERE id = ? AND channel = 'panorama'
            """,
            (current_text, row["id"]),
        )
        return False

    @staticmethod
    def _promote_map_row(
        conn: sqlite3.Connection,
        row: sqlite3.Row,
        *,
        error: str,
        current: datetime,
    ) -> bool:
        """Transforma o mesmo item logico de mapa em fallback de texto."""

        current_text = _format_dt(current)
        try:
            (
                dedupe_key,
                fallback_json,
                max_attempts,
                expires_at,
            ) = TrackerDB._panorama_fallback_from_payload(row["payload_json"])
        except (TypeError, ValueError):
            conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'dead',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = 'map_fallback_invalid',
                    updated_at = ?
                WHERE id = ? AND channel = 'map'
                """,
                (current_text, row["id"]),
            )
            return False

        terminal_wait_id = None
        try:
            source_payload = json.loads(row["payload_json"])
            primary_content_key = str(
                source_payload.get("primary_content_key") or ""
            ).strip()
            if primary_content_key:
                primary = conn.execute(
                    """
                    SELECT id, vehicle_id
                    FROM notification_outbox
                    WHERE content_key = ? AND id <> ?
                    """,
                    (primary_content_key, row["id"]),
                ).fetchone()
                if (
                    primary is not None
                    and primary["vehicle_id"] == row["vehicle_id"]
                ):
                    terminal_wait_id = int(primary["id"])
        except (AttributeError, TypeError, ValueError, json.JSONDecodeError):
            terminal_wait_id = None

        expired = expires_at is not None and expires_at <= current
        status = "expired" if expired else "queued"
        last_error = "fallback_expired" if expired else str(error)[:2000]
        cursor = conn.execute(
            """
            UPDATE OR IGNORE notification_outbox
            SET channel = 'text',
                dedupe_key = ?,
                payload_json = ?,
                status = ?,
                attempts = 0,
                max_attempts = ?,
                next_attempt_at = ?,
                lease_owner = NULL,
                lease_until = NULL,
                wait_for_terminal_id = ?,
                expires_at = ?,
                provider_message_id = NULL,
                last_error = ?,
                updated_at = ?,
                sent_at = NULL
            WHERE id = ? AND channel = 'map'
            """,
            (
                dedupe_key,
                fallback_json,
                status,
                max_attempts,
                current_text,
                terminal_wait_id,
                _format_dt(expires_at),
                last_error,
                current_text,
                row["id"],
            ),
        )
        if cursor.rowcount == 1:
            return True

        conn.execute(
            """
            UPDATE notification_outbox
            SET status = 'dead',
                lease_owner = NULL,
                lease_until = NULL,
                last_error = 'map_fallback_duplicate',
                updated_at = ?
            WHERE id = ? AND channel = 'map'
            """,
            (current_text, row["id"]),
        )
        return False

    def acquire_tracker_lease(
        self,
        *,
        lease_name: str,
        lease_owner: str,
        lease_seconds: float,
        now: Optional[datetime] = None,
    ) -> bool:
        """Adquire ou renova liderança; somente um processo vence."""
        lease_name = str(lease_name).strip()
        lease_owner = str(lease_owner).strip()
        if not lease_name or not lease_owner:
            raise ValueError("lease_name e lease_owner são obrigatórios")
        if lease_seconds <= 0:
            raise ValueError("lease_seconds deve ser positivo")

        current = now or _now_utc()
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        current = current.astimezone(timezone.utc)
        lease_until = current + timedelta(seconds=float(lease_seconds))

        conn = self._connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.execute(
                """
                INSERT INTO tracker_leases (
                    lease_name,
                    lease_owner,
                    lease_until,
                    updated_at
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(lease_name) DO UPDATE SET
                    lease_owner = excluded.lease_owner,
                    lease_until = excluded.lease_until,
                    updated_at = excluded.updated_at
                WHERE tracker_leases.lease_owner = excluded.lease_owner
                   OR tracker_leases.lease_until <= excluded.updated_at
                """,
                (
                    lease_name,
                    lease_owner,
                    _format_dt(lease_until),
                    _format_dt(current),
                ),
            )
            conn.commit()
            return cursor.rowcount == 1
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def release_tracker_lease(
        self,
        *,
        lease_name: str,
        lease_owner: str,
    ) -> bool:
        """Libera a liderança sem apagar o lease de outro processo."""
        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                DELETE FROM tracker_leases
                WHERE lease_name = ? AND lease_owner = ?
                """,
                (lease_name, lease_owner),
            )
            conn.commit()
            return cursor.rowcount == 1
        finally:
            conn.close()

    def enqueue_notification(
        self,
        *,
        vehicle_id: str,
        channel: str,
        dedupe_key: str,
        content_key: Optional[str] = None,
        payload: dict[str, Any],
        max_attempts: int = 5,
        created_at: Optional[datetime] = None,
        available_at: Optional[datetime] = None,
        expires_at: Optional[datetime] = None,
        completion_separator_count: int = 0,
        completion_separator_phone: Optional[str] = None,
        completion_separator_expires_at: Optional[datetime] = None,
        completion_wait_channel: Optional[str] = None,
        completion_wait_dedupe_key: Optional[str] = None,
    ) -> bool:
        """Insere um payload imutavel e seus separadores no mesmo commit.

        Cada separador depende do sucesso do item anterior. O primeiro tambem
        espera o componente indicado por ``completion_wait_*`` chegar a um
        estado terminal, sem serializar os workers de localizacao e conteudo.
        """

        vehicle_id = str(vehicle_id).strip()
        channel = str(channel).strip().lower()
        dedupe_key = str(dedupe_key).strip()
        content_key = (
            str(content_key).strip() if content_key is not None else None
        )
        if not content_key:
            content_key = None
        if not vehicle_id or not channel or not dedupe_key:
            raise ValueError("vehicle_id, channel e dedupe_key sao obrigatorios")
        if not isinstance(payload, dict):
            raise TypeError("payload deve ser um dicionario")
        if max_attempts < 1:
            raise ValueError("max_attempts deve ser positivo")
        if isinstance(completion_separator_count, bool):
            raise ValueError("completion_separator_count invalido")
        separator_count = int(completion_separator_count)
        if separator_count < 0 or separator_count > 10:
            raise ValueError("completion_separator_count deve estar entre 0 e 10")
        separator_phone = str(completion_separator_phone or "").strip()
        wait_channel = str(completion_wait_channel or "").strip().lower()
        wait_dedupe_key = str(completion_wait_dedupe_key or "").strip()
        if separator_count and (not content_key or not separator_phone):
            raise ValueError(
                "content_key e completion_separator_phone sao obrigatorios"
            )
        if bool(wait_channel) != bool(wait_dedupe_key):
            raise ValueError(
                "completion_wait_channel e completion_wait_dedupe_key "
                "devem ser informados juntos"
            )

        payload_json = json.dumps(
            payload,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        created = created_at or _now_utc()
        available = available_at or created
        now_text = _format_dt(created)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.execute(
                """
                INSERT INTO notification_outbox (
                    vehicle_id, channel, dedupe_key, content_key,
                    depends_on_id, wait_for_terminal_id, payload_json,
                    status, attempts, max_attempts, next_attempt_at,
                    lease_owner, lease_until, expires_at,
                    provider_message_id, last_error,
                    created_at, updated_at, sent_at
                ) VALUES (
                    ?, ?, ?, ?, NULL, NULL, ?, 'queued', 0, ?, ?,
                    NULL, NULL, ?, NULL, NULL, ?, ?, NULL
                )
                ON CONFLICT DO NOTHING
                """,
                (
                    vehicle_id,
                    channel,
                    dedupe_key,
                    content_key,
                    payload_json,
                    max_attempts,
                    _format_dt(available),
                    _format_dt(expires_at),
                    now_text,
                    now_text,
                ),
            )
            inserted = cursor.rowcount == 1

            if separator_count:
                parent = conn.execute(
                    """
                    SELECT id, vehicle_id
                    FROM notification_outbox
                    WHERE content_key = ?
                    """,
                    (content_key,),
                ).fetchone()
                if parent is None or parent["vehicle_id"] != vehicle_id:
                    raise ValueError(
                        "conteudo logico ausente ou pertence a outro veiculo"
                    )

                terminal_wait_id = None
                if wait_channel:
                    wait_row = conn.execute(
                        """
                        SELECT id, vehicle_id
                        FROM notification_outbox
                        WHERE channel = ? AND dedupe_key = ?
                        """,
                        (wait_channel, wait_dedupe_key),
                    ).fetchone()
                    if wait_row is not None:
                        if wait_row["vehicle_id"] != vehicle_id:
                            raise ValueError(
                                "componente anterior pertence a outro veiculo"
                            )
                        terminal_wait_id = int(wait_row["id"])

                separator_payload_json = json.dumps(
                    {"message": ".", "phone": separator_phone},
                    ensure_ascii=False,
                    allow_nan=False,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                predecessor_id = int(parent["id"])
                separator_expiry = (
                    completion_separator_expires_at
                    if completion_separator_expires_at is not None
                    else expires_at
                )
                for position in range(1, separator_count + 1):
                    separator_dedupe = f"{content_key}:separator:{position}"
                    existing = conn.execute(
                        """
                        SELECT id, vehicle_id, payload_json, depends_on_id,
                               wait_for_terminal_id
                        FROM notification_outbox
                        WHERE channel = 'text' AND dedupe_key = ?
                        """,
                        (separator_dedupe,),
                    ).fetchone()
                    expected_terminal_wait = (
                        terminal_wait_id if position == 1 else None
                    )
                    if existing is None:
                        separator_cursor = conn.execute(
                            """
                            INSERT INTO notification_outbox (
                                vehicle_id, channel, dedupe_key, content_key,
                                depends_on_id, wait_for_terminal_id,
                                payload_json, status, attempts, max_attempts,
                                next_attempt_at, lease_owner, lease_until,
                                expires_at, provider_message_id, last_error,
                                created_at, updated_at, sent_at
                            ) VALUES (
                                ?, 'text', ?, NULL, ?, ?, ?, 'queued', 0, ?,
                                ?, NULL, NULL, ?, NULL, NULL, ?, ?, NULL
                            )
                            """,
                            (
                                vehicle_id,
                                separator_dedupe,
                                predecessor_id,
                                expected_terminal_wait,
                                separator_payload_json,
                                max_attempts,
                                _format_dt(available),
                                _format_dt(separator_expiry),
                                now_text,
                                now_text,
                            ),
                        )
                        predecessor_id = int(separator_cursor.lastrowid)
                        continue

                    if (
                        existing["vehicle_id"] != vehicle_id
                        or existing["payload_json"] != separator_payload_json
                        or existing["depends_on_id"] != predecessor_id
                        or existing["wait_for_terminal_id"]
                        != expected_terminal_wait
                    ):
                        raise ValueError(
                            f"separador idempotente divergente: {separator_dedupe}"
                        )
                    predecessor_id = int(existing["id"])

            conn.commit()
            return inserted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def claim_notification(
        self,
        *,
        channel: str,
        lease_owner: str,
        lease_seconds: float = 60.0,
        now: Optional[datetime] = None,
    ) -> Optional[NotificationOutboxJob]:
        """Reclama atomicamente um item devido, inclusive lease vencido."""

        if not channel or not lease_owner:
            raise ValueError("channel e lease_owner sao obrigatorios")
        if lease_seconds <= 0:
            raise ValueError("lease_seconds deve ser positivo")

        claimed_at = now or _now_utc()
        now_text = _format_dt(claimed_at)
        lease_until = claimed_at + timedelta(seconds=lease_seconds)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")

            conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'expired',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = COALESCE(last_error, 'ttl_expired'),
                    updated_at = ?
                WHERE channel = ?
                  AND expires_at IS NOT NULL
                  AND expires_at <= ?
                  AND (
                        status IN ('queued', 'retry')
                        OR (
                            status = 'inflight'
                            AND (lease_until IS NULL OR lease_until <= ?)
                        )
                  )
                """,
                (now_text, channel, now_text, now_text),
            )
            conn.execute(
                """
                WITH RECURSIVE failed_dependency(id) AS (
                    SELECT child.id
                    FROM notification_outbox AS child
                    JOIN notification_outbox AS predecessor
                      ON predecessor.id = child.depends_on_id
                    WHERE child.channel = ?
                      AND child.status IN ('queued', 'retry')
                      AND predecessor.status IN ('dead', 'expired')

                    UNION ALL

                    SELECT descendant.id
                    FROM notification_outbox AS descendant
                    JOIN failed_dependency AS failed
                      ON failed.id = descendant.depends_on_id
                    WHERE descendant.channel = ?
                      AND descendant.status IN ('queued', 'retry')
                )
                UPDATE notification_outbox
                SET status = CASE
                        WHEN expires_at IS NOT NULL AND expires_at <= ?
                            THEN 'expired'
                        ELSE 'dead'
                    END,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = CASE
                        WHEN expires_at IS NOT NULL AND expires_at <= ?
                            THEN 'ttl_expired'
                        ELSE 'dependency_not_sent'
                    END,
                    updated_at = ?
                WHERE id IN (SELECT id FROM failed_dependency)
                """,
                (channel, channel, now_text, now_text, now_text),
            )
            conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'dead',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = COALESCE(
                        last_error,
                        'max_attempts_exhausted'
                    ),
                    updated_at = ?
                WHERE channel = ?
                  AND attempts >= max_attempts
                  AND (
                        status IN ('queued', 'retry')
                        OR (
                            status = 'inflight'
                            AND (lease_until IS NULL OR lease_until <= ?)
                        )
                  )
                """,
                (now_text, channel, now_text),
            )

            row = conn.execute(
                """
                SELECT candidate.id
                FROM notification_outbox AS candidate
                WHERE candidate.channel = ?
                  AND (
                        candidate.status IN ('queued', 'retry')
                        OR (
                            candidate.status = 'inflight'
                            AND (
                                candidate.lease_until IS NULL
                                OR candidate.lease_until <= ?
                            )
                        )
                  )
                  AND candidate.attempts < candidate.max_attempts
                  AND candidate.next_attempt_at <= ?
                  AND (
                        candidate.expires_at IS NULL
                        OR candidate.expires_at > ?
                  )
                  AND (
                        candidate.depends_on_id IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM notification_outbox AS predecessor
                            WHERE predecessor.id = candidate.depends_on_id
                              AND predecessor.status = 'sent'
                        )
                  )
                  AND (
                        candidate.wait_for_terminal_id IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM notification_outbox AS flow_component
                            WHERE flow_component.id =
                                  candidate.wait_for_terminal_id
                              AND flow_component.status IN (
                                  'sent', 'dead', 'expired'
                              )
                        )
                  )
                ORDER BY candidate.next_attempt_at ASC,
                         candidate.created_at ASC,
                         candidate.id ASC
                LIMIT 1
                """,
                (channel, now_text, now_text, now_text),
            ).fetchone()
            if row is None:
                conn.commit()
                return None

            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'inflight',
                    attempts = attempts + 1,
                    lease_owner = ?,
                    lease_until = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    lease_owner,
                    _format_dt(lease_until),
                    now_text,
                    row["id"],
                ),
            )
            if cursor.rowcount != 1:
                conn.rollback()
                return None

            claimed = conn.execute(
                "SELECT * FROM notification_outbox WHERE id = ?",
                (row["id"],),
            ).fetchone()
            conn.commit()
            if claimed is None:
                return None
            return self._notification_from_row(claimed)
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def renew_notification_lease(
        self,
        job_id: int,
        *,
        lease_owner: str,
        lease_seconds: float,
        now: Optional[datetime] = None,
    ) -> bool:
        """Renova somente um lease ainda vigente e pertencente ao worker."""

        lease_owner = str(lease_owner).strip()
        if not lease_owner:
            raise ValueError("lease_owner e obrigatorio")
        if lease_seconds <= 0:
            raise ValueError("lease_seconds deve ser positivo")
        current = _parse_dt(_format_dt(now or _now_utc()))
        if current is None:
            raise ValueError("now invalido")
        new_until = current + timedelta(seconds=float(lease_seconds))
        current_text = _format_dt(current)
        new_until_text = _format_dt(new_until)

        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET lease_until = CASE
                        WHEN expires_at IS NOT NULL AND expires_at < ?
                            THEN expires_at
                        ELSE ?
                    END,
                    updated_at = ?
                WHERE id = ?
                  AND status = 'inflight'
                  AND lease_owner = ?
                  AND lease_until IS NOT NULL
                  AND lease_until > ?
                  AND (expires_at IS NULL OR expires_at > ?)
                """,
                (
                    new_until_text,
                    new_until_text,
                    current_text,
                    job_id,
                    lease_owner,
                    current_text,
                    current_text,
                ),
            )
            conn.commit()
            return cursor.rowcount == 1
        finally:
            conn.close()

    def promote_panorama_to_text(
        self,
        job_id: int,
        *,
        lease_owner: str,
        error: str,
        now: Optional[datetime] = None,
    ) -> bool:
        """Converte um panorama reclamado no fallback de texto duravel."""

        lease_owner = str(lease_owner).strip()
        if not lease_owner:
            raise ValueError("lease_owner e obrigatorio")
        current = _parse_dt(_format_dt(now or _now_utc()))
        if current is None:
            raise ValueError("now invalido")
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE id = ?
                  AND channel = 'panorama'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return False
            promoted = self._promote_panorama_row(
                conn,
                row,
                error=error,
                current=current,
            )
            conn.commit()
            return promoted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def recover_panorama_fallbacks(
        self,
        *,
        created_before: datetime,
        now: Optional[datetime] = None,
    ) -> int:
        """Recupera panoramas abandonados sem roubar leases vigentes."""

        threshold = _parse_dt(_format_dt(created_before))
        current = _parse_dt(_format_dt(now or _now_utc()))
        if threshold is None or current is None:
            raise ValueError("created_before e now devem ser timestamps validos")
        threshold_text = _format_dt(threshold)
        current_text = _format_dt(current)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            rows = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE channel = 'panorama'
                  AND created_at <= ?
                  AND (
                        status IN ('queued', 'retry')
                        OR (
                            status = 'inflight'
                            AND (lease_until IS NULL OR lease_until <= ?)
                        )
                  )
                ORDER BY created_at ASC, id ASC
                """,
                (threshold_text, current_text),
            ).fetchall()
            promoted = 0
            for row in rows:
                if self._promote_panorama_row(
                    conn,
                    row,
                    error="panorama_recovered_as_text",
                    current=current,
                ):
                    promoted += 1
            conn.commit()
            return promoted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def promote_map_to_text(
        self,
        job_id: int,
        *,
        lease_owner: str,
        error: str,
        now: Optional[datetime] = None,
    ) -> bool:
        """Converte um mapa reclamado no fallback de texto durável."""

        lease_owner = str(lease_owner).strip()
        if not lease_owner:
            raise ValueError("lease_owner e obrigatorio")
        current = _parse_dt(_format_dt(now or _now_utc()))
        if current is None:
            raise ValueError("now invalido")
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE id = ?
                  AND channel = 'map'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return False
            promoted = self._promote_map_row(
                conn,
                row,
                error=error,
                current=current,
            )
            conn.commit()
            return promoted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def recover_map_fallbacks(
        self,
        *,
        created_before: datetime,
        now: Optional[datetime] = None,
    ) -> int:
        """Recupera mapas abandonados sem roubar leases vigentes."""

        threshold = _parse_dt(_format_dt(created_before))
        current = _parse_dt(_format_dt(now or _now_utc()))
        if threshold is None or current is None:
            raise ValueError("created_before e now devem ser timestamps validos")
        threshold_text = _format_dt(threshold)
        current_text = _format_dt(current)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            rows = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE channel = 'map'
                  AND created_at <= ?
                  AND (
                        status IN ('queued', 'retry')
                        OR (
                            status = 'inflight'
                            AND (lease_until IS NULL OR lease_until <= ?)
                        )
                  )
                ORDER BY created_at ASC, id ASC
                """,
                (threshold_text, current_text),
            ).fetchall()
            promoted = 0
            for row in rows:
                if self._promote_map_row(
                    conn,
                    row,
                    error="map_recovered_as_text",
                    current=current,
                ):
                    promoted += 1
            conn.commit()
            return promoted
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def complete_panorama_notification(
        self,
        job_id: int,
        *,
        lease_owner: str,
        provider_message_id: str,
        sent_at: datetime,
        latitude: float,
        longitude: float,
        street: Optional[str],
    ) -> bool:
        """Confirma imagem, estado e message id no mesmo commit SQLite."""

        lease_owner = str(lease_owner).strip()
        provider_message_id = str(provider_message_id).strip()
        if not lease_owner or not provider_message_id:
            raise ValueError(
                "lease_owner e provider_message_id sao obrigatorios"
            )
        completed_at = _parse_dt(_format_dt(sent_at))
        if completed_at is None:
            raise ValueError("sent_at invalido")
        completed_text = _format_dt(completed_at)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT vehicle_id
                FROM notification_outbox
                WHERE id = ?
                  AND channel = 'panorama'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return False

            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'sent',
                    provider_message_id = ?,
                    sent_at = ?,
                    updated_at = ?,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = NULL
                WHERE id = ?
                  AND channel = 'panorama'
                  AND status = 'inflight'
                  AND lease_owner = ?
                """,
                (
                    provider_message_id,
                    completed_text,
                    completed_text,
                    job_id,
                    lease_owner,
                ),
            )
            if cursor.rowcount != 1:
                conn.rollback()
                return False

            conn.execute(
                """
                INSERT INTO runtime_state (
                    vehicle_id,
                    last_image_attempt_at,
                    last_image_unavailable_at,
                    last_image_unavailable_lat,
                    last_image_unavailable_lng,
                    last_image_sent_at,
                    last_image_sent_lat,
                    last_image_sent_lng,
                    last_image_street,
                    last_message_id
                ) VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_image_attempt_at = excluded.last_image_attempt_at,
                    last_image_unavailable_at = NULL,
                    last_image_unavailable_lat = NULL,
                    last_image_unavailable_lng = NULL,
                    last_image_sent_at = excluded.last_image_sent_at,
                    last_image_sent_lat = excluded.last_image_sent_lat,
                    last_image_sent_lng = excluded.last_image_sent_lng,
                    last_image_street = excluded.last_image_street,
                    last_message_id = excluded.last_message_id
                """,
                (
                    row["vehicle_id"],
                    completed_text,
                    completed_text,
                    latitude,
                    longitude,
                    street,
                    provider_message_id,
                ),
            )
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def record_delivery_message_id(
        self,
        vehicle_id: str,
        provider_message_id: str,
    ) -> None:
        """Atualiza somente o identificador de entrega do provedor."""

        if not vehicle_id or not provider_message_id:
            raise ValueError("vehicle_id e provider_message_id sao obrigatorios")
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO runtime_state (vehicle_id, last_message_id)
                VALUES (?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_message_id = excluded.last_message_id
                """,
                (vehicle_id, provider_message_id),
            )
            conn.commit()
        finally:
            conn.close()

    def mark_notification_success(
        self,
        job_id: int,
        *,
        lease_owner: str,
        provider_message_id: str,
        sent_at: Optional[datetime] = None,
    ) -> bool:
        """Conclui a outbox e o message id no mesmo commit SQLite."""

        if not provider_message_id:
            raise ValueError("provider_message_id e obrigatorio")
        completed_at = sent_at or _now_utc()
        completed_text = _format_dt(completed_at)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT vehicle_id
                FROM notification_outbox
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return False

            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'sent',
                    provider_message_id = ?,
                    sent_at = ?,
                    updated_at = ?,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = NULL
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (
                    provider_message_id,
                    completed_text,
                    completed_text,
                    job_id,
                    lease_owner,
                ),
            )
            if cursor.rowcount != 1:
                conn.rollback()
                return False
            conn.execute(
                """
                INSERT INTO runtime_state (vehicle_id, last_message_id)
                VALUES (?, ?)
                ON CONFLICT(vehicle_id) DO UPDATE SET
                    last_message_id = excluded.last_message_id
                """,
                (row["vehicle_id"], provider_message_id),
            )
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def mark_notification_retry(
        self,
        job_id: int,
        *,
        lease_owner: str,
        error: str,
        retry_at: datetime,
        now: Optional[datetime] = None,
    ) -> Optional[str]:
        """Agenda retry ou encerra como dead/expired de forma atomica."""

        current = now or _now_utc()
        current_text = _format_dt(current)
        retry_text = _format_dt(retry_at)
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT attempts, max_attempts, expires_at
                FROM notification_outbox
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (job_id, lease_owner),
            ).fetchone()
            if row is None:
                conn.commit()
                return None

            expires_at = _parse_dt(row["expires_at"])
            if expires_at is not None and (
                expires_at <= current or expires_at <= retry_at
            ):
                status = "expired"
                next_attempt_text = current_text
            elif row["attempts"] >= row["max_attempts"]:
                status = "dead"
                next_attempt_text = current_text
            else:
                status = "retry"
                next_attempt_text = retry_text

            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = ?,
                    next_attempt_at = ?,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = ?,
                    updated_at = ?
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (
                    status,
                    next_attempt_text,
                    str(error)[:2000],
                    current_text,
                    job_id,
                    lease_owner,
                ),
            )
            conn.commit()
            return status if cursor.rowcount == 1 else None
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def mark_notification_dead(
        self,
        job_id: int,
        *,
        lease_owner: str,
        error: str,
        failed_at: Optional[datetime] = None,
    ) -> bool:
        failed = failed_at or _now_utc()
        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'dead',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = ?,
                    updated_at = ?
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (
                    str(error)[:2000],
                    _format_dt(failed),
                    job_id,
                    lease_owner,
                ),
            )
            conn.commit()
            return cursor.rowcount == 1
        finally:
            conn.close()

    def mark_notification_expired(
        self,
        job_id: int,
        *,
        lease_owner: str,
        expired_at: Optional[datetime] = None,
        error: str = "ttl_expired",
    ) -> bool:
        expired = expired_at or _now_utc()
        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = 'expired',
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = ?,
                    updated_at = ?
                WHERE id = ? AND status = 'inflight' AND lease_owner = ?
                """,
                (
                    str(error)[:2000],
                    _format_dt(expired),
                    job_id,
                    lease_owner,
                ),
            )
            conn.commit()
            return cursor.rowcount == 1
        finally:
            conn.close()

    def release_notification_lease(
        self,
        job_id: int,
        lease_owner: str,
        now: Optional[datetime] = None,
    ) -> bool:
        status = self.mark_notification_retry(
            job_id,
            lease_owner=lease_owner,
            error="lease_released",
            retry_at=now or _now_utc(),
            now=now,
        )
        return status is not None

    def release_notification_leases(
        self,
        lease_owner: str,
        now: Optional[datetime] = None,
    ) -> int:
        """Devolve todos os leases deste worker sem perder os jobs."""

        released_at = now or _now_utc()
        released_text = _format_dt(released_at)
        conn = self._connect()
        try:
            cursor = conn.execute(
                """
                UPDATE notification_outbox
                SET status = CASE
                        WHEN expires_at IS NOT NULL AND expires_at <= ?
                            THEN 'expired'
                        WHEN attempts >= max_attempts
                            THEN 'dead'
                        ELSE 'retry'
                    END,
                    next_attempt_at = ?,
                    lease_owner = NULL,
                    lease_until = NULL,
                    last_error = COALESCE(last_error, 'lease_released'),
                    updated_at = ?
                WHERE status = 'inflight' AND lease_owner = ?
                """,
                (
                    released_text,
                    released_text,
                    released_text,
                    lease_owner,
                ),
            )
            conn.commit()
            return cursor.rowcount
        finally:
            conn.close()

    def count_notifications(
        self,
        *,
        statuses: Optional[Iterable[str]] = None,
        channels: Optional[Iterable[str]] = None,
        dedupe_key: Optional[str] = None,
        vehicle_id: Optional[str] = None,
        content_key: Optional[str] = None,
    ) -> int:
        clauses: list[str] = []
        params: list[Any] = []

        if statuses is not None:
            values = tuple(statuses)
            if not values:
                return 0
            clauses.append(
                "status IN (" + ",".join("?" for _ in values) + ")"
            )
            params.extend(values)
        if channels is not None:
            values = tuple(channels)
            if not values:
                return 0
            clauses.append(
                "channel IN (" + ",".join("?" for _ in values) + ")"
            )
            params.extend(values)
        if dedupe_key is not None:
            clauses.append("dedupe_key = ?")
            params.append(dedupe_key)
        if vehicle_id is not None:
            clauses.append("vehicle_id = ?")
            params.append(vehicle_id)
        if content_key is not None:
            clauses.append("content_key = ?")
            params.append(content_key)

        sql = "SELECT COUNT(*) FROM notification_outbox"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        conn = self._connect()
        try:
            row = conn.execute(sql, params).fetchone()
            return int(row[0]) if row else 0
        finally:
            conn.close()

    def notification_counts(self) -> dict[str, int]:
        conn = self._connect()
        try:
            rows = conn.execute(
                """
                SELECT status, COUNT(*)
                FROM notification_outbox
                GROUP BY status
                """
            ).fetchall()
            result = {
                "queued": 0,
                "inflight": 0,
                "retry": 0,
                "sent": 0,
                "dead": 0,
                "expired": 0,
            }
            result.update({row[0]: int(row[1]) for row in rows})
            return result
        finally:
            conn.close()

    def get_notification(
        self,
        *,
        channel: str,
        dedupe_key: str,
    ) -> Optional[NotificationOutboxJob]:
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE channel = ? AND dedupe_key = ?
                """,
                (channel, dedupe_key),
            ).fetchone()
            return self._notification_from_row(row) if row else None
        finally:
            conn.close()

    def get_notification_by_content_key(
        self,
        content_key: str,
    ) -> Optional[NotificationOutboxJob]:
        """Busca a unica representacao duravel de um conteudo logico."""

        content_key = str(content_key).strip()
        if not content_key:
            return None
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT *
                FROM notification_outbox
                WHERE content_key = ?
                """,
                (content_key,),
            ).fetchone()
            return self._notification_from_row(row) if row else None
        finally:
            conn.close()

    def notification_wait_seconds(
        self,
        channel: str,
        *,
        default: float = 0.25,
        maximum: float = 1.0,
        now: Optional[datetime] = None,
    ) -> float:
        """Calcula espera curta ate retry, TTL ou lease recuperavel."""

        current = now or _now_utc()
        conn = self._connect()
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(
                """
                SELECT candidate.status, candidate.next_attempt_at,
                       candidate.lease_until, candidate.expires_at
                FROM notification_outbox AS candidate
                WHERE candidate.channel = ?
                  AND candidate.status IN ('queued', 'retry', 'inflight')
                  AND (
                        candidate.depends_on_id IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM notification_outbox AS predecessor
                            WHERE predecessor.id = candidate.depends_on_id
                              AND predecessor.status = 'sent'
                        )
                  )
                  AND (
                        candidate.wait_for_terminal_id IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM notification_outbox AS flow_component
                            WHERE flow_component.id =
                                  candidate.wait_for_terminal_id
                              AND flow_component.status IN (
                                  'sent', 'dead', 'expired'
                              )
                        )
                  )
                """,
                (channel,),
            ).fetchall()
        finally:
            conn.close()

        due_times: list[datetime] = []
        for row in rows:
            if row["status"] == "inflight":
                due = _parse_dt(row["lease_until"]) or current
            else:
                due = _parse_dt(row["next_attempt_at"]) or current
            expires = _parse_dt(row["expires_at"])
            if expires is not None and expires < due:
                due = expires
            due_times.append(due)

        cap = max(0.0, float(maximum))
        fallback = min(max(0.0, float(default)), cap)
        if not due_times:
            return fallback
        seconds = (min(due_times) - current).total_seconds()
        return min(max(0.0, seconds), cap)
