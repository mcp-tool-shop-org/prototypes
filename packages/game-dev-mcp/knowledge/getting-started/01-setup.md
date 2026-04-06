---
title: "Setup — Enable Remote Control API"
category: getting-started
tags: [setup, remote-control, plugin, connection]
difficulty: beginner
summary: "How to enable the UE5 Remote Control API plugin and verify game-dev-mcp can connect."
ueVersion: "5.4+"
---

## Prerequisites

- Unreal Engine 5.4 or later (5.7 recommended)
- Node.js 18+
- A UE5 project open in the editor

## Step 1: Enable the Remote Control API Plugin

1. Open your UE5 project in the editor
2. Go to **Edit > Plugins**
3. Search for **"Remote Control API"**
4. Check the **Enabled** checkbox
5. Restart the editor when prompted

The plugin is built into UE5 — no download or compilation needed.

## Step 2: Verify the API is Running

Once the editor restarts, the Remote Control API HTTP server starts automatically on **port 30010**.

To verify, open a browser or use curl:

```
GET http://127.0.0.1:30010/remote/info
```

You should see a JSON response with `isEditor: true` and a list of available routes.

## Step 3: Install game-dev-mcp

```bash
npm install -g @mcptoolshop/game-dev-mcp
```

Or use npx without installing:

```bash
npx @mcptoolshop/game-dev-mcp
```

## Step 4: Configure Your MCP Client

Add to your MCP client configuration (e.g., Claude Desktop `claude_desktop_config.json`):

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

## Step 5: Test the Connection

Ask your LLM to run `ue_ping`. If it returns `connected: true`, you're ready to go.

## Configuration

Environment variables (all optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Game engine editor hostname |
| `GAMEDEV_MCP_PORT` | `30010` | Remote API port |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Request timeout in ms |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Log level (error/warn/info/debug) |

## Troubleshooting

- **"Cannot connect to Unreal Engine"**: Make sure the editor is running and the Remote Control API plugin is enabled.
- **Port conflict**: Another application may be using port 30010. Check with `netstat -an | grep 30010`.
- **Firewall**: Ensure localhost connections on port 30010 are not blocked.
