---
title: "Importing Assets"
category: assets
tags: [import, assets, meshes, textures]
difficulty: intermediate
summary: "How assets get into UE5 and how to reference engine content via the Remote Control API."
ueVersion: "5.4+"
---

## Asset Import Overview

UE5 imports external files (FBX, PNG, WAV, etc.) into its own asset format. The import pipeline converts files into optimized engine assets.

## Remote Control Limitations

The Remote Control API does **not** directly support file imports. To import new assets:

1. Place source files in the `Content/` directory
2. UE5 auto-detects and imports them
3. Or use the editor's import dialog manually

## Referencing Engine Content

UE5 ships with useful starter content. Use it via asset paths:

### Basic Shapes
- `/Engine/BasicShapes/Cube` — box mesh
- `/Engine/BasicShapes/Sphere` — sphere mesh
- `/Engine/BasicShapes/Cylinder` — cylinder mesh
- `/Engine/BasicShapes/Cone` — cone mesh
- `/Engine/BasicShapes/Plane` — flat plane

### Assigning a Mesh to an Actor

After spawning a StaticMeshActor, assign a mesh:

```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "StaticMesh",
  value: "/Engine/BasicShapes/Cube.Cube"
)
```

### Assigning a Material

```
ue_set_property(
  objectPath: "<actor_path>.StaticMeshComponent0",
  propertyName: "OverrideMaterials",
  value: ["/Game/Materials/M_MyMaterial"]
)
```

## Duplicating Existing Assets

To create variations of existing assets:
```
ue_duplicate_asset(
  sourcePath: "/Game/Materials/M_Brick",
  destPath: "/Game/Materials/M_Brick_Red"
)
```
