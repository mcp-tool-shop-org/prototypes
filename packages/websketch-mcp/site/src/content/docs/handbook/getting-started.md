---
title: Getting Started
description: Install websketch-mcp and connect it to your MCP client in under two minutes.
sidebar:
  order: 1
---

websketch-mcp is a Model Context Protocol server that gives LLM agents structured access to web page captures through the [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) format. It exposes four tools — validate, render, diff, and fingerprint — over stdio transport.

## Prerequisites

- **Node.js 18** or later
- An MCP-compatible client such as [Claude Desktop](https://claude.ai/download) or Claude Code

## Install from npm

The fastest way to get started is a global install:

```bash
npm install -g @mcptoolshop/websketch-mcp
```

After installation, the `websketch-mcp` command is available system-wide.

You can also run it without installing:

```bash
npx @mcptoolshop/websketch-mcp
```

## Install from source

If you want to hack on the server itself or pin a specific commit:

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

The `npm link` step makes the `websketch-mcp` binary available globally, pointing at your local build.

## Connect to Claude Desktop

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

Restart Claude Desktop and the four WebSketch tools will appear in the tool picker.

## Verify the connection

Ask Claude to call `websketch_validate` with an empty capture. A working server will respond with a structured `{ ok: false, error: ... }` result rather than a connection error. If you see a validation error, the server is running correctly — it simply means the empty object is not a valid capture.

## What's next

- **[Tools](/websketch-mcp/handbook/tools/)** — Learn what each of the four MCP tools does
- **[Usage](/websketch-mcp/handbook/usage/)** — See real workflow patterns and client configurations
- **[Reference](/websketch-mcp/handbook/reference/)** — Full input/output schemas and error codes
