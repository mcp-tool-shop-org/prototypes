# sync_cache.ps1 — Copy source to Claude Code plugin cache, purge __pycache__
#
# Usage: powershell -ExecutionPolicy Bypass -File tools\sync_cache.ps1
#
$ErrorActionPreference = "Stop"

$Source = Split-Path -Parent $PSScriptRoot
$Cache = "$env:USERPROFILE\.claude\plugins\cache\soundboard-local\soundboard\1.0.0"

if (-not (Test-Path "$Source\voice_soundboard_plugin")) {
    Write-Error "Source not found at $Source\voice_soundboard_plugin"
    exit 1
}

if (-not (Test-Path $Cache)) {
    Write-Error "Cache not found at $Cache"
    exit 1
}

Write-Host "Source: $Source" -ForegroundColor Cyan
Write-Host "Cache:  $Cache" -ForegroundColor Cyan
Write-Host ""

# Sync voice_soundboard_plugin package
Write-Host "Syncing voice_soundboard_plugin..." -ForegroundColor Yellow
robocopy "$Source\voice_soundboard_plugin" "$Cache\voice_soundboard_plugin" /MIR /XD __pycache__ /NFL /NDL /NJH /NJS /NP
Write-Host ""

# Purge __pycache__ from cache
Write-Host "Purging __pycache__..." -ForegroundColor Yellow
$dirs = Get-ChildItem -Path $Cache -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue
$count = ($dirs | Measure-Object).Count
if ($count -gt 0) {
    $dirs | Remove-Item -Recurse -Force
    Write-Host "  Purged $count __pycache__ directories" -ForegroundColor Green
} else {
    Write-Host "  No __pycache__ to purge" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done. Restart the plugin/MCP server to pick up changes." -ForegroundColor Green
