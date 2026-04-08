---
title: Reference
description: CLI commands, profiles, finding codes, report schema, and architecture for StressKit MCP.
---

## CLI commands

### check

Run profile checks against one or more MCP servers:

```bash
# Ad-hoc: pass the server command directly
python engines/stresskit-cli/stresskit_cli.py check <command> [args...]

# Named target from stresskit.targets.json
python engines/stresskit-cli/stresskit_cli.py check --target <name>

# All enabled targets
python engines/stresskit-cli/stresskit_cli.py check --all
```

Options:

| Flag | Description |
|------|-------------|
| `--target, -t <name>` | Target name from `stresskit.targets.json` |
| `--all` | Run against all enabled targets |
| `--profile, -p <name>` | Profile to run (repeatable). Default: `mcp-core` |
| `--timeout <seconds>` | Request timeout in seconds (default: 30) |
| `--output, -o <path>` | Write report to file |
| `--json` | Output full JSON report to stdout |
| `--dry-run` | Produce placeholder report without connecting |
| `--tag <name>` | Filter targets by tag (requires `--all`, repeatable) |

Exit codes: `0` = pass, `1` = warnings, `2` = failures, `3` = errors.

### version

Show CLI version, schema version, Python version, platform, and available profiles:

```bash
python engines/stresskit-cli/stresskit_cli.py version [--json]
```

### profiles

List available test profiles with check counts:

```bash
python engines/stresskit-cli/stresskit_cli.py profiles [--json]
```

### targets

List configured targets from `stresskit.targets.json`, including fingerprints, fixtures, tags, and duplicate detection:

```bash
python engines/stresskit-cli/stresskit_cli.py targets [--json]
```

### validate

Validate a previously generated report file against the StressKit schema:

```bash
python engines/stresskit-cli/stresskit_cli.py validate <report.json> [--json]
```

## Profiles

Each profile defines a set of checks. The CLI loads profile definitions from `profiles/*.json`.

### mcp-core (Protocol Correctness)

7 checks implemented:

| Check ID | What it tests | Severity on fail |
|----------|--------------|------------------|
| `core.handshake` | Initialize handshake completes with valid capabilities | critical |
| `core.list_tools` | `tools/list` returns valid tool definitions (no duplicates, all have `name`) | high |
| `core.error_format` | Error responses use JSON-RPC format with `code` and `message` | medium |
| `core.capability_honesty` | Advertised capabilities match actual behavior | medium |
| `core.invoke_smoke` | Fixture-defined smoke tool executes successfully | high |
| `core.schema_reject_invalid` | Tools reject invalid input with structured errors (tests up to 5 tools) | medium |
| `core.timeout_behavior` | Server remains healthy after a slow/timed-out call | high |

### mcp-ops (Operational Readiness)

1 check implemented:

| Check ID | What it tests | Severity on fail |
|----------|--------------|------------------|
| `ops.concurrency_ramp` | Stability under increasing concurrency (tiers 1, 2, 4, 8, 16 with 25 requests each) | critical (crash), high (>5% errors at tier 4 or below, >10% timeouts), medium (p99 at tier 8 exceeds 5x baseline, 1-5% errors at higher tiers) |

11 additional checks are defined in the profile but not yet implemented: baseline latency, three concurrency tiers (2, 8, 32), 30-minute soak test, memory ceiling, CPU ceiling, backpressure (flood and sustained), crash recovery (death-restart, death-midrequest), and p99 threshold.

### mcp-secure (Security Posture) -- planned

15 checks defined covering authentication gates (auth required, token validation, passthrough rejection), path traversal, unicode handling, null byte injection, symlink attacks, shell/SQL injection, secret leakage (logs, output, phone-home), size/rate limits, and stack trace exposure.

### mcp-trust (Trust Model) -- planned

11 checks defined covering command transparency, environment declaration, source pinning, signatures, SBOM, first-run docs, trust prompts, permission scope, update safety, and subprocess isolation.

## Finding codes

Findings use namespaced codes. Each code maps to a specific failure condition:

### MCP.CORE.*

| Code | Meaning |
|------|---------|
| `MCP.CORE.HANDSHAKE_FAILED` | Server rejected or failed the initialize handshake |
| `MCP.CORE.HANDSHAKE_TIMEOUT` | Initialize handshake exceeded timeout |
| `MCP.CORE.LIST_TOOLS_FAILED` | `tools/list` returned an error or timed out |
| `MCP.CORE.INVALID_TOOL_SCHEMA` | Tool definitions missing `name` or contain duplicates |
| `MCP.CORE.INVOKE_SMOKE_FAILED` | Smoke tool invocation failed or timed out |
| `MCP.CORE.TIMEOUT_BEHAVIOR_BAD` | Server crashed or became unresponsive after a timeout |
| `MCP.CORE.SCHEMA_REJECT_INVALID_FAILED` | Tools accepted invalid input or crashed on it |
| `MCP.CORE.CAPABILITY_MISMATCH` | Advertised capabilities don't match actual behavior |
| `MCP.CORE.INVALID_ERROR_FORMAT` | Error response missing `code` or `message` fields |

