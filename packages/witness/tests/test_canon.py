"""
Tests for canonical JSON serialization.

These tests verify that our canonical JSON implementation produces
byte-identical output to the golden fixture generator.
"""

import json
import pytest
from pathlib import Path

from witness.canon import canonical_json, canonical_bytes, CanonicalJSONError


class TestCanonicalJson:
    """Tests for canonical_json function."""

    def test_sorted_keys(self):
        """Object keys must be sorted lexicographically."""
        obj = {"z": 1, "a": 2, "m": 3}
        result = canonical_json(obj)
        assert result == '{"a":2,"m":3,"z":1}'

    def test_nested_sorted_keys(self):
        """Nested object keys must also be sorted."""
        obj = {"b": {"z": 1, "a": 2}, "a": 1}
        result = canonical_json(obj)
        assert result == '{"a":1,"b":{"a":2,"z":1}}'

    def test_no_whitespace(self):
        """No whitespace between tokens."""
        obj = {"key": [1, 2, 3]}
        result = canonical_json(obj)
        assert " " not in result
        assert "\n" not in result
        assert "\t" not in result
        assert result == '{"key":[1,2,3]}'

    def test_unicode_preserved(self):
        """Unicode characters are preserved (ensure_ascii=False)."""
        obj = {"name": "Alice"}
        result = canonical_json(obj)
        assert result == '{"name":"Alice"}'

    def test_array_order_preserved(self):
        """Array element order is preserved."""
        obj = {"items": [3, 1, 2]}
        result = canonical_json(obj)
        assert result == '{"items":[3,1,2]}'

    def test_rejects_nan(self):
        """NaN values must be rejected."""
        obj = {"value": float("nan")}
        with pytest.raises(CanonicalJSONError, match="non-finite"):
            canonical_json(obj)

    def test_rejects_infinity(self):
        """Infinity values must be rejected."""
        obj = {"value": float("inf")}
        with pytest.raises(CanonicalJSONError, match="non-finite"):
            canonical_json(obj)

    def test_rejects_negative_infinity(self):
        """Negative infinity values must be rejected."""
        obj = {"value": float("-inf")}
        with pytest.raises(CanonicalJSONError, match="non-finite"):
            canonical_json(obj)

    def test_nested_nan_rejected(self):
        """NaN in nested structures must be rejected."""
        obj = {"outer": {"inner": float("nan")}}
        with pytest.raises(CanonicalJSONError):
            canonical_json(obj)

    def test_nan_in_array_rejected(self):
        """NaN in arrays must be rejected."""
        obj = {"values": [1, float("nan"), 3]}
        with pytest.raises(CanonicalJSONError):
            canonical_json(obj)

    def test_integers(self):
        """Integers are serialized without decimal points."""
        obj = {"count": 42}
        result = canonical_json(obj)
        assert result == '{"count":42}'

    def test_floats(self):
        """Floats are serialized correctly."""
        obj = {"value": 3.14}
        result = canonical_json(obj)
        assert result == '{"value":3.14}'

    def test_boolean_true(self):
        """Boolean true is lowercase."""
        obj = {"flag": True}
        result = canonical_json(obj)
        assert result == '{"flag":true}'

    def test_boolean_false(self):
        """Boolean false is lowercase."""
        obj = {"flag": False}
        result = canonical_json(obj)
        assert result == '{"flag":false}'

    def test_null(self):
        """None is serialized as null."""
        obj = {"value": None}
        result = canonical_json(obj)
        assert result == '{"value":null}'

    def test_empty_string(self):
        """Empty strings are preserved."""
        obj = {"signature": ""}
        result = canonical_json(obj)
        assert result == '{"signature":""}'

    def test_empty_array(self):
        """Empty arrays are preserved."""
        obj = {"items": []}
        result = canonical_json(obj)
        assert result == '{"items":[]}'

    def test_empty_object(self):
        """Empty objects are preserved."""
        obj = {"data": {}}
        result = canonical_json(obj)
        assert result == '{"data":{}}'


class TestCanonicalBytes:
    """Tests for canonical_bytes function."""

    def test_returns_utf8_bytes(self):
        """Output is UTF-8 encoded bytes."""
        obj = {"key": "value"}
        result = canonical_bytes(obj)
        assert isinstance(result, bytes)
        assert result == b'{"key":"value"}'

    def test_unicode_encoded_as_utf8(self):
        """Unicode is encoded as UTF-8 bytes."""
        obj = {"name": "Alice"}
        result = canonical_bytes(obj)
        # The string should be UTF-8 encoded
        assert result.decode("utf-8") == '{"name":"Alice"}'


class TestGoldenFixtureCompatibility:
    """Tests that verify byte-for-byte compatibility with golden fixtures."""

    @pytest.fixture
    def golden_dir(self) -> Path:
        """Path to golden fixtures directory."""
        return Path(__file__).parent.parent / "tests" / "fixtures" / "golden"

    def test_canonical_matches_generator(self):
        """
        Our canonical JSON must match the generator's output exactly.

        This is the critical invariant for cryptographic verification.
        """
        # Test case from gen_golden.py's signing preparation
        test_obj = {
            "schema_version": "0.1",
            "event_id": "test",
            "signing": {
                "algorithm": "ed25519",
                "public_key": "test",
                "signature": "",
            },
        }

        # Our implementation
        our_bytes = canonical_bytes(test_obj)

        # Generator's implementation (copied from gen_golden.py)
        generator_bytes = json.dumps(
            test_obj,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")

        assert our_bytes == generator_bytes, (
            f"Canonical bytes mismatch!\n"
            f"Ours:      {our_bytes!r}\n"
            f"Generator: {generator_bytes!r}"
        )
