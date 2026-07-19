from __future__ import annotations

import inspect
import threading
from contextlib import ExitStack
from unittest.mock import patch

import pytest
from fastapi import HTTPException

import app.main as main_app
import app.tracker_main as tracker_main


class RecordingEvent:
    def __init__(self, *, initially_set: bool = False) -> None:
        self._is_set = initially_set
        self.transitions: list[str] = []

    def set(self) -> None:
        self._is_set = True
        self.transitions.append("set")

    def clear(self) -> None:
        self._is_set = False
        self.transitions.append("clear")

    def is_set(self) -> bool:
        return self._is_set


class FakeResponse:
    def __init__(self, status_code: int, payload=None, json_error=None) -> None:
        self.status_code = status_code
        self.payload = payload
        self.json_error = json_error

    def json(self):
        if self.json_error is not None:
            raise self.json_error
        return self.payload


class FakeHTTPClient:
    def __init__(self, response: FakeResponse, stop_event: threading.Event) -> None:
        self.response = response
        self.stop_event = stop_event
        self.close_calls = 0

    def get(self, endpoint: str) -> FakeResponse:
        # End the polling loop after this response has been processed.
        self.stop_event.set()
        return self.response

    def close(self) -> None:
        self.close_calls += 1


class FakeClosable:
    def __init__(self, *args, **kwargs) -> None:
        self.close_calls = 0
        self.status_calls = 0
        self.instance_status = {
            "connected": True,
            "smartphoneConnected": True,
        }

    def close(self, timeout=None) -> None:
        self.close_calls += 1

    def get_instance_status(self):
        self.status_calls += 1
        return self.instance_status


class FakeDB:
    def __init__(self, sqlite_path: str) -> None:
        self.release_calls = 0

    def acquire_tracker_lease(self, **kwargs) -> bool:
        return True

    def release_tracker_lease(self, **kwargs) -> bool:
        self.release_calls += 1
        return True

    def recover_panorama_fallbacks(self, **kwargs) -> int:
        return 0

    def recover_map_fallbacks(self, **kwargs) -> int:
        return 0

    def claim_notification(self, **kwargs):
        return None

    def load_state(self, vehicle_id: str):
        return object()


class FakeSnapshot:
    vehicle_id = "sao-cristovao"


class FakeEngine:
    def __init__(self, processed_snapshots: list[str] | None = None) -> None:
        self.processed_snapshots = processed_snapshots

    def process_snapshot(self, snapshot, state, now) -> None:
        if self.processed_snapshots is not None:
            self.processed_snapshots.append(snapshot.vehicle_id)


def run_single_tracker_response(
    response: FakeResponse,
    *,
    zapi_status: dict | None = None,
    processed_snapshots: list[str] | None = None,
) -> RecordingEvent:
    stop_event = threading.Event()
    ready_event = RecordingEvent(initially_set=True)
    http_client = FakeHTTPClient(response, stop_event)
    zapi = FakeClosable()
    if zapi_status is not None:
        zapi.instance_status = zapi_status
    engine = FakeEngine(processed_snapshots)

    with ExitStack() as patches:
        patches.enter_context(
            patch.object(tracker_main, "ZAPIClient", return_value=zapi)
        )
        patches.enter_context(patch.object(tracker_main, "TrackerDB", FakeDB))
        patches.enter_context(
            patch.object(tracker_main, "ReverseGeocoder", return_value=object())
        )
        patches.enter_context(
            patch.object(
                tracker_main,
                "AsyncReverseGeocoder",
                return_value=FakeClosable(),
            )
        )
        patches.enter_context(
            patch.object(
                tracker_main,
                "AsyncZAPIDispatcher",
                return_value=FakeClosable(),
            )
        )
        patches.enter_context(
            patch.object(tracker_main, "TrackerEngine", return_value=engine)
        )
        patches.enter_context(
            patch.object(
                tracker_main.VehicleSnapshot,
                "from_api",
                return_value=FakeSnapshot(),
            )
        )
        patches.enter_context(
            patch.object(tracker_main.settings, "TRACKER_PANORAMA_ENABLED", False)
        )
        patches.enter_context(
            patch.object(tracker_main.settings, "TRACKER_POLL_SECONDS", 1)
        )
        patches.enter_context(
            patch.object(tracker_main.httpx, "Client", return_value=http_client)
        )

        tracker_main.run_tracker_background(stop_event, ready_event)

    assert http_client.close_calls == 1
    assert zapi.status_calls == 1
    return ready_event


