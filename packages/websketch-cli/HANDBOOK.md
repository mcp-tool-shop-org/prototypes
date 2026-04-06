# WebSketch CLI Handbook

Deep-dive guide for `@mcptoolshop/websketch` -- the command-line interface for rendering, diffing, and fingerprinting WebSketch IR captures.

---

## Table of Contents

1. [What is WebSketch?](#what-is-websketch)
2. [Why it Exists](#why-it-exists)
3. [Architecture Overview](#architecture-overview)
4. [The WebSketch Ecosystem](#the-websketch-ecosystem)
5. [Command Deep Dives](#command-deep-dives)
   - [validate](#validate)
   - [render-ascii](#render-ascii)
   - [fingerprint](#fingerprint)
   - [diff](#diff)
   - [bundle](#bundle)
6. [Pipeline Patterns](#pipeline-patterns)
7. [Integration Patterns](#integration-patterns)
   - [CI Visual Regression](#ci-visual-regression)
   - [LLM Agent Workflows](#llm-agent-workflows)
   - [MCP Server Usage](#mcp-server-usage)
8. [Capture Format Reference](#capture-format-reference)
9. [Troubleshooting and FAQ](#troubleshooting-and-faq)

---

## What is WebSketch?

WebSketch is a system for creating structured, machine-readable representations of web page layouts. Instead of working with screenshots (pixel grids), WebSketch produces an Intermediate Representation (IR) that describes what elements exist on the page, where they are positioned, what role they serve, and what text they contain.

The **WebSketch CLI** is the tool you use to consume those captures. It can:

- Render a capture as ASCII art that fits in a terminal or chat context
- Compute a fingerprint that summarizes a page's structure in a short hash
- Diff two captures to produce a ranked list of layout and content changes
- Bundle captures into a single portable file for sharing or archival

## Why it Exists

LLMs cannot see pixels. When an agent needs to understand what a user sees in their browser, passing a screenshot into a vision model is expensive, slow, and lossy. WebSketch solves this by converting the live DOM into a lightweight tree of semantic nodes -- roles, bounding boxes, names, text content -- that any text-based model can reason about directly.

This matters for three use cases:

1. **LLM agents** that need to describe, navigate, or verify web UIs without vision APIs.
2. **CI pipelines** that want to detect layout regressions without maintaining pixel-based screenshot baselines.
3. **Developers** who want a quick structural view of a page without opening browser devtools.

## Architecture Overview

The WebSketch pipeline has three stages:

```
Browser DOM  --->  WebSketch IR (JSON)  --->  CLI Output
  (live)           (captured tree)           (ASCII / fingerprint / diff)
```

**Stage 1: Capture.** The Chrome extension walks the DOM, computes bounding rectangles, classifies elements by role, and serializes the result as a WebSketch IR JSON file.

**Stage 2: Storage.** The capture is a standalone JSON file. It contains a version field, the source URL, a timestamp, the viewport dimensions, and a recursive tree of nodes. Each node has a role (NAV, FORM, BUTTON, INPUT, TEXT, IMAGE, etc.), a bounding box in percentage coordinates, an optional semantic name, and optional text content.

**Stage 3: Consumption.** The CLI reads one or more capture files and produces output. Rendering maps nodes to character cells. Fingerprinting hashes the tree structure. Diffing aligns nodes across two trees and classifies changes.

All three stages are decoupled. You can create captures with the extension and consume them with the CLI, or build captures programmatically with the IR library and pipe them straight into the CLI.

## The WebSketch Ecosystem

WebSketch is split across several packages. Each has a single responsibility.

| Package | Role | Repository |
|---------|------|------------|
| `@mcptoolshop/websketch-ir` | Core IR types, parser, renderer, differ, fingerprinter | [websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) |
| `@mcptoolshop/websketch` | CLI that wraps the IR library for terminal and CI use | [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) |
| websketch-extension | Chrome extension that captures live pages to IR | [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) |
| `@mcptoolshop/websketch-mcp` | MCP server that exposes capture + render to LLM agents | [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) |
| websketch-demo | Demo site showing renders and diffs | [websketch-demo](https://github.com/mcp-tool-shop-org/websketch-demo) |

The CLI depends only on `@mcptoolshop/websketch-ir`. It has no browser dependencies and runs anywhere Node 18+ is available.

## Command Deep Dives

### validate

**Purpose:** Confirm that a JSON file is a valid WebSketch IR capture. Useful as a pre-check before feeding captures into downstream tools.

**Syntax:**

```bash
websketch validate <capture.json>
```

**What it checks:**

- File exists and is readable
- Content is valid JSON
- JSON conforms to the WebSketch IR schema (version, url, root with role and bounds)

**Output (text mode):**

```
Valid WebSketch capture.
  URL: https://example.com
  Version: 1.0
  Root role: PAGE
```

If the capture contains embedded warnings (for example, truncation warnings from the extension), those are surfaced:

```
Valid WebSketch capture.
  URL: https://example.com/dashboard
  Version: 1.0
  Root role: PAGE
  Warning: Tree truncated at depth 12 (max-depth limit)
```

**Output (JSON mode):**

```bash
websketch --json validate capture.json
```

```json
{ "ok": true, "valid": true }
```

With warnings:

```json
{ "ok": true, "valid": true, "warnings": ["Tree truncated at depth 12 (max-depth limit)"] }
```

### render-ascii

**Purpose:** Convert a capture into ASCII box-drawing art. The default output fits an 80x24 terminal. You can customize dimensions, switch to LLM-optimized format, or strip down to structure-only view.

**Syntax:**

```bash
websketch render-ascii [flags] <capture.json>
```

Aliases: `render`, `ascii`

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--width <n>` | 80 | Grid width in characters |
| `--height <n>` | 24 | Grid height in characters |
| `--llm` | off | LLM-optimized output with metadata header and legend |
| `--structure` | off | Minimal view showing only the node hierarchy, no text |

**Flag behavior notes:**

- `--llm` overrides `--width` and `--height` (the LLM renderer uses its own layout).
- `--structure` respects `--width` and `--height`.
- `--llm` and `--structure` are mutually exclusive; if both are passed, `--llm` wins.

**Examples:**

Default render:

```bash
websketch render-ascii capture.json
```

Wide render for a large terminal:

```bash
websketch render-ascii --width 160 --height 50 capture.json
```

LLM-optimized (best for sending to an agent):

```bash
websketch render-ascii --llm capture.json
```

Structure-only (when you only care about element hierarchy):

```bash
websketch render-ascii --structure capture.json
```

JSON envelope:

```bash
websketch --json render-ascii capture.json
```

```json
{ "ok": true, "ascii": "+---------+\n|[NAV]    |\n..." }
```

### fingerprint

**Purpose:** Produce a short hex hash that summarizes the structural layout of a capture. Two captures with the same fingerprint have the same element tree. Useful for deduplication and change detection without running a full diff.

**Syntax:**

```bash
websketch fingerprint [flags] <capture.json>
```

Alias: `fp`

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--layout-only` | off | Ignore text content; hash only roles and positions |

**How the hash is computed:**

The full fingerprint walks the node tree depth-first, feeding each node's role, name, bounding box, and text content into a hash. The layout-only fingerprint omits text content and name, so pages that differ only in copy produce the same hash.

**Examples:**

```bash
websketch fingerprint capture.json
# e33442b6

websketch fingerprint --layout-only capture.json
# a1c8f002
```

Comparing two captures by fingerprint:

```bash
FP_BEFORE=$(websketch fingerprint before.json)
FP_AFTER=$(websketch fingerprint after.json)

if [ "$FP_BEFORE" != "$FP_AFTER" ]; then
  echo "Layout changed -- running full diff"
  websketch diff before.json after.json
fi
```

### diff

**Purpose:** Compare two captures node-by-node and produce a report of what changed. The differ aligns nodes across the two trees using role, position, and name similarity, then classifies each pair as identical, moved, resized, text-changed, added, or removed.

**Syntax:**

```bash
websketch diff [flags] <before.json> <after.json>
```

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--layout-only` | off | Ignore text and name changes |
| `--threshold <n>` | 0.5 | Match similarity threshold (0 to 1). Lower values produce more matches; higher values require closer similarity to pair nodes. |
| `--json` | off | (Local flag) Output the diff as formatted JSON instead of the human-readable report. Distinct from the global `--json` flag. |

**Understanding the threshold:** The differ scores each potential node pair on role match, bounding-box overlap, and name similarity. Pairs scoring above the threshold are matched; the rest are classified as added or removed. If you see too many spurious add/remove pairs, lower the threshold. If unrelated nodes are being paired, raise it.

**Human-readable output:**

```
WebSketch IR Diff Report
========================================

SUMMARY
----------------------------------------
Nodes: 14 -> 16
Identical: No

CHANGE COUNTS
----------------------------------------
  Added:      2
  Moved:      6
  Resized:    2
  Text:       2

TOP CHANGES (by area)
----------------------------------------
  [CHILDREN_CHANGED] PAGE children: 3 -> 4
  [MOVED] FORM:login moved by (0.0%, 2.0%)
  [ADDED] Added TOAST:notification at (70%, 10%)
```

**JSON output (global flag):**

```bash
websketch --json diff before.json after.json
```

```json
{
  "ok": true,
  "diff": {
    "summary": { "beforeCount": 14, "afterCount": 16, "identical": false },
    "changes": [ ... ]
  }
}
```

**JSON output (local flag):**

```bash
websketch diff --json before.json after.json
```

This produces a formatted JSON string of the diff result directly (no `ok` envelope). It is the legacy format, kept for backward compatibility.

### bundle

**Purpose:** Package one or more capture files into a single `.ws.json` bundle. When exactly two captures are provided, the bundle automatically includes a diff summary. Useful for sharing before/after pairs or archiving a set of related captures.

**Syntax:**

```bash
websketch bundle <files...> [-o <output>]
```

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `-o <path>` | stdout | Write the bundle to a file instead of printing to stdout |

**Examples:**

Single capture bundle:

```bash
websketch bundle capture.json -o snapshot.ws.json
```

Before/after bundle with diff:

```bash
websketch bundle before.json after.json -o regression.ws.json
```

Bundle to stdout (pipe to another tool):

```bash
websketch bundle capture.json | jq '.captures[0].capture.url'
```

## Pipeline Patterns

Every command supports a `--json` global flag and deterministic exit codes. This makes WebSketch composable with shell scripts, CI runners, and other CLI tools.

### JSON mode and jq

```bash
# Extract just the fingerprint string
websketch --json fingerprint capture.json | jq -r '.fingerprint'

# Check if a capture is valid (exit 0 if valid)
websketch --json validate capture.json | jq -e '.valid'

# Get the diff change count
websketch --json diff before.json after.json | jq '.diff.changes | length'
```

### Exit code branching

```bash
#!/bin/bash
set -e

# Validate first -- exit 1 if invalid, exit 2 if file missing
websketch validate "$1"

# If validation passed, render
websketch render-ascii --llm "$1"
```

### Chaining fingerprint and diff

A common pattern: fingerprint first (fast), then diff only if the fingerprint changed (slower).

```bash
#!/bin/bash
BEFORE="$1"
AFTER="$2"

FP_B=$(websketch fingerprint --layout-only "$BEFORE")
FP_A=$(websketch fingerprint --layout-only "$AFTER")

if [ "$FP_B" = "$FP_A" ]; then
  echo "No structural changes detected."
  exit 0
fi

echo "Structure changed ($FP_B -> $FP_A). Running diff..."
websketch diff "$BEFORE" "$AFTER"
```

### Batch processing

```bash
# Validate all captures in a directory
for f in captures/*.json; do
  if ! websketch --json validate "$f" | jq -e '.valid' > /dev/null 2>&1; then
    echo "INVALID: $f"
  fi
done
```

## Integration Patterns

### CI Visual Regression

Use WebSketch in a GitHub Actions workflow to detect layout changes on every PR.

**Strategy:** Capture the page with a headless browser step, run `fingerprint --layout-only` against a stored baseline, and fail the job if the fingerprint differs.

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression
on: pull_request

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install websketch
        run: npm install -g @mcptoolshop/websketch

      - name: Capture current page
        run: node scripts/capture-page.js > current.json

      - name: Compare fingerprints
        run: |
          BASELINE=$(websketch fingerprint --layout-only baseline.json)
          CURRENT=$(websketch fingerprint --layout-only current.json)
          if [ "$BASELINE" != "$CURRENT" ]; then
            echo "::error::Layout fingerprint changed ($BASELINE -> $CURRENT)"
            websketch diff baseline.json current.json
            exit 1
          fi
          echo "Layout fingerprint matches baseline."
```

For more granular checks, replace the fingerprint comparison with a full diff and parse the JSON output to enforce thresholds:

```bash
ADDED=$(websketch --json diff baseline.json current.json | jq '[.diff.changes[] | select(.type == "ADDED")] | length')
if [ "$ADDED" -gt 0 ]; then
  echo "::warning::$ADDED new elements detected"
fi
```

### LLM Agent Workflows

When an LLM agent needs to understand the current state of a web page, pipe the render output into the agent's context.

```bash
# Capture the page (extension or programmatic)
# Then render for the agent
LAYOUT=$(websketch render-ascii --llm capture.json)

# Feed to an LLM via API
curl -s https://api.example.com/chat \
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Describe this page layout:\n$LAYOUT\"}]}"
```

The `--llm` flag adds metadata (URL, viewport size, node count) and a legend explaining the notation, which improves agent comprehension.

For agents that need to track changes over time, combine diff with render:

```bash
# Show the agent what changed
CHANGES=$(websketch --json diff before.json after.json | jq -r '.diff.changes[] | "\(.type): \(.description)"')
CURRENT=$(websketch render-ascii --llm after.json)

PROMPT="The page layout changed. Here are the changes:
$CHANGES

Current layout:
$CURRENT

What happened?"
```

### MCP Server Usage

The WebSketch MCP server (`@mcptoolshop/websketch-mcp`) exposes capture and render as MCP tools that LLM agents can call directly. Under the hood, it uses the same IR library as the CLI.

If you are building a custom MCP server and want to include WebSketch capabilities, you can shell out to the CLI:

```typescript
import { exec } from "child_process";

async function renderCapture(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`websketch --json render-ascii --llm "${path}"`, (err, stdout) => {
      if (err) return reject(err);
      const result = JSON.parse(stdout);
      if (!result.ok) return reject(new Error(result.error.message));
      resolve(result.ascii);
    });
  });
}
```

Or depend on `@mcptoolshop/websketch-ir` directly for in-process use without spawning a child process.

## Capture Format Reference

A WebSketch IR capture file is a JSON object with the following top-level fields:

```json
{
  "version": "1.0",
  "url": "https://example.com/login",
  "timestamp": "2026-02-17T12:00:00.000Z",
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "root": {
    "role": "PAGE",
    "bounds": { "x": 0, "y": 0, "width": 100, "height": 100 },
    "children": [ ... ]
  }
}
```

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | IR schema version (currently `"1.0"`) |
| `url` | string | Source URL of the captured page |
| `timestamp` | string | ISO 8601 timestamp of when the capture was taken |
| `viewport` | object | Browser viewport dimensions in pixels (`width`, `height`) |
| `root` | object | Root node of the element tree |
| `warnings` | string[] | Optional. Warnings generated during capture (e.g. truncation) |

### Node fields

Each node in the tree has these fields:

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | Semantic role: PAGE, NAV, FORM, BUTTON, INPUT, TEXT, IMAGE, HEADING, LINK, LIST, TABLE, SECTION, FOOTER, HEADER, DIALOG, TOAST, etc. |
| `bounds` | object | Bounding box in percentage coordinates: `{ x, y, width, height }`. Values range from 0 to 100, relative to the viewport. |
| `name` | string? | Optional semantic name (e.g. `"primary_nav"`, `"login"`, `"email"`) |
| `text` | string? | Optional text content for leaf nodes |
| `children` | node[] | Optional array of child nodes |

### Coordinate system

Bounds use percentage coordinates relative to the viewport. A node at `{ x: 50, y: 0, width: 50, height: 10 }` occupies the top-right quarter-width and top 10% of the page. This makes captures resolution-independent.

### Roles

Roles are semantic, not HTML tags. A `<div>` that functions as a navigation bar gets the role `NAV`, not `DIV`. The extension's classifier maps DOM elements to roles based on ARIA attributes, tag names, and heuristics.

Common roles and their meanings:

| Role | Typical DOM source | Description |
|------|-------------------|-------------|
| PAGE | `<body>` | Root container for the entire page |
| NAV | `<nav>`, navigation landmarks | Navigation bars and menus |
| HEADER | `<header>` | Page or section header |
| FOOTER | `<footer>` | Page or section footer |
| SECTION | `<section>`, `<main>`, `<article>` | Generic content sections |
| FORM | `<form>` | Form containers |
| INPUT | `<input>`, `<textarea>`, `<select>` | Form input fields |
| BUTTON | `<button>`, `<a>` with button role | Clickable actions |
| LINK | `<a>` | Hyperlinks |
| HEADING | `<h1>` through `<h6>` | Section headings |
| TEXT | `<p>`, `<span>`, text nodes | Text content |
| IMAGE | `<img>`, `<svg>` | Visual media |
| LIST | `<ul>`, `<ol>` | Ordered and unordered lists |
| TABLE | `<table>` | Data tables |
| DIALOG | `<dialog>`, modals | Modal and non-modal dialogs |
| TOAST | Notification elements | Toast notifications and alerts |

## Troubleshooting and FAQ

### "File not found" errors

The CLI resolves paths relative to your current working directory. If you get a `WS_NOT_FOUND` error, check:

```bash
# Is the file where you think it is?
ls -la capture.json

# Use an absolute path to be sure
websketch validate /home/user/captures/capture.json
```

### "Invalid capture" after editing a file

The parser is strict. Common mistakes:

- Missing `version` field (must be a string like `"1.0"`)
- Missing `url` field
- `bounds` with missing properties (all four -- `x`, `y`, `width`, `height` -- are required)
- `role` set to an unrecognized value

Run `validate` to get the specific validation error:

```bash
websketch --json validate broken.json | jq '.error'
```

### Fingerprint changed but diff shows no meaningful changes

This usually means text content changed (button labels, timestamps, dynamic content). Use `--layout-only` to ignore text:

```bash
websketch fingerprint --layout-only capture.json
websketch diff --layout-only before.json after.json
```

### Diff reports too many "added/removed" instead of "moved"

The match threshold may be too high. Lower it to allow the differ to pair nodes that moved significantly:

```bash
websketch diff --threshold 0.3 before.json after.json
```

### ASCII render looks too cramped

Increase the grid dimensions:

```bash
websketch render-ascii --width 160 --height 60 capture.json
```

For LLM consumption, use `--llm` which picks its own layout:

```bash
websketch render-ascii --llm capture.json
```

### How do I create a capture file?

You have two options:

1. **Chrome extension:** Install the [WebSketch extension](https://github.com/mcp-tool-shop-org/websketch-extension), navigate to any page, click the extension icon, and save the JSON output.

2. **Programmatically:** Use the [`@mcptoolshop/websketch-ir`](https://github.com/mcp-tool-shop-org/websketch-ir) library to build a capture from your own DOM traversal or test framework.

### Can I use WebSketch with Playwright or Puppeteer?

Yes. Write a script that runs in the browser context to walk the DOM and produce an IR-compatible JSON object, then save it and pass it to the CLI. The `websketch-ir` library provides `parseCapture()` to validate your output conforms to the schema.

### What is the `.ws.json` bundle format?

A bundle is a JSON file with this structure:

```json
{
  "schemaVersion": "0.1",
  "createdAt": "2026-02-17T12:00:00.000Z",
  "tool": "websketch-cli/0.4.0",
  "captures": [
    { "source": "before.json", "capture": { ... } },
    { "source": "after.json", "capture": { ... } }
  ],
  "diff": {
    "summary": { ... },
    "changes": [ ... ]
  }
}
```

The `diff` field is only present when exactly two captures are bundled.

### Does the CLI need a browser?

No. The CLI is a pure Node.js tool with no browser dependencies. It reads JSON files and produces text output. The browser is only needed at capture time (via the extension).
