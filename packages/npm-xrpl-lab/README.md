<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-lab/readme.png" width="400" alt="XRPL Lab">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-lab"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-lab" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-lab/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-xrpl-lab/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

XRPL training workbook — learn by doing, prove by artifact.

**No Python required.** This package downloads a prebuilt binary and runs it locally.

## Install & Run

```bash
npx @mcptoolshop/xrpl-lab start
```

That's it. No Python, no pip, no virtual environments.

### Offline mode (recommended for AMM modules)

```bash
npx @mcptoolshop/xrpl-lab start --dry-run
```

Fully offline with simulated transactions. Perfect for learning the workflow — and required for AMM modules until testnet enables the AMM amendment.

## What Happens

1. First run downloads a platform-specific binary (~25 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-lab/releases)
2. Verifies SHA256 checksum
3. Caches locally (`~/.cache/mcptoolshop/xrpl-lab/`)
4. Runs with full arg passthrough

Subsequent runs launch instantly from cache.

## Modules

12 hands-on modules across three tracks:

| Track | Modules |
|-------|---------|
| **Beginner** | Receipt Literacy, Failure Literacy, Trust Lines 101, Debugging Trust Lines |
| **Intermediate** | DEX Literacy, Reserves 101, Account Hygiene, Receipt Audit |
| **Advanced** | AMM Liquidity 101, DEX Market Making 101, Inventory Guardrails, DEX vs AMM Risk Literacy |

Each module produces a verifiable artifact — transaction IDs, audit packs, proof packs with SHA-256 integrity.

## Commands

```bash
npx @mcptoolshop/xrpl-lab start          # guided launcher
npx @mcptoolshop/xrpl-lab list           # show all modules
npx @mcptoolshop/xrpl-lab run <module>   # run a specific module
npx @mcptoolshop/xrpl-lab status         # check progress
npx @mcptoolshop/xrpl-lab doctor         # diagnose environment
npx @mcptoolshop/xrpl-lab audit          # batch verify transactions
npx @mcptoolshop/xrpl-lab last-run       # show last run + audit command
npx @mcptoolshop/xrpl-lab --help         # see all commands
```

## Supported Platforms

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Troubleshooting

```bash
npx @mcptoolshop/xrpl-lab doctor             # diagnose your environment
npx @mcptoolshop/xrpl-lab feedback           # generate issue-ready markdown
npx @mcptoolshop/xrpl-lab --print-cache-path # show cached binary location
npx @mcptoolshop/xrpl-lab --clear-cache      # force fresh re-download
```

**Pin to a specific version** if the latest has a regression:

```bash
npx @mcptoolshop/xrpl-lab@1.0.0 start
```

## Security

All binaries are verified against SHA256 checksums before execution. No telemetry. No network access beyond the initial download from GitHub.

Powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative: Install via Python

If you prefer Python:

```bash
pipx install xrpl-lab
xrpl-lab start
```

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
