---
title: Tools
description: All 44 tools across 9 categories.
sidebar:
  order: 2
---

Game Dev MCP provides 44 tools organized into 9 categories. Every tool communicates with UE5 via the Remote Control API over localhost.

## Actors (9 tools)

Spawn, delete, duplicate, transform, list, find, and select actors in the level. Works with any actor class.

| Tool | What it does |
|------|-------------|
| `ue_spawn_actor` | Spawn an actor by class name at a location. Accepts optional `label`, `location`, and `rotation`. |
| `ue_delete_actor` | Delete an actor by its full object path. |
| `ue_duplicate_actor` | Duplicate an existing actor with an optional positional offset. |
| `ue_get_all_actors` | List all actors in the current level. Use `classFilter` to narrow results. |
| `ue_get_selected_actors` | Get the actors currently selected in the editor viewport. |
| `ue_select_actors` | Set editor selection to an array of actor paths. |
| `ue_set_actor_transform` | Set an actor's location, rotation, and/or scale in world space. |
| `ue_get_actor_transform` | Read an actor's current location, rotation, and scale. |
| `ue_find_actors_by_name` | Search actors by display name (case-insensitive partial match). |

Common actor classes: `StaticMeshActor`, `PointLight`, `SpotLight`, `DirectionalLight`, `RectLight`, `CameraActor`, `PlayerStart`, `ExponentialHeightFog`, `SkyLight`, `SkyAtmosphere`, `TriggerBox`, `TriggerSphere`, `BlockingVolume`, `DecalActor`, `TextRenderActor`.

## Properties (4 tools)

Read and write any UPROPERTY on any UObject. Use `ue_describe_object` to discover what is available before getting or setting values.

| Tool | What it does |
|------|-------------|
| `ue_get_property` | Read any UPROPERTY by object path and property name. |
| `ue_set_property` | Write any writable UPROPERTY. The value type must match. |
| `ue_describe_object` | Introspect a UObject to list all callable functions and properties. |
| `ue_batch_set_properties` | Set multiple properties across one or more objects in a single HTTP round-trip. |

Typical workflow: call `ue_describe_object` first to see what properties exist, then use `ue_get_property` / `ue_set_property` to read or change them.

## Assets (8 tools)

Search the content browser, list directories, check existence, duplicate, rename, delete, and save assets.

| Tool | What it does |
|------|-------------|
| `ue_search_assets` | Search the asset registry. Use `classFilter` and `pathFilter` to narrow results. |
| `ue_list_assets` | List all assets in a content directory, optionally recursive. |
| `ue_asset_exists` | Check whether an asset path exists. |
| `ue_duplicate_asset` | Duplicate an asset to a new path. |
| `ue_rename_asset` | Rename or move an asset. |
| `ue_delete_asset` | Delete an asset from the content browser. |
| `ue_save_asset` | Save a modified asset to disk (only saves if dirty). |
| `ue_get_asset_info` | Get metadata about an asset (class, path, package). |

Common asset class names for `classFilter`: `StaticMesh`, `Material`, `MaterialInstance`, `Texture2D`, `Blueprint`, `SoundWave`, `SkeletalMesh`, `AnimSequence`, `ParticleSystem`, `NiagaraSystem`.

## Levels (4 tools)

Save the current level, load a different one, get level info, or save all dirty packages at once.

| Tool | What it does |
|------|-------------|
| `ue_save_current_level` | Save the currently open level. |
| `ue_load_level` | Open a different level by asset path. |
| `ue_get_current_level` | Get the name of the currently loaded level. |
| `ue_save_all` | Save all dirty (modified) packages and assets at once. |

## Blueprints (5 tools)

Create Blueprint classes from scratch, add components, configure their properties, compile, and spawn instances.

| Tool | What it does |
|------|-------------|
| `ue_create_blueprint` | Create a new Blueprint class with a parent class and content path. |
| `ue_add_component` | Add a component to a Blueprint (e.g., `StaticMeshComponent`, `PointLightComponent`). |
| `ue_set_component_property` | Set a property on a specific component within a Blueprint. |
| `ue_compile_blueprint` | Compile a Blueprint to check for errors and update live instances. |
| `ue_spawn_blueprint_actor` | Spawn an instance of a Blueprint in the current level. |

Common parent classes: `Actor`, `Pawn`, `Character`, `GameModeBase`, `PlayerController`, `HUD`, `ActorComponent`, `SceneComponent`.

## Editor (4 tools)

Test the connection, run console commands, get engine info, and snap the viewport to any actor.

| Tool | What it does |
|------|-------------|
| `ue_ping` | Test the connection to UE5. Returns true if the editor is reachable. |
| `ue_execute_console_command` | Run any UE console command (e.g., `stat fps`, `show collision`). |
| `ue_get_engine_info` | Get engine version and available Remote Control API routes. |
| `ue_focus_viewport` | Select an actor and snap the editor camera to look at it. |

## Knowledge (1 tool)

Search 35 built-in UE5 tutorials on demand. Your LLM reads them mid-conversation so it does not have to guess how Nanite, Behavior Trees, or material instances work.

| Tool | What it does |
|------|-------------|
| `ue_knowledge_search` | Full-text search across the tutorial library. Accepts optional `category` and `maxResults`. |

All 35 articles are also exposed as MCP resources at `unreal://knowledge/{category}/{slug}`, so clients that support resource reading can fetch them directly.

## Project (7 tools)

Store project-specific conventions, notes, and context in `.game-dev-mcp/` that persists across sessions.

| Tool | What it does |
|------|-------------|
| `ue_project_init` | Initialize project knowledge (name, UE version, description). Creates the `.game-dev-mcp/` folder. |
| `ue_project_info` | Read current project metadata and conventions. |
| `ue_project_add_note` | Add a knowledge note with optional tags. Supports Markdown. |
| `ue_project_search_notes` | Search notes by keyword. |
| `ue_project_list_notes` | List all notes, optionally filtered by tag. |
| `ue_project_delete_note` | Delete a note by its ID. |
| `ue_project_set_convention` | Store a naming rule or folder convention the LLM should follow. |

## Mission (2 tools)

Log progress and generate structured summaries during multi-step operations.

| Tool | What it does |
|------|-------------|
| `ue_mission_log` | Log a progress update, observation, or warning. Accepts `priority` (low/med/high) and optional `tags`. |
| `ue_mission_summary` | Generate a structured summary with per-step status (done/skipped/failed) and optional notes. |

These tools write to stderr by default. If [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) is connected, the LLM can push async notifications to you while it works.
