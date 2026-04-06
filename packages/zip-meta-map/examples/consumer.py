#!/usr/bin/env python3
"""Consumer reference: read META_ZIP_INDEX.json and execute a traversal plan.

This script demonstrates how an AI agent or tool can consume the index
to navigate a codebase with byte budgets and capability checks.

Usage:
    python consumer.py path/to/META_ZIP_INDEX.json [plan_name]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def load_index(path: Path) -> dict:
    """Load and minimally validate a META_ZIP_INDEX.json."""
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data.get("format") == "zip-meta-map", f"Not a zip-meta-map index: {data.get('format')}"
    return data


def check_capabilities(index: dict, required: list[str]) -> list[str]:
    """Check which required capabilities are missing."""
    caps = set(index.get("capabilities", []))
    return [r for r in required if r not in caps]


def execute_plan(index: dict, plan_name: str, root: Path | None = None) -> None:
    """Walk a traversal plan, respecting byte budgets."""
    plans = index.get("plans", {})
    if plan_name not in plans:
        print(f"Plan '{plan_name}' not found. Available: {', '.join(plans.keys())}")
        return

    plan = plans[plan_name]
    budget = plan.get("max_total_bytes", 0)
    file_map = {f["path"]: f for f in index["files"]}
    bytes_read = 0

    print(f"Plan: {plan_name}")
    print(f"  {plan['description']}")
    print(f"  Budget: {budget:,} bytes" if budget else "  Budget: unlimited")
    print()

    for i, step in enumerate(plan["steps"], 1):
        print(f"  Step {i}: {step}")

        # If step references a file, simulate reading it
        for path, entry in file_map.items():
            if path in step:
                size = entry["size_bytes"]
                if budget and bytes_read + size > budget:
                    print(f"    -> SKIP {path} ({size:,} bytes) — would exceed budget")
                    continue
                bytes_read += size
                role = entry["role"]
                conf = entry["confidence"]
                print(f"    -> READ {path} ({size:,} bytes, role={role}, conf={conf})")

                # Show excerpt if available
                if entry.get("excerpt"):
                    lines = entry["excerpt"].split("\n")
                    preview = lines[0][:80] if lines else ""
                    print(f"       Preview: {preview}...")

    print()
    print(f"  Total bytes read: {bytes_read:,}" + (f" / {budget:,} budget" if budget else ""))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    index_path = Path(sys.argv[1])
    plan_name = sys.argv[2] if len(sys.argv) > 2 else "overview"

    if not index_path.exists():
        print(f"Error: {index_path} does not exist")
        return 1

    index = load_index(index_path)

    # Print summary
    print(f"Profile: {index['profile']}")
    print(f"Files:   {len(index['files'])}")
    print(f"Version: {index['version']}")
    caps = index.get("capabilities", [])
    if caps:
        print(f"Caps:    {', '.join(caps)}")
    print()

    # Check for capabilities we'd like
    missing = check_capabilities(index, ["excerpts", "modules", "risk_flags"])
    if missing:
        print(f"Note: missing capabilities: {', '.join(missing)}")
        print()

    # Start here
    print("Start here:")
    file_map = {f["path"]: f for f in index["files"]}
    for path in index["start_here"]:
        entry = file_map.get(path, {})
        reason = entry.get("reason", "")
        print(f"  {path}" + (f"  ({reason})" if reason else ""))
    print()

    # Execute plan
    execute_plan(index, plan_name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
