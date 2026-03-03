/**
 * VectorCaliper - State Validator
 *
 * Validates model states against invariants before rendering.
 * Invalid states CANNOT reach the renderer.
 *
 * Two levels of validation:
 * - Hard errors: State is invalid, cannot render (throws)
 * - Soft warnings: State is valid but suspicious (returns warnings)
 */

import type {
  ModelState,
  StateTrajectory,
  BoundedValue,
  NormalizedValue,
  PositiveValue,
  GeometryState,
  UncertaintyState,
  PerformanceState,
  DynamicsState,
} from '../types/state';

// =============================================================================
// Validation Result Types
// =============================================================================

export interface ValidationWarning {
  readonly path: string;
  readonly message: string;
  readonly value: unknown;
  readonly severity: 'low' | 'medium' | 'high';
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly ValidationWarning[];
  readonly checkedAt: number;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly value: unknown
  ) {
    super(`Validation failed at '${path}': ${message}`);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// Hard Invariant Checks (throw on failure)
// =============================================================================

function assertFinite(value: number, path: string): void {
  if (!Number.isFinite(value)) {
    throw new ValidationError(`Expected finite number, got ${value}`, path, value);
  }
}

function assertNotNaN(value: number, path: string): void {
  if (Number.isNaN(value)) {
    throw new ValidationError('Value is NaN', path, value);
  }
}

function assertInRange(value: number, min: number, max: number, path: string): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `Value ${value} outside range [${min}, ${max}]`,
      path,
      value
    );
  }
}

function assertNonNegative(value: number, path: string): void {
  if (value < 0) {
    throw new ValidationError(`Expected non-negative, got ${value}`, path, value);
  }
}

function assertNonEmpty(value: string, path: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError('String must not be empty', path, value);
  }
}

// =============================================================================
// Value Type Validators
// =============================================================================

function validateBoundedValue(v: BoundedValue, path: string): void {
  assertNotNaN(v.value, `${path}.value`);
  assertFinite(v.value, `${path}.value`);
  assertNotNaN(v.min, `${path}.min`);
  assertNotNaN(v.max, `${path}.max`);

  if (v.min > v.max) {
    throw new ValidationError(
      `Invalid bounds: min (${v.min}) > max (${v.max})`,
      path,
      v
    );
  }

  assertInRange(v.value, v.min, v.max, `${path}.value`);
  assertNonEmpty(v.unit, `${path}.unit`);
}

function validateNormalizedValue(v: NormalizedValue, path: string): void {
  assertNotNaN(v.value, `${path}.value`);
  assertFinite(v.value, `${path}.value`);
  assertInRange(v.value, 0, 1, `${path}.value`);
  assertNonEmpty(v.interpretation, `${path}.interpretation`);
}

function validatePositiveValue(v: PositiveValue, path: string): void {
  assertNotNaN(v.value, `${path}.value`);
  assertFinite(v.value, `${path}.value`);
  assertNonNegative(v.value, `${path}.value`);
  assertNonEmpty(v.unit, `${path}.unit`);
}

// =============================================================================
// State Group Validators
// =============================================================================

function validateGeometryState(g: GeometryState, path: string): void {
  validatePositiveValue(g.effectiveDimension, `${path}.effectiveDimension`);
  validatePositiveValue(g.anisotropy, `${path}.anisotropy`);
  validatePositiveValue(g.spread, `${path}.spread`);
  validatePositiveValue(g.density, `${path}.density`);
}

function validateUncertaintyState(u: UncertaintyState, path: string): void {
  validatePositiveValue(u.entropy, `${path}.entropy`);
  validateNormalizedValue(u.margin, `${path}.margin`);
  validateNormalizedValue(u.calibration, `${path}.calibration`);

  if (u.epistemic !== null) {
    validateNormalizedValue(u.epistemic, `${path}.epistemic`);
  }
  if (u.aleatoric !== null) {
    validateNormalizedValue(u.aleatoric, `${path}.aleatoric`);
  }
}

function validatePerformanceState(p: PerformanceState, path: string): void {
  validateNormalizedValue(p.accuracy, `${path}.accuracy`);
  validatePositiveValue(p.loss, `${path}.loss`);

  if (p.taskScore !== null) {
    validateNormalizedValue(p.taskScore, `${path}.taskScore`);
  }
  if (p.cost !== null) {
    validatePositiveValue(p.cost, `${path}.cost`);
  }
}

function validateDynamicsState(d: DynamicsState, path: string): void {
  validatePositiveValue(d.velocity, `${path}.velocity`);
  validateBoundedValue(d.acceleration, `${path}.acceleration`);
  validateBoundedValue(d.stability, `${path}.stability`);

  if (!Number.isInteger(d.phase) || d.phase < 0) {
    throw new ValidationError(
      `Phase must be non-negative integer, got ${d.phase}`,
      `${path}.phase`,
      d.phase
    );
  }
}

// =============================================================================
// Soft Warning Checks
// =============================================================================

