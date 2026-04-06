---
title: Reference
description: Technical reference for the Star Freight npm launcher.
sidebar:
  order: 4
---

## Launcher commands

The npm wrapper provides these built-in commands:

| Command | Description |
|---------|-------------|
| `star-freight --version` / `-V` | Print the npm wrapper version |
| `star-freight --print-cache-path` | Print the local cache directory for this binary version |
| `star-freight --clear-cache` | Delete all cached binaries |

All other arguments are passed through to the Star Freight game binary unchanged.

## Version information

The npm wrapper version and the game binary version are tracked independently:

| Component | Current version | Where defined |
|-----------|----------------|--------------|
| npm wrapper | 1.0.5 | `package.json` |
| Game binary | 1.0.3 | `bin/star-freight.js` launch config |

Running `star-freight --version` prints the npm wrapper version. The game binary has its own version output accessible through in-game menus.

## Environment variables

| Variable | Set by | Purpose |
|----------|--------|---------|
| `MCPTOOLSHOP_LAUNCH_CONFIG` | The wrapper (automatically) | JSON config telling npm-launcher which binary to fetch |
| `HTTPS_PROXY` | You (optional) | Proxy URL for binary downloads behind a firewall |

## Platform support

| Platform | Architecture | Binary name pattern |
|----------|-------------|-------------------|
| Linux | x64 | `star-freight-<version>-linux-x64` |
| macOS | ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows | x64 | `star-freight-<version>-win-x64.exe` |

## Cache locations

| OS | Path |
|----|------|
| Linux / macOS | `~/.cache/mcptoolshop/star-freight/` |
| Windows | `%LOCALAPPDATA%\mcptoolshop\star-freight\` |

## Security model

- Binary downloads use HTTPS only, from `github.com`
- SHA256 checksum verification on every download
- No telemetry, no credential storage, no network requests beyond GitHub
- Binary runs with the same permissions as the calling user
- Game saves are written to the current working directory
- Full policy: [SECURITY.md](https://github.com/mcp-tool-shop-org/npm-star-freight/blob/main/SECURITY.md)

## Source repositories

| Repository | Contents |
|-----------|----------|
| [mcp-tool-shop-org/npm-star-freight](https://github.com/mcp-tool-shop-org/npm-star-freight) | This npm launcher wrapper |
| [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight) | The game source code (Python) |
| [mcp-tool-shop-org/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) | Shared launcher library |
