---
title: Beginners
description: New to MCP? A plain-language guide to MCP App Builder — what it is, who it is for, and how to get your first server running in five minutes.
sidebar:
  order: 99
---

## What is this tool?

MCP App Builder is a VS Code extension that helps you create **MCP servers** — programs that expose tools, data, and prompts to AI assistants like Claude, ChatGPT, or any host that speaks the [Model Context Protocol](https://modelcontextprotocol.io).

Think of it this way: an MCP server is like an API that AI can call. MCP App Builder gives you a guided workflow to scaffold, validate, test, and iterate on those servers without leaving your editor.

It also supports the **MCP Apps** standard (January 2026), which lets your tools return interactive UI components — tables, charts, forms, and cards — that render directly inside AI conversations instead of plain text.

## Who is this for?

- **Backend developers** who want to give AI access to their services, databases, or internal tools.
- **Full-stack developers** exploring the MCP ecosystem and looking for a fast way to prototype.
- **Teams building AI integrations** who need schema validation, type safety, and a test harness from day one.
- **Anyone curious about MCP** who wants a working server in minutes rather than hours of SDK documentation.

You do **not** need prior MCP experience. You do need basic familiarity with VS Code, TypeScript/JavaScript, and running `npm` commands in a terminal.

## Prerequisites

Before you start, make sure you have:

1. **VS Code 1.85 or later** — download from [code.visualstudio.com](https://code.visualstudio.com).
2. **Node.js 18 or later** — download from [nodejs.org](https://nodejs.org). This includes `npm`.
3. **A terminal** — the built-in VS Code terminal works fine.

That is all. The extension bundles everything else, including the MCP SDK, JSON Schemas, and template files.

## Your first 5 minutes

### Minute 1: Install the extension

Open VS Code, press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open Extensions, search for **MCP App Builder**, and click **Install**.

### Minute 2: Scaffold a server

Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) to open the Command Palette. Type `MCP: New Server` and select it.

- Pick the **basic** template.
- Name it `my-first-server`.
- Give it a description like "My first MCP server".
- Choose a folder on your machine.
- Select **stdio** transport.

The extension generates a complete project in a new `my-first-server` subfolder.

### Minute 3: Install dependencies and build

Open the generated folder in VS Code (the extension offers this automatically). Open the terminal and run:

```bash
npm install
npm run build
```

### Minute 4: Explore the generated code

Open `src/index.ts`. You will see a working MCP server that registers a single `hello` tool. It takes a `name` parameter and returns `Hello, {name}!`.

Open `mcp-tools.json` to see the tool definition with its parameter schema and example.

Open `mcp.json` to see the server configuration.

### Minute 5: Validate and generate types

Save `mcp-tools.json` — the extension validates it automatically. You should see no errors in the Problems panel.

Now run `MCP: Generate Types` from the Command Palette. The extension creates `src/types/tools.generated.ts` with typed interfaces for your tool. Open it to see the generated `HelloInput` interface and `ToolHandlers` type.

You now have a working, validated, type-safe MCP server.

## Common mistakes

### "No mcp-tools.json found in workspace"
You ran a command before opening the generated project folder. Make sure the folder containing `mcp.json` and `mcp-tools.json` is your VS Code workspace root, or at least within an open workspace folder.

### "Invalid server name"
Server names must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens. No spaces, underscores, or capital letters. Example: `my-data-server` works, `My_Server` does not.

### "Connection timed out" when testing
The test harness needs your server to be running. For stdio transport, make sure your `mcp.json` includes `transport.command` (e.g. `"node"`) and `transport.args` (e.g. `["dist/index.js"]`), and that you have built the project first with `npm run build`.

### Tests all fail immediately
Check that `mcp-tools.json` has at least one tool defined in the `tools` array. The test generator creates test cases from tool definitions -- if the array is empty, there are no tests to run. Also make sure your server is built and reachable; for stdio transport, the test harness spawns the process specified in `mcp.json` `transport.command`.

### Schema validation is too noisy
You can turn off automatic validation during rapid edits. Open VS Code Settings and set `mcp-app-builder.autoValidate` to `false`. You can still validate manually with `Ctrl+Alt+V` whenever you want.

### Generated types are outdated
Re-run `MCP: Generate Types` whenever you change `mcp-tools.json`. The generated file at `src/types/tools.generated.ts` is not kept in sync automatically — you need to trigger the regeneration.

## Next steps

- **Add a real tool** — replace the hello-world handler with something useful (a database query, API call, or file operation) and define its parameters in `mcp-tools.json`.
- **Try the `with-ui` template** — scaffold a second server to experiment with MCP Apps UI components like tables and charts.
- **Use the Tool Playground** — press `Ctrl+Alt+P` to connect to your running server and invoke tools interactively with auto-generated forms.
- **Read the [Usage](/mcp-app-builder/handbook/usage/) page** — detailed walkthroughs for validation, type generation, testing, and the dashboard.
- **Read the [Configuration](/mcp-app-builder/handbook/configuration/) page** — understand every field in `mcp.json` and `mcp-tools.json`.
- **Read the [Reference](/mcp-app-builder/handbook/reference/) page** — full command list, UI component API, error codes, and security model.

## Glossary

| Term | Meaning |
|------|---------|
| **MCP** | Model Context Protocol — an open standard for connecting AI assistants to external tools and data sources. |
| **MCP server** | A program that implements MCP and exposes tools, resources, or prompts to AI hosts. |
| **MCP host** | An AI application (like Claude Desktop or VS Code with Copilot) that connects to MCP servers. |
| **MCP Apps** | A January 2026 extension to MCP that lets servers return interactive UI components instead of plain text. |
| **Tool** | A function exposed by an MCP server that AI can invoke with structured parameters. |
| **Resource** | A read-only data endpoint exposed by an MCP server (e.g. configuration, database records). |
| **Prompt** | A reusable message template exposed by an MCP server that AI hosts can use to structure conversations. |
| **Transport** | The communication channel between an MCP host and server. Options are `stdio` (standard input/output), `http` (HTTP with Server-Sent Events), or `websocket`. The scaffolder supports `stdio` and `http`. |
| **Schema validation** | Checking that `mcp.json` and `mcp-tools.json` conform to their expected structure. |
| **Type generation** | Creating TypeScript interfaces from tool definitions so your handler code is type-safe. |
| **Test harness** | A built-in test runner that connects to your MCP server and exercises tools using auto-generated test cases. |
| **Tool Playground** | An interactive VS Code panel for connecting to MCP servers, browsing tools, and invoking them with auto-generated forms. |
| **Scaffolding** | Generating a complete project structure from a template using the New Server Wizard. |
