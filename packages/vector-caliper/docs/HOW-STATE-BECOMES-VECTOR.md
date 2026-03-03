# How State Becomes a Vector

This document explains the complete pipeline from model state to visual output in VectorCaliper.

## Overview

```
┌─────────────────┐
│   Model State   │  ← Structured data with semantics
│     (JSON)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │  ← Invariants enforced
│                 │     (NaN, bounds, types)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Projection    │  ← High-D → 2D coordinates
│     (PCA)       │     (deterministic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Semantic Mapping│  ← Variables → Visual Channels
│                 │     (1:1 mapping)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scene Graph    │  ← Nodes with stable IDs
│                 │     and bindings
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SVG Renderer   │  ← Vector graphics output
│                 │     (Inkscape compatible)
└─────────────────┘
```

## Step 1: Model State

A model state is a structured representation of your ML model's internal condition:

```typescript
const state = createModelState({
  time: 42,

  // Geometric structure
  geometry: {
    effectiveDimension: 3.2,  // How many "real" dimensions
    anisotropy: 1.8,          // Elongation of representation
    spread: 4.5,              // How spread out points are
    density: 0.7,             // Local clustering
  },

  // Uncertainty quantification
  uncertainty: {
    entropy: 1.5,             // Bits of uncertainty
    margin: 0.4,              // Confidence gap
    calibration: 0.08,        // How trustworthy probabilities are
  },

  // Performance metrics
  performance: {
    accuracy: 0.87,
    loss: 0.13,
  },
});
```

**Key principle:** Every value has explicit bounds, units, and interpretation. The schema enforces this.

## Step 2: Validation

Before any visualization happens, the state is validated:

```typescript
const result = validator.validate(state);
```

### Hard Invariants (throw if violated)
- No NaN values
- Normalized values in [0, 1]
- Positive values ≥ 0
- Bounded values in [min, max]
- Non-empty IDs

### Soft Warnings (returned but don't block)
- Zero spread → "Collapsed representation"
- Perfect accuracy → "Possible overfitting"
- High calibration error → "Unreliable confidences"

**Key principle:** Invalid states never reach the renderer.

## Step 3: Projection

The state is projected from its high-dimensional representation to 2D:

```typescript
const projector = new ProjectionEngine();
projector.fit([state1, state2, state3]);  // Compute projection
const projected = projector.project(state);
```

### Feature Extraction
The state is converted to a 17-dimensional feature vector:
1. `geometry.effectiveDimension`
2. `geometry.anisotropy`
3. `geometry.spread`
4. `geometry.density`
5. `uncertainty.entropy`
6. `uncertainty.margin`
7. `uncertainty.calibration`
8. `uncertainty.epistemic` (or 0)
9. `uncertainty.aleatoric` (or 0)
10. `performance.accuracy`
11. `performance.loss`
12. `performance.taskScore` (or 0)
13. `performance.cost` (or 0)
14. `dynamics.velocity` (or 0)
15. `dynamics.acceleration` (or 0)
16. `dynamics.stability` (or 0)
17. `dynamics.phase` (or 0)

### PCA Projection
Principal Component Analysis reduces to 2D:

```
features[17] → PCA → [x, y]
```

**Key principle:** Same input always produces same output. The projection is deterministic (no random initialization).

## Step 4: Semantic Mapping

Each state variable maps to exactly one visual channel:

```typescript
const mapper = new SemanticMapper();
const channels = mapper.mapAll(state, projected);
```

### The Mapping Table

| Variable | Channel | Function |
|----------|---------|----------|
| projected.x, projected.y | Position | Identity (scaled to viewport) |
| geometry.spread | Radius | `spread / 10 * (maxR - minR) + minR` |
| geometry.effectiveDimension | Hue | `dim / 10 * (360 - 200) + 200` |
| uncertainty.margin | Saturation | Identity (already 0-1) |
| uncertainty.calibration | Opacity | `1 - calibrationError` |
| performance.accuracy | Lightness | `0.3 + accuracy * 0.5` |
| uncertainty.entropy | Jitter | `entropy / 5 * maxJitter` |
| dynamics.stability | Stroke Width | Normalized within bounds |

