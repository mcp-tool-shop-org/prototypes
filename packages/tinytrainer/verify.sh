#!/usr/bin/env bash
set -euo pipefail

echo "=== Lint ==="
python -m ruff check src/ tests/

echo "=== Test ==="
python -m pytest tests/ -v --tb=short -m "not integration and not slow"

echo "=== Build ==="
python -m build

echo "=== All checks passed ==="
