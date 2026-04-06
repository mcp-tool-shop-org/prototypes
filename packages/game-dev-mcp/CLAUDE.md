# game-dev-mcp

MCP server giving Claude control over game engines. Currently supports **Unreal Engine 5** via the built-in Remote Control API.

## Connection

The server connects to UE5's Remote Control API at `127.0.0.1:30010` (default). The editor must be running with the Remote Control API plugin enabled. Always start with `ue_ping` to verify the connection.

## Tools (44 total)

### Actors (9)
| Tool | Purpose |
|------|---------|
| `ue_spawn_actor` | Spawn an actor by class name at a location |
| `ue_delete_actor` | Delete an actor by path |
| `ue_duplicate_actor` | Duplicate an actor with optional offset |
| `ue_get_all_actors` | List all actors in the level (use classFilter to narrow) |
| `ue_get_selected_actors` | Get currently selected actors in the editor |
| `ue_select_actors` | Select actors by path array |
| `ue_set_actor_transform` | Set location, rotation, and/or scale |
| `ue_get_actor_transform` | Read an actor's current transform |
| `ue_find_actors_by_name` | Search actors by name pattern |

### Properties (4)
| Tool | Purpose |
|------|---------|
| `ue_get_property` | Read any UPROPERTY on any UObject |
| `ue_set_property` | Write any UPROPERTY on any UObject |
| `ue_describe_object` | Introspect an object to discover properties and functions |
| `ue_batch_set_properties` | Set multiple properties in one HTTP round-trip |

### Assets (8)
| Tool | Purpose |
|------|---------|
| `ue_search_assets` | Search the content browser (use classFilter + pathFilter) |
| `ue_list_assets` | List assets in a directory |
| `ue_asset_exists` | Check if an asset path exists |
| `ue_duplicate_asset` | Duplicate an asset to a new path |
| `ue_rename_asset` | Rename/move an asset |
| `ue_delete_asset` | Delete an asset |
| `ue_save_asset` | Save a specific asset |
| `ue_get_asset_info` | Get detailed asset metadata |

### Levels (4)
| Tool | Purpose |
|------|---------|
| `ue_save_current_level` | Save the active level |
| `ue_load_level` | Load a different level by path |
| `ue_get_current_level` | Get info about the current level |
| `ue_save_all` | Save all dirty packages at once |

### Blueprints (5)
| Tool | Purpose |
|------|---------|
| `ue_create_blueprint` | Create a new Blueprint class |
| `ue_add_component` | Add a component to a Blueprint |
| `ue_set_component_property` | Set a property on a Blueprint component |
| `ue_compile_blueprint` | Compile a Blueprint |
| `ue_spawn_blueprint_actor` | Spawn an instance of a Blueprint |

### Editor (4)
| Tool | Purpose |
|------|---------|
| `ue_ping` | Test connection to UE5 |
| `ue_execute_console_command` | Run a UE console command |
| `ue_get_engine_info` | Get engine version and available routes |
| `ue_focus_viewport` | Snap the viewport camera to an actor |

### Knowledge (1)
| Tool | Purpose |
|------|---------|
| `ue_knowledge_search` | Search 35 built-in UE5 tutorials on demand |

### Project (7)
| Tool | Purpose |
|------|---------|
| `ue_project_init` | Initialize project context (name, UE version) |
| `ue_project_info` | Read current project context |
| `ue_project_add_note` | Add a project knowledge note |
| `ue_project_search_notes` | Search project notes |
| `ue_project_list_notes` | List all notes (optional tag filter) |
| `ue_project_delete_note` | Delete a note by ID |
| `ue_project_set_convention` | Store a project convention |

### Mission (2)
| Tool | Purpose |
|------|---------|
| `ue_mission_start` | Start tracking a multi-step operation |
| `ue_mission_update` | Update progress on the current mission |

## Common Patterns

**Spawn + configure:** `ue_spawn_actor` → `ue_set_property` to set color, intensity, etc.

**Discover then set:** `ue_describe_object` to see available properties → `ue_set_property` to change them.

**Batch operations:** Use `ue_batch_set_properties` instead of multiple `ue_set_property` calls for speed.

**Actor paths change between sessions.** Always re-query with `ue_get_all_actors` or `ue_find_actors_by_name` instead of hardcoding paths.

**Search efficiently:** Always provide `classFilter` and `pathFilter` with `ue_search_assets` to avoid slow full-project scans.

**Save strategically:** Use `ue_save_asset` or `ue_save_current_level` for incremental work. `ue_save_all` saves everything.

## UE5 Actor Classes (Common)

- `PointLight`, `SpotLight`, `DirectionalLight`, `RectLight`
- `StaticMeshActor`, `CameraActor`, `PlayerStart`
- `ExponentialHeightFog`, `SkyLight`, `SkyAtmosphere`
- `TriggerBox`, `TriggerSphere`, `BlockingVolume`
- `DecalActor`, `TextRenderActor`

## Knowledge Library

Use `ue_knowledge_search` to look up UE5 concepts mid-conversation. 35 articles covering: actors, assets, blueprints, materials, lighting, physics, audio, animation, VFX, rendering (Nanite/Lumen), AI/navigation, cinematics, and more.
