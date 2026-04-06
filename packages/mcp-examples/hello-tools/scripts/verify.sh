#!/bin/bash
# Verify hello-tools workspace is working

set -e

echo "=== Hello Tools Verification ==="
echo

echo "1. Testing echo tool..."
python -m tools.echo.main "Hello from verify.sh"
echo "✓ Echo works"
echo

echo "2. Testing http-get stub mode..."
python -m tools.http_get.main https://example.com | head -3
echo "✓ Stub mode works"
echo

echo "3. Testing http-get real mode..."
ALLOW_NETWORK=1 python -m tools.http_get.main https://httpbin.org/get | head -5
echo "✓ Real mode works"
echo

echo "=== All checks passed ==="
