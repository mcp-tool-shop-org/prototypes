<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## What it does

Polyglot runs [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma) through [Ollama](https://ollama.com) on your local GPU. No API keys, no cloud services, no data leaving your machine.

- **Translate Selection** — Select text, press `Ctrl+Alt+T`, pick a language. Done.
- **Translate File** — Translate an entire file into a new `file.ja.ext` alongside the original.
- **Translate README** — Batch-translate your README.md into 7 languages, preserving code blocks, tables, and badges.
- **Sidebar Panel** — Globe icon in the activity bar with action buttons and live Ollama status.

## Requirements

- [Ollama](https://ollama.com) installed and running
- A GPU with enough VRAM for the model (12GB for `translategemma:12b`, 2GB for `translategemma:2b`)
- The model is downloaded automatically on first use

## Getting started

1. Install the extension
2. Click the globe icon in the activity bar (left sidebar)
3. Click **Check Status** — Polyglot will start Ollama and pull the model if needed
4. Select some text and press `Ctrl+Alt+T` (or `Cmd+Alt+T` on Mac)

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| **Polyglot: Translate Selection** | `Ctrl+Alt+T` | Translate selected text in-place |
| **Polyglot: Translate File** | — | Translate the current file to a new file |
| **Polyglot: Translate README** | — | Batch-translate README.md to multiple languages |
| **Polyglot: Check Status** | — | Verify Ollama connection and model availability |
| **Polyglot: Help** | — | Quick access to settings, walkthrough, and links |

## Access points

- **Sidebar panel** — Globe icon in the activity bar with styled action buttons
- **Editor title bar** — Globe icon appears when text is selected
- **Right-click menu** — "Translate Selection" in the editor context menu
- **Command Palette** — `Ctrl+Shift+P` → type "Polyglot"
- **Keyboard shortcut** — `Ctrl+Alt+T` with selected text

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | Ollama server URL |
| `polyglot.model` | `translategemma:12b` | Translation model (try `2b` for less VRAM) |
| `polyglot.defaultSourceLanguage` | `en` | Source language for translations |
| `polyglot.defaultLanguages` | 7 languages | Target languages for README translation |

## Supported languages

Arabic, Bengali, Bulgarian, Catalan, Chinese (Simplified & Traditional), Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Kannada, Korean, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Marathi, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh.

## How it works

Polyglot wraps [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp), a local translation engine that:

1. Auto-starts Ollama if it's not running
2. Auto-pulls the TranslateGemma model on first use
3. Chunks long text at paragraph/sentence boundaries
4. Applies a software glossary for accurate technical terms
5. Cleans up common model quirks (duplicate alternatives, trailing periods)

For README translation, it uses intelligent segmentation — code blocks, HTML badges, and URLs are preserved untouched while headings, paragraphs, and table content are translated.

## Security & Data Scope

**Data touched:** text in the active editor (read-only for selection, write for replacement), files in the workspace for Translate File/Translate README (creates new files alongside originals). **Data NOT touched:** no files outside the workspace, no OS credentials, no browser data. **Network:** connects only to local Ollama (`localhost:11434` by default) — **no cloud egress**. **No telemetry** is collected or sent.

## License

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
