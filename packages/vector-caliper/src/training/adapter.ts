/**
 * Training State Adapter
 *
 * Bridges raw training logs → VectorCaliper state.
 * No derived heuristics. No smoothing. Every value traceable to training artifacts.
 */

import {
  RawTrainingLog,
  TrainingState,
  UpdateVector,
  TrainingTrajectory,
  AdapterConfig,
  DEFAULT_ADAPTER_CONFIG,
} from './types';

/**
 * Validation error for training logs.
 */
export class TrainingValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
    public readonly step: number
  ) {
    super(`Step ${step}: ${field} - ${message} (got: ${value})`);
    this.name = 'TrainingValidationError';
  }
}

/**
 * Training State Adapter
 *
 * Converts raw training logs to canonical VectorCaliper states.
 * Guarantees:
 * - Given identical logs, adapter output is identical
 * - Adapter produces only valid states
 * - No smoothing, no averaging, no heuristics
 */
export class TrainingStateAdapter {
  private readonly config: AdapterConfig;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
  }

  /**
   * Convert a single raw log entry to a training state.
   * Throws TrainingValidationError if validation fails.
   */
  adaptLog(log: RawTrainingLog, runId: string = 'run'): TrainingState {
    this.validateLog(log);

    const state: TrainingState = {
      id: `${runId}_step_${log.step}`,
      step: log.step,
      epoch: log.epoch,

      training: {
        learningRate: log.learningRate,
        gradientNorm: log.gradientNorm,
        updateNorm: log.updateNorm,
        momentumAlignment: this.resolveOptional(log.momentumAlignment, 'momentumAlignment'),
        batchEntropy: this.resolveOptional(log.batchEntropy, 'batchEntropy'),
      },

      model: {
        parameterNorm: log.parameterNorm,
        effectiveDim: this.config.defaults.effectiveDim,
        anisotropy: this.config.defaults.anisotropy,
        curvature: this.config.defaults.curvature,
      },

      performance: {
        loss: log.loss,
        accuracy: this.resolveOptional(log.accuracy, 'accuracy'),
        calibration: this.config.defaults.calibration,
      },
    };

    return state;
  }

  /**
   * Convert a sequence of raw logs to a training trajectory.
   * Logs must be in step order (ascending).
   */
  adaptLogs(logs: RawTrainingLog[], runId: string = 'run', name: string = 'Training Run'): TrainingTrajectory {
    if (logs.length === 0) {
      throw new Error('Cannot create trajectory from empty log sequence');
    }

    // Verify step ordering
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].step <= logs[i - 1].step) {
        throw new Error(
          `Logs must be in ascending step order. Step ${logs[i].step} follows step ${logs[i - 1].step}`
        );
      }
    }

    const states = logs.map((log) => this.adaptLog(log, runId));
    const updates = this.computeUpdateVectors(states);
    const epochBoundaries = this.findEpochBoundaries(states);

    return {
      id: runId,
      name,
      states,
      updates,
      totalEpochs: states[states.length - 1].epoch + 1,
      totalSteps: states[states.length - 1].step + 1,
      epochBoundaries,
    };
  }

  /**
   * Compute update vectors between consecutive states.
   * Update vectors are data, not animation.
   */
  private computeUpdateVectors(states: TrainingState[]): UpdateVector[] {
    const updates: UpdateVector[] = [];

    for (let i = 1; i < states.length; i++) {
      const from = states[i - 1];
      const to = states[i];

      // Compute direction in the training parameter space
      // Using gradient norm and update norm as primary axes
      const deltaGradient = to.training.gradientNorm - from.training.gradientNorm;
      const deltaUpdate = to.training.updateNorm - from.training.updateNorm;
      const deltaParam = to.model.parameterNorm - from.model.parameterNorm;

      // Direction vector (will be normalized)
      const rawDirection = [deltaGradient, deltaUpdate, deltaParam];
      const magnitude = Math.sqrt(rawDirection.reduce((sum, v) => sum + v * v, 0));

      // Normalized direction (handle zero magnitude)
      const direction = magnitude > 0
        ? rawDirection.map((v) => v / magnitude)
        : [0, 0, 0];

      // Compute alignment with previous update
      let alignment = 0;
      if (updates.length > 0) {
        const prevDirection = updates[updates.length - 1].direction;
        alignment = direction.reduce((sum, v, j) => sum + v * prevDirection[j], 0);
        // Clamp to [-1, 1] due to floating point
        alignment = Math.max(-1, Math.min(1, alignment));
      }

      updates.push({
        fromStateId: from.id,
        toStateId: to.id,
        fromStep: from.step,
        toStep: to.step,
        direction,
        magnitude,
        alignment,
        crossesEpoch: to.epoch > from.epoch,
      });
    }

    return updates;
  }

  /**
   * Find indices where epoch boundaries occur.
   */
  private findEpochBoundaries(states: TrainingState[]): number[] {
    const boundaries: number[] = [0]; // First state always starts epoch 0

    for (let i = 1; i < states.length; i++) {
      if (states[i].epoch > states[i - 1].epoch) {
        boundaries.push(i);
      }
    }

    return boundaries;
  }

  /**
   * Validate a raw log entry.
   */
  private validateLog(log: RawTrainingLog): void {
    // Required fields with range validation
    this.validateNonNegativeInt(log.step, 'step', log.step);
    this.validateNonNegativeInt(log.epoch, 'epoch', log.step);
    this.validatePositive(log.learningRate, 'learningRate', log.step);
    this.validateNonNegative(log.loss, 'loss', log.step);
    this.validateNonNegative(log.gradientNorm, 'gradientNorm', log.step);
    this.validateNonNegative(log.updateNorm, 'updateNorm', log.step);
    this.validateNonNegative(log.parameterNorm, 'parameterNorm', log.step);

    // Optional fields with range validation when present
    if (log.accuracy !== undefined) {
      this.validateRange(log.accuracy, 0, 1, 'accuracy', log.step);
    }
    if (log.momentumAlignment !== undefined) {
      this.validateRange(log.momentumAlignment, -1, 1, 'momentumAlignment', log.step);
    }
    if (log.batchEntropy !== undefined) {
      this.validateRange(log.batchEntropy, 0, 1, 'batchEntropy', log.step);
    }
  }

  /**
   * Resolve an optional field using the configured strategy.
   */
  private resolveOptional<K extends keyof AdapterConfig['defaults']>(
    value: number | undefined,
    field: K
  ): number {
    if (value !== undefined) {
      return value;
    }

    if (this.config.missingValueStrategy === 'error') {
      throw new Error(`Missing required field: ${field}`);
    }

    return this.config.defaults[field];
  }

  // Validation helpers

  private validateNonNegativeInt(value: number, field: string, step: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new TrainingValidationError(
        'must be a non-negative integer',
        field,
        value,
        step
      );
    }
  }

  private validatePositive(value: number, field: string, step: number): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new TrainingValidationError(
        'must be a positive number',
        field,
        value,
        step
      );
    }
  }

  private validateNonNegative(value: number, field: string, step: number): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new TrainingValidationError(
        'must be a non-negative number',
        field,
        value,
        step
      );
    }
  }

  private validateRange(value: number, min: number, max: number, field: string, step: number): void {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      throw new TrainingValidationError(
        `must be in range [${min}, ${max}]`,
        field,
        value,
        step
      );
    }
  }
}

/**
 * Determinism guarantee: Given identical logs, produce identical output.
 * This function can be used to verify adapter determinism in tests.
 */
export function verifyAdapterDeterminism(
  logs: RawTrainingLog[],
  iterations: number = 3
): boolean {
  const adapter = new TrainingStateAdapter();
  const results: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const trajectory = adapter.adaptLogs(logs, 'test', 'Test Run');
    results.push(JSON.stringify(trajectory));
  }

  // All results must be identical
  return results.every((r) => r === results[0]);
}
