---
title: Reference
description: Technical details about the npm wrapper and binary distribution.
sidebar:
  order: 9
---

## How the Wrapper Works

The `@mcptoolshop/saints-mile` npm package contains no game code. It delegates to [`@mcptoolshop/npm-launcher`](https://github.com/mcp-tool-shop-org/npm-launcher), which handles:

1. **Platform detection** — determines your OS and architecture
2. **Binary download** — fetches the correct binary from the GitHub Release
3. **Checksum verification** — validates SHA256 before execution
4. **Caching** — stores the binary in `~/.cache/mcptoolshop/saints-mile/` so subsequent runs are instant
5. **Execution** — spawns the binary with all arguments passed through

## CLI Flags

| Flag | Description |
|------|-------------|
| `--version` / `-V` | Print wrapper and binary versions |
| `--clear-cache` | Delete the cached binary (forces re-download on next run) |
| `--print-cache-path` | Show the local cache directory path |

All other arguments are passed directly to the Saint's Mile binary.

## Supported Platforms

| Platform | Architecture | Binary Name |
|----------|-------------|-------------|
| Windows  | x64         | `saints-mile.exe` |
| macOS    | arm64 (Apple Silicon) | `saints-mile` |
| Linux    | x64         | `saints-mile` |

## Security

- HTTPS only to `github.com` CDN
- SHA256 checksum on every download
- User cache only — never touches system directories
- No telemetry, no tracking, no phone-home
- Binary runs with user permissions only — no elevated access needed

## Versioning

The npm wrapper version (`1.0.x`) tracks independently from the game binary version. The wrapper's `BINARY_VERSION` constant determines which GitHub Release is downloaded. Run `saints-mile --version` to see both versions.

## Source Repositories

| Repository | Contents |
|-----------|----------|
| [mcp-tool-shop-org/saints-mile](https://github.com/mcp-tool-shop-org/saints-mile) | Game source (Rust) |
| [mcp-tool-shop-org/npm-saints-mile](https://github.com/mcp-tool-shop-org/npm-saints-mile) | npm wrapper |
| [mcp-tool-shop-org/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) | Shared binary launcher |
