---
title: Integradio Handbook
description: Complete guide to vector-embedded Gradio components with semantic search via Ollama.
sidebar:
  order: 0
---

Welcome to the **Integradio Handbook** -- your complete guide to building Gradio applications with semantic intelligence.

Integradio extends [Gradio](https://gradio.app/) with vector embeddings powered by [Ollama](https://ollama.ai/) and `nomic-embed-text`. Components carry semantic intents, making them discoverable by meaning rather than by ID or label alone.

## What you'll learn

- [**Beginners**](beginners/) -- Zero-to-working-app walkthrough, prerequisites, troubleshooting
- [**Getting Started**](getting-started/) -- Install Integradio, set up Ollama, and wrap your first component
- [**Semantic Wrappers**](semantic-wrappers/) -- The core `semantic()` function and all specialized wrappers for complex components
- [**Page Templates**](page-templates/) -- 10 pre-built layouts for common UI patterns (Chat, Dashboard, Gallery, and more)
- [**Visualization**](visualization/) -- Mermaid diagrams, D3.js interactive graphs, ASCII art, and FastAPI integration
- [**Reference**](reference/) -- SemanticBlocks API, architecture internals, events, WebSocket mesh, inspector, visual system, and security scope

## Who is this for?

- **Python developers** building Gradio UIs who want AI-discoverable components
- **ML engineers** who need programmatic access to component graphs for agent workflows
- **Teams** looking for pre-built page templates with semantic search baked in

## Quick taste

```python
from integradio import SemanticBlocks, semantic
import gradio as gr

with SemanticBlocks() as demo:
    query = semantic(
        gr.Textbox(label="Search"),
        intent="user enters search terms"
    )
    demo.search("user input")  # Finds it by meaning
    demo.launch()
```

Everything runs locally. No cloud APIs. No tokens. No latency.
