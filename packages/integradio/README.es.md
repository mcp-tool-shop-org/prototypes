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


## Descripción general

Integradio extiende [Gradio](https://gradio.app/) con capacidades de búsqueda semántica impulsadas por incrustaciones (embeddings). Los componentes llevan representaciones vectoriales que los hacen descubribles por intención, en lugar de solo por ID o etiqueta.

**Características principales:**
- Envoltura de componentes no intrusiva (funciona con cualquier componente de Gradio)
- Búsqueda semántica a través de Ollama/nomic-embed-text
- Extracción automática de flujos de datos a partir de listeners de eventos
- Múltiples formatos de visualización (Mermaid, D3.js, ASCII)
- 10 plantillas de página predefinidas
- Integración con FastAPI para acceso programático

## ¿Por qué Integradio?

| Problema | Solución |
| --------- | ---------- |
| Los componentes de Gradio son opacos para los agentes de IA. | Las intenciones semánticas hacen que cada widget sea descubrible. |
| Crear paneles desde cero cada vez. | 10 plantillas de página predefinidas, listas para personalizar. |
| Sin acceso programático a los gráficos de componentes. | Rutas de FastAPI + visualización D3.js / Mermaid. |
| La lógica de incrustación está dispersa en toda tu aplicación. | Un envoltorio, almacenamiento automático de vectores. |

## Requisitos

- Python 3.10+
- [Ollama](https://ollama.ai/) con el modelo `nomic-embed-text`
- Gradio 4.0+ (compatible con Gradio 5.x y 6.x)

## Instalación

```bash
# Basic installation
pip install integradio

# With all optional dependencies
pip install "integradio[all]"

# Development installation
pip install -e ".[dev]"
```

### Configuración de Ollama

Integradio requiere Ollama para generar incrustaciones:

```bash
# Install Ollama (see https://ollama.ai/)
# Then pull the embedding model:
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## Comienzo rápido

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

## Referencia de la API

### SemanticBlocks

`gr.Blocks` extendido con registro e integración de incrustador.

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

Envolver cualquier componente de Gradio con metadatos semánticos.

```python
component = semantic(
    gr.Textbox(label="Name"),
    intent="user enters their full name",
    tags=["form", "required"],
)
```

### Envolturas especializadas

Para componentes complejos, utilice envolturas especializadas que proporcionen metadatos semánticos más ricos:

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

### Plantillas de página

10 plantillas de página predefinidas para patrones de interfaz de usuario comunes:

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

## Visualización

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

## Integración con FastAPI

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

## Ejemplos

Consulte el directorio `examples/`:

- `basic_app.py` - Demostración de búsqueda simple
- `full_app.py` - Demostración de las 10 plantillas de página

```bash
# Run basic example
python examples/basic_app.py
# Visit http://localhost:7860
```

## Desarrollo

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

## Arquitectura

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

## Licencia

Licencia MIT - consulte [LICENSE](LICENSE) para obtener más detalles.

## Contribuciones

¡Las contribuciones son bienvenidas! Lea nuestras pautas de contribución y envíe solicitudes de extracción (PR).

## Enlaces

- [Documentación de Gradio](https://gradio.app/docs/)
- [Ollama](https://ollama.ai/)
- [nomic-embed-text](https://ollama.ai/library/nomic-embed-text)

