---
title: "GameplayStatics & Utility Functions"
category: api-reference
tags: [api, gameplay, statics, utility, reference]
difficulty: advanced
summary: "Useful utility functions available via the Remote Control API."
ueVersion: "5.4+"
---

## GameplayStatics

Path: `/Script/Engine.Default__GameplayStatics`

### GetCurrentLevelName
Get the name of the currently loaded level.

### GetAllActorsOfClass
Find all actors of a specific class in the world.

Parameters:
- `ActorClass` (string) — Class path

Returns: Array of actor references

## KismetSystemLibrary

Path: `/Script/Engine.Default__KismetSystemLibrary`

### ExecuteConsoleCommand
Run a UE console command.

Parameters:
- `WorldContextObject` — Use GameplayStatics as context
- `Command` (string) — Console command string

### Common Console Commands

| Command | Description |
|---------|-------------|
| `stat fps` | Show FPS counter |
| `stat unit` | Show frame timing |
| `show collision` | Toggle collision visualization |
| `show bounds` | Toggle bounding boxes |
| `r.SetRes 1920x1080` | Set viewport resolution |
| `t.MaxFPS 60` | Cap frame rate |
| `BUILD LIGHTING` | Build static lightmaps |
| `CAMERA ALIGN` | Focus on selection |

## EditorLoadingAndSavingUtils

Path: `/Script/UnrealEd.Default__EditorLoadingAndSavingUtils`

### SaveCurrentLevel
Save the current level.

### LoadMap
Open a level by path.

Parameters:
- `Filename` (string) — Level asset path

### SaveDirtyPackages
Save all modified packages.

Parameters:
- `bPromptUserToSave` (boolean) — Show save dialog
- `bSaveMapPackages` (boolean) — Include level files
- `bSaveContentPackages` (boolean) — Include asset files

## Discovering More Functions

Use `ue_describe_object` to explore any subsystem:

```
ue_describe_object(objectPath: "/Script/Engine.Default__GameplayStatics")
```

This returns all callable functions and their parameters.
