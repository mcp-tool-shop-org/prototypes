# VectorCaliper Interaction Contract

This document specifies what interactive features promise and what they guarantee.

## Core Principle

> **Interactions reveal, not modify.**

All interactive features in VectorCaliper are **read-only** with respect to the underlying state and semantics. Interactions help you see and understand the data—they never change what the data means.

---

## 1. Semantic Hover (Tooltips)

### Promise
When you hover over a glyph, you see the exact state variables that produced it.

### Guarantees
- **Traceability**: Every tooltip value comes directly from the state schema
- **Byte-for-byte accuracy**: Descriptions match `VARIABLE_METADATA` exactly
- **No computation**: Tooltips display raw values, not derived metrics
- **No interpretation**: Values are shown without judgment (no "good"/"bad")

### What It Does NOT Do
- Modify the underlying state
- Compute or suggest "improvements"
- Show values not present in the original state

### API
```typescript
import { generateTooltipContent, VARIABLE_METADATA } from '@mcp-tool-shop/vector-caliper';

const content = generateTooltipContent(node, state);
// content.variables[i].description === VARIABLE_METADATA[variable].description
```

---

## 2. Layer Isolation & Focus

### Promise
Toggle semantic layer visibility without affecting coordinates or relationships.

### Guarantees
- **Coordinate invariance**: Hiding/showing layers never moves glyphs
- **Idempotency**: `toggle(off→off)` is a no-op
- **Focus mode**: Dims (not hides) non-focused layers
- **Reversibility**: Any toggle can be undone

### What It Does NOT Do
- Recompute projections
- Change glyph positions
- Remove data (only hides visually)

### API
```typescript
import { LayerController } from '@mcp-tool-shop/vector-caliper';

const controller = new LayerController(layerManager);
controller.attachScene(scene);

// Idempotent operations
controller.setVisible('uncertainty', false);
controller.setVisible('uncertainty', false); // No-op

// Focus mode
controller.enableFocusMode({ dimOpacity: 0.2 });
controller.focusLayer('performance');

// Verify coordinates unchanged
const node = scene.getNode('state:x');
// node.x and node.y are unchanged after all operations
```

---

## 3. Timeline Scrubbing

### Promise
Scrubbing to time `t` always produces the same output.

### Guarantees
- **Determinism**: `setTime(t)` produces identical scene every call
- **No hysteresis**: Approaching `t` from start yields same result as from end
- **Pure function**: Output depends only on `t` and trajectory
- **Snapshot consistency**: Same hash for same time

### What It Does NOT Do
- Remember "path" taken to reach a time
- Interpolate between states (snaps to nearest)
- Modify trajectory data

### API
```typescript
import { TimelineScrubber, testDeterminism, testHysteresis } from '@mcp-tool-shop/vector-caliper';

const scrubber = new TimelineScrubber(trajectory, mapper, projector);

// Deterministic access
scrubber.setTime(25);
const scene1 = scrubber.buildScene();

scrubber.setTime(25);
const scene2 = scrubber.buildScene();
// scene1 and scene2 are identical

// Verification utilities
const result = testDeterminism(scrubber, [0, 10, 20, 30, 40]);
console.log(result.passed); // true

const hysteresisResult = testHysteresis(scrubber, 20);
console.log(hysteresisResult.passed); // true
```

---

## 4. State Comparison

### Promise
Symmetric, descriptive diff between two states.

### Guarantees
- **Symmetry**: `diff(A, B)` shows inverse of `diff(B, A)`
- **Descriptive only**: Uses "higher"/"lower", not "better"/"worse"
- **No prescription**: Never suggests improvements
- **Per-variable granularity**: Shows each variable independently

### What It Does NOT Do
- Rank states as "better" or "worse"
- Suggest which state to use
- Make recommendations
- Interpret domain meaning

### API
```typescript
import { compareStates, verifySymmetry, formatDirection } from '@mcp-tool-shop/vector-caliper';

const compAB = compareStates(stateA, stateB);
const compBA = compareStates(stateB, stateA);

// Symmetry verification
const { symmetric, violations } = verifySymmetry(stateA, stateB);
console.log(symmetric); // true

// Neutral language
console.log(formatDirection('increase')); // "higher" (not "better")
console.log(formatDirection('decrease')); // "lower" (not "worse")
```

---

## Invariants Summary

| Feature | Invariant | Test Method |
|---------|-----------|-------------|
| Tooltips | Schema-exact descriptions | Byte-for-byte comparison |
| Layers | Coordinate invariance | Before/after position check |
| Layers | Idempotent toggle | `off→off` is no-op |
| Timeline | Deterministic output | Snapshot hash comparison |
| Timeline | No hysteresis | Forward/backward same result |
| Comparison | Symmetric diff | `A-B` = `-1 * (B-A)` |
| Comparison | Neutral language | Regex check for value words |

---

## Diagnostic Logging

VectorCaliper provides diagnostic utilities for debugging interactions.

### What Gets Logged

1. **Tooltip Access**
   - Node ID accessed
   - State ID retrieved
   - Variables extracted

2. **Layer Changes**
   - Layer ID toggled
   - Previous visibility state
   - New visibility state

3. **Timeline Navigation**
   - Time value set
   - Current index
   - Snapshot hash

4. **State Comparisons**
   - State IDs compared
   - Number of changes by category
   - Symmetry verification result

### Enabling Diagnostics

```typescript
// Enable console logging
import { DiagnosticLogger } from '@mcp-tool-shop/vector-caliper';

const logger = new DiagnosticLogger({ verbose: true });

// Attach to controller
controller.setDiagnostics(logger);

// Export log
const log = logger.exportLog();
console.log(JSON.stringify(log, null, 2));
```

---

## Testing Your Interactive Features

### Verify Tooltip Consistency
```typescript
import { VARIABLE_METADATA, generateTooltipContent } from '@mcp-tool-shop/vector-caliper';

const content = generateTooltipContent(node, state);

for (const variable of content.variables) {
  const meta = Object.entries(VARIABLE_METADATA).find(
    ([_, m]) => m.name === variable.name
  );

  if (meta) {
    assert(variable.description === meta[1].description);
  }
}
```

### Verify Layer Coordinate Invariance
```typescript
const nodeBefore = scene.getNode('state:test');
controller.toggle('uncertainty');
const nodeAfter = scene.getNode('state:test');

assert(nodeBefore.x === nodeAfter.x);
assert(nodeBefore.y === nodeAfter.y);
```

### Verify Timeline Determinism
```typescript
const times = [0, 10, 20, 30, 40];
const result = testDeterminism(scrubber, times, 5);

assert(result.passed);
assert(result.failures.length === 0);
```

### Verify Comparison Symmetry
```typescript
const { symmetric, violations } = verifySymmetry(stateA, stateB);

assert(symmetric);
assert(violations.length === 0);
```

---

## Version

This contract applies to VectorCaliper Phase 2 (v0.2.x).

Changes to invariants will be documented here with the version that introduced them.

| Version | Change |
|---------|--------|
| 0.1.0 | Initial Phase 1 release |
| 0.2.0 | Phase 2 interactive features |
