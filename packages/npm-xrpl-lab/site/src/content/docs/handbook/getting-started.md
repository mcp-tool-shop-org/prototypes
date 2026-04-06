---
title: Getting Started
description: Install XRPL Lab and run your first module.
sidebar:
  order: 1
---

## Install & Run

No installation needed. Just run:

```bash
npx @mcptoolshop/xrpl-lab start
```

That's it. No Python, no pip, no virtual environments.

## What happens on first run

1. Downloads a platform-specific binary (~25 MB) from GitHub Releases
2. Verifies SHA256 checksum
3. Caches locally (`~/.cache/mcptoolshop/xrpl-lab/`)
4. Launches the guided module selector

Subsequent runs launch instantly from cache.

## Offline mode

For learning the workflow without touching testnet -- and required for AMM modules until testnet enables the AMM amendment:

```bash
npx @mcptoolshop/xrpl-lab start --dry-run
```

Fully offline with simulated transactions.

## Run a specific module

```bash
# List all available modules
npx @mcptoolshop/xrpl-lab list

# Run a module by name
npx @mcptoolshop/xrpl-lab run receipt-literacy
```

## Check your progress

```bash
npx @mcptoolshop/xrpl-lab status
```

## Alternative: Python

If you prefer Python:

```bash
pipx install xrpl-lab
xrpl-lab start
```

## Troubleshooting

If something goes wrong, diagnose your environment:

```bash
npx @mcptoolshop/xrpl-lab doctor
```

Generate an issue-ready markdown report for bug reports:

```bash
npx @mcptoolshop/xrpl-lab feedback
```

Force a fresh binary download if the cache is corrupt:

```bash
npx @mcptoolshop/xrpl-lab --clear-cache
```

## Supported platforms

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64
