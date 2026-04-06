---
title: "Remote Control API Reference"
category: api-reference
tags: [api, remote-control, http, endpoints, reference]
difficulty: advanced
summary: "Complete reference for UE5's built-in Remote Control API endpoints."
ueVersion: "5.4+"
---

## Overview

The Remote Control API is a built-in UE5 plugin that exposes an HTTP server (default port 30010) for remote editor control. All endpoints accept and return JSON.

## Endpoints

### GET /remote/info
Returns server info: port, available routes, whether running in editor mode.

### PUT /remote/object/call
Call any BlueprintCallable function on any UObject.

Request body:
```json
{
  "objectPath": "/Script/UnrealEd.Default__EditorActorSubsystem",
  "functionName": "SpawnActorFromClass",
  "parameters": {
    "ActorClass": "/Script/Engine.StaticMeshActor",
    "Location": {"X": 0, "Y": 0, "Z": 0}
  }
}
```

### PUT /remote/object/property
Read or write a UPROPERTY.

Read:
```json
{
  "objectPath": "<actor_path>",
  "propertyName": "RelativeLocation",
  "access": "READ_ACCESS"
}
```

Write:
```json
{
  "objectPath": "<actor_path>",
  "propertyName": "RelativeLocation",
  "access": "WRITE_ACCESS",
  "propertyValue": {"X": 100, "Y": 0, "Z": 0}
}
```

### PUT /remote/object/describe
Introspect a UObject — returns all functions and properties.

```json
{
  "objectPath": "<object_path>"
}
```

### PUT /remote/search/assets
Search the asset registry.

```json
{
  "query": "Cube",
  "filter": {
    "classNames": ["StaticMesh"],
    "packagePaths": ["/Game/Meshes"],
    "recursive": true
  }
}
```

### PUT /remote/batch
Execute multiple requests in one call.

```json
{
  "requests": [
    {"requestId": 1, "url": "/remote/object/property", "verb": "PUT", "body": {...}},
    {"requestId": 2, "url": "/remote/object/property", "verb": "PUT", "body": {...}}
  ]
}
```

## Object Paths

UE objects are identified by their full path:

- Actors in a level: `/Game/Maps/Main.Main:PersistentLevel.StaticMeshActor_0`
- Subsystems: `/Script/UnrealEd.Default__EditorActorSubsystem`
- Assets: `/Game/Materials/M_Brick`
- Components: `<actor_path>.StaticMeshComponent0`

## Common Subsystems

| Subsystem | Path |
|-----------|------|
| EditorActorSubsystem | `/Script/UnrealEd.Default__EditorActorSubsystem` |
| EditorAssetLibrary | `/Script/EditorScriptingUtilities.Default__EditorAssetLibrary` |
| EditorLoadingAndSavingUtils | `/Script/UnrealEd.Default__EditorLoadingAndSavingUtils` |
| KismetSystemLibrary | `/Script/Engine.Default__KismetSystemLibrary` |
| GameplayStatics | `/Script/Engine.Default__GameplayStatics` |
