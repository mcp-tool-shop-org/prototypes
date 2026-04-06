---
title: Semantic Wrappers
description: The core semantic() function and specialized wrappers for Chatbot, ImageEditor, plots, and more.
sidebar:
  order: 2
---

Integradio provides two levels of wrapping: the universal `semantic()` function for any Gradio component, and specialized wrappers that extract richer metadata from complex components.

## The core `semantic()` function

`semantic()` works with any Gradio component. Pass it a component and an intent string:

```python
from integradio import semantic
import gradio as gr

name_input = semantic(
    gr.Textbox(label="Full Name"),
    intent="user enters their full name",
    tags=["form", "required"],
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | Any Gradio component | The component to wrap |
| `intent` | `str` (optional) | Natural language description of what this component does. Auto-inferred from label if omitted. |
| `tags` | `list[str]` (optional) | Additional tags for filtering and categorization. Merged with auto-inferred tags. |
| `visual` | `VisualSpec` (optional) | Visual specification for appearance definition |

The intent string is embedded into a vector via Ollama. Tags are stored as metadata for filtering. If you omit `intent`, it defaults to the component's label or type name.

## Specialized wrappers

For components with complex behavior, specialized wrappers automatically generate rich semantic tags based on the component's configuration.

### `semantic_chatbot` -- Chatbot

```python
from integradio import semantic_chatbot

chat = semantic_chatbot(
    gr.Chatbot(label="Assistant"),
    persona="coder",
    supports_streaming=True,
    supports_like=True,
)
# Auto-tags include: "streaming", "feedback", "likeable",
#   "persona-coder", "code-assistant", "programming"
```

**Parameters:** `persona` (str: "assistant", "coder", "tutor", "creative", "analyst"), `supports_streaming` (bool), `supports_retry` (bool), `supports_undo` (bool), `supports_like` (bool), `message_format` (str)

### `semantic_image_editor` -- ImageEditor

```python
from integradio import semantic_image_editor

editor = semantic_image_editor(
    gr.ImageEditor(label="Edit"),
    use_case="inpainting",
    supports_masks=True,
    tools=["brush", "eraser"],
)
# Auto-tags include: "tool-brush", "tool-eraser",
#   "masking", "segmentation-input", "inpainting", "generative", "inpaint", "fill"
```

**Parameters:** `use_case` (str: "inpainting", "annotation", "segmentation", "photo_editing"), `supports_masks` (bool), `supports_layers` (bool), `tools` (list[str]), `output_format` (str)

### `semantic_annotated_image` -- AnnotatedImage

```python
from integradio import semantic_annotated_image

detections = semantic_annotated_image(
    gr.AnnotatedImage(label="Detections"),
    annotation_type="bbox",
    entity_types=["person", "car", "dog"],
)
# Auto-tags include: "bbox", "bounding-box", "detection", "localization",
#   "detects-person", "detects-car", "detects-dog"
```

**Parameters:** `annotation_type` (str: "bbox", "segmentation", "polygon", "keypoint"), `entity_types` (list[str]), `color_map` (dict), `supports_overlapping` (bool)

### `semantic_highlighted_text` -- HighlightedText

```python
from integradio import semantic_highlighted_text

entities = semantic_highlighted_text(
    gr.HighlightedText(label="Entities"),
    annotation_type="ner",
    entity_types=["PERSON", "ORG", "LOC"],
)
# Auto-tags include: "ner", "named-entity", "entity-recognition", "extraction",
#   "person-entity", "organization-entity", "location-entity"
```

**Parameters:** `annotation_type` (str: "ner", "pos", "sentiment", "classification", "highlight"), `entity_types` (list[str]), `color_map` (dict)

### `semantic_multimodal` -- MultimodalTextbox

```python
from integradio import semantic_multimodal

vlm_input = semantic_multimodal(
    gr.MultimodalTextbox(label="Ask about images"),
    use_case="image_analysis",
    accepts_images=True,
)
# Auto-tags include: "vision", "image-input", "document-input",
#   "image_analysis", "analysis", "vlm"
```

**Parameters:** `use_case` (str: "chat", "document_qa", "image_analysis", "code_review"), `accepts_images` (bool), `accepts_files` (bool), `accepts_audio` (bool), `max_files` (int), `file_types` (list[str])

### `semantic_plot` -- LinePlot / BarPlot / ScatterPlot

```python
from integradio import semantic_plot

metrics_chart = semantic_plot(
    gr.LinePlot(x="date", y="value"),
    chart_type="line",
    data_domain="metrics",
    axes=["date", "value"],
)
# Auto-tags include: "chart-line", "timeseries", "trend", "continuous",
#   "interactive-viz", "domain-metrics"
```

**Parameters:** `chart_type` (str: "line", "bar", "scatter", "pie", "heatmap", "histogram" -- auto-inferred from component if omitted), `data_domain` (str), `axes` (list[str]), `interactive` (bool), `supports_zoom` (bool), `supports_pan` (bool)

### `semantic_model3d` -- Model3D

```python
from integradio import semantic_model3d

viewer = semantic_model3d(
    gr.Model3D(label="3D Preview"),
    use_case="game_asset",
    supports_animation=True,
    supported_formats=["glb", "gltf"],
)
# Auto-tags include: "format-glb", "format-gltf", "animated", "rigged",
#   "textured", "orbitable", "game_asset", "game-dev", "asset"
```

**Parameters:** `use_case` (str: "mesh_generation", "cad_viewer", "game_asset", "medical", "architectural"), `supported_formats` (list[str], default: ["obj", "glb", "gltf"]), `supports_animation` (bool), `supports_textures` (bool), `camera_controls` (bool)

### `semantic_dataframe` -- DataFrame

```python
from integradio import semantic_dataframe

table = semantic_dataframe(
    gr.DataFrame(label="Results"),
    data_domain="database",
    editable=True,
    columns=["id", "name", "value"],
)
# Auto-tags include: "editable", "interactive-data",
#   "domain-database", "sql", "query-results",
#   "has-identifier", "has-entity"
```

**Parameters:** `data_domain` (str: "database", "spreadsheet", "metrics", "logs", "inventory", "users"), `editable` (bool), `columns` (list[str]), `row_count` (int)

### `semantic_file_explorer` -- FileExplorer

```python
from integradio import semantic_file_explorer

files = semantic_file_explorer(
    gr.FileExplorer(label="Project Files"),
    root_type="code_project",
    file_types=[".py", ".js", ".ts"],
)
# Auto-tags include: "code_project", "source-code", "repository", "code-files"
```

**Parameters:** `root_type` (str: "code_project", "documents", "media", "data", "config"), `file_types` (list[str])

## Auto-tags explained

Every specialized wrapper generates tags automatically based on:

1. **Capabilities** -- `streaming`, `masking`, `editable`, `orbitable`, etc.
2. **Domain** -- `domain-metrics`, `domain-database`, `game-dev`, etc.
3. **Tools/Formats** -- `tool-brush`, `format-glb`, `code-files`, etc.
4. **Entities** -- `detects-person`, `person-entity`, `has-temporal`, etc.

These tags are stored alongside the vector embedding and can be used for filtered search:

```python
# Search only among visualization components
results = demo.search("show me metrics", tags=["chart-line"])

# Search only among Textbox components
results = demo.search("user input", component_type="Textbox")
```
