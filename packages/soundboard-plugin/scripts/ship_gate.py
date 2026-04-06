#!/usr/bin/env python3
"""Ship gate — pre-release validation script.

Runs the test suite and dependency audit. Exit 0 = all clear.

Usage: python scripts/ship_gate.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys


def _run(name: str, cmd: list[str]) -> bool:
    """Run a check, return True on success."""
    print(f"\n{'=' * 60}")
    print(f"GATE: {name}")
    print(f"{'=' * 60}")
    result = subprocess.run(cmd)
    passed = result.returncode == 0
    print(f"  {'PASSED' if passed else 'FAILED'}: {name}")
    return passed


def main() -> None:
    failed: list[str] = []

    # 1. Test suite
    if not _run("pytest", [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"]):
        failed.append("pytest")

    # 2. Security battery
    if not _run("security battery", [sys.executable, "-m", "pytest", "tests/test_security.py", "-v", "--tb=short"]):
        failed.append("security battery")

    # 3. Dependency audit (optional — skip if pip-audit not installed)
    if shutil.which("pip-audit") or _can_import("pip_audit"):
        if not _run("pip-audit", [sys.executable, "-m", "pip_audit"]):
            failed.append("pip-audit")
    else:
        print(f"\n{'=' * 60}")
        print("GATE: pip-audit (SKIPPED — not installed)")
        print(f"{'=' * 60}")

    # Summary
    print(f"\n{'=' * 60}")
    if failed:
        print(f"SHIP GATE FAILED: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("SHIP GATE PASSED — clear for release")
        sys.exit(0)


def _can_import(module: str) -> bool:
    try:
        __import__(module)
        return True
    except ImportError:
        return False


if __name__ == "__main__":
    main()
