# The game-dev-mcp Handbook

A practical guide to giving your AI full control over your game engine.

---

## What is this thing?

You know that moment when you're working in Unreal Engine and you think, "I wish I could just *tell* someone to set up this lighting" or "place 50 chairs in a grid" or "build me a room with four walls and a warm light"?

That's what game-dev-mcp does. It connects any LLM — Claude, GPT, a local model, whatever you use — directly to the Unreal Editor. Your AI can spawn actors, move things around, search assets, create Blueprints, tweak properties, and save your work. All through natural conversation.

No custom C++ plugin. No compiling anything inside the engine. Just the Remote Control API that already ships with UE5, and a TypeScript server that speaks MCP.

## How it works (the 30-second version)

```
You talk to your LLM
    ↕ MCP protocol (stdio)
game-dev-mcp (TypeScript server)
    ↕ HTTP requests (port 30010)
Unreal Engine 5 Editor
```

Your LLM calls tools like `ue_spawn_actor` or `ue_set_property`. Those turn into HTTP calls to the Remote Control API running inside UE5. The engine does the work, sends back results, and your LLM reports what happened.

The LLM never touches your filesystem or modifies engine code. Everything goes through the same HTTP API that Epic built for remote production workflows.

## Getting set up

This takes about five minutes.

### Step 1: Enable Remote Control in UE5

Open your project in Unreal Engine (5.4 or later), then:

1. **Edit > Plugins**
2. Search for **Remote Control API**
3. Check **Enabled**
4. Restart the editor when it asks

That's the only engine-side setup. The plugin is already installed — you're just flipping it on.

Want to double-check it's running? Open a browser and visit `http://127.0.0.1:30010/remote/info`. You should see a JSON blob with route info. If you do, the API is live.

### Step 2: Install game-dev-mcp

```bash
npm install -g @mcptoolshop/game-dev-mcp
```

Or skip the global install and use npx — it'll download on first run:

```bash
npx @mcptoolshop/game-dev-mcp
```

### Step 3: Tell your MCP client about it

**Claude Desktop** — open your `claude_desktop_config.json` and add:

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

**Claude Code** — add to your `.mcp.json` or settings:

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

Other MCP clients follow the same pattern — point them at the `npx` command.

### Step 4: Say hello

Open your LLM and say: **"Ping Unreal Engine."**

It'll call `ue_ping` behind the scenes. If you see something like `connected: true` with engine version info, you're in business.

## Your first conversation

Here's a real example of what working with game-dev-mcp feels like:

> **You:** Spawn a cube at the origin and call it "TestCube"

The LLM calls `ue_spawn_actor` with `className: "StaticMeshActor"`, `location: {x:0, y:0, z:0}`, `label: "TestCube"`. You see the actor appear in your viewport.

> **You:** Move it up 200 units

It calls `ue_set_actor_transform` and bumps the Z to 200. The cube jumps up in the viewport.

> **You:** What properties does it have?

It calls `ue_describe_object` and gets back every UPROPERTY and callable function on that actor. Then it summarizes them for you in plain language.

> **You:** Delete it and save the level

Two calls: `ue_delete_actor`, then `ue_save_current_level`. Done.

That's the basic loop. Spawn, inspect, modify, clean up. But things get much more interesting when you go beyond one actor at a time.

## What your AI can actually do

### Work with actors (9 tools)

Actors are the objects in your level — meshes, lights, cameras, volumes, everything.

- **Spawn** any actor class at any position, with an optional label
- **Delete** actors by path
- **Duplicate** an existing actor (with an optional offset — great for repeating patterns)
- **Move, rotate, and scale** actors freely
- **List** all actors in the level, optionally filtered by class
- **Find** actors by name pattern
- **Select** actors in the editor (handy for visual confirmation)

Common actor classes you'll use a lot:
| Class | What it is |
|-------|-----------|
| `StaticMeshActor` | Any static mesh (cube, chair, wall) |
| `PointLight` | Omnidirectional light |
| `SpotLight` | Cone light |
| `DirectionalLight` | Sun-like light |
| `CameraActor` | A camera |
| `CineCameraActor` | Cinematic camera with lens settings |
| `SkyLight` | Ambient sky lighting |
| `ExponentialHeightFog` | Atmospheric fog |
| `PlayerStart` | Where the player spawns |

