"""
Internal spike test: Stage composition produces bit-identical output.

THIS IS NOT A PUBLIC TEST.

This test exists solely to prove that naming internal stages
does not change testimony output bytes.

If this test fails, it means:
1. Hidden coupling exists between stages
2. Stage boundaries are not where we think they are
3. The spike revealed a problem (that's valuable!)

Do not add behavior tests here.
Do not test new features here.
Only test: "does current implementation match itself when decomposed?"
"""

import hashlib
import json
import tempfile
from pathlib import Path

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from witness.crypto import sign_event, public_key_to_base64
from witness.storage import WitnessStore
from witness.testify import (
    testify,
    build_testimony,
    render_json,
    render_markdown,
    render_text,
    emit_artifact,
)


def make_key_from_seed(label: str) -> Ed25519PrivateKey:
    """Deterministic key from label."""
    seed = hashlib.sha256(label.encode("utf-8")).digest()
    return Ed25519PrivateKey.from_private_bytes(seed)


def make_event(key, event_id: str, action: str, intent: str, occurred_at: str):
    """Create a signed event."""
    event = {
        "schema_version": "0.1",
        "event_id": event_id,
        "occurred_at": occurred_at,
        "actor": {"type": "human", "id": "test"},
        "intent": intent,
        "action": action,
        "inputs": [],
        "outputs": [],
        "context": {},
        "links": {"parent_event_ids": [], "related_event_ids": []},
        "signing": {
            "algorithm": "ed25519",
            "public_key": public_key_to_base64(key),
            "signature": "",
        },
    }
    return sign_event(event, key)


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
def populated_db(temp_db):
    """Create a store with multiple events for testing."""
    key = make_key_from_seed("spike-test-key")
    store = WitnessStore(temp_db)
    store.init()

    events = [
        ("e1", "test.action1", "First intent", "2026-01-01T00:00:00Z"),
        ("e2", "test.action2", "Second intent", "2026-01-02T00:00:00Z"),
        ("e3", "test.action3", "Third intent", "2026-01-03T00:00:00Z"),
    ]

    for event_id, action, intent, occurred_at in events:
        event = make_event(key, event_id, action, intent, occurred_at)
        store.append(event)

    store.close()
    return temp_db


class TestBitIdentity:
    """
    Prove that calling stages explicitly produces identical output
    to calling testify() directly.

    These tests are the core invariant of the spike.
    """

    FIXED_TIMESTAMP = "2026-06-15T12:00:00Z"

    def test_json_bit_identity(self, populated_db):
        """
        Decomposed stages produce bit-identical JSON to testify().

        This is the critical test. If it fails, stages are not composable.
        """
        # Method 1: Direct testify() call
        direct_result = testify(
            populated_db,
            format="json",
            generated_at=self.FIXED_TIMESTAMP,
        )

        # Method 2: Explicit stage calls (what testify does internally)
        store = WitnessStore(populated_db)
        try:
            reports, keys, flags_summary, exit_code = build_testimony(
                store,
                include_events=False,
                include_artifacts=True,
            )
        finally:
            store.close()

        explicit_json = render_json(
            reports, keys, flags_summary, exit_code,
            db_path=str(populated_db),
            filters={},
            include_events=False,
            generated_at=self.FIXED_TIMESTAMP,
        )

        # Bit identity check
        assert direct_result.text == explicit_json

    def test_markdown_bit_identity(self, populated_db):
        """Decomposed stages produce bit-identical Markdown to testify()."""
        direct_result = testify(
            populated_db,
            format="md",
            generated_at=self.FIXED_TIMESTAMP,
        )

        store = WitnessStore(populated_db)
        try:
            reports, keys, flags_summary, exit_code = build_testimony(
                store,
                include_events=False,
                include_artifacts=True,
            )
        finally:
            store.close()

        explicit_md = render_markdown(
            reports, keys, flags_summary,
            db_path=str(populated_db),
            filters={},
            include_events=False,
            generated_at=self.FIXED_TIMESTAMP,
        )

        assert direct_result.text == explicit_md

    def test_text_bit_identity(self, populated_db):
        """Decomposed stages produce bit-identical text to testify()."""
        direct_result = testify(
            populated_db,
            format="text",
            generated_at=self.FIXED_TIMESTAMP,
        )

        store = WitnessStore(populated_db)
        try:
            reports, keys, flags_summary, exit_code = build_testimony(
                store,
                include_events=False,
                include_artifacts=True,
            )
        finally:
            store.close()

        explicit_text = render_text(
            reports, keys, flags_summary,
            db_path=str(populated_db),
            filters={},
            generated_at=self.FIXED_TIMESTAMP,
        )

        assert direct_result.text == explicit_text

    def test_json_with_include_events_bit_identity(self, populated_db):
        """
        Bit identity holds with --include-events.

        This is critical because raw_event.bytes_base64 must be exact.
        """
        direct_result = testify(
            populated_db,
            format="json",
            include_events=True,
            generated_at=self.FIXED_TIMESTAMP,
        )

        store = WitnessStore(populated_db)
        try:
            reports, keys, flags_summary, exit_code = build_testimony(
                store,
                include_events=True,
                include_artifacts=True,
            )
        finally:
            store.close()

        explicit_json = render_json(
            reports, keys, flags_summary, exit_code,
            db_path=str(populated_db),
            filters={},
            include_events=True,
            generated_at=self.FIXED_TIMESTAMP,
        )

        assert direct_result.text == explicit_json

    def test_emit_artifact_bit_identity(self, populated_db):
        """
        emit_artifact produces same bytes as testify() with --emit-artifact.
        """
        with tempfile.TemporaryDirectory() as dir1, \
             tempfile.TemporaryDirectory() as dir2:

            # Method 1: testify with emit_artifact_dir
            testify(
                populated_db,
                format="json",
                generated_at=self.FIXED_TIMESTAMP,
                emit_artifact_dir=Path(dir1),
            )

            # Method 2: Explicit stage calls
            store = WitnessStore(populated_db)
            try:
                reports, keys, flags_summary, exit_code = build_testimony(
                    store,
                    include_events=False,
                    include_artifacts=True,
                )
            finally:
                store.close()

            emit_artifact(
                Path(dir2),
                reports, keys, flags_summary, exit_code,
                db_path=str(populated_db),
                filters={},
                include_events=False,
                generated_at=self.FIXED_TIMESTAMP,
            )

            # Compare all files
            for filename in ["testimony.json", "testimony.md", "testimony.manifest.json"]:
                path1 = Path(dir1) / filename
                path2 = Path(dir2) / filename

                assert path1.exists(), f"{filename} missing from testify() output"
                assert path2.exists(), f"{filename} missing from explicit output"

                bytes1 = path1.read_bytes()
                bytes2 = path2.read_bytes()

                assert bytes1 == bytes2, f"{filename} bytes differ"


