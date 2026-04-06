---
title: "First Commands — Spawn, Move, Delete"
category: getting-started
tags: [spawn, actor, move, delete, tutorial]
difficulty: beginner
summary: "A hands-on walkthrough: spawn a cube, read its location, move it, and delete it."
ueVersion: "5.4+"
---

## Spawn an Actor

Use `ue_spawn_actor` to place an actor in the level:

```
ue_spawn_actor(className: "StaticMeshActor", location: {x: 0, y: 0, z: 100}, label: "MyCube")
```

This spawns a StaticMeshActor at position (0, 0, 100) and names it "MyCube" in the outliner.

Common actor classes:
- `StaticMeshActor` — a mesh in the world
- `PointLight` — omnidirectional light
- `SpotLight` — directional cone light
- `DirectionalLight` — sun-like light
- `CameraActor` — a camera
- `PlayerStart` — where the player spawns

## Read Its Transform

```
ue_get_actor_transform(actorPath: "<path from spawn result>")
```

Returns the actor's location, rotation, and scale in world space.

## Move the Actor

```
ue_set_actor_transform(actorPath: "<path>", location: {x: 500, y: 200, z: 100})
```

You can set location, rotation, and scale independently — only the fields you provide are changed.

## Read a Property

Use `ue_describe_object` to discover available properties:

```
ue_describe_object(objectPath: "<actor path>")
```

Then read a specific property:

```
ue_get_property(objectPath: "<actor path>", propertyName: "Mobility")
```

## Set a Property

```
ue_set_property(objectPath: "<actor path>", propertyName: "Mobility", value: "Movable")
```

## Delete the Actor

```
ue_delete_actor(actorPath: "<path>")
```

## List All Actors

```
ue_get_all_actors()
```

Returns all actors in the current level. Use `classFilter` to narrow:

```
ue_get_all_actors(classFilter: "PointLight")
```

## Save the Level

```
ue_save_current_level()
```

Always save after making changes you want to keep.
