/**
 * Training State Adapter Tests
 *
 * Acceptance criteria:
 * - Given identical logs, adapter output is identical
 * - Adapter produces only valid states
 * - No smoothing, no averaging, no heuristics
 */

import { describe, it, expect } from 'vitest';
import {
  TrainingStateAdapter,
  TrainingValidationError,
  verifyAdapterDeterminism,
  RawTrainingLog,
  TrainingState,
  TrainingTrajectory,
  DEFAULT_ADAPTER_CONFIG,
} from '../src/training';

// Helper to create valid log entries
function createLog(overrides: Partial<RawTrainingLog> = {}): RawTrainingLog {
  return {
    step: 0,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 100,
    ...overrides,
  };
}

// Helper to create a sequence of logs
function createLogSequence(count: number, stepsPerEpoch: number = 100): RawTrainingLog[] {
  return Array.from({ length: count }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / stepsPerEpoch),
    loss: 1.5 * Math.exp(-i * 0.005), // Exponential decay, always positive
    gradientNorm: 0.5 * Math.exp(-i * 0.002), // Exponential decay, always positive
    updateNorm: 0.01,
    parameterNorm: 100 + (i * 0.1),
  }));
}

describe('TrainingStateAdapter', () => {
  describe('Single Log Adaptation', () => {
    it('adapts a minimal valid log', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog();
      const state = adapter.adaptLog(log);

      expect(state.id).toBe('run_step_0');
      expect(state.step).toBe(0);
      expect(state.epoch).toBe(0);
      expect(state.training.learningRate).toBe(0.001);
      expect(state.training.gradientNorm).toBe(0.5);
      expect(state.training.updateNorm).toBe(0.01);
      expect(state.performance.loss).toBe(1.5);
      expect(state.model.parameterNorm).toBe(100);
    });

    it('preserves all required fields exactly', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({
        step: 42,
        epoch: 3,
        learningRate: 0.0001,
        loss: 0.123456789,
        gradientNorm: 1.234567,
        updateNorm: 0.0054321,
        parameterNorm: 987.654,
      });

      const state = adapter.adaptLog(log);

      // Values must be preserved exactly, no rounding
      expect(state.step).toBe(42);
      expect(state.epoch).toBe(3);
      expect(state.training.learningRate).toBe(0.0001);
      expect(state.performance.loss).toBe(0.123456789);
      expect(state.training.gradientNorm).toBe(1.234567);
      expect(state.training.updateNorm).toBe(0.0054321);
      expect(state.model.parameterNorm).toBe(987.654);
    });

    it('includes optional fields when provided', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({
        accuracy: 0.85,
        momentumAlignment: 0.95,
        batchEntropy: 0.7,
      });

      const state = adapter.adaptLog(log);

      expect(state.performance.accuracy).toBe(0.85);
      expect(state.training.momentumAlignment).toBe(0.95);
      expect(state.training.batchEntropy).toBe(0.7);
    });

    it('uses defaults for missing optional fields', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog(); // No optional fields

      const state = adapter.adaptLog(log);

      expect(state.performance.accuracy).toBe(DEFAULT_ADAPTER_CONFIG.defaults.accuracy);
      expect(state.training.momentumAlignment).toBe(DEFAULT_ADAPTER_CONFIG.defaults.momentumAlignment);
      expect(state.training.batchEntropy).toBe(DEFAULT_ADAPTER_CONFIG.defaults.batchEntropy);
    });

    it('uses custom run ID in state ID', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ step: 5 });
      const state = adapter.adaptLog(log, 'experiment_42');

      expect(state.id).toBe('experiment_42_step_5');
    });
  });

  describe('Validation', () => {
    it('rejects negative step', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ step: -1 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(log)).toThrow('step');
    });

    it('rejects non-integer step', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ step: 1.5 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
    });

    it('rejects negative epoch', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ epoch: -1 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
    });

    it('rejects zero learning rate', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ learningRate: 0 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(log)).toThrow('learningRate');
    });

    it('rejects negative learning rate', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ learningRate: -0.001 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
    });

    it('rejects negative loss', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ loss: -0.5 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
    });

    it('rejects negative gradient norm', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ gradientNorm: -1 });

      expect(() => adapter.adaptLog(log)).toThrow(TrainingValidationError);
    });

    it('rejects accuracy outside [0, 1]', () => {
      const adapter = new TrainingStateAdapter();

      expect(() => adapter.adaptLog(createLog({ accuracy: -0.1 }))).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(createLog({ accuracy: 1.1 }))).toThrow(TrainingValidationError);
    });

    it('rejects momentum alignment outside [-1, 1]', () => {
      const adapter = new TrainingStateAdapter();

      expect(() => adapter.adaptLog(createLog({ momentumAlignment: -1.5 }))).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(createLog({ momentumAlignment: 1.5 }))).toThrow(TrainingValidationError);
    });

    it('rejects NaN values', () => {
      const adapter = new TrainingStateAdapter();

      expect(() => adapter.adaptLog(createLog({ loss: NaN }))).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(createLog({ gradientNorm: NaN }))).toThrow(TrainingValidationError);
    });

    it('rejects Infinity values', () => {
      const adapter = new TrainingStateAdapter();

      expect(() => adapter.adaptLog(createLog({ loss: Infinity }))).toThrow(TrainingValidationError);
      expect(() => adapter.adaptLog(createLog({ parameterNorm: -Infinity }))).toThrow(TrainingValidationError);
    });

    it('accepts edge case: zero loss', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ loss: 0 });

      const state = adapter.adaptLog(log);
      expect(state.performance.loss).toBe(0);
    });

    it('accepts edge case: zero gradient norm', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({ gradientNorm: 0 });

      const state = adapter.adaptLog(log);
      expect(state.training.gradientNorm).toBe(0);
    });

    it('accepts boundary values for accuracy', () => {
      const adapter = new TrainingStateAdapter();

      const state0 = adapter.adaptLog(createLog({ accuracy: 0 }));
      const state1 = adapter.adaptLog(createLog({ accuracy: 1 }));

      expect(state0.performance.accuracy).toBe(0);
      expect(state1.performance.accuracy).toBe(1);
    });

    it('accepts boundary values for momentum alignment', () => {
      const adapter = new TrainingStateAdapter();

      const stateNeg = adapter.adaptLog(createLog({ momentumAlignment: -1 }));
      const statePos = adapter.adaptLog(createLog({ momentumAlignment: 1 }));

      expect(stateNeg.training.momentumAlignment).toBe(-1);
      expect(statePos.training.momentumAlignment).toBe(1);
    });
  });

  describe('Log Sequence Adaptation', () => {
    it('adapts a sequence of logs to a trajectory', () => {
      const adapter = new TrainingStateAdapter();
      const logs = createLogSequence(10);
      const trajectory = adapter.adaptLogs(logs, 'test_run', 'Test Run');

      expect(trajectory.id).toBe('test_run');
      expect(trajectory.name).toBe('Test Run');
      expect(trajectory.states).toHaveLength(10);
      expect(trajectory.updates).toHaveLength(9); // n-1 updates for n states
    });

    it('rejects empty log sequence', () => {
      const adapter = new TrainingStateAdapter();

      expect(() => adapter.adaptLogs([])).toThrow('empty');
    });

    it('rejects out-of-order steps', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 2 }),
        createLog({ step: 1 }), // Out of order
      ];

      expect(() => adapter.adaptLogs(logs)).toThrow('ascending');
    });

    it('rejects duplicate steps', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 1 }),
        createLog({ step: 1 }), // Duplicate
      ];

      expect(() => adapter.adaptLogs(logs)).toThrow('ascending');
    });

    it('correctly identifies total epochs and steps', () => {
      const adapter = new TrainingStateAdapter();
      const logs = createLogSequence(250, 100); // 2.5 epochs

      const trajectory = adapter.adaptLogs(logs);

      expect(trajectory.totalSteps).toBe(250);
      expect(trajectory.totalEpochs).toBe(3); // Epochs 0, 1, 2
    });

    it('identifies epoch boundaries', () => {
      const adapter = new TrainingStateAdapter();
      const logs = createLogSequence(250, 100); // Epoch boundaries at 0, 100, 200

      const trajectory = adapter.adaptLogs(logs);

      expect(trajectory.epochBoundaries).toEqual([0, 100, 200]);
    });
  });

  describe('Update Vectors', () => {
    it('computes update vectors between consecutive states', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 0.9, updateNorm: 0.1, parameterNorm: 100.1 }),
      ];

      const trajectory = adapter.adaptLogs(logs);

      expect(trajectory.updates).toHaveLength(1);
      expect(trajectory.updates[0].fromStateId).toBe('run_step_0');
      expect(trajectory.updates[0].toStateId).toBe('run_step_1');
      expect(trajectory.updates[0].fromStep).toBe(0);
      expect(trajectory.updates[0].toStep).toBe(1);
    });

    it('normalizes direction vectors to unit length', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 2.0, updateNorm: 0.2, parameterNorm: 101 }),
      ];

      const trajectory = adapter.adaptLogs(logs);
      const direction = trajectory.updates[0].direction;
      const magnitude = Math.sqrt(direction.reduce((sum, v) => sum + v * v, 0));

      expect(magnitude).toBeCloseTo(1.0, 10);
    });

    it('handles zero-magnitude updates with zero direction', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }), // No change
      ];

      const trajectory = adapter.adaptLogs(logs);

      expect(trajectory.updates[0].direction).toEqual([0, 0, 0]);
      expect(trajectory.updates[0].magnitude).toBe(0);
    });

    it('computes alignment with previous update', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 2.0, updateNorm: 0.2, parameterNorm: 101 }),
        createLog({ step: 2, gradientNorm: 3.0, updateNorm: 0.3, parameterNorm: 102 }), // Same direction
      ];

      const trajectory = adapter.adaptLogs(logs);

      // First update has no previous, alignment = 0
      expect(trajectory.updates[0].alignment).toBe(0);
      // Second update should have positive alignment (same direction)
      expect(trajectory.updates[1].alignment).toBeGreaterThan(0.9);
    });

    it('detects negative alignment for opposing directions', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 2.0, updateNorm: 0.2, parameterNorm: 101 }), // Increasing
        createLog({ step: 2, gradientNorm: 1.5, updateNorm: 0.15, parameterNorm: 100.5 }), // Decreasing
      ];

      const trajectory = adapter.adaptLogs(logs);

      // Second update opposes first, alignment should be negative
      expect(trajectory.updates[1].alignment).toBeLessThan(0);
    });

    it('marks epoch-crossing updates', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 99, epoch: 0 }),
        createLog({ step: 100, epoch: 1 }), // Crosses epoch
        createLog({ step: 101, epoch: 1 }),
      ];

      const trajectory = adapter.adaptLogs(logs);

      expect(trajectory.updates[0].crossesEpoch).toBe(true);
      expect(trajectory.updates[1].crossesEpoch).toBe(false);
    });

    it('clamps alignment to [-1, 1]', () => {
      const adapter = new TrainingStateAdapter();
      // Create logs that might cause floating point issues
      const logs = createLogSequence(100);

      const trajectory = adapter.adaptLogs(logs);

      for (const update of trajectory.updates) {
        expect(update.alignment).toBeGreaterThanOrEqual(-1);
        expect(update.alignment).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Configuration', () => {
    it('respects custom defaults', () => {
      const adapter = new TrainingStateAdapter({
        defaults: {
          ...DEFAULT_ADAPTER_CONFIG.defaults,
          momentumAlignment: 0.5,
          batchEntropy: 0.8,
        },
      });

      const log = createLog();
      const state = adapter.adaptLog(log);

      expect(state.training.momentumAlignment).toBe(0.5);
      expect(state.training.batchEntropy).toBe(0.8);
    });

    it('throws on missing fields when strategy is error', () => {
      const adapter = new TrainingStateAdapter({
        missingValueStrategy: 'error',
      });

      const log = createLog(); // Missing optional fields

      // Should throw because momentum alignment is missing
      expect(() => adapter.adaptLog(log)).toThrow('momentumAlignment');
    });
  });

  describe('Determinism Guarantee', () => {
    it('produces identical output for identical input', () => {
      const logs = createLogSequence(50);

      expect(verifyAdapterDeterminism(logs, 5)).toBe(true);
    });

    it('produces identical output across adapter instances', () => {
      const logs = createLogSequence(50);
      const adapter1 = new TrainingStateAdapter();
      const adapter2 = new TrainingStateAdapter();

      const result1 = JSON.stringify(adapter1.adaptLogs(logs));
      const result2 = JSON.stringify(adapter2.adaptLogs(logs));

      expect(result1).toBe(result2);
    });

    it('produces different output for different input', () => {
      const logs1 = createLogSequence(10);
      const logs2 = createLogSequence(10).map((log, i) => ({
        ...log,
        loss: log.loss + 0.001, // Slightly different
      }));

      const adapter = new TrainingStateAdapter();
      const result1 = JSON.stringify(adapter.adaptLogs(logs1));
      const result2 = JSON.stringify(adapter.adaptLogs(logs2));

      expect(result1).not.toBe(result2);
    });
  });

  describe('Traceability', () => {
    it('every state field traces to a log field', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog({
        step: 42,
        epoch: 3,
        learningRate: 0.0001,
        loss: 0.5,
        accuracy: 0.9,
        gradientNorm: 1.0,
        updateNorm: 0.05,
        parameterNorm: 500,
        momentumAlignment: 0.8,
        batchEntropy: 0.6,
      });

      const state = adapter.adaptLog(log);

      // Direct mappings (no transformation)
      expect(state.step).toBe(log.step);
      expect(state.epoch).toBe(log.epoch);
      expect(state.training.learningRate).toBe(log.learningRate);
      expect(state.training.gradientNorm).toBe(log.gradientNorm);
      expect(state.training.updateNorm).toBe(log.updateNorm);
      expect(state.training.momentumAlignment).toBe(log.momentumAlignment);
      expect(state.training.batchEntropy).toBe(log.batchEntropy);
      expect(state.model.parameterNorm).toBe(log.parameterNorm);
      expect(state.performance.loss).toBe(log.loss);
      expect(state.performance.accuracy).toBe(log.accuracy);
    });

    it('no smoothing: values are not averaged', () => {
      const adapter = new TrainingStateAdapter();
      const logs = [
        createLog({ step: 0, loss: 1.0 }),
        createLog({ step: 1, loss: 0.5 }),
        createLog({ step: 2, loss: 1.0 }), // Spike back up
      ];

      const trajectory = adapter.adaptLogs(logs);

      // Loss should spike, not be smoothed
      expect(trajectory.states[0].performance.loss).toBe(1.0);
      expect(trajectory.states[1].performance.loss).toBe(0.5);
      expect(trajectory.states[2].performance.loss).toBe(1.0);
    });

    it('no heuristics: no derived values beyond direct mappings', () => {
      const adapter = new TrainingStateAdapter();
      const log = createLog();
      const state = adapter.adaptLog(log);

      // Model geometry uses defaults, not heuristics
      expect(state.model.effectiveDim).toBe(DEFAULT_ADAPTER_CONFIG.defaults.effectiveDim);
      expect(state.model.anisotropy).toBe(DEFAULT_ADAPTER_CONFIG.defaults.anisotropy);
      expect(state.model.curvature).toBe(DEFAULT_ADAPTER_CONFIG.defaults.curvature);
    });
  });
});
