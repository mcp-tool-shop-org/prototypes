---
title: Getting Started
description: Install StressKit MCP, run your first health check, and explore the CLI.
---

## Prerequisites

- Python 3.11 or later
- Git (to clone the repository)
- One or more MCP servers to test

## Installation

StressKit runs from source. Clone the repository:

```bash
git clone https://github.com/mcp-tool-shop-org/stresskit-mcp.git
cd stresskit-mcp
```

The CLI lives at `engines/stresskit-cli/stresskit_cli.py`. No additional dependencies are required for basic operation.

## Run your first check

### Ad-hoc target (any MCP server)

Point StressKit at any stdio MCP server by passing the command directly:

```bash
python engines/stresskit-cli/stresskit_cli.py check python -m my_mcp_server
```

This spawns the server as a subprocess, runs the `mcp-core` profile (the default), and reports findings.

### Named target (from config)

If you have targets defined in `stresskit.targets.json`, reference them by name:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target claude-fresh
```

### All enabled targets

Run every enabled target in your config file:

```bash
python engines/stresskit-cli/stresskit_cli.py check --all
```

Filter by tag:

```bash
python engines/stresskit-cli/stresskit_cli.py check --all --tag python
```

## Choosing profiles

By default, StressKit runs the `mcp-core` profile. You can specify one or more profiles with `-p`:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target my-server -p mcp-core -p mcp-ops
```

Available profiles:

| Profile | What it checks |
|---------|---------------|
| `mcp-core` | Protocol compliance: handshake, tool listing, error format, capability honesty, smoke invocation, schema rejection, timeout behavior (7 of 11 checks live) |
| `mcp-ops` | Operational readiness: concurrency ramp testing across tiers 1, 2, 4, 8, 16 (1 of 12 checks live) |
| `mcp-secure` | Security posture: auth gates, path traversal, injection, secret leakage (15 checks planned) |
| `mcp-trust` | Trust model: command transparency, source pinning, permission scope (11 checks planned) |

## JSON output for CI

Add `--json` to get machine-readable output:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target my-server --json
```

The CLI exit code reflects the overall status:
- `0` — all checks passed
- `1` — warnings (medium-severity findings)
- `2` — failures (critical or high-severity findings)
- `3` — errors (connection failures, runner issues)

## Configuring targets

Create a `stresskit.targets.json` file to define your MCP servers:

```json
{
  "$schema": "./schemas/stresskit.targets.schema.v0.1.json",
  "version": "0.1",
  "targets": [
    {
      "name": "my-server",
      "display_name": "My MCP Server",
      "transport": {
        "kind": "stdio",
        "command": "node",
        "args": ["dist/index.js"]
      },
      "env": {},
      "fixtures": {
        "invoke_smoke": {
          "tool": "hello",
          "args": { "name": "test" }
        }
      },
      "tags": ["local", "node"],
      "enabled": true
    }
  ]
}
```

The `$schema` field enables validation in editors that support JSON Schema. The `env` field lets you set environment variables for the server process.

### Fixture types

| Fixture | Purpose | Required by |
|---------|---------|-------------|
| `invoke_smoke` | A safe, fast tool call for health checks | `core.invoke_smoke`, `ops.concurrency_ramp` |
| `invoke_slow` | A tool call that takes a long time (for timeout testing) | `core.timeout_behavior` |
| `invoke_error` | A tool call expected to return an error | Reserved for future checks |

Checks that need a fixture will be skipped if it is not configured for the target.

## Validating reports

After generating a JSON report, validate it against the schema:

```bash
python engines/stresskit-cli/stresskit_cli.py validate report.json
```

## Other CLI commands

```bash
# Show version and available profiles
python engines/stresskit-cli/stresskit_cli.py version

# List profiles with check counts
python engines/stresskit-cli/stresskit_cli.py profiles

# List configured targets and detect duplicates
python engines/stresskit-cli/stresskit_cli.py targets
```
