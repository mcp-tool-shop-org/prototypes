---
title: "Common Workflows"
category: patterns
tags: [workflow, patterns, room, landscape, setup]
difficulty: intermediate
summary: "Step-by-step patterns for common level design tasks."
ueVersion: "5.4+"
---

## Build a Room

1. **Floor** — spawn a cube, scale to flat plane
```
ue_spawn_actor(className: "StaticMeshActor", location: {x:0, y:0, z:0}, label: "Floor")
# Set mesh to cube, scale to {x:5, y:5, z:0.1}
```

2. **Walls** — 4 cubes positioned at edges
```
ue_spawn_actor(className: "StaticMeshActor", location: {x:250, y:0, z:150}, label: "Wall_North")
# Scale to {x:0.1, y:5, z:3}
```

3. **Ceiling** — another flat cube on top
```
ue_spawn_actor(className: "StaticMeshActor", location: {x:0, y:0, z:300}, label: "Ceiling")
# Scale to {x:5, y:5, z:0.1}
```

4. **Light** — point light inside
```
ue_spawn_actor(className: "PointLight", location: {x:0, y:0, z:250}, label: "RoomLight")
```

5. **Save**
```
ue_save_current_level()
```

## Set Up Outdoor Lighting

```
ue_spawn_actor(className: "DirectionalLight", rotation: {pitch: -50, yaw: 170, roll: 0}, label: "Sun")
ue_spawn_actor(className: "SkyLight", label: "SkyLight")
ue_spawn_actor(className: "SkyAtmosphere", label: "Sky")
ue_spawn_actor(className: "ExponentialHeightFog", label: "Fog")
ue_spawn_actor(className: "PostProcessVolume", label: "PostProcess")
```

## Create a Grid of Objects

Use a loop pattern: spawn N actors with offset positions.

For a 5x5 grid with 200cm spacing:
1. Spawn 25 StaticMeshActors
2. Location for (row, col): `{x: row * 200, y: col * 200, z: 0}`

## Duplicate and Arrange

1. Create one actor with the right properties
2. Duplicate it: `ue_duplicate_actor(actorPath: "<path>", offset: {x: 200, y: 0, z: 0})`
3. Repeat for each copy

## Discover Available Operations

When unsure what you can do with an object:
```
ue_describe_object(objectPath: "<any_object_path>")
```

This lists every callable function and readable property.
