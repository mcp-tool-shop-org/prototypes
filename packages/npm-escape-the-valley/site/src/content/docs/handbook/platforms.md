---
title: Platforms & Troubleshooting
description: Supported platforms, cache management, and common fixes for Escape the Valley.
sidebar:
  order: 3
---

## Supported platforms

Pre-built binaries are available for:

| Platform | Architecture | Binary |
|----------|-------------|--------|
| Linux | x64 | `escape-the-valley-linux-x64` |
| macOS | ARM64 (Apple Silicon) | `escape-the-valley-darwin-arm64` |
| Windows | x64 | `escape-the-valley-win-x64.exe` |

The npm wrapper auto-detects your platform and downloads the correct binary on first run.

## Cache location

After the first download, the binary is cached locally to avoid repeated downloads:

```
~/.cache/mcptoolshop/escape-the-valley/
```

To see the exact path on your system:

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path
```

## Troubleshooting

### Force a fresh download

If the cached binary is corrupted or you want to pull the latest version:

```bash
npx @mcptoolshop/escape-the-valley --clear-cache
```

This deletes the cached binary and re-downloads on next run.

### Pin to a specific version

If the latest release has a regression, pin to a known-good version:

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

### Ollama not detected

The AI Game Master requires [Ollama](https://ollama.com/) running locally. If Ollama is not installed or not running, the game falls back to built-in narration. To use the GM:

1. Install Ollama from [ollama.com](https://ollama.com/)
2. Start the Ollama service
3. Launch the game -- the GM will be detected automatically

### Permission denied on Linux/macOS

The downloaded binary needs execute permission. The npm wrapper sets this automatically, but if you get a permission error:

```bash
chmod +x ~/.cache/mcptoolshop/escape-the-valley/escape-the-valley-*
```

### Binary checksum mismatch

If the download fails with a checksum error, try clearing the cache and re-downloading:

```bash
npx @mcptoolshop/escape-the-valley --clear-cache
npx @mcptoolshop/escape-the-valley tui
```

If the error persists, check the [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases) page for known issues.

## Security

All binaries are verified against SHA256 checksums before execution. No telemetry. No network access beyond the initial download from GitHub Releases.

The npm wrapper is powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).
