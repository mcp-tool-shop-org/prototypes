---
title: For Beginners
description: New to mcp-examples? Start here for a ground-up introduction.
sidebar:
  order: 99
---

New to MCP Tool Shop and not sure where to start? This page walks you through everything from scratch.

## What is this tool?

mcp-examples is a collection of runnable example workspaces that teach you how MCP Tool Shop works. Each workspace is a self-contained project with real Python tools you can run from the command line.

The problem it solves: when you first encounter MCP Tool Shop, you need working code to experiment with, not just documentation. These examples give you safe, hands-on projects where you can learn the safety model (stub-first, opt-in capabilities) by running actual tools and seeing what they do.

There are currently two example workspaces:

- **hello-tools** — two tools (`echo` and `http_get`) that demonstrate pure functions and stub-first network access.
- **hello-filesystem** — one tool (`file_write`) that demonstrates safe handling of irreversible side effects through three write modes (disabled, sandbox, full).

## Who is this for?

- Developers who are new to MCP Tool Shop and want to understand the model before building on it.
- Anyone evaluating whether MCP Tool Shop's safety model fits their use case.
- Learners who prefer running code over reading specifications.

No prior MCP Tool Shop experience is required. If you can open a terminal and run a Python script, you are ready.

## Prerequisites

Before you start, make sure you have:

- **Python 3.10 or later** — check with `python --version` or `python3 --version`.
- **Git** — check with `git --version`.
- **A terminal** — any shell works (bash, zsh, PowerShell, CMD).
- **Basic command-line skills** — you should be comfortable with `cd`, running commands, and reading terminal output.

Optional (only needed for the http_get real mode):

- **httpx** — install with `pip install httpx` if you want to make real HTTP requests.

## Your First 5 Minutes

Follow these steps from zero to your first successful tool run.

**Step 1: Clone the repo.**

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-examples
cd mcp-examples
```

**Step 2: Run the echo tool.**

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

You should see `Hello, MCP!` printed back. This tool is a pure function with no side effects.

**Step 3: Try the uppercase flag.**

```bash
python -m tools.echo.main --uppercase "hello"
```

Output: `HELLO`. The echo tool supports `--uppercase` (`-u`) to convert text.

**Step 4: See stub-first in action.**

```bash
python -m tools.http_get.main https://example.com
```

This prints a stub response showing what *would* happen, but makes no network call. That is the safety model: tools show their plan before doing anything real.

**Step 5: Try the filesystem tool.**

```bash
cd ../hello-filesystem
python -m tools.file_write.main output.txt "test content"
```

Again, stub mode: nothing is written. To actually write, set `ALLOW_WRITE=1`:

```bash
ALLOW_WRITE=1 python -m tools.file_write.main output.txt "test content"
cat sandbox/output.txt
```

The file appears in `./sandbox/`, not at the path you specified. That is sandbox mode protecting you from accidental writes to the wrong location.

## Common Mistakes

**1. Wrong module path for file_write.**
The tool module is `tools.file_write.main`, not `tools.writer.main`. If you see `ModuleNotFoundError`, check the module name matches the directory under `tools/`.

**2. Forgetting the environment variable syntax for your shell.**
`ALLOW_NETWORK=1 python ...` is bash syntax. On PowerShell, use `$env:ALLOW_NETWORK="1"; python ...`. On CMD, use `set ALLOW_NETWORK=1 && python ...`.

**3. Expecting http_get to work without httpx installed.**
In stub mode (the default), no extra packages are needed. But if you set `ALLOW_NETWORK=1` without httpx installed, you will get an error. Fix it with `pip install httpx`.

**4. Looking for written files in the wrong place.**
In sandbox mode (`ALLOW_WRITE=1`), files are always written to the `./sandbox/` directory regardless of the path you provide. The tool strips path components for safety. Only `ALLOW_WRITE=full` writes to the exact path you specify.

**5. Running from the repo root instead of the example directory.**
Each example must be run from inside its own directory (`hello-tools/` or `hello-filesystem/`). Running `python -m tools.echo.main` from the repo root will fail because Python cannot find the module.

## Next Steps

- [Getting Started](/mcp-examples/handbook/getting-started/) — the full setup walkthrough with both examples.
- [Examples](/mcp-examples/handbook/examples/) — detailed reference for every tool and workspace.
- [Principles](/mcp-examples/handbook/principles/) — the design philosophy behind the safety model.
- [hello-tools README](https://github.com/mcp-tool-shop-org/mcp-examples/tree/main/hello-tools) — deep dive into echo and http_get.
- [hello-filesystem README](https://github.com/mcp-tool-shop-org/mcp-examples/tree/main/hello-filesystem) — deep dive into file_write and sandbox mode.

## Glossary

- **MCP** — Model Context Protocol. The standard that MCP Tool Shop implements for tool discovery and execution.
- **MCP Tool Shop** — The ecosystem of tools, registry, and CLI that these examples teach.
- **Workspace** — A self-contained directory containing tools, an `mcp.yaml` configuration, and a README. Each example in this repo is one workspace.
- **mcp.yaml** — The configuration file at the root of each workspace. It declares the schema version, workspace name, registry reference, and tool list.
- **Stub mode** — The default behavior where a tool shows what it *would* do without actually doing it. No side effects occur.
- **Capability** — A permission that a tool needs to perform real work (e.g., network access, file writes). Capabilities are always off by default and require explicit opt-in via environment variables.
- **Sandbox** — A restricted directory (`./sandbox/`) where file writes are confined. Path traversal attacks are blocked so writes cannot escape the sandbox.
- **Registry** — The central metadata store ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) that lists all available tools and their versions.
- **mcpt** — The CLI tool ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) for discovering, installing, and running MCP tools from the registry.
- **Tag** — A versioned snapshot (e.g., `v0.1.0`) of the registry or repo. Tags provide stability and reproducibility compared to the `main` branch.
