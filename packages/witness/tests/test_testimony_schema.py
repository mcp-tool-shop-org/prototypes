"""
Tests for Phase 2A: Testimony as a First-Class Artifact.

These tests verify:
1. JSON schema validation
2. Deterministic output with --generated-at
3. Flag agreement with expected_flags.json
4. Manifest integrity after --emit-artifact
"""

import hashlib
import json
import pytest
import tempfile
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from witness.crypto import sign_event, public_key_to_base64
from witness.storage import WitnessStore
from witness.testify import testify, emit_artifact, build_testimony


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


class TestJSONSchemaValidation:
    """Tests for JSON output schema compliance."""

    def test_json_has_required_fields(self, temp_db, test_key):
        """JSON output contains all required schema fields."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test.action", "Test", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db, format="json", generated_at="2026-01-01T12:00:00Z")
        data = json.loads(result.text)

        # Required top-level fields
        assert data["schema_version"] == "0.1"
        assert "witness_version" in data
        assert data["generated_at"] == "2026-01-01T12:00:00Z"
        assert "source" in data
        assert "summary" in data
        assert "key_summary" in data
        assert "events" in data
        assert "findings" in data
        assert "exit_code" in data

    def test_json_source_structure(self, temp_db, test_key):
        """JSON source section has correct structure."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        source = data["source"]
        assert source["store"] == "sqlite"
        assert "store_locator" in source
        assert "range" in source

        range_data = source["range"]
        assert "since" in range_data
        assert "until" in range_data
        assert "actor" in range_data
        assert "event_ids" in range_data
        assert isinstance(range_data["event_ids"], list)

    def test_json_summary_structure(self, temp_db, test_key):
        """JSON summary section has correct structure."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        summary = data["summary"]
        assert summary["events_total"] == 1
        assert summary["crypto_verified"] == 1
        assert summary["crypto_failed"] == 0
        assert "with_flags" in summary
        assert "flags_total" in summary

    def test_json_key_summary_structure(self, temp_db, test_key):
        """JSON key_summary has correct structure."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        assert len(data["key_summary"]) == 1
        key_info = data["key_summary"][0]

        assert "key_id" in key_info
        assert "first_seen" in key_info
        assert "last_seen" in key_info
        assert "rotations_out" in key_info
        assert "rotations_in" in key_info
        assert "continuity_broken" in key_info
        assert "reactivated" in key_info

    def test_json_events_structure(self, temp_db, test_key):
        """JSON events have correct structure."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        assert len(data["events"]) == 1
        event = data["events"][0]

        assert event["event_id"] == "e1"
        assert "occurred_at" in event
        assert "actor" in event
        assert event["actor"]["type"] == "human"
        assert "action" in event
        assert "intent" in event
        assert "crypto" in event
        assert event["crypto"]["status"] == "VERIFIED"
        assert event["crypto"]["signature_ok"] is True
        assert "event_digest" in event["crypto"]
        assert "flags" in event


class TestDeterministicOutput:
    """Tests for deterministic testimony generation."""

    def test_json_deterministic_with_fixed_timestamp(self, temp_db, test_key):
        """Same inputs + timestamp produces identical JSON."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        fixed_time = "2026-06-15T12:00:00Z"

        result1 = testify(temp_db, format="json", generated_at=fixed_time)
        result2 = testify(temp_db, format="json", generated_at=fixed_time)

        assert result1.text == result2.text

    def test_markdown_deterministic_with_fixed_timestamp(self, temp_db, test_key):
        """Same inputs + timestamp produces identical Markdown."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        fixed_time = "2026-06-15T12:00:00Z"

        result1 = testify(temp_db, format="md", generated_at=fixed_time)
        result2 = testify(temp_db, format="md", generated_at=fixed_time)

        assert result1.text == result2.text

    def test_json_differs_with_different_timestamp(self, temp_db, test_key):
        """Different timestamps produce different JSON."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result1 = testify(temp_db, format="json", generated_at="2026-01-01T00:00:00Z")
        result2 = testify(temp_db, format="json", generated_at="2026-01-02T00:00:00Z")

        assert result1.text != result2.text


class TestMarkdownStableFormat:
    """Tests for Markdown stability guarantees."""

    def test_markdown_has_stable_headings(self, temp_db, test_key):
        """Markdown has all required section headings."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="md")

        assert "# Witness Testimony" in result.text
        assert "## Scope" in result.text
        assert "## Summary" in result.text
        assert "## Key Summary" in result.text
        assert "## Timeline" in result.text
        assert "## Citations" in result.text

    def test_markdown_has_cite_lines(self, temp_db, test_key):
        """Markdown contains CITE lines for each event."""
        store = WitnessStore(temp_db)
        store.init()

        event = make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z")
        store.append(event)
        store.close()

        result = testify(temp_db, format="md")

        # Should have CITE line in timeline
        assert "CITE: e1 sha256:" in result.text

        # Should have Citations section with all CITEs
        assert "## Citations" in result.text

    def test_cite_lines_are_grepable(self, temp_db, test_key):
        """CITE lines can be extracted with grep."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.append(make_event(test_key, "e2", "test", "Test2", "2026-01-02T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="md")

        # Extract CITE lines
        cite_lines = [line for line in result.text.split("\n") if line.startswith("CITE:")]

        # Should have 2 events × 2 occurrences (timeline + citations section)
        assert len(cite_lines) == 4
        assert any("e1" in line for line in cite_lines)
        assert any("e2" in line for line in cite_lines)


