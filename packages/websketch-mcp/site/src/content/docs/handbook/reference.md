---
title: Reference
description: Complete API reference, error codes, and troubleshooting for websketch-mcp.
sidebar:
  order: 4
---

This page is the complete technical reference for websketch-mcp — tool schemas, error codes, and common troubleshooting steps.

## Tool summary

| Tool | Input | Output | Throws |
|------|-------|--------|--------|
| `websketch_validate` | `capture`, optional `limits` | `{ ok, error?, warnings? }` | Never |
| `websketch_render` | `capture` | ASCII text | On invalid capture |
| `websketch_diff` | `before`, `after` | `{ added, removed, modified }` | On invalid capture |
| `websketch_fingerprint` | `capture` | Hex string | On invalid capture |

## Input schemas

### websketch_validate

```json
{
  "type": "object",
  "properties": {
    "capture": {
      "type": "object",
      "description": "WebSketch IR capture object to validate"
    },
    "limits": {
      "type": "object",
      "description": "Optional resource limits",
      "properties": {
        "maxNodes": { "type": "number" },
        "maxDepth": { "type": "number" },
        "maxStringLength": { "type": "number" }
      }
    }
  },
  "required": ["capture"]
}
```

### websketch_render

```json
{
  "type": "object",
  "properties": {
    "capture": {
      "type": "object",
      "description": "WebSketch IR capture object"
    }
  },
  "required": ["capture"]
}
```

### websketch_diff

```json
{
  "type": "object",
  "properties": {
    "before": {
      "type": "object",
      "description": "Before capture"
    },
    "after": {
      "type": "object",
      "description": "After capture"
    }
  },
  "required": ["before", "after"]
}
```

### websketch_fingerprint

```json
{
  "type": "object",
  "properties": {
    "capture": {
      "type": "object",
      "description": "WebSketch IR capture object"
    }
  },
  "required": ["capture"]
}
```

## Error codes

All error codes are namespaced with the `WS_` prefix.

| Code | Source | Meaning |
|------|--------|---------|
| `WS_INVALID_ARGS` | validate, render, diff, fingerprint | Required arguments are missing or have the wrong type |
| `WS_INVALID_CAPTURE` | validate, render, diff, fingerprint | The capture object fails structural validation |
| `WS_LIMIT_EXCEEDED` | validate | A resource limit (node count, depth, or string length) was exceeded |
| `WS_INTERNAL` | Any | An unexpected runtime error occurred inside the server |

### Error shapes

**From `websketch_validate`** (always `isError: false`):

```json
{
  "ok": false,
  "error": {
    "code": "WS_INVALID_CAPTURE",
    "message": "Invalid capture: 2 validation issues",
    "issues": [
      { "path": "root.type", "message": "Expected string" }
    ]
  }
}
```

**From other tools** (`isError: true`):

```
[WS_INVALID_CAPTURE] Invalid capture in 'before': 1 issue
  root.type: Expected string
```

## Server metadata

| Field | Value |
|-------|-------|
| Name | `websketch-mcp` |
| Transport | stdio (stdin/stdout) |
| Protocol | MCP (JSON-RPC 2.0) |
| Capabilities | `tools` |
| Network | None — no outbound connections |
| Filesystem | None — no reads or writes |
| Telemetry | None |

## Troubleshooting

### "command not found" after global install

The npm global bin directory may not be in your `PATH`. Check with:

```bash
npm config get prefix
```

On most systems, adding `$(npm config get prefix)/bin` to your `PATH` resolves this. Alternatively, use `npx websketch-mcp` to bypass the global bin requirement.

### Build failures from source

If `npm run build` fails after cloning:

```bash
npm run clean
npm ci
npm run build
```

The `clean` script removes the `dist/` folder, and `npm ci` ensures exact dependency versions from the lockfile.

### Permission errors on Unix

The build process adds a shebang line and sets the executable bit on `dist/index.js` automatically. If the executable bit is missing:

```bash
chmod +x dist/index.js
```

### Capture validation always fails

Make sure the capture follows the [WebSketch IR specification](https://github.com/mcp-tool-shop-org/websketch-ir). The most common issue is a missing or malformed `root` node. Use `websketch_validate` to get a detailed list of what is wrong — the `issues` array in the error response pinpoints the exact path and problem.

### Large captures time out

If you are working with pages that exceed the default resource limits, pass custom limits to `websketch_validate`:

```json
{
  "capture": { ... },
  "limits": {
    "maxNodes": 50000,
    "maxDepth": 100
  }
}
```

Be aware that very large captures will also take longer to render, diff, and fingerprint.

## Related links

- [WebSketch IR specification](https://github.com/mcp-tool-shop-org/websketch-ir)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [GitHub repository](https://github.com/mcp-tool-shop-org/websketch-mcp)
- [npm package](https://www.npmjs.com/package/@mcptoolshop/websketch-mcp)
- [Issue tracker](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)
