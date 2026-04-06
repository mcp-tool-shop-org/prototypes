---
title: "Level Management"
category: levels
tags: [level, map, save, load, create]
difficulty: beginner
summary: "How to save, load, and manage levels via the Remote Control API."
ueVersion: "5.4+"
---

## Save the Current Level

```
ue_save_current_level()
```

## Load a Level

```
ue_load_level(levelPath: "/Game/Maps/MyLevel")
```

Level paths use the content browser path format, without file extension.

## Get the Current Level Name

```
ue_get_current_level()
```

## Save All Modified Assets

```
ue_save_all()
```

This saves all dirty (modified) packages, including levels and assets.

## Level File Conventions

- Store levels in `/Game/Maps/` or `/Game/Levels/`
- Name convention: descriptive names like `MainMenu`, `Level_01`, `TestMap`
- Levels are `.umap` files on disk but referenced without extension

## Creating a New Level

The Remote Control API doesn't have a direct "create level" command. To create a new level:

1. The editor must create it via File > New Level
2. Or duplicate an existing level: `ue_duplicate_asset(sourcePath: "/Game/Maps/Template", destPath: "/Game/Maps/NewLevel")`

## Level Content

When you spawn actors, they're placed in the currently loaded level. Always:
1. Load the target level first with `ue_load_level`
2. Spawn/modify actors
3. Save with `ue_save_current_level`
