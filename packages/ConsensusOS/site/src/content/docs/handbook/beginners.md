---
title: Beginners Guide
description: Everything you need to know to get started with ConsensusOS from scratch.
sidebar:
  order: 99
---

## What is this tool?

ConsensusOS is a modular, zero-dependency control plane for multi-chain consensus governance. It provides a plugin-based architecture where every module communicates through a shared event bus, every state transition is gated by fail-closed invariants, and the entire system history is deterministically replayable.

In practical terms, ConsensusOS helps teams running multi-chain infrastructure (XRPL, Ethereum, Cosmos, or custom networks) manage node health, release verification, configuration changes, resource allocation, and policy enforcement from a single, auditable system.

It is **not** a blockchain node, a wallet, or a smart contract framework. It is the governance layer that sits alongside your infrastructure to enforce rules and track state.

## Who is this for?

- **Infrastructure teams** running multi-chain validator or node infrastructure who need structured governance over configuration changes and releases
- **DevOps engineers** who want fail-closed invariant checks before deploying changes to distributed systems
- **Platform teams** building internal tooling around blockchain networks who need a plugin-extensible control plane
- **Developers** exploring consensus governance patterns who want a zero-dependency reference implementation

You do **not** need blockchain expertise to use ConsensusOS. The core concepts (event bus, invariants, plugins, resource tokens) are general-purpose distributed systems patterns.

## Prerequisites

- **Node.js 18 or later** (check with `node --version`)
- **npm** (bundled with Node.js)
- A terminal (any OS: macOS, Linux, Windows)
- Basic familiarity with TypeScript or JavaScript

No other tools, databases, or cloud services are required. ConsensusOS has zero runtime dependencies.

## Your first 5 minutes

**1. Install the package**

```bash
npm install @mcptoolshop/consensus-os
```

**2. Create a file called `demo.ts`**

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
} from "@mcptoolshop/consensus-os";

const loader = new CoreLoader();

loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());

await loader.boot();

// Check system status
console.log("Plugins loaded:", loader.pluginIds());
console.log("Event count:", loader.events.history().length);

// Check invariants before a hypothetical deploy
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Deploy allowed:", verdict.allowed);

await loader.shutdown();
console.log("Done.");
```

**3. Run it**

```bash
npx tsx demo.ts
```

You should see log output showing the boot sequence, loaded plugins, event count, invariant verdict, and a clean shutdown.

**4. Try the CLI**

```bash
npx consensusos status    # See loaded plugins and system state
npx consensusos doctor    # Run health checks
npx consensusos help      # See all available commands
```

**5. Write a custom plugin**

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class PingPlugin extends BasePlugin {
  readonly manifest = ManifestBuilder.create("ping")
    .name("Ping")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.emit("ping.ready", { message: "pong" });
    this.log.info("Ping plugin started");
  }
}
```

Register it with `loader.register(new PingPlugin())` before calling `loader.boot()`.

## Common mistakes

**Calling plugin methods directly instead of using the event bus.**
Plugins are designed to communicate exclusively through the event bus. Calling methods on another plugin instance bypasses the deterministic replay guarantees and invariant checks.

**Forgetting to call `loader.boot()` after registration.**
Registering plugins only queues them. The `boot()` method resolves dependencies, initializes, and starts all plugins. Without it, nothing runs.

**Registering plugins with duplicate IDs.**
Each plugin must have a unique `manifest.id`. Attempting to register two plugins with the same ID throws an error.

**Circular dependencies between plugins.**
The loader uses topological sorting (Kahn's algorithm) to determine boot order. If plugin A depends on plugin B and B depends on A, boot fails with a circular dependency error. Design dependency graphs as directed acyclic graphs.

**Assuming invariant checks are optional.**
The invariant engine is fail-closed by design. If an invariant check function throws an exception, it counts as a failure, and the transition is rejected. Always handle errors inside invariant check functions.

**Not shutting down gracefully.**
Always call `loader.shutdown()` when done. Shutdown runs in reverse boot order and calls `stop()` then `destroy()` on each plugin, ensuring clean resource release.

## Next steps

- **[Getting Started](/ConsensusOS/handbook/getting-started/)** — Deeper walkthrough with event subscriptions and invariant checks
- **[Architecture](/ConsensusOS/handbook/architecture/)** — Understand the core layer, event bus, invariant engine, governor, and state registry
- **[Plugins](/ConsensusOS/handbook/plugins/)** — Learn the full plugin lifecycle and SDK
- **[Adapters](/ConsensusOS/handbook/adapters/)** — Connect to XRPL, Ethereum, or Cosmos networks
- **[CLI Reference](/ConsensusOS/handbook/cli/)** — All CLI commands and flags
- **[API Reference](/ConsensusOS/handbook/reference/)** — Full export surface, types, and security model

## Glossary

| Term | Definition |
|------|------------|
| **Control plane** | The management layer that governs how a system operates, distinct from the data plane that processes actual traffic |
| **Plugin** | A self-contained module that implements the `Plugin` interface (manifest, init, start, stop, destroy) and communicates through the event bus |
| **Event bus** | The central communication channel (`CoreEventBus`) where plugins publish and subscribe to typed, ordered events |
| **Invariant** | A named boolean predicate registered with the `CoreInvariantEngine` that must hold true before any state transition is allowed |
| **Fail-closed** | A design principle where the system defaults to rejecting operations when the outcome is uncertain (e.g., if an invariant check throws, the transition is denied) |
| **Deterministic replay** | The ability to reproduce any system state by replaying the ordered event log from the event bus |
| **CoreLoader** | The orchestrator that manages plugin registration, dependency resolution (topological sort), and lifecycle (init, start, stop, destroy) |
| **Execution token** | A resource permit issued by the Governor layer that authorizes CPU, memory, and time-bounded execution |
| **Governor** | The resource control layer consisting of TokenIssuer, PolicyEngine, BuildQueue, and AuditLog |
| **PolicyEngine** | Evaluates declarative rules against token requests, returning allow, deny, or throttle verdicts |
| **BuildQueue** | A priority-ordered queue of tasks that are drained against execution tokens |
| **Manifest** | Metadata that every plugin declares: id, name, version, capabilities, and optional dependencies |
| **ManifestBuilder** | A fluent builder class for constructing type-safe plugin manifests |
| **Adapter** | A plugin that connects ConsensusOS to a blockchain network (XRPL, Ethereum, Cosmos) through the `ChainAdapter` interface |
| **StateRegistry** | A versioned key-value store (`CoreStateRegistry`) with append-only transition logging and snapshot/restore |
| **AttestationPipeline** | A CI/CD tool that creates tamper-evident records proving build provenance and artifact integrity |
