"""Tests for storage_keys module - centralized key naming and schema versioning."""

from __future__ import annotations

import pytest

from context_window_manager.core.storage_keys import (
    METADATA_SCHEMA_VERSION,
    MIN_SUPPORTED_SCHEMA_VERSION,
    check_schema_compatibility,
    normalize_id,
    unwrap_metadata,
    validate_session_id,
    validate_window_name,
    window_lineage_key,
    window_metadata_key,
    window_prompt_key,
    wrap_metadata,
)
from context_window_manager.errors import ValidationError


class TestIdValidation:
    """Tests for ID validation functions."""

    def test_valid_session_id(self):
        """Valid session IDs should return normalized string."""
        assert validate_session_id("session-123") == "session-123"
        assert validate_session_id("my_session") == "my_session"
        assert validate_session_id("ABC123") == "ABC123"

    def test_invalid_session_id_empty(self):
        """Empty session ID should raise ValidationError."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_session_id("")

    def test_invalid_session_id_too_long(self):
        """Session ID > 64 chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="too long"):
            validate_session_id("a" * 65)

    def test_invalid_session_id_special_chars(self):
        """Session ID with special chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            validate_session_id("session:123")
        with pytest.raises(ValidationError, match="Invalid"):
            validate_session_id("session/path")
        with pytest.raises(ValidationError, match="Invalid"):
            validate_session_id("session.name")

    def test_valid_window_name(self):
        """Valid window names should return normalized string."""
        assert validate_window_name("my-window") == "my-window"
        assert validate_window_name("window_v2") == "window_v2"
        assert validate_window_name("Window123") == "Window123"

    def test_invalid_window_name_empty(self):
        """Empty window name should raise ValidationError."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_window_name("")

    def test_invalid_window_name_too_long(self):
        """Window name > 128 chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="too long"):
            validate_window_name("w" * 129)


class TestNormalizeId:
    """Tests for ID normalization."""

    def test_strips_whitespace(self):
        """Leading/trailing whitespace should be stripped."""
        assert normalize_id("  session  ", "session") == "session"

    def test_nfkc_normalization(self):
        """Unicode should be NFKC normalized."""
        # Full-width characters -> ASCII
        result = normalize_id("ＡＢＣ", "session")
        assert result == "ABC"

    def test_rejects_reserved_names(self):
        """Reserved names should be rejected."""
        # "metadata", "null", etc. are reserved
        with pytest.raises(ValidationError, match="reserved"):
            normalize_id("metadata", "session")
        with pytest.raises(ValidationError, match="reserved"):
            normalize_id("null", "window")
        with pytest.raises(ValidationError, match="reserved"):
            normalize_id("None", "session")  # Case-insensitive check

    def test_rejects_invalid_pattern(self):
        """Invalid patterns should be rejected."""
        with pytest.raises(ValidationError, match="Invalid session ID"):
            normalize_id("invalid:id", "session")


class TestKeyNaming:
    """Tests for centralized key naming functions."""

    def test_window_metadata_key(self):
        """Metadata key should follow pattern."""
        assert window_metadata_key("my-window") == "window:my-window:metadata"

    def test_window_prompt_key(self):
        """Prompt key should follow pattern."""
        assert window_prompt_key("my-window") == "window:my-window:prompt"

    def test_window_lineage_key(self):
        """Lineage key should follow pattern."""
        assert window_lineage_key("my-window") == "window:my-window:lineage"


class TestSchemaVersioning:
    """Tests for schema versioning functions."""

    def test_wrap_metadata_adds_version(self):
        """wrap_metadata should add schema version."""
        data = {"key": "value"}
        envelope = wrap_metadata(data)

        assert "_schema_version" in envelope
        assert envelope["_schema_version"] == METADATA_SCHEMA_VERSION
        assert "_created_at" in envelope
        assert envelope["key"] == "value"

    def test_wrap_metadata_custom_timestamp(self):
        """wrap_metadata should accept custom timestamp."""
        data = {"key": "value"}
        envelope = wrap_metadata(data, created_at="2024-01-01T00:00:00Z")

        assert envelope["_created_at"] == "2024-01-01T00:00:00Z"

    def test_unwrap_metadata_extracts_version(self):
        """unwrap_metadata should extract version and data."""
        envelope = {
            "_schema_version": 1,
            "_created_at": "2024-01-01T00:00:00Z",
            "key": "value",
        }

        version, data = unwrap_metadata(envelope)

        assert version == 1
        assert data == {"key": "value"}
        assert "_schema_version" not in data
        assert "_created_at" not in data

    def test_unwrap_metadata_missing_version(self):
        """unwrap_metadata should handle missing version (legacy data)."""
        envelope = {"key": "value"}

        version, data = unwrap_metadata(envelope)

        assert version == 0  # Indicates legacy/unknown
        assert data == {"key": "value"}

    def test_check_schema_compatibility_current(self):
        """Current schema version should be compatible."""
        is_compatible, warning = check_schema_compatibility(METADATA_SCHEMA_VERSION)

        assert is_compatible is True
        assert warning is None

    def test_check_schema_compatibility_min_supported(self):
        """Minimum supported version should be compatible."""
        is_compatible, warning = check_schema_compatibility(MIN_SUPPORTED_SCHEMA_VERSION)

        assert is_compatible is True

    def test_check_schema_compatibility_too_old(self):
        """Version below minimum should be incompatible."""
        is_compatible, warning = check_schema_compatibility(0)

        assert is_compatible is False
        assert warning is not None
        assert "too old" in warning.lower() or "unsupported" in warning.lower()

    def test_check_schema_compatibility_future(self):
        """Future version should be incompatible."""
        future_version = METADATA_SCHEMA_VERSION + 100
        is_compatible, warning = check_schema_compatibility(future_version)

        assert is_compatible is False
        assert warning is not None
        assert "newer" in warning.lower() or "future" in warning.lower()


class TestRoundTrip:
    """Tests for wrap/unwrap round-trip."""

    def test_round_trip_preserves_data(self):
        """Data should survive wrap/unwrap round-trip."""
        original = {
            "window_name": "test-window",
            "cache_salt": "abc123",
            "token_count": 1000,
            "block_hashes": ["h1", "h2", "h3"],
        }

        envelope = wrap_metadata(original)
        version, recovered = unwrap_metadata(envelope)

        assert version == METADATA_SCHEMA_VERSION
        assert recovered == original

    def test_round_trip_nested_data(self):
        """Nested structures should survive round-trip."""
        original = {
            "config": {
                "nested": {
                    "deep": "value"
                }
            },
            "list": [1, 2, 3],
        }

        envelope = wrap_metadata(original)
        _, recovered = unwrap_metadata(envelope)

        assert recovered == original
