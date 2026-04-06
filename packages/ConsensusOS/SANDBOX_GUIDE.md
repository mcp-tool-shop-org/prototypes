# Sandbox Walkthrough

The sandbox engine provides isolated state simulation, deterministic replay, and amendment testing.

## Components

| Component | File | Purpose |
|-----------|------|---------|
| SnapshotSerializer | `sandbox/snapshot-serializer.ts` | Capture, serialize, verify state snapshots |
| ReplayEngine | `sandbox/replay-engine.ts` | Deterministic event replay |
| AmendmentSimulator | `sandbox/amendment-simulator.ts` | Simulate governance amendments |
| InMemoryRuntime | `sandbox/in-memory-runtime.ts` | Isolated execution runtime |
| SandboxPlugin | `sandbox/sandbox-plugin.ts` | Plugin interface for the sandbox |

## 1. Snapshots

Capture and restore system state:

```typescript
import { SnapshotSerializer } from "./src/modules/sandbox/snapshot-serializer.js";

const serializer = new SnapshotSerializer();

// Capture current state
const snapshot = serializer.capture({
  sessionId: "session-1",
  label: "before-upgrade",
  state: { version: "1.0", nodes: 5, healthy: true },
  events: [], // captured events
});

// Verify integrity (SHA-256 checksum)
console.log(serializer.verify(snapshot)); // true

// Serialize to JSON
const json = serializer.serialize(snapshot);

// Restore from JSON (validates checksum)
const restored = serializer.deserialize(json);

// Compute state diffs
const diff = serializer.diff(
  { version: "1.0", nodes: 5 },
  { version: "1.1", nodes: 6, newFeature: true },
);
// diff.added = [{ key: "newFeature", value: true }]
// diff.changed = [{ key: "version", ... }, { key: "nodes", ... }]
```

## 2. Deterministic Replay

Replay events to reproduce system state:

```typescript
import { ReplayEngine } from "./src/modules/sandbox/replay-engine.js";

const engine = new ReplayEngine();

// Register event handlers (must be pure functions)
engine.on("counter.increment", (state, event) => ({
  ...state,
  count: (state.count as number ?? 0) + 1,
}));

engine.on("counter.set", (state, event) => ({
  ...state,
  count: (event.data as { value: number }).value,
}));

// Replay a sequence of events
const result = await engine.replay({
  events: [
    { topic: "counter.increment", source: "test", timestamp: "...", sequence: 1, data: {} },
    { topic: "counter.increment", source: "test", timestamp: "...", sequence: 2, data: {} },
    { topic: "counter.set", source: "test", timestamp: "...", sequence: 3, data: { value: 42 } },
  ],
  initialState: { count: 0 },
});

console.log(result.finalState);     // { count: 42 }
console.log(result.eventsProcessed); // 3
console.log(result.diffs);          // Per-step state changes

// Partial replay
const partial = await engine.replay({
  events: [...allEvents],
  initialState: {},
  maxEvents: 10,        // Stop after 10 events
  stopAtSequence: 50,   // Or stop at sequence 50
});

// Compare two event streams
const { identical, diffA, diffB } = await engine.replayAndCompare(
  eventsFromNodeA,
  eventsFromNodeB,
  sharedInitialState,
);
```

## 3. Amendment Simulation

Test governance amendments before applying them:

```typescript
import { AmendmentSimulator } from "./src/modules/sandbox/amendment-simulator.js";

const simulator = new AmendmentSimulator();

// Define amendments
const amendments = [
  {
    id: "increase-max-nodes",
    description: "Raise max node count from 10 to 50",
    apply: (state) => ({ ...state, maxNodes: 50 }),
    rollback: (state) => ({ ...state, maxNodes: 10 }),
  },
];

// Simulate
const result = await simulator.simulate({
  amendments,
  initialState: { maxNodes: 10, nodes: 5 },
  validators: [
    (state) => (state.maxNodes as number) <= 100, // Must stay under 100
    (state) => (state.nodes as number) <= (state.maxNodes as number), // Nodes < max
  ],
});

console.log(result.success);       // true
console.log(result.finalState);    // { maxNodes: 50, nodes: 5 }
console.log(result.appliedCount);  // 1
```

## 4. In-Memory Runtime

Isolated execution environment:

```typescript
import { InMemoryRuntime } from "./src/modules/sandbox/in-memory-runtime.js";

const runtime = new InMemoryRuntime();

// Create an isolated session
const session = runtime.createSession("test-session");

// Execute in isolation (state changes are scoped)
session.setState("key", "value");
console.log(session.getState("key")); // "value"

// Destroy session (cleans up all state)
runtime.destroySession("test-session");
```

## Key Properties

| Property | Guarantee |
|----------|-----------|
| **Determinism** | Same events + same initial state → same final state |
| **Isolation** | Sandbox state is cloned; original is never mutated |
| **Integrity** | Snapshots are SHA-256 checksummed; tampering is detected |
| **Observability** | Per-step diffs are computed during replay |
| **Safety** | Amendment rollback is supported; validators gate application |
