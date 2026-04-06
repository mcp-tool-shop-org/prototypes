---
title: Getting Started
description: Install and run Star Freight in one command.
sidebar:
  order: 1
---

## Quick start

Run instantly without installing:

```bash
npx @mcptoolshop/star-freight
```

Or install globally for repeated use:

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

## Starting a new game

```bash
star-freight new "Captain Nyx" --type merchant
star-freight tui
```

## Platform support

| Platform | Binary |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## System requirements

- Node.js 18 or later
- Internet connection (first run only, to download the binary)
- Approximately 50MB disk space for the cached binary

## Cache management

Binaries are cached after first download:

```bash
# Show where binaries are stored
star-freight --print-cache-path

# Clear cached binaries (re-downloads on next run)
star-freight --clear-cache
```

Cache locations:
- **Linux/macOS:** `~/.cache/mcptoolshop/star-freight/`
- **Windows:** `%LOCALAPPDATA%\mcptoolshop\star-freight\`
