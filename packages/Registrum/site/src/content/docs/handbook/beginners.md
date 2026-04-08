---
title: Beginner's Guide
description: A step-by-step introduction to Registrum for newcomers -- what it does, when to use it, and how to get running in minutes.
sidebar:
  order: 99
---

This guide is for developers who are new to Registrum and want to understand what it does, why it exists, and how to start using it. No prior knowledge of state machines, invariants, or formal validation is assumed.

## 1. What problem does Registrum solve?

When software systems grow, they accumulate changes. Over time, it becomes hard to answer basic questions: What state is the system in? How did it get there? Can I trust that this sequence of changes is valid?

Most tools address this by adding intelligence -- optimizers, agents, self-healing layers. Registrum takes the opposite approach: it adds **constraints**. It records every state change, validates each one against a fixed set of rules, and refuses anything that would make the system's history unclear or untrustworthy.

Think of Registrum as a notary for your state transitions. It does not decide what changes to make. It stamps valid changes as accepted and rejects invalid ones with a clear explanation of what went wrong.

**Registrum is useful when you need:**

- A provable record of every state change in your system
- Deterministic validation -- the same inputs always produce the same result
- Structured rejections that tell you exactly which rule was broken
- The ability to replay history and verify that past decisions were correct

**Registrum is not useful when you need:**

- A database, ORM, or persistence layer (Registrum is in-memory by default)
- An event sourcing framework (it validates transitions, not commands)
- A state machine with conditional logic or side effects
- Anything that makes decisions on your behalf

## 2. Key terminology

Before diving into code, here are the core terms you will encounter:

