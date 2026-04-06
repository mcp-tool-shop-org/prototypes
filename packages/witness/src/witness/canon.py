"""
Canonical JSON serialization for Witness.

LOCKED INVARIANTS (do not change without schema version bump):
- UTF-8 encoding
- Object keys sorted lexicographically
- separators=(",", ":") - no whitespace
- ensure_ascii=False
- No NaN/Infinity/scientific notation

These rules ensure byte-for-byte reproducibility across implementations.
"""

from __future__ import annotations

import json
import math
from typing import Any


class CanonicalJSONError(Exception):
    """Raised when a value cannot be canonicalized."""
    pass


def _check_number(value: float) -> None:
    """Reject non-finite numbers (NaN, Infinity)."""
    if math.isnan(value) or math.isinf(value):
        raise CanonicalJSONError(
            f"Cannot canonicalize non-finite number: {value}"
        )


def _validate_for_canon(obj: Any) -> None:
    """
    Recursively validate that an object can be canonicalized.

    Raises CanonicalJSONError for:
    - NaN or Infinity values
    - Non-string dictionary keys
    """
    if isinstance(obj, float):
        _check_number(obj)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            if not isinstance(key, str):
                raise CanonicalJSONError(
                    f"Dictionary keys must be strings, got: {type(key).__name__}"
                )
            _validate_for_canon(value)
    elif isinstance(obj, (list, tuple)):
        for item in obj:
            _validate_for_canon(item)


def canonical_json(obj: Any) -> str:
    """
    Serialize an object to canonical JSON string.

    Rules (LOCKED):
    - Keys sorted lexicographically
    - No whitespace between tokens
    - UTF-8 compatible (ensure_ascii=False)
    - Rejects NaN/Infinity

    Args:
        obj: The object to serialize

    Returns:
        Canonical JSON string

    Raises:
        CanonicalJSONError: If the object cannot be canonicalized
    """
    _validate_for_canon(obj)
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def canonical_bytes(obj: Any) -> bytes:
    """
    Serialize an object to canonical JSON bytes (UTF-8).

    This is the primary function for cryptographic operations.
    All digests and signatures are computed over these bytes.

    Args:
        obj: The object to serialize

    Returns:
        Canonical JSON as UTF-8 bytes

    Raises:
        CanonicalJSONError: If the object cannot be canonicalized
    """
    return canonical_json(obj).encode("utf-8")
