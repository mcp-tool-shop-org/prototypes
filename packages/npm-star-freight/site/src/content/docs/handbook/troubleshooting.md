---
title: Troubleshooting
description: Solutions for common issues when installing or running Star Freight.
sidebar:
  order: 5
---

## Binary download fails

**Symptom:** The launcher prints a network error or times out during the first run.

**Causes and fixes:**

- **No internet connection.** The first run requires a download from GitHub Releases. Subsequent runs use the cached binary and work offline.
- **Corporate proxy or firewall.** The launcher downloads from `github.com`. If your network blocks GitHub, configure your proxy via `HTTPS_PROXY` environment variable.
- **GitHub is down.** Check [GitHub Status](https://www.githubstatus.com/). Wait and retry.

## Checksum verification fails

**Symptom:** The launcher reports a SHA256 mismatch and refuses to run.

**Fixes:**

1. Clear the cache and re-download:
   ```bash
   star-freight --clear-cache
   npx @mcptoolshop/star-freight
   ```
2. If the error persists, the release may have been re-published. Open an issue on the [npm-star-freight repo](https://github.com/mcp-tool-shop-org/npm-star-freight/issues).

## "command not found" after global install

**Symptom:** `star-freight` is not recognized after `npm i -g @mcptoolshop/star-freight`.

**Fixes:**

- Verify npm's global bin directory is in your PATH:
  ```bash
  npm config get prefix
  ```
  The `bin/` subdirectory of that path must be in your `$PATH` (Linux/macOS) or `%PATH%` (Windows).
- On Windows, you may need to restart your terminal after a global install.

## "Node.js version too old" error

**Symptom:** Syntax errors or launcher crashes on startup.

**Fix:** This package requires Node.js 18 or later. Check your version:

```bash
node --version
```

If you are on an older version, upgrade via [nodejs.org](https://nodejs.org/) or your package manager.

## Game saves not found

**Symptom:** Starting the game does not find your previous saves.

**Explanation:** The Star Freight binary writes save files to the current working directory. If you run the game from a different directory, it will not see saves from a previous session.

**Fix:** Always launch from the same directory, or navigate to the directory where your saves are stored before running:

```bash
cd ~/star-freight-saves
star-freight
```

## Permission denied on Linux/macOS

**Symptom:** The downloaded binary cannot be executed.

**Fix:** The launcher should set the executable bit automatically. If it does not:

```bash
chmod +x "$(star-freight --print-cache-path)"/*.star-freight*
```

Or clear the cache and let the launcher re-download:

```bash
star-freight --clear-cache
npx @mcptoolshop/star-freight
```

## Reporting bugs

If none of the above fixes your issue:

1. Run `star-freight --version` and note the wrapper version
2. Run `node --version` and note the Node.js version
3. Note your OS and architecture
4. Open an issue at [mcp-tool-shop-org/npm-star-freight](https://github.com/mcp-tool-shop-org/npm-star-freight/issues) with this information and the full error output
