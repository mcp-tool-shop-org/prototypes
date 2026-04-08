---
title: Getting Started
description: Install Registrum, register your first state transition, and learn the two operating modes.
sidebar:
  order: 1
---

This page walks you through installing Registrum, registering your first state transition, and choosing the right operating mode for your use case.

## Installation

Install from npm:

```bash
npm install @mcptoolshop/registrum
```

Registrum requires Node.js 18 or later. It is a pure TypeScript library with no runtime dependencies. It makes no network requests, touches no databases, and collects no telemetry.

## Your first registration

Every interaction with Registrum flows through the `StructuralRegistrar`. You create one, then register state transitions through it. The registrar validates each transition against 11 structural invariants and returns a structured verdict.

```typescript
import { StructuralRegistrar } from "@mcptoolshop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state (from: null means this is the first state)
// Root states must include isRoot: true in their structure
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { isRoot: true, version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

A few things to notice:

- **`from: null`** indicates a root state — the beginning of a lineage chain.
- **`result.kind`** is always either `"accepted"` or `"rejected"`. There is no ambiguous middle ground.
- **Rejections are informative.** Each violation names the specific invariant that was breached, so you know exactly what went wrong.

## Registering subsequent transitions

Once a root state exists, you can register transitions from it to new states:

```typescript
const second = registrar.register({
  from: "state-1",  // Parent state ID (must be already registered)
  to: { id: "state-1", structure: { version: 2 }, data: {} },
});
```

Note that `from` is a **state ID string**, not a State object. The registrar checks that the parent `state-1` exists, validates identity immutability (the `to.id` must match `from` for non-root transitions), verifies the lineage is acyclic, and confirms ordering remains monotonic.

## Operating modes

Registrum supports two modes, each backed by a different invariant engine:

| Mode | Engine | Best for |
|------|--------|----------|
| `"legacy"` | TypeScript predicates | Quick prototyping, no external dependencies |
| `"registry"` (default) | Compiled RPEG v1 DSL | Production use with full dual-witness validation |

### Legacy mode

Legacy mode uses TypeScript predicate functions to evaluate invariants. It is self-contained and requires no additional setup:

```typescript
const registrar = new StructuralRegistrar({ mode: "legacy" });
```

This is a good starting point for learning Registrum and for prototyping. The invariant behavior is identical — legacy mode enforces the same 11 invariants.

### Registry mode (default)

Registry mode loads a compiled DSL and uses the RPEG v1 engine as the primary evaluator. Behavioral equivalence with the Legacy engine is proven by 85 parity tests in the test suite:

```typescript
import { readFileSync } from "node:fs";
import { StructuralRegistrar } from "@mcptoolshop/registrum";
import { loadInvariantRegistry } from "@mcptoolshop/registrum/registry";

// Load and compile the registry from the invariants JSON file
const raw = JSON.parse(
  readFileSync("node_modules/@mcptoolshop/registrum/invariants/registry.json", "utf-8")
);
const compiledRegistry = loadInvariantRegistry(raw);
const registrar = new StructuralRegistrar({ compiledRegistry });
```

`loadInvariantRegistry()` takes a raw JSON object (the parsed contents of `invariants/registry.json`), validates it, compiles the predicate DSL expressions into ASTs, and returns a frozen `CompiledInvariantRegistry`. Registry mode is the default since Phase H and provides the strongest guarantees because the compiled DSL has been proven equivalent to the TypeScript predicates across 85 parity tests.

## Running the examples

The repository includes example scripts in the `examples/` directory. They require [`tsx`](https://github.com/esbuild-kit/tsx):

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

These examples demonstrate patterns like treating refusals as valuable signals (not just errors), which is central to how Registrum is designed to be used.

## Next steps

- Read [Concepts](/Registrum/handbook/concepts/) to understand the design philosophy
- Dive into [How It Works](/Registrum/handbook/how-it-works/) for the dual-witness architecture
- See the [Reference](/Registrum/handbook/reference/) for the full API