### Read and write properties (4 tools)

Every UObject in Unreal has properties (UPROPERTYs). game-dev-mcp lets your AI read and write them directly.

- **Get** any property value by name
- **Set** any writable property
- **Describe** an object to discover all its properties and callable functions
- **Batch set** multiple properties in one call

This is incredibly powerful. Want to change a light's intensity? Set a mesh's material? Adjust a camera's focal length? It's all property access.

```
ue_set_property(
  objectPath: "<your_light>.LightComponent0",
  propertyName: "Intensity",
  value: 50000
)
```

The `ue_describe_object` tool is your best friend here. When you're not sure what properties exist on something, describe it first.

### Manage assets (8 tools)

Assets are the files in your Content Browser — meshes, textures, materials, Blueprints.

- **Search** the asset registry by name, filtered by class and path
- **List** contents of a directory
- **Check** if an asset exists
- **Duplicate**, **rename**, or **delete** assets
- **Save** individual assets
- **Get info** about an asset (class, path, package)

Searching is how you find things to work with:

```
ue_search_assets(query: "chair", classFilter: ["StaticMesh"])
```

This returns asset paths you can then use to assign meshes to actors.

### Level management (4 tools)

- **Save** the current level
- **Load** a different level
- **Get** info about the current level
- **Save all** dirty packages at once

Always save after you've made changes you want to keep. The LLM doesn't auto-save.

### Blueprint creation (5 tools)

This is where things get really interesting. Your AI can create Blueprint classes from scratch:

1. **Create** a new Blueprint with a parent class
2. **Add components** to it (meshes, lights, collision, anything)
3. **Set properties** on those components
4. **Compile** it
5. **Spawn** instances of it in the level

Example conversation:

> **You:** Create a Blueprint called "BP_Lamp" based on Actor. Add a cylinder mesh for the pole, a sphere mesh for the bulb, and a point light. Make the light warm and bright.

The AI would create the Blueprint, add three components, set their relative transforms and properties, compile it, and spawn one for you to see. All through conversation.

### Editor utilities (4 tools)

- **Ping** — test the connection
- **Console command** — run any UE console command
- **Engine info** — get version, platform, project details
- **Focus viewport** — snap the editor camera to look at a specific actor

The console command tool is an escape hatch for anything not covered by the other tools. If there's a console command for it, you can run it.

## The knowledge library

Here's something that sets game-dev-mcp apart: it ships with 35 tutorials that your LLM can read on demand.

When your AI needs to remember how Nanite works, or what the lighting workflow looks like, or how to set up physics collisions — it doesn't have to guess. It can search the knowledge library and read the relevant article right then.

The library covers:

| Category | Topics |
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
| **Animation** | Skeletal mesh, AnimBP, montages, blending |
| **Visual Effects** | Niagara particles, beams, GPU sim |
| **Rendering** | Nanite, Lumen, virtual shadow maps |
| **AI & Navigation** | NavMesh, behavior trees, EQS |
| **Cinematics** | Sequencer, cameras, film rendering |
| **Virtual Assistant** | MetaHuman assistants, LLM integration |
| **API Reference** | Remote Control API, editor subsystems |
| **Patterns** | Common workflows, error handling, performance |

Your AI can search these with `ue_knowledge_search`. It's like giving it a UE5 cheat sheet it can reference mid-conversation.

All articles are also available as MCP resources at `unreal://knowledge/{category}/{slug}`, so your LLM can read the full text of any tutorial.

## Project knowledge

Different projects have different conventions. Maybe your team uses the `BP_` prefix for Blueprints. Maybe your main character is always at a specific location. Maybe you've figured out that your project needs lights at a certain intensity range to look right.

Project knowledge lets you store this context:

```
ue_project_init(name: "Medieval RPG", ueVersion: "5.4", description: "Fantasy action RPG")
ue_project_set_convention(convention: "All Blueprint classes use BP_ prefix")
ue_project_set_convention(convention: "Ground level is Z=0, player height is Z=90")
ue_project_add_note(
  title: "Tavern Layout",
  content: "Main room is 2000x1500 cm. Bar along north wall. Fireplace on east wall.",
  tags: ["level-design", "tavern"]
)
```

