---
title: CLI Reference
description: All ConsensusOS CLI commands.
sidebar:
  order: 5
---

ConsensusOS provides a CLI for common operations. All commands run locally with zero network egress.

## Commands

| Command | Description |
|---------|-------------|
| `npx consensusos doctor` | Run health checks across all registered plugins |
| `npx consensusos verify` | Verify release artifact integrity |
| `npx consensusos config` | Configuration validation, diff, and migration |
| `npx consensusos status` | System status overview |
| `npx consensusos plugins` | List loaded plugins with version and capability info |
| `npx consensusos adapters` | List and query registered chain adapters |
| `npx consensusos help` | Show help message with all available commands |

## Examples

### Health check

```bash
npx consensusos doctor
```

Runs the HealthSentinel plugin's check routine against all registered nodes, reporting heartbeat status and any detected issues.

### Release verification

```bash
npx consensusos verify
```

Uses the ReleaseVerifier plugin to check artifact hashes against expected values.

### Configuration management

```bash
npx consensusos config
```

Runs the ConfigGuardian plugin's schema validation and reports any configuration drift or migration opportunities.

### Config subcommands

The `config` command accepts subcommands:

```bash
npx consensusos config validate   # Validate configuration schema (default)
npx consensusos config version    # Show current config version
npx consensusos config history    # Show config change history
```

### System status

```bash
npx consensusos status
```

Shows the number of loaded plugins, their current state (registered/initialized/started/stopped/error), event history count, and registered invariants.

### Plugin inspection

```bash
npx consensusos plugins           # List all loaded plugins with state
```

### Adapter queries

```bash
npx consensusos adapters          # List registered chain adapters
npx consensusos adapters info     # Show connection status and chain info
```

## Flags

| Flag | Description |
|------|-------------|
| `--version`, `-V` | Print the ConsensusOS version and exit |
| `--help` | Show the help message (same as `help` command) |
