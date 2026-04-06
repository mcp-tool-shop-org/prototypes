"""
SQLite append-only storage for Witness events.

Design principles:
- Append-only: Events are never modified or deleted
- Local-first: No network required
- Verifiable: Each event stored with its cryptographic proof
- Portable: Single SQLite file
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, Iterator, List, Optional

from witness.canon import canonical_json
from witness.crypto import verify_event
from witness.models import VerifyResult, VerifyStatus


# Schema version for migrations
SCHEMA_VERSION = 1


CREATE_SCHEMA = """
-- Events table: append-only storage
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,
    occurred_at TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    signing_key_id TEXT NOT NULL,
    event_digest TEXT NOT NULL,
    event_json TEXT NOT NULL,
    CONSTRAINT no_update CHECK (1=1)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_actor_id ON events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_signing_key_id ON events(signing_key_id);

-- Key rotations view for timeline analysis
CREATE VIEW IF NOT EXISTS key_rotations AS
SELECT
    event_id,
    occurred_at,
    json_extract(event_json, '$.context.rotation.old_key_id') as old_key_id,
    json_extract(event_json, '$.context.rotation.new_key_id') as new_key_id,
    json_extract(event_json, '$.context.rotation.mode') as mode,
    json_extract(event_json, '$.context.rotation.reason') as reason,
    actor_type,
    signing_key_id
