---
title: Usage
description: Common workflow patterns, client configuration, and integration examples for websketch-mcp.
sidebar:
  order: 3
---

This page covers practical usage patterns for websketch-mcp — how to wire it up to different MCP clients, the recommended tool call sequence, and how it fits into larger agent workflows.

## Transport

websketch-mcp uses **stdio transport** exclusively. It reads JSON-RPC messages from stdin and writes responses to stdout. There is no HTTP server, no WebSocket, and no network egress. Diagnostic messages go to stderr.

```bash
# Run the server directly (blocks on stdin)
websketch-mcp
```

## Client configuration

### Claude Desktop

Add a `websketch` entry to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Claude Code

In your Claude Code MCP configuration, register the server:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programmatic (Node.js)

Spawn the server as a child process and communicate over stdio:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP JSON-RPC messages to server.stdin
// Read MCP responses from server.stdout
// stderr is inherited for diagnostics
```

## Recommended tool call sequence

The four tools are designed to be called in a specific order:

1. **Validate first** — call `websketch_validate` on every capture before doing anything else. Check that `ok` is `true`.
2. **Then render, diff, or fingerprint** — once the capture is validated, use whichever tool fits your task.

This pattern lets agents fail fast on malformed input without error handling around every subsequent call.

### Example: render a page

```
1. websketch_validate({ capture }) -> { ok: true }
2. websketch_render({ capture })   -> ASCII wireframe
```

### Example: compare two versions

```
1. websketch_validate({ capture: before }) -> { ok: true }
2. websketch_validate({ capture: after })  -> { ok: true }
3. websketch_diff({ before, after })       -> { added, removed, modified }
```

### Example: change detection

```
1. websketch_validate({ capture }) -> { ok: true }
2. websketch_fingerprint({ capture }) -> "a1b2c3..."
3. Compare against stored hash
```

## The WebSketch ecosystem

websketch-mcp is one piece of a larger pipeline:

- **[websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)** — the core IR library that defines the capture format and provides the validate, render, diff, and fingerprint functions
- **websketch-mcp** (this tool) — wraps those functions as MCP tools so LLM agents can call them
- **websketch-extension** — a browser extension that captures live web pages into WebSketch IR format

The typical end-to-end flow is: capture a page (extension or CLI), validate the capture (MCP), then render/diff/fingerprint as needed.

## Resource limits

The `websketch_validate` tool accepts optional resource limits to constrain capture size:

| Limit | Default | Purpose |
|-------|---------|---------|
| `maxNodes` | 10,000 | Prevents processing of excessively large page trees |
| `maxDepth` | 50 | Guards against deeply nested structures |
| `maxStringLength` | 10,000 | Caps individual string values in the capture |

These defaults are generous for typical web pages. Override them when working with unusually large or deep page structures.

## Error handling

websketch-mcp follows a two-tier error model:

- **`websketch_validate`** never throws and never sets `isError`. It always returns `{ ok: true }` or `{ ok: false, error: { ... } }`. This makes it safe to call without error handling.
- **All other tools** return `isError: true` if the input is malformed or an unexpected error occurs. The error message includes a namespaced code (such as `WS_INVALID_ARGS`, `WS_INVALID_CAPTURE`, or `WS_INTERNAL`) and a human-readable description.

By validating first, agents can avoid `isError` responses from the other three tools entirely.
