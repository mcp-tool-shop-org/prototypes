#!/bin/bash
# Verify all example workspaces in sequence.
# Usage: bash scripts/verify-all.sh
# Exit code 0 = all passed, non-zero = at least one failed.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FAILED=0
PASSED=0

run_example() {
  local name="$1"
  local dir="$ROOT_DIR/$name"
  local script="$dir/scripts/verify.sh"

  if [ ! -f "$script" ]; then
    echo "[SKIP] $name — no verify.sh"
    return
  fi

  echo "=== Verifying: $name ==="
  if (cd "$dir" && bash scripts/verify.sh); then
    echo "[PASS] $name"
    PASSED=$((PASSED + 1))
  else
    echo "[FAIL] $name"
    FAILED=$((FAILED + 1))
  fi
  echo
}

echo "mcp-examples — verify all workspaces"
echo "======================================"
echo

for dir in "$ROOT_DIR"/hello-*/; do
  [ -d "$dir" ] || continue
  run_example "$(basename "$dir")"
done

echo "======================================"
echo "Results: $PASSED passed, $FAILED failed"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