FROM events
WHERE action = 'witness.rotate_key';

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_info (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Trigger to prevent updates (append-only enforcement)
CREATE TRIGGER IF NOT EXISTS prevent_event_update
BEFORE UPDATE ON events
BEGIN
    SELECT RAISE(ABORT, 'Events are immutable: updates not allowed');
END;

-- Trigger to prevent deletes (append-only enforcement)
CREATE TRIGGER IF NOT EXISTS prevent_event_delete
BEFORE DELETE ON events
BEGIN
    SELECT RAISE(ABORT, 'Events are immutable: deletes not allowed');
END;
"""


class StorageError(Exception):
    """Base exception for storage operations."""
    pass


class EventExistsError(StorageError):
    """Raised when trying to append an event that already exists."""
    pass


class VerificationError(StorageError):
    """Raised when an event fails cryptographic verification."""
    pass


@dataclass
class StoredEvent:
    """An event as stored in the database."""
    id: int
    event_id: str
    occurred_at: str
    recorded_at: str
    action: str
    actor_type: str
    actor_id: str
    signing_key_id: str
    event_digest: str
    event_json: str

    @property
    def event(self) -> Dict[str, Any]:
        """Parse and return the event JSON."""
        return json.loads(self.event_json)


class WitnessStore:
    """
    Append-only SQLite storage for Witness events.

    Usage:
        store = WitnessStore("witness.db")
        store.init()
        store.append(event_dict)

        for event in store.iter_events():
            print(event.event_id)
    """

    def __init__(self, path: Path | str):
        """
        Initialize the store.

        Args:
            path: Path to the SQLite database file
        """
        self.path = Path(path)
        self._conn: Optional[sqlite3.Connection] = None

    @property
    def conn(self) -> sqlite3.Connection:
        """Get or create the database connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(
                str(self.path),
                isolation_level="IMMEDIATE",  # Prevent concurrent writes
            )
            self._conn.row_factory = sqlite3.Row
            # Enable foreign keys and WAL mode for better concurrency
            self._conn.execute("PRAGMA foreign_keys = ON")
            self._conn.execute("PRAGMA journal_mode = WAL")
        return self._conn

    def close(self) -> None:
        """Close the database connection."""
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    def __enter__(self) -> "WitnessStore":
        return self

    def __exit__(self, *args) -> None:
        self.close()

    def init(self) -> None:
        """
        Initialize the database schema.

        Safe to call multiple times (idempotent).
        """
        self.conn.executescript(CREATE_SCHEMA)
        self.conn.execute(
            "INSERT OR REPLACE INTO schema_info (key, value) VALUES (?, ?)",
            ("version", str(SCHEMA_VERSION)),
        )
        self.conn.commit()

    def is_initialized(self) -> bool:
        """Check if the database has been initialized."""
        try:
            cursor = self.conn.execute(
                "SELECT value FROM schema_info WHERE key = 'version'"
            )
            row = cursor.fetchone()
            return row is not None
        except sqlite3.OperationalError:
            return False

    def append(
        self,
        event: Dict[str, Any],
        *,
        verify: bool = True,
        recorded_at: Optional[str] = None,
    ) -> str:
        """
        Append an event to the store.

        Args:
            event: The event dictionary (must be signed)
            verify: Whether to verify the event before storing (default True)
            recorded_at: Override the recorded timestamp (for testing)

        Returns:
            The event_id of the stored event

        Raises:
            VerificationError: If verify=True and the event fails verification
            EventExistsError: If an event with this event_id already exists
        """
        if verify:
            result = verify_event(event)
            if not result.ok:
                raise VerificationError(f"Event verification failed: {result.error}")

        event_id = event["event_id"]
        occurred_at = event["occurred_at"]
        action = event["action"]
        actor = event.get("actor", {})
        actor_type = actor.get("type", "unknown")
        actor_id = actor.get("id", "unknown")
        signing = event.get("signing", {})
        signing_key_id = self._key_id_from_public_key(signing.get("public_key", ""))
        integrity = event.get("integrity", {})
        event_digest = integrity.get("event_digest", "")

        if recorded_at is None:
            recorded_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Use canonical JSON for storage to ensure reproducibility
        event_json = canonical_json(event)

        try:
            self.conn.execute(
                """
                INSERT INTO events (
                    event_id, occurred_at, recorded_at, action,
                    actor_type, actor_id, signing_key_id,
                    event_digest, event_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id, occurred_at, recorded_at, action,
                    actor_type, actor_id, signing_key_id,
                    event_digest, event_json,
                ),
            )
            self.conn.commit()
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                raise EventExistsError(f"Event already exists: {event_id}")
            raise StorageError(f"Failed to append event: {e}")

        return event_id

    def _key_id_from_public_key(self, public_key_b64: str) -> str:
        """
        Compute key_id from base64-encoded public key.

        Returns empty string if public key is invalid.
        """
        import base64
        import hashlib

        if not public_key_b64:
            return ""
        try:
            pub_bytes = base64.b64decode(public_key_b64)
            return hashlib.sha256(pub_bytes).hexdigest()
        except Exception:
            return ""

    def get(self, event_id: str) -> Optional[StoredEvent]:
        """
        Get a specific event by ID.

        Args:
            event_id: The event_id to look up

        Returns:
            StoredEvent if found, None otherwise
        """
        cursor = self.conn.execute(
            "SELECT * FROM events WHERE event_id = ?",
            (event_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        return self._row_to_stored_event(row)

    def exists(self, event_id: str) -> bool:
        """Check if an event exists."""
        cursor = self.conn.execute(
            "SELECT 1 FROM events WHERE event_id = ?",
            (event_id,),
        )
        return cursor.fetchone() is not None

    def count(self) -> int:
        """Return the total number of events."""
        cursor = self.conn.execute("SELECT COUNT(*) FROM events")
        return cursor.fetchone()[0]

    def iter_events(
        self,
        *,
        action: Optional[str] = None,
        actor_id: Optional[str] = None,
        signing_key_id: Optional[str] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        order: str = "asc",
    ) -> Iterator[StoredEvent]:
        """
        Iterate over events with optional filtering.

        Args:
            action: Filter by action (exact match)
            actor_id: Filter by actor.id (exact match)
            signing_key_id: Filter by signing key ID
            since: Filter events occurred_at >= this timestamp
            until: Filter events occurred_at <= this timestamp
            order: Sort order ("asc" or "desc" by occurred_at)

        Yields:
            StoredEvent objects
        """
        conditions = []
        params = []

        if action is not None:
            conditions.append("action = ?")
            params.append(action)

        if actor_id is not None:
            conditions.append("actor_id = ?")
            params.append(actor_id)

        if signing_key_id is not None:
            conditions.append("signing_key_id = ?")
            params.append(signing_key_id)

        if since is not None:
            conditions.append("occurred_at >= ?")
            params.append(since)

        if until is not None:
            conditions.append("occurred_at <= ?")
            params.append(until)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        order_clause = "ASC" if order.lower() == "asc" else "DESC"

        query = f"""
            SELECT * FROM events
            WHERE {where_clause}
            ORDER BY occurred_at {order_clause}, id {order_clause}
        """

        cursor = self.conn.execute(query, params)
        for row in cursor:
            yield self._row_to_stored_event(row)

    def iter_rotations(self) -> Iterator[Dict[str, Any]]:
        """
        Iterate over key rotation events.

        Yields:
            Dictionaries with rotation details
        """
        cursor = self.conn.execute("SELECT * FROM key_rotations ORDER BY occurred_at")
        for row in cursor:
            yield dict(row)

    def export_jsonl(self, output: Path | str) -> int:
        """
        Export all events to JSONL format.

        Args:
            output: Path to the output file

        Returns:
            Number of events exported
        """
        output_path = Path(output)
        count = 0

        with open(output_path, "w", encoding="utf-8") as f:
            for stored in self.iter_events():
                # Use canonical JSON for export
                f.write(canonical_json(stored.event) + "\n")
                count += 1

        return count

    def _row_to_stored_event(self, row: sqlite3.Row) -> StoredEvent:
        """Convert a database row to a StoredEvent."""
        return StoredEvent(
            id=row["id"],
            event_id=row["event_id"],
            occurred_at=row["occurred_at"],
            recorded_at=row["recorded_at"],
            action=row["action"],
            actor_type=row["actor_type"],
            actor_id=row["actor_id"],
            signing_key_id=row["signing_key_id"],
            event_digest=row["event_digest"],
            event_json=row["event_json"],
        )

    def verify_all(self) -> List[VerifyResult]:
        """
        Verify all events in the store.

        Returns:
            List of VerifyResult for each event
        """
        results = []
        for stored in self.iter_events():
            result = verify_event(stored.event)
            results.append(result)
        return results
