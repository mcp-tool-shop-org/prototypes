---
title: Getting Started
description: Install mcp-aside and add it to your MCP client.
sidebar:
  order: 1
---

## Add to your MCP client

Add the following to your MCP client config (e.g. `claude_desktop_config.json`, `.mcp.json`, or VS Code settings):

```json
{
  "mcpServers": {
    "aside": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/mcp-aside"]
    }
  }
}
```

The server speaks MCP over stdio. No API keys, no database, no configuration files needed.

## From source

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-aside.git
cd mcp-aside
npm install
npm run build
node build/index.js
```

## Push your first interjection

Once the server is running, call `aside.push` to jot down a thought:

```javascript
aside.push({
  text: "revisit error handling later",
  priority: "med",
  reason: "edge case spotted during refactor",
  tags: ["tech-debt"]
})
```

If the push succeeds, you get back `{ ok: true, item: { ... } }` with the full interjection including its generated `id`, `createdAt`, and computed `expiresAt`.

If guardrails reject it (duplicate, rate-limited, or empty text), you get `{ ok: false, code: "INBOX.DEDUPED", message: "..." }`.

## Read the inbox

The inbox is exposed as an MCP resource at `interject://inbox`. Reading it returns a JSON array of active interjections, newest first. Expired items are automatically filtered out.

You can also call `aside.status` for a quick summary of inbox size and current guardrail settings.

## Check usage stats

Call `aside.stats` to see how many interjections have been accepted, rejected, deduped, or rate-limited since the server started.

## CLI version flag

```bash
npx @mcptoolshop/mcp-aside --version
```

Prints the version and exits.
