---
title: "Animation Basics"
category: animation
tags: [animation, skeletal-mesh, blend-space, state-machine, montage]
difficulty: intermediate
summary: "Skeletal meshes, Animation Blueprints, blend spaces, and triggering animations."
ueVersion: "5.4+"
---

## Skeletal Meshes

Skeletal meshes are 3D models with a bone hierarchy for animation. Common usage:
- Characters (humanoid skeleton)
- Creatures (custom skeleton)
- Mechanical objects (pistons, doors with joints)

Spawn a skeletal mesh actor:
```
ue_spawn_actor(className: "SkeletalMeshActor", location: {x: 0, y: 0, z: 0})
```

Assign a skeletal mesh:
```
ue_set_property(
  objectPath: "<actor_path>.SkeletalMeshComponent0",
  propertyName: "SkeletalMesh",
  value: "/Game/Characters/SK_Mannequin"
)
```

## Animation Blueprints

Animation Blueprints control which animations play based on gameplay state. They contain:
- **AnimGraph** — the animation pipeline
- **State Machine** — states (Idle, Walk, Run, Jump) with transition rules
- **Blend Spaces** — blend between animations based on speed/direction

Assign an Anim Blueprint:
```
ue_set_property(
  objectPath: "<actor_path>.SkeletalMeshComponent0",
  propertyName: "AnimClass",
  value: "/Game/Characters/ABP_Mannequin"
)
```

## Animation Assets

| Type | Description |
|------|-------------|
| `AnimSequence` | Single animation clip |
| `AnimMontage` | Montage for gameplay-triggered animations |
| `BlendSpace` | 1D/2D blend between animations |
| `AnimBlueprint` | State machine + blend logic |

Find animation assets:
```
ue_search_assets(query: "Anim", classFilter: ["AnimSequence", "AnimMontage", "BlendSpace"])
```

## Morph Targets (Blend Shapes)

For facial animation and deformations:
```
ue_describe_object(objectPath: "<actor_path>.SkeletalMeshComponent0")
```

Look for `SetMorphTarget` function — takes a morph target name and weight (0.0 to 1.0).

## Playing Animations

Use `PlayAnimation` on a SkeletalMeshComponent for direct playback, or set variables on the Animation Blueprint to drive state machine transitions.