### MCP.OPS.*

| Code | Meaning |
|------|---------|
| `MCP.OPS.CRASH_UNDER_LOAD` | Server crashed during concurrency ramp |
| `MCP.OPS.CONCURRENCY_RAMP_DEGRADES` | Error rate or latency degraded beyond thresholds under load |

### STRESSKIT.*

| Code | Meaning |
|------|---------|
| `STRESSKIT.RUNNER_FAILED` | Internal check runner error |
| `STRESSKIT.CONFIG_INVALID` | Invalid configuration (unknown profile, bad target) |
| `STRESSKIT.TARGET_UNREACHABLE` | Failed to connect to the target server |
| `STRESSKIT.NO_FIXTURE` | Required fixture not configured for the target |

### MCP.SEC.* and MCP.TRUST.*

Defined in profiles but checks are not yet implemented.

## Severity levels

| Level | Weight | Meaning |
|-------|--------|---------|
| `critical` | -25 points | Server is unsafe or broken |
| `high` | -15 points | Significant issue that blocks production use |
| `medium` | -5 points | Notable issue, should be fixed |
| `low` | -1 point | Minor issue or improvement opportunity |
| `info` | 0 points | Informational, no score impact |

The overall score starts at 100 and subtracts weighted deductions. Critical or high findings set the overall status to FAIL; medium findings set it to WARN.

## Report schema

Reports follow `schemas/stresskit.report.schema.v0.1.json`. Top-level structure:

```
schema_version    — "0.1"
generated_at      — ISO 8601 timestamp
stresskit_version — CLI version (e.g. "1.0.1")
run_id            — Unique run identifier
targets[]         — Array of tested targets (transport, identity)
profiles[]        — Array of profiles used (profile_id, version)
summary           — Overall status, score, totals, severity counts
runs[]            — Per-target-per-profile results with check_results
findings[]        — All discovered issues with codes, severity, evidence
metrics           — Latency percentiles, throughput, reliability counters
artifacts[]       — References to repro bundles or other output files
```

## Target configuration

Targets are defined in `stresskit.targets.json`:

```json
{
  "version": "0.1",
  "targets": [
    {
      "name": "my-server",
      "display_name": "My MCP Server",
      "transport": { "kind": "stdio", "command": "python", "args": ["-m", "server"] },
      "env": {},
      "aliases": ["my"],
      "fixtures": {
        "invoke_smoke": { "tool": "ping", "args": {} },
        "invoke_slow":  { "tool": "slow_op", "args": {} }
      },
      "tags": ["local", "python"],
      "enabled": true,
      "timeout_ms": 30000
    }
  ]
}
```

### Target fingerprinting

StressKit computes a SHA-256 fingerprint for each target based on transport kind, resolved command path, args, cwd, env keys (for stdio), or URL (for HTTP). Targets with matching fingerprints are flagged as potential duplicates.

### Fixture fields

Each fixture object supports these fields:

| Field | Type | Description |
|-------|------|-------------|
| `tool` | string | Primary tool name to invoke |
| `args` | object | Arguments to pass to the tool |
| `candidates` | string[] | Fallback tool names if the primary is not found (invoke_smoke only) |
| `expected_error` | boolean | Whether the call is expected to return an error (invoke_error only) |

### Transport types

| Kind | Status | Connection method |
|------|--------|------------------|
| `stdio` | Implemented | Spawns subprocess, communicates via stdin/stdout JSON-RPC |
| `http_sse` | Planned | Server-Sent Events over HTTP |
| `http` | Planned | Standard HTTP JSON-RPC |

## Architecture

StressKit is a Python CLI with four modules:

| Module | Role |
|--------|------|
| `stresskit_cli.py` | CLI entry point, argument parsing, report assembly |
| `mcp_client.py` | Transport-agnostic MCP client (stdio implemented, HTTP planned) |
| `check_runner.py` | Check implementations organized by profile, plus repro bundle generation |
| `target_loader.py` | Target config loading, fingerprinting, alias resolution, fixture management |

## Security model

| Aspect | Detail |
|--------|--------|
| **Data touched** | MCP server connections (stdio). Test results and JSON reports written to disk. |
| **Data NOT touched** | No telemetry. No analytics. No credential storage. No cloud sync. |
| **Permissions** | Network: connects to target MCP servers only (user-configured). Disk: writes JSON reports to output directory. |
| **Network** | Outbound to target MCP servers only. No other network egress. |
| **Telemetry** | None collected or sent. |

## Related projects

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — Security scanner for MCP tools
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — Red team toolkit for scanner validation
