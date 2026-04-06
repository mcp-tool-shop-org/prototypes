---
title: Getting Started
description: Install Escape the Valley and start your first run in under a minute.
sidebar:
  order: 1
---

## Play instantly with npx

No install step required. This single command downloads a platform-specific binary, verifies the SHA256 checksum, caches it locally, and launches the game:

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

Subsequent runs launch instantly from cache.

## Install globally

If you prefer a shorter command for repeated play:

```bash
npm install -g @mcptoolshop/escape-the-valley
trail tui --seed 42
```

After global install, the `trail` command is available everywhere.

## Resume a saved game

The game auto-saves at every checkpoint. To pick up where you left off:

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

## What happens on first run

1. Downloads a platform-specific binary (~15 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)
2. Verifies the SHA256 checksum against the published manifest
3. Caches the binary locally at `~/.cache/mcptoolshop/escape-the-valley/`
4. Launches the game with full argument passthrough

No Python, no pip, no virtual environments.

## Alternative: Python install

If you prefer the Python ecosystem:

```bash
pip install escape-the-valley
trail tui --seed 42
```

The Python package installs a native binary the same way, just through pip instead of npm.

## All commands

```bash
trail tui                              # start new game
trail tui --seed 42                    # seeded world generation
trail tui --continue                   # resume saved game
trail tui --gm-profile chronicler      # choose GM voice
trail tui --gm-off                     # disable AI narration
trail tui --voice                      # enable voice narration
trail tui --callouts minimal           # fewer warnings
trail ledger status                    # show backpack status
trail ledger enable                    # enable XRPL backpack
trail stats                            # show run statistics
trail --help                           # see all commands
```
