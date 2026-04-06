---
title: Getting Started
description: Install and run Attestia Desktop.
sidebar:
  order: 1
---

Attestia Desktop is a WinUI 3 application for financial intent verification with blockchain attestation.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| .NET SDK | 9.0+ |
| Node.js | 20+ (for the backend sidecar) |
| Windows | 10 1809+ (Windows 11 recommended) |
| Visual Studio | 2022 17.10+ with Windows App SDK workload |

## Install from source

```bash
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop
dotnet restore
dotnet build
dotnet test

# Run the desktop app
dotnet run --project src/Attestia.App -c Debug
```

## NuGet packages (without desktop app)

The three SDK packages work independently of the desktop app:

```bash
dotnet add package Attestia.Core      # Domain models
dotnet add package Attestia.Client    # HTTP client SDK
dotnet add package Attestia.Sidecar   # Node.js process manager
```

All target `net9.0` and work in console apps, ASP.NET services, or anywhere .NET 9+ runs.
