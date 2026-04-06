---
title: Reference
description: Configuration, project structure, and security scope.
sidebar:
  order: 5
---

## Sidecar configuration

The desktop app reads `appsettings.json` under the `Attestia` section. These map to `SidecarConfig`:

| Key | Default | Description |
|-----|---------|-------------|
| `Port` | `0` (auto) | Fixed port for the sidecar, or `0` to auto-discover a free port |
| `NodePath` | `null` | Explicit path to `node.exe`; falls back to bundled `assets/node/`, then system `PATH` |
| `ServerEntryPoint` | `null` | Explicit path to `main.js`; falls back to bundled `assets/node/server/dist/main.js` |
| `ApiKey` | `null` | Optional API key sent as `X-Api-Key` header on every request |
| `HealthCheckInterval` | `5s` | How often the sidecar polls `/health` |
| `StartupTimeout` | `30s` | Maximum wait time for the sidecar to become ready |
| `ShutdownTimeout` | `10s` | Maximum wait time for the sidecar process to exit |
| `AutoRestart` | `true` | Whether to restart the sidecar automatically if it crashes |

## Client configuration

When using `Attestia.Client` as a standalone SDK, `AttestiaClientConfig` accepts:

| Key | Default | Description |
|-----|---------|-------------|
| `BaseUrl` | *(required)* | URL of the Attestia backend (e.g., `http://localhost:3100`) |
| `ApiKey` | `null` | Optional API key sent as `X-Api-Key` header |
| `Timeout` | `30s` | HTTP request timeout |
| `MaxRetries` | `3` | Number of retries on 5xx errors (exponential backoff: 200ms, 400ms, 800ms) |

## Desktop views

| View | What it shows |
|------|---------------|
| Dashboard | Real-time overview of active intents, recent events, Merkle root, sidecar status |
| Intents | Full lifecycle — declare, approve, reject, execute, verify; list and filter by status |
| Declare Intent | Form for creating new intent declarations |
| Intent Detail | Single intent view with full status history |
| Proofs | Merkle inclusion proof explorer with one-click verification |
| Reconciliation | Three-way matching results with mismatch drill-down |
| Compliance | Framework mapping and scored compliance reports |
| Events | Immutable event stream with causation tracking |
| Settings | Sidecar configuration and connection management |

## Logging

The desktop app writes rolling log files to `%LOCALAPPDATA%\Attestia\Logs\attestia-{date}.log` via Serilog. Logs rotate daily and retain the last 7 files.

## Security and data scope

| Aspect | Detail |
|--------|--------|
| Data accessed | Intent declarations, Merkle proofs, reconciliation reports via local Node.js sidecar |
| Data NOT accessed | No telemetry, no cloud analytics, no credential storage, no direct blockchain writes |
| Permissions | Network to local sidecar (localhost), file system for config and bundled Node.js |
| API errors | Structured as `{ code, message, details }` via `AttestiaException`; no raw stack traces exposed |

See [SECURITY.md](https://github.com/mcp-tool-shop-org/Attestia-Desktop/blob/main/SECURITY.md) for vulnerability reporting.
