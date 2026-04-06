"""
Tests for SQLite append-only storage.
"""

import hashlib
import json
import pytest
import tempfile
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from witness.storage import (
    WitnessStore,
    EventExistsError,
    VerificationError,
    StorageError,
)
from witness.crypto import sign_event, public_key_to_base64


def make_key_from_seed(label: str) -> Ed25519PrivateKey:
    """Deterministic key from label."""
    seed = hashlib.sha256(label.encode("utf-8")).digest()
    return Ed25519PrivateKey.from_private_bytes(seed)


@pytest.fixture
def temp_db():
    """Create a temporary database file."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    yield db_path
    # Cleanup
    if db_path.exists():
        db_path.unlink()
    # Also cleanup WAL files
    for ext in ["-wal", "-shm"]:
        wal_path = db_path.with_suffix(db_path.suffix + ext)
        if wal_path.exists():
            wal_path.unlink()


@pytest.fixture
def store(temp_db):
    """Create an initialized store."""
    store = WitnessStore(temp_db)
    store.init()
    yield store
    store.close()


@pytest.fixture
def test_key():
    """A test signing key."""
    return make_key_from_seed("test-key")


@pytest.fixture
def signed_event(test_key):
    """Create a signed event for testing."""
    event = {
        "schema_version": "0.1",
        "event_id": "test-event-001",
        "occurred_at": "2026-01-30T12:00:00Z",
        "actor": {"type": "human", "id": "test-actor"},
        "intent": "Test event",
        "action": "test.action",
        "inputs": [],
        "outputs": [],
        "context": {"tool": "pytest"},
        "links": {"parent_event_ids": [], "related_event_ids": []},
        "signing": {
            "algorithm": "ed25519",
            "public_key": public_key_to_base64(test_key),
            "signature": "",
        },
    }
    return sign_event(event, test_key)


class TestWitnessStoreInit:
    """Tests for store initialization."""

    def test_init_creates_tables(self, temp_db):
        """init() creates the required tables."""
        store = WitnessStore(temp_db)
        store.init()

        # Check tables exist
        cursor = store.conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = {row[0] for row in cursor}
        assert "events" in tables
        assert "schema_info" in tables

        store.close()

    def test_init_is_idempotent(self, temp_db):
        """init() can be called multiple times safely."""
        store = WitnessStore(temp_db)
        store.init()
        store.init()  # Should not raise
        store.close()

    def test_is_initialized(self, temp_db):
        """is_initialized() returns correct state."""
        store = WitnessStore(temp_db)
        assert store.is_initialized() is False
        store.init()
        assert store.is_initialized() is True
        store.close()


class TestAppendOnly:
    """Tests for append-only guarantees."""

    def test_append_stores_event(self, store, signed_event):
        """append() stores the event."""
        event_id = store.append(signed_event)
        assert event_id == signed_event["event_id"]

        stored = store.get(event_id)
        assert stored is not None
        assert stored.event_id == event_id

    def test_append_duplicate_raises(self, store, signed_event):
        """append() raises EventExistsError for duplicates."""
        store.append(signed_event)
        with pytest.raises(EventExistsError):
            store.append(signed_event)

    def test_updates_blocked(self, store, signed_event):
        """Direct UPDATE is blocked by trigger."""
        store.append(signed_event)

        with pytest.raises(Exception, match="immutable"):
            store.conn.execute(
                "UPDATE events SET action = 'hacked' WHERE event_id = ?",
                (signed_event["event_id"],),
            )

    def test_deletes_blocked(self, store, signed_event):
        """Direct DELETE is blocked by trigger."""
        store.append(signed_event)

        with pytest.raises(Exception, match="immutable"):
            store.conn.execute(
                "DELETE FROM events WHERE event_id = ?",
                (signed_event["event_id"],),
            )

    def test_verification_on_append(self, store):
        """append() verifies events by default."""
        invalid_event = {
            "schema_version": "0.1",
            "event_id": "invalid",
            "signing": {"algorithm": "ed25519", "public_key": "bad", "signature": "bad"},
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        with pytest.raises(VerificationError):
            store.append(invalid_event)

    def test_skip_verification(self, store, signed_event):
        """append(verify=False) skips verification."""
        # Tamper with the event
        tampered = json.loads(json.dumps(signed_event))
        tampered["intent"] = "tampered"

        # Should succeed without verification
        store.append(tampered, verify=False)

        # Should be stored
        assert store.exists(tampered["event_id"])


class TestQueries:
    """Tests for query operations."""

    def test_get_returns_none_for_missing(self, store):
        """get() returns None for non-existent event."""
        assert store.get("nonexistent") is None

    def test_exists(self, store, signed_event):
        """exists() returns correct result."""
        assert store.exists(signed_event["event_id"]) is False
        store.append(signed_event)
        assert store.exists(signed_event["event_id"]) is True

    def test_count(self, store, test_key):
        """count() returns correct number."""
        assert store.count() == 0

        for i in range(3):
            event = {
                "schema_version": "0.1",
                "event_id": f"event-{i}",
                "occurred_at": f"2026-01-30T12:0{i}:00Z",
                "actor": {"type": "human", "id": "test"},
                "intent": f"Test {i}",
                "action": "test.action",
                "inputs": [],
                "outputs": [],
                "context": {},
                "links": {"parent_event_ids": [], "related_event_ids": []},
                "signing": {
                    "algorithm": "ed25519",
                    "public_key": public_key_to_base64(test_key),
                    "signature": "",
                },
            }
            store.append(sign_event(event, test_key))

        assert store.count() == 3

    def test_iter_events_order(self, store, test_key):
        """iter_events() returns events in order."""
        # Create events out of order
        timestamps = ["2026-01-30T12:02:00Z", "2026-01-30T12:01:00Z", "2026-01-30T12:03:00Z"]
        for i, ts in enumerate(timestamps):
            event = {
                "schema_version": "0.1",
                "event_id": f"event-{i}",
                "occurred_at": ts,
                "actor": {"type": "human", "id": "test"},
                "intent": f"Test {i}",
                "action": "test.action",
                "inputs": [],
                "outputs": [],
                "context": {},
                "links": {"parent_event_ids": [], "related_event_ids": []},
                "signing": {
                    "algorithm": "ed25519",
                    "public_key": public_key_to_base64(test_key),
                    "signature": "",
                },
            }
            store.append(sign_event(event, test_key))

        # Should be in ascending order by default
        events = list(store.iter_events())
        assert events[0].occurred_at == "2026-01-30T12:01:00Z"
        assert events[1].occurred_at == "2026-01-30T12:02:00Z"
        assert events[2].occurred_at == "2026-01-30T12:03:00Z"

        # Descending order
        events = list(store.iter_events(order="desc"))
        assert events[0].occurred_at == "2026-01-30T12:03:00Z"

    def test_iter_events_filter_action(self, store, test_key):
        """iter_events() can filter by action."""
        for i, action in enumerate(["a.one", "b.two", "a.one"]):
            event = {
                "schema_version": "0.1",
                "event_id": f"event-{i}",
                "occurred_at": f"2026-01-30T12:0{i}:00Z",
                "actor": {"type": "human", "id": "test"},
                "intent": "Test",
                "action": action,
                "inputs": [],
                "outputs": [],
                "context": {},
                "links": {"parent_event_ids": [], "related_event_ids": []},
                "signing": {
                    "algorithm": "ed25519",
                    "public_key": public_key_to_base64(test_key),
                    "signature": "",
                },
            }
            store.append(sign_event(event, test_key))

        events = list(store.iter_events(action="a.one"))
        assert len(events) == 2


class TestExport:
    """Tests for export functionality."""

    def test_export_jsonl(self, store, signed_event, temp_db):
        """export_jsonl() creates valid JSONL."""
        store.append(signed_event)

        output_path = temp_db.with_suffix(".jsonl")
        count = store.export_jsonl(output_path)

        assert count == 1
        assert output_path.exists()

        with open(output_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        assert len(lines) == 1
        exported = json.loads(lines[0])
        assert exported["event_id"] == signed_event["event_id"]

        # Cleanup
        output_path.unlink()


class TestVerifyAll:
    """Tests for bulk verification."""

    def test_verify_all(self, store, signed_event):
        """verify_all() checks all events."""
        store.append(signed_event)
        results = store.verify_all()
        assert len(results) == 1
        assert results[0].ok is True
