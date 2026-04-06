---
title: Reliability Gauntlets
description: Repeatable reliability test suite for validating queueing, scheduling, recovery, and GPU behavior.
sidebar:
  order: 3
---

RunForge ships with a repeatable reliability suite — ten gauntlets that validate queueing, pause/resume, cancellation, crash recovery, fair scheduling, disk resilience, desktop reconnect, and GPU behavior. You can run them locally to verify that everything works correctly on your machine.

## Prerequisites

- Python 3.10+
- A workspace containing `data/train.csv` (a small CSV is sufficient)
- Use `--dry-run` for deterministic, fast verification

## G1 — Parallel enforcement

**Goal:** 4 jobs queued; at most 2 running concurrently.

Start the daemon with a parallelism limit of 2 and enqueue a sweep that produces 4 runs. Monitor with `queue-status` to confirm that no more than 2 jobs run at the same time.

**Pass criteria:**
- Never more than 2 running jobs simultaneously
- The group progresses to a terminal state (completed)
- Each run produces `logs.txt` and `result.json`

## G2 — Pause and resume

**Goal:** pausing stops new jobs from starting; resuming continues the queue.

Enqueue a sweep (6+ runs recommended), then pause the group. While paused, queued runs stay queued and no new jobs start. Running jobs may finish, but nothing new launches. After resuming, queued runs start again.

**Pass criteria:**
- While paused: queued jobs remain queued, no new jobs start
- After resume: queued runs begin executing

## G3 — Cancel determinism

**Goal:** cancelling a group marks queued jobs as cancelled; running jobs complete or cancel cleanly.

Cancel a group mid-execution and verify that the group ends in a `canceled` state. No jobs should remain stuck in `running` indefinitely. State must be consistent across `group.json` and the queue.

**Pass criteria:**
- Group ends in `canceled`
- No jobs remain stuck in `running`
- State is consistent in `group.json` and queue

## G4 — Crash recovery

**Goal:** restarting after a daemon crash recovers the queue and resolves stale locks.

While jobs are active, kill the daemon process. Restart it and verify that it detects the stale lock/heartbeat, takes over, and resolves orphaned running jobs (marking them as failed, canceled, or requeued depending on policy). Remaining queued jobs should continue.

**Pass criteria:**
- Daemon detects stale lock/heartbeat and takes over
- Orphaned running jobs are resolved per policy
- Remaining jobs continue to completion

## G5 — Fair scheduling

**Goal:** a single run interleaves with a large sweep instead of waiting.

Enqueue a 10-run sweep, then immediately enqueue a single run. The single run should start early — not after all sweep runs complete. This validates round-robin fairness in the scheduler.

**Pass criteria:**
- The single run starts early, consistent with round-robin fairness

## G6 — Disk drift resilience

**Goal:** a missing run folder fails that job; the daemon continues with the rest.

Enqueue several jobs, then manually delete one queued run's folder before it starts. That job should fail with a clear reason, while all other jobs proceed normally.

**Pass criteria:**
- The affected job becomes `failed` with a clear reason
- Other jobs proceed without disruption

## G7 — Desktop reconnect

**Goal:** the desktop app reattaches to live state after reopening.

With the daemon running and jobs active, close RunForge Desktop. Reopen it and verify that the UI correctly renders queue status, group progress, and stale heartbeat warnings (if the daemon stopped while the app was closed).

**Pass criteria:**
- Desktop renders queue status and group progress correctly
- Stale heartbeat warning appears if the daemon stopped

## G8 — GPU fallback (v0.4.0+)

**Goal:** GPU fallback is explicit and explained.

On a machine without a GPU (or with GPU detection disabled), create a run request with `device.type = "gpu"`. The run should complete on CPU, and the result manifest should record:

- `effective_config.device.type` = `"cpu"`
- `effective_config.device.gpu_reason` = `"no_gpu_detected"`

**Pass criteria:**
- Execution completes on CPU
- Result manifest records the fallback reason
- RF token includes `[RF:DEVICE=CPU gpu_reason=no_gpu_detected]`

## G9 — GPU exclusivity (v0.4.0+)

**Goal:** GPU jobs respect the `gpu_slots` limit.

Start the daemon with `--gpu-slots 1` and enqueue 2 GPU jobs. At most 1 GPU job should run at any time. The second GPU job waits until the first completes. CPU jobs are unaffected by the GPU slot constraint.

**Pass criteria:**
- At most 1 GPU job running at any time
- Second GPU job waits until first completes
- CPU jobs unaffected by GPU slot limit

## G10 — Mixed CPU/GPU workload (v0.4.0+)

**Goal:** CPU and GPU jobs progress concurrently without starvation.

Start the daemon with `--max-parallel 4 --gpu-slots 1`. Enqueue a 4-run GPU sweep and a 4-run CPU sweep. CPU jobs should start immediately (up to the parallel limit minus GPU jobs in use). GPU jobs run one at a time. Both sweeps should make progress concurrently — CPU jobs should not wait for all GPU jobs to finish.

**Pass criteria:**
- CPU jobs start immediately (up to max_parallel - gpu_in_use)
- GPU jobs run one at a time (gpu_slots=1)
- Both sweeps make concurrent progress
- No starvation in either direction

## Evidence files

When debugging gauntlet failures, these files contain the relevant state:

| File | Purpose |
|------|---------|
| `.runforge/queue/queue.json` | Job states and scheduling |
| `.runforge/queue/daemon.json` | Daemon heartbeat and status |
| `.runforge/groups/<gid>/group.json` | Group summary and run entries |
| `.runforge/runs/<run-id>/logs.txt` | Execution logs |
| `.runforge/runs/<run-id>/result.json` | Run outcome and effective config |

## Summary

| Gauntlet | Focus | Available since |
|----------|-------|-----------------|
| G1 | max_parallel enforcement | v0.3.5+ |
| G2 | Pause / Resume | v0.3.5+ |
| G3 | Cancel determinism | v0.3.5+ |
| G4 | Crash recovery | v0.3.5+ |
| G5 | Fair scheduling | v0.3.5+ |
| G6 | Disk drift resilience | v0.3.5+ |
| G7 | Desktop reconnect | v0.3.5+ |
| G8 | GPU fallback | v0.4.0+ |
| G9 | GPU exclusivity | v0.4.0+ |
| G10 | Mixed workload | v0.4.0+ |
