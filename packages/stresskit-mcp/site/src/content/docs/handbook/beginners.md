---
title: Beginners
description: First-time walkthrough from zero to your first passing StressKit report.
sidebar:
  order: 99
---

New to StressKit MCP? This page walks you through everything from cloning the repo to reading your first report.

## What problem does StressKit solve?

MCP servers power tool-calling in AI assistants. Before you deploy one, you need confidence that it:

1. Follows the MCP protocol correctly (handshake, tool listing, error format)
2. Stays stable under concurrent requests
3. Rejects invalid input without crashing
4. Recovers after timeouts

StressKit automates these checks and gives you a pass/fail score with evidence.

## Prerequisites

You need:

- **Python 3.11+** installed and on your PATH
- **Git** to clone the repository
- An **MCP server** to test (any server that speaks JSON-RPC over stdio)

No pip install is required. StressKit runs directly from source.

## Step-by-step: your first check

### 1. Clone the repository

```bash
git clone https://github.com/mcp-tool-shop-org/stresskit-mcp.git
cd stresskit-mcp
```

### 2. Verify the CLI works

```bash
python engines/stresskit-cli/stresskit_cli.py version
```

You should see output like:

```
stresskit 1.0.1
Schema version: 0.1
Python: 3.12.0
Platform: Windows
Profiles: mcp-core, mcp-ops, mcp-secure, mcp-trust
```

### 3. Run a check against an MCP server

If you have a stdio MCP server you can launch with a command, pass it directly:

```bash
python engines/stresskit-cli/stresskit_cli.py check node dist/my-server.js
```

StressKit spawns the server, runs the `mcp-core` profile, and prints results.

### 4. Read the output

A successful run looks like:

```
StressKit Report: run-018e3a1b2c3d-abcd1234
Targets (1): node dist/my-server.js
Profiles: mcp-core

Status: PASS
Score: 100/100
Checks: 5 passed, 0 failed, 2 skipped
```

If there are findings, they appear with severity and code:

```
Findings (1):
  [MEDIUM] MCP.CORE.INVALID_ERROR_FORMAT: Error response missing required fields
```

### 5. Get JSON output

For machine-readable results (useful in scripts or CI), add `--json`:

```bash
python engines/stresskit-cli/stresskit_cli.py check node dist/my-server.js --json
```

This writes a full JSON report to stdout containing targets, profiles, runs, findings, metrics, and artifacts. Pipe it to a file with `> report.json`.

### 6. Validate a saved report

If you saved a JSON report, you can verify it matches the expected schema:

```bash
python engines/stresskit-cli/stresskit_cli.py validate report.json
```

## Understanding the score

The score starts at 100 and deducts points based on finding severity:

| Severity | Deduction | Meaning |
|----------|-----------|---------|
| critical | -25 | Server is unsafe or fundamentally broken |
| high | -15 | Significant issue blocking production use |
| medium | -5 | Notable issue that should be fixed |
| low | -1 | Minor improvement opportunity |
| info | 0 | Informational only |

The overall status is determined by the worst finding: critical or high findings mean FAIL, medium findings mean WARN, no findings means PASS.

## Key concepts

### Profiles

A profile is a named set of checks. StressKit ships with four profiles:

- **mcp-core** — Protocol correctness (7 of 11 checks live, the default)
- **mcp-ops** — Operational readiness under load (1 of 12 checks live)
- **mcp-secure** — Security hardening (15 checks planned)
- **mcp-trust** — Trust model for IDE integration (11 checks planned)

You select profiles with the `-p` flag. If you don't specify one, `mcp-core` runs.

### Targets

A target is an MCP server you want to test. You can specify targets two ways:

1. **Ad-hoc**: pass the command directly after `check`
2. **Named**: define targets in `stresskit.targets.json` and reference them with `--target <name>`

Named targets support fixtures, tags, aliases, and fingerprinting.

### Fixtures

Fixtures tell StressKit which tools to call during checks. Without fixtures, checks that need to invoke tools (smoke test, concurrency ramp, timeout behavior) are skipped.

Three fixture types exist:

| Fixture | Purpose |
|---------|---------|
| `invoke_smoke` | A fast, safe tool call for health checking |
| `invoke_slow` | A deliberately slow call for timeout testing |
| `invoke_error` | A call expected to return an error (reserved) |

### Findings

A finding is a discovered issue. Each finding has:

- **Code** — A namespaced identifier like `MCP.CORE.HANDSHAKE_FAILED`
- **Severity** — critical, high, medium, low, or info
- **Evidence** — A message explaining what went wrong
- **Repro bundle** — For failures, a transcript of the request/response exchange

## Common workflows

### Test a server during development

Run `mcp-core` after changes to catch protocol regressions:

```bash
python engines/stresskit-cli/stresskit_cli.py check python -m my_server
```

### Load-test before deployment

Add `mcp-ops` to check concurrency handling:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target my-server -p mcp-core -p mcp-ops
```

### CI integration

Use `--json` and check the exit code:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target my-server --json > report.json
# Exit code 0 = pass, 1 = warnings, 2 = failures, 3 = errors
```

### Test all your servers at once

```bash
python engines/stresskit-cli/stresskit_cli.py check --all --json
```

## Troubleshooting

### "No targets specified"

You need to provide a target. Either pass a command after `check`, use `--target <name>`, or use `--all`:

```bash
python engines/stresskit-cli/stresskit_cli.py check --target my-server
```

### Most checks show SKIP

This usually means fixtures are not configured. Add an `invoke_smoke` fixture to your target in `stresskit.targets.json` so StressKit knows which tool to call.

### Connection errors

If StressKit cannot connect to the server, you get a `STRESSKIT.TARGET_UNREACHABLE` finding. Verify that your server command is correct and the server starts successfully when launched manually.

### "Profile not recognized"

Valid profiles are: `mcp-core`, `mcp-ops`, `mcp-secure`, `mcp-trust`. Check spelling and use the exact name with `-p`.

### Score is low but server seems fine

Check which finding codes appeared. Some findings (like `MCP.CORE.INVALID_ERROR_FORMAT`) indicate protocol-level issues that may not affect normal use but do affect interoperability. The score reflects standards compliance, not just whether the server works in a specific client.

### Timeout errors during concurrency ramp

The `ops.concurrency_ramp` check sends 25 requests per tier across tiers 1 through 16. If your server is slow or single-threaded, timeouts at higher tiers are expected. A timeout rate above 10% at any tier triggers a FAIL finding. Consider increasing the `--timeout` value or adding the `timeout_ms` field to your target configuration.

## Next steps

- Read the [Getting Started](../getting-started/) guide for target configuration details
- See the [Reference](../reference/) for the full list of finding codes and report schema
