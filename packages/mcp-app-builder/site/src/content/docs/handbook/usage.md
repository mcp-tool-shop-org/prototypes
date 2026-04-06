---
title: Usage
description: Day-to-day workflows for MCP App Builder — scaffolding, validation, type generation, testing, the dashboard, and the Tool Playground.
sidebar:
  order: 2
---

This page covers the main workflows you will use after installing MCP App Builder.

## Scaffolding a new server

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run **MCP: New Server**. The New Server Wizard walks you through five steps:

1. **Pick a template** — `basic`, `with-ui`, or `full`.
2. **Name your server** — lowercase letters, numbers, and hyphens only (e.g. `my-data-server`). Maximum 64 characters.
3. **Describe it** — a short sentence shown in MCP host UIs.
4. **Choose a folder** — the extension creates a subfolder using the server name.
5. **Select a transport** — `stdio` for CLI-style servers, `http` for web deployment.

The extension generates a complete TypeScript project: `mcp.json`, `mcp-tools.json`, `package.json`, `tsconfig.json`, and `src/index.ts`. The `full` template also adds `src/resources.ts` and `src/prompts.ts`.

After scaffolding, VS Code offers to open the new folder directly or in a new window.

### Template comparison

| | basic | with-ui | full |
|---|---|---|---|
| Hello-world tool | Yes | No | No |
| Search + chart tools with UI | No | Yes | Yes |
| Resources (data endpoints) | No | No | Yes |
| Prompts | No | No | Yes |
| MCP Apps UI declarations | No | Yes | Yes |

## Schema validation

MCP App Builder validates two files: `mcp.json` (server config) and `mcp-tools.json` (tool definitions).

### Automatic validation on save

When `mcp-app-builder.autoValidate` is enabled (the default), every save of `mcp.json` or `mcp-tools.json` triggers validation. Errors appear inline in the editor and in the **Problems** panel. This uses Zod schemas internally, so you get precise error paths like `tools.0.parameters.1.type`.

### Manual validation

Run **MCP: Validate Schema** (`Ctrl+Alt+V` / `Cmd+Alt+V`) to validate the currently open file on demand. A notification confirms whether the schema is valid or reports the error count.

### What gets validated

**mcp.json** checks:
- `name` matches `^[a-z][a-z0-9-]*$` (1-64 chars)
- `version` is valid semver
- `description` is at most 500 characters
- `transport.type` is `stdio`, `http`, or `websocket`
- `transport.options.port` is 1-65535
- No unknown properties

**mcp-tools.json** checks:
- Every tool has a unique name matching `^[a-z][a-zA-Z0-9_]*$` (1-64 chars)
- Descriptions are 10-1000 characters
- Parameter types are `string`, `number`, `boolean`, `array`, or `object`
- Return types are `text`, `json`, `image`, `resource`, or `ui`
- Semantic warning if a required parameter also has a default value
- Duplicate tool names are flagged as errors

## Type generation

Run **MCP: Generate Types** to read `mcp-tools.json` and emit TypeScript interfaces at `src/types/tools.generated.ts`. The generated file includes:

- An input interface per tool (e.g. `SearchDataInput`)
- A `ToolName` union type of all tool name literals
- A `ToolInputMap` mapping each tool name to its input type
- A `ToolHandlers` interface you can implement to get type-safe handlers
- A `createToolCaller` factory for type-safe tool invocation

If your workspace has multiple `mcp-tools.json` files, the extension prompts you to choose which one to generate from.

Re-run this command whenever you change tool definitions to keep types in sync.

## Testing

Run **MCP: Test Server** to exercise your tools against the built-in test harness. The extension:

1. Reads `mcp-tools.json` to discover tool definitions.
2. Auto-generates test cases: a basic invocation test per tool, a required-parameters-only test, and one test per `examples` entry in the tool definition.
3. Reads `mcp.json` to determine the transport configuration.
4. Connects to your running MCP server using the official `@modelcontextprotocol/sdk` client.
5. Runs every test with a 30-second timeout per invocation.
6. Reports results (pass/fail with timing) in a dedicated **MCP Test Results** output channel.

The test harness supports both `stdio` and `http` transports. For stdio, your `mcp.json` must include a `transport.command` field (e.g. `"node"`) and optionally `transport.args` (e.g. `["dist/index.js"]`).

### Writing better examples

Adding `examples` to your tool definitions in `mcp-tools.json` makes the auto-generated tests more meaningful:

```json
{
  "name": "hello",
  "examples": [
    {
      "description": "Greet a user",
      "input": { "name": "World" },
      "output": "Hello, World!"
    }
  ]
}
```

Each example becomes a separate test case.

## Dashboard

Run **MCP: Open Dashboard** to open a webview panel showing your MCP project status at a glance. The dashboard detects MCP projects in your workspace and provides quick-action buttons for common commands. The status bar also shows an **MCP** indicator (click it to open the dashboard) whenever your workspace contains an `mcp.json` file.

## Tool Playground

Run **MCP: Tool Playground** (`Ctrl+Alt+P` / `Cmd+Alt+P`) to open the interactive tool testing panel. The Playground lets you:

1. **Connect to any MCP server** — choose stdio or HTTP/SSE transport, enter the command or host/port, and click Connect.
2. **Browse available tools** — the sidebar lists every tool the server exposes, with descriptions.
3. **Invoke tools with auto-generated forms** — select a tool and the Playground renders input fields based on the parameter schema. Strings get text fields, numbers get number inputs, booleans get checkboxes, enums get dropdowns, and arrays/objects get JSON text areas.
4. **Inspect results** — formatted output with timing information and error highlighting.
5. **Review session history** — every invocation is logged. Click a history entry to replay it with the same arguments pre-filled.

The Playground connects using the same `MCPTestClient` as the test harness, supporting both stdio process spawning and HTTP/SSE connections.
