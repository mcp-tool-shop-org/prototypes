---
title: Beginners Guide
description: New to WebSketch Extension? This page walks you through everything from zero.
sidebar:
  order: 99
---

New to WebSketch Extension? This guide covers what the extension does, how to set it up, and how to use it effectively -- no prior experience required.

## What is WebSketch Extension?

WebSketch Extension is a Chrome browser extension that takes a structured snapshot of any web page you are viewing. Instead of a visual screenshot (an image), it captures the page's DOM tree -- the underlying structure of HTML elements, their positions, styles, and text content. The output is a JSON document that machines (and LLMs) can read and reason about.

This is useful when you want to:

- Give an AI model structured context about a UI layout
- Diff two versions of a page to detect changes
- Inspect a page's structure without opening DevTools
- Feed page data into automation pipelines

The extension produces a **RawCapture** -- a pre-compilation DOM snapshot. This captures the raw HTML structure as-is. It can optionally be compiled into the full [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) grammar using the CLI, which normalizes the data into a stricter grammar that LLMs can parse more reliably. For most use cases, the RawCapture is sufficient.

## Prerequisites

Before installing the extension you need:

- **Google Chrome** (or any Chromium-based browser such as Edge, Brave, or Arc)
- **Node.js 18 or newer** -- download from [nodejs.org](https://nodejs.org/) if you don't have it
- **npm** -- ships with Node.js
- **Git** -- to clone the repository

To verify your setup, open a terminal and run:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
git --version    # should print git version 2.x.x
```

## Installation step by step

### 1. Clone the repository

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
```

### 2. Install dependencies

```bash
npm ci
```

This installs all required packages including the `@mcptoolshop/websketch-ir` library and the esbuild bundler.

### 3. Build the extension

```bash
npm run build
```

This runs the build script (`build.js`) which:
- Bundles the TypeScript source files with esbuild
- Copies static assets (HTML files and icons) to `dist/`
- Generates a `manifest.json` (Manifest V3) in `dist/`

### 4. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle **Developer mode** on (switch in the top-right corner)
3. Click **Load unpacked**
4. Browse to the `dist/` folder inside your cloned repository and select it

The WebSketch icon appears in your browser toolbar. If you don't see it, click the puzzle-piece icon in the toolbar and pin WebSketch.

## Your first capture

1. Navigate to any web page (for example, `https://example.com`)
2. Click the **WebSketch** icon in the toolbar -- a popup opens
3. Click the **Capture Current Page** button
4. The popup shows a green "Capture successful!" message and the JSON is automatically copied to your clipboard
5. Paste the result into a text editor or a tool that accepts JSON

### What you will see

The captured JSON has three top-level fields:

- **`root`** -- the DOM tree starting from `<html>`. Each node includes the tag name, element ID, CSS classes, direct text content, a bounding box (`x`, `y`, `width`, `height` from `getBoundingClientRect`), and three computed style properties (`display`, `position`, `visibility`). Child elements are nested under a `children` array.
- **`metadata`** -- page URL, title, capture timestamp, schema version (`"0.1"`), and viewport dimensions.
- **`warnings`** (optional) -- present only when a capture limit was exceeded. A yellow banner also appears in the popup showing the first warning.

### Understanding a node

Each node in the tree represents one HTML element. Here is what the fields mean:

| Field | Example | Meaning |
|-------|---------|---------|
| `type` | `"DIV"` | The HTML tag name in uppercase |
| `id` | `"main-content"` | The element's `id` attribute (omitted if empty) |
| `classes` | `["container", "flex"]` | CSS class names (omitted if none) |
| `text` | `"Hello world"` | Direct text content, not including child elements (truncated to `maxStringLength`) |
| `bounds` | `{ "x": 0, "y": 64, "width": 1200, "height": 800 }` | Position and size on screen in pixels |
| `styles` | `{ "display": "flex", "position": "relative", "visibility": "visible" }` | Three key layout properties |
| `children` | `[...]` | Nested child nodes (omitted if none or depth limit reached) |

## Configuring settings

Click **Settings** in the top-right corner of the popup to open the options page. Three settings control how much of the page is captured:

| Setting | Default | What it controls |
|---------|---------|-----------------|
| Max Depth | 50 | How deep the extension walks the DOM tree |
| Max Nodes | 10,000 | Total number of elements captured |
| Max String Length | 10,000 | Characters of text kept per element |

For most pages the defaults work well. Lower the values if you want smaller output (useful when pasting into LLM context windows). Raise them for complex single-page applications.

Click **Save** to persist your changes. Click **Reset Defaults** to restore the original values. Settings sync across devices via your Chrome profile.

## Common issues

**"Capture not working" -- nothing happens when I click the button**
- Make sure you are on a normal web page. The extension cannot run on `chrome://` pages, `chrome-extension://` pages, or the Chrome Web Store.
- Try reloading the extension: go to `chrome://extensions/`, find WebSketch, and click the refresh icon.
- Check the browser console (F12) for error messages.

**Build fails with "Missing required assets"**
- Run `npm run build -- --allow-missing` during development if icon files are not yet created.
- For a complete build, ensure `src/static/icons/` contains `icon16.png`, `icon48.png`, and `icon128.png`.

**Capture output is too large**
- Lower `maxNodes` and `maxDepth` in Settings to reduce output size.
- Pages with many elements (e.g., social media feeds) can produce large captures.

**Extension icon not visible in toolbar**
- Click the puzzle-piece (Extensions) icon in Chrome's toolbar.
- Find WebSketch Capture and click the pin icon to keep it visible.

**Settings don't persist after restart**
- The extension uses `chrome.storage.sync`. Ensure you are signed into Chrome with sync enabled, or the settings will be local to that browser profile only.

## RawCapture vs compiled IR

The extension outputs a **RawCapture** -- a direct DOM snapshot. This is not the same as a fully compiled WebSketch IR document, which has a stricter grammar designed for LLM consumption. The differences:

| Aspect | RawCapture (extension output) | Compiled IR (CLI output) |
|--------|-------------------------------|--------------------------|
| Source | Extension captures the live DOM | CLI compiles a RawCapture |
| Tag names | Uppercase HTML tags (`DIV`, `SPAN`) | Normalized grammar tokens |
| Styles | Three properties: `display`, `position`, `visibility` | Full style vocabulary |
| Use case | Quick inspection, LLM context, diffing | Structured analysis, automation pipelines |

For most users, the RawCapture is all you need. If you are building tooling that consumes WebSketch data programmatically, compile to the full IR using the [WebSketch CLI](https://github.com/mcp-tool-shop-org/websketch-cli).

## Next steps

Now that you have a working capture, you can:

- **Validate** captures against the IR schema: install [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) and run `websketch validate capture.json`
- **Render** captures as ASCII trees: `websketch render capture.json`
- **Diff** two captures to detect UI changes: `websketch diff before.json after.json`
- **Feed captures to an LLM** as structured UI context for code generation or analysis
- Read the [Getting Started](/websketch-extension/handbook/getting-started/) guide for a condensed reference
- Read the [Reference](/websketch-extension/handbook/reference/) page for full format details and development workflow
