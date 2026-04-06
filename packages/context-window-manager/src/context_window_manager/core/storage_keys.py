"""
Centralized storage key naming and ID validation.

This module provides:
- ID normalization and validation (session IDs, window names)
- Key naming conventions for all storage backends
- Schema versioning constants

All KV keys should be generated through this module to ensure:
- Consistent naming conventions
- Protection against key collisions
- Normalized IDs that prevent homograph attacks
"""

from __future__ import annotations

import re
import unicodedata
from typing import Final

from context_window_manager.errors import ValidationError

# =============================================================================
# Schema Versioning
# =============================================================================

# Current schema version for metadata storage
# Increment this when:
# - Changing the structure of stored metadata JSON
# - Adding required fields to window/session records
# - Changing block hash computation
METADATA_SCHEMA_VERSION: Final[int] = 1

# Minimum supported schema version for reading
# Lower versions will trigger safe fallback behavior
MIN_SUPPORTED_SCHEMA_VERSION: Final[int] = 1


# =============================================================================
# ID Validation Patterns
# =============================================================================

# Only allow ASCII alphanumeric plus hyphen and underscore
# This prevents:
# - Path traversal (no slashes, dots)
# - Homograph attacks (no unicode lookalikes)
# - Key collisions (no special chars used in key format)
SESSION_ID_PATTERN: Final[re.Pattern] = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
WINDOW_NAME_PATTERN: Final[re.Pattern] = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")

# Reserved names that cannot be used as IDs
RESERVED_NAMES: Final[frozenset[str]] = frozenset({
    "metadata", "blocks", "index", "schema", "version",
    "null", "undefined", "none", "true", "false",
})


# =============================================================================
# ID Normalization and Validation
# =============================================================================

def normalize_id(value: str, id_type: str = "session") -> str:
    """
    Normalize and validate an ID for storage.

    Steps:
    1. Strip leading/trailing whitespace
    2. Normalize unicode (NFKC prevents homograph attacks)
    3. Validate against pattern
    4. Check against reserved names

    Args:
        value: Raw ID from user
        id_type: "session" or "window"

    Returns:
        Normalized ID (always ASCII after normalization)

    Raises:
        ValidationError: If ID is invalid
    """
    if not value:
        raise ValidationError(f"{id_type.title()} ID cannot be empty")

    # Strip whitespace
    value = value.strip()

    if not value:
        raise ValidationError(f"{id_type.title()} ID cannot be whitespace only")

    # Normalize unicode (NFKC converts compatibility characters)
    # This converts things like fullwidth letters to ASCII equivalents
    value = unicodedata.normalize("NFKC", value)

    # Select pattern based on type
    if id_type == "session":
        pattern = SESSION_ID_PATTERN
        max_length = 64
    elif id_type == "window":
        pattern = WINDOW_NAME_PATTERN
        max_length = 128
    else:
        raise ValueError(f"Unknown id_type: {id_type}")

    # Length check (before pattern match for better error message)
    if len(value) > max_length:
        raise ValidationError(
            f"{id_type.title()} ID too long: {len(value)} chars, max {max_length}"
        )

    # Pattern validation
    if not pattern.match(value):
        raise ValidationError(
            f"Invalid {id_type} ID format: {value!r}. "
            f"Must contain only ASCII letters, numbers, hyphens, and underscores."
        )

    # Reserved name check
    if value.lower() in RESERVED_NAMES:
        raise ValidationError(
            f"{id_type.title()} ID '{value}' is reserved and cannot be used"
        )

    return value


def validate_session_id(session_id: str) -> str:
    """
    Validate and normalize a session ID.

    Args:
        session_id: Raw session ID

    Returns:
        Normalized session ID

    Raises:
        ValidationError: If invalid
    """
    return normalize_id(session_id, "session")


def validate_window_name(name: str) -> str:
    """
    Validate and normalize a window name.

    Args:
        name: Raw window name

    Returns:
        Normalized window name

    Raises:
        ValidationError: If invalid
    """
    return normalize_id(name, "window")


# =============================================================================
# Key Naming Functions
# =============================================================================

def window_metadata_key(window_name: str) -> str:
    """
    Generate the key for window metadata storage.

    Args:
        window_name: Validated window name

    Returns:
        Storage key for window metadata
    """
    # Don't re-validate here - caller should validate
    return f"window:{window_name}:metadata"


def window_prompt_key(window_name: str) -> str:
    """
    Generate the key for window prompt storage.

    Args:
        window_name: Validated window name

    Returns:
        Storage key for window prompt
    """
    return f"window:{window_name}:prompt"


def window_lineage_key(window_name: str) -> str:
    """
    Generate the key for window lineage (ancestry) storage.

    Args:
        window_name: Validated window name

    Returns:
        Storage key for window lineage
    """
    return f"window:{window_name}:lineage"


def session_index_key(session_id: str) -> str:
    """
    Generate the key for session index storage.

    Args:
        session_id: Validated session ID

    Returns:
        Storage key for session index
    """
    return f"session:{session_id}:index"


def block_key(block_hash: str) -> str:
    """
    Generate the key for block data storage.

    Args:
        block_hash: Block hash (hex string)

    Returns:
        Storage key for block data
    """
    # Block hashes are already validated as hex strings
    return f"block:{block_hash}"


def block_metadata_key(block_hash: str) -> str:
    """
    Generate the key for block metadata storage.

    Args:
        block_hash: Block hash (hex string)

    Returns:
        Storage key for block metadata
    """
    return f"block:{block_hash}:meta"


# =============================================================================
# Metadata Envelope
# =============================================================================

def wrap_metadata(data: dict, created_at: str | None = None) -> dict:
    """
    Wrap metadata with schema version and timestamp.

    This should be used for all JSON metadata stored in the KV store.

    Args:
        data: The actual metadata payload
        created_at: ISO timestamp (generated if not provided)

    Returns:
        Envelope with schema_version, created_at, and data
    """
    from datetime import UTC, datetime

    return {
        "_schema_version": METADATA_SCHEMA_VERSION,
        "_created_at": created_at or datetime.now(UTC).isoformat(),
        **data,
    }


def unwrap_metadata(envelope: dict) -> tuple[int, dict]:
    """
    Unwrap metadata and extract schema version.

    Args:
        envelope: The stored metadata envelope

    Returns:
        Tuple of (schema_version, data_without_envelope_fields)

    Raises:
        ValidationError: If envelope is malformed
    """
    if not isinstance(envelope, dict):
        raise ValidationError("Metadata must be a dictionary")

    schema_version = envelope.get("_schema_version", 0)

    if not isinstance(schema_version, int):
        raise ValidationError(
            f"Invalid schema version type: {type(schema_version).__name__}"
        )

    # Extract data without envelope fields
    data = {k: v for k, v in envelope.items() if not k.startswith("_")}

    return schema_version, data


def check_schema_compatibility(stored_version: int) -> tuple[bool, str | None]:
    """
    Check if a stored schema version is compatible.

    Args:
        stored_version: The schema version from stored metadata

    Returns:
        Tuple of (is_compatible, warning_message_if_any)
    """
    if stored_version < MIN_SUPPORTED_SCHEMA_VERSION:
        return False, (
            f"Stored schema version {stored_version} is too old. "
            f"Minimum supported: {MIN_SUPPORTED_SCHEMA_VERSION}"
        )

    if stored_version > METADATA_SCHEMA_VERSION:
        return False, (
            f"Stored schema version {stored_version} is newer than supported. "
            f"Current version: {METADATA_SCHEMA_VERSION}. "
            "Please upgrade the context window manager."
        )

    return True, None
