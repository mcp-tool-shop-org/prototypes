---
title: Reference
description: SemanticBlocks API, architecture internals, embedder, registry, HNSW, circuit breaker, events, and security scope.
sidebar:
  order: 5
---

Complete API reference and architecture overview for Integradio.

## SemanticBlocks API

`SemanticBlocks` is the main entry point. It extends `gr.Blocks` with a component registry and embedding pipeline.

### Constructor

```python
from integradio import SemanticBlocks

with SemanticBlocks(
    db_path=None,                        # SQLite path (None = in-memory)
    cache_dir=None,                      # Embedding cache directory
    ollama_url="http://localhost:11434",  # Ollama server URL
    embed_model="nomic-embed-text",      # Embedding model name
    auto_register=True,                  # Auto-register components on block exit
    theme=None,                          # Optional Gradio theme
) as demo:
    ...
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `search(query, k=10, component_type=None, tags=None)` | `list[SearchResult]` | Semantic search across all registered components |
| `find(query)` | Gradio component or `None` | Get the single most relevant Gradio component |
| `trace(component)` | `dict` | Get upstream/downstream dependency chain as `{"upstream": [...], "downstream": [...]}` |
| `map()` | `dict` | Export graph as D3.js-compatible JSON with `nodes` and `links` |
| `describe(component)` | `dict` | Full metadata dump for a component |
| `summary()` | `str` | Text report of all registered components |
| `add_api_routes(app)` | `None` | Mount FastAPI routes on a FastAPI/Starlette app |

### SearchResult

Returned by `search()`. Contains the component ID, full metadata, and similarity scores.

```python
@dataclass
class SearchResult:
    component_id: int              # Gradio component ID
    metadata: ComponentMetadata    # Full component metadata
    score: float                   # Cosine similarity (0.0 to 1.0)
    distance: float                # Raw distance from HNSW
```

Access metadata fields through `result.metadata`:

```python
results = demo.search("user input")
for r in results:
    print(r.metadata.label)          # Gradio label
    print(r.metadata.component_type) # e.g., "Textbox"
    print(r.metadata.intent)         # Semantic intent string
    print(r.metadata.tags)           # Metadata tags
    print(r.score)                   # Similarity score
```

### trace() return format

`trace()` returns a plain dict, not a dataclass:

```python
trace = demo.trace(some_component)
# Returns:
# {
#   "upstream": [{"id": 1, "type": "Textbox", "intent": "...", "label": "..."}],
#   "downstream": [{"id": 3, "type": "Markdown", "intent": "...", "label": "..."}],
# }
```

## Diagnostics

Run a health check to verify dependencies, Ollama connectivity, and optional extras:

```python
from integradio import diagnose

report = diagnose()
print(report)            # Human-readable output
print(report.to_dict())  # JSON-serializable dict
print(report.ok)         # True if no checks failed
```

## Architecture

Integradio consists of four core subsystems:

```
+-----------------------------------------+
|            SemanticBlocks                |
| (extends gr.Blocks with registry)       |
+----------+----------+------------------+
| Embedder | Registry | Event Introspect |
| (Ollama) | (HNSW)   | (dataflow graph) |
+----------+----------+------------------+
```

### Embedder

The embedder communicates with Ollama to generate vector representations of intent strings.

- **Model:** `nomic-embed-text` (768 dimensions, default)
- **Protocol:** HTTP POST to `http://localhost:11434/api/embeddings`
- **Caching:** Optional on-disk cache with versioned keys to avoid stale embeddings
- **Resilience:** Circuit breaker protects against Ollama downtime
- **Graceful degradation:** Returns zero vectors when Ollama is unavailable

```python
# The embedder is created automatically by SemanticBlocks.
# You rarely need to interact with it directly.
from integradio.embedder import Embedder

embedder = Embedder(
    model="nomic-embed-text",
    base_url="http://localhost:11434",
    cache_dir=Path("./cache"),
    use_circuit_breaker=True,
)

vector = embedder.embed("user enters search terms")
# Returns: numpy array of shape (768,)

# For search queries (uses a different prefix):
query_vec = embedder.embed_query("where does the user type?")
```

### Registry (HNSW + SQLite)

The registry stores component metadata and their vector embeddings. It uses HNSW (Hierarchical Navigable Small World) for approximate nearest-neighbor search, with a brute-force fallback when hnswlib is not installed.

