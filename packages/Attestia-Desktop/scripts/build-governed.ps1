# build-governed.ps1
# Runs a governed build using build-governor to prevent memory exhaustion.
#
# Usage:
#   .\scripts\build-governed.ps1 [-Configuration "Debug"] [-Platform "x64"]
#
param(
    [string]$Configuration = "Debug",
    [string]$Platform = "x64",
    [string]$GovernorRoot = "F:\AI\build-governor"
)

$ErrorActionPreference = "Stop"

$govExe = Join-Path $GovernorRoot "bin\cli\gov.exe"
$slnPath = Join-Path $PSScriptRoot "..\Attestia.Desktop.sln"

if (!(Test-Path $govExe)) {
    Write-Warning "Build governor not found at $govExe. Running ungoverned build."
    & dotnet build $slnPath -c $Configuration -p:Platform=$Platform
    exit $LASTEXITCODE
}

Write-Host "Starting governed build ($Configuration|$Platform)..."
& $govExe run -- dotnet build $slnPath -c $Configuration -p:Platform=$Platform
exit $LASTEXITCODE
