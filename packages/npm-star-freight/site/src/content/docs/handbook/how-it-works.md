---
title: How It Works
description: Technical overview of the npm launcher architecture for Star Freight.
sidebar:
  order: 2
---

The `@mcptoolshop/star-freight` npm package is not the game itself. It is a thin launcher that downloads, verifies, and runs the real Star Freight binary. This page explains exactly what happens when you run `npx @mcptoolshop/star-freight`.

## The launcher pipeline

When you invoke the command, five things happen in order:

1. **Platform detection** -- the launcher checks your OS (`linux`, `darwin`, `win32`) and CPU architecture (`x64`, `arm64`) to determine which binary you need.
2. **Asset resolution** -- it looks for a matching binary on the [Star Freight GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases) page. The asset name follows the pattern `star-freight-<version>-<os>-<arch>`.
3. **Download** -- the binary is fetched over HTTPS from `github.com` with atomic writes (partial downloads are discarded, not cached).
4. **Checksum verification** -- SHA256 hash is checked against `checksums-<version>.txt` from the same release. If the hash does not match, the binary is deleted and the launcher exits with an error.
5. **Execution** -- the verified binary is spawned with `spawnSync`, passing through all your command-line arguments. The launcher exits with the same exit code as the binary.

## Caching

After the first successful download, the binary is stored in your local cache directory. On subsequent runs, the launcher skips the download and goes straight to execution.

| OS | Cache path |
|----|-----------|
| Linux / macOS | `~/.cache/mcptoolshop/star-freight/` |
| Windows | `%LOCALAPPDATA%\mcptoolshop\star-freight\` |

You can inspect or clear the cache at any time:

```bash
# Print the cache directory path
star-freight --print-cache-path

# Delete all cached binaries (re-downloads on next run)
star-freight --clear-cache
```

## What the launcher does NOT do

The launcher has a narrow scope by design:

- It does not modify your system PATH or global configuration
- It does not install system-level dependencies
- It does not collect telemetry or analytics
- It does not store credentials or tokens
- It does not write outside the cache directory (the game binary writes saves to your working directory)
- It does not make network requests beyond `github.com`

## Version pinning

The npm wrapper version and the game binary version are independent. The wrapper at version `1.0.5` may launch game binary version `1.0.3`. The binary version is pinned inside `bin/star-freight.js`:

```js
process.env.MCPTOOLSHOP_LAUNCH_CONFIG = JSON.stringify({
  toolName: "star-freight",
  owner: "mcp-tool-shop-org",
  repo: "star-freight",
  version: "1.0.3",
  tag: "v1.0.3",
});
```

When the game releases a new version, the npm wrapper is updated to point to the new tag and re-published.

## The npm-launcher dependency

Under the hood, this package delegates to [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher), a shared launcher library used by several MCP Tool Shop packages. The launcher handles platform detection, download, checksum verification, and caching so that each game wrapper stays minimal.
