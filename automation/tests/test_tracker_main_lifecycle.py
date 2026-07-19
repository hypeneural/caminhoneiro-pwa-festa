from __future__ import annotations

import threading
import unittest
from unittest.mock import patch

import app.tracker_main as tracker_main


class _FakeZAPI:
    def __init__(self, events: list[str]) -> None:
        self.events = events
        self.close_calls = 0

    def close(self) -> None:
        self.close_calls += 1
        self.events.append("zapi:close")


class _FakeDB:
    def __init__(self, events: list[str]) -> None:
        self.events = events
        self.release_calls = 0
        self.recovery_calls: list[dict] = []

    def acquire_tracker_lease(self, **kwargs) -> bool:
        self.events.append("lease:acquire")
        return True

    def release_tracker_lease(self, **kwargs) -> bool:
        self.release_calls += 1
        self.events.append("lease:release")
        return True

    def recover_panorama_fallbacks(self, **kwargs) -> int:
        self.recovery_calls.append(kwargs)
        self.events.append("panorama:recover")
        return 1

    def recover_map_fallbacks(self, **kwargs) -> int:
        self.recovery_calls.append(kwargs)
        self.events.append("map:recover")
        return 1


class _ThreadedWorker:
    def __init__(self, name: str, events: list[str]) -> None:
        self.name = name
        self.events = events
        self.close_calls = 0
        self._stop = threading.Event()
        self.thread = threading.Thread(
            target=self._stop.wait,
            name=f"lifecycle-test-{name}",
        )
        self.thread.start()

    def close(self, timeout: float) -> None:
        self.close_calls += 1
        self._stop.set()
        self.thread.join(timeout)
        self.events.append(f"{self.name}:close")


class TrackerMainLifecycleTests(unittest.TestCase):
    def test_engine_creation_failure_closes_workers_then_releases_lease(self):
        events: list[str] = []
        zapi = _FakeZAPI(events)
        db = _FakeDB(events)
        workers = {
            name: _ThreadedWorker(name, events)
            for name in ("geocoder", "notifications", "panorama")
        }
        for worker in workers.values():
            self.addCleanup(worker._stop.set)
            self.addCleanup(worker.thread.join, 1)

        def create_worker(name: str):
            def factory(*args, **kwargs):
                events.append(f"{name}:start")
                return workers[name]

            return factory

        with (
            patch.object(tracker_main, "ZAPIClient", return_value=zapi),
            patch.object(tracker_main, "TrackerDB", return_value=db),
            patch.object(tracker_main, "ReverseGeocoder", return_value=object()),
            patch.object(
                tracker_main,
                "AsyncReverseGeocoder",
                side_effect=create_worker("geocoder"),
            ),
            patch.object(
                tracker_main,
                "AsyncZAPIDispatcher",
                side_effect=create_worker("notifications"),
            ),
            patch.object(tracker_main.settings, "TRACKER_PANORAMA_ENABLED", True),
            patch.object(tracker_main.settings, "TRACKER_MAP_ENABLED", False),
            patch.object(
                tracker_main,
                "_panorama_runtime",
                return_value=(True, "chrome"),
            ),
            patch.object(
                tracker_main,
                "_create_panorama_dispatcher",
                side_effect=create_worker("panorama"),
            ) as create_panorama_dispatcher,
            patch.object(
                tracker_main,
                "TrackerEngine",
                side_effect=RuntimeError("engine init failed"),
            ),
            patch.object(tracker_main.httpx, "Client") as http_client,
        ):
            with self.assertRaisesRegex(RuntimeError, "engine init failed"):
                tracker_main.run_tracker_background(threading.Event())

        http_client.assert_not_called()
        self.assertEqual(len(db.recovery_calls), 1)
        recovery_call = db.recovery_calls[0]
        self.assertEqual(
            recovery_call["created_before"],
            recovery_call["now"],
        )
        panorama_call = create_panorama_dispatcher.call_args.kwargs
        self.assertIs(panorama_call["zapi"], zapi)
        self.assertIs(panorama_call["db"], db)
        self.assertIs(
            panorama_call["notification_dispatcher"],
            workers["notifications"],
        )
        self.assertEqual(
            panorama_call["recovery_cutoff"],
            recovery_call["created_before"],
        )
        self.assertEqual(panorama_call["chrome_binary"], "chrome")
        self.assertEqual(db.release_calls, 1)
        self.assertEqual(zapi.close_calls, 1)
        for worker in workers.values():
            self.assertEqual(worker.close_calls, 1)
            self.assertFalse(worker.thread.is_alive())

        close_indexes = [
            events.index(f"{name}:close")
            for name in workers
        ]
        self.assertLess(max(close_indexes), events.index("lease:release"))
        self.assertLess(
            events.index("lease:acquire"),
            events.index("panorama:recover"),
        )
        recovery_index = events.index("panorama:recover")
        for worker_name in workers:
            self.assertLess(
                recovery_index,
                events.index(f"{worker_name}:start"),
            )
        self.assertLess(
            events.index("lease:release"),
            events.index("zapi:close"),
        )


if __name__ == "__main__":
    unittest.main()
