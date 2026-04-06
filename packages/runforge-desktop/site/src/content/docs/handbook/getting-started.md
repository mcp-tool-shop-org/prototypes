---
title: Getting Started
description: Install RunForge Desktop and launch your first training run.
sidebar:
  order: 1
---

RunForge Desktop is a Windows-native application for creating, monitoring, and inspecting ML training runs. Everything runs locally — no cloud, no telemetry, no accounts.

## System requirements

| Requirement | Value |
|-------------|-------|
| OS | Windows 10 (1809+) or Windows 11 |
| Architecture | x64 |
| Runtime | .NET 10 (bundled in MSIX) |
| Python | 3.10+ (for training) |
| GPU | Optional (CUDA for GPU training) |
| Disk Space | ~100 MB |

## Install from MSIX release (recommended)

The simplest way to get started:

1. Download the latest `.msix` file from [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Double-click to install — Windows handles everything
3. Launch from the Start Menu

The MSIX package is self-contained: it bundles the .NET runtime so you don't need to install it separately. Installation and uninstallation are clean, isolated, and reversible.

## Build from source

If you prefer to build from source, you'll need the .NET 10 SDK and Visual Studio 2022 (17.12+) with the MAUI workload:

```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

See [docs/INSTALL.md](https://github.com/mcp-tool-shop-org/runforge-desktop/blob/main/docs/INSTALL.md) for detailed installation options including release builds and MSIX packaging from source.

## Your first training run

Once RunForge Desktop is running:

1. **Select Workspace** — click "Select Workspace" and choose a folder for your ML experiments. This is where all run artifacts will be stored.
2. **Start Training** — click "Train" to open the training configuration dialog. Choose an epoch preset (Quick, Standard, Extended, or Custom), select GPU or CPU, and adjust advanced settings if needed.
3. **Monitor Live** — watch training progress with real-time loss charts and streaming logs. You can cancel at any time.
4. **Browse Runs** — once training completes, browse all runs with filtering by status (Pending, Running, Completed, Failed, Cancelled).
5. **Inspect Results** — click any run to view its metrics, logs, and artifacts. Open the output folder or copy the training command for reproducibility.

All artifacts are written to the `.ml/runs/` directory inside your workspace. Each run gets its own timestamped folder containing `run.json` (manifest), `metrics.jsonl` (live metrics), `stdout.log`, and `stderr.log`.

## Python and PyTorch

RunForge Desktop spawns Python processes to execute training. The bundled runner script uses PyTorch to train a simple CNN on synthetic data.

**Minimum requirements:**

- Python 3.10 or later (installed from [python.org](https://www.python.org/) or the Microsoft Store)
- PyTorch (`pip install torch`) — required for actual training runs

RunForge auto-discovers Python on your system. If it finds the wrong version or you use a virtual environment, go to **Settings** and set a manual Python path override.

If Python is not detected, the app will show a clear error message explaining what to install and where to get it.
