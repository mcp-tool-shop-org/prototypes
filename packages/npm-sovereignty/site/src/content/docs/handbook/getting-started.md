---
title: Getting Started
description: Install Sovereignty and run your first game.
sidebar:
  order: 1
---

## Install and run

No installation required. Run directly with npx:

```bash
npx @mcptoolshop/sovereignty tutorial
```

That's it. No Python, no pip, no virtual environments.

## What happens on first run

1. Downloads a platform-specific binary (~25 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases)
2. Verifies the SHA256 checksum
3. Caches the binary locally at `~/.cache/mcptoolshop/sovereignty/`
4. Runs with full argument passthrough

Subsequent runs launch instantly from the cache.

## Your first game

Start with the tutorial to learn the rules:

```bash
npx @mcptoolshop/sovereignty tutorial
```

Then start a new game:

```bash
npx @mcptoolshop/sovereignty new
```

Check your game state at any time:

```bash
npx @mcptoolshop/sovereignty status
```

## Alternative: Python install

If you prefer running from Python directly:

```bash
pipx install sovereignty-game
sov tutorial
```
