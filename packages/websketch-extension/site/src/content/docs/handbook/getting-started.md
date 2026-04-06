---
title: Getting Started
description: Install the extension from source, load it in Chrome, and capture your first page.
sidebar:
  order: 1
---

This page walks you through building the extension, loading it in Chrome, and capturing your first web page as WebSketch IR.

## Prerequisites

- **Google Chrome** (or Chromium-based browser)
- **Node.js** 18+ and npm

## Installation

The extension is not yet on the Chrome Web Store. Install from source:

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
cd websketch-extension
npm ci
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` directory from the built project

The WebSketch icon appears in your toolbar.

## Capturing a page

1. **Navigate** to any web page
2. **Click** the WebSketch icon in the toolbar
3. **Click** "Capture Current Page" in the popup
4. The capture JSON is automatically **copied to your clipboard**

### What gets captured

- DOM tree structure with tag names, IDs, CSS classes, and direct text content
- Three computed style properties per element: `display`, `position`, `visibility`
- Element bounding boxes via `getBoundingClientRect`
- Page metadata: URL, title, viewport dimensions, timestamp, schema version
- A `warnings` array when capture limits are exceeded

### Configuring limits

Click **Settings** in the popup header to open the options page and adjust capture limits:

| Setting | Default | Purpose |
|---------|---------|---------|
| `maxDepth` | 50 | Maximum DOM tree depth |
| `maxNodes` | 10,000 | Maximum number of nodes captured |
| `maxStringLength` | 10,000 | Maximum text content length per node |

When a capture exceeds these limits, the extension shows a warning banner indicating what was truncated.

## Using the capture

Once copied to your clipboard, you can:

- **Save to a file** -- paste into a text editor and save as `capture.json`
- **Validate** the capture against the IR schema: `websketch validate capture.json`
- **Render** as ASCII art: `websketch render capture.json`
- **Feed to an LLM** as structured UI context for code generation or layout analysis
- **Diff** two captures to detect UI changes: `websketch diff before.json after.json`

Install the [WebSketch CLI](https://github.com/mcp-tool-shop-org/websketch-cli) to use the `validate`, `render`, and `diff` commands.

## How settings are stored

Capture limit settings are saved to `chrome.storage.sync`, which means they follow your Chrome profile across devices when sync is enabled. No captured page data is ever persisted -- only the three numeric limit values.

## Next steps

- New to browser extensions? Read the [Beginners Guide](/websketch-extension/handbook/beginners/) for a detailed walkthrough
- See [Reference](/websketch-extension/handbook/reference/) for the full output format specification, validation, and development workflow
