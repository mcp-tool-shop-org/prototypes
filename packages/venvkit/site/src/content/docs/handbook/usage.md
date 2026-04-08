---
title: Usage
description: CLI options, typical workflows, and practical examples for venvkit.
sidebar:
  order: 2
---

venvkit ships a CLI for zero-config scanning and a programmatic API for integration into your own tools. This page covers CLI usage and common workflows.

## Basic scan

```bash
node dist/map_cli.js
```

With no arguments, venvkit scans the current working directory with a max depth of 5 and writes output to `.venvkit/`.

## Scanning specific directories

Use `--root` (or `-r`) to scan one or more directories. You can pass the flag multiple times:

```bash
node dist/map_cli.js --root C:\projects --root D:\ml-experiments
```

## CLI options

| Flag | Description | Default |
|------|-------------|---------|
| `--root, -r` | Directory to scan (repeatable) | Current directory |
| `--out` | Output directory | `.venvkit` |
| `--maxDepth` | Max directory depth to scan | `5` |
| `--strict` | Enable strict mode checks | Off |
| `--httpsProbe` | Test HTTPS connectivity for each env | Off |
| `--minScore` | Filter out envs below this health score | None |
| `--concurrency` | Number of parallel health checks | CPU count |
| `--runlog` | Path to a task run log (JSONL file) | None |
| `--no-tasks` | Skip task visualization in the map | Off |

## Workflow: Full ML environment audit

This workflow scans all your project directories, includes HTTPS probing, applies strict checks, and filters out anything scoring below 50:

```bash
node dist/map_cli.js \
  --root C:\projects \
  --root D:\ml-experiments \
  --httpsProbe \
  --strict \
  --minScore 50 \
  --out ./audit-results
```

The output lands in `./audit-results/` instead of the default `.venvkit/`.

## Workflow: Track task history

If you maintain a run log (a JSONL file of task executions), venvkit can overlay task routing and flaky-task analysis onto the ecosystem map:

```bash
node dist/map_cli.js --root C:\projects --runlog .venvkit/runs.jsonl
```

The generated map will show which environments ran which tasks, where failures happened, and whether any tasks are flaky (inconsistently passing/failing).

To skip task visualization entirely (useful for a clean environment-only view):

```bash
node dist/map_cli.js --root C:\projects --no-tasks
```

## Workflow: CI health gate

You can use venvkit in CI to gate on environment health. If any environment scores below the threshold, the process exits with a non-zero code:

```bash
node dist/map_cli.js --root . --strict --minScore 70
```

Combine with `--httpsProbe` if your CI environment needs outbound SSL verification.

## Concurrency

By default, venvkit runs health checks in parallel using as many workers as your CPU has cores. You can tune this:

```bash
# Limit to 2 parallel checks (useful on resource-constrained CI runners)
node dist/map_cli.js --root C:\projects --concurrency 2
```

## Next steps

- **[Outputs](/venvkit/handbook/outputs/)** — What files venvkit generates and their schemas
- **[Finding Codes](/venvkit/handbook/finding-codes/)** — Understand diagnostic codes in reports
- **[Reference](/venvkit/handbook/reference/)** — Full API reference for programmatic use
