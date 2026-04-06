---
title: "Error Handling"
category: patterns
tags: [errors, troubleshooting, debugging, connection]
difficulty: intermediate
summary: "Common errors and how to handle them when working with the Remote Control API."
ueVersion: "5.4+"
---

## Connection Errors

### "Cannot connect to Unreal Engine"

The editor is not running or the Remote Control API plugin is not enabled.

Fix:
1. Open UE5 editor
2. Edit > Plugins > search "Remote Control API" > Enable
3. Restart the editor
4. Verify: `ue_ping`

### Timeout

The request took too long. Default timeout is 10 seconds.

Fix:
- Increase timeout: set `GAMEDEV_MCP_TIMEOUT=30000`
- Check if UE is busy (compiling shaders, loading a level)

## Object Not Found

### "Object not found: /Game/..."

The specified object path doesn't exist. Actor paths change between sessions.

Fix:
- Use `ue_get_all_actors()` to get current actor paths
- Use `ue_find_actors_by_name(namePattern: "...")` to search by label
- Use `ue_search_assets(query: "...")` for asset paths

### Stale Actor Paths

After loading a different level, all actor paths from the previous level are invalid.

Fix: Re-query actors with `ue_get_all_actors()` after loading a level.

## Function Not Found

### "Function not found"

The specified function doesn't exist on the object, or isn't `BlueprintCallable`.

Fix:
- Use `ue_describe_object` to see available functions
- Check the function name spelling (case-sensitive)
- The function may be C++-only (not exposed to Blueprint)

## Property Not Found

### "Property not found"

The property doesn't exist or isn't exposed via RC API.

Fix:
- Use `ue_describe_object` to list available properties
- Property names are case-sensitive
- Some properties are read-only

## Batch Errors

When using `ue_batch_set_properties`, individual operations may fail while others succeed. Check the response for per-operation status codes.

## General Debugging

1. **Check connection first**: `ue_ping`
2. **Inspect the object**: `ue_describe_object`
3. **Read before writing**: `ue_get_property` before `ue_set_property`
4. **Use engine info**: `ue_get_engine_info` shows available routes
