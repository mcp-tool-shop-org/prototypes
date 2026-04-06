---
title: Page Templates
description: 10 pre-built page layouts for common Gradio UI patterns — Chat, Dashboard, Gallery, and more.
sidebar:
  order: 3
---

Integradio ships with 10 pre-built page templates. Each template is a fully functional Gradio layout with semantic components already wired up. Use them as-is or customize them for your application.

## Available templates

| Template | Use Case |
|----------|----------|
| `ChatPage` | Conversational AI interface |
| `DashboardPage` | KPI cards and activity feed |
| `HeroPage` | Landing page with CTAs |
| `GalleryPage` | Image grid with filtering |
| `AnalyticsPage` | Charts and metrics |
| `DataTablePage` | Editable data grid |
| `FormPage` | Multi-step form wizard |
| `UploadPage` | File upload with preview |
| `SettingsPage` | Configuration panels |
| `HelpPage` | FAQ accordion |

## Usage

All templates follow the same pattern:

```python
from integradio.pages import ChatPage

page = ChatPage()
page.launch()
```

Every component inside a template is already wrapped with `semantic()`, so the entire page is searchable out of the box.

## ChatPage

A conversational interface with streaming support, system prompt configuration, and model selection.

```python
from integradio.pages import ChatPage

page = ChatPage(
    title="My Assistant",
    persona="helpful-coder",
    system_prompt="You are a helpful coding assistant.",
    supports_streaming=True,
)
page.launch()
```

**Included components:** Chatbot display, message input, send button, system prompt textbox, model selector dropdown, clear button.

## DashboardPage

KPI summary cards with an activity feed. Ideal for monitoring dashboards.

```python
from integradio.pages import DashboardPage

page = DashboardPage(
    title="System Monitor",
    kpi_labels=["Requests/s", "Latency (ms)", "Error Rate", "Uptime"],
)
page.launch()
```

**Included components:** KPI number displays, activity log, refresh button, date range selector.

## HeroPage

A landing page layout with headline, description, and call-to-action buttons.

```python
from integradio.pages import HeroPage

page = HeroPage(
    title="Welcome to My App",
    description="Build semantic UIs in minutes.",
    primary_cta="Get Started",
    secondary_cta="Learn More",
)
page.launch()
```

**Included components:** Hero markdown block, primary and secondary buttons, feature cards.

## GalleryPage

An image grid with category filtering and lightbox preview.

```python
from integradio.pages import GalleryPage

page = GalleryPage(
    title="Image Gallery",
    categories=["All", "Photos", "Illustrations", "Screenshots"],
)
page.launch()
```

**Included components:** Gallery grid, category filter dropdown, search textbox, upload button.

## AnalyticsPage

Charts and metrics for data analysis workflows.

```python
from integradio.pages import AnalyticsPage

page = AnalyticsPage(
    title="Usage Analytics",
    chart_types=["line", "bar"],
    metrics=["views", "clicks", "conversions"],
)
page.launch()
```

**Included components:** Line plot, bar plot, metric summary numbers, date range picker, export button.

## DataTablePage

An editable data grid with sorting, filtering, and pagination.

```python
from integradio.pages import DataTablePage

page = DataTablePage(
    title="User Data",
    columns=["Name", "Email", "Role", "Status"],
    editable=True,
)
page.launch()
```

**Included components:** DataFrame, search textbox, add/delete row buttons, export CSV button.

## FormPage

A multi-step form wizard with validation.

```python
from integradio.pages import FormPage

page = FormPage(
    title="Registration",
    steps=["Personal Info", "Preferences", "Review"],
)
page.launch()
```

**Included components:** Step indicator, text inputs, radio buttons, checkboxes, next/back buttons, submit button.

## UploadPage

File upload with drag-and-drop, preview, and processing status.

```python
from integradio.pages import UploadPage

page = UploadPage(
    title="Upload Files",
    accept=[".pdf", ".docx", ".txt"],
    max_size_mb=50,
)
page.launch()
```

**Included components:** File upload zone, file list, preview area, process button, progress bar.

## SettingsPage

Configuration panels organized in tabs or accordions.

```python
from integradio.pages import SettingsPage

page = SettingsPage(
    title="Settings",
    sections=["General", "Appearance", "API Keys", "Advanced"],
)
page.launch()
```

**Included components:** Tab group, text inputs, toggles, dropdowns, save button, reset button.

## HelpPage

FAQ accordion with search.

```python
from integradio.pages import HelpPage

faqs = [
    ("How do I install?", "Run `pip install integradio`."),
    ("What models are supported?", "Any Ollama embedding model."),
    ("Is it free?", "Yes, MIT licensed."),
]

page = HelpPage(
    title="Help & FAQ",
    faqs=faqs,
)
page.launch()
```

**Included components:** Search textbox, accordion panels, contact form link.

## Customizing templates

All templates accept a `theme` parameter for Gradio theming and an `analytics` flag to enable component tracking:

```python
page = ChatPage(
    title="My Chat",
    theme=gr.themes.Soft(),
    analytics=True,  # Logs component interactions
)
```

You can also access individual components after creation to rewire events:

```python
page = DashboardPage(title="Monitor")
# Access the underlying SemanticBlocks
blocks = page.blocks
# All components are semantically searchable
refresh = blocks.find("refresh the data")
```