**Key principle:** No channel is used for two meanings. If you see high saturation, you know it means high confidence margin.

## Step 5: Scene Graph

The mapped values become a scene node:

```typescript
const builder = new SceneBuilder(mapper);
const node = builder.addState(state, projected);
```

### Node Structure

```typescript
{
  type: 'point',
  id: { namespace: 'state', value: 'state:my-state-id' },
  label: 'State my-state-id',
  layer: 'states',

  // From projection
  x: 123.45,
  y: 67.89,

  // From mapping
  shape: 'circle',
  radius: 15.2,
  fill: {
    h: 245,    // Hue from dimension
    s: 0.72,   // Saturation from margin
    l: 0.58,   // Lightness from accuracy
    a: 0.92,   // Alpha from calibration
  },
  stroke: { ... },
  jitter: { amplitude: 3.2, frequency: 0.5 },

  // Traceability
  bindings: [
    { channel: 'saturation', semantic: 'uncertainty.margin', resolved: {...} },
    { channel: 'lightness', semantic: 'performance.accuracy', resolved: {...} },
    // ...
  ],

  meta: {
    stateId: 'my-state-id',
    time: 42,
  },
}
```

**Key principle:** The scene graph is pure data. No rendering code. Can be serialized to JSON.

## Step 6: SVG Output

The scene is rendered to SVG:

```typescript
const renderer = new SVGRenderer({ width: 800, height: 600 });
const svg = renderer.render(scene);
```

### Output Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">

  <!-- VectorCaliper Scene -->
  <!-- Source: VectorCaliper -->

  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Layer: states -->
  <g id="layer-states" inkscape:groupmode="layer" inkscape:label="states">
    <circle
      id="state_my-state-id"
      data-vc-type="point"
      data-vc-layer="states"
      data-vc-state-id="my-state-id"
      data-vc-bindings="saturation:uncertainty.margin;lightness:performance.accuracy"
      cx="423.45" cy="267.89" r="15.20"
      fill="hsl(245, 72%, 58%)"
      stroke="hsl(0, 0%, 20%)" stroke-width="2"
    />
  </g>

</svg>
```

### Data Attributes for Traceability

Every SVG element includes `data-vc-*` attributes:
- `data-vc-type`: Node type (point, path, text, etc.)
- `data-vc-layer`: Semantic layer membership
- `data-vc-state-id`: Original state ID
- `data-vc-bindings`: Which variables control which visuals

**Key principle:** You can always trace a visual element back to the state variable that produced it.

## The Complete Example

```typescript
import {
  createModelState,
  validator,
  ProjectionEngine,
  SemanticMapper,
  SceneBuilder,
  SVGRenderer,
} from '@mcp-tool-shop/vector-caliper';

// 1. Create state
const state = createModelState({
  time: 0,
  geometry: { effectiveDimension: 3, anisotropy: 1.5, spread: 4, density: 0.6 },
  uncertainty: { entropy: 1.2, margin: 0.6, calibration: 0.05 },
  performance: { accuracy: 0.88, loss: 0.12 },
});

// 2. Validate
validator.assertValid(state);

// 3. Project
const projector = new ProjectionEngine();
projector.fit([state]);
const projected = projector.project(state);

// 4. Map semantics to visuals
const mapper = new SemanticMapper();

// 5. Build scene
const builder = new SceneBuilder(mapper);
builder.addState(state, projected);
const scene = builder.getScene();

// 6. Render
const renderer = new SVGRenderer();
const svg = renderer.render(scene);

// Done! svg is a string ready to save or display
```

## Invariants Throughout

1. **Validation**: Invalid states throw before rendering
2. **Projection**: Deterministic (same input → same output)
3. **Mapping**: One channel per meaning, one meaning per channel
4. **Scene Graph**: Serializable, no rendering assumptions
5. **SVG**: All elements traceable to source variables

This pipeline ensures that VectorCaliper visualizations are **reproducible**, **interpretable**, and **scientifically meaningful**.
