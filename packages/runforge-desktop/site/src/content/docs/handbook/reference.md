---
title: Reference
description: NuGet package, system requirements, project structure, artifact format, and security scope.
sidebar:
  order: 4
---

## NuGet package

RunForge Desktop's core logic is published as a standalone NuGet package for integration into other .NET applications:

| Package | Description |
|---------|-------------|
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Core domain models and services for ML training run management — run lifecycle, hyperparameter sweeps, live monitoring, and artifact inspection |

```bash
dotnet add package RunForgeDesktop.Core
```

The Core package contains no UI dependencies. It provides the domain models, services, and interfaces that the desktop app (and any other consumer) builds on.

## System requirements

| Requirement | Value |
|-------------|-------|
| OS | Windows 10 (1809+) or Windows 11 |
| Architecture | x64 |
| Runtime | .NET 10 (bundled in MSIX) |
| Python | 3.10+ (for training) |
| GPU | Optional (CUDA for GPU training) |
| Disk Space | ~100 MB |

## Project structure

```
runforge-desktop/
+-- src/
|   +-- RunForgeDesktop/          # MAUI app (UI, ViewModels)
|   +-- RunForgeDesktop.Core/     # Core services, models
+-- tests/
|   +-- RunForgeDesktop.Core.Tests/
+-- docs/
|   +-- PHASE-DESKTOP-0.1-ACCEPTANCE.md
|   +-- INSTALL.md
|   +-- GAUNTLETS.md
+-- scripts/
|   +-- build-msix.ps1
|   +-- build-release.cmd
+-- site/                         # Landing page + handbook (this site)
```

The `src/RunForgeDesktop/` directory contains the MAUI application: pages, view models, converters, and platform-specific code. `src/RunForgeDesktop.Core/` contains the domain layer: models, services, and interfaces shared by all consumers.

## Artifact format

All training artifacts are stored under `.ml/runs/` in the user's workspace directory. Each run creates a timestamped folder:

```
.ml/
+-- runs/
    +-- 20240101-123456-myrun-abc1/
        +-- run.json       # Run manifest (config, status, timing)
        +-- metrics.jsonl  # Live metrics (one JSON object per line)
        +-- stdout.log     # Standard output from training process
        +-- stderr.log     # Standard error from training process
```

| File | Format | Description |
|------|--------|-------------|
| `run.json` | JSON | Run manifest recording the configuration used, device selection, status, and timing |
| `metrics.jsonl` | JSONL | Append-only metrics stream, readable while training is in progress |
| `stdout.log` | Text | Full stdout capture from the Python training process |
| `stderr.log` | Text | Full stderr capture from the Python training process |

All schemas, guarantees, and artifact formats are defined and frozen in the upstream [runforge-vscode](https://github.com/mcp-tool-shop-org/runforge-vscode) repository. RunForge Desktop consumes those artifacts faithfully — it contains no training logic, schema definitions, or contract ownership.

## Execution queue

RunForge Desktop integrates with a Python-based execution daemon (`runforge_cli`) for advanced job scheduling. The daemon manages parallelism, group operations, and GPU slot allocation.

**Queue state** is stored under `.runforge/` in the workspace:

```
.runforge/
+-- queue/
|   +-- queue.json      # Job states, priorities, and scheduling
|   +-- daemon.json     # Daemon heartbeat, PID, and health status
+-- groups/
    +-- <group-id>/
        +-- group.json  # Group summary: name, status, run entries, paused flag
```

**Daemon operations available from the desktop app:**

| Operation | Description |
|-----------|-------------|
| Start daemon | Launch the daemon with a configurable `max_parallel` limit |
| Stop daemon | Gracefully terminate the daemon process |
| Enqueue run | Add a single run to the queue with optional group and priority |
| Enqueue sweep | Submit a sweep plan and get back a group ID |
| Pause group | Prevent new jobs in the group from starting |
| Resume group | Allow paused group jobs to start again |
| Retry failed | Re-enqueue all failed runs in a group |
| Cancel group | Cancel all queued runs in a group |

**GPU scheduling:** the daemon supports `gpu_slots` to limit GPU concurrency independently of CPU parallelism. CPU jobs and GPU jobs can run concurrently without starving each other.

## Security and data scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | ML training run configs, metrics, logs, artifacts in user-selected workspace. SQLite for local state |
| **Data NOT touched** | No telemetry, no analytics, no cloud sync, no accounts, no credentials |
| **Permissions** | Read/write to user-selected workspace only. Spawns Python training processes |
| **Network** | None — fully offline application |
| **Telemetry** | None collected or sent |

RunForge Desktop follows standard Windows permission models. It only accesses the workspace directory the user explicitly selects. No data leaves the machine.

See [SECURITY.md](https://github.com/mcp-tool-shop-org/runforge-desktop/blob/main/SECURITY.md) for vulnerability reporting.

## Development

### Prerequisites

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) with the MAUI workload, OR VS Code with the .NET MAUI extension

### Build commands

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd

# Package as MSIX
.\scripts\build-msix.ps1
```

## Relationship to RunForge Core

All schemas, guarantees, and artifact formats are defined and frozen in the upstream repository:

> https://github.com/mcp-tool-shop-org/runforge-vscode

RunForge Desktop contains:
- No training logic
- No schema definitions
- No contract ownership

It consumes the artifacts and contracts defined upstream. If you need to understand the data format in detail, that repository is the canonical source.
