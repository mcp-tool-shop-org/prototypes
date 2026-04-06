#!/bin/bash
# Verify hello-filesystem workspace is working

set -e

echo "=== Hello Filesystem Verification ==="
echo

echo "1. Testing stub mode (no writes)..."
python -m tools.file_write.main test.txt "stub content" | head -3
echo "✓ Stub mode works"
echo

echo "2. Testing sandbox mode..."
ALLOW_WRITE=1 python -m tools.file_write.main test.txt "sandbox content"
if [ -f sandbox/test.txt ]; then
    echo "✓ Sandbox write works: $(cat sandbox/test.txt)"
else
    echo "✗ Sandbox write failed"
    exit 1
fi
echo

echo "3. Testing sandbox path restriction..."
ALLOW_WRITE=1 python -m tools.file_write.main ../../../evil.txt "should be sandboxed"
if [ -f sandbox/evil.txt ]; then
    echo "✓ Path traversal blocked (wrote to sandbox/evil.txt)"
    rm sandbox/evil.txt
else
    echo "✗ Path restriction failed"
    exit 1
fi

# Cleanup
rm -f sandbox/test.txt

echo
echo "=== All checks passed ==="
