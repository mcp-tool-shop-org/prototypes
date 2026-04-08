#!/usr/bin/env bash
set -euo pipefail

echo "=== Build ==="
pnpm -r build

echo "=== Test ==="
pnpm -r test

echo "=== CLI smoke ==="
node packages/cli/dist/bin.js --help
node packages/cli/dist/bin.js --version

echo "=== All checks passed ==="
