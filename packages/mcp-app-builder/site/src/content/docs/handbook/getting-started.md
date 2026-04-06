---
title: Getting Started
description: Install MCP App Builder, check prerequisites, and create your first MCP server in under a minute.
sidebar:
  order: 1
---

This page walks you through installing MCP App Builder and creating your first MCP server project.

## Prerequisites

Before you begin, make sure you have:

- **VS Code 1.85 or later** — the extension relies on APIs introduced in this version.
- **Node.js 18 or later** — required for building and running generated server projects.
- **npm** — ships with Node.js; used for dependency installation in scaffolded projects.

No global CLI tools or additional SDKs are needed. The extension bundles everything else.

## Installing the extension

1. Open VS Code.
2. Go to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for **MCP App Builder**.
4. Click **Install**.

Alternatively, install from the command line:

```bash
code --install-extension mcp-tool-shop.mcp-app-builder
```

Once installed, VS Code will show an **MCP** indicator in the status bar whenever you open a workspace that contains an `mcp.json` file.

## Creating your first server

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
MCP: New Server
```

The **New Server Wizard** prompts you to pick a template:

| Template | What you get |
|----------|-------------|
| **basic** | A minimal hello-world server — one tool, clean entry point. Ideal for learning the MCP SDK. |
| **with-ui** | Everything in basic, plus table and chart UI components that render inside AI conversations. |
| **full** | The complete starter — tools, resources, prompts, and UI. Use this when you know you need the full surface area. |

After you choose, the extension generates a ready-to-run TypeScript project with `mcp.json`, `mcp-tools.json`, `package.json`, and a `src/` directory.

## Next steps

Run `npm install` in the generated folder, then press **F5** to launch the Extension Development Host and test your new server.

From here, the development loop is:

1. Edit tool definitions in `mcp-tools.json`.
2. Save — the extension validates your schema automatically (if `autoValidate` is enabled).
3. Run `MCP: Generate Types` to keep TypeScript interfaces in sync.
4. Run `MCP: Test Server` to exercise your tools against the built-in harness.

## Keyboard shortcuts

These shortcuts work globally once the extension is installed:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` on Mac) | Create a new MCP server project |
| `Ctrl+Alt+V` (`Cmd+Alt+V` on Mac) | Validate the current schema file |
| `Ctrl+Alt+P` (`Cmd+Alt+P` on Mac) | Open the Tool Playground |

All shortcuts are rebindable through VS Code's Keyboard Shortcuts editor (`Ctrl+K Ctrl+S`).
