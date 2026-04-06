---
title: Reference
description: Configuration, architecture, error codes, and security model.
sidebar:
  order: 4
---

## Configuration

All settings are optional. Defaults work for a standard local UE5 setup.

| Variable | Default | Description |
|----------|---------|-------------|
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Game engine editor hostname |
| `GAMEDEV_MCP_PORT` | `30010` | Remote Control API port |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Request timeout in milliseconds (min 1000, max 60000) |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Log verbosity: `error`, `warn`, `info`, or `debug` |

Set environment variables in your MCP client config:

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"],
      "env": {
        "GAMEDEV_MCP_PORT": "30020",
        "GAMEDEV_MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

If UE5 is running on another machine, set `GAMEDEV_MCP_HOST` to that machine's IP address. The Remote Control API works over the network.

## Architecture

Game Dev MCP runs as an MCP server over stdio transport. Tool calls are translated into HTTP requests to the UE5 Remote Control API on localhost.

```
LLM Client (Claude, etc.)
  | stdio (MCP JSON-RPC)
Game Dev MCP Server (Node.js)
  | HTTP (localhost:30010)
Unreal Engine 5 Remote Control API
```

The server uses the `@modelcontextprotocol/sdk` for MCP protocol handling and `zod` for input validation. All tool parameters are validated before any HTTP request is made to UE5.

## Error codes

Every error response includes a structured JSON object with `code`, `message`, and optional `details`.

| Code | Meaning |
|------|---------|
| `CONNECTION_FAILED` | Cannot reach UE5. Editor may not be running or the Remote Control API plugin is disabled. |
| `TIMEOUT` | Request exceeded the configured timeout (default 10 seconds). |
| `OBJECT_NOT_FOUND` | The specified actor or object path does not exist. Actor paths are session-specific -- re-query after editor restarts. |
| `FUNCTION_NOT_FOUND` | The function name is not callable on the target object. Use `ue_describe_object` to discover valid functions. |
| `PROPERTY_NOT_FOUND` | The property name does not exist on the target object. Property names are case-sensitive. |
| `ASSET_NOT_FOUND` | The specified asset path does not exist in the content browser. |
| `INVALID_PARAMS` | Input validation failed. Check parameter types and required fields. |
| `RC_API_ERROR` | The Remote Control API returned an HTTP error. The message includes the status code and error body. |
| `UNKNOWN_ERROR` | An unexpected error occurred. |

## UE5 subsystem paths

The server communicates with UE5 through well-known subsystem object paths:

| Subsystem | Object path | Used by |
|-----------|------------|---------|
| Editor Actor | `/Script/UnrealEd.Default__EditorActorSubsystem` | Actor tools (spawn, delete, select, transform) |
| Editor Asset Library | `/Script/EditorScriptingUtilities.Default__EditorAssetLibrary` | Asset tools (search, list, duplicate, save) |
| Loading & Saving | `/Script/UnrealEd.Default__EditorLoadingAndSavingUtils` | Level tools (save, load) |
| Kismet System Library | `/Script/Engine.Default__KismetSystemLibrary` | Console commands |
| Gameplay Statics | `/Script/Engine.Default__GameplayStatics` | Level info, world context |

## Remote Control API endpoints

| HTTP method | Path | Purpose |
|-------------|------|---------|
| `GET` | `/remote/info` | Engine info and health check (used by `ue_ping`) |
| `PUT` | `/remote/object/call` | Call a function on a UObject |
| `PUT` | `/remote/object/property` | Read or write a UPROPERTY |
| `PUT` | `/remote/object/describe` | Introspect a UObject |
| `PUT` | `/remote/search/assets` | Search the asset registry |
| `PUT` | `/remote/batch` | Execute multiple requests in one round-trip |

## Security model

| Aspect | Detail |
|--------|--------|
| **Data accessed** | Game engine Remote Control API responses (localhost only) |
| **Data NOT accessed** | No cloud sync, no telemetry, no analytics, no authentication |
| **Permissions** | Localhost network only (127.0.0.1 by default) |
| **Network** | MCP stdio transport + localhost HTTP to UE5 |
| **Telemetry** | None collected or sent |
| **File access** | Project knowledge stored in `.game-dev-mcp/` in the working directory only |

## Troubleshooting

### Cannot connect to Unreal Engine

1. Confirm UE5 is running with a project loaded.
2. Check that the Remote Control API plugin is enabled: **Edit > Plugins** > search "Remote Control API".
3. Restart the editor after enabling the plugin.
4. Visit `http://127.0.0.1:30010/remote/info` in a browser. A JSON response confirms the API is active.
5. Check firewall rules if running on a non-default host.

### Actor path not found

Actor paths are session-specific and change when you restart the editor or reload a level. Always use `ue_find_actors_by_name` or `ue_get_all_actors` to get fresh paths instead of hardcoding them.

### Property not found

Property names in UE5 are case-sensitive. Use `ue_describe_object` on the target object to see the exact names. Note that some properties live on components, not on the actor itself (e.g., light intensity is on the `LightComponent`, not the actor).

### Slow operations

The Remote Control API processes requests synchronously. For bulk property changes, use `ue_batch_set_properties` instead of individual `ue_set_property` calls. Spawning many actors takes real time in the editor.

### Blueprint compile errors

Usually caused by an invalid property value or an unsupported component on the chosen parent class. Use `ue_describe_object` on the Blueprint path to inspect what went wrong.
