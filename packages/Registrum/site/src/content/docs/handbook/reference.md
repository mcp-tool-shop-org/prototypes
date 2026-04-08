---
title: Reference
description: Complete API reference for StructuralRegistrar, exported types, invariant utilities, and the persistence layer.
sidebar:
  order: 6
---

This page documents the complete public API surface of Registrum: the core class, all exported types, invariant lookup utilities, and the persistence layer.

## Core exports

All primary exports are available from the main package entry point:

```typescript
import {
  // Implementation
  StructuralRegistrar,

  // Invariants
  INITIAL_INVARIANTS,
  getInvariantsByScope,
  getInvariantById,

  // Type guards and helpers
  isState,
  isTransition,
  toInvariantInput,

  // Version
  REGISTRUM_VERSION,
} from "@mcptoolshop/registrum";
```

Types are available as type-only imports:

```typescript
import type {
  State,
  StateID,
  Transition,
  RegistrationResult,
  ValidationReport,
  Invariant,
  InvariantScope,
  InvariantInput,
  InvariantViolation,
  InvariantDescriptor,
  ViolationClassification,
  FailureMode,
  LineageTrace,
} from "@mcptoolshop/registrum";
```

The registry engine has a separate entry point:

```typescript
import { loadInvariantRegistry } from "@mcptoolshop/registrum/registry";
```

The persistence layer has its own entry point:

```typescript
import {
  serializeSnapshot,
  deserializeSnapshot,
  rehydrate,
  replay,
  compareReplayReports,
  createTransitionRecorder,
} from "@mcptoolshop/registrum/persistence";
```

The attestation module has a separate entry point:

```typescript
import {
  generateAttestationPayload,
  emitAttestation,
  createAttestationHook,
} from "@mcptoolshop/registrum/attestation";
```

## StructuralRegistrar

The central class. All state transitions flow through it.

### Constructor

```typescript
// Legacy mode -- TypeScript predicates only
const registrar = new StructuralRegistrar({ mode: "legacy" });

// Registry mode (default) -- compiled DSL as primary engine
import { readFileSync } from "node:fs";
import { loadInvariantRegistry } from "@mcptoolshop/registrum/registry";

const raw = JSON.parse(readFileSync("path/to/invariants/registry.json", "utf-8"));
const compiledRegistry = loadInvariantRegistry(raw);
const registrar = new StructuralRegistrar({ compiledRegistry });
```

| Option | Type | Description |
|--------|------|-------------|
| `mode` | `"legacy" \| "registry"` | Operating mode. Defaults to `"registry"` when `compiledRegistry` is provided, otherwise must be set to `"legacy"` |
| `invariants` | `Invariant[]` | Custom invariants for legacy mode. Defaults to `INITIAL_INVARIANTS` |
| `compiledRegistry` | `CompiledInvariantRegistry` | Required for registry mode. Load via `loadInvariantRegistry()` |

### Methods

#### `register(transition: Transition): RegistrationResult`

Validate and record a state transition. This is the primary method -- all structural validation happens here.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `transition.from` | `StateID \| null` | Parent state ID, or `null` for a root registration |
| `transition.to` | `State` | Target state to register |
| `transition.metadata` | `Record<string, unknown>` (optional) | Structural metadata (must not contain semantic information) |

**Returns:** A `RegistrationResult` -- either an acceptance or a structured rejection.

**Accepted result:**

```typescript
{
  kind: "accepted",
  stateId: string,                   // The registered state's ID
  orderIndex: number,                // Monotonic position in the acceptance sequence
  appliedInvariants: readonly string[], // IDs of all invariants that were checked
}
```

**Rejected result:**

```typescript
{
  kind: "rejected",
  violations: InvariantViolation[],  // Every invariant that was breached
}
```

#### `validate(target: State | Transition): ValidationReport`

Inspect a State or Transition without registering it. Does not modify registrar state. Useful for dry-run checks, testing, and diagnostics.

Returns a `ValidationReport` with a `valid` boolean and an array of `violations`.

#### `listInvariants(scope?: InvariantScope): InvariantDescriptor[]`

Return active invariants, optionally filtered by scope. Returns descriptors (without predicate functions) for safe serialization. Useful for displaying invariant metadata in external tools.

#### `getLineage(stateId: StateID): LineageTrace`

Return the traceable ancestry of a state. Returns an array of state IDs from the given state to root (most recent first). Returns an empty array if the state is not registered.

#### `snapshot(): RegistrarSnapshotV1`

Produce a deterministic snapshot of the registrar's structural state. The snapshot contains registered state IDs, lineage relationships, and ordering assignments. It deliberately excludes semantic data, derived metrics, and caches. Snapshots use a versioned schema (`"1.0"`) for compatibility verification.

