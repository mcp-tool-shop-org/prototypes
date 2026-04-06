<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Learn the XRP Ledger in one sitting — wallet, payment, verification, certificate in 10 minutes.

**No Python required.** This package downloads a prebuilt binary and runs it locally.

## Install & Run

```bash
npx @mcptoolshop/xrpl-camp start
```

That's it. No Python, no pip, no virtual environments.

## What Happens

1. First run downloads a platform-specific binary (~20 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases)
2. Verifies SHA256 checksum
3. Caches locally (`~/.cache/mcptoolshop/xrpl-camp/`)
4. Runs with full arg passthrough

Subsequent runs launch instantly from cache.

## Commands

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## Supported Platforms

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Troubleshooting

```bash
npx @mcptoolshop/xrpl-camp self-check         # diagnose your environment
npx @mcptoolshop/xrpl-camp support-bundle     # write a zip for bug reports
npx @mcptoolshop/xrpl-camp --print-cache-path # show cached binary location
npx @mcptoolshop/xrpl-camp --clear-cache      # force fresh re-download
```

**Pin to a specific version** if the latest has a regression:

```bash
npx @mcptoolshop/xrpl-camp@1.0.5 start
```

## Security

All binaries are verified against SHA256 checksums before execution. No telemetry. No network access beyond the initial download from GitHub.

Powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative: Install via Python

If you prefer Python:

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
