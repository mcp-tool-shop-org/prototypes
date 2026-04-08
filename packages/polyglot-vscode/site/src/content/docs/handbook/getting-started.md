---
title: Getting Started
description: Install Ollama, set up the extension, and run your first translation.
sidebar:
  order: 1
---

This page walks you through installing Polyglot, setting up the local translation engine, and translating your first text.

## Prerequisites

- **VS Code** 1.85 or later
- **[Ollama](https://ollama.com)** installed and running
- A GPU with sufficient VRAM:
  - 12 GB for `translategemma:12b` (recommended quality)
  - 2 GB for `translategemma:2b` (faster, lower quality)

## Installation

### From the Marketplace

Search for "Polyglot" in the VS Code Extensions panel, or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode).

### From source

```bash
git clone https://github.com/mcp-tool-shop-org/polyglot-vscode.git
cd polyglot-vscode
npm ci
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

## First translation

1. **Click the globe icon** in the activity bar (left sidebar)
2. **Click Check Status** — Polyglot will start Ollama and pull the model if needed
3. **Select some text** in any editor
4. **Press `Ctrl+Alt+T`** (or `Cmd+Alt+T` on Mac)
5. **Pick a target language** from the quick-pick menu

The translated text replaces your selection in-place.

## Translation modes

### Translate Selection

Select text, press `Ctrl+Alt+T`, pick a language. The selection is replaced with the translation. This is the fastest path for quick translations.

### Translate File

Run `Polyglot: Translate File` from the Command Palette. The entire file is translated and saved as a new file alongside the original (e.g., `file.ja.ext`). Code blocks, tables, and formatting are preserved.

### Translate README

Run `Polyglot: Translate README` to batch-translate your README.md into 7 languages. The extension preserves code blocks, tables, badges, and HTML elements. Output files follow the `README.<lang>.md` naming convention.

## Access points

You can invoke Polyglot from five places:

| Access point | How |
|-------------|-----|
| Sidebar panel | Globe icon in the activity bar |
| Editor title bar | Globe icon appears when text is selected |
| Right-click menu | "Translate Selection" in context menu |
| Command Palette | `Ctrl+Shift+P` then type "Polyglot" |
| Keyboard shortcut | `Ctrl+Alt+T` with selected text |

## Next steps

See [Reference](/polyglot-vscode/handbook/reference/) for the full command list, all settings, and the complete list of 55 supported languages.
