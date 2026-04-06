---
title: Features
description: Training creation, hyperparameter sweeps, live monitoring, run browsing, and diagnostics.
sidebar:
  order: 2
---

RunForge Desktop provides a visual control plane for ML experiments. This page covers every major feature in depth.

## Training run creation

Every training run starts with configuration. RunForge Desktop makes this straightforward with presets and sensible defaults.

**Epoch presets** let you pick a training duration without thinking about numbers:

| Preset | Use case |
|--------|----------|
| Quick | Fast sanity check — a few epochs to verify your setup works |
| Standard | Normal training session |
| Extended | Longer run for thorough training |
| Custom | Set your own epoch count |

**Device selection** detects available hardware automatically. If a CUDA-capable GPU is present, you can choose GPU training; otherwise, CPU is selected. If you request GPU but none is detected, RunForge falls back to CPU and records the reason in the run manifest.

**Advanced settings** give you full control when you need it:

- **Batch size** — number of samples per training step
- **Learning rate** — step size for the optimizer
- **Optimizer** — algorithm used for weight updates
- **Scheduler** — learning rate schedule across training
- **Custom dataset path** — point to your own data instead of the default

## Hyperparameter sweeps (MultiRun)

When you want to explore multiple configurations, hyperparameter sweeps let you define parameter ranges and run them all automatically.

**How it works:**

1. Specify learning rates, batch sizes, and optimizers as comma-separated lists
2. RunForge generates the full grid of combinations
3. All combinations are enqueued and executed according to your parallelism settings
4. The best-performing configuration (by final loss) is highlighted when the sweep completes

For example, if you specify learning rates `0.001, 0.01` and batch sizes `16, 32`, RunForge creates 4 runs covering every combination.

Sweeps integrate with the queue system. The daemon respects `max_parallel` limits, so you can queue a large sweep without overwhelming your machine.

## Live monitoring

While training runs, RunForge Desktop provides real-time visibility:

- **Loss chart** — updates automatically as new metrics arrive, showing the training loss curve as it develops
- **Log streaming** — live stdout/stderr from the Python training process, scrolling as new output appears
- **Progress tracking** — current epoch, step count, and elapsed time
- **Cancel** — stop a running training at any time. The run is marked as Cancelled and all artifacts up to that point are preserved

Monitoring works by watching the `metrics.jsonl` and log files that the training process writes to disk. There's no network overhead — everything is local file I/O.

## Run browsing and inspection

All training runs are listed with newest first. You can filter by status to focus on what matters:

| Status | Meaning |
|--------|---------|
| Pending | Queued but not yet started |
| Running | Currently executing |
| Completed | Finished successfully |
| Failed | Exited with an error |
| Cancelled | Stopped by the user |

Clicking any run opens its detail view with three tabs:

- **Metrics** — loss curves, accuracy, and training statistics plotted over time
- **Logs** — full stdout/stderr captured from the training process
- **Artifacts** — open the output folder in Explorer, or copy the training command for manual reproduction

## How it works

RunForge Desktop manages the full lifecycle of training runs. When you create a run, the app spawns a Python training process and monitors it through the filesystem:

```
RunForge Desktop
  |
  +-- Select Workspace (any folder)
  +-- Create Run (preset + device + optional dataset)
  +-- Spawn Python training process
  |
  v
.ml/
  +-- runs/
      +-- 20240101-123456-myrun-abc1/
          +-- run.json       (manifest)
          +-- metrics.jsonl  (live metrics)
          +-- stdout.log     (live logs)
          +-- stderr.log     (errors)
```

The `.ml/runs/` directory is the source of truth. Each run gets a timestamped folder. The manifest (`run.json`) records the configuration used, and metrics are appended as JSONL so they can be read while training is still in progress.

## Run comparison

RunForge Desktop can compare any two runs side-by-side. This is especially useful when re-running experiments with different settings.

**What gets compared:**

- **Request differences** — which config fields changed between parent and child
- **Effective config differences** — preset, model family, hyperparameters, device, and dataset
- **Metric deltas** — every metric from both runs shown with parent value, child value, and change
- **Artifact comparison** — which artifacts are shared, added, or removed

If a run was created as a rerun (using `rerun_from`), you can compare it directly with its parent in one step.

## Data export

Export run data from the desktop app for use in external tools, reports, or scripts.

**Supported exports:**

| Export type | Format | Contents |
|-------------|--------|----------|
| Feature importance | CSV | Ranked features with importance scores and percentages |
| Linear coefficients | CSV | Per-class coefficients sorted by absolute value |
| Metrics | CSV | All metrics organized by category |
| Run summary | JSON | Full run detail including request, result, and metrics |

You can also copy individual artifacts from a run's output folder to a location of your choice.

## Settings

The Settings page lets you customize RunForge Desktop's behavior. All settings are persisted to `%LOCALAPPDATA%\RunForge\settings.json`.

**Python configuration:**

- **Auto-discovery** — RunForge automatically finds Python 3.10+ on your system
- **Manual override** — point to a specific Python executable if auto-discovery picks the wrong one
- **Validation** — test your Python path and see version info without leaving the settings page

**Training defaults:**

- **Default device** — GPU or CPU (GPU is the default)
- **Default epochs** — starting epoch count for new runs (default: 10)
- **Default batch size** — samples per step (default: 64)
- **Default learning rate** — optimizer step size (default: 0.001)

**Output directories:**

- **Custom logs directory** — redirect log output to a folder of your choice
- **Custom artifacts directory** — redirect training artifacts to a separate location

**Appearance:**

- **Dark** (default) — optimized for extended use
- **Light** — clean, bright interface
- **System** — follows your Windows theme preference

Theme changes apply instantly without restarting the app.

**Other options:**

- **Auto-open output folder** — open the run folder in Explorer when training completes
- **Verbose logging** — enable detailed diagnostic output

## Crash recovery

RunForge Desktop tracks its session state so it can recover after an unexpected shutdown.

**How it works:**

1. On launch, the app writes a session file to `%LOCALAPPDATA%\RunForge\session.json`
2. The session file records: current page, workspace path, active run ID, and a heartbeat timestamp
3. When the app closes normally, it marks the session as cleanly terminated
4. If the session file exists on next launch and was not cleanly terminated, the app offers to restore your previous state

**What gets recovered:**

- The workspace you had open
- The page you were on
- Any active training run

**Orphaned run recovery:** if the app crashes while a training process is running, the process may terminate without updating its manifest. On next launch, RunForge scans for runs still marked as "Running" whose process IDs no longer exist, and marks them as Failed with a clear reason.

**Crash logs:** unhandled exceptions are written to `%LOCALAPPDATA%\RunForge\CrashLogs\` with full stack traces, session IDs, and timestamps. The last 10 crash logs are retained.

## Diagnostics

The Diagnostics page is your first stop when something doesn't look right:

- **App version** — the running version of RunForge Desktop
- **Framework** — .NET runtime and MAUI version
- **Memory usage** — current memory consumption
- **Workspace path** — the active workspace directory
- **Python configuration** — detected Python version and path

Click "Copy diagnostics to clipboard" to capture all of this in a format ready for a bug report.
