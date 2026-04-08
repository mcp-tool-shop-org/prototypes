---
title: How It Works
description: The dual-witness architecture — how Registry and Legacy engines independently validate every transition, and why both must agree.
sidebar:
  order: 3
---

This page explains the internal mechanics of Registrum: how state transitions flow through the system, what the 11 structural invariants enforce, and how two independent engines collaborate to produce a single verdict.

## The Structural Registrar

The `StructuralRegistrar` is the sole constitutional authority in Registrum. Every state transition flows through it. Nothing bypasses it.

The registrar performs four functions:

1. **Validates** all state transitions against 11 structural invariants
2. **Enforces** identity, lineage, and ordering constraints
3. **Guarantees** determinism and traceability for every decision
4. **Surfaces** violations without resolving them (fail-closed behavior)

When you call `registrar.register(transition)`, the registrar evaluates the transition against every applicable invariant. If all pass, the transition is accepted and assigned a monotonic order index. If any fail, the transition is refused and you receive a structured verdict listing every violated invariant.

## The 11 Invariants

Registrum enforces exactly 11 structural invariants, organized into three classes:

### Identity invariants (3)

Identity invariants ensure that every state in the system is uniquely and permanently identifiable.

| # | What it enforces |
|---|------------------|
| A.1 | Identifiers are **immutable** — a transition may not alter the identity of an existing state |
| A.2 | Every state must declare an **explicit**, non-empty identity |
| A.3 | No two registered states may share the same identity (**unique**) |

These invariants mean you can always point to a specific state and know exactly what it contains. There is no ambiguity about which state is which.

### Lineage invariants (4)

Lineage invariants ensure that the parentage chain between states remains valid and traceable.

| # | What it enforces |
|---|------------------|
| B.1 | Every transition must **explicitly declare** its parent state, except for root states |
| B.2 | A transition's parent state must **exist** and be registered |
| B.3 | A transition may reference only one parent state (**single-parent**) |
| B.4 | Every accepted transition must extend an **unbroken lineage chain** (continuous) |

These invariants mean you can always reconstruct how a state came to exist. The full history of derivation is preserved.

### Ordering invariants (4)

Ordering invariants ensure that the sequence of accepted transitions is deterministic and verifiable.

| # | What it enforces |
|---|------------------|
| C.1 | All accepted transitions must be **totally ordered** |
| C.2 | Ordering must be **deterministic** given identical inputs |
| C.3 | Order indices must increase **monotonically** |
| C.4 | Ordering must not depend on state content or meaning (**non-semantic**) |

These invariants mean the sequence of events is unambiguous. Given a snapshot, any party can verify the exact order in which transitions were accepted.

## Dual constitutional witnesses

Registrum maintains two independent invariant engines that evaluate every transition:

| Witness | Role | Implementation |
|---------|------|----------------|
| **Registry** | Primary authority | Compiled RPEG v1 DSL |
| **Legacy** | Secondary witness | TypeScript predicates |

Since Phase H, **Registry is the default constitutional engine.** Legacy remains as an independent secondary witness.

### Why two witnesses?

The dual-witness architecture is a safety and legibility feature. At runtime, only one engine evaluates each transition (based on the operating mode). The equivalence guarantee comes from the parity test suite:

- **Agreement is proven at test time.** The 85 parity tests run identical transitions through both engines and compare verdicts. Any disagreement fails the test suite, blocking release.
- **Independence is intentional.** The Registry engine (compiled DSL) and Legacy engine (TypeScript predicates) are implemented in fundamentally different ways. Their agreement across the full invariant space proves correctness more robustly than either implementation alone.
- **Both remain available.** You can choose either mode in production knowing that behavioral equivalence has been formally established by the parity harness.

This is not technical debt or a transitional architecture. Dual-witness mode is indefinite. There is no plan to remove either witness.

### Parity evidence

The behavioral equivalence between Registry and Legacy is proven by 85 parity tests:

- **Invariant parity tests** across all classes (identity, lineage, ordering, metadata) -- the same transition is evaluated by both engines and the verdicts are compared
- **Persistence parity tests** verifying temporal stability -- snapshots produce identical results regardless of which engine created them
- **Registry-mode parity tests** validating the compiled DSL against TypeScript predicates
- **Replay parity** -- live execution and replayed execution produce identical results across both engines

## State transition flow

Here is the complete flow when you register a transition:

1. You call `registrar.register({ from, to })` with the source state (or `null` for a root) and the target state.
2. The registrar delegates to the active engine based on the operating mode:
   - In **registry mode** (default): The compiled RPEG v1 DSL evaluates all 11 invariants.
   - In **legacy mode**: TypeScript predicate functions evaluate all 11 invariants.
3. The engine evaluates every applicable invariant against the transition:
   - **All pass:** The transition is accepted. It receives a monotonic order index and is recorded in the registrar's history.
   - **Any fail:** The transition is refused. You receive a structured verdict with all violated invariants listed.
   - **HALT-level violation:** Critical failure indicating potential corruption.

The dual-witness guarantee is enforced through the **85 parity tests** in the test suite, which run every transition through both engines and verify that they reach identical verdicts. This compile-time parity proof means you can trust either engine in production because they have been proven equivalent across the full invariant space.

## Persistence layer

Registrum provides three persistence capabilities:

### Snapshot

Call `registrar.snapshot()` to produce a `RegistrarSnapshotV1` -- a versioned, deterministically serialized representation of the registrar's structural state. Snapshots contain the registered state IDs, the lineage map (parent relationships), and the ordering assignments. They deliberately exclude semantic data (`state.data`), derived metrics, and caches.

### Replay

Given a snapshot, you can create a fresh `StructuralRegistrar` and replay every transition from the snapshot. Replay is read-only re-execution that proves temporal determinism: the new registrar reaches the exact same state as the original.

### Rehydrate

Snapshots can be used to restore a registrar to a previous state. Because everything is deterministic, rehydration produces a registrar that is functionally identical to the one that created the snapshot.

These three capabilities together mean that every structural judgment Registrum has ever made is reproducible, context-independent, and verifiable by any party with the snapshot.
