# VectorCaliper v1.0 Guarantees

This document defines **frozen semantics** for VectorCaliper v1.x releases.

Any change that violates these guarantees requires a **major version bump** (v2.0).

---

## Core Principle

**VectorCaliper shows what happened. It never tells you what it means.**

VectorCaliper is a geometrical debugger, not a dashboard.
It measures, it does not recommend.

---

## Frozen Guarantees

### 1. State Schema (v1)

The canonical state representation is:

```typescript
interface State {
  readonly id: string;
  readonly step: number;
  readonly timestamp?: number;
  readonly variables: Record<string, number | number[]>;
  readonly metadata?: Record<string, unknown>;
}
```

**Guarantees:**
- State IDs are unique within a trajectory
- Steps are monotonically increasing within a trajectory
- Variables are numeric only (scalars or arrays)
- No derived or computed fields are added by VectorCaliper

**What will never happen:**
- Automatic normalization of variable values
- Automatic aggregation or summarization
- Injection of "health" or "quality" metrics

---

### 2. Scene Graph Semantics

The scene graph is the **single source of truth** for visualization.

**Guarantees:**
- Same state → same geometry (modulo pixel precision)
- WebGL renderer ≡ Canvas2D renderer ≡ SVG output
- Scene graph is immutable during render
- Renderers consume but never modify scene graph

**What will never happen:**
- Renderer-specific visual optimizations that alter meaning
- Adaptive simplification without explicit user consent
- Hidden smoothing or interpolation

---

### 3. Projection Semantics

Projections map high-dimensional state to 2D coordinates.

**Guarantees:**
- Projections are deterministic: same input → same output
- PCA uses exact eigendecomposition (no approximation)
- t-SNE uses fixed random seed for reproducibility
- UMAP uses fixed random seed for reproducibility
- Custom projections must be pure functions

**What will never happen:**
- Projection changes based on "interestingness"
- Automatic dimension selection
- Hidden re-projection during interaction

---

### 4. Integration Contract (v1)

Framework adapters (PyTorch, JAX) follow a strict contract.

**Guarantees:**
- Adapters are stateless: they transform, they don't accumulate
- Adapters are removable: VectorCaliper works without any adapter
- Adapters never modify training state
- Adapters emit the same schema regardless of framework

**What will never happen:**
- Adapters that inject callbacks into optimizers
- Adapters that modify gradients or parameters
- Framework-specific visualization semantics

---

### 5. Streaming Protocol (v1)

Real-time streaming follows a strict wire protocol.

**Guarantees:**
- Streaming replay ≡ offline file loading (same visual output)
- Late-arriving states append, never reorder
- Partial trajectories are always visually marked as partial
- Connection drops are visible, not hidden

**What will never happen:**
- Backfilling of "missing" states
- Interpolation between received states
- Silent data loss

---

### 6. Performance Budget Model

Scale is explicit and bounded.

**Scale Classes:**
| Class   | States      | Memory Limit | Render Budget |
|---------|-------------|--------------|---------------|
| small   | ≤ 1,000     | 50 MB        | 16ms/frame    |
| medium  | ≤ 10,000    | 200 MB       | 33ms/frame    |
| large   | ≤ 100,000   | 500 MB       | 66ms/frame    |
| extreme | ≤ 1,000,000 | 1 GB         | 100ms/frame   |

**Guarantees:**
- Exceeding limits results in **rejection**, not silent degradation
- Budget violations produce explicit error messages
- Memory limits are enforced, not advisory
- Render time limits trigger progressive rendering, visibly

**What will never happen:**
- Automatic downsampling without user visibility
- Silent data truncation
- "Smart" data reduction

---

### 7. Interaction Contract

User interactions are constrained by scale.

**Guarantees:**
- Scrub rate limits are explicit (states/second)
- Tooltip debouncing is explicit (milliseconds)
- Selection limits are explicit (max states)
- Autoplay is disabled above large scale

**What will never happen:**
- UI that feels slow without explanation
- Hidden throttling
- Interactions that modify underlying data

---

### 8. Truthful Degradation

When VectorCaliper cannot show everything, it shows **exactly what it shows**.

**Guarantees:**
- Progressive rendering shows exact subsets, never approximations
- Subset selection strategy is visible (uniform, endpoints, keyframes)
- Completeness percentage is always displayed
- "Coarse" views are labelled as coarse

**What will never happen:**
- Smoothed or interpolated previews
- Density-based sampling without disclosure
- Approximations presented as exact views

---

## What VectorCaliper Is

- A measurement instrument for learning dynamics
- A geometrical debugger for optimization trajectories
- An inspection tool for training state evolution

## What VectorCaliper Is Not

- A training dashboard
- An optimizer
- A recommender system
- A health monitor
- An anomaly detector

---

## Versioning Policy

### Patch releases (v1.0.x)
- Bug fixes only
- No semantic changes
- No new features

### Minor releases (v1.x.0)
- Additive features only
- No breaking changes to frozen guarantees
- New projections, new adapters, new export formats

### Major releases (v2.0.0)
- May change frozen guarantees
- Requires explicit migration guide
- Should be rare

---

## How to Verify Compliance

Run the invariant test suite:

```bash
npm test
```

All 1100+ tests verify these guarantees are maintained.

Key test files:
- `tests/budget.test.ts` — Budget enforcement
- `tests/progressive-render.test.ts` — Truthful degradation
- `tests/webgl-renderer.test.ts` — Renderer equivalence
- `tests/streaming.test.ts` — Protocol compliance
- `tests/integration-contract.test.ts` — Adapter contract

---

## Contact

For questions about these guarantees, open an issue with the label `[guarantee-question]`.

For proposals that would modify guarantees, open an issue with the label `[v2-proposal]`.
