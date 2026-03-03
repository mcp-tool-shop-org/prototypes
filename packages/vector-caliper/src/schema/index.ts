/**
 * VectorCaliper Schema Exports
 *
 * Central export point for state schema and factory functions.
 */

export * from '../types/state';

import type {
  BoundedValue,
  NormalizedValue,
  PositiveValue,
  GeometryState,
  UncertaintyState,
  PerformanceState,
  DynamicsState,
  ModelState,
} from '../types/state';

// =============================================================================
// Factory Functions (enforce invariants at construction)
// =============================================================================

/**
 * Create a bounded value, throwing if value is outside [min, max].
 */
export function boundedValue(
  value: number,
  min: number,
  max: number,
  unit: string
): BoundedValue {
  if (value < min || value > max) {
    throw new RangeError(
      `BoundedValue ${value} outside range [${min}, ${max}]`
    );
  }
  if (min > max) {
    throw new RangeError(`Invalid bounds: min (${min}) > max (${max})`);
  }
  return { value, min, max, unit };
}

/**
 * Create a normalized value, throwing if outside [0, 1].
 */
export function normalizedValue(
  value: number,
  interpretation: string
): NormalizedValue {
  if (value < 0 || value > 1) {
    throw new RangeError(`NormalizedValue ${value} outside range [0, 1]`);
  }
  return { value, interpretation };
}

/**
 * Create a positive value, throwing if negative.
 */
export function positiveValue(value: number, unit: string): PositiveValue {
  if (value < 0) {
    throw new RangeError(`PositiveValue ${value} must be >= 0`);
  }
  if (!Number.isFinite(value)) {
    throw new RangeError(`PositiveValue must be finite, got ${value}`);
  }
  return { value, unit };
}

// =============================================================================
// State Group Factories
// =============================================================================

export function createGeometryState(params: {
  effectiveDimension: number;
  anisotropy: number;
  spread: number;
  density: number;
}): GeometryState {
  return {
    effectiveDimension: positiveValue(params.effectiveDimension, 'dimensions'),
    anisotropy: positiveValue(params.anisotropy, 'ratio'),
    spread: positiveValue(params.spread, 'distance'),
    density: positiveValue(params.density, 'density'),
  };
}

export function createUncertaintyState(params: {
  entropy: number;
  margin: number;
  calibration: number;
  epistemic?: number | null;
  aleatoric?: number | null;
}): UncertaintyState {
  return {
    entropy: positiveValue(params.entropy, 'bits'),
    margin: normalizedValue(params.margin, 'top1 - top2 probability gap'),
    calibration: normalizedValue(params.calibration, 'expected calibration error'),
    epistemic: params.epistemic != null
      ? normalizedValue(params.epistemic, 'model uncertainty')
      : null,
    aleatoric: params.aleatoric != null
      ? normalizedValue(params.aleatoric, 'data uncertainty')
      : null,
  };
}

export function createPerformanceState(params: {
  accuracy: number;
  loss: number;
  taskScore?: number | null;
  cost?: number | null;
}): PerformanceState {
  return {
    accuracy: normalizedValue(params.accuracy, 'classification accuracy'),
    loss: positiveValue(params.loss, 'loss'),
    taskScore: params.taskScore != null
      ? normalizedValue(params.taskScore, 'task-specific score')
      : null,
    cost: params.cost != null
      ? positiveValue(params.cost, 'compute cost')
      : null,
  };
}

export function createDynamicsState(params: {
  velocity: number;
  acceleration: number;
  accelerationBounds: [number, number];
  stability: number;
  stabilityBounds: [number, number];
  phase: number;
}): DynamicsState {
  return {
    velocity: positiveValue(params.velocity, 'units/step'),
    acceleration: boundedValue(
      params.acceleration,
      params.accelerationBounds[0],
      params.accelerationBounds[1],
      'units/step²'
    ),
    stability: boundedValue(
      params.stability,
      params.stabilityBounds[0],
      params.stabilityBounds[1],
      'lyapunov'
    ),
    phase: params.phase,
  };
}

// =============================================================================
// Full State Factory
// =============================================================================

let stateIdCounter = 0;

/**
 * Create a complete ModelState with all invariants enforced.
 */
export function createModelState(params: {
  id?: string;
  time: number;
  geometry: Parameters<typeof createGeometryState>[0];
  uncertainty: Parameters<typeof createUncertaintyState>[0];
  performance: Parameters<typeof createPerformanceState>[0];
  dynamics?: Parameters<typeof createDynamicsState>[0] | null;
  metadata?: ModelState['metadata'];
}): ModelState {
  const id = params.id ?? `state-${++stateIdCounter}`;

  return {
    id,
    time: positiveValue(params.time, 'step'),
    geometry: createGeometryState(params.geometry),
    uncertainty: createUncertaintyState(params.uncertainty),
    performance: createPerformanceState(params.performance),
    dynamics: params.dynamics ? createDynamicsState(params.dynamics) : null,
    metadata: params.metadata,
  };
}
