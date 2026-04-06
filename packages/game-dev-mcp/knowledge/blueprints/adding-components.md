---
title: "Adding Components to Blueprints"
category: blueprints
tags: [components, blueprint, add, configure]
difficulty: intermediate
summary: "Reference for adding and configuring components on Blueprint actors."
ueVersion: "5.4+"
---

## Adding a Component

```
ue_add_component(
  blueprintPath: "/Game/Blueprints/BP_MyActor",
  componentClass: "StaticMeshComponent",
  componentName: "MyMesh"
)
```

## Common Component Classes

### Visual
- `StaticMeshComponent` — static 3D mesh
- `SkeletalMeshComponent` — animated mesh
- `DecalComponent` — projected texture
- `BillboardComponent` — always-facing-camera sprite

### Lighting
- `PointLightComponent` — omnidirectional
- `SpotLightComponent` — cone-shaped
- `RectLightComponent` — rectangular area

### Collision
- `BoxComponent` — box-shaped collision
- `SphereComponent` — sphere collision
- `CapsuleComponent` — capsule collision

### Audio
- `AudioComponent` — sound playback

### Movement
- `ProjectileMovementComponent` — projectile physics
- `RotatingMovementComponent` — constant rotation
- `InterpToMovementComponent` — movement between points

### Utility
- `SceneComponent` — empty transform node (for hierarchy)
- `ArrowComponent` — debug direction arrow
- `TextRenderComponent` — 3D text display

## Setting Component Properties

Use `ue_set_component_property` to configure:

```
ue_set_component_property(
  blueprintPath: "/Game/Blueprints/BP_MyActor",
  componentName: "MyMesh",
  property: "StaticMesh",
  value: "/Engine/BasicShapes/Cube.Cube"
)
```

Common properties by component type:

### StaticMeshComponent
- `StaticMesh` — the mesh asset path
- `RelativeLocation` — offset from parent
- `RelativeScale3D` — local scale
- `OverrideMaterials` — material overrides array

### PointLightComponent
- `Intensity` — brightness (float, e.g., 5000)
- `LightColor` — {R, G, B, A} (0-255 each)
- `AttenuationRadius` — range in cm
- `CastShadows` — boolean

### AudioComponent
- `Sound` — SoundWave asset path
- `VolumeMultiplier` — volume (0.0 to 1.0)
- `bAutoActivate` — play on start
