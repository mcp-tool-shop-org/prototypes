---
title: "Material Basics"
category: materials
tags: [material, shader, surface, rendering]
difficulty: intermediate
summary: "Overview of UE5's material system and how to work with materials via MCP."
ueVersion: "5.4+"
---

## What Are Materials?

Materials define how surfaces look — color, roughness, metallic, transparency, etc. In UE5, materials are node-based shaders compiled to GPU code.

## Material Properties

Key surface properties:
- **Base Color** — the surface color (RGB)
- **Metallic** — 0 (non-metal) to 1 (metal)
- **Roughness** — 0 (mirror) to 1 (matte)
- **Emissive** — self-illumination color
- **Opacity** — transparency (requires translucent blend mode)
- **Normal** — surface detail via normal map

## Assigning Materials

Apply a material to an actor's mesh:

```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "OverrideMaterials",
  value: ["/Game/Materials/M_MyMaterial"]
)
```

## Material Naming

- `M_` prefix for master materials
- `MI_` prefix for material instances
- `MF_` prefix for material functions

## Working with Materials via MCP

The Remote Control API can:
- Assign materials to mesh components
- Set material instance parameters (scalar, vector, texture)
- Search for materials in the content browser
- Duplicate materials to create variations

It **cannot** edit the material node graph — that requires the Material Editor UI.

## Finding Available Materials

```
ue_search_assets(query: "Material", classFilter: ["Material", "MaterialInstance"])
```

Engine default materials:
- `/Engine/EngineMaterials/DefaultMaterial`
- `/Engine/EngineMaterials/WorldGridMaterial`
