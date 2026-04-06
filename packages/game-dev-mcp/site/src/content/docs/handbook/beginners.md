---
title: Beginners
description: First steps for new users of Game Dev MCP.
sidebar:
  order: 99
---

New to Game Dev MCP? This page walks you through everything you need to go from zero to talking to your game engine.

## What is Game Dev MCP?

Game Dev MCP is an MCP server that connects any LLM (Claude, GPT, local models) to Unreal Engine 5. Instead of clicking through menus to spawn actors, set properties, or manage assets, you describe what you want in natural language and the AI does it for you.

It works through the Remote Control API that already ships with UE5. No custom C++ plugins. No engine compilation. You enable one built-in plugin, point Game Dev MCP at it, and start talking.

The server exposes 44 tools across 9 categories: actors, properties, assets, levels, blueprints, editor utilities, a knowledge library, project context, and mission tracking.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18 or later.** Check with `node --version`. Download from [nodejs.org](https://nodejs.org/) if needed.
- **Unreal Engine 5.4 or later.** The Remote Control API plugin ships with UE5 but requires 5.4+.
- **An MCP-compatible client.** Claude Desktop, Claude Code, or any other client that supports the Model Context Protocol.

You do not need to install any UE5 marketplace plugins or write any C++ code.

## Installation

### Step 1: Enable the Remote Control API in UE5

1. Open your UE5 project.
2. Go to **Edit > Plugins**.
3. Search for **Remote Control API**.
4. Check the **Enabled** checkbox.
5. Restart the editor when prompted.

To verify it is running, open a browser and visit `http://127.0.0.1:30010/remote/info`. If you see a JSON response, the API is active.

### Step 2: Configure your MCP client

Add Game Dev MCP to your client's configuration. For **Claude Desktop**, edit `claude_desktop_config.json`:

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

For **Claude Code**, add the same block to your `.mcp.json` or project settings.

The `npx` command downloads and runs the server automatically. No global install needed.

### Step 3: Verify the connection

Open your LLM client and say: **"Ping Unreal Engine."**

The AI calls `ue_ping` behind the scenes. If you see a success response with `connected: true`, everything is wired up correctly.

## Your first session

Here is a step-by-step walkthrough of a typical first session. Each prompt is something you type to your LLM.

### Spawn an actor

> **You:** Spawn a point light at position 0, 0, 200 and call it "MyLight"

The AI calls `ue_spawn_actor` with `className: "PointLight"`, `location: {x: 0, y: 0, z: 200}`, and `label: "MyLight"`. A point light appears in your UE5 viewport.

### Inspect it

> **You:** What properties does MyLight have?

The AI calls `ue_find_actors_by_name` to get the actor path, then `ue_describe_object` to list every UPROPERTY and callable function. It summarizes the results for you.

### Change a property

> **You:** Set the light intensity to 50000

The AI calls `ue_set_property` on the light component with `propertyName: "Intensity"` and `value: 50000`. The light brightens in the viewport.

### Move it

> **You:** Move the light 300 units to the right

The AI calls `ue_get_actor_transform` to read the current position, adds 300 to the Y coordinate, then calls `ue_set_actor_transform` with the new location.

### Save your work

> **You:** Save the level

The AI calls `ue_save_current_level`. Your changes are written to disk.

### Clean up

> **You:** Delete MyLight

The AI calls `ue_delete_actor` to remove it from the level.

## Key concepts

### Actor paths

Every actor in a UE5 level has a unique object path like `/Game/Maps/Main.Main:PersistentLevel.PointLight_0`. These paths are session-specific -- they change when you restart the editor or reload the level. Always use `ue_find_actors_by_name` or `ue_get_all_actors` to get fresh paths rather than hardcoding them.

### The describe-then-set pattern

When you want to change something on an actor but are not sure what properties are available, follow this pattern:

1. Call `ue_describe_object` on the actor path to list all properties and functions.
2. Identify the property you want (note: some properties live on sub-components, not the actor itself).
3. Call `ue_set_property` with the correct object path and property name.

This is the most common workflow in Game Dev MCP.

### Blueprints vs. actors

An **actor** is a single object placed in a level. A **Blueprint** is a reusable class definition that can be instantiated as many actors. If you need to create something once and place it many times (like a lamp, a chair, or a custom trigger), create a Blueprint with `ue_create_blueprint`, add components, compile it, then spawn instances with `ue_spawn_blueprint_actor`.

### The knowledge library

Game Dev MCP ships with 35 built-in tutorials covering UE5 topics from lighting to physics to Niagara particles. Your LLM can search them mid-conversation with `ue_knowledge_search`. This means the AI can look up how something works in UE5 without you having to explain it.

### Project knowledge

If you work on the same project across multiple sessions, use `ue_project_init` to create a `.game-dev-mcp/` folder that stores conventions and notes. The AI reads this context automatically on future sessions so it remembers your naming rules, level layouts, and design decisions.

## Common mistakes

### Forgetting to enable the Remote Control API

The most common setup issue. If `ue_ping` fails, go to **Edit > Plugins**, search for "Remote Control API", enable it, and restart the editor.

### Using stale actor paths

Actor paths change between sessions. Never copy an actor path from one session and use it in another. Always re-query with `ue_find_actors_by_name` or `ue_get_all_actors`.

### Setting properties on the wrong object

Light intensity is not on the actor -- it is on the `LightComponent` sub-object. Camera settings are on the `CameraComponent`. When a property set fails, use `ue_describe_object` to find which sub-object holds the property you want.

### Not saving

The LLM does not auto-save. If you make changes you want to keep, explicitly ask the AI to save the level or save all packages.

### Asking for too much at once

Start simple. "Spawn a light" works better than "build a fully furnished medieval tavern" as a first request. Build up incrementally and let the AI inspect its work between steps.

## Next steps

- Read the [Tools](/game-dev-mcp/handbook/tools/) page for the full list of all 44 tools with descriptions.
- Explore the [Knowledge Library](/game-dev-mcp/handbook/knowledge/) to see what UE5 topics your AI can reference.
- Check the [Reference](/game-dev-mcp/handbook/reference/) for configuration, error codes, and architecture details.
- Try building a simple room: ask the AI to spawn a floor, four walls, a ceiling, and a light. Then iterate from there.