This persists in a `.game-dev-mcp/` folder in your working directory. Next time you start a conversation, the AI can read your project context and pick up where you left off.

Search your notes later:

```
ue_project_search_notes(query: "tavern")
```

## Mission tracking

When your AI is doing something complex — "build me a room with furniture and lighting" — that's a multi-step operation. game-dev-mcp includes mission tools so the AI can track its own progress:

- `ue_mission_log` — log a progress update, observation, or warning
- `ue_mission_summary` — generate a structured summary of what was done

These are designed to work alongside [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) for real-time notifications, but they work standalone too. The AI logs to stderr, and if mcp-aside is connected, it can push async notifications to you while it works.

This matters because a "build a room" task might involve 10+ tool calls. Without mission tracking, you're staring at a stream of JSON. With it, you get structured progress: "Floor done (1/6)", "Wall north done (2/6)", "Adding warm point light — room was too dark".

## Practical patterns

### Building a room

This is the "hello world" of level design with game-dev-mcp:

> **You:** Build me a simple room — floor, four walls, ceiling, and a warm light inside.

The AI will:
1. Spawn a floor (scaled cube)
2. Spawn four walls (tall, thin cubes at the edges)
3. Spawn a ceiling
4. Add a point light in the center
5. Set the light color to warm white
6. Save the level

### Setting up outdoor lighting

> **You:** Set up a basic outdoor environment with sun, sky, and fog.

The AI spawns a DirectionalLight (angled like a sun), SkyLight, SkyAtmosphere, ExponentialHeightFog, and PostProcessVolume. Five actors, and your scene goes from black void to a convincing outdoor environment.

### Creating reusable Blueprints

> **You:** Create a Blueprint called BP_StreetLamp with a tall cylinder mesh, a sphere on top, and a point light that's slightly warm.

The AI creates the Blueprint, adds and configures three components with relative transforms, compiles it, and spawns one so you can see it. Then you can say "spawn 10 of those along the road" and it'll duplicate them with proper spacing.

### Finding and using existing assets

> **You:** What chair meshes are available in the project?

The AI searches the asset registry for chair-related StaticMesh assets and lists what it finds. You pick one, and it assigns that mesh to actors in the level.

### Batch operations

> **You:** Make all the point lights in the scene 50% brighter.

The AI lists all PointLight actors, reads their current intensity, calculates the new values, and batch-sets them. One conversation turn, dozens of property changes.

## Configuration

Everything works out of the box with defaults, but you can customize via environment variables:

| Variable | Default | What it does |
|----------|---------|-------------|
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Where the UE5 editor is running |
| `GAMEDEV_MCP_PORT` | `30010` | Remote Control API port |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | How long to wait for a response (ms) |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Logging verbosity (error/warn/info/debug) |

If UE5 is running on another machine on your network, set `GAMEDEV_MCP_HOST` to that machine's IP. The Remote Control API works over the network — it's just HTTP.

