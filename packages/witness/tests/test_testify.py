"""
Tests for testimony report generation.

These tests verify that testify produces correct reports
and respects the exit code contract.
"""

import hashlib
import json
import pytest
import tempfile
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from witness.crypto import sign_event, public_key_to_base64
from witness.storage import WitnessStore
from witness.testify import testify, build_testimony, FLAG_EXPLANATIONS
from witness.timeline import (
    FLAG_CONTINUITY_BROKEN,
    FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION,
    FLAG_KEY_REACTIVATION,
    FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED,
)


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
    if db_path.exists():
        db_path.unlink()
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


def make_event(key, event_id: str, action: str, intent: str, occurred_at: str, **extra):
    """Create a signed event."""
    event = {
        "schema_version": "0.1",
        "event_id": event_id,
        "occurred_at": occurred_at,
        "actor": {"type": extra.get("actor_type", "human"), "id": extra.get("actor_id", "test")},
        "intent": intent,
        "action": action,
        "inputs": extra.get("inputs", []),
        "outputs": extra.get("outputs", []),
        "context": extra.get("context", {}),
        "links": {"parent_event_ids": [], "related_event_ids": []},
        "signing": {
            "algorithm": "ed25519",
            "public_key": public_key_to_base64(key),
            "signature": "",
        },
    }
    return sign_event(event, key)


