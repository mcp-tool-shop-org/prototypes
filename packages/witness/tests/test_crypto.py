"""
Tests for cryptographic operations.

These tests verify that our crypto implementation matches the golden fixtures.
"""

import base64
import hashlib
import json
import pytest
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from witness.crypto import (
    normalize_for_signing,
    compute_event_digest,
    sign_event,
    verify_event,
    generate_key_id,
    public_key_to_bytes,
    public_key_to_base64,
)
from witness.canon import canonical_bytes
from witness.models import VerifyStatus


def make_key_from_seed(label: str) -> Ed25519PrivateKey:
    """Deterministic key from label (matches gen_golden.py)."""
    seed = hashlib.sha256(label.encode("utf-8")).digest()
    return Ed25519PrivateKey.from_private_bytes(seed)


class TestNormalizeForSigning:
    """Tests for normalize_for_signing function."""

    def test_removes_integrity(self):
        """integrity field must be removed entirely."""
        event = {
            "schema_version": "0.1",
            "integrity": {"event_digest": "sha256:abc"},
            "signing": {"signature": "xyz"},
        }
        result = normalize_for_signing(event)
        assert "integrity" not in result

    def test_sets_signature_empty(self):
        """signing.signature must be set to empty string."""
        event = {
            "schema_version": "0.1",
            "signing": {"signature": "original"},
        }
        result = normalize_for_signing(event)
        assert result["signing"]["signature"] == ""

    def test_preserves_public_key(self):
        """signing.public_key must be preserved."""
        event = {
            "schema_version": "0.1",
            "signing": {
                "public_key": "test_key",
                "signature": "sig",
            },
        }
        result = normalize_for_signing(event)
        assert result["signing"]["public_key"] == "test_key"

    def test_creates_signing_if_missing(self):
        """signing object is created if missing."""
        event = {"schema_version": "0.1"}
        result = normalize_for_signing(event)
        assert "signing" in result
        assert result["signing"]["signature"] == ""

    def test_does_not_modify_original(self):
        """Original event is not modified."""
        event = {
            "schema_version": "0.1",
            "integrity": {"event_digest": "sha256:abc"},
            "signing": {"signature": "xyz"},
        }
        normalize_for_signing(event)
        assert "integrity" in event
        assert event["signing"]["signature"] == "xyz"


class TestComputeEventDigest:
    """Tests for compute_event_digest function."""

    def test_returns_sha256_prefixed(self):
        """Digest must have sha256: prefix."""
        event = {
            "schema_version": "0.1",
            "signing": {"signature": ""},
        }
        result = compute_event_digest(event)
        assert result.startswith("sha256:")

    def test_digest_is_64_hex_chars(self):
        """Digest hex portion must be 64 characters."""
        event = {
            "schema_version": "0.1",
            "signing": {"signature": ""},
        }
        result = compute_event_digest(event)
        hex_part = result[7:]  # Remove "sha256:"
        assert len(hex_part) == 64
        assert all(c in "0123456789abcdef" for c in hex_part)

    def test_digest_ignores_existing_integrity(self):
        """Existing integrity field does not affect digest."""
        event1 = {
            "schema_version": "0.1",
            "signing": {"signature": ""},
        }
        event2 = {
            "schema_version": "0.1",
            "signing": {"signature": ""},
            "integrity": {"event_digest": "sha256:different"},
        }
        assert compute_event_digest(event1) == compute_event_digest(event2)

    def test_digest_ignores_signature_value(self):
        """Existing signature value does not affect digest."""
        event1 = {
            "schema_version": "0.1",
            "signing": {"signature": ""},
        }
        event2 = {
            "schema_version": "0.1",
            "signing": {"signature": "some_signature"},
        }
        assert compute_event_digest(event1) == compute_event_digest(event2)

    def test_digest_changes_with_content(self):
        """Digest changes when content changes."""
        event1 = {"schema_version": "0.1", "intent": "foo", "signing": {"signature": ""}}
        event2 = {"schema_version": "0.1", "intent": "bar", "signing": {"signature": ""}}
        assert compute_event_digest(event1) != compute_event_digest(event2)


