---
title: Beginners Guide
description: Step-by-step walkthrough for first-time WebSketch CLI users.
sidebar:
  order: 99
---

New to WebSketch CLI? This guide walks you through everything from installation to running your first diff, with no assumptions about prior experience.

## What does this tool do?

WebSketch CLI reads JSON files that describe the layout of a web page and turns them into useful outputs:

- **ASCII art** showing the page structure in your terminal
- **Fingerprints** that summarize a layout as a short hash
- **Diffs** that list exactly what changed between two page captures
- **Bundles** that package captures into a single file for sharing

These JSON files are called WebSketch IR captures. They contain a tree of UI elements (buttons, forms, navigation bars, text) with their positions and roles -- no pixels, no screenshots.

## Prerequisites

You need **Node.js 18 or later** installed. Check your version:

```bash
node --version
```

If you see `v18.x.x` or higher, you are ready. If not, install Node.js from [nodejs.org](https://nodejs.org/).

## Installation

Install globally so the `websketch` command is available everywhere:

```bash
npm install -g @mcptoolshop/websketch
```

Verify it works:

```bash
websketch --version
```

You should see output like `websketch v1.0.1`.

If you prefer not to install globally, use `npx` to run commands on demand:

```bash
npx @mcptoolshop/websketch --version
```

## Your first capture file

Before you can use the CLI, you need a capture file. The simplest way to create one is to write a minimal example by hand. Save this as `example.json`:

```json
{
  "version": "1.0",
  "url": "https://example.com",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "viewport": { "width": 1280, "height": 720 },
  "root": {
    "role": "PAGE",
    "bounds": { "x": 0, "y": 0, "width": 100, "height": 100 },
    "children": [
      {
        "role": "NAV",
        "bounds": { "x": 0, "y": 0, "width": 100, "height": 8 },
        "name": "main_nav"
      },
      {
        "role": "FORM",
        "bounds": { "x": 25, "y": 20, "width": 50, "height": 40 },
        "name": "login",
        "children": [
          {
            "role": "INPUT",
            "bounds": { "x": 30, "y": 25, "width": 40, "height": 5 },
            "name": "email"
          },
          {
            "role": "INPUT",
            "bounds": { "x": 30, "y": 32, "width": 40, "height": 5 },
            "name": "password"
          },
          {
            "role": "BUTTON",
            "bounds": { "x": 35, "y": 42, "width": 30, "height": 6 },
            "name": "submit",
            "text": "Sign In"
          }
        ]
      }
    ]
  }
}
```

In practice, you would create captures with the [WebSketch Chrome extension](https://github.com/mcp-tool-shop-org/websketch-extension) or programmatically using the [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) library.

## Step-by-step walkthrough

### 1. Validate your capture

Always validate first to make sure the file is well-formed:

```bash
websketch validate example.json
```

Expected output:

```
Valid WebSketch capture.
  URL: https://example.com
  Version: 1.0
  Root role: PAGE
```

If you see an error, check that all required fields are present: `version`, `url`, `root` (with `role` and `bounds`).

### 2. Render as ASCII art

See the page layout in your terminal:

```bash
websketch render-ascii example.json
```

This draws a box-drawing diagram showing where each element sits on the page. Elements appear as labeled boxes like `[NAV:main_nav]` and `[BTN:submit]`.

For wider output:

```bash
websketch render-ascii --width 120 --height 40 example.json
```

For output designed to paste into an LLM conversation:

```bash
websketch render-ascii --llm example.json
```

### 3. Compute a fingerprint

Get a short hash that represents the page structure:

```bash
websketch fingerprint example.json
```

This prints a hex string like `e33442b6`. If you later change the capture and the fingerprint changes, you know the layout is different.

To ignore text content and only fingerprint the structural layout:

```bash
websketch fingerprint --layout-only example.json
```

### 4. Diff two captures

Create a second file called `example-v2.json` with a small change (for instance, add a new element or move one). Then compare:

```bash
websketch diff example.json example-v2.json
```

The output lists every change: added elements, removed elements, moved elements, resized elements, and text changes -- ranked by significance.

### 5. Bundle captures

Package one or more captures into a single file:

```bash
websketch bundle example.json -o my-bundle.ws.json
```

When you bundle exactly two captures, the bundle automatically includes a diff:

```bash
websketch bundle example.json example-v2.json -o comparison.ws.json
```

## Common mistakes

**"File not found" errors.** The CLI resolves paths relative to your current working directory. Use absolute paths if unsure:

```bash
websketch validate /full/path/to/capture.json
```

**"Invalid capture" after hand-editing.** The parser is strict. Every node needs a `role` and `bounds` object with all four properties (`x`, `y`, `width`, `height`). The root capture needs `version` and `url`.

**Fingerprint changed but diff shows nothing meaningful.** Text content changes (timestamps, dynamic labels) affect the fingerprint. Use `--layout-only` to hash only structure:

```bash
websketch fingerprint --layout-only capture.json
```

## Next steps

- **[Commands](/websketch-cli/handbook/commands/)** for the full flag reference on every command
- **[Pipeline Patterns](/websketch-cli/handbook/pipeline-patterns/)** for CI integration and LLM agent workflows
- **[Reference](/websketch-cli/handbook/reference/)** for the complete capture format specification and ecosystem overview
