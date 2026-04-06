<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

Currently supports **Unreal Engine 5** via the built-in Remote Control API. No third-party plugins. No C++ compilation. Just enable the API and start talking.

## What does it feel like?

> **You:** Spawn a point light above the table and make it warm

The LLM calls `ue_spawn_actor`, sets the transform, adjusts the color temperature via `ue_set_property` — and the light appears in your viewport. You keep talking, it keeps building.

## Quick Start

### 1. Enable the Remote Control API in UE5

1. Open your UE5 project (5.4+)
2. **Edit > Plugins** → search "Remote Control API" → Enable
3. Restart the editor

This plugin already ships with UE5 — you're just turning it on.

### 2. Install and configure

```bash
npx @mcptoolshop/game-dev-mcp
```

Add to your MCP client config (e.g. Claude Desktop's `claude_desktop_config.json`):

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

### 3. Test

Ask your LLM: **"Ping Unreal Engine"** — it calls `ue_ping` and confirms the connection.

## What Can It Do?

### Actors (9 tools)
Spawn, delete, duplicate, transform, list, find, and select actors in the level. Works with any actor class — meshes, lights, cameras, volumes.

### Properties (4 tools)
Read and write any UPROPERTY on any UObject. Use `ue_describe_object` to discover what's available, then get or set exactly what you need.

### Assets (8 tools)
Search the content browser, list directories, check existence, duplicate, rename, delete, and save assets.

### Levels (4 tools)
Save the current level, load a different one, get level info, or save all dirty packages at once.

### Blueprints (5 tools)
Create Blueprint classes from scratch, add components, configure their properties, compile, and spawn instances — all through conversation.

### Editor (4 tools)
Test the connection, run console commands, get engine info, and snap the viewport to any actor.

### Knowledge (1 tool)
Search 35 built-in UE5 tutorials on demand — so your LLM can look up how Nanite works, or what a Behavior Tree is, mid-conversation.

### Project (7 tools)
Store project-specific conventions, notes, and context in `.game-dev-mcp/` that persists across sessions.

### Mission (2 tools)
Log progress and generate structured summaries during multi-step operations. `ue_mission_log` pushes observations at low/med/high priority with optional tags. `ue_mission_summary` produces a step-by-step recap after a build session.

**Total: 44 tools**

## Knowledge Library

The server bundles 35 tutorials as MCP resources. Your LLM reads them on demand — no context wasted until it actually needs the info:

| Category | Covers |
|----------|--------|
| **Getting Started** | Setup, first commands, project structure |
| **Actors** | Spawning, transforms, type reference, components |
| **Assets** | Content browser, search patterns, importing |
| **Blueprints** | Basics, creation, component configuration |
| **Levels** | Management, world composition |
| **Materials** | Basics, material instances |
| **Lighting** | Light types, workflow |
| **Physics** | Simulation, collisions, constraints |
| **Audio** | Sound cues, attenuation, spatial audio |
| **Animation** | Skeletal mesh, AnimBP, montages |
| **Visual Effects** | Niagara particles, GPU sim |
| **Rendering** | Nanite, Lumen, virtual shadow maps |
| **AI & Navigation** | NavMesh, behavior trees, EQS |
| **Cinematics** | Sequencer, cameras, film rendering |
| **Virtual Assistant** | MetaHuman assistants, LLM integration |
| **API Reference** | Remote Control API, subsystem reference |
| **Patterns** | Common workflows, error handling, performance |

## Project Knowledge

Your LLM can store and recall project-specific context:

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

Stored in `.game-dev-mcp/` — persists across sessions so the AI picks up where you left off.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Game engine editor hostname |
| `GAMEDEV_MCP_PORT` | `30010` | Remote API port |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Request timeout (ms) |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Log level (error/warn/info/debug) |

## Requirements

- Node.js 18+
- Unreal Engine 5.4+ with Remote Control API plugin enabled

## Handbook

For the full walkthrough — setup, practical patterns, troubleshooting, and every tool explained — read the **[Handbook](HANDBOOK.md)**.

## Security & Data Scope

Game Dev MCP is an MCP server bridging LLMs to game engine editors.

- **Data accessed:** Game engine Remote Control API responses (localhost only), level/actor/property data
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No authentication
- **Permissions:** Localhost network only (127.0.0.1 by default). No file system access beyond standard Node.js

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

MIT — Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
