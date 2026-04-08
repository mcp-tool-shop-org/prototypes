<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/registrum"><img src="https://img.shields.io/npm/v/@mcptoolshop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>A governed, dual-witness, deterministic registrar with replayable history and optional external attestation.</strong></p>

---

## What Registrum Is

Registrum is a **structural registrar** — a library that records, validates, and orders state transitions under explicit constraints so that structure remains interpretable as entropy accumulates.

| Property | Meaning |
|----------|---------|
| **Structural** | Operates on form, not meaning |
| **Deterministic** | Same inputs → same outputs, always |
| **Fail-closed** | Invalid input causes hard failure, not partial recovery |
| **Replayable** | Historical decisions can be re-executed with identical results |
| **Non-agentic** | Never acts, decides, or optimizes |

**Registrum ensures that change remains legible.**

---

## Why Registrum?

Systems evolve. Entropy accumulates. Structure decays.

Most tools respond to this by adding intelligence — optimizers, agents, self-healing layers. Registrum takes the opposite approach: **it adds constraints**.

- **For library authors** — Embed structural guarantees into state management so consumers inherit legibility for free.
- **For audit-critical systems** — Every state transition is deterministic, replayable, and independently verifiable.
- **For teams resisting complexity** — Registrum refuses invalid transitions with structured verdicts instead of silently degrading.

The result: a system where identity, lineage, and ordering remain inspectable no matter how many changes have occurred.

---

## Core Principle

> **Entropy is allowed. Illegibility is not.**

Registrum does not reduce entropy globally.
It constrains where entropy may exist so that identity, lineage, and structure remain inspectable over time.

---

## What Registrum Is Not

Registrum is explicitly **not**:

- An optimizer, agent, or decision-maker
- A controller, recommender, or intelligence
- Adaptive, learning, or self-healing

It never answers *what matters*.
It only preserves the conditions under which that question remains answerable.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## How Registrum Works

### Structural Registrar

The registrar is the sole constitutional authority:

- Validates all state transitions against **11 structural invariants**
- Enforces identity, lineage, and ordering constraints
- Guarantees determinism and traceability
- Surfaces violations without resolving them (fail-closed)

Everything registers through it. Nothing bypasses it.

### The 11 Invariants

| Class | Count | Purpose |
|-------|-------|---------|
| **Identity** | 3 | Unique, immutable, content-addressed |
| **Lineage** | 4 | Valid parentage, acyclic, traceable |
| **Ordering** | 4 | Monotonic, gap-free, deterministic |

These invariants are constitutional. Changing them requires formal governance.

---

## Dual Constitutional Witnesses

Registrum maintains **two independent invariant engines**:

| Witness | Role | Implementation |
|---------|------|----------------|
| **Registry** | Primary authority | Compiled DSL (RPEG v1) |
| **Legacy** | Secondary witness | TypeScript predicates |

As of Phase H, **registry is the default constitutional engine**.
Legacy remains as an independent secondary witness.

### Why Two Witnesses?

- **Agreement is required** — Both must accept for a transition to be valid
- **Disagreement halts** — Parity divergence stops the system (fail-closed)
- **Independence is intentional** — Neither can override the other

This is a safety and legibility feature, not technical debt.
Dual-mode is indefinite. There is no plan to remove either witness.

### Parity Evidence

85 parity tests prove behavioral equivalence:
- Invariant parity tests across all classes (identity, lineage, ordering, metadata)
- Persistence parity tests (temporal stability)
- Registry-mode parity tests (compiled DSL vs TypeScript predicates)
- Replay parity: live execution produces identical results to replayed execution

---

## History, Replay, and Auditability

| Capability | Description |
|------------|-------------|
| **Snapshot** | Versioned schema (`RegistrarSnapshotV1`), content-addressed hashes, deterministic serialization |
| **Replay** | Read-only re-execution against a fresh registrar — proves temporal determinism |
| **Audit** | Every structural judgment is reproducible, context-independent, and verifiable by any party with the snapshot |

---

## External Attestation (Optional)

Registrum may optionally emit cryptographic attestations to an external immutable ledger (such as XRPL) for public witnessing.

| Property | Value |
|----------|-------|
| Default | Disabled |
| Authority | Non-authoritative (witness only) |
| Effect on behavior | None |

