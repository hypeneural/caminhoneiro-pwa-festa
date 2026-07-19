from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi import HTTPException

import app.main as main


class FakeRunner:
    def __init__(self, *, running: bool = False) -> None:
        self.running = running
        self.worker_name = "test-worker"
        self.stop_calls = 0

    def run(self) -> None:
        return None

    def stop(self) -> None:
        self.stop_calls += 1
        self.running = False


class FakeThread:
    created: list["FakeThread"] = []

    def __init__(self, *, target, daemon: bool, name: str) -> None:
        self.target = target
        self.daemon = daemon
        self.name = name
        self.started = False
        self.alive = False
        self.join_timeouts: list[float] = []
        self.__class__.created.append(self)

    def start(self) -> None:
        self.started = True
        self.alive = True

    def is_alive(self) -> bool:
        return self.alive

    def join(self, timeout: float | None = None) -> None:
        self.join_timeouts.append(timeout)
        self.alive = False


@dataclass
class HealthThread:
    name: str
    alive: bool = True

    def is_alive(self) -> bool:
        return self.alive


class QueryResult:
    def __init__(self, *, one=None, rows=None) -> None:
        self.one = one
        self.rows = rows or []

    def fetchone(self):
        return self.one

    def fetchall(self):
        return self.rows


class HealthyDatabase:
    def execute(self, statement):
        sql = str(statement)
        if "SELECT 1" in sql:
            return QueryResult(one=(1,))
        if "FROM foto_ingest_jobs" in sql:
            return QueryResult(rows=[("queued", 3), ("retry", 2), ("done", 7)])
        raise AssertionError(f"Unexpected SQL: {sql}")


@pytest.fixture(autouse=True)
def restore_main_state(monkeypatch):
    monkeypatch.setattr(main, "worker_thread", None)
    monkeypatch.setattr(main, "tracker_thread", None)
    main.tracker_stop_event.clear()
    main.tracker_ready_event.set()
    yield
    main.tracker_stop_event.clear()
    main.tracker_ready_event.clear()


def test_startup_is_idempotent_and_shutdown_joins_both_threads(monkeypatch):
    runner = FakeRunner(running=False)
    FakeThread.created = []
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(main.threading, "Thread", FakeThread)

    main.startup_event()
    main.startup_event()

    assert runner.running is True
    assert [thread.name for thread in FakeThread.created] == [
        "photo-ingest-worker",
        "tracker-notifications",
    ]

    main.shutdown_event()

    assert runner.stop_calls == 1
    assert main.tracker_stop_event.is_set()
    assert main.worker_thread.join_timeouts == [
        main.WORKER_SHUTDOWN_TIMEOUT_SECONDS
    ]
    assert main.tracker_thread.join_timeouts == [
        main.TRACKER_SHUTDOWN_TIMEOUT_SECONDS
    ]


def test_startup_after_shutdown_restarts_both_components(monkeypatch):
    runner = FakeRunner(running=False)
    FakeThread.created = []
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(main.threading, "Thread", FakeThread)

    main.startup_event()
    main.shutdown_event()
    main.startup_event()

    assert runner.running is True
    assert not main.tracker_stop_event.is_set()
    assert [thread.name for thread in FakeThread.created] == [
        "photo-ingest-worker",
        "tracker-notifications",
        "photo-ingest-worker",
        "tracker-notifications",
    ]


def test_ready_reports_components_and_safe_queue_metrics(monkeypatch):
    runner = FakeRunner(running=True)
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(main, "worker_thread", HealthThread("photo-ingest-worker"))
    monkeypatch.setattr(main, "tracker_thread", HealthThread("tracker-notifications"))

    result = main.health_ready(HealthyDatabase())

    assert result["status"] == "ready"
    assert result["components"]["photo_worker"]["healthy"] is True
    assert result["components"]["whatsapp_tracker"]["healthy"] is True
    assert result["photo_queue"] == {
        "available": True,
        "pending": 5,
        "by_status": {"queued": 3, "retry": 2, "done": 7},
    }


def test_ready_returns_503_when_database_is_unavailable(monkeypatch):
    runner = FakeRunner(running=True)
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(main, "worker_thread", HealthThread("photo-ingest-worker"))
    monkeypatch.setattr(main, "tracker_thread", HealthThread("tracker-notifications"))

    class BrokenDatabase:
        def execute(self, statement):
            raise RuntimeError("password=must-not-leak")

    with pytest.raises(HTTPException) as exc_info:
        main.health_ready(BrokenDatabase())

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail["database"] == "unavailable"
    assert "must-not-leak" not in str(exc_info.value.detail)


@pytest.mark.parametrize(
    ("worker_alive", "tracker_alive", "expected_component"),
    [
        (False, True, "photo_worker"),
        (True, False, "whatsapp_tracker"),
    ],
)
def test_ready_returns_503_when_an_essential_thread_is_dead(
    monkeypatch,
    worker_alive,
    tracker_alive,
    expected_component,
):
    runner = FakeRunner(running=True)
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(
        main,
        "worker_thread",
        HealthThread("photo-ingest-worker", alive=worker_alive),
    )
    monkeypatch.setattr(
        main,
        "tracker_thread",
        HealthThread("tracker-notifications", alive=tracker_alive),
    )

    with pytest.raises(HTTPException) as exc_info:
        main.health_ready(HealthyDatabase())

    assert exc_info.value.status_code == 503
    assert expected_component in exc_info.value.detail["unhealthy_components"]


def test_queue_metrics_failure_does_not_hide_healthy_components(monkeypatch):
    runner = FakeRunner(running=True)
    monkeypatch.setattr(main, "runner", runner)
    monkeypatch.setattr(main, "worker_thread", HealthThread("photo-ingest-worker"))
    monkeypatch.setattr(main, "tracker_thread", HealthThread("tracker-notifications"))

    class MetricsUnavailableDatabase:
        def execute(self, statement):
            if "SELECT 1" in str(statement):
                return QueryResult(one=(1,))
            raise RuntimeError("metrics query failed")

    result = main.health_ready(MetricsUnavailableDatabase())

    assert result["status"] == "ready"
    assert result["photo_queue"] == {"available": False}
