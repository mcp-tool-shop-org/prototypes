---
title: Gameplay
description: Game mechanics, commands, and how to play Sovereignty.
sidebar:
  order: 2
---

## Overview

Sovereignty is a strategy game centered on governance, trust, and trade. Play offline as a tabletop experience or use XRPL online verification for provable game state.

## Commands

All commands are run via npx:

```bash
npx @mcptoolshop/sovereignty <command>
```

### Core commands

| Command | Description |
|---------|-------------|
| `tutorial` | Learn the rules interactively |
| `new` | Start a new game session |
| `status` | Check current game state |
| `--help` | See all available commands |

### Diagnostics

| Command | Description |
|---------|-------------|
| `self-check` | Diagnose your environment |
| `support-bundle` | Write a zip for bug reports |
| `--print-cache-path` | Show cached binary location |
| `--clear-cache` | Force a fresh binary download |

## Version pinning

If the latest version has a regression, pin to a specific version:

```bash
npx @mcptoolshop/sovereignty@1.4.5 tutorial
```

## Security model

- All binaries are verified against SHA256 checksums before execution
- No telemetry
- No network access beyond the initial download from GitHub Releases
- Powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher)
