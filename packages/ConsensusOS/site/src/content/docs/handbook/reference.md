---
title: API Reference
description: Full API surface, exports, and security model.
sidebar:
  order: 6
---

## Core exports

| Export | Description |
|--------|-------------|
| `CoreLoader` | Plugin lifecycle orchestrator — register, boot, shutdown |
| `CoreEventBus` | Ordered, typed, replayable event bus with wildcard subscriptions |
| `CoreInvariantEngine` | Fail-closed invariant engine with append-only registration |
| `createLogger(scope)` | Structured logger scoped to a module |
| `CoreStateRegistry` | Versioned, append-only state store with snapshot/restore |

## Module factories

| Factory | Purpose |
|---------|---------|
| `createHealthSentinel()` | Node health monitoring via heartbeats |
| `createReleaseVerifier()` | Software release hash verification |
| `createConfigGuardian()` | Configuration schema validation and migration |
| `createSandboxPlugin()` | Isolated simulation, replay, and amendment engine |
| `createGovernorPlugin()` | Token-based execution, policy enforcement, build queue |

## Adapter factories

| Factory | Chain |
|---------|-------|
| `createXrplAdapter()` | XRPL |
| `createEthereumAdapter()` | Ethereum |
| `createCosmosAdapter()` | Cosmos |

## Plugin SDK exports

| Export | Description |
|--------|-------------|
| `BasePlugin` | Abstract base class with lifecycle defaults |
| `ManifestBuilder` | Fluent builder for type-safe plugin manifests |
| `validatePlugin()` | Pre-registration validation |
| `AttestationPipeline` | Release attestation and build provenance |

## Governor exports

| Export | Description |
|--------|-------------|
| `GovernorPlugin` | Top-level governor orchestrator (token issuance, policy, build queue) |
| `TokenIssuer` | Issues and manages execution tokens with resource limits |
| `PolicyEngine` | Declarative rule engine that gates token requests (allow/deny/throttle) |
| `BuildQueue` | Priority-ordered task queue drained against execution tokens |
| `AuditLog` | Immutable audit trail for all governor actions |

## Sandbox exports

| Export | Description |
|--------|-------------|
| `SandboxPlugin` | Isolated simulation, replay, and amendment engine |
| `ReplayEngine` | Deterministic event replay from event bus history |
| `AmendmentSimulator` | Simulate protocol amendments and their state effects |
| `SnapshotSerializer` | Serialize and restore sandbox state snapshots |
| `InMemoryContainerRuntime` | In-memory container runtime for isolated execution |

## Subpath exports

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

## Testing

353 tests across four categories:

| Category | Tests | Coverage |
|----------|-------|----------|
| Architecture | 16 | Structural invariant enforcement |
| Security | 27 | Abuse resistance and determinism |
| Stress | 22 | Edge cases and throughput |
| Unit | 288 | Component-level coverage |

```bash
npm test         # Full suite
npx vitest       # Watch mode
```

## Security model

| Aspect | Detail |
|--------|--------|
| **Data accessed** | In-memory state for governance tokens, audit logs, policy evaluation |
| **Data NOT accessed** | No network egress, no telemetry, no cloud services, no credentials |
| **Permissions** | Standard Node.js process — no elevated permissions required |
| **Dependencies** | Zero runtime dependencies |
