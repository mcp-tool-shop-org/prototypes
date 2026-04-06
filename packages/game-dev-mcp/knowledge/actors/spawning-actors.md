---
title: "Spawning Actors"
category: actors
tags: [spawn, actor, placement, creation]
difficulty: beginner
summary: "How to spawn different actor types and place them in your level using ue_spawn_actor."
ueVersion: "5.4+"
---

## Basic Spawn

```
ue_spawn_actor(className: "StaticMeshActor", location: {x: 0, y: 0, z: 0})
```

The `className` parameter accepts either:
- Short name: `"StaticMeshActor"` (auto-prefixed with `/Script/Engine.`)
- Full path: `"/Script/Engine.StaticMeshActor"`

## Common Actor Classes

### Geometry & Meshes
- `StaticMeshActor` — a renderable mesh
- `BlockingVolume` — invisible collision

### Lights
- `PointLight` — omnidirectional light source
- `SpotLight` — cone-shaped directional light
- `DirectionalLight` — parallel rays (sun)
- `RectLight` — rectangular area light
- `SkyLight` — ambient light from sky

### Cameras & Gameplay
- `CameraActor` — viewpoint camera
- `PlayerStart` — player spawn point
- `TriggerBox` — overlap trigger volume
- `TriggerSphere` — spherical trigger
- `TargetPoint` — generic marker

### Environment
- `ExponentialHeightFog` — atmospheric fog
- `SkyAtmosphere` — sky rendering
- `VolumetricCloud` — cloud system
- `PostProcessVolume` — post-processing effects

## Spawning with Transform

```
ue_spawn_actor(
  className: "PointLight",
  location: {x: 0, y: 0, z: 300},
  rotation: {pitch: 0, yaw: 45, roll: 0},
  label: "MainLight"
)
```

## Spawning Blueprint Actors

Use `ue_spawn_blueprint_actor` for Blueprint classes:

```
ue_spawn_blueprint_actor(
  blueprintPath: "/Game/Blueprints/BP_Door",
  location: {x: 100, y: 0, z: 0}
)
```

## After Spawning

The spawn result includes the actor's object path. Save this path to:
- Set properties with `ue_set_property`
- Read the transform with `ue_get_actor_transform`
- Modify the transform with `ue_set_actor_transform`
- Delete with `ue_delete_actor`
