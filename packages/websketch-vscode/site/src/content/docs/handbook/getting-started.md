---
title: Getting Started
description: Install WebSketch VS Code, capture your first page, and configure extension settings.
sidebar:
  order: 1
---

## Requirements

- **VS Code 1.85** or later
- **Chrome or Edge** installed on your system

WebSketch uses `puppeteer-core` with whatever browser you already have. No bundled browser, no 200 MB download.

## Install

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode), or run this in the VS Code command line:

```
ext install mcp-tool-shop.websketch-vscode
```

## Capture a page

1. Open the Command Palette -- `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).
2. Run **WebSketch: Capture URL**.
3. Paste a URL and press Enter.
4. The capture opens in a panel with four tabs: LLM, ASCII, Tree, and JSON.
5. Click **Copy for LLM** to copy the semantic tree to your clipboard, ready to paste into any model.

The LLM tab is the default view. One click copies the tree, and you can paste it straight into ChatGPT, Claude, Gemini, or any other text model.

## Settings

All settings live under the `websketch.*` namespace in VS Code settings.

| Setting | Default | Description |
|---------|---------|-------------|
| `websketch.chromePath` | Auto-detect | Path to your Chrome or Edge executable. Leave empty and WebSketch will find it automatically. |
| `websketch.viewportWidth` | `1280` | Viewport width in pixels used for captures. |
| `websketch.viewportHeight` | `800` | Viewport height in pixels used for captures. |
| `websketch.timeout` | `30000` | Navigation timeout in milliseconds. Increase this for slow-loading sites. |
| `websketch.waitAfterLoad` | `1000` | Extra wait time in milliseconds after the page loads, giving JavaScript time to render dynamic content. |

To change a setting, open VS Code settings (`Ctrl+,`), search for `websketch`, and adjust the value.

---

[Back to landing page](/websketch-vscode/)
