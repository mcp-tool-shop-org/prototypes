#!/usr/bin/env python3
"""
Generate cryptographically-correct Witness v0.1 golden fixtures.

INVARIANTS (do not change without schema version bump):
- UTF-8 encoding
- Object keys sorted lexicographically
- separators=(",", ":") - no whitespace
- ensure_ascii=False
- No NaN/Infinity/scientific notation

Signing/Digest rule:
- event_digest and signature computed over canonical JSON with:
  - "integrity" omitted entirely
  - signing.signature = "" (empty string)
- signing.public_key IS included in signed content
"""

import base64
import hashlib
import json
from pathlib import Path
from typing import Any, Dict

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


OUTDIR = Path("tests/fixtures/golden")
OUTDIR.mkdir(parents=True, exist_ok=True)


def canon(obj: Any) -> bytes:
    """Canonical JSON serialization. LOCKED - do not modify."""
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False
    ).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def key_id_from_pub(pub_bytes: bytes) -> str:
    """Key ID = full SHA-256 of public key bytes, hex."""
    return sha256_hex(pub_bytes)


def sign_event(event: Dict[str, Any], priv: Ed25519PrivateKey) -> Dict[str, Any]:
    """
    Sign an event per the LOCKED signing rule:
    1. Remove "integrity" entirely
    2. Set signing.signature = ""
    3. Canonicalize
    4. Compute digest = sha256(canonical_bytes)
    5. Sign canonical_bytes with Ed25519
    """
    # Deep copy via JSON roundtrip
    core = json.loads(json.dumps(event))
    core.pop("integrity", None)
    core.setdefault("signing", {})
    core["signing"]["signature"] = ""

    core_bytes = canon(core)
    digest = sha256_hex(core_bytes)
    sig = priv.sign(core_bytes)

    # Fill signed fields in output
    signed = json.loads(json.dumps(event))
    signed.setdefault("integrity", {})
    signed["integrity"]["event_digest"] = f"sha256:{digest}"
    signed["signing"]["signature"] = b64(sig)
    return signed


def make_key_from_seed(label: str) -> Ed25519PrivateKey:
    """Deterministic key from label. Ed25519 seed = sha256(label)."""
    seed = hashlib.sha256(label.encode("utf-8")).digest()
    return Ed25519PrivateKey.from_private_bytes(seed)


def pub_b64(priv: Ed25519PrivateKey) -> str:
    pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    return b64(pub)


def pub_raw(priv: Ed25519PrivateKey) -> bytes:
    return priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )


def write_json(path: Path, obj: Any) -> None:
    """Write canonical JSON with trailing newline."""
    path.write_bytes(canon(obj) + b"\n")


