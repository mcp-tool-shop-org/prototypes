---
title: Getting Started
description: Install WebSketch CLI and render your first capture.
sidebar:
  order: 1
---

WebSketch CLI consumes WebSketch IR captures — structured JSON representations of web page layouts — and lets you render, diff, fingerprint, and bundle them from the terminal.

## Installation

```bash
pnpm add -g @mcptoolshop/websketch
```

Or run without installing:

```bash
npx @mcptoolshop/websketch render-ascii capture.json
```

## What is WebSketch?

WebSketch is a system for creating structured, machine-readable representations of web page layouts. Instead of working with screenshots (pixel grids), WebSketch produces an Intermediate Representation (IR) that describes what elements exist on the page, where they are positioned, what role they serve, and what text they contain.

The CLI can:

- **Render** a capture as ASCII art that fits in a terminal or LLM context window
- **Fingerprint** a page's structure into a short hash for change detection
- **Diff** two captures to produce a ranked list of layout and content changes
- **Bundle** captures into a single portable file for sharing

## Creating captures

WebSketch CLI works with capture files created by:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) — Chrome extension for one-click page capture
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) — Build captures programmatically in TypeScript

## Quick example

```bash
# Validate a capture file
websketch validate capture.json

# Render as ASCII art
websketch render-ascii capture.json

# Get a structural fingerprint
websketch fingerprint capture.json

# Compare two captures
websketch diff before.json after.json
```