#### `static fromSnapshot(snapshot: unknown, options: RehydrationOptions): StructuralRegistrar`

Rehydrate a registrar from a snapshot. Reconstructs the registrar exactly as it was, or fails completely. Throws on invalid snapshot schema, registry hash mismatch, or mode mismatch. No partial recovery.

## Types

### State

Represents a state in the system. Immutable once registered.

```typescript
interface State {
  readonly id: StateID;                                    // Unique, immutable identifier
  readonly structure: Readonly<Record<string, unknown>>;   // Structural fields (inspected by invariants)
  readonly data: unknown;                                  // Opaque payload (not inspected by registrar)
}
```

The registrar validates invariants against `structure` fields only. The `data` field is completely opaque to the registrar.

### Transition

Represents a proposed state change submitted for validation.

```typescript
interface Transition {
  readonly from: StateID | null;                    // Parent state ID (null = root registration)
  readonly to: State;                                // Target state
  readonly metadata?: Readonly<Record<string, unknown>>;  // Structural metadata only
}
```

Note that `from` is a **state ID string**, not a State object. Use `null` for root states that begin a new lineage chain.

### RegistrationResult

The verdict returned by `register()`. A discriminated union -- always one of two kinds:

```typescript
type RegistrationResult =
  | { kind: "accepted"; stateId: string; orderIndex: number; appliedInvariants: readonly string[] }
  | { kind: "rejected"; violations: readonly InvariantViolation[] };
```

### ValidationReport

The result of `validate()`. Does not include ordering or registration context.

```typescript
interface ValidationReport {
  readonly valid: boolean;
  readonly violations: readonly InvariantViolation[];
}
```

### Invariant

Describes a single structural invariant with its executable predicate.

```typescript
interface Invariant {
  readonly id: string;                                   // e.g., "state.identity.explicit"
  readonly scope: "state" | "transition" | "registration";
  readonly appliesTo: readonly string[];                 // Structural fields this invariant inspects
  readonly predicate: (input: InvariantInput) => boolean;  // Pure function, no side effects
  readonly failureMode: "reject" | "halt";               // What happens on violation
  readonly description: string;                          // Human-readable description
}
```

### InvariantViolation

Describes a specific invariant breach in a rejection verdict.

```typescript
interface InvariantViolation {
  readonly invariantId: string;                          // Which invariant was violated
  readonly classification: "REJECT" | "HALT";            // Severity classification
  readonly message: string;                              // Human-readable explanation
}
```

- `"REJECT"` means the transition is rejected and the system continues normally.
- `"HALT"` indicates a critical violation suggesting systemic corruption that requires immediate attention.

### InvariantDescriptor

A serialization-safe view of an invariant (excludes the predicate function). Returned by `listInvariants()`.

```typescript
interface InvariantDescriptor {
  readonly id: string;
  readonly scope: InvariantScope;
  readonly appliesTo: readonly string[];
  readonly failureMode: FailureMode;
  readonly description: string;
}
```

## Invariant utilities

### `INITIAL_INVARIANTS`

The complete array of all 11 structural invariants. These are the constitutional constraints that every transition is evaluated against.

### `getInvariantsByScope(scope: InvariantScope): Invariant[]`

Filter invariants by their scope:

```typescript
const stateInvariants = getInvariantsByScope("state");           // 1 invariant
const transitionInvariants = getInvariantsByScope("transition"); // 3 invariants
const registrationInvariants = getInvariantsByScope("registration"); // 7 invariants
```

### `getInvariantById(id: string): Invariant | undefined`

Look up a specific invariant by its unique identifier. Returns `undefined` if the ID does not match any known invariant.

```typescript
const inv = getInvariantById("state.identity.explicit");
// inv.scope === "state"
// inv.failureMode === "reject"
```

## Version

### `REGISTRUM_VERSION`

A string constant containing the current version of the Registrum library. Useful for diagnostics and snapshot metadata.

```typescript
import { REGISTRUM_VERSION } from "@mcptoolshop/registrum";
console.log(REGISTRUM_VERSION); // "1.1.1"
```

## Security and data scope

Registrum operates within a deliberately narrow security boundary:

| Aspect | Detail |
|--------|--------|
| **Data touched** | In-memory state transitions, optional JSON snapshots to local filesystem |
| **Data not touched** | No network requests, no external APIs, no databases, no user credentials |
| **Permissions** | Read/write only to user-specified snapshot paths (when persistence is used) |
| **Network** | None -- fully offline library (XRPL attestation disabled by default) |
| **Telemetry** | None collected or sent |

Vulnerability reports should be directed to the process described in `SECURITY.md` in the repository root.
