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


## सारांश।

इंटीग्रैडियो, [ग्रैडियो](https://gradio.app/) को एम्बेडिंग तकनीक द्वारा संचालित सिमेंटिक खोज क्षमताओं के साथ विस्तारित करता है। इसके घटक वेक्टर प्रतिनिधित्व (वेक्टर रिप्रेजेंटेशन) रखते हैं, जो उन्हें केवल आईडी या लेबल के आधार पर नहीं, बल्कि इरादे के आधार पर खोजने योग्य बनाते हैं।

**मुख्य विशेषताएं:**
- गैर-आक्रामक घटक रैपिंग (यह किसी भी Gradio घटक के साथ काम करता है)
- ओलामा/नोमिक-एम्बेड-टेक्स्ट के माध्यम से सिमेंटिक खोज
- इवेंट लिसनरों से स्वचालित डेटा प्रवाह निष्कर्षण
- कई विज़ुअलाइज़ेशन प्रारूप (मर्मेड, डी3.जेएस, एएससीआईआई)
- 10 पूर्व-निर्मित पेज टेम्पलेट
- प्रोग्रामेटिक पहुंच के लिए फास्टएपी एकीकरण।

## इंटीग्रैडियो क्यों?

| समस्या। | समाधान। |
| "Please provide the English text you would like me to translate into Hindi." | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| ग्रैडियो के घटक कृत्रिम बुद्धिमत्ता (एआई) एजेंटों के लिए अपारदर्शी होते हैं। | सिमेंटिक इंटेंट (अर्थ संबंधी इरादे) हर विजेट को आसानी से खोजने योग्य बनाते हैं। |
| हर बार शुरुआत से डैशबोर्ड बनाना। | 10 पहले से तैयार किए गए पेज टेम्प्लेट, जिन्हें आप अपनी आवश्यकताओं के अनुसार अनुकूलित कर सकते हैं। |
| घटकों के ग्राफ तक प्रोग्रामेटिक रूप से पहुंचने की कोई सुविधा नहीं है। | फास्टएपीआई (FastAPI) रूट + डी3.js (D3.js) / मर्मेड (Mermaid) विज़ुअलाइज़ेशन। |
| आपके एप्लिकेशन में बिखरे हुए लॉजिक को एक साथ जोड़ना। | एक रैपर, स्वचालित वेक्टर संग्रहण। |

## आवश्यकताएं।

- पायथन 3.10 या उससे ऊपर का संस्करण
- [ओलामा](https://ollama.ai/) जिसमें `nomic-embed-text` मॉडल शामिल है
- ग्राडियो 4.0 या उससे ऊपर का संस्करण (ग्राडियो 5.x और 6.x के साथ संगत)

## स्थापना।

```bash
# Basic installation
pip install integradio

# With all optional dependencies
pip install "integradio[all]"

# Development installation
pip install -e ".[dev]"
```

### ओलामा का सेटअप।

इंटीग्रिडिओ को एम्बेडिंग उत्पन्न करने के लिए ओलामा की आवश्यकता होती है:

```bash
# Install Ollama (see https://ollama.ai/)
# Then pull the embedding model:
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## शुरुआत कैसे करें।

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

## एपीआई संदर्भ।

### सिमेंटिक ब्लॉक्स।

`gr.Blocks` को रजिस्ट्री (registry) और एम्बेडर (embedder) के साथ एकीकृत किया गया है।

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

### अर्थ संबंधी।

किसी भी Gradio घटक को अर्थपूर्ण मेटाडेटा के साथ लपेटें।

```python
component = semantic(
    gr.Textbox(label="Name"),
    intent="user enters their full name",
    tags=["form", "required"],
)
```

### विशेष प्रकार की पैकेजिंग सामग्री।

जटिल घटकों के लिए, विशेष रैपरों का उपयोग करें जो अधिक विस्तृत अर्थ संबंधी मेटाडेटा प्रदान करते हैं:

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

### पृष्ठ टेम्पलेट्स।

सामान्य यूआई (UI) डिजाइनों के लिए 10 पहले से तैयार किए गए पेज टेम्प्लेट:

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

## दृश्य प्रस्तुतीकरण।

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

## फास्टएपी एकीकरण।

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

## उदाहरण।

`examples/` नामक फ़ोल्डर को देखें:

- `basic_app.py` - एक साधारण खोज का प्रदर्शन।
- `full_app.py` - सभी 10 पेज टेम्प्लेट का प्रदर्शन।

```bash
# Run basic example
python examples/basic_app.py
# Visit http://localhost:7860
```

## विकास।

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

## आर्किटेक्चर।

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

## लाइसेंस।

एमआईटी लाइसेंस - विवरण के लिए [LICENSE](LICENSE) देखें।

## योगदान करना।

योगदानों का स्वागत है! कृपया हमारे योगदान संबंधी दिशानिर्देश पढ़ें और पुल रिक्वेस्ट (पीआर) जमा करें।

## लिंक्स।

- [ग्रैडियो प्रलेखन](https://gradio.app/docs/)
- [ओलामा](https://ollama.ai/)
- [नोमिक-एम्बेड-टेक्स्ट](https://ollama.ai/library/nomic-embed-text)