def main() -> None:
    # === KEYS (deterministic seeds - LOCKED) ===
    old_priv = make_key_from_seed("witness-fixture-key-old")
    new_priv = make_key_from_seed("witness-fixture-key-new")
    rec_priv = make_key_from_seed("witness-fixture-key-recovery")

    old_pub_b64 = pub_b64(old_priv)
    new_pub_b64 = pub_b64(new_priv)
    rec_pub_b64 = pub_b64(rec_priv)

    old_kid = key_id_from_pub(pub_raw(old_priv))
    new_kid = key_id_from_pub(pub_raw(new_priv))
    rec_kid = key_id_from_pub(pub_raw(rec_priv))

    empty_links = {"parent_event_ids": [], "related_event_ids": []}

    # =========================================================
    # FIXTURE 1: Normal event (signed by old)
    # Expected: VERIFIED (no flags)
    # =========================================================
    e1 = {
        "schema_version": "0.1",
        "event_id": "11111111-1111-1111-1111-111111111111",
        "occurred_at": "2026-01-30T17:42:11Z",
        "actor": {"type": "human", "id": old_kid},
        "intent": "Export audit package for run_id 9f3b",
        "action": "nexus.export_audit_package",
        "inputs": [{
            "artifact_id": "config",
            "media_type": "application/json",
            "locator": "./config.json",
            "digest": "sha256:" + "00" * 32,
            "size_bytes": 123
        }],
        "outputs": [{
            "artifact_id": "audit_package",
            "media_type": "application/json",
            "locator": "./audit_package.json",
            "digest": "sha256:" + "11" * 32,
            "size_bytes": 456
        }],
        "context": {
            "tool": "nexus-attest",
            "tool_version": "0.6.0",
            "observation": {
                "source": "wrapper",
                "statement": "Executed export_audit_package; produced 1 artifact"
            }
        },
        "claims": [{
            "type": "display_name",
            "value": "Alice",
            "asserted_at": "2026-01-15T10:00:00Z"
        }],
        "links": empty_links,
        "signing": {"algorithm": "ed25519", "public_key": old_pub_b64, "signature": ""}
    }
    e1s = sign_event(e1, old_priv)

    # =========================================================
    # FIXTURE 2: Continuity rotation (old -> new, signed by old)
    # Expected: VERIFIED (no flags)
    # =========================================================
    e2 = {
        "schema_version": "0.1",
        "event_id": "22222222-2222-2222-2222-222222222222",
        "occurred_at": "2026-02-01T09:00:00Z",
        "actor": {"type": "system", "id": old_kid},
        "intent": "Rotate signing key due to device migration",
        "action": "witness.rotate_key",
        "inputs": [],
        "outputs": [{
            "artifact_id": "new_public_key",
            "media_type": "application/octet-stream",
            "size_bytes": 32,
            "digest": "sha256:" + sha256_hex(pub_raw(new_priv))
        }],
        "context": {
            "tool": "witness-cli",
            "tool_version": "0.1.0",
            "rotation": {
                "old_key_id": old_kid,
                "new_key_id": new_kid,
                "reason": "device_migration",
                "mode": "continuity",
                "note": "moved to new workstation"
            }
        },
        "links": {"parent_event_ids": [e1["event_id"]], "related_event_ids": []},
        "signing": {"algorithm": "ed25519", "public_key": old_pub_b64, "signature": ""}
    }
    e2s = sign_event(e2, old_priv)

    # =========================================================
    # FIXTURE 3: Temporal anomaly (signed by old, but occurred_at AFTER rotation)
    # Expected: VERIFIED_WITH_FLAGS (TEMPORAL_ANOMALY_AFTER_ROTATION)
    # =========================================================
    e3 = {
        "schema_version": "0.1",
        "event_id": "44444444-4444-4444-4444-444444444444",
        "occurred_at": "2026-02-05T08:00:00Z",  # AFTER rotation at 2026-02-01
        "actor": {"type": "human", "id": old_kid},
        "intent": "Imported historical record from offline work",
        "action": "witness.import",
        "inputs": [{
            "artifact_id": "notes",
            "media_type": "text/plain",
            "locator": "./notes.txt",
            "digest": "sha256:" + "33" * 32,
            "size_bytes": 12
        }],
        "outputs": [],
        "context": {
            "tool": "witness-cli",
            "tool_version": "0.1.0",
            "observation": {
                "source": "system",
                "statement": "Imported 1 historical artifact reference"
            }
        },
        "links": empty_links,
        "signing": {"algorithm": "ed25519", "public_key": old_pub_b64, "signature": ""}
    }
    e3s = sign_event(e3, old_priv)

    # =========================================================
    # FIXTURE 4: Recovery rotation (new -> rec, signed by rec only)
    # Expected: VERIFIED_WITH_FLAGS (CONTINUITY_BROKEN)
    # =========================================================
    e4 = {
        "schema_version": "0.1",
        "event_id": "33333333-3333-3333-3333-333333333333",
        "occurred_at": "2026-02-10T12:30:00Z",
        "actor": {"type": "system", "id": rec_kid},
        "intent": "Recover signing identity after suspected compromise",
        "action": "witness.rotate_key",
        "inputs": [],
        "outputs": [],
        "context": {
            "tool": "witness-cli",
            "tool_version": "0.1.0",
            "rotation": {
                "old_key_id": new_kid,
                "new_key_id": rec_kid,
                "reason": "suspected_compromise",
                "mode": "recovery",
                "note": "old key revoked"
            }
        },
        "links": empty_links,
        "signing": {"algorithm": "ed25519", "public_key": rec_pub_b64, "signature": ""}
    }
    e4s = sign_event(e4, rec_priv)

    # =========================================================
    # FIXTURE 5: Key reactivation (rec -> old, bringing old back)
    # Expected: VERIFIED_WITH_FLAGS (KEY_REACTIVATION)
    # Note: old_kid was rotated away in e2, now returns as new_key_id
    # =========================================================
    e5 = {
        "schema_version": "0.1",
        "event_id": "55555555-5555-5555-5555-555555555555",
        "occurred_at": "2026-02-15T14:00:00Z",
        "actor": {"type": "system", "id": old_kid},  # signed by reactivated key
        "intent": "Restore original signing key from secure backup",
        "action": "witness.rotate_key",
        "inputs": [],
        "outputs": [],
        "context": {
            "tool": "witness-cli",
            "tool_version": "0.1.0",
            "rotation": {
                "old_key_id": rec_kid,
                "new_key_id": old_kid,  # old_kid returns!
                "reason": "policy",
                "mode": "continuity",  # signed by old (which is the new key here)
                "note": "restoring original key from backup"
            }
        },
        "links": empty_links,
        "signing": {"algorithm": "ed25519", "public_key": old_pub_b64, "signature": ""}
    }
    # This is mode=continuity, so it should be signed by the OLD key (rec_kid)
    # But we're demonstrating reactivation, so let's sign properly with rec
    # Actually, for continuity mode, should be signed by old_key (rec)
    e5_continuity = json.loads(json.dumps(e5))
    e5_continuity["signing"]["public_key"] = rec_pub_b64
    e5_continuity["actor"]["id"] = rec_kid
    e5s = sign_event(e5_continuity, rec_priv)

    # =========================================================
    # FIXTURE 6: Rotation with wrong actor.type (human instead of system)
    # Expected: VERIFIED_WITH_FLAGS (ROTATION_ACTOR_TYPE_UNEXPECTED)
    # =========================================================
    e6 = {
        "schema_version": "0.1",
        "event_id": "66666666-6666-6666-6666-666666666666",
        "occurred_at": "2026-02-20T10:00:00Z",
        "actor": {"type": "human", "id": old_kid},  # WRONG: should be "system"
        "intent": "Manual key rotation by administrator",
        "action": "witness.rotate_key",
        "inputs": [],
        "outputs": [],
        "context": {
            "tool": "witness-cli",
            "tool_version": "0.1.0",
            "rotation": {
                "old_key_id": old_kid,
                "new_key_id": new_kid,
                "reason": "policy",
                "mode": "continuity",
                "note": "admin-initiated rotation"
            }
        },
        "links": empty_links,
        "signing": {"algorithm": "ed25519", "public_key": old_pub_b64, "signature": ""}
    }
    e6s = sign_event(e6, old_priv)

    # === Write individual fixtures ===
    write_json(OUTDIR / "event.normal.v0.1.golden.json", e1s)
    write_json(OUTDIR / "event.rotate.continuity.v0.1.golden.json", e2s)
    write_json(OUTDIR / "event.backdated.temporal_anomaly.v0.1.golden.json", e3s)
    write_json(OUTDIR / "event.rotate.recovery.v0.1.golden.json", e4s)
    write_json(OUTDIR / "event.rotate.reactivation.v0.1.golden.json", e5s)
    write_json(OUTDIR / "event.rotate.wrong_actor_type.v0.1.golden.json", e6s)

    # === Write JSONL export (chronological order) ===
    events_chronological = [e1s, e2s, e3s, e4s, e5s, e6s]
    export_path = OUTDIR / "export.v0.1.golden.jsonl"
    export_path.write_bytes(
        b"\n".join(canon(e) for e in events_chronological) + b"\n"
    )

    # === Write expected flags manifest ===
    # exit_code: 0 = VERIFIED (no flags), 2 = VERIFIED_WITH_FLAGS, 3 = FAILED_CRYPTO
    expected_flags = {
        "schema_version": "0.1",
        "fixtures": {
            "event.normal.v0.1.golden.json": {
                "status": "VERIFIED",
                "flags": [],
                "exit_code": 0
            },
            "event.rotate.continuity.v0.1.golden.json": {
                "status": "VERIFIED",
                "flags": [],
                "exit_code": 0
            },
            "event.backdated.temporal_anomaly.v0.1.golden.json": {
                "status": "VERIFIED_WITH_FLAGS",
                "flags": ["TEMPORAL_ANOMALY_AFTER_ROTATION"],
                "exit_code": 2
            },
            "event.rotate.recovery.v0.1.golden.json": {
                "status": "VERIFIED_WITH_FLAGS",
                "flags": ["CONTINUITY_BROKEN"],
                "exit_code": 2
            },
            "event.rotate.reactivation.v0.1.golden.json": {
                "status": "VERIFIED_WITH_FLAGS",
                "flags": ["KEY_REACTIVATION"],
                "exit_code": 2
            },
            "event.rotate.wrong_actor_type.v0.1.golden.json": {
                "status": "VERIFIED_WITH_FLAGS",
                "flags": ["ROTATION_ACTOR_TYPE_UNEXPECTED"],
                "exit_code": 2
            }
        }
    }
    write_json(OUTDIR / "expected_flags.json", expected_flags)

    # === Print summary ===
    print("=== Key IDs ===")
    print(f"old_kid: {old_kid}")
    print(f"new_kid: {new_kid}")
    print(f"rec_kid: {rec_kid}")
    print()
    print("=== Public Keys (base64) ===")
    print(f"old_pub: {old_pub_b64}")
    print(f"new_pub: {new_pub_b64}")
    print(f"rec_pub: {rec_pub_b64}")
    print()
    print("=== Generated Files ===")
    for f in sorted(OUTDIR.glob("*")):
        print(f"  {f.name}")
    print()
    print("=== Expected Flags ===")
    for name, info in expected_flags["fixtures"].items():
        flags = ", ".join(info["flags"]) if info["flags"] else "(none)"
        print(f"  {name}: {info['status']} [{flags}]")


if __name__ == "__main__":
    main()
