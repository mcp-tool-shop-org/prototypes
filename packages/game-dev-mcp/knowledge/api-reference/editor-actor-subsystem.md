---
title: "EditorActorSubsystem Reference"
category: api-reference
tags: [api, actors, subsystem, spawn, delete, reference]
difficulty: advanced
summary: "Complete function reference for the EditorActorSubsystem — the primary actor management API."
ueVersion: "5.4+"
---

## Object Path

```
/Script/UnrealEd.Default__EditorActorSubsystem
```

## Functions

### SpawnActorFromClass
Spawn an actor from a class.

Parameters:
- `ActorClass` (string) — Class path (e.g., `/Script/Engine.StaticMeshActor`)
- `Location` (Vector) — `{X, Y, Z}` world position
- `Rotation` (Rotator) — `{Pitch, Yaw, Roll}` optional

Returns: Actor object path (string)

### DestroyActor
Delete an actor from the level.

Parameters:
- `ActorToDestroy` (string) — Actor object path

### DuplicateActor
Create a copy of an existing actor.

Parameters:
- `ActorToDuplicate` (string) — Source actor path

Returns: New actor object path

### GetAllLevelActors
Get all actors in the current level.

Returns: Array of actor object paths

### GetSelectedLevelActors
Get currently selected actors in the editor.

Returns: Array of selected actor object paths

### ClearActorSelectionSet
Deselect all actors.

### SetActorSelectionState
Select or deselect a specific actor.

Parameters:
- `Actor` (string) — Actor path
- `bShouldBeSelected` (boolean) — true to select, false to deselect

### SelectNothing
Alternative to ClearActorSelectionSet.

## Usage via game-dev-mcp

These functions are wrapped by the `ue_spawn_actor`, `ue_delete_actor`, `ue_duplicate_actor`, `ue_get_all_actors`, `ue_get_selected_actors`, and `ue_select_actors` tools.

For direct access:
```
ue_describe_object(objectPath: "/Script/UnrealEd.Default__EditorActorSubsystem")
```
