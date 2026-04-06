---
title: "UE5 Project Structure"
category: getting-started
tags: [project, structure, content, directories, naming]
difficulty: beginner
summary: "Understanding UE5 content directory conventions, asset naming, and level organization."
ueVersion: "5.4+"
---

## Content Directory

All game assets live under `/Game/` in the content browser. On disk, this maps to `Content/` in your project folder.

## Standard Folder Structure

```
/Game/
  Blueprints/           # Blueprint classes (BP_*)
  Maps/                 # Level files
  Materials/            # Materials (M_*) and Material Instances (MI_*)
  Meshes/               # Static meshes (SM_*) and skeletal meshes (SK_*)
  Textures/             # Texture assets (T_*)
  Audio/                # Sound waves and cues
  Particles/            # Niagara and Cascade systems
  UI/                   # Widget blueprints and UI assets
  Characters/           # Character Blueprints and related assets
  Environment/          # Props, foliage, sky
```

## Naming Conventions

| Prefix | Asset Type | Example |
|--------|-----------|---------|
| `BP_` | Blueprint | `BP_Door`, `BP_Pickup` |
| `SM_` | Static Mesh | `SM_Wall`, `SM_Chair` |
| `SK_` | Skeletal Mesh | `SK_Character` |
| `M_` | Material | `M_Brick`, `M_Glass` |
| `MI_` | Material Instance | `MI_Brick_Red` |
| `T_` | Texture | `T_Brick_D` (diffuse), `T_Brick_N` (normal) |
| `A_` | Animation | `A_Walk`, `A_Idle` |
| `S_` | Sound | `S_Footstep` |
| `WBP_` | Widget Blueprint | `WBP_MainMenu` |

## Engine Content

UE5 ships with starter content at `/Engine/` path. Common useful assets:

- `/Engine/BasicShapes/Cube` — basic cube mesh
- `/Engine/BasicShapes/Sphere` — basic sphere mesh
- `/Engine/BasicShapes/Cylinder` — basic cylinder mesh
- `/Engine/BasicShapes/Plane` — basic plane mesh

## Asset Paths

When working with the RC API, asset paths use the format:
```
/Game/FolderName/AssetName
```

For engine content:
```
/Engine/BasicShapes/Cube
```

## Levels

Levels are saved as `.umap` files but referenced by their content path:
```
/Game/Maps/MainLevel
```

Use `ue_load_level` and `ue_save_current_level` to manage levels.
