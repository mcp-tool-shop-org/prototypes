---
title: For Beginners
description: New to websketch-mcp? Start here for a gentle introduction.
sidebar:
  order: 99
---

This guide walks you through websketch-mcp from scratch. No prior MCP experience is required.

## What is this tool?

websketch-mcp is a **Model Context Protocol (MCP) server** that lets LLM agents inspect web page structure without seeing raw HTML or screenshots. It works by accepting structured snapshots of web pages (called "captures" in the [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) format) and exposing four tools that validate, render, compare, and fingerprint those captures.

In practical terms: an agent can ask "show me this page as an ASCII wireframe" or "what changed between these two versions of a page?" and get a structured, text-only answer.

The server runs locally, uses stdio transport (no network, no file access), and processes everything in memory.

## Who is this for?

websketch-mcp is built for developers and teams who want to give LLM agents structured access to web page layouts. Typical users include:

- **AI/ML engineers** building agent workflows that need to understand page structure
- **QA and testing teams** using agents to detect UI regressions
- **Front-end developers** who want automated layout diffing without screenshots
- **MCP plugin authors** who want to integrate page-aware tools into their agent stacks

If you are new to the Model Context Protocol, this tool is a good starting point because it has no network access, no filesystem writes, and a small, predictable API surface.

## Prerequisites

Before you start, make sure you have:

