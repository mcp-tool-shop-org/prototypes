---
title: Getting Started
description: Install polyglot-gpu and run your first translation.
sidebar:
  order: 1
---

## Prerequisites

- **Python 3.10+**
- **[Ollama](https://ollama.com)** installed and running locally
- **GPU** with sufficient VRAM for your chosen model

## Install

```bash
pip install polyglot-gpu
```

## Choose a model

polyglot-gpu uses TranslateGemma via Ollama. Three sizes are available:

| Model | VRAM | Speed | Quality |
|-------|------|-------|---------|
| `translategemma:4b` | 3.3 GB | Fast | Good |
| `translategemma:12b` | 8.1 GB | Balanced | Recommended |
| `translategemma:27b` | 17 GB | Slow | Best |

The model is pulled automatically on first use. To pull it manually:

```bash
ollama pull translategemma:12b
```

## First translation

```python
import asyncio
from pypolyglot import translate

async def main():
    result = await translate("Hello world", "en", "ja")
    print(result.translation)

asyncio.run(main())
```

polyglot-gpu will auto-start Ollama if it's not running and auto-pull the model if it's not installed. On first run, expect a short delay while the model downloads.

## Verify setup

Check that Ollama is reachable and the model is available:

```python
import asyncio
from pypolyglot import OllamaClient

async def main():
    client = OllamaClient()
    if await client.is_available():
        models = await client.list_models()
        for m in models:
            print(f"{m.name} ({m.size / 1e9:.1f} GB)")
    else:
        print("Ollama is not running. Start it with: ollama serve")

asyncio.run(main())
```

If you are using polyglot-gpu as an MCP server, the `check_status` tool performs this check for you automatically.

## Next steps

- [Library Usage](/py-polyglot/handbook/usage/) — Translate text, markdown, and multiple languages
- [MCP Server](/py-polyglot/handbook/mcp-server/) — Use with Claude Code
- [Configuration](/py-polyglot/handbook/configuration/) — Tune model and concurrency