class TestStageOrder:
    """
    Verify stage order is fixed and cannot be reordered without breaking output.
    """

    def test_stage_order_is_linear(self):
        """Stages must execute in fixed order."""
        from witness._internal_stages import _Stage, _STAGE_ORDER

        expected = (_Stage.LOAD, _Stage.ANALYZE, _Stage.BUILD, _Stage.RENDER, _Stage.EMIT)
        assert _STAGE_ORDER == expected

    def test_stage_descriptions_exist(self):
        """Every stage has a description."""
        from witness._internal_stages import _Stage, _debug_describe_stage

        for stage in _Stage:
            desc = _debug_describe_stage(stage)
            assert desc, f"Stage {stage} has no description"
            assert len(desc) > 10, f"Stage {stage} description too short"


class TestNoNewSurfaceArea:
    """
    Verify the spike didn't accidentally expand public API.
    """

    def test_internal_stages_not_exported(self):
        """_internal_stages module is not in public exports."""
        import witness

        # Check __all__ if it exists
        if hasattr(witness, "__all__"):
            assert "_internal_stages" not in witness.__all__
            assert "_Stage" not in witness.__all__

        # Check that importing directly still works (it's internal, not blocked)
        from witness._internal_stages import _Stage
        assert _Stage is not None

    def test_public_api_unchanged(self):
        """
        Public API surface hasn't changed.

        This is a simple snapshot - if you need to add exports,
        update this list explicitly.
        """
        import witness

        # Expected public exports (from __init__.py)
        # This snapshot was taken from the actual __all__ at Phase 2A completion
        expected_public = {
            "__version__",
            # Canonical JSON
            "canonical_json",
            "canonical_bytes",
            # Crypto
            "compute_event_digest",
            "sign_event",
            "verify_event",
            "normalize_for_signing",
            # Models
            "WitnessEvent",
            "VerifyResult",
            "VerifyStatus",
            # Storage
            "WitnessStore",
            # Timeline
            "analyze_event",
            "analyze_timeline",
            "analyze_single_event",
            "TimelineState",
            "TimelineAnalysis",
            # Testify
            "testify",
            "TestimonyResult",
        }

        if hasattr(witness, "__all__"):
            actual = set(witness.__all__)
            assert actual == expected_public, f"Public API changed: {actual ^ expected_public}"
