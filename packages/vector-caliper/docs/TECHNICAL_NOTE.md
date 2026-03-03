# VectorCaliper: Technical Note

**Version 1.0.0**

---

## Abstract

VectorCaliper is a geometrical debugger for learning dynamics. It provides deterministic, faithful visualization of model-state trajectories during training. This document describes the problem VectorCaliper addresses, its design constraints, the guarantees it provides, and its known limitations.

---

## 1. Problem Statement

During neural network training, practitioners need to understand the evolution of model state. Existing tools typically:

1. **Interpret data** — presenting dashboards with health scores, anomaly detection, or recommendations
2. **Smooth or aggregate** — showing trends rather than exact measurements
3. **Recommend actions** — suggesting hyperparameter changes or early stopping

These approaches conflate measurement with interpretation. A practitioner debugging training dynamics needs to see **what happened**, not what a tool thinks it means.

### 1.1 Requirements

VectorCaliper addresses the need for:

- **Faithful representation** — every visual element traces to a measured variable
- **Determinism** — same input produces same output, byte-for-byte
- **Explicit limits** — rejection rather than silent degradation when limits are exceeded
- **No interpretation** — visual encodings do not imply meaning

---

## 2. Design Constraints

VectorCaliper operates under strict constraints:

### 2.1 Separation of Measurement and Interpretation

The system maintains a strict boundary between:

- **State** — measured variables at a point in time
- **Trajectory** — ordered sequence of states
- **Projection** — deterministic mapping from high-D to 2D
- **Scene Graph** — geometric representation (single source of truth)
- **Renderer** — pixel output

The renderer never invents meaning. All semantics originate from the state.

### 2.2 Forbidden Operations

VectorCaliper does not:

- Compute derived metrics not present in input
- Smooth, interpolate, or aggregate data
- Classify states as healthy/unhealthy
- Recommend actions
- Predict future behavior

### 2.3 Truthful Degradation

When VectorCaliper cannot render all data, it:

- Shows **exact subsets**, never approximations
- Displays **completeness indicators** showing what fraction is visible
- Labels **coarse views** explicitly
- Never presents partial data as complete

---

## 3. Guarantees

VectorCaliper v1.x provides frozen guarantees documented in [VECTORCALIPER_V1_GUARANTEES.md](./VECTORCALIPER_V1_GUARANTEES.md).

### 3.1 State Schema Guarantee

```typescript
interface State {
  readonly id: string;
  readonly step: number;
  readonly timestamp?: number;
  readonly variables: Record<string, number | number[]>;
  readonly metadata?: Record<string, unknown>;
}
```

- State IDs are unique within a trajectory
- Steps are monotonically increasing
- Variables are numeric only (scalars or arrays)
- No derived fields are added by VectorCaliper

### 3.2 Determinism Guarantee

- Same state produces same geometry
- WebGL renderer equals Canvas2D renderer equals SVG output
- Projections use fixed random seeds (PCA: exact eigendecomposition; t-SNE/UMAP: seeded)

### 3.3 Scale Guarantees

| Scale Class | Max States | Memory Limit | Render Budget |
|-------------|------------|--------------|---------------|
| small       | 1,000      | 50 MB        | 16ms/frame    |
| medium      | 10,000     | 200 MB       | 33ms/frame    |
| large       | 100,000    | 500 MB       | 66ms/frame    |
| extreme     | 1,000,000  | 1 GB         | 100ms/frame   |

Exceeding limits results in **rejection**, not degradation.

---

## 4. Architecture

```
Input (JSON)
    │
    ▼
┌─────────────────┐
│   Validation    │  ← Type + range checks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Projection    │  ← High-D → 2D (deterministic)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Semantic Mapper │  ← Variable → visual channel
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scene Graph    │  ← Single source of truth
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Renderer     │  ← WebGL / Canvas2D / SVG
└─────────────────┘
```

### 4.1 Visual Mapping

Each variable maps to exactly one visual channel:

| Variable | Visual Channel |
|----------|----------------|
| Projected x,y | Position |
| geometry.spread | Radius |
| geometry.effectiveDimension | Hue |
| uncertainty.margin | Saturation |
| uncertainty.calibration | Opacity |
| performance.accuracy | Lightness |
| uncertainty.entropy | Jitter |
| dynamics.stability | Stroke width |

**Invariant:** No visual channel encodes two different variables.

---

## 5. Known Limitations

### 5.1 Rendering Limitations

- **2D only** — no 3D visualization
- **Static output** — no animation export
- **Immutable states** — no real-time editing

### 5.2 Scale Limitations

- Maximum 1,000,000 states
- Memory-constrained environments may require smaller limits
- Progressive rendering at large scales

### 5.3 Scope Limitations

VectorCaliper is **not** suitable for:

- Production monitoring
- Automated alerting
- Hyperparameter optimization
- Anomaly detection
- Comparative evaluation (beyond visual overlay)

---

## 6. Reproducibility

### 6.1 Canonical Demo

The repository includes a canonical demo generator:

```bash
npx ts-node demo/canonical-demo.ts
```

This produces deterministic output with SHA256 checksums in the manifest. Running twice produces identical checksums, verifying determinism.

### 6.2 Test Suite

The test suite (1191 tests) verifies all guarantees:

- `tests/budget.test.ts` — Budget enforcement
- `tests/progressive-render.test.ts` — Truthful degradation
- `tests/webgl-renderer.test.ts` — Renderer equivalence
- `tests/streaming.test.ts` — Protocol compliance

---

## 7. Related Work

VectorCaliper differs from existing tools:

| Tool | Purpose | VectorCaliper Difference |
|------|---------|--------------------------|
| TensorBoard | Training dashboard | VC does not interpret or recommend |
| Weights & Biases | Experiment tracking | VC does not track experiments or compare runs |
| Embedding Projector | Embedding visualization | VC visualizes training state, not embeddings |
| Loss landscape tools | Landscape visualization | VC visualizes trajectories, not landscapes |

See [RELATED_WORK.md](./RELATED_WORK.md) for detailed comparison.

---

## 8. Conclusion

VectorCaliper provides faithful, deterministic visualization of training dynamics. By maintaining strict separation between measurement and interpretation, it serves as a microscope rather than a dashboard—showing what happened without telling you what it means.

---

## References

VectorCaliper v1.0.0 Guarantees: [VECTORCALIPER_V1_GUARANTEES.md](./VECTORCALIPER_V1_GUARANTEES.md)

Repository: https://github.com/mcp-tool-shop-org/VectorCaliper
