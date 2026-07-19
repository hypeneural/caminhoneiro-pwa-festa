from __future__ import annotations

import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.tracker.tracker_db import (
    TrackerDB,
    _CREATE_NOTIFICATION_OUTBOX_SQL,
)


class TrackerDBLogicalContentTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.path = Path(self._tmp.name) / "tracker.db"
        self.db = TrackerDB(str(self.path))
        self.now = datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    @staticmethod
    def fallback_payload(
        dedupe_key: str,
        expires_at: datetime | None,
    ) -> dict:
        return {
            "phone": "5548999999999",
            "caption": "status completo",
            "fallback_dedupe_key": dedupe_key,
            "fallback_payload": {
                "phone": "5548999999999",
                "message": "Bateria \U0001f50b, localiza\u00e7\u00e3o",
            },
            "fallback_max_attempts": 4,
            "fallback_expires_at": (
                expires_at.isoformat() if expires_at is not None else None
            ),
        }

    def enqueue_panorama(
        self,
        name: str,
        *,
        created_at: datetime | None = None,
        available_at: datetime | None = None,
        fallback_expires_at: datetime | None = None,
    ) -> None:
        created = created_at or self.now
        fallback_expiry = fallback_expires_at or (
            self.now + timedelta(hours=1)
        )
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="panorama",
                dedupe_key=f"panorama:{name}",
                content_key=f"content:{name}",
                payload=self.fallback_payload(
                    f"text:{name}",
                    fallback_expiry,
                ),
                max_attempts=3,
                created_at=created,
                available_at=available_at,
                expires_at=self.now + timedelta(hours=2),
            )
        )

    def test_migrates_content_key_and_enforces_partial_unique_index(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "legacy.db"
            legacy_sql = _CREATE_NOTIFICATION_OUTBOX_SQL.replace(
                "    content_key         TEXT,\n",
                "",
            )
            conn = sqlite3.connect(path)
            try:
                conn.execute(legacy_sql)
                conn.commit()
            finally:
                conn.close()

            db = TrackerDB(str(path))
            conn = sqlite3.connect(path)
            try:
                columns = {
                    row[1]
                    for row in conn.execute(
                        "PRAGMA table_info(notification_outbox)"
                    ).fetchall()
                }
                index_sql = conn.execute(
                    """
                    SELECT sql
                    FROM sqlite_master
                    WHERE type = 'index'
                      AND name = 'idx_notification_outbox_content_key'
                    """
                ).fetchone()[0]
            finally:
                conn.close()

            self.assertIn("content_key", columns)
            self.assertIn("depends_on_id", columns)
            self.assertIn("wait_for_terminal_id", columns)
            self.assertIn("WHERE content_key IS NOT NULL", index_sql)
            common = {
                "vehicle_id": "v1",
                "payload": {"message": "ok"},
                "created_at": self.now,
            }
            self.assertTrue(
                db.enqueue_notification(
                    channel="panorama",
                    dedupe_key="p1",
                    content_key="logical:1",
                    **common,
                )
            )
            self.assertFalse(
                db.enqueue_notification(
                    channel="text",
                    dedupe_key="t1",
                    content_key="logical:1",
                    **common,
                )
            )
            self.assertTrue(
                db.enqueue_notification(
                    channel="text",
                    dedupe_key="t2",
                    **common,
                )
            )
            self.assertTrue(
                db.enqueue_notification(
                    channel="location",
                    dedupe_key="l1",
                    **common,
                )
            )

    def test_enqueue_get_and_count_by_logical_content(self) -> None:
        self.enqueue_panorama("lookup")
        job = self.db.get_notification_by_content_key("content:lookup")
        self.assertIsNotNone(job)
        self.assertEqual(job.content_key, "content:lookup")
        self.assertEqual(job.payload["caption"], "status completo")
        self.assertEqual(
            self.db.count_notifications(
                vehicle_id="vehicle-1",
                content_key="content:lookup",
            ),
            1,
        )
        self.assertEqual(
            self.db.count_notifications(
                vehicle_id="other",
                content_key="content:lookup",
            ),
            0,
        )
        self.assertIsNone(self.db.get_notification_by_content_key("  "))

    def test_renew_lease_requires_current_owner_and_caps_at_ttl(self) -> None:
        self.enqueue_panorama("renew")
        job = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker-a",
            lease_seconds=5,
            now=self.now,
        )
        self.assertIsNotNone(job)
        self.assertFalse(
            self.db.renew_notification_lease(
                job.id,
                lease_owner="worker-b",
                lease_seconds=30,
                now=self.now + timedelta(seconds=2),
            )
        )
        self.assertTrue(
            self.db.renew_notification_lease(
                job.id,
                lease_owner="worker-a",
                lease_seconds=30,
                now=self.now + timedelta(seconds=2),
            )
        )
        renewed = self.db.get_notification_by_content_key("content:renew")
        self.assertEqual(
            renewed.lease_until,
            self.now + timedelta(seconds=32),
        )
        self.assertFalse(
            self.db.renew_notification_lease(
                job.id,
                lease_owner="worker-a",
                lease_seconds=30,
                now=self.now + timedelta(seconds=33),
            )
        )

        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="panorama",
                dedupe_key="panorama:ttl-cap",
                content_key="content:ttl-cap",
                payload=self.fallback_payload(
                    "text:ttl-cap",
                    self.now + timedelta(seconds=8),
                ),
                created_at=self.now,
                expires_at=self.now + timedelta(seconds=8),
            )
        )
        capped = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker-cap",
            lease_seconds=5,
            now=self.now,
        )
        self.assertIsNotNone(capped)
        self.assertTrue(
            self.db.renew_notification_lease(
                capped.id,
                lease_owner="worker-cap",
                lease_seconds=30,
                now=self.now + timedelta(seconds=2),
            )
        )
        capped = self.db.get_notification_by_content_key("content:ttl-cap")
        self.assertEqual(capped.lease_until, self.now + timedelta(seconds=8))

    def test_promote_panorama_preserves_identity_and_fallback_payload(self) -> None:
        self.enqueue_panorama("promote")
        claimed = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker-a",
            lease_seconds=60,
            now=self.now,
        )
        self.assertIsNotNone(claimed)
        self.assertFalse(
            self.db.promote_panorama_to_text(
                claimed.id,
                lease_owner="worker-b",
                error="wrong owner",
                now=self.now,
            )
        )
        self.assertTrue(
            self.db.promote_panorama_to_text(
                claimed.id,
                lease_owner="worker-a",
                error="streetview_unavailable",
                now=self.now + timedelta(seconds=1),
            )
        )

        promoted = self.db.get_notification_by_content_key("content:promote")
        self.assertEqual(promoted.id, claimed.id)
        self.assertEqual(promoted.channel, "text")
        self.assertEqual(promoted.dedupe_key, "text:promote")
        self.assertEqual(promoted.status, "queued")
        self.assertEqual(promoted.attempts, 0)
        self.assertEqual(promoted.max_attempts, 4)
        self.assertIsNone(promoted.lease_owner)
        self.assertEqual(promoted.last_error, "streetview_unavailable")
        self.assertEqual(
            promoted.payload["message"],
            "Bateria \U0001f50b, localiza\u00e7\u00e3o",
        )
        text_job = self.db.claim_notification(
            channel="text",
            lease_owner="text-worker",
            now=self.now + timedelta(seconds=1),
        )
        self.assertIsNotNone(text_job)
        self.assertEqual(text_job.id, claimed.id)

    def test_invalid_or_expired_fallback_is_terminal(self) -> None:
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="panorama",
                dedupe_key="panorama:invalid",
                content_key="content:invalid",
                payload={"fallback_payload": "not-an-object"},
                created_at=self.now,
            )
        )
        invalid = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker",
            now=self.now,
        )
        self.assertFalse(
            self.db.promote_panorama_to_text(
                invalid.id,
                lease_owner="worker",
                error="capture_failed",
                now=self.now,
            )
        )
        invalid = self.db.get_notification_by_content_key("content:invalid")
        self.assertEqual(invalid.status, "dead")
        self.assertEqual(invalid.last_error, "panorama_fallback_invalid")

        self.enqueue_panorama(
            "expired-fallback",
            fallback_expires_at=self.now - timedelta(seconds=1),
        )
        expired = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker",
            now=self.now,
        )
        self.assertTrue(
            self.db.promote_panorama_to_text(
                expired.id,
                lease_owner="worker",
                error="capture_failed",
                now=self.now,
            )
        )
        expired = self.db.get_notification_by_content_key(
            "content:expired-fallback"
        )
        self.assertEqual(expired.channel, "text")
        self.assertEqual(expired.status, "expired")
        self.assertEqual(expired.last_error, "fallback_expired")

    def test_recovery_converts_only_abandoned_panorama_jobs(self) -> None:
        far_future = self.now + timedelta(hours=1)
        self.enqueue_panorama(
            "retry",
            created_at=self.now - timedelta(minutes=30),
        )
        retry = self.db.claim_notification(
            channel="panorama",
            lease_owner="retry-worker",
            lease_seconds=5,
            now=self.now - timedelta(minutes=29),
        )
        self.assertEqual(
            self.db.mark_notification_retry(
                retry.id,
                lease_owner="retry-worker",
                error="temporary",
                retry_at=far_future,
                now=self.now - timedelta(minutes=28),
            ),
            "retry",
        )

        self.enqueue_panorama(
            "active",
            created_at=self.now - timedelta(minutes=20),
        )
        active = self.db.claim_notification(
            channel="panorama",
            lease_owner="active-worker",
            lease_seconds=3600,
            now=self.now - timedelta(minutes=19),
        )
        self.assertIsNotNone(active)

        self.enqueue_panorama(
            "expired-lease",
            created_at=self.now - timedelta(minutes=10),
        )
        expired = self.db.claim_notification(
            channel="panorama",
            lease_owner="old-worker",
            lease_seconds=1,
            now=self.now - timedelta(minutes=9),
        )
        self.assertIsNotNone(expired)

        self.enqueue_panorama(
            "queued-old",
            created_at=self.now - timedelta(minutes=8),
            available_at=far_future,
        )
        self.enqueue_panorama(
            "queued-new",
            created_at=self.now,
            available_at=far_future,
        )

        recovered = self.db.recover_panorama_fallbacks(
            created_before=self.now - timedelta(minutes=5),
            now=self.now,
        )
        self.assertEqual(recovered, 3)
        for name in ("retry", "expired-lease", "queued-old"):
            job = self.db.get_notification_by_content_key(f"content:{name}")
            self.assertEqual(job.channel, "text")
            self.assertEqual(job.status, "queued")
            self.assertEqual(job.attempts, 0)

        active_after = self.db.get_notification_by_content_key("content:active")
        self.assertEqual(active_after.channel, "panorama")
        self.assertEqual(active_after.status, "inflight")
        self.assertEqual(active_after.lease_owner, "active-worker")
        new_after = self.db.get_notification_by_content_key(
            "content:queued-new"
        )
        self.assertEqual(new_after.channel, "panorama")
        self.assertEqual(new_after.status, "queued")

    def test_complete_panorama_updates_outbox_and_runtime_atomically(self) -> None:
        self.db.record_image_unavailable(
            vehicle_id="vehicle-1",
            unavailable_at=self.now - timedelta(minutes=1),
            latitude=-27.0,
            longitude=-48.0,
        )
        self.enqueue_panorama("complete")
        claimed = self.db.claim_notification(
            channel="panorama",
            lease_owner="image-worker",
            lease_seconds=60,
            now=self.now,
        )
        self.assertFalse(
            self.db.complete_panorama_notification(
                claimed.id,
                lease_owner="other-worker",
                provider_message_id="image-wrong",
                sent_at=self.now + timedelta(seconds=2),
                latitude=-27.2,
                longitude=-48.6,
                street="Rua A",
            )
        )
        self.assertTrue(
            self.db.complete_panorama_notification(
                claimed.id,
                lease_owner="image-worker",
                provider_message_id="image-123",
                sent_at=self.now + timedelta(seconds=2),
                latitude=-27.2,
                longitude=-48.6,
                street="Rua A",
            )
        )

        completed = self.db.get_notification_by_content_key("content:complete")
        self.assertEqual(completed.status, "sent")
        self.assertEqual(completed.provider_message_id, "image-123")
        self.assertIsNone(completed.lease_owner)
        state = self.db.load_state("vehicle-1")
        self.assertEqual(state.last_message_id, "image-123")
        self.assertEqual(
            state.last_image_sent_at,
            self.now + timedelta(seconds=2),
        )
        self.assertEqual(state.last_image_sent_lat, -27.2)
        self.assertEqual(state.last_image_sent_lng, -48.6)
        self.assertEqual(state.last_image_street, "Rua A")
        self.assertIsNone(state.last_image_unavailable_at)
        self.assertIsNone(state.last_image_unavailable_lat)
        self.assertIsNone(state.last_image_unavailable_lng)

    def test_complete_panorama_rolls_back_outbox_if_runtime_write_fails(self) -> None:
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-fail",
                channel="panorama",
                dedupe_key="panorama:rollback",
                content_key="content:rollback",
                payload=self.fallback_payload(
                    "text:rollback",
                    self.now + timedelta(hours=1),
                ),
                created_at=self.now,
            )
        )
        claimed = self.db.claim_notification(
            channel="panorama",
            lease_owner="worker",
            now=self.now,
        )
        conn = sqlite3.connect(self.path)
        try:
            conn.execute(
                """
                CREATE TRIGGER fail_runtime_insert
                BEFORE INSERT ON runtime_state
                WHEN NEW.vehicle_id = 'vehicle-fail'
                BEGIN
                    SELECT RAISE(ABORT, 'forced runtime failure');
                END
                """
            )
            conn.commit()
        finally:
            conn.close()

        with self.assertRaises(sqlite3.IntegrityError):
            self.db.complete_panorama_notification(
                claimed.id,
                lease_owner="worker",
                provider_message_id="should-rollback",
                sent_at=self.now,
                latitude=-27.2,
                longitude=-48.6,
                street="Rua A",
            )
        unchanged = self.db.get_notification_by_content_key(
            "content:rollback"
        )
        self.assertEqual(unchanged.status, "inflight")
        self.assertIsNone(unchanged.provider_message_id)
        self.assertEqual(unchanged.lease_owner, "worker")

    def test_completion_separators_are_idempotent_ordered_and_wait_location(self) -> None:
        location_key = "flow:ordered:location"
        content_key = "flow:ordered:content"
        expires_at = self.now + timedelta(hours=1)
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="location",
                dedupe_key=location_key,
                payload={
                    "phone": "5548999999999",
                    "latitude": -27.2,
                    "longitude": -48.6,
                    "title": "Localizacao",
                    "address": "Rua A",
                },
                max_attempts=3,
                created_at=self.now,
                expires_at=expires_at,
            )
        )
        content_kwargs = {
            "vehicle_id": "vehicle-1",
            "channel": "text",
            "dedupe_key": "flow:ordered:text",
            "content_key": content_key,
            "payload": {
                "phone": "5548999999999",
                "message": "Status completo",
            },
            "max_attempts": 3,
            "created_at": self.now,
            "expires_at": expires_at,
            "completion_separator_count": 3,
            "completion_separator_phone": "5548999999999",
            "completion_separator_expires_at": expires_at,
            "completion_wait_channel": "location",
            "completion_wait_dedupe_key": location_key,
        }
        self.assertTrue(self.db.enqueue_notification(**content_kwargs))
        self.assertFalse(self.db.enqueue_notification(**content_kwargs))
        self.assertEqual(self.db.count_notifications(), 5)

        parent = self.db.claim_notification(
            channel="text",
            lease_owner="text-worker",
            now=self.now,
        )
        self.assertEqual(parent.content_key, content_key)
        self.assertTrue(
            self.db.mark_notification_success(
                parent.id,
                lease_owner="text-worker",
                provider_message_id="content-sent",
                sent_at=self.now,
            )
        )
        self.assertIsNone(
            self.db.claim_notification(
                channel="text",
                lease_owner="text-worker",
                now=self.now + timedelta(seconds=1),
            )
        )

        location = self.db.claim_notification(
            channel="location",
            lease_owner="location-worker",
            now=self.now,
        )
        self.assertEqual(
            self.db.mark_notification_retry(
                location.id,
                lease_owner="location-worker",
                error="temporary",
                retry_at=self.now + timedelta(seconds=10),
                now=self.now,
            ),
            "retry",
        )
        self.assertIsNone(
            self.db.claim_notification(
                channel="text",
                lease_owner="text-worker",
                now=self.now + timedelta(seconds=2),
            )
        )
        location = self.db.claim_notification(
            channel="location",
            lease_owner="location-worker",
            now=self.now + timedelta(seconds=10),
        )
        self.assertTrue(
            self.db.mark_notification_success(
                location.id,
                lease_owner="location-worker",
                provider_message_id="location-sent",
                sent_at=self.now + timedelta(seconds=10),
            )
        )

        first = self.db.claim_notification(
            channel="text",
            lease_owner="text-worker",
            now=self.now + timedelta(seconds=11),
        )
        self.assertEqual(first.dedupe_key, f"{content_key}:separator:1")
        self.assertEqual(first.payload["message"], ".")
        self.assertEqual(
            self.db.mark_notification_retry(
                first.id,
                lease_owner="text-worker",
                error="temporary",
                retry_at=self.now + timedelta(seconds=20),
                now=self.now + timedelta(seconds=11),
            ),
            "retry",
        )
        self.assertIsNone(
            self.db.claim_notification(
                channel="text",
                lease_owner="text-worker",
                now=self.now + timedelta(seconds=12),
            )
        )

        for position in range(1, 4):
            separator = self.db.claim_notification(
                channel="text",
                lease_owner="text-worker",
                now=self.now + timedelta(seconds=20 + position),
            )
            self.assertEqual(
                separator.dedupe_key,
                f"{content_key}:separator:{position}",
            )
            self.assertEqual(separator.payload, {
                "message": ".",
                "phone": "5548999999999",
            })
            self.assertTrue(
                self.db.mark_notification_success(
                    separator.id,
                    lease_owner="text-worker",
                    provider_message_id=f"separator-{position}",
                    sent_at=self.now + timedelta(seconds=20 + position),
                )
            )

    def test_failed_content_cascades_to_all_blocked_separators(self) -> None:
        content_key = "flow:failed:content"
        self.assertTrue(
            self.db.enqueue_notification(
                vehicle_id="vehicle-1",
                channel="text",
                dedupe_key="flow:failed:text",
                content_key=content_key,
                payload={"phone": "1", "message": "status"},
                created_at=self.now,
                expires_at=self.now + timedelta(hours=1),
                completion_separator_count=3,
                completion_separator_phone="1",
                completion_separator_expires_at=(
                    self.now + timedelta(hours=1)
                ),
            )
        )
        parent = self.db.claim_notification(
            channel="text",
            lease_owner="worker",
            now=self.now,
        )
        self.assertTrue(
            self.db.mark_notification_dead(
                parent.id,
                lease_owner="worker",
                error="terminal",
                failed_at=self.now,
            )
        )
        self.assertIsNone(
            self.db.claim_notification(
                channel="text",
                lease_owner="worker",
                now=self.now + timedelta(seconds=1),
            )
        )
        for position in range(1, 4):
            separator = self.db.get_notification(
                channel="text",
                dedupe_key=f"{content_key}:separator:{position}",
            )
            self.assertEqual(separator.status, "dead")
            self.assertEqual(separator.last_error, "dependency_not_sent")
        self.assertEqual(
            self.db.count_notifications(
                statuses=("queued", "retry", "inflight"),
            ),
            0,
        )


if __name__ == "__main__":
    unittest.main()
