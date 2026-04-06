---
title: Reference
description: Complete reference for MCP App Builder — commands, settings, UI components, project structure, and security model.
sidebar:
  order: 4
---

This page is the full reference for every command, setting, UI component, and convention in MCP App Builder.

## Commands

All commands are accessible through the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`). They also appear in the **MCP** category when filtering.

| Command | Description | When available |
|---------|-------------|----------------|
| **MCP: New Server** | Launch the New Server Wizard to scaffold a project from a template. | Always |
| **MCP: Validate Schema** | Check the active `mcp.json` or `mcp-tools.json` against its JSON Schema. Errors appear inline and in the Problems panel. | Workspace open |
| **MCP: Generate Types** | Read `mcp-tools.json` and emit TypeScript interfaces for every tool's input and output shapes. | Workspace open |
| **MCP: Test Server** | Start the test harness on the configured port. Tests are auto-generated from the `examples` field in each tool definition. | Workspace open |
| **MCP: Open Dashboard** | Open a webview panel showing project status, detected tools, and quick-action buttons. | Workspace open |
| **MCP: Tool Playground** | Open an interactive panel to connect to MCP servers, browse tools, invoke them with auto-generated forms, and review invocation history. | Workspace open |

## Settings

Configure these in VS Code's Settings UI or in `.vscode/settings.json`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `string` | `"basic"` | Which template the New Server Wizard selects by default. Options: `basic`, `with-ui`, `full`. |
| `mcp-app-builder.autoValidate` | `boolean` | `true` | When enabled, `mcp.json` and `mcp-tools.json` are validated every time you save. Disable if validation is too noisy during rapid edits. |
| `mcp-app-builder.testPort` | `number` | `3000` | The localhost port the test harness binds to. Change this if port 3000 is already in use. |

## MCP Apps UI components

The MCP Apps standard (January 2026) defines a set of interactive components that AI hosts can render inline. MCP App Builder ships builders for the most common ones.

### table

Render tabular data with optional sorting and pagination.

```typescript
import { table } from '@mcp-app-builder/ui-components';

const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);
```

**Parameters:**
- `columns` — array of `{ key, header, sortable?, width?, align? }` objects defining each column.
- `data` — array of row objects. Keys must match the column `key` values.
- `options` — optional. `{ pageSize?: number, sortable?: boolean, filterable?: boolean }`. `pageSize` controls how many rows display before pagination (default 10). `sortable` enables column sorting (default true). `filterable` enables row filtering (default false).

### chart

Display line, bar, area, pie, or scatter charts from numeric data.

```typescript
import { chart } from '@mcp-app-builder/ui-components';

const lineChart = chart({
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Users', data: [100, 250, 400] }],
  },
});
```

**Parameters:**
- `config` — an `MCPUIChartConfig` object with:
  - `type` — `'bar'`, `'line'`, `'pie'`, `'area'`, or `'scatter'`.
  - `data.labels` — array of label strings for the x-axis.
  - `data.datasets` — array of `{ label, data, color? }` objects.
  - `options` — optional. `{ title?, legend?, animate? }`.

### form

Collect structured input from users through form fields.

```typescript
import { form } from '@mcp-app-builder/ui-components';

const searchForm = form([
  { name: 'query', type: 'text', label: 'Search', required: true },
  { name: 'limit', type: 'number', label: 'Max results', default: 10 },
]);
```

**Parameters:**
- `fields` — array of field objects with `{ name, type, label, placeholder?, required?, options?, validation? }`. Supported types: `text`, `number`, `email`, `password`, `textarea`, `select`, `checkbox`, `radio`.
- `options` — optional. `{ submitLabel?: string, layout?: 'vertical' | 'horizontal' | 'grid', onSubmit?: string }`. `onSubmit` is the name of a tool to call when the form is submitted.

### card and dashboard

Group metrics and visualizations into a summary view. The `dashboard` builder is a higher-level function imported from the builders module.

```typescript
import { dashboard } from '@mcp-app-builder/ui-components/builders';

const overview = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Users', data: [100, 250, 400] }],
    },
  },
});
```

**Dashboard options:**
- `title` — heading text for the dashboard card.
- `metrics` — array of `{ label, value, change?, trend? }` objects.
- `chart` — optional `MCPUIChartConfig` object (same shape as the `chart()` primitive parameter).
- `refreshTool` — optional tool name to call when the user clicks a refresh button.

## Generated project structure

When you scaffold a new server, the extension creates this file layout:

```
my-mcp-server/
├── mcp.json           # Server identity, capabilities, transport config
├── mcp-tools.json     # Tool definitions: name, description, inputSchema, examples
├── package.json       # Node.js manifest with MCP SDK dependency
├── tsconfig.json      # TypeScript configuration (strict mode)
└── src/
    ├── index.ts       # Server entry point — registers tools and starts listening
    ├── resources.ts   # Resource handlers (full template only)
    └── prompts.ts     # Prompt handlers (full template only)
```

**Key files:**

- **`mcp.json`** — Declares the server's name, version, supported transport (stdio or HTTP), and capabilities list. The extension validates this against a bundled JSON Schema.
- **`mcp-tools.json`** — Defines every tool the server exposes: its name, description, Zod-compatible input schema, and example invocations (used by the test harness).
- **`src/index.ts`** — The runtime entry point. Imports the MCP SDK, registers tool handlers, and starts the server. This is where your business logic lives.

## Security model

MCP App Builder is designed to stay out of your way and off the network.

**What the extension accesses:**
- Workspace files: `mcp.json`, `mcp-tools.json`, generated TypeScript, and `package.json`.
- VS Code settings (read/write for extension configuration).
- Extension output channels (for test results and validation messages).
- Localhost network — only when the test harness is running, bound to the configured port.

**What the extension does NOT access:**
- Source code beyond MCP configuration files.
- Git history, credentials, or environment variables.
- External networks (no telemetry, no phone-home, no registry calls).
- Other extensions' data or workspaces.

For the full security policy, see [SECURITY.md](https://github.com/mcp-tool-shop-org/mcp-app-builder/blob/main/SECURITY.md) in the repository.

## Error codes

When something goes wrong, the extension shows structured errors with a code, message, and hint. These are the error codes you may encounter:

| Code | Meaning |
|------|---------|
| `INPUT_INVALID_SCHEMA` | A `mcp.json` or `mcp-tools.json` file failed schema validation. |
| `INPUT_MISSING_FILE` | A required file (e.g. `mcp-tools.json`) was not found in the workspace. |
| `INPUT_PARSE_ERROR` | A file could not be parsed as valid JSON. |
| `IO_FILE_WRITE` | The extension could not write a file during scaffolding or type generation. |
| `IO_FILE_READ` | The extension could not read a required file from disk. |
| `CONFIG_MISSING` | No `mcp.json` found in the current workspace. |
| `CONFIG_INVALID` | The `mcp.json` file exists but contains invalid configuration. |
| `RUNTIME_SCAFFOLD` | An error occurred during project scaffolding. |
| `RUNTIME_CODEGEN` | An error occurred during TypeScript type generation. |
| `RUNTIME_TEST` | An error occurred while running the test harness. |
| `RUNTIME_TRANSPORT` | The MCP client failed to connect via the configured transport (stdio or HTTP). |
| `RUNTIME_UNEXPECTED` | An unexpected internal error. Check the MCP App Builder output channel for details. |

Each error includes a human-readable hint when possible. If an error says `retryable: true`, the operation is safe to attempt again.
