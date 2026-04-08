---
title: Beginners Guide
description: Step-by-step walkthrough for first-time users of polyglot-gpu.
sidebar:
  order: 99
---

A complete walkthrough for anyone new to polyglot-gpu. This guide assumes you have Python installed but no experience with Ollama or local GPU translation.

## 1. What is polyglot-gpu?

polyglot-gpu is a Python library that translates text into 57 languages using Google's TranslateGemma model. Unlike cloud translation services, everything runs on your own computer using your GPU through Ollama. No API keys, no internet connection required after the initial model download, and no data ever leaves your machine.

You can use it two ways:
- **As a Python library** — import it into your own scripts and applications
- **As an MCP server** — let Claude Code, Claude Desktop, or other MCP clients call it directly

## 2. Prerequisites and installation

### System requirements

- Python 3.10 or newer
- A GPU with at least 3.3 GB of VRAM (for the smallest model)
- [Ollama](https://ollama.com) installed on your system

### Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com). After installation, verify it works:

```bash
ollama --version
```

### Install polyglot-gpu

```bash
pip install polyglot-gpu
```

This installs the `pypolyglot` Python package and the `polyglot-gpu` command-line entry point.

### Pull a translation model

The model downloads automatically on first use, but you can pull it ahead of time:

```bash
ollama pull translategemma:12b
```

Choose a model size based on your GPU:

| Model | VRAM needed | Best for |
|-------|-------------|----------|
| `translategemma:4b` | 3.3 GB | Quick translations, smaller GPUs |
| `translategemma:12b` | 8.1 GB | General use (recommended) |
| `translategemma:27b` | 17 GB | Maximum quality, large GPUs only |

## 3. Your first translation

Create a file called `hello.py`:

```python
import asyncio
from pypolyglot import translate

async def main():
    result = await translate("Hello, how are you?", "en", "ja")
    print(f"Translation: {result.translation}")
    print(f"Model used: {result.model}")
    print(f"Chunks: {result.chunks}")
    print(f"Time: {result.duration_ms:.0f}ms")

asyncio.run(main())
```

Run it:

```bash
python hello.py
```

On the first run, polyglot-gpu will auto-start Ollama (if it is not running) and auto-pull the model (if it is not installed). This may take a few minutes depending on your internet speed.

## 4. Translating markdown documents

polyglot-gpu understands markdown structure. Code blocks, tables, HTML tags, URLs, and badges pass through untranslated while prose gets translated:

```python
import asyncio
from pypolyglot import translate_markdown

async def main():
    md = """## Features

Local GPU translation with **zero cloud dependency**.

```python
result = await translate("Hello", "en", "ja")
```

| Tool | Description |
|------|-------------|
| translate | Translate plain text |
| translate_markdown | Translate markdown |
"""

    result = await translate_markdown(md, "en", "fr")
    print(result.markdown)
    print(f"Segments: {result.segments}")
    print(f"Translated: {result.translated}")

asyncio.run(main())
```

The code block and table column headers pass through unchanged. Only the prose text and translatable table cells are translated.

## 5. Using custom glossaries

When translating technical content, you may want specific terms translated a certain way. polyglot-gpu includes 12 built-in software terms (Architecture, Pipeline, Deploy, Library, Framework, Build, Release, Branch, Repository, Merge, Token, Adoption) and lets you add your own:

```python
import asyncio
from pypolyglot import translate, TranslateOptions, GlossaryEntry

async def main():
    custom = [
        GlossaryEntry("Widget", {"ja": "ウィジェット", "es": "widget"}),
        GlossaryEntry("Dashboard", {"ja": "ダッシュボード", "es": "panel"}),
    ]

    result = await translate(
        "Open the Dashboard and configure the Widget",
        "en", "ja",
        TranslateOptions(glossary=custom)
    )
    print(result.translation)

asyncio.run(main())
```

Each `GlossaryEntry` takes a source term and a dictionary mapping language codes to the preferred translation. Entries only activate when the term appears in the source text and the target language has a translation defined.

## 6. Running as an MCP server

If you use Claude Code or Claude Desktop, you can expose polyglot-gpu as an MCP server. Add this to your MCP configuration:

```json
{
  "mcpServers": {
    "polyglot-gpu": {
      "command": "polyglot-gpu"
    }
  }
}
```

Once connected, Claude gains access to five translation tools:

- **translate_text** — Translate plain text between any two of 57 languages
- **translate_md** — Translate markdown while preserving structure
- **translate_all_langs** — Translate into multiple languages at once (default: 7)
- **list_languages** — List all supported language codes and names
- **check_status** — Verify Ollama is running and models are installed

You can also start the server manually for testing:

```bash
python -m pypolyglot
```

The server communicates over stdio (standard input/output), which is the default MCP transport.

## 7. Troubleshooting

### Ollama is not running

If you see a connection error, start Ollama manually:

```bash
ollama serve
```

polyglot-gpu tries to auto-start Ollama, but this may fail on some system configurations. Running `ollama serve` in a separate terminal ensures it is available.

### Model not found

If the model is not installed, polyglot-gpu will attempt to pull it automatically. If auto-pull fails (for example, due to a network issue), pull the model manually:

```bash
ollama pull translategemma:12b
```

### Out of memory (VRAM)

If your GPU runs out of memory, switch to a smaller model:

```python
from pypolyglot import translate, TranslateOptions

result = await translate("Hello", "en", "ja",
    TranslateOptions(model="translategemma:4b"))
```

Or set the default model via environment variable:

```bash
export POLYGLOT_MODEL=translategemma:4b
```

### Translation quality issues

polyglot-gpu validates every translation and emits warnings for common problems (echo detection, truncation, garbled text). If quality is poor:

1. Try a larger model (`translategemma:27b`) for better accuracy
2. Keep source text segments reasonably short (the engine chunks at 2000-6000 characters depending on model size)
3. Add custom glossary entries for domain-specific terms

### Slow translations

Translation speed depends on your GPU. To improve throughput:

- Use the `translategemma:4b` model for faster results at slightly lower quality
- Increase concurrency if your GPU has headroom: `export POLYGLOT_CONCURRENCY=2`
- For markdown documents, the caching system avoids re-translating unchanged segments on subsequent runs
