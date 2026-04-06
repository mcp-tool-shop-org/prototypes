---
title: Getting Started
description: Install and play Saint's Mile in one command
sidebar:
  order: 8
---

## Run instantly with npx

No installation needed — npx downloads and runs the wrapper automatically:

```bash
npx @mcptoolshop/saints-mile
```

The first run downloads the Saint's Mile binary for your platform. Subsequent runs start instantly from cache.

## Install globally

For repeated play sessions, install once:

```bash
npm install -g @mcptoolshop/saints-mile
saints-mile
```

## Also available via cargo

If you have the Rust toolchain installed:

```bash
cargo install saints-mile
```

## Supported platforms

| Platform | Architecture |
|----------|-------------|
| Windows  | x64         |
| macOS    | arm64 (Apple Silicon) |
| Linux    | x64         |

## How the wrapper works

1. On first run, the wrapper downloads the Saint's Mile binary from GitHub Releases
2. The binary is verified via SHA256 checksum
3. It's cached in `~/.cache/mcptoolshop/saints-mile/`
4. All subsequent runs use the cached binary — no download needed

The wrapper adds no overhead beyond the initial download. It's a thin launcher powered by [`@mcptoolshop/npm-launcher`](https://github.com/mcp-tool-shop-org/npm-launcher).

## Cache management

Clear the cached binary:

```bash
saints-mile --clear-cache
```

Show cache path:

```bash
saints-mile --print-cache-path
```

## Updating

When a new Saint's Mile release is published, update the npm package:

```bash
npm install -g @mcptoolshop/saints-mile@latest
```

The new version will download the updated binary on first run.

## Security

- Downloads from `github.com` over HTTPS only
- SHA256 checksum verification on every download
- No telemetry, no tracking, no phone-home
- Binary runs with your user permissions — no elevated access needed