- **Node.js 18 or later** installed ([download](https://nodejs.org/))
- **An MCP-compatible client** such as [Claude Desktop](https://claude.ai/download) or Claude Code

You can verify your Node.js version by running:

```bash
node --version
```

## Installation

Install the package globally from npm:

```bash
npm install -g @mcptoolshop/websketch-mcp
```

This makes the `websketch-mcp` command available in your terminal. You can verify the install succeeded by checking that the command exists:

```bash
which websketch-mcp   # Unix/macOS
where websketch-mcp   # Windows
```

Note: `websketch-mcp` is a stdio server, not a CLI with flags. Running it directly will block on stdin waiting for MCP JSON-RPC messages. It is designed to be launched by an MCP client, not run interactively.

If you prefer not to install globally, you can use `npx` to run it on demand:

```bash
npx @mcptoolshop/websketch-mcp
```

## Connecting to your MCP client

### Claude Desktop

Open your Claude Desktop configuration file (`claude_desktop_config.json`) and add a server entry:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

Restart Claude Desktop. The four WebSketch tools will appear in the tool picker automatically.

### Claude Code

Add the same configuration to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Verifying the connection

Ask your LLM agent to call `websketch_validate` with an empty object as the capture. A working server responds with a structured error (the empty object is not a valid capture). If you see `"ok": false` with an error code, the server is connected and running correctly.

## Core concepts

### Captures

A "capture" is a JSON snapshot of a web page's structure in the WebSketch IR format. It contains a tree of nodes (frames, buttons, text, images, etc.) with bounding boxes and metadata. Captures are produced by tools like the websketch browser extension or programmatically via the websketch-ir library.

A minimal valid capture looks like this:

```json
{
  "version": "0.1",
  "url": "https://example.com",
  "timestamp_ms": 1700000000000,
  "viewport": { "w_px": 1920, "h_px": 1080, "aspect": 1.78 },
  "compiler": { "name": "websketch-ir", "version": "2.0.0", "options_hash": "abc" },
  "root": {
    "id": "",
    "role": "PAGE",
    "bbox": [0, 0, 1, 1],
    "interactive": false,
    "visible": true
  }
}
```

### The four tools

| Tool | Purpose | When to use |
|------|---------|-------------|
| `websketch_validate` | Check if a capture is well-formed | Always call first, before any other tool |
| `websketch_render` | Convert a capture to an ASCII wireframe | When you want a text-readable layout view |
| `websketch_diff` | Compare two captures structurally | After a deployment or UI change |
| `websketch_fingerprint` | Generate a deterministic hash | For cache keys or change detection |

### The validate-first pattern

Always call `websketch_validate` before using the other three tools. The validate tool never throws errors -- it returns `{ "ok": true }` or `{ "ok": false, "error": { ... } }`. The other tools will return hard errors if the capture is malformed. Validating first lets your agent handle bad input gracefully.

## Your First 5 Minutes

Here is the simplest end-to-end workflow: validate a capture, then render it as ASCII.

**Step 1 -- Validate the capture:**

Call `websketch_validate` with your capture object:

```json
{
  "capture": {
    "version": "0.1",
    "url": "https://example.com",
    "timestamp_ms": 1700000000000,
    "viewport": { "w_px": 1920, "h_px": 1080, "aspect": 1.78 },
    "compiler": { "name": "websketch-ir", "version": "2.0.0", "options_hash": "abc" },
    "root": {
      "id": "",
      "role": "PAGE",
      "bbox": [0, 0, 1, 1],
      "interactive": false,
      "visible": true,
      "children": [
        { "id": "header", "role": "SECTION", "bbox": [0, 0, 1, 0.1], "interactive": false, "visible": true },
        { "id": "btn-submit", "role": "BUTTON", "bbox": [0.4, 0.5, 0.2, 0.05], "interactive": true, "visible": true }
      ]
    }
  }
}
```

Expected response: `{ "ok": true }`

**Step 2 -- Render to ASCII:**

Call `websketch_render` with the same capture. The server returns a text wireframe showing the page tree with node types, IDs, and hierarchy -- all readable without images.

**Step 3 -- Compare versions (optional):**

If you have a second capture (for example, after a UI change), call `websketch_diff` with `before` and `after` to see what was added, removed, or modified.

## Common Mistakes

These are the most frequent issues beginners hit and how to fix them:

1. **Skipping validation** -- Calling `websketch_render`, `websketch_diff`, or `websketch_fingerprint` directly without calling `websketch_validate` first. If the capture is malformed, these tools return hard errors (`isError: true`). Always validate first to get a graceful `{ ok: false }` response instead.

2. **Missing required capture fields** -- A valid WebSketch IR capture must include `version`, `url`, `timestamp_ms`, `viewport`, `compiler`, and `root`. Omitting any of these causes validation to fail. The `issues` array in the validation error response tells you exactly which field is missing or wrong.

3. **Running the server interactively** -- `websketch-mcp` is a stdio MCP server, not a CLI tool. Running it in a terminal will appear to hang because it is waiting for JSON-RPC input on stdin. Let your MCP client (Claude Desktop, Claude Code) launch it instead.

4. **Forgetting to restart Claude Desktop** -- After editing `claude_desktop_config.json`, you must restart Claude Desktop for the new server entry to take effect. The server will not appear in the tool picker until the client is restarted.

5. **Wrong npm package name** -- The scoped name is `@mcptoolshop/websketch-mcp`. Using `websketch-mcp` without the scope in `npm install` will either fail or install a different package.

## Troubleshooting

### "command not found" after install

Your npm global bin directory may not be in your PATH. Check with:

```bash
npm config get prefix
```

Add the `bin` subdirectory of that prefix to your PATH. Or bypass the issue entirely with `npx @mcptoolshop/websketch-mcp`.

### Validation always fails

The most common cause is a missing or malformed `root` node. Every capture must have `version`, `url`, `timestamp_ms`, `viewport`, `compiler`, and `root` at minimum. Use `websketch_validate` to get a detailed `issues` array that pinpoints the exact path and problem.

### Large captures are slow

The default resource limits (10,000 nodes, depth 50) are generous for typical pages. If you are working with very large captures, pass custom limits to `websketch_validate`:

```json
{
  "capture": { "..." : "..." },
  "limits": { "maxNodes": 50000, "maxDepth": 100 }
}
```

Be aware that oversized captures will also be slower to render, diff, and fingerprint.

### Server does not appear in Claude Desktop

Make sure you restarted Claude Desktop after editing `claude_desktop_config.json`. Also verify that the `websketch-mcp` command exists in your terminal -- if it does not, the global install may not be on your PATH.

### Error codes at a glance

| Code | Meaning |
|------|---------|
| `WS_INVALID_ARGS` | A required argument is missing or the wrong type |
| `WS_INVALID_CAPTURE` | The capture fails structural validation |
| `WS_LIMIT_EXCEEDED` | A resource limit (nodes, depth, string length) was exceeded |
| `WS_INTERNAL` | An unexpected runtime error inside the server |

For the full error reference, see the [Reference](/websketch-mcp/handbook/reference/) page.

## Next Steps

Now that you understand the basics, explore the rest of the handbook:

- **[Getting Started](/websketch-mcp/handbook/getting-started/)** -- Detailed installation and connection instructions
- **[Tools](/websketch-mcp/handbook/tools/)** -- Deep dive into each of the four MCP tools with full input/output examples
- **[Usage](/websketch-mcp/handbook/usage/)** -- Real workflow patterns, client configuration for different MCP clients, and the WebSketch ecosystem
- **[Reference](/websketch-mcp/handbook/reference/)** -- Complete API schemas, error code catalog, and troubleshooting reference

## Glossary

| Term | Definition |
|------|-----------|
| **MCP** | Model Context Protocol -- an open standard for connecting LLM agents to external tools and data sources via a structured JSON-RPC interface |
| **Capture** | A JSON snapshot of a web page's structure in the WebSketch IR format, containing a tree of UI nodes with bounding boxes and metadata |
| **WebSketch IR** | The intermediate representation format that defines how web page structure is serialized into JSON -- the data format that websketch-mcp operates on |
| **stdio transport** | A communication method where the server reads input from stdin and writes output to stdout, with no network connections involved |
| **JSON-RPC** | A lightweight remote procedure call protocol encoded in JSON, used by MCP for communication between clients and servers |
| **Wireframe** | A simplified text-based representation of a page layout showing element hierarchy, types, and IDs without visual styling |
| **Fingerprint** | A deterministic hash string derived from a capture's structure, useful for detecting changes without performing a full diff |
| **Resource limits** | Configurable caps on capture size (node count, tree depth, string length) that prevent processing of excessively large inputs |
