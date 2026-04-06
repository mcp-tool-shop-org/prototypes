---
title: Beginners
description: Zero-to-working-app guide for Integradio — prerequisites, installation, first app, core concepts, common patterns, troubleshooting, and next steps.
sidebar:
  order: 99
---

This page walks you from zero to a working Integradio app. No prior Gradio experience is assumed.

## 1. What is Integradio?

Integradio is a Python library that makes [Gradio](https://gradio.app/) components searchable by meaning. Normally, Gradio components are identified by their label or `elem_id`. Integradio adds a vector embedding to each component so you (or an AI agent) can find it by describing what it does in plain English.

For example, instead of looking up a component by its ID, you write:

```python
demo.search("where does the user type their query?")
```

and Integradio returns the Textbox you wrapped with the intent "user enters search terms." This works because the intent string and the search query are both converted into vectors by [Ollama](https://ollama.ai/), and matched by cosine similarity.

**Key points:**
- Everything runs locally. No cloud APIs, no tokens, no network calls beyond your own machine.
- Integradio wraps Gradio components without modifying them. All standard Gradio features still work.
- The embedding model (`nomic-embed-text`) runs on your GPU or CPU through Ollama.

## 2. Prerequisites

Before installing Integradio, you need:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Python | 3.10 or newer | Runtime |
| pip | Any recent version | Package installer |
| Ollama | Latest | Local embedding server |
| Gradio | 4.0+ (works with 5.x and 6.x) | UI framework (installed automatically) |

**Check your Python version:**

```bash
python --version
# Should print Python 3.10.x or higher
```

**Install Ollama:**

Download from [https://ollama.ai/](https://ollama.ai/) and follow the installer for your platform. After installing, pull the embedding model:

```bash
ollama pull nomic-embed-text
```

Then start the Ollama server (it may already be running as a service):

```bash
ollama serve
```

You can verify Ollama is working by visiting `http://localhost:11434` in your browser -- you should see "Ollama is running."

## 3. Installation

Install Integradio from PyPI:

```bash
pip install integradio
```

This installs the core library with Gradio, numpy, httpx, and pandas. For additional features:

```bash
# HNSW vector index (faster search for large component counts)
pip install "integradio[hnsw]"

# FastAPI routes for programmatic access
pip install "integradio[api]"

# Everything at once
pip install "integradio[all]"
```

**Verify the installation:**

```python
python -c "import integradio; print(integradio.__version__)"
```

You can also run the built-in diagnostic to check all dependencies and Ollama connectivity:

```python
python -c "from integradio import diagnose; print(diagnose())"
```

This reports the status of each dependency and whether Ollama is reachable with an embedding model loaded.

## 4. Your first app

Create a file called `app.py`:

```python
import gradio as gr
from integradio import SemanticBlocks, semantic

def greet(name):
    return f"Hello, {name}!"

with SemanticBlocks() as demo:
    name_input = semantic(
        gr.Textbox(label="Your Name", placeholder="Type your name..."),
        intent="user enters their name",
    )

    greet_btn = semantic(
        gr.Button("Greet Me"),
        intent="triggers the greeting",
    )

    output = semantic(
        gr.Markdown(),
        intent="displays the greeting message",
    )

    greet_btn.click(fn=greet, inputs=name_input, outputs=output)

demo.launch()
```

Run it:

```bash
python app.py
```

Open `http://localhost:7860` in your browser. You now have a Gradio app where every component carries a semantic embedding.

**What happened behind the scenes:**
1. `SemanticBlocks()` creates a standard Gradio Blocks context, plus an embedding pipeline and component registry.
2. Each `semantic()` call wraps a Gradio component with an intent string. When the `with` block exits, all intents are sent to Ollama and converted into 768-dimensional vectors.
3. These vectors are stored in an HNSW index (or a brute-force fallback if hnswlib is not installed) alongside SQLite metadata.

## 5. Core concepts

### Intent strings

An intent is a plain-English description of what a component does. Write it from the user's perspective:

```python
# Good intents (user perspective):
semantic(gr.Textbox(...), intent="user enters a search query")
semantic(gr.Button(...), intent="triggers the search operation")
semantic(gr.Markdown(...), intent="displays search results")

# Less useful intents (too generic):
semantic(gr.Textbox(...), intent="textbox")
semantic(gr.Button(...), intent="button")
```

If you omit the `intent` parameter, Integradio falls back to the component's label or type name.

### Tags

Tags are string labels for filtering search results:

```python
btn = semantic(
    gr.Button("Search"),
    intent="triggers the search",
    tags=["action", "primary"],
)

# Later, filter searches by tag:
results = demo.search("trigger something", tags=["action"])
```

Specialized wrappers (like `semantic_chatbot`) auto-generate tags based on the component's configuration.

### SemanticBlocks

`SemanticBlocks` is a drop-in replacement for `gr.Blocks`. It adds:

- `demo.search(query)` -- find components by meaning
- `demo.find(query)` -- get the single best-matching Gradio component
- `demo.trace(component)` -- see what feeds into and out of a component
- `demo.map()` -- export the component graph as JSON
- `demo.summary()` -- print a text report of all registered components

### Graceful degradation

If Ollama is not running, Integradio still works. Components register with zero vectors, which means semantic search will not return meaningful results, but the app itself runs normally. A warning is printed once. When Ollama comes back, restart the app to re-embed.

## 6. Common patterns

### Adding search to an existing Gradio app

You only need to change two imports and wrap components you care about:

```python
# Before:
import gradio as gr
with gr.Blocks() as demo:
    inp = gr.Textbox(label="Query")
    btn = gr.Button("Go")
    out = gr.Markdown()
    btn.click(fn=process, inputs=inp, outputs=out)

# After:
from integradio import SemanticBlocks, semantic
with SemanticBlocks() as demo:
    inp = semantic(gr.Textbox(label="Query"), intent="user types a query")
    btn = semantic(gr.Button("Go"), intent="runs the query")
    out = semantic(gr.Markdown(), intent="shows query results")
    btn.click(fn=process, inputs=inp, outputs=out)
```

You do not need to wrap every component -- only the ones you want to be semantically discoverable.

### Using page templates

Integradio ships 10 pre-built page templates with semantic wrappers already applied:

```python
from integradio.pages import ChatPage

page = ChatPage()
page.launch()
```

See the [Page Templates](../page-templates/) guide for the full list.

### Persisting the registry

By default, the component registry lives in memory and disappears when the app stops. To persist it:

```python
from pathlib import Path

with SemanticBlocks(
    db_path=Path("./components.db"),
    cache_dir=Path("./embedding_cache"),
) as demo:
    ...
```

The `db_path` stores component metadata in SQLite. The `cache_dir` caches embedding vectors so repeated starts skip the Ollama round-trip.

### Exposing the API

Add FastAPI routes to let other programs query your component graph:

```python
from fastapi import FastAPI

app = FastAPI()
demo.add_api_routes(app)
# Now available: GET /semantic/search?q=...
#                GET /semantic/graph
#                GET /semantic/summary
```

See the [Visualization](../visualization/) guide for details on all endpoints.

## 7. Troubleshooting

### "Ollama not available" warning

**Cause:** Ollama is not running or not reachable at `http://localhost:11434`.

**Fix:** Start Ollama with `ollama serve`. If you run Ollama on a different host or port, pass the URL to SemanticBlocks:

```python
with SemanticBlocks(ollama_url="http://192.168.1.10:11434") as demo:
    ...
```

### "No embedding models found"

**Cause:** Ollama is running but `nomic-embed-text` is not pulled.

**Fix:** Run `ollama pull nomic-embed-text`. You can verify with `ollama list`.

### Search returns empty results

**Possible causes:**
1. Ollama was not running when the app started (all vectors are zeros). Restart the app with Ollama running.
2. No components have been wrapped with `semantic()`.
3. The query does not match any intent. Try broader terms.

### hnswlib import error

**Cause:** The `hnswlib` package is not installed. This is optional.

**Fix:** Install it with `pip install "integradio[hnsw]"`. Without it, Integradio uses a brute-force cosine similarity search, which works fine for apps with fewer than a few hundred components.

### Circuit breaker tripping

If Ollama goes down mid-session, the circuit breaker opens after 3 consecutive failures. Embedding calls return zero vectors immediately instead of waiting for timeouts. The circuit automatically tests recovery after 30 seconds.

Run the built-in diagnostic to check the current state:

```python
from integradio import diagnose
print(diagnose())
```

### Where to get help

- [GitHub Issues](https://github.com/mcp-tool-shop-org/integradio/issues) -- bug reports and feature requests
- [Gradio Documentation](https://gradio.app/docs/) -- for Gradio-specific questions
- [Ollama Documentation](https://ollama.ai/) -- for embedding model setup
