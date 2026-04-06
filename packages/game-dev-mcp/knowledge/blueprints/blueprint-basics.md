---
title: "Blueprint Basics"
category: blueprints
tags: [blueprint, class, hierarchy, basics]
difficulty: beginner
summary: "What Blueprints are and how they fit into UE5's class system."
ueVersion: "5.4+"
---

## What Are Blueprints?

Blueprints are UE5's visual scripting system and class creation tool. A Blueprint is a class defined in the editor (not in C++) that can contain:

- **Components** — meshes, lights, audio, collision
- **Variables** — data the Blueprint holds
- **Event Graph** — visual logic (not accessible via Remote Control)
- **Construction Script** — setup logic that runs in-editor

## Class Hierarchy

All Blueprints inherit from a parent class:

```
UObject
  └── AActor                    ← most common parent
      ├── APawn                 ← controllable actor
      │   └── ACharacter        ← humanoid pawn with movement
      ├── AGameModeBase         ← game rules
      └── APlayerController     ← player input handling
```

## Common Parent Classes

| Parent | Use Case |
|--------|----------|
| `Actor` | Generic placed object (doors, pickups, traps) |
| `Pawn` | Controllable entity (vehicles, turrets) |
| `Character` | Humanoid with CharacterMovementComponent |
| `GameModeBase` | Game rules and state |
| `PlayerController` | Input and HUD management |
| `ActorComponent` | Reusable behavior (attach to any actor) |
| `SceneComponent` | Component with a transform |

## Creating a Blueprint via MCP

```
ue_create_blueprint(name: "BP_Door", parentClass: "Actor", path: "/Game/Blueprints")
```

Then add components:
```
ue_add_component(
  blueprintPath: "/Game/Blueprints/BP_Door",
  componentClass: "StaticMeshComponent",
  componentName: "DoorMesh"
)
```

## Blueprint Naming

Convention: prefix with `BP_`
- `BP_Door` — a door Blueprint
- `BP_Pickup_Health` — a health pickup
- `BP_Enemy_Spider` — an enemy type
