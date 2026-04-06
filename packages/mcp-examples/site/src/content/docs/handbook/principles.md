---
title: Principles
description: The design rules behind every mcp-examples workspace and how the MCP Tool Shop ecosystem fits together.
sidebar:
  order: 3
---

Every example in this repo is built on the same set of rules. Understanding these principles makes it easier to learn from the examples and to build your own tools.

## Least privilege

Tools default to no network, no writes, and no side effects. Capability is always explicit and opt-in. You decide when to enable a capability, and you can see exactly what a tool is allowed to do before you run it.

This means you can safely explore any example without worrying about unintended changes to your system.

## Tagged versions for stability

Use tagged versions (v0.1.0, v0.2.0, etc.) when you want reproducible results. The `main` branch is for development only — it may change without notice and builds may break.

If you are following a tutorial or integrating an example into your own workflow, always pin to a tag.

## The MCP Tool Shop ecosystem

mcp-examples is one piece of a larger system. Here is how the parts connect:

### Registry

[mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) holds metadata for every tool — what exists, what it does, who built it. It is the source of truth for tool discovery.

### CLI

[mcpt](https://github.com/mcp-tool-shop-org/mcpt) is the command-line interface for discovering and running tools from the registry. You do not need to write code to use it.

### Examples

This repo — hands-on workspaces that show the model in action before you build on top of it. The examples teach concepts, not APIs. Once you understand the model, you can build anything.

## How they work together

1. The **Registry** tells you what tools exist.
2. The **CLI** lets you consume them without boilerplate.
3. The **Examples** teach you the model so you understand what you are building on.

Tags provide stability. Least privilege provides safety. Together they let you experiment freely.
