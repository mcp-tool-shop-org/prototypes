---
title: Ecosystem
description: The WebSketch family of tools -- VS Code, CLI, Chrome extension, MCP server -- all sharing a common IR.
sidebar:
  order: 4
---

WebSketch is not a single tool. It is a family of packages built on a shared grammar and a common intermediate representation (IR). Every tool in the family produces the same `WebSketchCapture` output, so captures are interchangeable between pipelines.

## The Family

| Package | What it does |
|---------|-------------|
| [**websketch-ir**](https://github.com/mcp-tool-shop-org/websketch-ir) | The core IR library. Defines the grammar, validation, rendering, diffing, and fingerprinting. Every other package depends on this. |
| **websketch-vscode** (this repo) | VS Code extension. Capture pages from your editor, browse four views, copy or export for LLMs. |
| [**websketch-cli**](https://github.com/mcp-tool-shop-org/websketch-cli) | Command-line capture and rendering. Scriptable, CI-friendly, works in pipelines. |
| [**websketch-extension**](https://github.com/mcp-tool-shop-org/websketch-extension) | Chrome browser extension. Capture the page you are looking at without leaving the browser. |
| [**websketch-mcp**](https://github.com/mcp-tool-shop-org/websketch-mcp) | MCP server for LLM agent integration. Gives AI agents the ability to capture and reason about web pages as part of their tool chain. |

## Shared IR

All five tools produce a `WebSketchCapture` object. This means:

- A capture from the VS Code extension can be opened in the CLI.
- A capture from the Chrome extension can be fed to the MCP server.
- A capture from the CLI can be diffed against a capture from any other tool.
- JSON exports are identical regardless of which tool produced them.

The IR includes the semantic tree, bounding boxes, content hashes, viewport metadata, and timing information. The `websketch-ir` package provides the schema, validators, and renderers that all other packages use.

## Head-to-Head: WebSketch vs Alternatives

| Metric | WebSketch | Raw HTML | Screenshot |
|--------|-----------|----------|------------|
| **Tokens** | 200--800 | 50,000+ | 1,000+ (vision) |
| **Structure** | Full semantic tree | Nested div chaos | Pixel grid |
| **Text content** | Quoted and labeled | Buried in markup | OCR-dependent |
| **Interactive elements** | Marked with `*` | Hidden in attributes | Invisible |
| **Heading hierarchy** | `<h1>` through `<h6>` preserved | Lost in class names | Guessed from font size |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Requires DOM expertise | Not available |
| **Works with** | Any text LLM | Nothing useful at that token count | Vision models only |

The key advantage is density. WebSketch delivers the same semantic information in two orders of magnitude fewer tokens, and it works with text models that have no vision capability at all.

## Choosing the Right Tool

- **Interactive exploration** -- Use the VS Code extension or Chrome extension. Both give you a visual panel with four views.
- **CI/CD and scripts** -- Use the CLI. It accepts URLs on stdin, outputs to stdout, and returns proper exit codes.
- **AI agent pipelines** -- Use the MCP server. It exposes capture as a tool that any MCP-compatible agent can call.
- **Building your own tools** -- Use the IR library directly. It gives you the grammar, validators, renderers, and differ without any capture dependencies.

---

[Back to landing page](/websketch-vscode/)
