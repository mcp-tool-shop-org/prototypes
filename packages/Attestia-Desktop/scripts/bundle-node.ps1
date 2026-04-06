# bundle-node.ps1
# Downloads Node.js Windows x64 binary and copies Attestia server build
# into the expected assets/node/ structure for the MAUI app.
#
# Usage:
#   .\scripts\bundle-node.ps1 [-NodeVersion "22.14.0"] [-AttestiaRoot "..\Attestia"]
#
param(
    [string]$NodeVersion = "22.14.0",
    [string]$AttestiaRoot = "",
    [string]$OutputDir = "$PSScriptRoot\..\assets\node"
)

$ErrorActionPreference = "Stop"

$nodeZipUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "attestia-node-bundle"
$zipPath = Join-Path $tempDir "node.zip"

# Ensure output dir
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Download Node.js if not already cached
Write-Host "Downloading Node.js v$NodeVersion..."
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

if (!(Test-Path $zipPath)) {
    Invoke-WebRequest -Uri $nodeZipUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Downloaded to $zipPath"
} else {
    Write-Host "Using cached download at $zipPath"
}

# Extract node.exe
Write-Host "Extracting node.exe..."
$extractDir = Join-Path $tempDir "node-v$NodeVersion-win-x64"
if (!(Test-Path $extractDir)) {
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
}

$nodeExeSrc = Join-Path $extractDir "node.exe"
$nodeExeDst = Join-Path $OutputDir "node.exe"
Copy-Item -Path $nodeExeSrc -Destination $nodeExeDst -Force
Write-Host "Copied node.exe -> $nodeExeDst"

# Copy Attestia server build if root is specified
if ($AttestiaRoot -and (Test-Path $AttestiaRoot)) {
    $serverDist = Join-Path $AttestiaRoot "packages\node\dist"
    if (Test-Path $serverDist) {
        $serverOutDir = Join-Path $OutputDir "server\dist"
        if (!(Test-Path $serverOutDir)) {
            New-Item -ItemType Directory -Path $serverOutDir -Force | Out-Null
        }
        Copy-Item -Path "$serverDist\*" -Destination $serverOutDir -Recurse -Force
        Write-Host "Copied server dist -> $serverOutDir"

        # Also copy node_modules for the server if they exist
        $serverNodeModules = Join-Path $AttestiaRoot "packages\node\node_modules"
        if (Test-Path $serverNodeModules) {
            $nmOutDir = Join-Path $OutputDir "server\node_modules"
            Copy-Item -Path $serverNodeModules -Destination $nmOutDir -Recurse -Force
            Write-Host "Copied node_modules -> $nmOutDir"
        }
    } else {
        Write-Warning "Server dist not found at $serverDist. Build the Attestia node package first."
    }
} else {
    Write-Host "No AttestiaRoot specified. Skipping server copy (use system node fallback for dev)."
}

Write-Host "Bundle complete at $OutputDir"
