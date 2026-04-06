---
title: "Asset Search Patterns"
category: assets
tags: [search, filter, find, assets]
difficulty: intermediate
summary: "Effective patterns for searching and filtering assets in the UE5 content browser."
ueVersion: "5.4+"
---

## Basic Search

Search by name fragment:
```
ue_search_assets(query: "Wall")
```

This searches across all asset types.

## Filter by Class

Find only specific asset types:
```
ue_search_assets(query: "Wall", classFilter: ["StaticMesh"])
```

Multiple class filters:
```
ue_search_assets(query: "Character", classFilter: ["Blueprint", "SkeletalMesh"])
```

## Filter by Path

Restrict search to a specific directory:
```
ue_search_assets(query: "", pathFilter: ["/Game/Environment"])
```

Combine path and class:
```
ue_search_assets(query: "Door", classFilter: ["Blueprint"], pathFilter: ["/Game/Blueprints"])
```

## List Directory Contents

For browsing without a search query:
```
ue_list_assets(directoryPath: "/Game/Materials", recursive: false)
```

Set `recursive: true` to include subdirectories.

## Finding Engine Content

Engine starter content lives under `/Engine/`:
```
ue_search_assets(query: "Cube", pathFilter: ["/Engine/BasicShapes"])
```

Useful engine paths:
- `/Engine/BasicShapes/` — Cube, Sphere, Cylinder, Cone, Plane
- `/Engine/EngineMaterials/` — Default materials
- `/Engine/EngineResources/` — Default textures