function collectWarnings(state: ModelState): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Geometry warnings
  if (state.geometry.effectiveDimension.value < 1) {
    warnings.push({
      path: 'geometry.effectiveDimension',
      message: 'Effective dimension < 1 suggests degenerate representation',
      value: state.geometry.effectiveDimension.value,
      severity: 'medium',
    });
  }

  if (state.geometry.anisotropy.value > 100) {
    warnings.push({
      path: 'geometry.anisotropy',
      message: 'Very high anisotropy may indicate ill-conditioned representation',
      value: state.geometry.anisotropy.value,
      severity: 'high',
    });
  }

  if (state.geometry.spread.value < 0.1) {
    warnings.push({
      path: 'geometry.spread',
      message: 'Near-zero spread indicates collapsed representation',
      value: state.geometry.spread.value,
      severity: 'high',
    });
  }

  // Uncertainty warnings
  if (state.uncertainty.entropy.value === 0) {
    warnings.push({
      path: 'uncertainty.entropy',
      message: 'Zero entropy indicates deterministic output (possibly overconfident)',
      value: state.uncertainty.entropy.value,
      severity: 'medium',
    });
  }

  if (state.uncertainty.calibration.value > 0.2) {
    warnings.push({
      path: 'uncertainty.calibration',
      message: 'High calibration error suggests unreliable confidence estimates',
      value: state.uncertainty.calibration.value,
      severity: 'high',
    });
  }

  // Performance warnings
  if (state.performance.accuracy.value === 1) {
    warnings.push({
      path: 'performance.accuracy',
      message: 'Perfect accuracy may indicate overfitting or data leakage',
      value: state.performance.accuracy.value,
      severity: 'medium',
    });
  }

  if (state.performance.loss.value === 0) {
    warnings.push({
      path: 'performance.loss',
      message: 'Zero loss is suspicious - check for training issues',
      value: state.performance.loss.value,
      severity: 'high',
    });
  }

  // Dynamics warnings (if present)
  if (state.dynamics) {
    if (state.dynamics.velocity.value === 0 && state.time.value > 0) {
      warnings.push({
        path: 'dynamics.velocity',
        message: 'Zero velocity at non-zero time suggests stalled training',
        value: state.dynamics.velocity.value,
        severity: 'low',
      });
    }

    // Check stability bounds for concerning values
    const stabilityVal = state.dynamics.stability.value;
    if (stabilityVal > 0.5 * state.dynamics.stability.max) {
      warnings.push({
        path: 'dynamics.stability',
        message: 'High instability measure - training may be diverging',
        value: stabilityVal,
        severity: 'high',
      });
    }
  }

  return warnings;
}

// =============================================================================
// Main Validator Class
// =============================================================================

export class StateValidator {
  /**
   * Validate a single model state.
   * Throws ValidationError for hard failures.
   * Returns warnings for soft issues.
   */
  validate(state: ModelState): ValidationResult {
    // Hard invariant checks (throw on failure)
    assertNonEmpty(state.id, 'id');
    validatePositiveValue(state.time, 'time');
    validateGeometryState(state.geometry, 'geometry');
    validateUncertaintyState(state.uncertainty, 'uncertainty');
    validatePerformanceState(state.performance, 'performance');

    if (state.dynamics !== null) {
      validateDynamicsState(state.dynamics, 'dynamics');
    }

    // Soft warning checks
    const warnings = collectWarnings(state);

    return {
      valid: true,
      warnings,
      checkedAt: Date.now(),
    };
  }

  /**
   * Validate a state trajectory.
   * Additional checks: time monotonicity, no duplicate IDs.
   */
  validateTrajectory(trajectory: StateTrajectory): ValidationResult {
    assertNonEmpty(trajectory.id, 'trajectory.id');

    if (trajectory.states.length === 0) {
      throw new ValidationError(
        'Trajectory must contain at least one state',
        'trajectory.states',
        trajectory.states
      );
    }

    const allWarnings: ValidationWarning[] = [];
    const seenIds = new Set<string>();
    let prevTime = -Infinity;

    for (let i = 0; i < trajectory.states.length; i++) {
      const state = trajectory.states[i]!;
      const path = `trajectory.states[${i}]`;

      // Check for duplicate IDs
      if (seenIds.has(state.id)) {
        throw new ValidationError(
          `Duplicate state ID: ${state.id}`,
          `${path}.id`,
          state.id
        );
      }
      seenIds.add(state.id);

      // Check time monotonicity
      const currentTime = state.time.value;
      if (currentTime <= prevTime) {
        throw new ValidationError(
          `Time must be strictly increasing: ${prevTime} -> ${currentTime}`,
          `${path}.time`,
          currentTime
        );
      }
      prevTime = currentTime;

      // Validate individual state
      const result = this.validate(state);
      allWarnings.push(
        ...result.warnings.map((w) => ({
          ...w,
          path: `${path}.${w.path}`,
        }))
      );
    }

    // Check trajectory time bounds
    const firstTime = trajectory.states[0]!.time.value;
    const lastTime = trajectory.states[trajectory.states.length - 1]!.time.value;

    if (trajectory.timeRange.start !== firstTime) {
      throw new ValidationError(
        `timeRange.start (${trajectory.timeRange.start}) doesn't match first state time (${firstTime})`,
        'trajectory.timeRange.start',
        trajectory.timeRange.start
      );
    }

    if (trajectory.timeRange.end !== lastTime) {
      throw new ValidationError(
        `timeRange.end (${trajectory.timeRange.end}) doesn't match last state time (${lastTime})`,
        'trajectory.timeRange.end',
        trajectory.timeRange.end
      );
    }

    return {
      valid: true,
      warnings: allWarnings,
      checkedAt: Date.now(),
    };
  }

  /**
   * Quick check: is this state valid? (no warnings returned)
   */
  isValid(state: ModelState): boolean {
    try {
      this.validate(state);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert state is valid, throwing if not.
   * Use this as a guard before rendering.
   */
  assertValid(state: ModelState): void {
    this.validate(state);
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const validator = new StateValidator();
