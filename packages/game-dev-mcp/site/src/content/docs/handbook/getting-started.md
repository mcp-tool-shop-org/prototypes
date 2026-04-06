---
title: Getting Started
description: Enable the UE5 Remote Control API and connect Game Dev MCP.
sidebar:
  order: 1
---

Game Dev MCP lets you talk to your game engine through natural conversation. It bridges any LLM to Unreal Engine 5 via the built-in Remote Control API.

## Prerequisites

- Node.js 18+
- Unreal Engine 5.4+ with the Remote Control API plugin enabled

## 1. Enable the Remote Control API

1. Open your UE5 project (5.4+)
2. **Edit > Plugins** — search "Remote Control API" — Enable
3. Restart the editor

This plugin ships with UE5 — you're just turning it on.

## 2. Install and configure

Run directly with npx:

```bash
npx @mcptoolshop/game-dev-mcp
```

Add to your MCP client config (e.g. Claude Desktop):

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

## 3. Test the connection

Ask your LLM: **"Ping Unreal Engine"** — it calls `ue_ping` and confirms the connection is live.

## What it feels like

> **You:** Spawn a point light above the table and make it warm

The LLM calls `ue_spawn_actor`, sets the transform, adjusts the color temperature via `ue_set_property` — and the light appears in your viewport. You keep talking, it keeps building.
