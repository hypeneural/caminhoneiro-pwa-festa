import logging
import threading
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.tracker_main import run_tracker_background
from app.workers.runner import WorkerRunner


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Festa do Caminhoneiro - Gallery Processing Automation",
    version="1.0.0",
)

# Essential background components managed by the API process.
runner = WorkerRunner()
tracker_stop_event = threading.Event()
tracker_ready_event = threading.Event()
worker_thread: threading.Thread | None = None
tracker_thread: threading.Thread | None = None
lifecycle_lock = threading.RLock()

WORKER_SHUTDOWN_TIMEOUT_SECONDS = 15
TRACKER_SHUTDOWN_TIMEOUT_SECONDS = 45


def _thread_is_alive(thread: threading.Thread | None) -> bool:
    return thread is not None and thread.is_alive()


def _thread_status(
    thread: threading.Thread | None,
    *,
    stop_requested: bool,
    ready: bool = True,
) -> dict[str, Any]:
    alive = _thread_is_alive(thread)
    return {
        "healthy": alive and not stop_requested and ready,
        "alive": alive,
        "stop_requested": stop_requested,
        "ready": ready,
        "name": thread.name if thread is not None else None,
    }


def _run_photo_worker() -> None:
    try:
        runner.run()
    except Exception:
        logger.exception("Photo ingestion worker stopped unexpectedly")


def _run_whatsapp_tracker() -> None:
    try:
        run_tracker_background(tracker_stop_event, tracker_ready_event)
    except Exception:
        logger.exception("WhatsApp tracker stopped unexpectedly")


def _photo_queue_metrics(db: Session) -> dict[str, Any]:
    """Return low-cardinality queue metrics without exposing job payloads."""
    try:
        rows = db.execute(
            text(
                """
                SELECT status, COUNT(*) AS job_count
                FROM foto_ingest_jobs
                GROUP BY status
                """
            )
        ).fetchall()
        by_status = {str(row[0]): int(row[1]) for row in rows}
        pending = sum(
            by_status.get(status, 0)
            for status in (
                "queued",
                "retry",
                "downloading",
                "processing",
                "uploading",
                "publishing",
            )
        )
        return {
            "available": True,
            "pending": pending,
            "by_status": by_status,
        }
    except Exception:
        # Metrics remain best-effort: an observability query should not make
        # an otherwise healthy service unavailable.
        logger.warning("Photo queue metrics are temporarily unavailable", exc_info=True)
        return {"available": False}


@app.on_event("startup")
def startup_event() -> None:
    global worker_thread, tracker_thread

    with lifecycle_lock:
        if not _thread_is_alive(worker_thread):
            # WorkerRunner.stop() flips this flag; explicitly restore it when
            # the same process starts a new application lifecycle.
            runner.running = True
            worker_thread = threading.Thread(
                target=_run_photo_worker,
                daemon=True,
                name="photo-ingest-worker",
            )
            worker_thread.start()
            logger.info("Photo ingestion worker started in background")
        else:
            logger.info("Photo ingestion worker is already running")

        if not _thread_is_alive(tracker_thread):
            tracker_stop_event.clear()
            tracker_ready_event.clear()
            tracker_thread = threading.Thread(
                target=_run_whatsapp_tracker,
                daemon=True,
                name="tracker-notifications",
            )
            tracker_thread.start()
            logger.info("WhatsApp tracker started in background")
        else:
            logger.info("WhatsApp tracker is already running")


@app.on_event("shutdown")
def shutdown_event() -> None:
    with lifecycle_lock:
        logger.info("Stopping photo ingestion worker")
        runner.stop()
        logger.info("Stopping WhatsApp tracker")
        tracker_stop_event.set()
        tracker_ready_event.clear()
        current_worker_thread = worker_thread
        current_tracker_thread = tracker_thread

    if _thread_is_alive(current_worker_thread):
        current_worker_thread.join(timeout=WORKER_SHUTDOWN_TIMEOUT_SECONDS)
        if current_worker_thread.is_alive():
            logger.warning(
                "Photo ingestion worker did not stop within %s seconds",
                WORKER_SHUTDOWN_TIMEOUT_SECONDS,
            )

    if _thread_is_alive(current_tracker_thread):
        current_tracker_thread.join(timeout=TRACKER_SHUTDOWN_TIMEOUT_SECONDS)
        if current_tracker_thread.is_alive():
            logger.warning(
                "WhatsApp tracker did not stop within %s seconds",
                TRACKER_SHUTDOWN_TIMEOUT_SECONDS,
            )


@app.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/health/ready")
def health_ready(db: Session = Depends(get_db)) -> dict[str, Any]:
    components = {
        "photo_worker": _thread_status(
            worker_thread,
            stop_requested=not runner.running,
        ),
        "whatsapp_tracker": _thread_status(
            tracker_thread,
            stop_requested=tracker_stop_event.is_set(),
            ready=tracker_ready_event.is_set(),
        ),
    }

    try:
        db.execute(text("SELECT 1")).fetchone()
    except Exception:
        logger.error("Database readiness probe failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "database": "unavailable",
                "components": components,
            },
        )

    unhealthy_components = [
        name for name, status in components.items() if not status["healthy"]
    ]
    if unhealthy_components:
        logger.error(
            "Essential background components are not healthy: %s",
            ", ".join(unhealthy_components),
        )
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "database": "connected",
                "components": components,
                "unhealthy_components": unhealthy_components,
            },
        )

    return {
        "status": "ready",
        "database": "connected",
        "worker_name": runner.worker_name,
        "components": components,
        "photo_queue": _photo_queue_metrics(db),
    }