- **Vector index:** HNSW via `hnswlib` (optional, in-process, no external service)
- **Metadata store:** SQLite (in-memory by default, optionally persisted to disk)
- **Search:** Cosine similarity with configurable `k` and optional type/tag filters

```python
from integradio.registry import ComponentRegistry, ComponentMetadata

registry = ComponentRegistry(db_path=Path("components.db"))

# Register a component
registry.register(
    component_id=1,
    vector=embedder.embed("user enters search terms"),
    metadata=ComponentMetadata(
        component_id=1,
        component_type="Textbox",
        intent="user enters search terms",
        label="Search Query",
        tags=["input", "text"],
    ),
)

# Search
results = registry.search(query_vector, k=10)
```

### Circuit breaker

The circuit breaker protects against Ollama failures (server down, model not loaded, timeout).

```
States:
  CLOSED  -> Normal operation. Requests pass through.
  OPEN    -> Ollama is down. Requests fail immediately (no waiting).
  HALF_OPEN -> Testing recovery. One request allowed through.
```

**Thresholds (as configured by the Embedder):**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `failure_threshold` | 3 | Failures before opening circuit |
| `timeout_seconds` | 30s | Time before trying again (OPEN -> HALF_OPEN) |
| `success_threshold` | 1 | Successes in HALF_OPEN before closing |

When the circuit is open, embedding calls return zero vectors. Components still register and work -- they just lack semantic vectors until Ollama recovers.

### Event introspection

Integradio inspects Gradio event listeners to build a dataflow graph:

```python
# When you write:
search_btn.click(fn=search, inputs=query, outputs=results)

# Integradio records:
# Edge: query -> search_btn (input to click handler)
# Edge: search_btn -> results (click handler output)
```

This graph powers `demo.trace()`, `demo.map()`, and all visualization exports.

## Events and WebSocket mesh

For real-time applications, Integradio provides an event system with WebSocket support:

```python
from integradio.events import EventMesh, SemanticEvent

mesh = EventMesh(secret_key="your-hmac-secret")

# Subscribe to component changes with pattern matching
@mesh.on("ui.component.*")
async def handle_update(event: SemanticEvent):
    print(f"Component updated: {event.data}")

# Emit events (HMAC-signed for integrity)
await mesh.emit("ui.component.click", {"id": 123})
```

Features include CloudEvents-compliant message format, HMAC-SHA256 message signing, rate limiting, origin validation, and automatic reconnection with exponential backoff.

## Inspector

The live component inspector provides a Gradio-based development panel:

```python
from integradio.inspector import Inspector

with SemanticBlocks() as demo:
    # Your components here...
    inspector = Inspector(demo)
    inspector.attach()

demo.launch()
```

The inspector shows a real-time component tree, live dataflow visualization, visual spec overlays, and supports search across the UI by intent.

## Visual system

The `integradio.visual` module provides a complete visual specification system:

- **Design tokens** (W3C DTCG-compliant): colors, dimensions, typography, shadows, borders
- **Visual specs** for components: layout, spacing, animations, responsive breakpoints
- **Theme generation** from base palettes with dark mode support
- **Export** to Style Dictionary, CSS, Tailwind, and Figma tokens
- **Validation** for accessibility (contrast ratios) and spec completeness
- **Screenshot analysis** to extract colors and layout from images
- **Figma bidirectional sync** (optional, requires httpx)

```python
from integradio.visual import VisualSpec

spec = VisualSpec(component_id="search-btn", component_type="Button")
spec.set_colors(background="#3b82f6", text="#ffffff")
print(spec.to_css())
```

## Security scope

Integradio is a **local-first** library. It does not phone home, collect telemetry, or send data to external services.

| Aspect | Scope |
|--------|-------|
| **Network** | Local Ollama only (`localhost:11434`) |
| **Storage** | In-memory HNSW + optional SQLite file |
| **File system** | Optional embedding cache directory |
| **Telemetry** | None |
| **Cloud APIs** | None |
| **Secrets** | HMAC secret for event signing (optional, user-provided) |

For the full security policy, see [SECURITY.md](https://github.com/mcp-tool-shop-org/integradio/blob/main/SECURITY.md) in the repository.
