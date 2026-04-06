---
title: Commands
description: Deep dive into every WebSketch CLI command.
sidebar:
  order: 2
---

## validate

Check that a capture file conforms to the WebSketch IR schema.

```bash
websketch validate capture.json
```

Returns exit code 0 on success, 1 on validation failure.

## render-ascii

Aliases: `render`, `ascii`

Render a capture to ASCII art — an LLM-readable box-drawing layout.

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

The `--llm` flag produces metadata-rich output designed for agent consumption, including URL, viewport dimensions, and a legend explaining the shorthand notation.

## fingerprint

Alias: `fp`

Compute a structural fingerprint for comparison.

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

The layout-only mode is useful for detecting structural shifts while ignoring content updates.

## diff

Compare two captures and report changes.

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output for CI pipelines
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

Changes are ranked by significance: added, removed, moved, resized, text changed.

## bundle

Package one or more captures into a single shareable `.ws.json` file. When exactly two captures are provided, the bundle automatically includes a diff summary.

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```
