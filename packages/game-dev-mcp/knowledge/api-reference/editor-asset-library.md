---
title: "EditorAssetLibrary Reference"
category: api-reference
tags: [api, assets, library, reference]
difficulty: advanced
summary: "Complete function reference for EditorAssetLibrary — asset management in the content browser."
ueVersion: "5.4+"
---

## Object Path

```
/Script/EditorScriptingUtilities.Default__EditorAssetLibrary
```

Requires the **Editor Scripting Utilities** plugin (enabled by default in most templates).

## Functions

### ListAssets
List all assets in a directory.

Parameters:
- `DirectoryPath` (string) — Content path (e.g., `/Game/Materials`)
- `bRecursive` (boolean) — Include subdirectories

Returns: Array of asset path strings

### DoesAssetExist
Check if an asset exists.

Parameters:
- `AssetPath` (string) — Asset content path

Returns: boolean

### DuplicateAsset
Copy an asset.

Parameters:
- `SourceAssetPath` (string) — Source path
- `DestinationAssetPath` (string) — Destination path

Returns: boolean (success)

### RenameAsset
Move/rename an asset.

Parameters:
- `SourceAssetPath` (string) — Current path
- `DestinationAssetPath` (string) — New path

Returns: boolean (success)

### DeleteAsset
Remove an asset.

Parameters:
- `AssetPathToDelete` (string) — Path to delete

Returns: boolean (success)

### SaveAsset
Save a modified asset to disk.

Parameters:
- `AssetToSave` (string) — Asset path
- `bOnlyIfIsDirty` (boolean) — Only save if modified

Returns: boolean (success)

### FindAssetData
Get asset metadata.

Parameters:
- `AssetPath` (string) — Asset path

Returns: Asset data object with class, path, package info

## Usage via game-dev-mcp

Wrapped by `ue_list_assets`, `ue_asset_exists`, `ue_duplicate_asset`, `ue_rename_asset`, `ue_delete_asset`, `ue_save_asset`, and `ue_get_asset_info`.
