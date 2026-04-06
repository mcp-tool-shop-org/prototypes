---
title: "Physics and Collisions"
category: physics
tags: [physics, collision, simulate, forces, impulse, constraints]
difficulty: intermediate
summary: "Enabling physics simulation, setting up collisions, applying forces, and using constraints."
ueVersion: "5.4+"
---

## Enabling Physics on an Actor

After spawning a StaticMeshActor, enable physics simulation:

```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "SimulatePhysics",
  value: true
)
```

The actor will immediately start responding to gravity.

## Collision Channels

UE5 uses collision channels and responses to control what interacts with what:

- **WorldStatic** — static level geometry
- **WorldDynamic** — movable non-pawn objects
- **Pawn** — characters and pawns
- **Visibility** — line trace visibility checks
- **Camera** — camera collision
- **PhysicsBody** — physics-simulated objects

Set collision on a component:
```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "CollisionEnabled",
  value: "QueryAndPhysics"
)
```

Options: `NoCollision`, `QueryOnly`, `PhysicsOnly`, `QueryAndPhysics`

## Collision Presets

Common presets for quick setup:
- `BlockAll` — blocks everything
- `OverlapAll` — overlaps everything, blocks nothing
- `BlockAllDynamic` — blocks dynamic objects
- `NoCollision` — no collision at all

```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "CollisionProfileName",
  value: "BlockAll"
)
```

## Mass and Gravity

```
# Set mass override
ue_set_property(objectPath: "<component>", propertyName: "MassInKg", value: 50.0)

# Disable gravity on a specific component
ue_set_property(objectPath: "<component>", propertyName: "EnableGravity", value: false)
```

## Applying Forces

Via Blueprint-callable functions on physics-enabled components:
```
ue_describe_object(objectPath: "<actor_path>.StaticMeshComponent0")
```

Look for `AddForce`, `AddImpulse`, `AddTorqueInRadians` in the function list.

## Physics Constraints

Physics constraints connect two bodies with rules (hinges, springs, etc.). Create constraint actors:
```
ue_spawn_actor(className: "PhysicsConstraintActor", location: {x: 0, y: 0, z: 200})
```

Configure the constraint by setting properties like `ConstrainedBone1`, `ConstrainedBone2`, `AngularSwing1Motion`, etc.
