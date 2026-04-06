<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/adapter-github

GitHub Actions adapter — fetch CI run data and release information via the `gh` CLI.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/adapter-github
```

## Prerequisites

Requires the [GitHub CLI](https://cli.github.com/) (`gh`) to be installed and authenticated.

## Usage

```ts
import { fetchCIEvidence, fetchRelease, detectContext, isGhAvailable } from "@receipt-factory/adapter-github";

// Check gh availability
const available = await isGhAvailable();

// Detect current repo context
const ctx = await detectContext();

// Fetch CI run evidence
const evidence = await fetchCIEvidence({ runId: "12345678" });

// Fetch release evidence
const release = await fetchRelease({ tag: "v1.0.0" });
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `fetchCIEvidence` | function | Fetch CI run data from GitHub Actions |
| `fetchRelease` | function | Fetch release data (tag, assets, commits) |
| `detectContext` | function | Detect current repo owner/name from git |
| `isGhAvailable` | function | Check if gh CLI is installed and authed |

## License

MIT
