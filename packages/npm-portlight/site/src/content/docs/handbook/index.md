---
title: Portlight npm Wrapper
description: Zero-prerequisite installer for the Portlight maritime strategy CLI
sidebar:
  order: 0
---

The `@mcptoolshop/portlight` npm package lets you play [Portlight](https://github.com/mcp-tool-shop-org/portlight) without installing Python. It downloads the pre-built binary for your platform, verifies its SHA256 checksum, and caches it locally.

## What is Portlight?

Portlight is a terminal strategy game where you build a merchant career across five maritime regions. Buy low, sail dangerous routes, sell high, and reinvest into infrastructure, reputation, and commercial leverage.

Nine captain types, 20 ports across 5 regions, 18 trade goods (including contraband), 43 routes tiered by ship class, 4 pirate factions, and full insurance/credit systems. See the [World Map](/handbook/world-map/) for the full atlas.

## How the wrapper works

1. On first run, the wrapper downloads the Portlight binary from GitHub Releases
2. The binary is verified via SHA256 checksum
3. It's cached in `~/.cache/mcptoolshop/portlight/`
4. All subsequent runs use the cached binary — no download needed
5. Your arguments are passed straight through to Portlight

The wrapper adds no overhead beyond the initial download. It's a thin launcher powered by [`@mcptoolshop/npm-launcher`](https://github.com/mcp-tool-shop-org/npm-launcher).

## Supported platforms

| Platform | Architecture |
|----------|-------------|
| Windows  | x64         |
| macOS    | x64, arm64  |
| Linux    | x64         |

## Requirements

- **Node.js 18 or later** — needed to run the npm wrapper
- **No Python required** — the wrapper downloads a standalone binary
- **Internet connection** — only for the initial binary download (~15 MB)
