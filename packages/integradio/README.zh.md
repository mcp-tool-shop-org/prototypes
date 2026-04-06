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


## 概述

Integradio 扩展了 [Gradio](https://gradio.app/)，增加了基于嵌入技术的语义搜索功能。 组件携带向量表示，使其可以通过意图进行发现，而不仅仅是通过 ID 或标签。

**主要特性：**
- 非侵入式的组件封装（适用于任何 Gradio 组件）
- 通过 Ollama/nomic-embed-text 实现语义搜索
- 自动从事件监听器中提取数据流
- 多种可视化格式（Mermaid、D3.js、ASCII）
- 10 个预构建的页面模板
- FastAPI 集成，提供编程访问接口

## 为什么选择 Integradio？

| 问题 | 解决方案 |
| --------- | ---------- |
| Gradio 组件对 AI 代理来说是不可见的。 | 语义意图使每个组件都易于发现。 |
| 每次都从头开始构建仪表盘。 | 10 个预构建的页面模板，可立即定制。 |
| 无法对组件图进行编程访问。 | FastAPI 路由 + D3.js / Mermaid 可视化。 |
| 嵌入逻辑分散在您的应用程序中。 | 一个封装器，自动向量存储。 |

## 需求

- Python 3.10+
- [Ollama](https://ollama.ai/)，以及 `nomic-embed-text` 模型
- Gradio 4.0+（兼容 Gradio 5.x 和 6.x）

## 安装

```bash
# Basic installation
pip install integradio

# With all optional dependencies
pip install "integradio[all]"

# Development installation
pip install -e ".[dev]"
```

### Ollama 设置

Integradio 需要 Ollama 来生成嵌入向量：

```bash
# Install Ollama (see https://ollama.ai/)
# Then pull the embedding model:
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## 快速开始

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

## API 参考

### SemanticBlocks

扩展了 `gr.Blocks`，集成了注册表和嵌入器。

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

使用语义元数据包装任何 Gradio 组件。

```python
component = semantic(
    gr.Textbox(label="Name"),
    intent="user enters their full name",
    tags=["form", "required"],
)
```

### 专用封装器

对于复杂的组件，请使用提供更丰富语义元数据的专用封装器：

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

### 页面模板

10 个预构建的页面模板，适用于常见的 UI 模式：

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

## 可视化

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

## FastAPI 集成

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

## 示例

请查看 `examples/` 目录：

- `basic_app.py` - 简单的搜索演示
- `full_app.py` - 展示所有 10 个页面模板

```bash
# Run basic example
python examples/basic_app.py
# Visit http://localhost:7860
```

## 开发

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

## 架构

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

## 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE)。

## 贡献

欢迎贡献！请阅读我们的贡献指南并提交 PR。

## 链接

- [Gradio 文档](https://gradio.app/docs/)
- [Ollama](https://ollama.ai/)
- [nomic-embed-text](https://ollama.ai/library/nomic-embed-text)

