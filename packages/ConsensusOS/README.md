<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> Part of [MCP Tool Shop](https://mcptoolshop.com)

**Modular, zero-dependency control plane for multi-chain consensus governance.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## Why ConsensusOS?

Running multi-chain infrastructure means trusting nodes you don't fully control, shipping releases that must not diverge, and governing configuration changes across networks that never sleep. Most teams glue this together with ad-hoc scripts and hope for the best.

ConsensusOS replaces that hope with a **plugin-based control plane** where every module communicates through a shared event bus, every state transition is gated by fail-closed invariants, and the entire system history is deterministically replayable.

- **Zero production dependencies** — nothing in your supply chain you didn't write.
- **Frozen Plugin API v1** — stable contract that won't break your integrations.
- **Fail-closed invariants** — invalid transitions are always rejected, never partially applied.
- **Deterministic replay** — reproduce any system state from event history.
- **Resource-bounded execution** — CPU, memory, and time limits enforced via tokens.
- **Multi-chain adapters** — XRPL, Ethereum, and Cosmos out of the box.

---

## Install

```bash
npm install @mcptoolshop/consensus-os
```

Requires **Node.js 18+**. Zero runtime dependencies.

---

## Quick Start

### Programmatic usage

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
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

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### Build a custom plugin

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### CLI

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
npx consensusos help       # Show help and available commands
```

---

## Architecture

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

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full specification.

---

## API Surface

### Core

| Export | Description |
|--------|-------------|
| `CoreLoader` | Plugin lifecycle orchestrator — register, boot, shutdown |
| `CoreEventBus` | Ordered, typed, replayable event bus with wildcard subscriptions |
| `CoreInvariantEngine` | Fail-closed invariant engine with append-only registration |
| `createLogger(scope)` | Structured logger scoped to a module |
| `CoreStateRegistry` | Versioned, append-only state store with snapshot/restore |

### Modules

| Factory | Purpose |
|---------|---------|
| `createHealthSentinel()` | Node health monitoring via heartbeats |
| `createReleaseVerifier()` | Software release hash verification |
| `createConfigGuardian()` | Configuration schema validation and migration |
| `createSandboxPlugin()` | Isolated simulation, replay, and amendment engine |
| `createGovernorPlugin()` | Token-based execution, policy enforcement, build queue |

### Adapters

| Factory | Chain | Status |
|---------|-------|--------|
| `createXrplAdapter()` | XRPL | Implemented |
| `createEthereumAdapter()` | Ethereum | Implemented |
| `createCosmosAdapter()` | Cosmos | Implemented |

### Plugin SDK

| Export | Description |
|--------|-------------|
| `BasePlugin` | Abstract base class with lifecycle defaults and convenience methods |
| `ManifestBuilder` | Fluent builder for type-safe plugin manifests |
| `validatePlugin()` | Pre-registration validation with errors and warnings |
| `AttestationPipeline` | Release attestation and build provenance |

### Subpath Exports

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## Testing

```bash
npm test         # Full suite (353 tests)
npx vitest       # Watch mode
```

Test categories:
- **Architecture** (16 tests) — structural invariant enforcement
- **Security** (27 tests) — abuse resistance and determinism
- **Stress** (22 tests) — edge cases and throughput
- **Unit** (288 tests) — component-level coverage

---

## Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](QUICKSTART.md) | Get running in 3 minutes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Frozen v1.0 architecture spec |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | How to write a plugin |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | How to create a chain adapter |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | Sandbox, replay, and amendment walkthrough |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | Token execution, policies, build queue |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [THREAT_MODEL.md](THREAT_MODEL.md) | STRIDE threat analysis |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow and PR checklist |
| [BUILD.md](BUILD.md) | Reproducible build and verification |

---

## Support

- **Questions / help:** [Discussions](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Bug reports:** [Issues](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## Security & Data Scope

ConsensusOS is a **local-first, zero-dependency** control plane for multi-chain consensus governance.

- **Data accessed:** In-memory state for governance tokens, audit logs, and policy evaluation. Plugin event bus for inter-module communication.
- **Data NOT accessed:** No network egress. No telemetry. No cloud services. No credential storage. All state is in-memory.
- **Permissions:** None — runs as a standard Node.js process. No elevated permissions required.

Full policy: [SECURITY.md](SECURITY.md) | Threat analysis: [THREAT_MODEL.md](THREAT_MODEL.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
