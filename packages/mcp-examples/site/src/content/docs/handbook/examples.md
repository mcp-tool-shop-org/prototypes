---
title: Examples
description: Detailed walkthrough of every example workspace in mcp-examples.
sidebar:
  order: 2
---

Each example workspace teaches one concept. Start with hello-tools and work your way up.

## hello-tools

**Your first MCP workspace in 2 minutes.**

hello-tools contains two tools that demonstrate the core safety model:

- **echo** — a pure function with no side effects (input in, output out).
- **http_get** — a network tool that runs in stub mode by default and only makes real HTTP requests when you set `ALLOW_NETWORK=1`.

Nothing touches the network or writes to disk unless you explicitly opt in.

What you learn:

- How an MCP workspace is structured (directory layout, tool modules, `mcp.yaml`).
- How to invoke a tool from the command line.
- How stub-first safety works — tools show what they *would* do before doing it.
- That capabilities like network access are always opt-in.

### Run it

```bash
cd hello-tools

# Always-safe echo tool
python -m tools.echo.main "Hello, MCP!"
python -m tools.echo.main --uppercase "hello"

# http_get in stub mode (no network, shows what would happen)
python -m tools.http_get.main https://example.com

# http_get with real network access
ALLOW_NETWORK=1 python -m tools.http_get.main https://example.com
```

## hello-filesystem

**Irreversible side effects, handled safely.**

hello-filesystem introduces the `file_write` tool, which writes to the filesystem. This is the first example where something real and irreversible happens. The workspace demonstrates three escalating write modes:

| Mode | Env var | Behavior |
|------|---------|----------|
| Disabled | (none) | Stub — shows what would be written, writes nothing |
| Sandbox | `ALLOW_WRITE=1` | Writes only to `./sandbox/`, path traversal blocked |
| Full | `ALLOW_WRITE=full` | Writes anywhere on disk |

What you learn:

- How side effects are declared and scoped via environment variables.
- That capability is always opt-in — the tool cannot write unless you allow it.
- How sandbox mode restricts the blast radius (path traversal attacks are blocked).
- A pattern for handling irreversible actions safely in your own tools.

### Run it

```bash
cd hello-filesystem

# Stub mode — see what WOULD happen (no actual write)
python -m tools.file_write.main output.txt "Hello, filesystem!"

# Sandbox mode — writes only to ./sandbox/
ALLOW_WRITE=1 python -m tools.file_write.main output.txt "Hello!"
cat sandbox/output.txt

# Full mode — writes anywhere (use with caution)
ALLOW_WRITE=full python -m tools.file_write.main /tmp/test.txt "Hello!"
```

### Path traversal protection

In sandbox mode, the tool strips all traversal attempts and writes safely:

```bash
ALLOW_WRITE=1 python -m tools.file_write.main ../../../etc/passwd "nope"
# Writes to ./sandbox/passwd (not /etc/passwd)
```

The sanitizer handles Unix traversal, Windows backslashes, URL-encoded paths, drive letters, and UNC paths.

## Adding your own examples

Each example is a self-contained directory with its own README and tool modules. To add a new example:

1. Create a directory at the repo root with a clear name (e.g., `hello-database`).
2. Add a `README.md` explaining what it teaches.
3. Add one or more tool modules under a `tools/` subdirectory.
4. Add an `mcp.yaml` declaring the workspace schema, registry ref, and tool list.
5. Add a `scripts/verify.sh` so CI can validate the example automatically.