| Term | Meaning |
|------|---------|
| **State** | A snapshot of your system at a single moment. Has a unique `id`, a `structure` object (inspected by Registrum), and a `data` field (opaque, ignored by Registrum). |
| **Transition** | A proposed change from one state to another. Has a `from` field (the parent state's ID, or `null` for the first state) and a `to` field (the new state). |
| **Invariant** | A rule that must hold for a transition to be valid. Registrum enforces 11 invariants covering identity, lineage, and ordering. |
| **Registration** | The act of submitting a transition for validation. If all invariants pass, the transition is accepted. If any fail, it is rejected. |
| **Rejection** | A structured verdict listing every invariant that was violated. Rejections are not errors -- they are informative results. |
| **Lineage** | The chain of parent-child relationships between states. Every non-root state has exactly one parent. |
| **Snapshot** | A serializable representation of the registrar's state at a point in time. Can be used for persistence, replay, and auditing. |

## 3. Installation and setup

Registrum requires **Node.js 18 or later** and works with both ESM and TypeScript projects.

Install from npm:

```bash
npm install @mcptoolshop/registrum
```

That is it. Registrum has no runtime dependencies, makes no network requests, and collects no telemetry.

### Verify the installation

```typescript
import { REGISTRUM_VERSION } from "@mcptoolshop/registrum";
console.log(`Registrum v${REGISTRUM_VERSION} installed`);
```

## 4. Your first registration (step-by-step walkthrough)

Let's walk through a complete example, explaining each line.

### Step 1: Create a registrar

The `StructuralRegistrar` is the entry point for all operations. Start with legacy mode, which is self-contained and requires no additional setup:

```typescript
import { StructuralRegistrar } from "@mcptoolshop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });
```

### Step 2: Register a root state

Every lineage chain starts with a root state. A root state has `from: null` (no parent) and its `structure` must include `isRoot: true`:

```typescript
const result = registrar.register({
  from: null,
  to: {
    id: "doc-v1",
    structure: { isRoot: true, version: 1 },
    data: { title: "My Document" },
  },
});

console.log(result.kind); // "accepted"
```

The registrar checked all 11 invariants and accepted the transition. The result includes:

- `stateId` -- the ID of the newly registered state (`"doc-v1"`)
- `orderIndex` -- the position in the total ordering (`0` for the first state)
- `appliedInvariants` -- the list of all invariants that were checked

### Step 3: Register a child transition

Now register a transition from the root state. Note that `from` is a **state ID string**, not a State object. For non-root transitions, the `to.id` must match the `from` ID (identity immutability):

```typescript
const update = registrar.register({
  from: "doc-v1",
  to: {
    id: "doc-v1",
    structure: { version: 2 },
    data: { title: "My Document (revised)" },
  },
});

console.log(update.kind); // "accepted"
```

### Step 4: Trigger a rejection

What happens when a transition violates an invariant? Let's try registering a state whose parent does not exist:

```typescript
const bad = registrar.register({
  from: "nonexistent-parent",
  to: {
    id: "nonexistent-parent",
    structure: { version: 1 },
    data: {},
  },
});

if (bad.kind === "rejected") {
  for (const v of bad.violations) {
    console.log(`Violated: ${v.invariantId} -- ${v.message}`);
  }
}
```

The result has `kind: "rejected"` and a `violations` array listing each broken invariant. This is not an error or exception -- it is a structured verdict telling you exactly what went wrong.

## 5. Common patterns

### Pattern: Treating rejections as valuable signals

In most validation libraries, a failure is an error to be caught and handled. In Registrum, a rejection is a first-class result that carries useful information. Design your code to inspect rejections, not just catch them:

```typescript
const result = registrar.register(transition);

if (result.kind === "accepted") {
  // Proceed with the accepted state
  console.log(`State ${result.stateId} registered at index ${result.orderIndex}`);
} else {
  // Inspect the structured rejection
  const violatedIds = result.violations.map(v => v.invariantId);
  console.log(`Transition rejected by: ${violatedIds.join(", ")}`);

  // Check if any violations are critical (HALT classification)
  const hasCritical = result.violations.some(v => v.classification === "HALT");
  if (hasCritical) {
    console.log("Critical violation detected -- system integrity at risk");
  }
}
```

### Pattern: Dry-run validation

Use `validate()` to check a state or transition without actually registering it. This is useful for preview modes, form validation, or testing:

```typescript
const report = registrar.validate({
  from: null,
  to: { id: "test", structure: { isRoot: true }, data: null },
});

console.log(report.valid);       // true or false
console.log(report.violations);  // [] if valid
```

### Pattern: Inspecting lineage

After registering several transitions, you can trace any state back to its root:

```typescript
const ancestry = registrar.getLineage("doc-v1");
// Returns: ["doc-v1"] for a root state
// Returns: ["child-id", "parent-id", "root-id"] for a deeply nested state
```

### Pattern: Listing invariants

You can inspect which invariants the registrar enforces, optionally filtered by scope:

```typescript
const all = registrar.listInvariants();
console.log(`${all.length} invariants active`); // 11

const stateOnly = registrar.listInvariants("state");
// Returns invariants that apply to individual states
```

## 6. Frequently asked questions

**Q: Do I need to use registry mode in production?**

Legacy mode enforces the same 11 invariants as registry mode and is perfectly suitable for production use. Registry mode uses a compiled RPEG v1 DSL as the primary evaluator. Behavioral equivalence between the two engines is proven by 85 parity tests in the test suite, so you can trust either mode in production. Start with legacy mode for simplicity and switch to registry mode when you want the compiled DSL engine.

**Q: What is the `data` field for?**

The `data` field is opaque to Registrum. It never inspects, validates, or reasons about it. You can store anything there -- application state, serialized objects, or `null`. Only the `structure` field is checked by invariants.

**Q: What happens if I register the same state ID twice?**

Root states (where `from` is `null`) must have unique IDs. Attempting to register a second root state with the same ID triggers the `state.identity.unique` invariant (a HALT-level violation). For non-root transitions, the `to.id` must match the `from` ID to satisfy the identity immutability invariant.

**Q: Can I persist the registrar's state?**

Yes. Call `registrar.snapshot()` to produce a deterministic `RegistrarSnapshotV1`. Use the persistence module (`@mcptoolshop/registrum/persistence`) to serialize, deserialize, and replay snapshots. You can also use `StructuralRegistrar.fromSnapshot()` to reconstruct a registrar from a snapshot.

**Q: Is Registrum suitable for high-throughput systems?**

Registrum prioritizes legibility and correctness over raw throughput. It is an in-memory library with no I/O, so individual operations are fast. However, it is not optimized for millions of transitions per second. For most use cases -- audit systems, state management libraries, governance layers -- performance is not a bottleneck.

**Q: What does "fail-closed" mean?**

When Registrum encounters an invalid transition, it stops and tells you. It does not attempt partial recovery, best-effort processing, or graceful degradation. A transition either passes all applicable invariants or it is rejected with a complete list of violations. This is intentional: ambiguous validation results are more dangerous than clear rejections.

## 7. Next steps

Now that you understand the basics, here is where to go next:

- **[Getting Started](/Registrum/handbook/getting-started/)** -- More detailed installation instructions, operating mode comparison, and running the example scripts
- **[Concepts](/Registrum/handbook/concepts/)** -- The design philosophy behind Registrum and why constraints beat intelligence
- **[How It Works](/Registrum/handbook/how-it-works/)** -- Deep dive into the dual-witness architecture, the 11 invariants, and the persistence layer
- **[Reference](/Registrum/handbook/reference/)** -- Complete API reference for every class, method, type, and utility
- **[Governance](/Registrum/handbook/governance/)** -- How Registrum's constitutional properties are protected
- **[Attestation](/Registrum/handbook/attestation/)** -- Optional external witnessing via XRPL for third-party auditability
