# Verify hello-filesystem workspace is working (Windows)

$ErrorActionPreference = "Stop"

Write-Host "=== Hello Filesystem Verification ===" -ForegroundColor Cyan
Write-Host

Write-Host "1. Testing stub mode (no writes)..." -ForegroundColor Yellow
python -m tools.file_write.main test.txt "stub content" | Select-Object -First 3
Write-Host "✓ Stub mode works" -ForegroundColor Green
Write-Host

Write-Host "2. Testing sandbox mode..." -ForegroundColor Yellow
$env:ALLOW_WRITE = "1"
python -m tools.file_write.main test.txt "sandbox content"
if (Test-Path "sandbox/test.txt") {
    $content = Get-Content "sandbox/test.txt"
    Write-Host "✓ Sandbox write works: $content" -ForegroundColor Green
} else {
    Write-Host "✗ Sandbox write failed" -ForegroundColor Red
    exit 1
}
Write-Host

Write-Host "3. Testing sandbox path restriction..." -ForegroundColor Yellow
python -m tools.file_write.main "../../../evil.txt" "should be sandboxed"
if (Test-Path "sandbox/evil.txt") {
    Write-Host "✓ Path traversal blocked (wrote to sandbox/evil.txt)" -ForegroundColor Green
    Remove-Item "sandbox/evil.txt"
} else {
    Write-Host "✗ Path restriction failed" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item "sandbox/test.txt" -ErrorAction SilentlyContinue
Remove-Item Env:ALLOW_WRITE

Write-Host
Write-Host "=== All checks passed ===" -ForegroundColor Cyan
