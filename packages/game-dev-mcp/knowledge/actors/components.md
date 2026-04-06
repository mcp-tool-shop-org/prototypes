---
title: "Actor Components"
category: actors
tags: [components, scene, mesh, light, audio]
difficulty: intermediate
summary: "Understanding actor components — the building blocks of actors in UE5."
ueVersion: "5.4+"
---

## What Are Components?

Every actor in UE5 is made of components. Components define an actor's behavior, appearance, and capabilities. The most common workflow is to add components to a Blueprint actor.

## Common Component Types

### Scene Components (have a transform)
- `StaticMeshComponent` — renders a static mesh
- `SkeletalMeshComponent` — renders an animated mesh
- `PointLightComponent` — point light source
- `SpotLightComponent` — spot light source
- `CameraComponent` — camera viewpoint
- `AudioComponent` — sound emitter
- `ArrowComponent` — debug direction indicator
- `SceneComponent` — invisible transform node (used for grouping)

### Collision Components
- `BoxComponent` — box collision shape
- `SphereComponent` — sphere collision shape
- `CapsuleComponent` — capsule collision shape

### Gameplay Components
- `CharacterMovementComponent` — character physics and movement
- `ProjectileMovementComponent` — projectile physics
- `FloatingPawnMovement` — simple floating movement
- `RotatingMovementComponent` — constant rotation

### AI Components
- `AIPerceptionComponent` — AI sensing (sight, hearing, etc.)
- `PawnSensingComponent` — legacy AI sensing

## Reading Component Properties

To access a component's properties via the RC API, you need its object path. Components are children of their owning actor:

```
ue_describe_object(objectPath: "<actor_path>")
```

This lists the actor's components. Then access a specific component:

```
ue_get_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "StaticMesh"
)
```

## Setting Component Properties

```
ue_set_property(
  objectPath: "<actor_path>.PointLightComponent0",
  propertyName: "Intensity",
  value: 5000.0
)
```
