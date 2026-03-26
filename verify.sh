#!/usr/bin/env bash
# verify.sh — Validate prototypes monorepo structure and per-package hygiene
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PACKAGES_DIR="$REPO_ROOT/packages"
errors=0

echo "=== Prototypes Monorepo Verification ==="
echo ""

# Root structure checks
echo "--- Root Structure ---"
for f in package.json pnpm-workspace.yaml turbo.json tsconfig.base.json LICENSE SECURITY.md README.md; do
  if [ -f "$REPO_ROOT/$f" ]; then
    echo "  [OK] $f"
  else
    echo "  [FAIL] $f missing"
    errors=$((errors + 1))
  fi
done

echo ""
echo "--- Per-Package Checks ---"

for pkg_dir in "$PACKAGES_DIR"/*/; do
  pkg_name=$(basename "$pkg_dir")
  pkg_json="$pkg_dir/package.json"

  if [ ! -f "$pkg_json" ]; then
    echo "  [$pkg_name] FAIL: no package.json"
    errors=$((errors + 1))
    continue
  fi

  version=$(cd "$PACKAGES_DIR" && node -p "JSON.parse(require('fs').readFileSync('$pkg_name/package.json','utf8')).version" 2>/dev/null || echo "unknown")
  has_readme=$( [ -f "$pkg_dir/README.md" ] && echo "yes" || echo "no" )
  has_license=$( [ -f "$pkg_dir/LICENSE" ] && echo "yes" || echo "no" )
  is_private=$(cd "$PACKAGES_DIR" && node -p "JSON.parse(require('fs').readFileSync('$pkg_name/package.json','utf8')).private===true?'yes':'no'" 2>/dev/null || echo "unknown")

  status="OK"
  notes=""

  if [ "$has_readme" = "no" ]; then
    notes="$notes missing-README"
    status="WARN"
  fi
  if [ "$has_license" = "no" ]; then
    notes="$notes missing-LICENSE"
    status="WARN"
  fi

  echo "  [$status] $pkg_name v$version (private=$is_private)${notes:+ — $notes}"
done

echo ""

if [ "$errors" -gt 0 ]; then
  echo "RESULT: $errors error(s) found"
  exit 1
else
  echo "RESULT: All checks passed"
  exit 0
fi
