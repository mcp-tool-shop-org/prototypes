/**
 * VectorCaliper - Canonical State Types
 *
 * These types define the formal representation of model state.
 * Every variable must have: name, range, unit, and interpretation.
 *
 * INVARIANT: All semantics flow from these definitions.
 * The renderer NEVER invents meaning.
 */

// =============================================================================
// Core Value Types with Bounds
// =============================================================================

/**
 * A bounded numeric value with explicit range constraints.
 * Used for values that must stay within defined limits.
 */
export interface BoundedValue {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly unit: string;
}

/**
 * A normalized value guaranteed to be in [0, 1].
 * Use for probabilities, confidences, ratios.
 */
export interface NormalizedValue {
  readonly value: number; // Invariant: 0 <= value <= 1
  readonly interpretation: string;
}

/**
 * A non-negative value with no upper bound.
 * Use for counts, magnitudes, entropies.
 */
export interface PositiveValue {
  readonly value: number; // Invariant: value >= 0
  readonly unit: string;
}

// =============================================================================
// State Variable Groups
// =============================================================================

/**
 * Geometric properties of the model's internal representation.
 * Describes the shape and structure of the state space.
 */
export interface GeometryState {
  /** Intrinsic dimensionality of the representation (e.g., from PCA) */
  readonly effectiveDimension: PositiveValue;

  /** Ratio of largest to smallest principal component (condition number proxy) */
  readonly anisotropy: PositiveValue;

  /** Average pairwise distance in representation space */
  readonly spread: PositiveValue;

  /** Clustering coefficient or local density measure */
  readonly density: PositiveValue;
}

/**
 * Uncertainty and confidence measures.
 * Quantifies what the model knows vs. doesn't know.
 */
export interface UncertaintyState {
  /** Shannon entropy of output distribution (bits) */
  readonly entropy: PositiveValue;

  /** Difference between top-1 and top-2 probabilities */
  readonly margin: NormalizedValue;

  /** Calibration error (ECE or similar) */
  readonly calibration: NormalizedValue;

  /** Epistemic uncertainty estimate (if available) */
  readonly epistemic: NormalizedValue | null;

  /** Aleatoric uncertainty estimate (if available) */
  readonly aleatoric: NormalizedValue | null;
}

/**
 * Performance and quality metrics.
 * Measures how well the model is doing.
 */
export interface PerformanceState {
  /** Classification accuracy or regression R² */
  readonly accuracy: NormalizedValue;

  /** Loss function value (unbounded, lower is better) */
  readonly loss: PositiveValue;

  /** Task-specific score (F1, BLEU, etc.) */
  readonly taskScore: NormalizedValue | null;

  /** Computational cost proxy (FLOPs, latency) */
  readonly cost: PositiveValue | null;
}

/**
 * Dynamics and change over time.
 * Captures how state is evolving.
 */
export interface DynamicsState {
  /** Rate of change in representation space */
  readonly velocity: PositiveValue;

  /** Acceleration (second derivative) */
  readonly acceleration: BoundedValue;

  /** Stability measure (Lyapunov exponent proxy) */
  readonly stability: BoundedValue;

  /** Phase indicator (discrete regime identifier) */
  readonly phase: number;
}

// =============================================================================
// Canonical Model State
// =============================================================================

/**
 * The complete, canonical representation of model state.
 *
 * DESIGN PRINCIPLES:
 * 1. Every field is explicitly typed with bounds/units
 * 2. Groups are semantically meaningful (not arbitrary)
 * 3. Null indicates "not measured", not "zero"
 * 4. Time is explicit and monotonic
 *
 * INVARIANTS:
 * - time.value >= 0 and monotonically increasing in sequences
 * - All NormalizedValue.value in [0, 1]
 * - All PositiveValue.value >= 0
 * - All BoundedValue.value in [min, max]
 */
export interface ModelState {
  /** Unique identifier for this state snapshot */
  readonly id: string;

  /** Timestamp or step number (monotonic in sequences) */
  readonly time: PositiveValue;

  /** Geometric structure of representation */
  readonly geometry: GeometryState;

  /** Uncertainty quantification */
  readonly uncertainty: UncertaintyState;

  /** Performance metrics */
  readonly performance: PerformanceState;

  /** Temporal dynamics (null for static snapshots) */
  readonly dynamics: DynamicsState | null;

  /** Optional metadata (not rendered, for provenance) */
  readonly metadata?: {
    readonly source: string;
    readonly version: string;
    readonly tags?: readonly string[];
  };
}

// =============================================================================
// State Sequences (for trajectories)
// =============================================================================

/**
 * A sequence of states forming a trajectory through state space.
 * Used for temporal visualization and animation.
 */
export interface StateTrajectory {
  readonly id: string;
  readonly states: readonly ModelState[];

  /** Time bounds of the trajectory */
  readonly timeRange: {
    readonly start: number;
    readonly end: number;
  };

  /** Invariant: states are sorted by time, no duplicates */
}

// =============================================================================
// Reduced State (for 2D/3D projection)
// =============================================================================

/**
 * State projected into visualization space.
 * Created by the projection engine, consumed by the renderer.
 */
export interface ProjectedState {
  readonly sourceId: string;
  readonly time: number;

  /** 2D or 3D coordinates from dimensionality reduction */
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly z?: number;
  };

  /** Projection metadata for invertibility */
  readonly projection: {
    readonly method: 'pca' | 'umap' | 'tsne' | 'custom';
    readonly seed: number;
    readonly components: number;
    readonly explainedVariance?: number;
  };

  /** Original state reference (for inspection) */
  readonly source: ModelState;
}
