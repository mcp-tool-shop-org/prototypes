---
title: Reference
description: Commands, settings, supported languages, and the translation pipeline.
sidebar:
  order: 2
---

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Polyglot: Translate Selection` | `Ctrl+Alt+T` | Translate selected text in-place |
| `Polyglot: Translate File` | — | Translate current file to a new file |
| `Polyglot: Translate README` | — | Batch-translate README.md to multiple languages |
| `Polyglot: Check Status` | — | Verify Ollama connection and model availability |
| `Polyglot: Help` | — | Quick access to settings, walkthrough, and links |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | Ollama server URL |
| `polyglot.model` | `translategemma:12b` | Translation model (`12b` for quality, `2b` for speed) |
| `polyglot.defaultSourceLanguage` | `en` | Source language for translations |
| `polyglot.defaultLanguages` | 7 languages | Target languages for README translation |

### Model selection

- **`translategemma:12b`** (8.1 GB) — best quality, requires 12 GB VRAM
- **`translategemma:2b`** (1.5 GB) — faster, lower quality, works with 2 GB VRAM

The model is auto-pulled on first use. If Ollama is not running, Polyglot starts it automatically.

## Supported languages

55 languages are supported:

Arabic, Bengali, Bulgarian, Catalan, Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Kannada, Korean, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Marathi, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, and Welsh.

## How it works

Polyglot wraps the `@mcptoolshop/polyglot-mcp` translation engine:

1. **Auto-starts Ollama** if not running
2. **Auto-pulls the model** on first use
3. **Chunks long text** at paragraph and sentence boundaries to stay within model context limits
4. **Preserves formatting** — code blocks, tables, badges, and HTML elements are passed through untouched
5. **Cleans up model quirks** — strips duplicate alternatives, trailing periods, and other TranslateGemma artifacts

### README translation pipeline

When translating a README, the extension:

1. Parses the markdown into blocks (headings, paragraphs, code, tables, HTML)
2. Translates only text blocks — code blocks and badges are preserved verbatim
3. Cleans up TranslateGemma quirks (duplicate alternatives in 10+ languages)
4. Writes each translated version as `README.<lang>.md`

## Security and data scope

- All translation happens locally via Ollama — no data leaves your machine
- No API keys required
- No telemetry collected or sent
- The extension reads files in the current workspace and writes translated copies alongside them