To set env vars with your MCP client:

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"],
      "env": {
        "GAMEDEV_MCP_PORT": "30020",
        "GAMEDEV_MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Troubleshooting

### "Cannot connect to Unreal Engine"

The most common issue. Check these in order:

1. **Is UE5 actually running?** The editor has to be open with a project loaded.
2. **Is the Remote Control API plugin enabled?** Edit > Plugins > search "Remote Control API".
3. **Did you restart the editor** after enabling it? It won't start the HTTP server until you do.
4. **Is port 30010 available?** Try `http://127.0.0.1:30010/remote/info` in a browser. If you get a JSON response, the API is fine and the problem is on the MCP side.
5. **Firewall?** Some firewalls block localhost connections. Unlikely but possible.

### "Actor path not found"

Actor paths change when you restart the editor or reload the level. If you saved a path from a previous session, it's probably stale. Use `ue_find_actors_by_name` or `ue_get_all_actors` to get fresh paths.

### "Property not found"

Use `ue_describe_object` to see the actual property names. UE5 property names are case-sensitive and sometimes surprising (e.g., the intensity of a light is on the LightComponent, not the actor itself).

### Things are slow

The Remote Control API is synchronous per request. If you're doing 50 operations in a row, it'll take a few seconds. For bulk work, the AI should use `ue_batch_set_properties` where possible. And be patient — spawning 100 actors takes real time.

### Blueprint compile errors

If `ue_compile_blueprint` reports errors, it usually means a component property was set to an invalid value, or the parent class doesn't support the component you tried to add. Use `ue_describe_object` on the Blueprint to see what went wrong.

## Tips for getting the best results

### Be specific about what you want

"Make it look good" is hard for an AI to act on. "Add a warm point light at 5000 lux intensity, 3200K color temperature, positioned 2 meters above the table" gives it everything it needs.

### Let it explore first

For complex tasks, it helps to let the AI inspect the scene before making changes. "What actors are in the level?" and "What meshes are available in the project?" give it context to make better decisions.

### Save often

Ask the AI to save after major changes. If something goes wrong, you can undo in the editor — but only if you haven't overwritten your save.

### Use project knowledge

If you're working on something for more than one session, set up project knowledge. Store your conventions, your level layout notes, your naming patterns. The AI will use them on future runs.

### Start simple, build up

Don't ask for a fully furnished medieval tavern on your first try. Start with "build a room", then "add furniture", then "set up lighting", then "add materials". Each step gives the AI (and you) a chance to course-correct.

## The tool reference

For quick reference, here's every tool organized by category.

### Actors
| Tool | What it does |
|------|-------------|
| `ue_spawn_actor` | Place a new actor in the level |
| `ue_delete_actor` | Remove an actor |
| `ue_duplicate_actor` | Copy an actor with optional offset |
| `ue_get_all_actors` | List all actors (with optional class filter) |
| `ue_get_selected_actors` | Get currently selected actors |
| `ue_select_actors` | Select specific actors in the editor |
| `ue_set_actor_transform` | Move, rotate, or scale an actor |
| `ue_get_actor_transform` | Read an actor's position, rotation, scale |
| `ue_find_actors_by_name` | Search actors by name pattern |

### Properties
| Tool | What it does |
|------|-------------|
| `ue_get_property` | Read any UPROPERTY value |
| `ue_set_property` | Write any writable UPROPERTY |
| `ue_describe_object` | List all properties and functions on an object |
| `ue_batch_set_properties` | Set multiple properties in one call |

### Assets
| Tool | What it does |
|------|-------------|
| `ue_search_assets` | Search the asset registry |
| `ue_list_assets` | List a content directory |
| `ue_asset_exists` | Check if an asset path exists |
| `ue_duplicate_asset` | Copy an asset |
| `ue_rename_asset` | Rename/move an asset |
| `ue_delete_asset` | Delete an asset |
| `ue_save_asset` | Save a single asset |
| `ue_get_asset_info` | Get asset metadata |

### Levels
| Tool | What it does |
|------|-------------|
| `ue_save_current_level` | Save the active level |
| `ue_load_level` | Open a different level |
| `ue_get_current_level` | Get current level info |
| `ue_save_all` | Save all unsaved packages |

### Blueprints
| Tool | What it does |
|------|-------------|
| `ue_create_blueprint` | Create a new Blueprint class |
| `ue_add_component` | Add a component to a Blueprint |
| `ue_set_component_property` | Configure a component's properties |
| `ue_compile_blueprint` | Compile a Blueprint |
| `ue_spawn_blueprint_actor` | Spawn an instance of a Blueprint |

### Editor
| Tool | What it does |
|------|-------------|
| `ue_ping` | Test the connection |
| `ue_execute_console_command` | Run a UE console command |
| `ue_get_engine_info` | Get engine version and project info |
| `ue_focus_viewport` | Point the editor camera at an actor |

### Knowledge
| Tool | What it does |
|------|-------------|
| `ue_knowledge_search` | Search the built-in tutorial library |

### Project
| Tool | What it does |
|------|-------------|
| `ue_project_init` | Initialize project knowledge |
| `ue_project_info` | Get project info |
| `ue_project_add_note` | Add a knowledge note |
| `ue_project_search_notes` | Search notes |
| `ue_project_list_notes` | List all notes |
| `ue_project_delete_note` | Remove a note |
| `ue_project_set_convention` | Add a project convention |

### Mission
| Tool | What it does |
|------|-------------|
| `ue_mission_log` | Log progress during multi-step operations |
| `ue_mission_summary` | Summarize a completed mission |

**44 tools total.**

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/). MIT License.
