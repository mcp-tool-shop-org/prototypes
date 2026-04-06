---
title: Beginners
description: New to ML experiment tracking? Start here for a step-by-step introduction to RunForge Desktop.
sidebar:
  order: 99
---

This page is for anyone new to ML experiment tracking or RunForge Desktop. It walks through the key concepts, common workflows, and answers the questions most people have when they open the app for the first time.

## What is RunForge Desktop?

RunForge Desktop is a Windows application that helps you run, monitor, and inspect machine learning training experiments on your own computer. It replaces the cycle of running Python scripts in a terminal, manually checking log files, and losing track of which settings you used last time.

The app does three things:

1. **Launches** training runs with the settings you choose (epochs, batch size, learning rate, device)
2. **Monitors** them in real time with live loss charts and streaming logs
3. **Stores** every run's configuration, metrics, and output so you can inspect and compare them later

Everything stays on your machine. There are no accounts, no cloud services, and no telemetry.

## Key concepts

**Workspace** — a folder on your computer where RunForge stores all experiment data. When you select a workspace, the app creates a `.ml/runs/` directory inside it. Each training run gets its own timestamped subfolder.

**Run** — a single training execution. A run has a configuration (epoch count, batch size, learning rate, optimizer, scheduler, device) and produces artifacts: a manifest (`run.json`), a metrics stream (`metrics.jsonl`), and log files (`stdout.log`, `stderr.log`).

**Preset** — a shortcut for common epoch counts. "Quick" runs a few epochs to verify your setup; "Standard" runs a normal session; "Extended" runs longer for thorough training; "Custom" lets you set the exact count.

**Sweep** — running multiple experiments with different hyperparameter combinations automatically. You provide lists of values for learning rate, batch size, or optimizer, and RunForge generates every combination as a grid search.

**Manifest** — the `run.json` file inside each run folder. It records exactly what settings were used, when the run started and finished, and what the outcome was. This is how RunForge makes experiments reproducible.

**Metrics stream** — the `metrics.jsonl` file. Each line is a JSON object recording the step number, epoch, loss value, learning rate, and timestamp. Because it uses append-only JSONL format, RunForge can read it while training is still running.

## Installation walkthrough

### Option A: Install the MSIX package

This is the recommended approach. The MSIX package bundles the .NET runtime so you do not need to install it separately.

