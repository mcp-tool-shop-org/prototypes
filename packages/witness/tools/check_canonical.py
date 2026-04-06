#!/usr/bin/env python3
"""
Check that golden fixtures are canonical JSON (not prettified).

This catches accidental reformatting of golden files.
If a file has been prettified, the fix is to regenerate with gen_golden.py.

Exit codes:
  0 - All files are canonical
  1 - One or more files are not canonical
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


GOLDEN_DIR = Path("tests/fixtures/golden")

# Files that must be canonical JSON
CANONICAL_FILES = [
    "event.normal.v0.1.golden.json",
    "event.rotate.continuity.v0.1.golden.json",
    "event.backdated.temporal_anomaly.v0.1.golden.json",
    "event.rotate.recovery.v0.1.golden.json",
    "event.rotate.reactivation.v0.1.golden.json",
    "event.rotate.wrong_actor_type.v0.1.golden.json",
    "expected_flags.json",
]


def canon(obj: object) -> bytes:
    """Canonical JSON serialization. Must match gen_golden.py exactly."""
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False
    ).encode("utf-8")


def check_canonical(path: Path) -> tuple[bool, str]:
    """
    Check if a file is canonical JSON.

    Returns (is_canonical, message).
    """
    if not path.exists():
        return False, "file missing"

    raw = path.read_bytes()

    # Canonical files should end with exactly one newline
    if not raw.endswith(b"\n"):
        return False, "missing trailing newline"

    content = raw.rstrip(b"\n")

    # Check for extra newlines
    if b"\n" in content:
        return False, "contains internal newlines (prettified?)"

    # Parse and re-canonicalize
    try:
        obj = json.loads(content)
    except json.JSONDecodeError as e:
        return False, f"invalid JSON: {e}"

    expected = canon(obj)

    if content != expected:
        # Find first difference for debugging
        for i, (a, b) in enumerate(zip(content, expected)):
            if a != b:
                return False, f"not canonical at byte {i}: got {chr(a)!r}, expected {chr(b)!r}"
        if len(content) != len(expected):
            return False, f"length mismatch: {len(content)} vs {len(expected)}"
        return False, "content differs from canonical form"

    return True, "ok"


def main() -> int:
    print("=== Canonical JSON Check ===\n")

    failures: list[tuple[str, str]] = []

    for name in CANONICAL_FILES:
        path = GOLDEN_DIR / name
        is_ok, msg = check_canonical(path)

        if is_ok:
            print(f"  OK   {name}")
        else:
            print(f"  FAIL {name}: {msg}")
            failures.append((name, msg))

    print()

    if failures:
        print(f"FAILED: {len(failures)} file(s) are not canonical")
        print()
        print("Do not prettify golden fixtures.")
        print("Regenerate with: python tools/gen_golden.py")
        return 1

    print(f"SUCCESS: {len(CANONICAL_FILES)} files are canonical")
    return 0


if __name__ == "__main__":
    sys.exit(main())