class TestFlagAgreement:
    """Tests for flag agreement with expected_flags.json.

    NOTE: expected_flags.json defines flags for SINGLE-EVENT analysis.
    When analyzing a full timeline, additional flags may emerge due to
    accumulated state (e.g., a key reactivation is only visible after
    seeing the original rotation). These tests verify the MINIMUM flags
    are present, as cumulative analysis can add more.
    """

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

    def test_testimony_includes_expected_flags(self, golden_dir, expected_flags, temp_db):
        """Testimony JSON includes at least the flags from expected_flags.json.

        When processing a full timeline, events may accumulate additional flags
        based on prior events. This test verifies that the MINIMUM expected
        flags are present (superset is OK for timeline analysis).
        """
        store = WitnessStore(temp_db)
        store.init()

        # Load golden fixtures in order
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

        # Build event_id -> flags mapping from testimony
        testimony_flags = {}
        for event in data["events"]:
            testimony_flags[event["event_id"]] = set(event["flags"])

        # Verify each fixture's expected flags are present (superset OK)
        for filename, expected in expected_flags.items():
            path = golden_dir / filename
            with open(path, "r", encoding="utf-8") as f:
                fixture = json.load(f)
            event_id = fixture["event_id"]

            expected_flag_set = set(expected.get("flags", []))
            actual_flag_set = testimony_flags.get(event_id, set())

            # Actual flags should be a SUPERSET of expected flags
            # (timeline analysis can add more based on accumulated state)
            assert expected_flag_set.issubset(actual_flag_set), (
                f"Missing flags for {filename}: expected at least {expected_flag_set}, got {actual_flag_set}"
            )

    def test_exit_code_matches_flags(self, golden_dir, expected_flags, temp_db):
        """Exit code matches expected based on flags."""
        store = WitnessStore(temp_db)
        store.init()

        # Load fixtures with flags
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

        result = testify(temp_db, format="json")
        data = json.loads(result.text)

        # Should be exit code 2 (flags present, no crypto failure)
        assert data["exit_code"] == 2
        assert result.exit_code == 2


class TestEmitArtifact:
    """Tests for --emit-artifact functionality."""

    def test_emit_creates_all_files(self, temp_db, test_key):
        """emit-artifact creates json, md, and manifest files."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        with tempfile.TemporaryDirectory() as out_dir:
            out_path = Path(out_dir)

            testify(
                temp_db,
                format="json",
                generated_at="2026-01-01T00:00:00Z",
                emit_artifact_dir=out_path,
            )

            assert (out_path / "testimony.json").exists()
            assert (out_path / "testimony.md").exists()
            assert (out_path / "testimony.manifest.json").exists()

    def test_manifest_has_correct_digests(self, temp_db, test_key):
        """Manifest contains correct digests for artifacts."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        with tempfile.TemporaryDirectory() as out_dir:
            out_path = Path(out_dir)

            testify(
                temp_db,
                format="json",
                generated_at="2026-01-01T00:00:00Z",
                emit_artifact_dir=out_path,
            )

            # Load manifest
            manifest_path = out_path / "testimony.manifest.json"
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)

            assert manifest["schema_version"] == "0.1"
            assert len(manifest["artifacts"]) == 2

            # Verify each artifact's digest
            for artifact in manifest["artifacts"]:
                file_path = out_path / artifact["path"]
                actual_digest = "sha256:" + hashlib.sha256(file_path.read_bytes()).hexdigest()
                assert artifact["digest"] == actual_digest, (
                    f"Digest mismatch for {artifact['path']}"
                )

    def test_manifest_has_correct_sizes(self, temp_db, test_key):
        """Manifest contains correct file sizes."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        with tempfile.TemporaryDirectory() as out_dir:
            out_path = Path(out_dir)

            testify(
                temp_db,
                format="json",
                generated_at="2026-01-01T00:00:00Z",
                emit_artifact_dir=out_path,
            )

            manifest_path = out_path / "testimony.manifest.json"
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)

            for artifact in manifest["artifacts"]:
                file_path = out_path / artifact["path"]
                actual_size = file_path.stat().st_size
                assert artifact["size_bytes"] == actual_size

    def test_emitted_json_matches_returned_json(self, temp_db, test_key):
        """Emitted testimony.json matches the returned text."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        with tempfile.TemporaryDirectory() as out_dir:
            out_path = Path(out_dir)

            result = testify(
                temp_db,
                format="json",
                generated_at="2026-01-01T00:00:00Z",
                emit_artifact_dir=out_path,
            )

            json_path = out_path / "testimony.json"
            emitted_content = json_path.read_text(encoding="utf-8")

            # Both should parse to equivalent JSON
            assert json.loads(emitted_content) == json.loads(result.text)


