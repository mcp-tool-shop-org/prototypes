---
title: Configuration
description: Extension settings, mcp.json schema, mcp-tools.json schema, and transport options for MCP App Builder.
sidebar:
  order: 3
---

This page covers every configuration surface in MCP App Builder: VS Code extension settings, the `mcp.json` server config, the `mcp-tools.json` tool definitions, and transport options.

## Extension settings

Configure these in VS Code's Settings UI (`Ctrl+,` / `Cmd+,`) or in `.vscode/settings.json`.

### `mcp-app-builder.defaultTemplate`

- **Type:** `string`
- **Default:** `"basic"`
- **Options:** `basic`, `with-ui`, `full`

Controls which template the New Server Wizard pre-selects. Change to `with-ui` if most of your servers use MCP Apps UI components, or `full` if you always need resources and prompts.

### `mcp-app-builder.autoValidate`

- **Type:** `boolean`
- **Default:** `true`

When enabled, saving `mcp.json` or `mcp-tools.json` triggers automatic validation. Errors appear inline and in the Problems panel. Disable this if you are making rapid edits and find the validation distracting.

### `mcp-app-builder.testPort`

- **Type:** `number`
- **Default:** `3000`

The localhost port the test harness binds to when using HTTP transport. Change this if port 3000 is already in use by another service.

## mcp.json schema

The `mcp.json` file declares your server's identity, capabilities, and transport. The extension validates it against a bundled JSON Schema and provides IntelliSense in the editor.

### Required fields

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Lowercase letters, numbers, hyphens. Pattern: `^[a-z][a-z0-9-]*$`. Max 64 chars. |
| `version` | string | Valid semver (e.g. `1.0.0`, `0.2.1-beta.1`). |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Brief description, max 500 characters. |
| `author` | string | Author name or organization. |
| `license` | string | SPDX identifier (e.g. `MIT`, `Apache-2.0`). |
| `repository` | string | URL to the source repository. Must be a valid URI. |
| `capabilities` | object | See below. |
| `transport` | object | See below. |
| `tools` | string | Path to the tools definition file. Default: `./mcp-tools.json`. |

### Capabilities object

```json
{
  "capabilities": {
    "tools": true,
    "resources": false,
    "prompts": false,
    "logging": false
  }
}
```

All fields are boolean with the defaults shown above. Set `resources: true` if your server exposes data resources, and `prompts: true` if it provides prompt templates.

### Transport object

```json
{
  "transport": {
    "type": "stdio",
    "options": {
      "port": 3000,
      "host": "localhost",
      "path": "/sse",
      "tls": false
    }
  }
}
```

| Field | Values | Notes |
|-------|--------|-------|
| `type` | `stdio`, `http`, `websocket` | Default is `stdio`. |
| `options.port` | 1-65535 | Only relevant for `http` and `websocket`. |
| `options.host` | string | Default: `localhost`. |
| `options.path` | string | URL path for SSE endpoint. Default: `/sse`. |
| `options.tls` | boolean | Use HTTPS instead of HTTP. Default: `false`. |

For `stdio` transport used with the test harness, you also need `command` and `args` at the transport level:

```json
{
  "transport": {
    "type": "stdio",
    "command": "node",
    "args": ["dist/index.js"]
  }
}
```

## mcp-tools.json schema

The `mcp-tools.json` file defines every tool your server exposes. The extension uses it for validation, type generation, test generation, and IntelliSense.

### Top-level structure

```json
{
  "$schema": "https://mcp-tool-shop.dev/schemas/mcp-tools.schema.json",
  "tools": [...]
}
```

### Tool definition

Each tool in the `tools` array has:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Unique name matching `^[a-z][a-zA-Z0-9_]*$`, 1-64 chars. |
| `description` | Yes | string | 10-1000 characters describing what the tool does. |
| `parameters` | Yes | array | Parameter definitions (see below). |
| `returns` | No | object | Return type: `{ type, description }`. Type is one of `text`, `json`, `image`, `resource`, `ui`. |
| `examples` | No | array | Example invocations with `input` and `output`. Used by the test harness. |
| `ui` | No | object | MCP Apps UI configuration (see below). |

### Parameter definition

Each parameter has:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Matches `^[a-z][a-zA-Z0-9_]*$`. |
| `type` | Yes | string | One of `string`, `number`, `boolean`, `array`, `object`. |
| `description` | Yes | string | Human-readable description. |
| `required` | No | boolean | Default: `false`. |
| `default` | No | any | Default value when the parameter is omitted. |
| `enum` | No | string[] | Allowed values (for string parameters). |
| `items` | No | object | Schema for array element types (recursive). |
| `properties` | No | object | Schema for object property types (recursive). |
| `validation` | No | object | Additional constraints: `min`, `max`, `minLength`, `maxLength`, `pattern`, `format`. |

Supported `format` values for string validation: `email`, `uri`, `date`, `date-time`, `uuid`.

### UI configuration

When a tool returns UI components, the `ui` field controls how the MCP host renders it:

```json
{
  "ui": {
    "resultType": "table",
    "inputForm": {
      "layout": "horizontal",
      "submitLabel": "Search"
    },
    "resultDisplay": {
      "title": "Search Results",
      "refreshable": true,
      "expandable": false
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `resultType` | One of `text`, `table`, `chart`, `form`, `card`, `custom`. |
| `inputForm.layout` | Form layout: `vertical`, `horizontal`, or `grid`. |
| `inputForm.submitLabel` | Label for the submit button. |
| `resultDisplay.title` | Title shown above the result area. |
| `resultDisplay.refreshable` | Show a refresh button. |
| `resultDisplay.expandable` | Allow expanding the result to full screen. |
