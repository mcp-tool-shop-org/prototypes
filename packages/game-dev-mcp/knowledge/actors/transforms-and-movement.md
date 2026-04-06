---
title: "Transforms and Movement"
category: actors
tags: [transform, location, rotation, scale, movement]
difficulty: beginner
summary: "Working with actor transforms — position, rotation, and scale in world space."
ueVersion: "5.4+"
---

## World Space Coordinates

UE5 uses a left-handed coordinate system:
- **X** — forward
- **Y** — right
- **Z** — up

Units are in centimeters. A typical character is ~180 cm (Z=180).

## Reading a Transform

```
ue_get_actor_transform(actorPath: "<actor path>")
```

Returns:
```json
{
  "location": {"X": 0, "Y": 0, "Z": 0},
  "rotation": {"Pitch": 0, "Yaw": 0, "Roll": 0},
  "scale": {"X": 1, "Y": 1, "Z": 1}
}
```

## Setting a Transform

Set any combination of location, rotation, and scale:

```
ue_set_actor_transform(
  actorPath: "<path>",
  location: {x: 100, y: 200, z: 50},
  rotation: {pitch: 0, yaw: 90, roll: 0},
  scale: {x: 2, y: 2, z: 2}
)
```

Only the fields you provide are changed. Omitted fields keep their current values.

## Rotation Conventions

- **Pitch** — rotation around Y axis (tilting up/down)
- **Yaw** — rotation around Z axis (turning left/right)
- **Roll** — rotation around X axis (banking)

Values are in degrees, range -180 to 180.

## Scale

Default scale is {x: 1, y: 1, z: 1}. Multiply to resize:
- `{x: 2, y: 2, z: 2}` — double size uniformly
- `{x: 1, y: 1, z: 3}` — stretch vertically

## Batch Transforms

For efficiency, use `ue_batch_set_properties` to set multiple actor transforms in one call:

```
ue_batch_set_properties(operations: [
  {objectPath: "<actor1>", propertyName: "RelativeLocation", value: {X: 0, Y: 0, Z: 100}},
  {objectPath: "<actor2>", propertyName: "RelativeLocation", value: {X: 200, Y: 0, Z: 100}}
])
```
