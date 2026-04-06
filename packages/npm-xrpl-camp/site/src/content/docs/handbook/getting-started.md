---
title: Getting Started
description: Install XRPL Camp with npx and run your first training module.
sidebar:
  order: 1
---

## Install & Run

No setup required. Run this single command:

```bash
npx @mcptoolshop/xrpl-camp start
```

That is it. No Python, no pip, no virtual environments.

## What happens on first run

1. The launcher detects your platform (Linux x64, macOS ARM64/x64, or Windows x64)
2. Downloads the matching prebuilt binary (~20 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases)
3. Verifies the SHA256 checksum -- any mismatch aborts the launch
4. Caches the binary at `~/.cache/mcptoolshop/xrpl-camp/`
5. Starts the interactive training

Subsequent runs skip steps 1-4 and launch instantly from cache.

## Commands

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check your progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## Troubleshooting

If something goes wrong:

```bash
npx @mcptoolshop/xrpl-camp self-check         # diagnose your environment
npx @mcptoolshop/xrpl-camp support-bundle     # write a zip for bug reports
npx @mcptoolshop/xrpl-camp --print-cache-path # show cached binary location
npx @mcptoolshop/xrpl-camp --clear-cache      # force fresh re-download
```

## Pin a specific version

If the latest release has a regression, pin to a known-good version:

```bash
npx @mcptoolshop/xrpl-camp@1.0.5 start
```

## Alternative: Python install

If you already have Python and prefer a native install:

```bash
pipx install xrpl-camp
xrpl-camp start
```

## Requirements

- Node.js 18 or later (for the npx wrapper)
- Internet connection (first run only, for binary download)
- No Python required
