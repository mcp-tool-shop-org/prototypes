---
title: Architecture
description: Core layer, plugin SDK, event bus, and invariant engine.
sidebar:
  order: 2
---

ConsensusOS is built as a layered system where every component communicates through a shared event bus and every state transition is gated by fail-closed invariants.

## System layers

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

## Core layer

### CoreLoader
Orchestrates the plugin lifecycle — registration, dependency resolution, initialization, startup, and shutdown. Boot order is determined by declared dependencies. Shutdown happens in reverse order.

### CoreEventBus
Ordered, typed, replayable event bus with wildcard subscriptions. All inter-plugin communication flows through the bus. Events are stored for deterministic replay.

### CoreInvariantEngine
Fail-closed invariant engine with append-only registration. Invariants are registered by plugins and checked before any state transition. If any invariant fails, the transition is rejected entirely.

### Logger
Structured logger scoped to individual modules. Created via `createLogger(scope)`.

## Plugin API v1

The plugin API is **frozen** — once a contract is published, it does not change. This means plugins written against v1 will work with any v1-compatible runtime without modification.

Plugins extend `BasePlugin` and declare their capabilities through `ManifestBuilder`. The manifest specifies name, version, capabilities, and dependencies.

## State Registry

The `CoreStateRegistry` provides a versioned, append-only state store. Every mutation is recorded as an immutable `StateTransition` with a monotonic version number. Plugins use the registry through `get`, `set`, and `delete` operations; the full transition log is available for replay. Point-in-time snapshots can be taken and restored for sandbox simulations.

## Governor layer

Provides resource-bounded execution through four sub-engines:

- **TokenIssuer** — Issues execution tokens with CPU, memory, and timeout limits. Tokens can be consumed, revoked, or auto-expired via TTL. The invariant `governor.resource-limits` ensures total allocation never exceeds configured bounds.
- **PolicyEngine** — Evaluates declarative rules against token requests and current resource usage. Each rule returns `allow`, `deny`, or `throttle`. Built-in rules include CPU threshold, memory threshold, priority throttle, and queue depth checks.
- **BuildQueue** — Priority-ordered task queue. Tasks reference an execution token and are drained by a pluggable `TaskExecutor`. The invariant `governor.queue-depth` prevents unbounded growth.
- **AuditLog** — Immutable, append-only log of every governor action (token issuance, revocation, task lifecycle, policy evaluations).

Default resource limits: 4 CPU cores (4000 millicores), 1 GB memory, 10 concurrent executions, queue depth 100.

## Key design decisions

- **Zero dependencies** — Nothing in the supply chain you didn't write
- **Fail-closed** — Invalid transitions are always rejected, never partially applied
- **Deterministic replay** — Reproduce any system state from event history
- **Resource-bounded** — Execution limits prevent runaway operations
- **Append-only** — Invariants and audit entries cannot be removed at runtime