class TestIncludeEvents:
    """Tests for --include-events (exact store JSON embedding)."""

    def test_raw_event_absent_by_default(self, temp_db, test_key):
        """raw_event is NOT present when --include-events is not set."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json", include_events=False)
        data = json.loads(result.text)

        for event in data["events"]:
            assert "raw_event" not in event

    def test_raw_event_present_when_include_events(self, temp_db, test_key):
        """raw_event IS present when --include-events is set."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json", include_events=True)
        data = json.loads(result.text)

        assert len(data["events"]) == 1
        event = data["events"][0]
        assert "raw_event" in event
        assert event["raw_event"]["encoding"] == "application/json"
        assert event["raw_event"]["source"] == "witness-store"
        assert event["raw_event"]["canonical"] is True
        assert "bytes_base64" in event["raw_event"]

    def test_raw_event_bytes_match_store(self, temp_db, test_key):
        """Decoded raw_event.bytes_base64 matches exact bytes from store."""
        import base64

        store = WitnessStore(temp_db)
        store.init()
        event = make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z")
        store.append(event)

        # Get the exact stored JSON
        stored = store.get("e1")
        stored_json_bytes = stored.event_json.encode("utf-8")
        store.close()

        # Get testimony with include_events
        result = testify(temp_db, format="json", include_events=True)
        data = json.loads(result.text)

        # Decode and compare
        raw_event = data["events"][0]["raw_event"]
        decoded_bytes = base64.b64decode(raw_event["bytes_base64"])

        assert decoded_bytes == stored_json_bytes

    def test_raw_event_is_canonical_json(self, temp_db, test_key):
        """Decoded raw_event is canonical JSON (no extra whitespace)."""
        import base64

        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="json", include_events=True)
        data = json.loads(result.text)

        raw_event = data["events"][0]["raw_event"]
        decoded_json = base64.b64decode(raw_event["bytes_base64"]).decode("utf-8")

        # Canonical JSON has no whitespace after separators
        assert "  " not in decoded_json  # No double spaces
        assert ": " not in decoded_json  # No space after colon
        assert ", " not in decoded_json  # No space after comma (except in strings)

    def test_markdown_appendix_when_include_events(self, temp_db, test_key):
        """Markdown includes Appendix with raw events when --include-events."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="md", include_events=True)

        assert "## Appendix: Raw Events (Exact Store JSON)" in result.text
        assert "### Event e1" in result.text
        assert "```json" in result.text

    def test_markdown_no_appendix_without_include_events(self, temp_db, test_key):
        """Markdown does NOT include Appendix when --include-events is not set."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result = testify(temp_db, format="md", include_events=False)

        assert "## Appendix: Raw Events" not in result.text

    def test_include_events_does_not_change_exit_code(self, temp_db, test_key):
        """Including raw events does NOT change exit codes or flags."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        result_without = testify(temp_db, format="json", include_events=False)
        result_with = testify(temp_db, format="json", include_events=True)

        assert result_without.exit_code == result_with.exit_code
        assert result_without.flagged_count == result_with.flagged_count
        assert result_without.verified_count == result_with.verified_count

    def test_deterministic_with_include_events(self, temp_db, test_key):
        """Output is deterministic with --include-events and fixed timestamp."""
        store = WitnessStore(temp_db)
        store.init()
        store.append(make_event(test_key, "e1", "test", "Test", "2026-01-01T00:00:00Z"))
        store.close()

        fixed_time = "2026-06-15T12:00:00Z"

        result1 = testify(temp_db, format="json", include_events=True, generated_at=fixed_time)
        result2 = testify(temp_db, format="json", include_events=True, generated_at=fixed_time)

        assert result1.text == result2.text


class TestSchemaFile:
    """Tests for the schema file itself."""

    def test_schema_file_exists(self):
        """Schema file exists at expected location."""
        schema_path = Path(__file__).parent.parent / "schemas" / "testimony.schema.v0.1.json"
        assert schema_path.exists(), f"Schema file not found at {schema_path}"

    def test_schema_is_valid_json(self):
        """Schema file is valid JSON."""
        schema_path = Path(__file__).parent.parent / "schemas" / "testimony.schema.v0.1.json"
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)

        assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert schema["title"] == "Witness Testimony Schema"
        assert "properties" in schema
        assert "required" in schema

    def test_schema_includes_raw_event(self):
        """Schema includes optional raw_event definition."""
        schema_path = Path(__file__).parent.parent / "schemas" / "testimony.schema.v0.1.json"
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)

        event_props = schema["properties"]["events"]["items"]["properties"]
        assert "raw_event" in event_props
        assert event_props["raw_event"]["type"] == "object"
        assert "bytes_base64" in event_props["raw_event"]["properties"]
        assert "required" in schema
