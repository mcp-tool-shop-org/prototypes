# VectorCaliper Phase Boundaries

This document defines what each phase guarantees and what future phases must not violate.

---

## Phase 1 — Semantic Foundation

**Theme:** "Every visual channel encodes exactly one semantic variable."

### Guarantees

1. **Bijective channel mapping**: Each visual property (x, y, radius, hue, lightness, saturation) maps to exactly one state variable
2. **Deterministic projection**: PCA with fixed seed produces identical output for identical input
3. **Schema-driven validation**: All states must pass validation before visualization
4. **Golden-state regression**: Known states produce known visual outputs

### Invariants (must never be violated)

- No channel reuse (two variables sharing one visual channel)
- No channel overloading (one variable affecting multiple channels)
- No interpolation of state values
- No heuristic-derived visual properties

### Files that enforce this

- `src/schema/state.ts` — state structure
- `src/mapping/channels.ts` — bijective encoding
- `src/projection/pca.ts` — deterministic reduction
- `src/validation/validator.ts` — schema enforcement
- `tests/golden.test.ts` — regression protection

---

## Phase 2 — Inspectability

**Theme:** "Interactions reveal but never modify state."

### Guarantees

1. **Read-only interactions**: Hover, scrub, isolate, compare — none alter state
2. **Idempotent operations**: Toggling a layer off twice === toggling it off once
3. **Coordinate invariance**: Hiding layers does not move remaining glyphs
4. **Deterministic scrubbing**: Timeline position t always produces the same view
5. **No hysteresis**: Output depends only on current position, not path taken
6. **Symmetric comparison**: diff(A, B) is the inverse of diff(B, A)
7. **Neutral language**: "higher/lower", never "better/worse"

### Invariants (must never be violated)

- No interpolated states (scrubbing snaps to discrete snapshots)
- No invented prose in tooltips (content derived from schema)
- No aggregation in comparison (only per-variable diffs)
- No animation easing (time is discrete, not continuous)

### Files that enforce this

- `src/interactive/tooltip-content.ts` — schema-derived content
- `src/interactive/layer-controller.ts` — idempotent visibility
- `src/interactive/timeline-scrubber.ts` — deterministic snapshots
- `src/interactive/state-comparison.ts` — symmetric diffs
- `docs/INTERACTION-CONTRACT.md` — formal specification

---

## Phase C — Training Dynamics (Complete)

**Theme:** "Training is trajectory through state space, not metric history."

### Guarantees

1. **Trajectory semantics**: Training logs → canonical state → update vectors
2. **Dual time axes**: Step (fine-grained) and epoch (coarse-grained)
3. **First-class updates**: UpdateVector with direction, magnitude, alignment
4. **Regime detection**: Annotations computed from state, never affecting geometry
5. **Run comparison**: Side-by-side analysis without normalization

### Invariants (must never be violated)

- Training variables are state, not annotations
- Performance stays one semantic layer, not the driver
- Update vectors are data, not animation
- Regimes explain, never drive (removing regime logic doesn't change visuals)
- No smoothing or averaging unless explicitly configured
- Comparison uses raw values (no normalization between runs)

### Files that enforce this

- `src/training/adapter.ts` — TrainingStateAdapter, deterministic log → state
- `src/training/time-axis.ts` — TimeAxis, dual time semantics
- `src/training/update-visualization.ts` — UpdateVectorVisualizer, geometry encoding
- `src/training/regime-detection.ts` — RegimeDetector, explicit thresholds
- `src/training/comparison.ts` — TrainingComparator, no normalization
- `docs/TRAINING-DYNAMICS-API.md` — API documentation
- `docs/CASE-STUDY-GROKKING.md` — Practical demonstration

### Success criteria (verified)

- Can see grokking before metrics spike (via regime transitions)
- Can see collapse before loss diverges (via collapsed regime)
- Can distinguish fast-unstable from slow-robust learning (via comparison)
- Two runs with same final accuracy look visibly different (via update geometry)

---

## Future Phases — Forbidden Patterns

The following patterns are explicitly forbidden in any future phase:

### Semantic violations

- **Channel inflation**: Adding visual channels without semantic justification
- **Interpolation creep**: Generating states that don't exist in source data
- **Heuristic injection**: Visual properties derived from rules, not data
- **Aggregation drift**: Showing summaries instead of individual states

### Interaction violations

- **Mutation leakage**: Any interaction that modifies underlying state
- **Path dependence**: Output that depends on interaction history
- **Implicit defaults**: UI that assumes user intent
- **Smart summaries**: AI-generated prose replacing schema content

### Training-specific violations

- **Metric primacy**: Performance driving geometry instead of informing it
- **Temporal smoothing**: Averaging over time windows
- **Regime forcing**: Making data fit expected patterns
- **Comparison normalization**: Rescaling to make runs "comparable"

---

## Amendment Process

This document may only be amended by:

1. Explicit user request
2. Discovery of fundamental semantic error in existing guarantees
3. Formal deprecation of a phase (requires migration path)

Convenience, aesthetics, or "common practice" are not valid reasons to amend.

---

*Last updated: Phase C completion*
