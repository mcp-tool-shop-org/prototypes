---
title: Pipeline Patterns
description: CI integration, JSON mode, and LLM agent workflows.
sidebar:
  order: 3
---

## JSON mode

Add `--json` before any command for machine-readable output:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**Success:** `{ "ok": true, ... }`

**Error:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

Exit codes still apply in JSON mode — use `$?` or `set -e` in scripts.

## CI visual regression

Use fingerprinting to detect layout regressions without maintaining pixel baselines:

```bash
# Capture the page (via extension or programmatic capture)
# Then compare fingerprints
BEFORE=$(websketch fingerprint baseline.json)
AFTER=$(websketch fingerprint current.json)

if [ "$BEFORE" != "$AFTER" ]; then
  echo "Layout changed!"
  websketch diff baseline.json current.json
  exit 1
fi
```

## LLM agent workflows

The `--llm` flag on `render-ascii` produces output optimized for language model consumption:

```bash
websketch render-ascii --llm capture.json
```

This includes:
- Page URL and viewport dimensions in a header
- The ASCII wireframe
- A legend explaining the bracket notation (`[BTN:label]`, `[NAV:name]`, etc.)

Feed this directly into an LLM context window for UI understanding without vision capabilities.

## MCP server integration

For agents that use the Model Context Protocol, [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) exposes these same operations as MCP tools — no shell access required.
