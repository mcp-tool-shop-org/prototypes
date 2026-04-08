---
title: Getting Started
description: Install venvkit and run your first environment scan in under a minute.
sidebar:
  order: 1
---

venvkit is a Python virtual environment diagnostic toolkit built for Windows ML workflows. It scans your system for Python environments, diagnoses health issues, tracks task execution history, detects flaky tasks, and renders an ecosystem map.

## Prerequisites

- **Node.js** 18 or later
- **Python** 3.8 or later (the environments you want to scan)
- **Windows** (primary target; Linux/macOS work for core checks but DLL and ABI diagnostics are Windows-specific)

## Installation

### From npm

```bash
npm install @mcptoolshop/venvkit
```

### From source

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit
cd venvkit
npm install
npm run build
```

## 30-Second Quickstart

Once installed and built, scan your project directory and generate an interactive ecosystem map:

```bash
node dist/map_cli.js --root C:\projects --httpsProbe
```

This does three things:

1. **Discovers** every Python environment under `C:\projects` (venvs, conda, pyenv, base interpreters).
2. **Diagnoses** each one with doctorLite (SSL, DLLs, ABI, pip, path leakage).
3. **Renders** the results as an interactive HTML report, a graph JSON file, and a Mermaid diagram.

Open the HTML report to explore the results:

```bash
start .venvkit/venv-map.html
```

## What happens during a scan

When you run the CLI, venvkit walks the directory tree (up to `--maxDepth` levels deep, default 5) looking for Python interpreters. For each one it finds, it runs `doctorLite` which:

- Attempts to import the `ssl` module and verify TLS certificates
- Tests native extension loading to catch DLL failures (common with PyTorch and CUDA on Windows)
- Checks for ABI mismatches (ARM vs x86, 32-bit vs 64-bit)
- Verifies pip is present and runs `pip check` for dependency conflicts
- Detects user-site leakage and PYTHONPATH injection that can cause cross-environment contamination

Each environment receives a health score from 0 to 100 and a status of `good`, `warn`, or `bad`.

## Next steps

- **[Usage](/venvkit/handbook/usage/)** — Learn the CLI options and typical workflows
- **[Outputs](/venvkit/handbook/outputs/)** — Understand the output files and schemas
- **[Finding Codes](/venvkit/handbook/finding-codes/)** — Look up diagnostic codes
