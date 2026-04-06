---
title: Platforms
description: Supported platforms and troubleshooting guide.
sidebar:
  order: 3
---

## Supported platforms

Prebuilt binaries are available for:

| Platform | Architecture |
|----------|-------------|
| Linux | x64 |
| macOS | ARM64 (Apple Silicon) |
| macOS | x64 (Intel) |
| Windows | x64 |

## Requirements

- **Node.js** 18 or later (for npx)
- ~25 MB disk space for the cached binary
- No Python required

## Binary cache

The downloaded binary is cached at:

```
~/.cache/mcptoolshop/sovereignty/
```

View the exact path:

```bash
npx @mcptoolshop/sovereignty --print-cache-path
```

## Troubleshooting

### Environment diagnostics

Run the built-in self-check to diagnose issues:

```bash
npx @mcptoolshop/sovereignty self-check
```

### Support bundle

Generate a zip file with diagnostic information for bug reports:

```bash
npx @mcptoolshop/sovereignty support-bundle
```

### Force fresh download

If the cached binary is corrupted or outdated:

```bash
npx @mcptoolshop/sovereignty --clear-cache
npx @mcptoolshop/sovereignty tutorial
```

### Version pinning

If the latest release has a regression, pin to a known-good version:

```bash
npx @mcptoolshop/sovereignty@1.4.5 tutorial
```

### Checksum failures

If you see a checksum verification error, try clearing the cache and re-downloading. If the issue persists, check the [GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases) page for known issues.
