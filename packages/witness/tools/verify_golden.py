#!/usr/bin/env python3
"""
Verify Witness v0.1 golden fixtures.

Checks:
- event_digest matches sha256(canonical(event without integrity, with signing.signature=""))
- signature verifies using signing.public_key over the same canonical bytes
- emits a short summary and exits non-zero on any failure

Requires:
  pip install cryptography
"""

from __future__ import annotations

import base64
import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.exceptions import InvalidSignature


GOLDEN_DIR = Path("tests/fixtures/golden")

# All golden event fixtures (update when adding new ones)
GOLDEN_FILES = [
    "event.normal.v0.1.golden.json",
    "event.rotate.continuity.v0.1.golden.json",
    "event.backdated.temporal_anomaly.v0.1.golden.json",
    "event.rotate.recovery.v0.1.golden.json",
    "event.rotate.reactivation.v0.1.golden.json",
    "event.rotate.wrong_actor_type.v0.1.golden.json",
]

EXPORT_FILE = "export.v0.1.golden.jsonl"


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


def require(condition: bool, msg: str) -> None:
    if not condition:
        raise AssertionError(msg)


def normalize_for_signing(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare event for digest/signature computation per LOCKED signing rule:
    - Remove "integrity" entirely
    - Set signing.signature = ""
    """
    core = json.loads(json.dumps(event))  # Deep copy
    core.pop("integrity", None)
    core.setdefault("signing", {})
    core["signing"]["signature"] = ""
    return core


def parse_sha256_field(value: str) -> str:
    """Extract and validate hex from sha256: prefixed string."""
    require(value.startswith("sha256:"), f"Expected sha256: prefix, got: {value!r}")
    hexpart = value.split(":", 1)[1]
    require(len(hexpart) == 64, f"Expected 64 hex chars, got {len(hexpart)}")
    require(all(c in "0123456789abcdef" for c in hexpart), "Digest must be lowercase hex")
    return hexpart


@dataclass
class VerifyResult:
    path: Path
    ok: bool
    error: str | None = None


def verify_event_json(path: Path) -> VerifyResult:
    """Verify a single event JSON file."""
    try:
        raw = path.read_text(encoding="utf-8")
        event = json.loads(raw)

        # Minimal structural checks
        require(event.get("schema_version") == "0.1", "schema_version must be '0.1'")
        signing = event.get("signing") or {}
        integrity = event.get("integrity") or {}
        require(signing.get("algorithm") == "ed25519", "signing.algorithm must be 'ed25519'")
        require("public_key" in signing, "signing.public_key missing")
        require("signature" in signing, "signing.signature missing")
        require("event_digest" in integrity, "integrity.event_digest missing")

        # Recompute digest from normalized core
        core = normalize_for_signing(event)
        core_bytes = canon(core)
        computed_digest = sha256_hex(core_bytes)
        stored_digest = parse_sha256_field(integrity["event_digest"])
        require(
            computed_digest == stored_digest,
            f"Digest mismatch: computed={computed_digest} stored={stored_digest}"
        )

        # Verify signature
        pub_bytes = base64.b64decode(signing["public_key"])
        sig_bytes = base64.b64decode(signing["signature"])
        pub = Ed25519PublicKey.from_public_bytes(pub_bytes)
        try:
            pub.verify(sig_bytes, core_bytes)
        except InvalidSignature:
            raise AssertionError("Invalid Ed25519 signature")

        return VerifyResult(path=path, ok=True)
    except Exception as e:
        return VerifyResult(path=path, ok=False, error=str(e))


def verify_event_object(event: Dict[str, Any], label: str) -> VerifyResult:
    """Verify an event object (for JSONL lines)."""
    try:
        signing = event.get("signing") or {}
        integrity = event.get("integrity") or {}

        require(event.get("schema_version") == "0.1", "schema_version must be '0.1'")
        require(signing.get("algorithm") == "ed25519", "signing.algorithm must be 'ed25519'")
        require("public_key" in signing, "signing.public_key missing")
        require("signature" in signing, "signing.signature missing")
        require("event_digest" in integrity, "integrity.event_digest missing")

        core = normalize_for_signing(event)
        core_bytes = canon(core)
        computed_digest = sha256_hex(core_bytes)
        stored_digest = parse_sha256_field(integrity["event_digest"])
        require(computed_digest == stored_digest, "digest mismatch")

        pub_bytes = base64.b64decode(signing["public_key"])
        sig_bytes = base64.b64decode(signing["signature"])
        pub = Ed25519PublicKey.from_public_bytes(pub_bytes)
        pub.verify(sig_bytes, core_bytes)

        return VerifyResult(path=Path(label), ok=True)
    except Exception as e:
        return VerifyResult(path=Path(label), ok=False, error=str(e))


def verify_export_jsonl(path: Path) -> List[VerifyResult]:
    """Verify each line in a JSONL export file."""
    results: List[VerifyResult] = []

    if not path.exists():
        return [VerifyResult(path=path, ok=False, error="export file missing")]

    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines:
        return [VerifyResult(path=path, ok=False, error="export jsonl is empty")]

    for i, line in enumerate(lines, start=1):
        label = f"{path.name}:line{i}"
        try:
            event = json.loads(line)
        except Exception as e:
            results.append(VerifyResult(path=Path(label), ok=False, error=f"invalid JSON: {e}"))
            continue

        results.append(verify_event_object(event, label))

    return results


def main() -> int:
    failures: List[VerifyResult] = []
    successes: int = 0

    print("=== Witness Golden Fixture Verification ===\n")

    # Verify individual golden events
    print("Individual events:")
    for name in GOLDEN_FILES:
        p = GOLDEN_DIR / name
        if not p.exists():
            res = VerifyResult(path=p, ok=False, error="missing file")
        else:
            res = verify_event_json(p)

        if res.ok:
            print(f"  PASS {name}")
            successes += 1
        else:
            print(f"  FAIL {name}: {res.error}")
            failures.append(res)

    # Verify export jsonl
    print(f"\nExport file ({EXPORT_FILE}):")
    export_path = GOLDEN_DIR / EXPORT_FILE
    export_results = verify_export_jsonl(export_path)

    export_ok = 0
    for r in export_results:
        if r.ok:
            export_ok += 1
        else:
            failures.append(r)

    if export_results and all(r.ok for r in export_results):
        print(f"  PASS {len(export_results)} lines verified")
    else:
        for r in export_results:
            if not r.ok:
                print(f"  FAIL {r.path}: {r.error}")

    # Summary
    print()
    if failures:
        print(f"FAILED: {len(failures)} verification error(s)")
        return 1

    total = successes + export_ok
    print(f"SUCCESS: {total} events verified ({successes} files + {export_ok} export lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
