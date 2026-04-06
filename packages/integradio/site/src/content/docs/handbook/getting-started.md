---
title: Getting Started
description: Install Integradio, set up Ollama with nomic-embed-text, and wrap your first Gradio component.
sidebar:
  order: 1
---

This guide walks you through installing Integradio, configuring Ollama for local embeddings, and building your first semantically-searchable Gradio app.

## Prerequisites

- **Python 3.10+**
- **Gradio 4.0+** (compatible with Gradio 5.x and 6.x)
- **Ollama** installed and running locally

## Install Integradio

```bash
# Basic installation
pip install integradio

# With all optional dependencies (visualization, FastAPI routes, etc.)
pip install "integradio[all]"

# Development installation (from source)
pip install -e ".[dev]"
```

## Set up Ollama

Integradio uses Ollama to generate vector embeddings locally. No cloud APIs required.

```bash
# Install Ollama from https://ollama.ai/
# Then pull the embedding model:
ollama pull nomic-embed-text

# Start the Ollama server (if not already running):
ollama serve
```

The default embedding model is `nomic-embed-text`. It runs on your GPU and produces 768-dimensional vectors suitable for semantic search.

## Wrap your first component

The `semantic()` function wraps any Gradio component with an intent string. This intent gets embedded into a vector, making the component discoverable by meaning.

```python
import gradio as gr
from integradio import SemanticBlocks, semantic

with SemanticBlocks() as demo:
    # Wrap a Textbox with semantic intent
    query = semantic(
        gr.Textbox(label="Search Query"),
        intent="user enters search terms"
    )

    # Wrap a Button
    search_btn = semantic(
        gr.Button("Search"),
        intent="triggers the search operation"
    )

    # Wrap an output area
    results = semantic(
        gr.Markdown(),
        intent="displays search results"
    )

    # Wire up events as usual
    search_btn.click(fn=lambda q: f"Results for: {q}", inputs=query, outputs=results)

demo.launch()
```

## Search by meaning

Once components are wrapped, you can search for them semantically:

```python
# Find all components related to "user input"
matches = demo.search("user input", k=5)
for match in matches:
    print(f"{match.metadata.label} (score: {match.score:.3f})")

# Get the single best Gradio component
best = demo.find("where does the user type?")
# Returns the raw Gradio component (e.g., a gr.Textbox instance) or None

# Print a summary of all registered components
print(demo.summary())
```

## Configuration options

`SemanticBlocks` accepts several configuration parameters:

```python
with SemanticBlocks(
    db_path=None,           # SQLite path for persistent storage (None = in-memory)
    cache_dir=None,         # Directory for embedding cache
    ollama_url="http://localhost:11434",  # Ollama server URL
    embed_model="nomic-embed-text",      # Embedding model name
) as demo:
    ...
```

## Next steps

- Learn about [Semantic Wrappers](../semantic-wrappers/) for complex components like Chatbot, ImageEditor, and plots
- Explore [Page Templates](../page-templates/) for ready-to-use layouts
- Set up [Visualization](../visualization/) to see your component graphs
