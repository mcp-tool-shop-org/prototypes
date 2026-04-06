---
name: spawn
description: Spawn an actor in Unreal Engine. Describe what you want (e.g. "a point light above the table") and the engine places it.
argument-hint: [what to spawn and where]
---

# Spawn Actor

Spawn the following in the UE5 level: **$ARGUMENTS**

## Instructions

1. Parse the user's description to determine:
   - **Actor class** (e.g. `PointLight`, `StaticMeshActor`, `CameraActor`)
   - **Location** (extract coordinates or relative position)
   - **Properties** to set (color, intensity, mesh, etc.)

2. Call `ue_spawn_actor` with the appropriate className and location

3. If additional properties are needed (color temperature, intensity, mesh asset, etc.), call `ue_set_property` on the spawned actor

4. Call `ue_focus_viewport` on the new actor so the user can see it

5. Report what was spawned, where, and any properties set

## Common Actor Classes

| Description | Class |
|------------|-------|
| Point light | `PointLight` |
| Spot light | `SpotLight` |
| Directional light | `DirectionalLight` |
| Static mesh / object | `StaticMeshActor` |
| Camera | `CameraActor` |
| Player start | `PlayerStart` |
| Fog | `ExponentialHeightFog` |
| Text | `TextRenderActor` |
| Trigger box | `TriggerBox` |

## Tips

- If the user says "above" something, query that actor's transform first with `ue_get_actor_transform`, then offset Y by +200
- If the user mentions a mesh by name, use `ue_search_assets` to find the asset path first
- Default location is `(0, 0, 0)` if no position is specified
