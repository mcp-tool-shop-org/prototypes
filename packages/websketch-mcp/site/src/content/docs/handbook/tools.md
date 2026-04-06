---
title: Tools
description: Detailed reference for all four MCP tools exposed by websketch-mcp.
sidebar:
  order: 2
---

websketch-mcp exposes four tools over the Model Context Protocol. Each tool accepts JSON input via MCP's `tools/call` method and returns plain-text or JSON output. The recommended workflow is to **always call `websketch_validate` first**, then use the other tools on validated captures.

## websketch_validate

Preflight check for any WebSketch IR capture. This tool never throws and never returns `isError: true` — it always returns a structured JSON result.

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `capture` | `object` | Yes | A WebSketch IR capture object to validate |
| `limits` | `object` | No | Optional resource limits to override defaults |

The optional `limits` object supports:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxNodes` | `number` | 10000 | Maximum number of nodes in the capture tree |
| `maxDepth` | `number` | 50 | Maximum tree depth |
| `maxStringLength` | `number` | 10000 | Maximum length for any string value |

### Output

On success:

```json
{ "ok": true }
```

If the capture contains embedded warnings, those are passed through:

```json
{ "ok": true, "warnings": ["..."] }
```

On failure (invalid structure):

```json
{
  "ok": false,
  "error": {
    "code": "WS_INVALID_CAPTURE",
    "message": "Invalid capture: 2 validation issues",
    "issues": [...]
  }
}
```

On failure (resource limit exceeded):

```json
{
  "ok": false,
  "error": {
    "code": "WS_LIMIT_EXCEEDED",
    "message": "Node count 15000 exceeds limit 10000",
    "path": "nodeCount",
    "expected": 10000,
    "received": 15000
  }
}
```

### Why call this first

The other three tools will return `isError: true` if you pass them a malformed capture. By calling validate first and checking `ok: true`, agents can branch cleanly without needing try/catch logic.

---

## websketch_render

Converts a validated WebSketch IR capture into a compact ASCII wireframe. This gives LLMs a spatial, text-readable representation of any web page without images or raw HTML.

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `capture` | `object` | Yes | A valid WebSketch IR capture |

### Output

Plain text — an ASCII wireframe representation of the capture tree. Example:

```
+---------------------+
| Frame (root)        |
| +-- Button (#btn1)  |
| +-- Text (#text1)   |
+---------------------+
```

The output format is designed to be compact and unambiguous for LLM consumption. Node types, IDs, and hierarchy are all visible at a glance.

---

## websketch_diff

Compares two WebSketch IR captures and returns the structural differences. Useful for tracking UI regressions after deployments, confirming expected layout changes, or asserting invariants in automated agent workflows.

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `before` | `object` | Yes | The baseline capture |
| `after` | `object` | Yes | The capture to compare against the baseline |

Both captures are validated internally. If either is malformed, the tool returns `isError: true` with a descriptive message.

### Output

JSON describing structural changes:

```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

- **added** — nodes present in `after` but not in `before`
- **removed** — nodes present in `before` but not in `after`
- **modified** — nodes present in both but with changed properties

---

## websketch_fingerprint

Generates a deterministic hash for a WebSketch IR capture. The same page structure always produces the same hash, making this tool useful for cache keys, snapshot testing, and lightweight change detection without full diff overhead.

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `capture` | `object` | Yes | A valid WebSketch IR capture |

### Output

Plain text — a hex string representing the structural fingerprint of the capture.

```
a1b2c3d4e5f6...
```

### Determinism guarantee

Two captures with identical structure will always produce the same fingerprint, regardless of when or where they were generated. This makes fingerprints safe to use as cache keys or in CI assertions.