def test_tracker_ready_event_is_optional_for_one_argument_callers():
    parameter = inspect.signature(tracker_main.run_tracker_background).parameters[
        "ready_event"
    ]
    assert parameter.default is None


def test_tracker_sets_ready_only_after_valid_200_json_and_clears_on_exit():
    ready_event = run_single_tracker_response(
        FakeResponse(200, {"serverTime": None, "vehicles": []})
    )

    assert ready_event.transitions == ["clear", "set", "clear"]
    assert ready_event.is_set() is False


@pytest.mark.parametrize(
    "response",
    [
        FakeResponse(503, {"serverTime": None, "vehicles": []}),
        FakeResponse(200, ["valid JSON, but not a tracker object"]),
        FakeResponse(200, json_error=ValueError("invalid JSON")),
    ],
)
def test_tracker_does_not_become_ready_for_invalid_endpoint_response(response):
    ready_event = run_single_tracker_response(response)

    assert "set" not in ready_event.transitions
    assert ready_event.transitions[0] == "clear"
    assert ready_event.transitions[-1] == "clear"
    assert ready_event.is_set() is False


def test_disconnected_zapi_keeps_processing_snapshot_but_never_becomes_ready():
    processed_snapshots: list[str] = []
    ready_event = run_single_tracker_response(
        FakeResponse(
            200,
            {
                "serverTime": "2026-07-17T12:00:00Z",
                "vehicles": [{"id": "sao-cristovao"}],
            },
        ),
        zapi_status={
            "connected": True,
            "smartphoneConnected": False,
        },
        processed_snapshots=processed_snapshots,
    )

    assert "set" not in ready_event.transitions
    assert ready_event.is_set() is False
    assert processed_snapshots == ["sao-cristovao"]


def test_zapi_status_is_revalidated_only_after_sixty_seconds():
    zapi = FakeClosable()

    connected, checked_at = tracker_main._refresh_zapi_connection(
        zapi,
        now_monotonic=100.0,
        last_checked_at=None,
        connected=False,
    )
    assert connected is True
    assert checked_at == 100.0
    assert zapi.status_calls == 1

    connected, checked_at = tracker_main._refresh_zapi_connection(
        zapi,
        now_monotonic=159.999,
        last_checked_at=checked_at,
        connected=connected,
    )
    assert connected is True
    assert checked_at == 100.0
    assert zapi.status_calls == 1

    zapi.instance_status = {
        "connected": False,
        "smartphoneConnected": False,
    }
    connected, checked_at = tracker_main._refresh_zapi_connection(
        zapi,
        now_monotonic=160.0,
        last_checked_at=checked_at,
        connected=connected,
    )
    assert connected is False
    assert checked_at == 160.0
    assert zapi.status_calls == 2


class AliveThread:
    name = "tracker-notifications"

    def is_alive(self) -> bool:
        return True


class HealthyRunner:
    running = True
    worker_name = "test-worker"


class QueryResult:
    def __init__(self, rows=None) -> None:
        self.rows = rows or []

    def fetchone(self):
        return (1,)

    def fetchall(self):
        return self.rows


class HealthyDatabase:
    def execute(self, statement):
        if "SELECT 1" in str(statement):
            return QueryResult()
        return QueryResult()


def test_main_readiness_rejects_alive_tracker_before_first_snapshot(monkeypatch):
    monkeypatch.setattr(main_app, "runner", HealthyRunner())
    monkeypatch.setattr(main_app, "worker_thread", AliveThread())
    monkeypatch.setattr(main_app, "tracker_thread", AliveThread())
    main_app.tracker_stop_event.clear()
    main_app.tracker_ready_event.clear()

    with pytest.raises(HTTPException) as exc_info:
        main_app.health_ready(HealthyDatabase())

    assert exc_info.value.status_code == 503
    tracker_status = exc_info.value.detail["components"]["whatsapp_tracker"]
    assert tracker_status == {
        "healthy": False,
        "alive": True,
        "stop_requested": False,
        "ready": False,
        "name": "tracker-notifications",
    }
    assert exc_info.value.detail["unhealthy_components"] == [
        "whatsapp_tracker"
    ]


def test_photo_queue_pending_includes_uploading_and_publishing():
    class QueueDatabase:
        def execute(self, statement):
            return QueryResult(
                rows=[
                    ("queued", 1),
                    ("uploading", 2),
                    ("publishing", 3),
                    ("done", 10),
                ]
            )

    metrics = main_app._photo_queue_metrics(QueueDatabase())

    assert metrics["pending"] == 6