Attestations record *that* Registrum decided.
Registrum decides *what* is valid.

**Authority flows inward. Witness flows outward.**

See:
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — Rationale
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — Specification

---

## Getting Started

### Installation

```bash
npm install @mcptoolshop/registrum
```

### Quick Start

```typescript
import { StructuralRegistrar } from "@mcptoolshop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state (isRoot: true is required for root states)
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { isRoot: true, version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured rejection — the violations name which invariants failed
  console.log(`Rejected: ${result.violations.map((v) => v.invariantId)}`);
}
```

### Modes

| Mode | Engine | When to Use |
|------|--------|-------------|
| `"legacy"` | TypeScript predicates | Quick prototyping, no external deps |
| `"registry"` (default) | Compiled RPEG v1 DSL | Production use with full dual-witness |

```typescript
import { readFileSync } from "node:fs";
import { StructuralRegistrar } from "@mcptoolshop/registrum";
import { loadInvariantRegistry } from "@mcptoolshop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const raw = JSON.parse(
  readFileSync("node_modules/@mcptoolshop/registrum/invariants/registry.json", "utf-8")
);
const compiledRegistry = loadInvariantRegistry(raw);
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### Running Examples

The [`examples/`](examples/) directory contains illustrative demonstrations (not stable API).
They require [`tsx`](https://github.com/esbuild-kit/tsx):

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## API Quick Reference

### Core Exports

```typescript
// Implementation
import { StructuralRegistrar } from "@mcptoolshop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "rejected", ... }
  Invariant,      // { id, scope, predicate, failureMode, ... }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcptoolshop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "state" | "transition" | "registration"
  getInvariantById,       // Lookup by invariant ID
} from "@mcptoolshop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcptoolshop/registrum";
```

### `StructuralRegistrar`

| Method | Returns | Description |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | Validate and record a state transition |
| `validate(target)` | `ValidationReport` | Inspect a State or Transition without registering |
| `listInvariants(scope?)` | `InvariantDescriptor[]` | Return active invariants, optionally filtered by scope |
| `getLineage(stateId)` | `LineageTrace` | Trace state ancestry from most recent to root |
| `snapshot()` | `RegistrarSnapshotV1` | Deterministic, content-addressed snapshot |

---

## Governance

Registrum is governed under a **constitutional model**.

| Principle | Meaning |
|-----------|---------|
| Behavioral guarantees > feature velocity | Correctness takes precedence |
| Evidence-based changes only | No changes without proof |
| Formal process required | Proposals, artifacts, decisions |

### Current Status

- **Phase H**: Complete (registry default, attestation enabled)
- **Governance**: Active and enforced
- **All changes**: Require formal governance process

All future changes are governance decisions, not engineering tasks.

See:
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — Why governance exists
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — What is governed
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — Transition to governance

---

## Project Status

**Registrum has reached a stable end-state.**

| Phase | Status | Evidence |
|-------|--------|----------|
| A–C | Complete | Core registrar, parity harness |
| E | Complete | Persistence, replay, temporal stability |
| G | Complete | Governance framework |
| H | Complete | Registry default, attestation enabled |

**Test coverage**: 282 tests passing across 15 test suites

Development has transitioned to stewardship. Future changes require governance.

See: [`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | Identity definition |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | Formal claims with evidence |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | Full invariant reference |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | Hard failure conditions |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | Temporal guarantees |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | Dual-witness architecture tutorial |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | Snapshot format (constitutional) |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | Dual-witness policy |

---

## Design Ethos

- **Restraint** over power
- **Legibility** over performance
- **Constraints** over heuristics
- **Inspection** over intervention
- **Stopping** over endless extension

Registrum is successful when it becomes boring, dependable, and unsurprising.

---

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | In-memory state transitions, optional JSON snapshots to local filesystem |
| **Data NOT touched** | No network requests, no external APIs, no databases, no user credentials |
| **Permissions** | Read/write only to user-specified snapshot paths (when persistence is used) |
| **Network** | None — fully offline library (XRPL attestation disabled by default) |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Contributing

Registrum follows a governance-first contribution model. All changes require formal proposals with evidence.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution philosophy and process.

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