class TestSignEvent:
    """Tests for sign_event function."""

    def test_adds_integrity_field(self):
        """Signed event has integrity.event_digest."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        result = sign_event(event, priv)
        assert "integrity" in result
        assert "event_digest" in result["integrity"]
        assert result["integrity"]["event_digest"].startswith("sha256:")

    def test_adds_signature(self):
        """Signed event has signing.signature."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        result = sign_event(event, priv)
        assert result["signing"]["signature"] != ""
        # Should be valid base64
        sig_bytes = base64.b64decode(result["signing"]["signature"])
        assert len(sig_bytes) == 64  # Ed25519 signature is 64 bytes

    def test_does_not_modify_original(self):
        """Original event is not modified."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        sign_event(event, priv)
        assert "integrity" not in event
        assert event["signing"]["signature"] == ""


class TestVerifyEvent:
    """Tests for verify_event function."""

    def test_valid_event_passes(self):
        """A properly signed event verifies successfully."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "event_id": "test-event",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        signed = sign_event(event, priv)
        result = verify_event(signed)
        assert result.status == VerifyStatus.VERIFIED
        assert result.ok is True
        assert result.error is None

    def test_invalid_schema_version_fails(self):
        """Wrong schema version fails verification."""
        event = {
            "schema_version": "0.2",
            "signing": {
                "algorithm": "ed25519",
                "public_key": "test",
                "signature": "test",
            },
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        result = verify_event(event)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "schema_version" in result.error

    def test_missing_public_key_fails(self):
        """Missing public_key fails verification."""
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "signature": "test",
            },
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        result = verify_event(event)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "public_key" in result.error

    def test_missing_signature_fails(self):
        """Missing signature fails verification."""
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": "test",
            },
            "integrity": {"event_digest": "sha256:" + "0" * 64},
        }
        result = verify_event(event)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "signature" in result.error

    def test_missing_event_digest_fails(self):
        """Missing event_digest fails verification."""
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": "test",
                "signature": "test",
            },
            "integrity": {},
        }
        result = verify_event(event)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "event_digest" in result.error

    def test_wrong_digest_fails(self):
        """Wrong digest value fails verification."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        signed = sign_event(event, priv)
        # Tamper with the digest
        signed["integrity"]["event_digest"] = "sha256:" + "0" * 64
        result = verify_event(signed)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "mismatch" in result.error.lower()

    def test_wrong_signature_fails(self):
        """Wrong signature value fails verification."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        signed = sign_event(event, priv)
        # Tamper with the signature (use a different valid base64)
        fake_sig = base64.b64encode(b"x" * 64).decode("ascii")
        signed["signing"]["signature"] = fake_sig
        result = verify_event(signed)
        assert result.status == VerifyStatus.FAILED_CRYPTO
        assert "signature" in result.error.lower()

    def test_tampered_content_fails(self):
        """Tampering with content after signing fails verification."""
        priv = make_key_from_seed("test-key")
        event = {
            "schema_version": "0.1",
            "intent": "original",
            "signing": {
                "algorithm": "ed25519",
                "public_key": public_key_to_base64(priv),
                "signature": "",
            },
        }
        signed = sign_event(event, priv)
        # Tamper with content
        signed["intent"] = "tampered"
        result = verify_event(signed)
        assert result.status == VerifyStatus.FAILED_CRYPTO


class TestKeyOperations:
    """Tests for key-related functions."""

    def test_generate_key_id_is_sha256(self):
        """Key ID is SHA-256 of public key bytes."""
        priv = make_key_from_seed("test-key")
        pub_bytes = public_key_to_bytes(priv)
        key_id = generate_key_id(pub_bytes)
        assert len(key_id) == 64
        assert all(c in "0123456789abcdef" for c in key_id)
        # Verify it's actually the SHA-256
        expected = hashlib.sha256(pub_bytes).hexdigest()
        assert key_id == expected

    def test_key_ids_match_fixtures(self):
        """
        Key IDs from our implementation match gen_golden.py exactly.

        These are the locked key IDs from IMPLEMENTATION_NOTES.md.
        """
        expected_keys = {
            "witness-fixture-key-old": "7659064ef95fe42607378e6dde16d8d04392cd584420d22e82ed542a51cc1dda",
            "witness-fixture-key-new": "22db7342b648ab9c079f8795cfb02e25ac26dd8fae1a2bd3aa45bb6461bda361",
            "witness-fixture-key-recovery": "66464aa111c5df2fc0cddb73f447a04cc6412de2b57b3315a3aa98da20cc36e4",
        }
        for seed, expected_id in expected_keys.items():
            priv = make_key_from_seed(seed)
            pub_bytes = public_key_to_bytes(priv)
            actual_id = generate_key_id(pub_bytes)
            assert actual_id == expected_id, f"Key ID mismatch for {seed}"


class TestGoldenFixtureVerification:
    """Tests that verify all golden fixtures pass crypto verification."""

    @pytest.fixture
    def golden_dir(self) -> Path:
        """Path to golden fixtures directory."""
        # Handle both running from repo root and from tests directory
        candidates = [
            Path(__file__).parent.parent / "tests" / "fixtures" / "golden",
            Path(__file__).parent / "fixtures" / "golden",
        ]
        for path in candidates:
            if path.exists():
                return path
        pytest.skip("Golden fixtures directory not found")

    @pytest.fixture
    def golden_files(self, golden_dir: Path) -> list:
        """List of golden fixture files."""
        return [
            "event.normal.v0.1.golden.json",
            "event.rotate.continuity.v0.1.golden.json",
            "event.backdated.temporal_anomaly.v0.1.golden.json",
            "event.rotate.recovery.v0.1.golden.json",
            "event.rotate.reactivation.v0.1.golden.json",
            "event.rotate.wrong_actor_type.v0.1.golden.json",
        ]

    def test_all_golden_fixtures_verify(self, golden_dir: Path, golden_files: list):
        """Every golden fixture must pass cryptographic verification."""
        for filename in golden_files:
            path = golden_dir / filename
            if not path.exists():
                pytest.skip(f"Fixture not found: {filename}")

            with open(path, "r", encoding="utf-8") as f:
                event = json.load(f)

            result = verify_event(event)
            assert result.ok, f"{filename}: {result.error}"
            assert result.status in (VerifyStatus.VERIFIED, VerifyStatus.VERIFIED_WITH_FLAGS), (
                f"{filename}: unexpected status {result.status}"
            )
