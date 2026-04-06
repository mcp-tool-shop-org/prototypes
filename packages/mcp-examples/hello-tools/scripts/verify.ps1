# Verify hello-tools workspace is working (Windows)

$ErrorActionPreference = "Stop"

Write-Host "=== Hello Tools Verification ===" -ForegroundColor Cyan
Write-Host

Write-Host "1. Testing echo tool..." -ForegroundColor Yellow
python -m tools.echo.main "Hello from verify.ps1"
Write-Host "✓ Echo works" -ForegroundColor Green
Write-Host

Write-Host "2. Testing http-get stub mode..." -ForegroundColor Yellow
python -m tools.http_get.main https://example.com | Select-Object -First 3
Write-Host "✓ Stub mode works" -ForegroundColor Green
Write-Host

Write-Host "3. Testing http-get real mode..." -ForegroundColor Yellow
$env:ALLOW_NETWORK = "1"
python -m tools.http_get.main https://httpbin.org/get | Select-Object -First 5
Remove-Item Env:ALLOW_NETWORK
Write-Host "✓ Real mode works" -ForegroundColor Green
Write-Host

Write-Host "=== All checks passed ===" -ForegroundColor Cyan
