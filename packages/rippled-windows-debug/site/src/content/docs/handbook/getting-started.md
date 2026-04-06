---
title: Getting Started
description: Set up build protection and run your first protected build.
sidebar:
  order: 1
---

The fastest way to protect your rippled builds from OOM crashes.

## Prerequisites

Before setup, make sure you have:

- **Visual Studio 2022** Build Tools (or full VS2022) -- provides `cl.exe`
- **.NET 9.0 SDK** -- the build governor is a .NET application

The setup script builds the governor from source, so .NET SDK is required.

## One-time setup

Clone the toolkit and run the governor setup script:

```powershell
git clone https://github.com/mcp-tool-shop-org/rippled-windows-debug.git
cd rippled-windows-debug

.\scripts\setup-governor.ps1
```

No admin rights required. The script:

1. Builds the governor service and compiler wrappers using `dotnet publish`
2. Publishes self-contained binaries to `tools/build-governor/bin/`
3. Adds the wrapper directory to your user PATH

## Build with protection

Restart your terminal (so PATH changes take effect), then build rippled normally:

```powershell
cmake --build build --parallel 16
```

The governor monitors commit charge and throttles `cl.exe` processes automatically. If memory pressure rises, it slows down the build instead of letting it crash.

## What you get

After setup, every build using `cmake`, `msbuild`, or `ninja` is automatically protected. The governor:

- Auto-starts on first compilation (the `cl.exe` wrapper starts it)
- Monitors commit charge (not free RAM -- see [Build Governor](/rippled-windows-debug/handbook/build-governor/) for why)
- Throttles parallel processes when pressure rises
- Provides actionable diagnostics like "Memory pressure detected, recommend -j4"
- Auto-shuts down after 30 minutes of idle

## Verify the setup

After restarting your terminal, confirm the wrapper is in PATH:

```powershell
Get-Command cl.exe | Select-Object Source
```

The path should contain `build-governor\bin\wrappers`. If it points to the real MSVC `cl.exe` instead, re-run the setup script and restart your terminal.

## Next steps

- Learn [how the governor works](/rippled-windows-debug/handbook/build-governor/)
- Add [crash handlers](/rippled-windows-debug/handbook/crash-handlers/) for when crashes do happen
- Set up the [full build environment](/rippled-windows-debug/handbook/building-rippled/)
