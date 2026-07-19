from __future__ import annotations

import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.tracker.tracker_db import TrackerDB


class TrackerLeaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.db = TrackerDB(
            str(Path(self.directory.name) / "tracker.db")
        )
        self.now = datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)

    def tearDown(self) -> None:
        self.directory.cleanup()

    def test_only_owner_renews_until_lease_expires(self) -> None:
        self.assertTrue(
            self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-1",
                lease_seconds=60,
                now=self.now,
            )
        )
        self.assertFalse(
            self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-2",
                lease_seconds=60,
                now=self.now + timedelta(seconds=30),
            )
        )
        self.assertTrue(
            self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-1",
                lease_seconds=60,
                now=self.now + timedelta(seconds=30),
            )
        )
        self.assertFalse(
            self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-2",
                lease_seconds=60,
                now=self.now + timedelta(seconds=89),
            )
        )
        self.assertTrue(
            self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-2",
                lease_seconds=60,
                now=self.now + timedelta(seconds=91),
            )
        )
        self.assertFalse(
            self.db.release_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-1",
            )
        )
        self.assertTrue(
            self.db.release_tracker_lease(
                lease_name="tracker",
                lease_owner="owner-2",
            )
        )

    def test_concurrent_acquire_has_single_winner(self) -> None:
        def acquire(index: int) -> bool:
            return self.db.acquire_tracker_lease(
                lease_name="tracker",
                lease_owner=f"owner-{index}",
                lease_seconds=60,
                now=self.now,
            )

        with ThreadPoolExecutor(max_workers=20) as pool:
            results = list(pool.map(acquire, range(20)))

        self.assertEqual(sum(results), 1)


if __name__ == "__main__":
    unittest.main()
