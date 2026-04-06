---
title: "Content Browser Basics"
category: assets
tags: [content-browser, assets, paths, types]
difficulty: beginner
summary: "Understanding asset paths, types, and the content browser structure in UE5."
ueVersion: "5.4+"
---

## Asset Paths

Every asset in UE5 has a content path:
```
/Game/Materials/M_Brick
```

- `/Game/` maps to the project's `Content/` folder
- `/Engine/` contains built-in engine assets
- Subfolders map directly to disk directories

## Browsing Assets

List all assets in a directory:
```
ue_list_assets(directoryPath: "/Game/Materials", recursive: true)
```

Search by name across the entire project:
```
ue_search_assets(query: "Brick")
```

Filter by class:
```
ue_search_assets(query: "Brick", classFilter: ["Material", "MaterialInstance"])
```

## Check If an Asset Exists

```
ue_asset_exists(assetPath: "/Game/Materials/M_Brick")
```

## Asset Types

| Type | Description |
|------|-------------|
| `StaticMesh` | 3D geometry (props, walls, etc.) |
| `SkeletalMesh` | Animated mesh with skeleton |
| `Material` | Surface shader |
| `MaterialInstance` | Material with parameter overrides |
| `Texture2D` | 2D texture/image |
| `Blueprint` | Blueprint class |
| `SoundWave` | Audio file |
| `AnimSequence` | Animation clip |
| `NiagaraSystem` | Particle system |
| `World` | Level/Map |

## Asset Operations

- `ue_duplicate_asset` — copy an asset to a new path
- `ue_rename_asset` — move/rename an asset
- `ue_delete_asset` — remove an asset
- `ue_save_asset` — save a modified asset to disk
- `ue_get_asset_info` — get metadata about an asset
