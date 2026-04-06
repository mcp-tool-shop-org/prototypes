---
title: "Actor Types Reference"
category: actors
tags: [actor, types, reference, classes]
difficulty: intermediate
summary: "Comprehensive reference of common UE5 actor classes and their purposes."
ueVersion: "5.4+"
---

## Rendering

| Class | Description |
|-------|-------------|
| `StaticMeshActor` | Renderable mesh (walls, props, terrain) |
| `SkeletalMeshActor` | Animated mesh (characters, creatures) |
| `DecalActor` | Projected texture on surfaces |
| `InstancedStaticMeshActor` | GPU-instanced copies of a mesh |

## Lighting

| Class | Description |
|-------|-------------|
| `PointLight` | Omnidirectional light |
| `SpotLight` | Cone-shaped directional light |
| `DirectionalLight` | Parallel rays (sun/moon) |
| `RectLight` | Rectangular area light |
| `SkyLight` | Ambient sky lighting |

## Cameras

| Class | Description |
|-------|-------------|
| `CameraActor` | Fixed camera viewpoint |
| `CineCameraActor` | Cinematic camera with film-back settings |

## Volumes & Triggers

| Class | Description |
|-------|-------------|
| `TriggerBox` | Box-shaped overlap trigger |
| `TriggerSphere` | Sphere-shaped overlap trigger |
| `BlockingVolume` | Invisible collision |
| `PostProcessVolume` | Post-processing effects region |
| `AudioVolume` | Audio settings region |
| `LightmassImportanceVolume` | Baked lighting quality region |
| `NavMeshBoundsVolume` | AI navigation mesh region |

## Gameplay

| Class | Description |
|-------|-------------|
| `PlayerStart` | Player spawn location |
| `TargetPoint` | Generic location marker |
| `Note` | Editor-only annotation |

## Environment

| Class | Description |
|-------|-------------|
| `ExponentialHeightFog` | Distance/height-based fog |
| `SkyAtmosphere` | Physically-based sky |
| `VolumetricCloud` | Cloud rendering |
| `Landscape` | Terrain system |

## Audio

| Class | Description |
|-------|-------------|
| `AmbientSound` | Positioned sound emitter |

## Effects

| Class | Description |
|-------|-------------|
| `NiagaraActor` | Niagara particle system |
| `CascadeParticleSystemActor` | Legacy Cascade particles |
