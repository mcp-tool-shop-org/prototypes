<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** is a Windows-native desktop application for creating, monitoring, and inspecting ML training runs.

It provides a visual control plane for ML experiments—creating runs, monitoring live training progress with real-time charts, and browsing completed runs with full artifact inspection.

> **Canonical upstream (artifacts, schemas, guarantees):**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## Why

Most ML experiment trackers are cloud-first, SaaS platforms that require accounts, send telemetry, and add complexity. RunForge Desktop takes the opposite approach: **everything runs locally on your machine**.

With RunForge Desktop you can:

- **Create** training runs with preset configurations
- **Monitor** live training with real-time charts and logs
- **Browse** completed runs and their outputs
- **Inspect** metrics, logs, and artifacts
- **Manage** runs (cancel, view outputs, copy commands)

All training runs locally on your machine using Python. No cloud. No telemetry. No accounts.

---

## NuGet Packages

| Package | Description |
|---------|-------------|
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Core domain models and services for ML training run management — run lifecycle, hyperparameter sweeps, live monitoring, and artifact inspection. |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## Quick Start

### Installation

**Option 1: MSIX Package (Recommended)**
1. Download the `.msix` file from [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Double-click to install
3. Launch from Start Menu

**Option 2: Build from Source**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

See [docs/INSTALL.md](docs/INSTALL.md) for detailed installation options.

### Usage

1. **Launch** RunForge Desktop
2. **Select Workspace** - Click "Select Workspace" and choose a folder for your ML experiments
3. **Start Training** - Click "Train" to configure and launch a training run
4. **Monitor Live** - Watch training progress with real-time loss charts and logs
5. **Browse Runs** - View all runs with filtering by status
6. **Inspect Details** - Click any run to view metrics, artifacts, and outputs

---

## Features

### Training Run Creation
- Configure training runs with epoch presets (Quick, Standard, Extended, Custom)
- GPU/CPU device selection with automatic detection
- Advanced settings: batch size, learning rate, optimizer, scheduler
- Optional custom dataset path

### Hyperparameter Sweeps (MultiRun)
- Run multiple experiments with different hyperparameter combinations
- Configure learning rates, batch sizes, and optimizers as comma-separated lists
- Automatic grid search across all combinations
- Track best-performing configuration by final loss

### Live Monitoring
- Real-time loss chart with automatic updates
- Live log streaming from training process
- Progress tracking (epoch, step, elapsed time)
- Cancel running training at any time

### Run Browsing
- Browse runs with newest-first ordering
- Filter by status: Pending, Running, Completed, Failed, Cancelled
- View run details and outputs

### Run Inspection
- **Metrics** - Loss curves, accuracy, training statistics
- **Logs** - Full stdout/stderr from training process
- **Artifacts** - Open output folder, copy training command

### Run Comparison
- Compare any two runs side-by-side
- View config differences, metric deltas, and artifact changes
- Compare child runs with their parent (rerun lineage)

### Data Export
- Export feature importance to CSV
- Export linear coefficients to CSV
- Export metrics to CSV
- Export full run summary to JSON

### Settings
- **Theme** — Dark (default), Light, or System. Instant switching, persisted across sessions
- **Python path** — Auto-discovery or manual override with validation
- **Training defaults** — Default device, epochs, batch size, learning rate
- **Custom directories** — Override logs and artifacts output paths
- **Verbose logging** — Enable detailed logging output

### Crash Recovery
- Automatic session state persistence to `%LOCALAPPDATA%\RunForge\`
- On unclean shutdown, offers to restore your previous workspace, page, and active run
- Orphaned running processes are detected and marked as failed on next launch
- Crash logs saved with full stack traces for debugging

### Diagnostics
- View app version, framework, and memory usage
- View workspace path and Python configuration
- Copy diagnostics to clipboard for support

---

## Core Principles

### Local-first
All training runs on your machine. No cloud required.

### Transparent
See exactly what's happening: live logs, real-time metrics, full process control.

### Simple
One workspace, clear presets, no configuration files to manage.

### Auditable
All run artifacts saved to disk for inspection and reproducibility.

---

## How It Works

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktop manages the full lifecycle: creation, execution, monitoring, and inspection.

---

## System Requirements

| Requirement | Value |
|-------------|-------|
| OS | Windows 10 (1809+) or Windows 11 |
| Architecture | x64 |
| Runtime | .NET 10 (bundled in MSIX) |
| Python | 3.10+ (for training) |
| GPU | Optional (CUDA for GPU training) |
| Disk Space | ~100 MB |

---

## Platform & Packaging

| Attribute | Value |
|-----------|-------|
| Platform | Windows 10/11 |
| UI framework | .NET MAUI |
| Packaging | MSIX (self-contained) |
| Install/uninstall | Clean, isolated, reversible |

The app follows standard Windows permission models for file access.

---

## Project Status

| Attribute | Value |
|-----------|-------|
| Current version | v1.0.0 |
| Scope | ML training, monitoring, and inspection |

See [CHANGELOG.md](CHANGELOG.md) for recent changes.

---

## Development

### Prerequisites

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) with MAUI workload, OR VS Code with .NET MAUI extension

### Build

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### Project Structure

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── INSTALL.md
│   └── GAUNTLETS.md
├── scripts/
│   ├── build-msix.ps1
│   └── build-release.cmd
└── site/                         # Handbook (Starlight docs)
```

---

## Relationship to RunForge Core

All schemas, guarantees, and artifact formats are defined and frozen in:

> https://github.com/mcp-tool-shop-org/runforge-vscode

This repository contains:
- No training logic
- No schema definitions
- No contract ownership

RunForge Desktop **consumes** those artifacts faithfully.

---

## Intended Audience

- Developers training models locally on Windows
- Researchers who need simple, inspectable experiment tracking
- Anyone who wants a native Windows ML training UI
- Teams that want local-first, no-cloud ML workflows

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Reliability Gauntlets

RunForge ships with a repeatable reliability suite you can run locally to validate queueing, pause/resume, cancellation, crash recovery, fairness, disk drift resilience, and Desktop reconnect behavior.

| Gauntlet | Focus |
|----------|-------|
| G1 | max_parallel enforcement |
| G2 | Pause/Resume |
| G3 | Cancel determinism |
| G4 | Crash recovery |
| G5 | Fair scheduling |
| G6 | Disk drift resilience |
| G7 | Desktop reconnect |
| G8-G10 | GPU support (v0.4.0+) |

See: [`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## Contributing

Contributions welcome. Please respect the core principles:

- Keep it simple and local-first
- No cloud dependencies or telemetry
- Clear, actionable error messages

---

## Support

- **Issues**: [GitHub Issues](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **Diagnostics**: Use the Diagnostics page to copy system info for bug reports

---

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | ML training run configurations, metrics, logs, and artifacts in user-selected workspace directory. SQLite for local state |
| **Data NOT touched** | No telemetry. No analytics. No cloud sync. No account required. No credentials stored |
| **Permissions** | Read/write: user-selected workspace directory only. Spawns Python training processes |
| **Network** | None — fully offline application. No external connections |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)
