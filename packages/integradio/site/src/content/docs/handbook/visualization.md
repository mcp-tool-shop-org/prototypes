---
title: Visualization
description: Mermaid diagrams, D3.js interactive graphs, ASCII art, and FastAPI integration for component introspection.
sidebar:
  order: 4
---

Integradio can export your component graph in multiple formats. This is useful for debugging dataflows, documenting your UI, and giving AI agents a map of the interface.

## Mermaid diagrams

Generate a [Mermaid](https://mermaid.js.org/) flowchart from your component graph:

```python
from integradio.viz import generate_mermaid

diagram = generate_mermaid(demo)
print(diagram)
```

The output is a top-down (`graph TD`) Mermaid diagram with nodes styled by component type: buttons get trigger styling, inputs get input styling, and outputs get output styling. Links are labeled with their relationship type (trigger, dataflow).

Paste the output into any Mermaid-compatible renderer (GitHub markdown, Notion, Obsidian, etc.).

## D3.js interactive graphs

Generate a self-contained HTML page with an interactive force-directed graph:

```python
from integradio.viz import generate_html_graph

html = generate_html_graph(demo, width=800, height=600)

with open("graph.html", "w") as f:
    f.write(html)
```

The `width` and `height` parameters control the initial SVG dimensions, though the graph auto-sizes to the browser window. The HTML page includes:

- **Drag-and-drop nodes** -- rearrange the layout interactively
- **Hover tooltips** -- show component type, intent, and ID
- **Live search** -- filter nodes by typing in the search box
- **Color coding** -- nodes colored by component type (Button, Textbox, Markdown, Image, etc.)
- **Arrow markers** -- edges use directional arrows colored by relationship type

## ASCII art

For terminal-friendly output, generate an ASCII representation:

```python
from integradio.viz import generate_ascii_graph

print(generate_ascii_graph(demo, max_width=80))
```

The output groups components by type, shows their intents, and lists dataflow connections. The `max_width` parameter controls the line width of separator bars.

## Component tracing

Trace the upstream and downstream connections of a specific component:

```python
# Get the full dependency chain for a component
trace = demo.trace(results_component)
# Returns a dict:
# {
#   "upstream": [{"id": 1, "type": "Textbox", "intent": "...", "label": "..."}],
#   "downstream": [{"id": 3, "type": "Markdown", "intent": "...", "label": "..."}],
# }

for comp in trace["upstream"]:
    print(f"Feeds into this: {comp['label']} ({comp['type']})")

for comp in trace["downstream"]:
    print(f"This feeds into: {comp['label']} ({comp['type']})")
```

## FastAPI integration

Expose your component graph and search as REST endpoints:

```python
from fastapi import FastAPI

app = FastAPI()
demo.add_api_routes(app)
```

This adds the following routes:

### `GET /semantic/search`

Search components by natural language query.

**Parameters:** `q` (required), `k` (default 10, max 1000), `type` (optional component type filter), `tags` (optional comma-separated tag filter)

```bash
curl "http://localhost:8000/semantic/search?q=user+input&k=5"
```

```json
{
  "query": "user input",
  "count": 1,
  "results": [
    {
      "component_id": 1,
      "type": "Textbox",
      "intent": "user enters search terms",
      "label": "Search Query",
      "score": 0.932,
      "tags": ["input", "text"],
      "source": { "file": "app.py", "line": 12 }
    }
  ]
}
```

### `GET /semantic/component/{component_id}`

Get full metadata for a specific component, including relationships.

```bash
curl "http://localhost:8000/semantic/component/1"
```

### `GET /semantic/graph`

Export the entire component graph as JSON (D3-compatible format with `nodes` and `links` arrays).

```bash
curl "http://localhost:8000/semantic/graph"
```

### `GET /semantic/trace/{component_id}`

Trace upstream and downstream connections for a component.

```bash
curl "http://localhost:8000/semantic/trace/3"
```

### `GET /semantic/summary`

Get a JSON summary of all registered components, grouped by type.

```bash
curl "http://localhost:8000/semantic/summary"
```

## Using visualization for debugging

A practical workflow for debugging complex Gradio apps:

1. **Build your app** with `SemanticBlocks` and `semantic()` wrappers
2. **Generate a Mermaid diagram** to verify the dataflow matches your expectations
3. **Trace specific components** to check that events are wired correctly
4. **Run the FastAPI routes** to let AI agents query the component graph programmatically
5. **Export the D3 graph** for documentation or team reviews
