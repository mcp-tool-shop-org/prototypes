---
title: Getting Started
description: Install ConsensusOS and boot the control plane.
sidebar:
  order: 1
---

ConsensusOS is a modular, zero-dependency control plane for multi-chain consensus governance. This guide walks you through installation, booting the system, and running your first health check.

## Installation

```bash
npm install @mcptoolshop/consensus-os
```

Requires Node.js 18+. Zero runtime dependencies.

## Boot the control plane

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();
```

The `CoreLoader` orchestrates the full plugin lifecycle: registration, dependency resolution, initialization, and startup. Boot order is determined by declared dependencies.

## Subscribe to events

```ts
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});
```

The event bus supports wildcard subscriptions, ordered delivery, and deterministic replay.

## Check invariants

```ts
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);
```

The invariant engine is fail-closed — invalid transitions are always rejected, never partially applied.

## Graceful shutdown

```ts
await loader.shutdown();
```

Shutdown happens in reverse boot order, ensuring clean teardown of all plugins.

## CLI quick start

```bash
npx consensusos doctor     # Run health checks
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
```
