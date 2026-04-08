#!/usr/bin/env bash
# verify.sh — Run tests across all nexus-suite packages
# Usage: bash verify.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

cd "$(dirname "$0")"

FAIL=0
PASS=0
PACKAGES=(
  "src/nexus-router"
  "src/nexus-router-adapter-stdout"
  "src/nexus-router-adapter-http"
  "src/nexus-attest"
  "src/nexus-control"
)

echo "=== nexus-suite verify ==="
echo ""

for pkg in "${PACKAGES[@]}"; do
  name=$(basename "$pkg")
  if [ ! -d "$pkg" ]; then
    echo -e "  ${RED}✗${NC} $name — directory not found"
    FAIL=$((FAIL + 1))
    continue
  fi

  # Check pyproject.toml exists
  if [ ! -f "$pkg/pyproject.toml" ]; then
    echo -e "  ${RED}✗${NC} $name — missing pyproject.toml"
    FAIL=$((FAIL + 1))
    continue
  fi

  # Install in dev mode + run tests
  echo -n "  [$name] installing... "
  if pip install -e "$pkg" --quiet 2>/dev/null; then
    echo -n "testing... "
    test_dir="$pkg/tests"
    if [ -d "$test_dir" ]; then
      if python -m pytest "$test_dir" -q --no-header 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        PASS=$((PASS + 1))
      else
        echo -e "${RED}FAIL${NC}"
        FAIL=$((FAIL + 1))
      fi
    else
      echo -e "${GREEN}✓${NC} (no tests)"
      PASS=$((PASS + 1))
    fi
  else
    echo -e "${RED}install failed${NC}"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "==============================="
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}FAIL${NC}: $PASS passed, $FAIL failed"
  exit 1
else
  echo -e "${GREEN}PASS${NC}: $PASS/$PASS packages verified"
  exit 0
fi
