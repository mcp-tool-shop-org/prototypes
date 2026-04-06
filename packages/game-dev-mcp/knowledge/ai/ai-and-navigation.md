---
title: "AI and Navigation"
category: ai
tags: [ai, navigation, navmesh, behavior-tree, perception, pathfinding]
difficulty: intermediate
summary: "Setting up AI navigation, behavior trees, and perception systems in UE5."
ueVersion: "5.4+"
---

## Navigation Mesh (NavMesh)

NavMesh defines walkable areas for AI pathfinding.

### Add a NavMesh Bounds Volume
```
ue_spawn_actor(className: "NavMeshBoundsVolume", location: {x: 0, y: 0, z: 0}, label: "NavBounds")
```

Scale it to cover your level:
```
ue_set_actor_transform(actorPath: "<navmesh_path>", scale: {x: 50, y: 50, z: 5})
```

### Visualize NavMesh
```
ue_execute_console_command(command: "show Navigation")
```

Green areas = walkable, red = blocked.

### Rebuild NavMesh
```
ue_execute_console_command(command: "RebuildNavigation")
```

## AI Controllers

AI Controllers drive Pawn behavior. Every AI-controlled Pawn needs an AI Controller class assigned.

Key subsystems:
- **Behavior Tree** — decision-making logic
- **Blackboard** — shared memory for the AI
- **EQS (Environment Query System)** — spatial reasoning

## Behavior Trees

Behavior Trees define AI decision flow:
- **Selector** — tries children until one succeeds
- **Sequence** — runs children in order, fails if any fails
- **Tasks** — leaf nodes that do work (MoveTo, Wait, Attack)
- **Decorators** — conditions on nodes
- **Services** — periodic updates (check player distance)

Find behavior tree assets:
```
ue_search_assets(query: "BT_", classFilter: ["BehaviorTree"])
```

## Perception System

The AI Perception component gives AI senses:

| Sense | Description |
|-------|-------------|
| Sight | Detects actors in a cone (configurable angle/range) |
| Hearing | Detects noise events |
| Damage | Reacts to taking damage |
| Touch | Detects physical contact |

## Useful Console Commands

```
ue_execute_console_command(command: "ai.debug.nav 1")     # NavMesh debug
ue_execute_console_command(command: "ai.debug.perception") # Perception debug
```
