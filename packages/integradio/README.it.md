<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/integradio/readme.png" alt="Integradio" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/integradio/actions/workflows/docker.yml"><img src="https://github.com/mcp-tool-shop-org/integradio/actions/workflows/docker.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/integradio/"><img src="https://img.shields.io/pypi/v/integradio" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/integradio/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>


## Panoramica

Integradio estende [Gradio](https://gradio.app/) con funzionalità di ricerca semantica basate su embedding. I componenti contengono rappresentazioni vettoriali che li rendono individuabili in base all'intento, piuttosto che solo tramite ID o etichetta.

**Caratteristiche principali:**
- Avvolgimento dei componenti non invasivo (funziona con qualsiasi componente Gradio)
- Ricerca semantica tramite Ollama/nomic-embed-text
- Estrazione automatica del flusso di dati dai listener di eventi
- Formati di visualizzazione multipli (Mermaid, D3.js, ASCII)
- 10 modelli di pagina predefiniti
- Integrazione con FastAPI per l'accesso programmatico

## Perché Integradio?

| Problema | Soluzione |
| --------- | ---------- |
| I componenti Gradio sono opachi per gli agenti AI. | Le intenzioni semantiche rendono ogni widget individuabile. |
| Creare dashboard da zero ogni volta. | 10 modelli di pagina predefiniti, pronti per essere personalizzati. |
| Nessun accesso programmatico ai grafi dei componenti. | Route FastAPI + visualizzazione D3.js / Mermaid. |
| La logica di embedding è sparsa in tutta l'applicazione. | Un solo wrapper, archiviazione automatica dei vettori. |

## Requisiti

- Python 3.10+
- [Ollama](https://ollama.ai/) con il modello `nomic-embed-text`
- Gradio 4.0+ (compatibile con Gradio 5.x e 6.x)

## Installazione

```bash
# Basic installation
pip install integradio

# With all optional dependencies
pip install "integradio[all]"

# Development installation
pip install -e ".[dev]"
```

### Configurazione di Ollama

Integradio richiede Ollama per generare gli embedding:

```bash
# Install Ollama (see https://ollama.ai/)
# Then pull the embedding model:
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## Guida rapida

```python
import gradio as gr
from integradio import SemanticBlocks, semantic

with SemanticBlocks() as demo:
    # Wrap components with semantic intent
    query = semantic(
        gr.Textbox(label="Search Query"),
        intent="user enters search terms"
    )

    search_btn = semantic(
        gr.Button("Search"),
        intent="triggers the search operation"
    )

    results = semantic(
        gr.Markdown(),
        intent="displays search results"
    )

    search_btn.click(fn=search, inputs=query, outputs=results)

# Components are now searchable by semantic intent
results = demo.search("user input")  # Finds the Textbox
print(demo.summary())  # Shows all registered components

demo.launch()
```

## Riferimento API

### SemanticBlocks

`gr.Blocks` esteso con registro e integrazione di embedder.

```python
with SemanticBlocks(
    db_path=None,           # SQLite path (None = in-memory)
    cache_dir=None,         # Embedding cache directory
    ollama_url="http://localhost:11434",
    embed_model="nomic-embed-text",
) as demo:
    ...

# Methods
demo.search(query, k=10)     # Semantic search
demo.find(query)             # Get single most relevant component
demo.trace(component)        # Get upstream/downstream flow
demo.map()                   # Export graph as D3.js JSON
demo.describe(component)     # Full metadata dump
demo.summary()               # Text report
```

### semantic()

Avvolge qualsiasi componente Gradio con metadati semantici.

```python
component = semantic(
    gr.Textbox(label="Name"),
    intent="user enters their full name",
    tags=["form", "required"],
)
```

### Wrapper specializzati

Per componenti complessi, utilizzare wrapper specializzati che forniscono metadati semantici più ricchi:

```python
from integradio import (
    semantic_multimodal,      # MultimodalTextbox
    semantic_image_editor,    # ImageEditor
    semantic_annotated_image, # AnnotatedImage (object detection)
    semantic_highlighted_text,# HighlightedText (NER)
    semantic_chatbot,         # Chatbot
    semantic_plot,            # LinePlot, BarPlot, ScatterPlot
    semantic_model3d,         # Model3D
    semantic_dataframe,       # DataFrame
    semantic_file_explorer,   # FileExplorer
)

# AI Chat with persona and streaming support
chat = semantic_chatbot(
    gr.Chatbot(label="Assistant"),
    persona="coder",
    supports_streaming=True,
    supports_like=True,
)
# Auto-tags: ["io", "conversation", "ai", "streaming", "persona-coder", "code-assistant", "programming"]

# Image editor for inpainting with mask support
editor = semantic_image_editor(
    gr.ImageEditor(label="Edit"),
    use_case="inpainting",
    supports_masks=True,
    tools=["brush", "eraser"],
)
# Auto-tags: ["input", "media", "editor", "visual", "inpainting", "masking", "tool-brush", "tool-eraser"]

# Object detection output
detections = semantic_annotated_image(
    gr.AnnotatedImage(label="Detections"),
    annotation_type="bbox",
    entity_types=["person", "car", "dog"],
)
# Auto-tags: ["output", "media", "annotation", "bbox", "detection", "detects-person", "detects-car", "detects-dog"]

# NER visualization
entities = semantic_highlighted_text(
    gr.HighlightedText(label="Entities"),
    annotation_type="ner",
    entity_types=["PERSON", "ORG", "LOC"],
)
# Auto-tags: ["output", "text", "annotation", "nlp", "ner", "person-entity", "organization-entity", "location-entity"]

# Multimodal input for vision-language models
vlm_input = semantic_multimodal(
    gr.MultimodalTextbox(label="Ask about images"),
    use_case="image_analysis",
    accepts_images=True,
)
# Auto-tags: ["input", "text", "multimodal", "vision", "image-input", "image_analysis", "vlm"]

# Data visualization with domain context
metrics_chart = semantic_plot(
    gr.LinePlot(x="date", y="value"),
    chart_type="line",
    data_domain="metrics",
    axes=["date", "value"],
)
# Auto-tags: ["output", "visualization", "chart-line", "timeseries", "domain-metrics"]
```

### Modelli di pagina

10 modelli di pagina predefiniti per schemi di interfaccia utente comuni:

```python
from integradio.pages import (
    ChatPage,        # Conversational AI interface
    DashboardPage,   # KPI cards and activity feed
    HeroPage,        # Landing page with CTAs
    GalleryPage,     # Image grid with filtering
    AnalyticsPage,   # Charts and metrics
    DataTablePage,   # Editable data grid
    FormPage,        # Multi-step form wizard
    UploadPage,      # File upload with preview
    SettingsPage,    # Configuration panels
    HelpPage,        # FAQ accordion
)

# Use in your app
page = ChatPage()
page.launch()
```

## Visualizzazione

```python
from integradio.viz import (
    generate_mermaid,      # Mermaid diagram
    generate_html_graph,   # Interactive D3.js
    generate_ascii_graph,  # ASCII art
)

# Generate Mermaid diagram
print(generate_mermaid(demo))

# Save interactive HTML visualization
html = generate_html_graph(demo)
with open("graph.html", "w") as f:
    f.write(html)
```

## Integrazione con FastAPI

```python
from fastapi import FastAPI

app = FastAPI()
demo.add_api_routes(app)

# Endpoints:
# GET /semantic/search?q=<query>&k=<limit>
# GET /semantic/component/<id>
# GET /semantic/graph
# GET /semantic/trace/<id>
# GET /semantic/summary
```

## Esempi

Consultare la directory `examples/`:

- `basic_app.py` - Semplice demo di ricerca
- `full_app.py` - Dimostrazione di tutti i 10 modelli di pagina

```bash
# Run basic example
python examples/basic_app.py
# Visit http://localhost:7860
```

## Sviluppo

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=integradio --cov-report=html

# Type checking
mypy integradio

# Linting
ruff check integradio
```

## Architettura

```
integradio/
├── components.py      # SemanticComponent wrapper
├── specialized.py     # Specialized wrappers (Chatbot, ImageEditor, etc.)
├── embedder.py        # Ollama embedding client with circuit breaker
├── registry.py        # HNSW + SQLite storage
├── blocks.py          # Extended gr.Blocks
├── introspect.py      # Source location extraction
├── api.py             # FastAPI routes
├── viz.py             # Graph visualization (Mermaid, D3.js, ASCII)
├── circuit_breaker.py # Resilience pattern for external services
├── exceptions.py      # Exception hierarchy
├── logging_config.py  # Structured logging
├── pages/             # 10 pre-built page templates
├── events/            # WebSocket event mesh with HMAC signing
├── visual/            # Design tokens, themes, Figma sync
├── agent/             # LangChain tools and MCP server
└── inspector/         # Component tree navigation
```

## Licenza

Licenza MIT - vedere [LICENSE](LICENSE) per i dettagli.

## Contributi

I contributi sono benvenuti! Si prega di leggere le nostre linee guida per i contributi e inviare richieste di pull.

## Link

- [Documentazione di Gradio](https://gradio.app/docs/)
- [Ollama](https://ollama.ai/)
- [nomic-embed-text](https://ollama.ai/library/nomic-embed-text)

