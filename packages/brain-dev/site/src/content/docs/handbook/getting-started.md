---
title: Getting Started
description: Install brain-dev, configure it with Claude Desktop, and run your first code analysis.
sidebar:
  order: 1
---

## Install

Install brain-dev from PyPI:

```bash
pip install dev-brain
```

Requires Python 3.11 or later.

## Run

Start the MCP server:

```bash
dev-brain
```

The server communicates over stdio using the MCP protocol. You will not see output in the terminal -- it is waiting for an MCP client to connect.

## Configure Claude Desktop

Add brain-dev to your Claude Desktop configuration. Open your Claude Desktop config file and add the server entry:

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

After saving, restart Claude Desktop. brain-dev will appear in the list of available MCP servers. You can then ask Claude to analyze your code, generate tests, run security audits, and more.

## Development setup

To work on brain-dev itself, clone the repository and install in development mode:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

Run the test suite:

```bash
pytest
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `mcp >= 1.0.0` | MCP protocol implementation |
| `pytest >= 7.0.0` | Test generation engine |
| `mypy` (optional) | Type checking |
| `ruff` (optional) | Linting |

## Verify it works

Once configured, ask Claude:

> "Use brain-dev to run a security audit on my project."

Or try a targeted request:

> "Generate smart tests for `src/auth.py` using brain-dev."

Claude will call the appropriate brain-dev tools and return the results directly in the conversation.
