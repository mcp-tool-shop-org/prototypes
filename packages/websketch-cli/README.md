<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## At a Glance

- **ASCII rendering** -- turn any WebSketch capture into a box-drawing layout that fits in a terminal or LLM context window
- **Structural fingerprinting** -- hash a page's layout so you can detect changes without pixel diffing
- **Semantic diff** -- compare two captures and get a ranked change report (added, moved, resized, text changed)
- **Bundle packaging** -- combine captures (and optional diff) into a single shareable `.ws.json` file
- **Pipeline-first** -- every command supports `--json` output and deterministic exit codes for CI scripting
- **LLM-optimized mode** -- `--llm` flag produces metadata-rich output designed for agent consumption

## Install

```bash
pnpm add -g @mcptoolshop/websketch
```

Or run without installing:

```bash
npx @mcptoolshop/websketch render capture.json
```

## Commands

### validate

Check that a capture file conforms to the WebSketch IR schema.

```bash
websketch validate capture.json
```

### render-ascii

Render a capture to ASCII art (LLM-readable).

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

**Example output:**

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### fingerprint

Compute a structural fingerprint for comparison.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### diff

Compare two captures and report changes.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### bundle

Package one or more captures into a shareable `.ws.json` file. When exactly two captures are provided, the bundle automatically includes a diff summary.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## Pipeline Mode

Add `--json` before any command for machine-readable output:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Success:** `{ "ok": true, ... }`

**Error:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

Exit codes still apply in JSON mode -- use `$?` or `set -e` in scripts.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation / data error (bad JSON, invalid capture, unknown command) |
| 2 | Filesystem error (file not found, permission denied, I/O error) |

## Capture Format

This CLI works with WebSketch IR capture files (JSON). Create captures using:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- Chrome extension for one-click page capture
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- build captures programmatically

## Docs

| Document | Description |
|----------|-------------|
| [HANDBOOK.md](HANDBOOK.md) | Deep-dive guide: architecture, commands, pipeline patterns, integration |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute, dev setup, PR guidelines |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | WebSketch IR JSON files (read), rendered ASCII/diff/fingerprint output (write to stdout/files) |
| **Data NOT touched** | No telemetry, no analytics, no network calls, no credential storage |
| **Permissions** | Read: input JSON files. Write: output files to user-specified paths |
| **Network** | None — fully offline CLI tool |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT
