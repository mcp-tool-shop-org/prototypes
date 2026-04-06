---
title: Reference
description: Exit codes, capture format, and ecosystem.
sidebar:
  order: 4
---

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation / data error (bad JSON, invalid capture, unknown command) |
| 2 | Filesystem error (file not found, permission denied, I/O error) |

## Capture format

WebSketch CLI works with WebSketch IR capture files (JSON). Each capture contains a recursive tree of nodes. Top-level fields:

- **version** — Schema version string (currently `"1.0"`)
- **url** — Source URL of the captured page
- **timestamp** — ISO 8601 capture timestamp
- **viewport** — Browser viewport dimensions (`width`, `height` in pixels)
- **root** — Root node of the element tree
- **warnings** — Optional string array (e.g. truncation warnings)

Each node carries:

- **role** — Semantic UI role: PAGE, NAV, HEADER, FOOTER, SECTION, FORM, INPUT, BUTTON, LINK, HEADING, TEXT, IMAGE, LIST, TABLE, DIALOG, TOAST
- **bounds** — Bounding box object `{ x, y, width, height }` in percentage coordinates (0--100) relative to the viewport
- **name** — Optional semantic name (e.g. `"primary_nav"`, `"login"`)
- **text** — Optional text content string for leaf nodes
- **children** — Optional array of child nodes

## Security & data scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | WebSketch IR JSON files (read), rendered ASCII/diff/fingerprint output (write to stdout/files) |
| **Data NOT touched** | No telemetry, no analytics, no network calls, no credential storage |
| **Permissions** | Read: input JSON files. Write: output files to user-specified paths |
| **Network** | None — fully offline CLI tool |

## Ecosystem

| Package | Role |
|---------|------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Core IR types, parser, renderer, differ, fingerprinter |
| [@mcptoolshop/websketch](https://github.com/mcp-tool-shop-org/websketch-cli) | CLI that wraps the IR library for terminal and CI use |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Chrome extension for one-click page capture |
| [@mcptoolshop/websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | MCP server for LLM agent integration |
| [websketch-demo](https://github.com/mcp-tool-shop-org/websketch-demo) | Demo site showing renders and diffs |
