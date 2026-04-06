"""
Tests for timeline analysis.

CRITICAL: These tests verify that our timeline analyzer produces
exactly the flags defined in expected_flags.json.
"""

import json
import pytest
from pathlib import Path

from witness.timeline import (
    analyze_event,
    analyze_timeline,
    analyze_single_event,
    TimelineState,
    FLAG_CONTINUITY_BROKEN,
    FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION,
    FLAG_KEY_REACTIVATION,
    FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED,
)
from witness.models import VerifyStatus


@pytest.fixture
def golden_dir() -> Path:
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
def expected_flags(golden_dir: Path) -> dict:
    """Load expected flags from manifest."""
    manifest_path = golden_dir / "expected_flags.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["fixtures"]


@pytest.fixture
def golden_events(golden_dir: Path) -> dict:
    """Load all golden event fixtures."""
    events = {}
    for path in golden_dir.glob("event.*.golden.json"):
        with open(path, "r", encoding="utf-8") as f:
            events[path.name] = json.load(f)
    return events


class TestGoldenFixtureFlags:
    """
    Tests that verify our timeline analyzer produces exactly
    the flags defined in expected_flags.json.

    These are the contract tests. They must all pass.
    """

    def test_event_normal_no_flags(self, golden_dir, expected_flags):
        """event.normal.v0.1.golden.json: VERIFIED, no flags."""
        filename = "event.normal.v0.1.golden.json"
        expected = expected_flags[filename]

        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        analysis = analyze_single_event(event)

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"

    def test_event_rotate_continuity_no_flags(self, golden_dir, expected_flags):
        """event.rotate.continuity.v0.1.golden.json: VERIFIED, no flags."""
        filename = "event.rotate.continuity.v0.1.golden.json"
        expected = expected_flags[filename]

        # Need prior event to build state
        with open(golden_dir / "event.normal.v0.1.golden.json", "r") as f:
            prior = json.load(f)
        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        analysis = analyze_single_event(event, prior_events=[prior])

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"

    def test_event_backdated_temporal_anomaly(self, golden_dir, expected_flags):
        """event.backdated.temporal_anomaly.v0.1.golden.json: TEMPORAL_ANOMALY_AFTER_ROTATION."""
        filename = "event.backdated.temporal_anomaly.v0.1.golden.json"
        expected = expected_flags[filename]

        # Need rotation event first to build state
        with open(golden_dir / "event.normal.v0.1.golden.json", "r") as f:
            e1 = json.load(f)
        with open(golden_dir / "event.rotate.continuity.v0.1.golden.json", "r") as f:
            e2 = json.load(f)
        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        analysis = analyze_single_event(event, prior_events=[e1, e2])

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"

    def test_event_rotate_recovery_continuity_broken(self, golden_dir, expected_flags):
        """event.rotate.recovery.v0.1.golden.json: CONTINUITY_BROKEN."""
        filename = "event.rotate.recovery.v0.1.golden.json"
        expected = expected_flags[filename]

        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        # Recovery rotation analyzed in isolation
        analysis = analyze_single_event(event)

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"

    def test_event_rotate_reactivation(self, golden_dir, expected_flags):
        """event.rotate.reactivation.v0.1.golden.json: KEY_REACTIVATION."""
        filename = "event.rotate.reactivation.v0.1.golden.json"
        expected = expected_flags[filename]

        # Need prior rotations to build key history
        with open(golden_dir / "event.normal.v0.1.golden.json", "r") as f:
            e1 = json.load(f)
        with open(golden_dir / "event.rotate.continuity.v0.1.golden.json", "r") as f:
            e2 = json.load(f)
        with open(golden_dir / "event.rotate.recovery.v0.1.golden.json", "r") as f:
            e4 = json.load(f)
        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        # Build timeline state from prior events
        analysis = analyze_single_event(event, prior_events=[e1, e2, e4])

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"

    def test_event_rotate_wrong_actor_type(self, golden_dir, expected_flags):
        """event.rotate.wrong_actor_type.v0.1.golden.json: ROTATION_ACTOR_TYPE_UNEXPECTED."""
        filename = "event.rotate.wrong_actor_type.v0.1.golden.json"
        expected = expected_flags[filename]

        with open(golden_dir / filename, "r", encoding="utf-8") as f:
            event = json.load(f)

        analysis = analyze_single_event(event)

        assert analysis.status.value == expected["status"], f"Status mismatch for {filename}"
        assert sorted(analysis.flags) == sorted(expected["flags"]), f"Flags mismatch for {filename}"
        assert analysis.exit_code == expected["exit_code"], f"Exit code mismatch for {filename}"


class TestTimelineAnalyzer:
    """Unit tests for timeline analysis logic."""

    def test_rotation_recovery_mode_sets_continuity_broken(self):
        """Recovery mode rotation must flag CONTINUITY_BROKEN."""
        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "system", "id": "key123"},
            "context": {
                "rotation": {
                    "old_key_id": "old",
                    "new_key_id": "new",
                    "mode": "recovery",
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        state = TimelineState()
        analysis = analyze_event(event, state, verify_crypto=False)

        assert FLAG_CONTINUITY_BROKEN in analysis.flags

    def test_rotation_continuity_mode_no_flag_when_signed_by_old(self):
        """Continuity rotation signed by old key should not flag."""
        # Create a fake event where signing_key matches old_key_id
        # (In practice, we'd need real keys, but for unit testing we mock)
        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "system", "id": "key123"},
            "context": {
                "rotation": {
                    "old_key_id": "",  # Will match empty signing_key_id
                    "new_key_id": "new",
                    "mode": "continuity",
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        state = TimelineState()
        analysis = analyze_event(event, state, verify_crypto=False)

        # Should not have CONTINUITY_BROKEN (empty key matches empty key)
        assert FLAG_CONTINUITY_BROKEN not in analysis.flags

    def test_rotation_non_system_actor_flags(self):
        """Rotation with non-system actor must flag."""
        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "human", "id": "key123"},  # Wrong type
            "context": {
                "rotation": {
                    "old_key_id": "",
                    "new_key_id": "new",
                    "mode": "continuity",
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        state = TimelineState()
        analysis = analyze_event(event, state, verify_crypto=False)

        assert FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED in analysis.flags

    def test_key_reactivation_detected(self):
        """Reactivating a previously-retired key must flag."""
        state = TimelineState()
        # Simulate that "oldkey" was previously retired
        state.retired_keys["oldkey"] = "2026-01-01T00:00:00Z"

        # Now try to reactivate it
        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-02T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "system", "id": "key123"},
            "context": {
                "rotation": {
                    "old_key_id": "currentkey",
                    "new_key_id": "oldkey",  # Reactivating!
                    "mode": "continuity",
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        analysis = analyze_event(event, state, verify_crypto=False)

        assert FLAG_KEY_REACTIVATION in analysis.flags

    def test_temporal_anomaly_after_rotation(self):
        """Event with occurred_at after key rotation must flag."""
        state = TimelineState()
        # Simulate that key was retired at time T1
        state.retired_keys["retired_key_id"] = "2026-01-01T00:00:00Z"

        # Event signed by retired key with occurred_at after retirement
        import base64
        import hashlib

        # Create a public key that hashes to "retired_key_id"
        # (In practice this is hard, so we'll create a real one and use its hash)
        fake_pub = b"x" * 32
        fake_key_id = hashlib.sha256(fake_pub).hexdigest()

        # Update state with the correct key ID
        state.retired_keys = {fake_key_id: "2026-01-01T00:00:00Z"}

        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-02T00:00:00Z",  # After retirement
            "action": "some.action",
            "actor": {"type": "human", "id": "test"},
            "signing": {
                "algorithm": "ed25519",
                "public_key": base64.b64encode(fake_pub).decode(),
                "signature": "",
            },
        }

        analysis = analyze_event(event, state, verify_crypto=False)

        assert FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION in analysis.flags

    def test_normal_event_no_flags(self):
        """Normal event with no anomalies should have no flags."""
        event = {
            "schema_version": "0.1",
            "event_id": "test",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "some.action",
            "actor": {"type": "human", "id": "test"},
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        state = TimelineState()
        analysis = analyze_event(event, state, verify_crypto=False)

        assert analysis.flags == []
        assert analysis.status == VerifyStatus.VERIFIED


class TestAnalyzeTimeline:
    """Tests for analyzing sequences of events."""

    def test_empty_timeline(self):
        """Empty timeline returns empty results."""
        results = analyze_timeline([], verify_crypto=False)
        assert results == []

    def test_timeline_accumulates_state(self):
        """State accumulates across events in timeline."""
        # First event: recovery rotation that retires "old_key"
        # Using recovery mode to avoid needing proper signing keys
        e1 = {
            "schema_version": "0.1",
            "event_id": "e1",
            "occurred_at": "2026-01-01T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "system", "id": "test"},
            "context": {
                "rotation": {
                    "old_key_id": "old_key",
                    "new_key_id": "new_key",
                    "mode": "recovery",  # Recovery mode for simplicity
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        # Second event: tries to reactivate old_key
        e2 = {
            "schema_version": "0.1",
            "event_id": "e2",
            "occurred_at": "2026-01-02T00:00:00Z",
            "action": "witness.rotate_key",
            "actor": {"type": "system", "id": "test"},
            "context": {
                "rotation": {
                    "old_key_id": "new_key",
                    "new_key_id": "old_key",  # Reactivating
                    "mode": "recovery",  # Recovery mode
                }
            },
            "signing": {"algorithm": "ed25519", "public_key": "", "signature": ""},
        }

        results = analyze_timeline([e1, e2], verify_crypto=False)

        assert len(results) == 2
        # First rotation has CONTINUITY_BROKEN (recovery mode)
        assert FLAG_CONTINUITY_BROKEN in results[0].flags
        # Second has both CONTINUITY_BROKEN and KEY_REACTIVATION
        assert FLAG_CONTINUITY_BROKEN in results[1].flags
        assert FLAG_KEY_REACTIVATION in results[1].flags