1. Go to the [Releases page](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Download the `.msix` file from the latest release
3. Double-click the downloaded file — Windows will handle the installation
4. Find "RunForge Desktop" in your Start Menu and launch it

To uninstall, use "Add or remove programs" in Windows Settings. The uninstall is clean and removes all app files.

### Option B: Build from source

If you want to modify the app or just prefer building yourself:

1. Install the [.NET 10 SDK](https://dotnet.microsoft.com/download)
2. Install [Visual Studio 2022](https://visualstudio.microsoft.com/) (17.12+) with the .NET MAUI workload
3. Clone the repository and run:

```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

### Python setup

RunForge spawns Python processes to execute training. You need:

- **Python 3.10+** — install from [python.org](https://www.python.org/) or the Microsoft Store
- **PyTorch** — install with `pip install torch`

RunForge auto-discovers Python on your system. If auto-discovery picks the wrong version (for example, if you have multiple Python installations), go to **Settings** and set a manual path override.

## Your first training run

Follow these steps to launch your first experiment:

1. **Launch RunForge Desktop** from the Start Menu
2. **Select a workspace** — click "Select Workspace" on the dashboard and choose an empty folder. This is where all your experiment data will live.
3. **Click "Train"** to open the training configuration dialog
4. **Choose a preset** — start with "Quick" for a fast sanity check
5. **Select a device** — choose GPU if you have an NVIDIA GPU with CUDA, otherwise use CPU
6. **Click Start** — RunForge creates the run folder, writes the manifest, and launches the Python training process

Once training starts, you are taken to the live monitoring view where you can watch the loss chart update and see log output streaming in real time.

When the run finishes, go to the runs list to see your completed experiment. Click on it to inspect its metrics, logs, and artifacts.

## Common workflows

### Comparing hyperparameter settings

Use hyperparameter sweeps to find the best configuration:

1. Go to the MultiRun page
2. Enter comma-separated values for the parameters you want to explore (for example, learning rates `0.001, 0.01` and batch sizes `16, 32, 64`)
3. RunForge generates every combination (in this case, 6 runs) and executes them
4. When the sweep completes, the best-performing configuration is highlighted by final loss
5. Use run comparison to see exactly what changed between any two runs

### Recovering from a crash

If RunForge Desktop closes unexpectedly (power outage, system crash, forced termination):

1. Reopen the app — it will detect the unclean shutdown
2. A dialog asks whether to restore your previous session
3. Click "Restore" to return to your previous workspace and page
4. Any training runs that were in progress when the crash happened are automatically marked as Failed so you know exactly what to re-run

### Exporting data for external analysis

If you want to analyze your results in a notebook, spreadsheet, or reporting tool:

1. Open the run you want to export
2. Use the export options to save metrics, feature importance, or the full run summary
3. CSV exports work directly in Excel, Google Sheets, or pandas; JSON exports work in any programming language

## Troubleshooting

**"Python not found" error** — RunForge requires Python 3.10 or later. Install it from [python.org](https://www.python.org/) or the Microsoft Store. If Python is installed but not detected, go to Settings and set the path manually. Make sure the Python executable is the one with PyTorch installed (check with `python -c "import torch; print(torch.__version__)"` in a terminal).

**Training fails immediately** — Check the run's stderr log for details. Common causes: PyTorch not installed (`pip install torch`), insufficient disk space, or a dataset path that does not exist.

**GPU not detected** — RunForge checks for CUDA availability through PyTorch. If you have an NVIDIA GPU but it shows as unavailable: verify your GPU drivers are up to date, verify CUDA is installed, and verify PyTorch was installed with CUDA support (`pip install torch --index-url https://download.pytorch.org/whl/cu124`). If GPU is requested but not available, RunForge falls back to CPU and records the reason in the run manifest.

**App crashes on startup** — Check `%LOCALAPPDATA%\RunForge\CrashLogs\` for crash log files. These contain the exception details and stack trace. If the crash is caused by a corrupted settings file, delete `%LOCALAPPDATA%\RunForge\settings.json` to reset to defaults.

**Runs stuck in "Running" status** — This happens when the app or training process terminated without updating the manifest. Restart the app — it automatically detects orphaned runs and marks them as Failed.

**Sweep runs are slow** — The execution queue respects parallelism limits. By default, at most 2 runs execute concurrently. If your machine can handle more (especially on CPU), increase the `max_parallel` setting when starting the daemon.

## Glossary

| Term | Definition |
|------|-----------|
| **Artifact** | Any file produced by a training run: manifests, metrics, logs, model weights |
| **Batch size** | Number of training samples processed in one optimization step |
| **CUDA** | NVIDIA's GPU computing platform, required for GPU-accelerated training |
| **Daemon** | A background process (`runforge_cli`) that manages the execution queue and job scheduling |
| **Epoch** | One complete pass through the training dataset |
| **Grid search** | Trying every combination of hyperparameter values in a sweep |
| **Hyperparameter** | A training setting you choose before training starts (learning rate, batch size, optimizer, etc.) |
| **JSONL** | JSON Lines format — one JSON object per line, used for the metrics stream |
| **Learning rate** | Controls how much model weights change per optimization step |
| **Loss** | A number measuring how wrong the model's predictions are — lower is better |
| **Manifest** | The `run.json` file recording a run's configuration, status, and timing |
| **MSIX** | A Windows packaging format that handles install, update, and clean uninstall |
| **Optimizer** | The algorithm that updates model weights (Adam, AdamW, SGD, RMSprop) |
| **Preset** | A shortcut for epoch count: Quick, Standard, Extended, or Custom |
| **Run** | A single training execution with a specific configuration |
| **Scheduler** | Controls how learning rate changes during training (StepLR, CosineAnnealing, OneCycleLR) |
| **Sweep** | Multiple training runs exploring different hyperparameter combinations |
| **Workspace** | A folder where RunForge stores all experiment data |