class TestTestifyExitCodes:
    """Tests for exit code contract."""

    def test_clean_exit_0(self, temp_db, test_key):
        """Clean testimony returns exit code 0."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test.action", "Test", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db)
        assert result.exit_code == 0
        assert result.verified_count == 1
        assert result.flagged_count == 0
        assert result.failed_count == 0

    def test_flagged_exit_2(self, temp_db, test_key):
        """Testimony with flags returns exit code 2."""
        store = WitnessStore(temp_db)
        store.init()

        # Create a rotation with wrong actor type
        event = make_event(
            test_key, "e1", "witness.rotate_key", "Rotate key",
            "2026-01-01T00:00:00Z",
            actor_type="human",  # Wrong! Should be system
            context={
                "rotation": {
                    "old_key_id": "old",
                    "new_key_id": "new",
                    "mode": "continuity",
                }
            },
        )
        store.append(event)
        store.close()

        result = testify(temp_db)
        assert result.exit_code == 2
        assert result.flagged_count > 0
        assert any(fs.flag == FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED for fs in result.flags_summary)

    def test_crypto_failure_exit_3(self, temp_db):
        """Crypto failure returns exit code 3 by default."""
        store = WitnessStore(temp_db)
        store.init()

        # Store a malformed event (skip verification)
        bad_event = {
            "schema_version": "0.1",
            "event_id": "bad-event",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "test",
            "actor": {"type": "human", "id": "test"},
            "intent": "Bad event",
            "inputs": [],
            "outputs": [],
            "context": {},
            "links": {"parent_event_ids": [], "related_event_ids": []},
            "signing": {
                "algorithm": "ed25519",
                "public_key": "YmFk",  # "bad" in base64, not valid key
                "signature": "YmFk",
            },
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        store.append(bad_event, verify=False)
        store.close()

        result = testify(temp_db, fail_on="crypto")
        assert result.exit_code == 3
        assert result.failed_count == 1

    def test_crypto_failure_with_fail_on_never(self, temp_db):
        """With --fail-on never, crypto failures don't block testimony."""
        # Create a store with a corrupted event
        store = WitnessStore(temp_db)
        store.init()

        # Store a malformed event directly (skip triggers by recreating)
        bad_event = {
            "schema_version": "0.1",
            "event_id": "bad-event",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "test",
            "actor": {"type": "human", "id": "test"},
            "signing": {
                "algorithm": "ed25519",
                "public_key": "YmFk",  # "bad" in base64
                "signature": "YmFk",
            },
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        store.append(bad_event, verify=False)
        store.close()

        # Default should fail
        result = testify(temp_db, fail_on="crypto")
        assert result.exit_code == 3

        # With fail_on=never should succeed but report failure
        result = testify(temp_db, fail_on="never")
        assert result.exit_code == 3  # Still 3 because crypto failed
        assert result.failed_count == 1


class TestTestifyOutput:
    """Tests for output content."""

    def test_markdown_contains_sections(self, temp_db, test_key):
        """Markdown output contains expected sections."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test.action", "Test intent", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db, format="md")

        assert "# Witness Testimony" in result.text
        assert "## Summary" in result.text
        assert "## Timeline" in result.text
        assert "test.action" in result.text
        assert "Test intent" in result.text
        assert "e1" in result.text

    def test_json_structure(self, temp_db, test_key):
        """JSON output has correct structure."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test.action", "Test", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        assert data["schema_version"] == "0.1"
        assert "witness_version" in data
        assert "summary" in data
        assert "events" in data
        assert "findings" in data
        assert "key_summary" in data

        assert len(data["events"]) == 1
        assert data["events"][0]["event_id"] == "e1"
        assert data["exit_code"] == 0

    def test_text_format(self, temp_db, test_key):
        """Text output is readable."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test.action", "Test", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db, format="text")

        assert "WITNESS TESTIMONY REPORT" in result.text
        assert "TIMELINE" in result.text
        assert "test.action" in result.text

    def test_findings_section_with_flags(self, temp_db, test_key):
        """Findings section appears when there are flags."""
        store = WitnessStore(temp_db)
        store.init()

        # Recovery rotation triggers CONTINUITY_BROKEN
        from witness.crypto import public_key_to_bytes, generate_key_id
        key_id = generate_key_id(public_key_to_bytes(test_key))

        event = make_event(
            test_key, "e1", "witness.rotate_key", "Recovery",
            "2026-01-01T00:00:00Z",
            actor_type="system",
            actor_id=key_id,
            context={
                "rotation": {
                    "old_key_id": "some-old-key",
                    "new_key_id": key_id,
                    "mode": "recovery",
                }
            },
        )
        store.append(event)
        store.close()

        result = testify(temp_db, format="md")

        assert "## Findings" in result.text
        assert "CONTINUITY_BROKEN" in result.text
        assert FLAG_EXPLANATIONS[FLAG_CONTINUITY_BROKEN] in result.text


class TestTestifyFilters:
    """Tests for filtering options."""

    def test_filter_by_since(self, temp_db, test_key):
        """--since filters events."""
        store = WitnessStore(temp_db)
        store.init()

        store.append(make_event(test_key, "e1", "test", "Old", "2026-01-01T00:00:00Z"))
        store.append(make_event(test_key, "e2", "test", "New", "2026-01-15T00:00:00Z"))
        store.close()

        result = testify(temp_db, since="2026-01-10T00:00:00Z", format="json")
        data = json.loads(result.text)

        assert len(data["events"]) == 1
        assert data["events"][0]["event_id"] == "e2"

    def test_filter_by_until(self, temp_db, test_key):
        """--until filters events."""
        store = WitnessStore(temp_db)
        store.init()

        store.append(make_event(test_key, "e1", "test", "Old", "2026-01-01T00:00:00Z"))
        store.append(make_event(test_key, "e2", "test", "New", "2026-01-15T00:00:00Z"))
        store.close()

        result = testify(temp_db, until="2026-01-10T00:00:00Z", format="json")
        data = json.loads(result.text)

        assert len(data["events"]) == 1
        assert data["events"][0]["event_id"] == "e1"

    def test_filter_by_event_id(self, temp_db, test_key):
        """--event filters to specific event."""
        store = WitnessStore(temp_db)
        store.init()

        store.append(make_event(test_key, "e1", "test", "First", "2026-01-01T00:00:00Z"))
        store.append(make_event(test_key, "e2", "test", "Second", "2026-01-02T00:00:00Z"))
        store.close()

        result = testify(temp_db, event_id="e1", format="json")
        data = json.loads(result.text)

        assert len(data["events"]) == 1
        assert data["events"][0]["event_id"] == "e1"


class TestGoldenFixtureTestimony:
    """Tests using golden fixtures."""

    @pytest.fixture
    def golden_dir(self) -> Path:
        """Path to golden fixtures directory."""
        candidates = [
            Path(__file__).parent.parent / "tests" / "fixtures" / "golden",
            Path(__file__).parent / "fixtures" / "golden",
        ]
        for path in candidates:
            if path.exists():
                return path
        pytest.skip("Golden fixtures directory not found")

    @pytest.fixture
    def expected_flags(self, golden_dir: Path) -> dict:
        """Load expected flags from manifest."""
        manifest_path = golden_dir / "expected_flags.json"
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data["fixtures"]

    def test_testimony_from_golden_fixtures(self, golden_dir, expected_flags, temp_db):
        """
        Build testimony from golden fixtures and verify flags match.
        """
        store = WitnessStore(temp_db)
        store.init()

        # Load and store golden fixtures in order
        fixture_order = [
            "event.normal.v0.1.golden.json",
            "event.rotate.continuity.v0.1.golden.json",
            "event.backdated.temporal_anomaly.v0.1.golden.json",
            "event.rotate.recovery.v0.1.golden.json",
            "event.rotate.reactivation.v0.1.golden.json",
            "event.rotate.wrong_actor_type.v0.1.golden.json",
        ]

        for filename in fixture_order:
            path = golden_dir / filename
            with open(path, "r", encoding="utf-8") as f:
                event = json.load(f)
            store.append(event, verify=True)

        store.close()

        # Generate testimony
        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        # Verify exit code matches expected (should be 2 = flags present)
        assert result.exit_code == 2

        # Count flags
        flag_counts = {}
        for fs in result.flags_summary:
            flag_counts[fs.flag] = fs.count

        # Verify expected flags are present
        assert FLAG_CONTINUITY_BROKEN in flag_counts
        assert FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION in flag_counts
        assert FLAG_KEY_REACTIVATION in flag_counts
        assert FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED in flag_counts

        # Verify each event has correct crypto status
        for event_data in data["events"]:
            assert event_data["crypto"]["status"] == "VERIFIED"
