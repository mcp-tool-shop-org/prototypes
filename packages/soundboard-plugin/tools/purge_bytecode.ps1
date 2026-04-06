# purge_bytecode.ps1 — Delete all __pycache__ directories from source and cache
#
# Usage: powershell -ExecutionPolicy Bypass -File tools\purge_bytecode.ps1
#
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Cache = "$env:USERPROFILE\.claude\plugins\cache\soundboard-local\soundboard\1.0.0"

# Purge from source
Write-Host "Purging __pycache__ from source ($Root)..." -ForegroundColor Yellow
$sourceDirs = Get-ChildItem -Path $Root -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue
$sourceCount = ($sourceDirs | Measure-Object).Count
if ($sourceCount -gt 0) {
    $sourceDirs | Remove-Item -Recurse -Force
    Write-Host "  Purged $sourceCount directories" -ForegroundColor Green
} else {
    Write-Host "  None found" -ForegroundColor Gray
}

# Purge from cache
if (Test-Path $Cache) {
    Write-Host "Purging __pycache__ from cache ($Cache)..." -ForegroundColor Yellow
    $cacheDirs = Get-ChildItem -Path $Cache -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue
    $cacheCount = ($cacheDirs | Measure-Object).Count
    if ($cacheCount -gt 0) {
        $cacheDirs | Remove-Item -Recurse -Force
        Write-Host "  Purged $cacheCount directories" -ForegroundColor Green
    } else {
        Write-Host "  None found" -ForegroundColor Gray
    }
} else {
    Write-Host "Cache not found at $Cache, skipping" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
