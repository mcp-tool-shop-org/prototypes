"""
Cryptographic operations for Witness.

Implements:
- Event digest computation (SHA-256 over canonical JSON)
- Ed25519 signing and verification

LOCKED RULES:
- Digest and signature computed over canonical JSON with:
  - "integrity" field removed entirely
  - signing.signature set to "" (empty string)
- signing.public_key IS included in signed content
"""

from __future__ import annotations

import base64
import hashlib
import json
from typing import Any, Dict, Tuple

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

from witness.canon import canonical_bytes
from witness.models import VerifyResult, VerifyStatus


def normalize_for_signing(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare an event for digest/signature computation.

    LOCKED RULE:
    1. Remove "integrity" field entirely
    2. Set signing.signature to "" (empty string)

    Args:
        event: The event dictionary

    Returns:
        Normalized event dictionary ready for canonicalization
    """
    # Deep copy via JSON roundtrip
    core = json.loads(json.dumps(event))
    core.pop("integrity", None)
    core.setdefault("signing", {})
    core["signing"]["signature"] = ""
    return core


def compute_event_digest(event: Dict[str, Any]) -> str:
    """
    Compute the SHA-256 digest of an event.

    The digest is computed over the canonical JSON of the normalized event
    (with integrity removed and signing.signature set to "").

    Args:
        event: The event dictionary

    Returns:
        Digest string in format "sha256:<lowercase hex>"
    """
    core = normalize_for_signing(event)
    core_bytes = canonical_bytes(core)
    digest = hashlib.sha256(core_bytes).hexdigest()
    return f"sha256:{digest}"


def sign_event(
    event: Dict[str, Any],
    private_key: Ed25519PrivateKey,
) -> Dict[str, Any]:
    """
    Sign an event with an Ed25519 private key.

    This function:
    1. Normalizes the event (removes integrity, sets signature to "")
    2. Computes the canonical JSON bytes
    3. Computes SHA-256 digest
    4. Signs the canonical bytes
    5. Returns the event with integrity and signature filled in

    Args:
        event: The event dictionary (signing.public_key should be set)
        private_key: The Ed25519 private key

    Returns:
        Signed event dictionary with integrity.event_digest and
        signing.signature populated
    """
    # Deep copy
    signed = json.loads(json.dumps(event))

    # Normalize for signing
    core = normalize_for_signing(event)
    core_bytes = canonical_bytes(core)

    # Compute digest
    digest = hashlib.sha256(core_bytes).hexdigest()

    # Sign
    signature = private_key.sign(core_bytes)

    # Fill in the signed fields
    signed.setdefault("integrity", {})
    signed["integrity"]["event_digest"] = f"sha256:{digest}"
    signed["signing"]["signature"] = base64.b64encode(signature).decode("ascii")

    return signed


def _parse_digest(value: str) -> str:
    """
    Parse and validate a sha256: prefixed digest.

    Args:
        value: The digest string (e.g., "sha256:abc123...")

    Returns:
        The hex portion

    Raises:
        ValueError: If format is invalid
    """
    if not value.startswith("sha256:"):
        raise ValueError(f"Expected sha256: prefix, got: {value!r}")

    hex_part = value[7:]  # len("sha256:") == 7

    if len(hex_part) != 64:
        raise ValueError(f"Expected 64 hex chars, got {len(hex_part)}")

    if not all(c in "0123456789abcdef" for c in hex_part):
        raise ValueError("Digest must be lowercase hex")

    return hex_part


def verify_event(event: Dict[str, Any]) -> VerifyResult:
    """
    Verify the cryptographic integrity of an event.

    This checks:
    1. Schema version is "0.1"
    2. Required fields are present
    3. event_digest matches recomputed digest
    4. Signature verifies against the canonical bytes

    Args:
        event: The event dictionary to verify

    Returns:
        VerifyResult with status and any error message
    """
    try:
        # Check schema version
        if event.get("schema_version") != "0.1":
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="schema_version must be '0.1'",
            )

        # Check required fields
        signing = event.get("signing") or {}
        integrity = event.get("integrity") or {}

        if signing.get("algorithm") != "ed25519":
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="signing.algorithm must be 'ed25519'",
            )

        if "public_key" not in signing:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="signing.public_key missing",
            )

        if "signature" not in signing:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="signing.signature missing",
            )

        if "event_digest" not in integrity:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="integrity.event_digest missing",
            )

        # Recompute digest
        core = normalize_for_signing(event)
        core_bytes = canonical_bytes(core)
        computed_digest = hashlib.sha256(core_bytes).hexdigest()

        # Parse and compare stored digest
        try:
            stored_digest = _parse_digest(integrity["event_digest"])
        except ValueError as e:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error=str(e),
            )

        if computed_digest != stored_digest:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error=f"Digest mismatch: computed={computed_digest} stored={stored_digest}",
            )

        # Verify signature
        try:
            pub_bytes = base64.b64decode(signing["public_key"])
            sig_bytes = base64.b64decode(signing["signature"])
        except Exception as e:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error=f"Invalid base64 encoding: {e}",
            )

        try:
            pub_key = Ed25519PublicKey.from_public_bytes(pub_bytes)
            pub_key.verify(sig_bytes, core_bytes)
        except InvalidSignature:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error="Invalid Ed25519 signature",
            )
        except Exception as e:
            return VerifyResult(
                status=VerifyStatus.FAILED_CRYPTO,
                error=f"Signature verification failed: {e}",
            )

        # Crypto verification passed
        return VerifyResult(status=VerifyStatus.VERIFIED)

    except Exception as e:
        return VerifyResult(
            status=VerifyStatus.FAILED_CRYPTO,
            error=f"Unexpected error: {e}",
        )


def generate_key_id(public_key_bytes: bytes) -> str:
    """
    Generate a key ID from public key bytes.

    Key ID = SHA-256(public_key_bytes) as lowercase hex.

    Args:
        public_key_bytes: Raw Ed25519 public key bytes (32 bytes)

    Returns:
        64-character lowercase hex string
    """
    return hashlib.sha256(public_key_bytes).hexdigest()


def public_key_to_bytes(private_key: Ed25519PrivateKey) -> bytes:
    """
    Extract raw public key bytes from a private key.

    Args:
        private_key: Ed25519 private key

    Returns:
        32 bytes of raw public key
    """
    return private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )


def public_key_to_base64(private_key: Ed25519PrivateKey) -> str:
    """
    Get base64-encoded public key from a private key.

    Args:
        private_key: Ed25519 private key

    Returns:
        Base64-encoded public key string
    """
    return base64.b64encode(public_key_to_bytes(private_key)).decode("ascii")
