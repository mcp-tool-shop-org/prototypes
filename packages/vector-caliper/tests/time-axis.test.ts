/**
 * Time Axis Tests
 *
 * Acceptance criteria:
 * - Scrubbing to step i always maps to the same state
 * - Epoch transitions are discrete, not interpolated
 * - Time scrubbing never skips implicit updates
 */

import { describe, it, expect } from 'vitest';
import {
  TimeAxis,
  TimeCoordinate,
  EpochBoundary,
  createEpochMarkers,
  createLRChangeMarkers,
  TrainingStateAdapter,
  RawTrainingLog,
  TrainingTrajectory,
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

// Helper to create a trajectory from logs
function createTrajectory(logs: RawTrainingLog[]): TrainingTrajectory {
  const adapter = new TrainingStateAdapter();
  return adapter.adaptLogs(logs, 'test', 'Test Run');
}

// Helper to create a standard training trajectory
function createStandardTrajectory(
  totalSteps: number,
  stepsPerEpoch: number
): TrainingTrajectory {
  const logs = Array.from({ length: totalSteps }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / stepsPerEpoch),
    loss: 1.5 * Math.exp(-i * 0.01),
  }));
  return createTrajectory(logs);
}

describe('TimeAxis', () => {
  describe('Basic Properties', () => {
    it('reports correct total epochs', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.totalEpochs).toBe(3); // Epochs 0, 1, 2
    });

    it('reports correct total steps', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.totalSteps).toBe(250);
    });

    it('reports correct total states', () => {
      const trajectory = createStandardTrajectory(50, 25);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.totalStates).toBe(50);
    });
  });

  describe('Step to State Mapping', () => {
    it('maps step to correct state index', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getStateIndexForStep(0)).toBe(0);
      expect(timeAxis.getStateIndexForStep(50)).toBe(50);
      expect(timeAxis.getStateIndexForStep(99)).toBe(99);
    });

    it('returns undefined for non-existent steps', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getStateIndexForStep(100)).toBeUndefined();
      expect(timeAxis.getStateIndexForStep(-1)).toBeUndefined();
      expect(timeAxis.getStateIndexForStep(1000)).toBeUndefined();
    });

    it('returns correct state for step', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const state = timeAxis.getStateForStep(42);
      expect(state?.step).toBe(42);
      expect(state?.epoch).toBe(0); // Step 42 is in epoch 0 (stepsPerEpoch = 50)
    });

    it('deterministically maps step to same state every time', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      // Call multiple times, should always return same result
      const results = Array.from({ length: 10 }, () => timeAxis.getStateIndexForStep(42));
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('Time Coordinate', () => {
    it('computes correct time coordinate for first state', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const coord = timeAxis.getTimeCoordinate(0);

      expect(coord.step).toBe(0);
      expect(coord.epoch).toBe(0);
      expect(coord.epochProgress).toBe(0);
      expect(coord.overallProgress).toBe(0);
    });

    it('computes correct time coordinate for last state', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const coord = timeAxis.getTimeCoordinate(99);

      expect(coord.step).toBe(99);
      expect(coord.epoch).toBe(1);
      expect(coord.overallProgress).toBeCloseTo(1, 10);
    });

    it('computes correct epoch progress', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      // Step 25 is halfway through epoch 0
      const coord = timeAxis.getTimeCoordinate(25);
      expect(coord.epochProgress).toBeCloseTo(0.5102, 2); // 25 / 49 ≈ 0.51
    });

    it('throws for invalid state index', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(() => timeAxis.getTimeCoordinate(-1)).toThrow();
      expect(() => timeAxis.getTimeCoordinate(100)).toThrow();
    });
  });

  describe('Epoch Boundaries', () => {
    it('identifies all epoch boundaries', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      const boundaries = timeAxis.getEpochBoundaries();

      expect(boundaries).toHaveLength(3);
      expect(boundaries.map((b) => b.epoch)).toEqual([0, 1, 2]);
    });

    it('marks first and last epoch correctly', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      const boundaries = timeAxis.getEpochBoundaries();

      expect(boundaries[0].isFirst).toBe(true);
      expect(boundaries[0].isLast).toBe(false);
      expect(boundaries[2].isFirst).toBe(false);
      expect(boundaries[2].isLast).toBe(true);
    });

    it('records correct start step for each epoch', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      const boundaries = timeAxis.getEpochBoundaries();

      expect(boundaries[0].startStep).toBe(0);
      expect(boundaries[1].startStep).toBe(100);
      expect(boundaries[2].startStep).toBe(200);
    });

    it('records correct state index for each epoch', () => {
      const trajectory = createStandardTrajectory(250, 100);
      const timeAxis = new TimeAxis(trajectory);

      const boundaries = timeAxis.getEpochBoundaries();

      expect(boundaries[0].stateIndex).toBe(0);
      expect(boundaries[1].stateIndex).toBe(100);
      expect(boundaries[2].stateIndex).toBe(200);
    });

    it('handles single-state trajectory', () => {
      const trajectory = createTrajectory([createLog({ step: 0, epoch: 0 })]);
      const timeAxis = new TimeAxis(trajectory);

      const boundaries = timeAxis.getEpochBoundaries();

      expect(boundaries).toHaveLength(1);
      expect(boundaries[0].isFirst).toBe(true);
      expect(boundaries[0].isLast).toBe(true);
    });
  });

  describe('Epoch Progress Navigation', () => {
    it('navigates to start of epoch with progress 0', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const index = timeAxis.getStateIndexForEpochProgress(1, 0);
      expect(index).toBe(50); // First state of epoch 1
    });

    it('navigates to end of epoch with progress 1', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const index = timeAxis.getStateIndexForEpochProgress(0, 1);
      expect(index).toBe(49); // Last state of epoch 0
    });

    it('navigates to middle of epoch with progress 0.5', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const index = timeAxis.getStateIndexForEpochProgress(0, 0.5);
      expect(index).toBe(25); // Middle of epoch 0 (rounded: 0.5 * 49 ≈ 25)
    });

    it('clamps progress to [0, 1]', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getStateIndexForEpochProgress(0, -0.5)).toBe(0);
      expect(timeAxis.getStateIndexForEpochProgress(0, 1.5)).toBe(49);
    });

    it('returns undefined for non-existent epoch', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getStateIndexForEpochProgress(5, 0.5)).toBeUndefined();
    });
  });

  describe('States in Epoch', () => {
    it('returns all states in a specific epoch', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const timeAxis = new TimeAxis(trajectory);

      const statesEpoch0 = timeAxis.getStatesInEpoch(0);
      const statesEpoch1 = timeAxis.getStatesInEpoch(1);
      const statesEpoch2 = timeAxis.getStatesInEpoch(2);

      expect(statesEpoch0).toHaveLength(50);
      expect(statesEpoch1).toHaveLength(50);
      expect(statesEpoch2).toHaveLength(50);
    });

    it('returns empty array for non-existent epoch', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getStatesInEpoch(10)).toHaveLength(0);
    });
  });

  describe('Time Range Queries', () => {
    it('returns indices within step range', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const indices = timeAxis.getStatesInRange({ startStep: 20, endStep: 30 });

      expect(indices).toHaveLength(11); // Steps 20-30 inclusive
      expect(indices[0]).toBe(20);
      expect(indices[indices.length - 1]).toBe(30);
    });

    it('filters by epoch when specified', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const timeAxis = new TimeAxis(trajectory);

      const indices = timeAxis.getStatesInRange({
        startStep: 0,
        endStep: 149,
        epochs: [1],
      });

      expect(indices).toHaveLength(50); // Only epoch 1 states
      expect(timeAxis.getTimeCoordinate(indices[0]).epoch).toBe(1);
    });

    it('handles empty range', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      const indices = timeAxis.getStatesInRange({ startStep: 200, endStep: 300 });

      expect(indices).toHaveLength(0);
    });
  });

  describe('Epoch Crossing Updates', () => {
    it('identifies updates that cross epoch boundaries', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const timeAxis = new TimeAxis(trajectory);

      const crossingUpdates = timeAxis.getEpochCrossingUpdates();

      expect(crossingUpdates).toHaveLength(2); // Crossings at steps 49→50 and 99→100
    });

    it('returns empty for single-epoch trajectory', () => {
      const trajectory = createStandardTrajectory(30, 50); // All in epoch 0
      const timeAxis = new TimeAxis(trajectory);

      const crossingUpdates = timeAxis.getEpochCrossingUpdates();

      expect(crossingUpdates).toHaveLength(0);
    });
  });

  describe('Updates in Epoch', () => {
    it('returns updates within a specific epoch', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const timeAxis = new TimeAxis(trajectory);

      const updatesEpoch0 = timeAxis.getUpdatesInEpoch(0);

      // Epoch 0 has 50 states (steps 0-49), so 49 updates within it
      // But the last update (49→50) crosses into epoch 1
      expect(updatesEpoch0).toHaveLength(49);
    });
  });

  describe('Nearest State Index', () => {
    it('returns exact match when step exists', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getNearestStateIndex(42)).toBe(42);
    });

    it('finds nearest state for non-existent step', () => {
      // Create trajectory with gaps
      const logs = [
        createLog({ step: 0, epoch: 0 }),
        createLog({ step: 10, epoch: 0 }),
        createLog({ step: 20, epoch: 0 }),
      ];
      const trajectory = createTrajectory(logs);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.getNearestStateIndex(4)).toBe(0); // Closer to step 0 (diff 4 vs 6)
      expect(timeAxis.getNearestStateIndex(6)).toBe(1); // Closer to step 10 (diff 6 vs 4)
      expect(timeAxis.getNearestStateIndex(14)).toBe(1); // Closer to step 10 (diff 4 vs 6)
      expect(timeAxis.getNearestStateIndex(16)).toBe(2); // Closer to step 20 (diff 6 vs 4)
    });
  });

  describe('Gap Detection', () => {
    it('reports no gaps for continuous trajectory', () => {
      const trajectory = createStandardTrajectory(100, 50);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.hasGaps()).toBe(false);
      expect(timeAxis.getGaps()).toHaveLength(0);
    });

    it('detects gaps in trajectory', () => {
      const logs = [
        createLog({ step: 0, epoch: 0 }),
        createLog({ step: 5, epoch: 0 }), // Gap: missing 1-4
        createLog({ step: 10, epoch: 0 }), // Gap: missing 6-9
      ];
      const trajectory = createTrajectory(logs);
      const timeAxis = new TimeAxis(trajectory);

      expect(timeAxis.hasGaps()).toBe(true);
      const gaps = timeAxis.getGaps();
      expect(gaps).toHaveLength(2);
      expect(gaps[0]).toEqual({ afterStep: 0, missingCount: 4 });
      expect(gaps[1]).toEqual({ afterStep: 5, missingCount: 4 });
    });
  });
});

describe('Phase Markers', () => {
  describe('Epoch Markers', () => {
    it('creates markers for all epoch starts', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const markers = createEpochMarkers(trajectory);

      expect(markers).toHaveLength(3);
      expect(markers.map((m) => m.epoch)).toEqual([0, 1, 2]);
      expect(markers.every((m) => m.type === 'epoch_start')).toBe(true);
    });

    it('includes correct step and state index', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const markers = createEpochMarkers(trajectory);

      expect(markers[0].step).toBe(0);
      expect(markers[0].stateIndex).toBe(0);
      expect(markers[1].step).toBe(50);
      expect(markers[1].stateIndex).toBe(50);
    });

    it('has meaningful labels', () => {
      const trajectory = createStandardTrajectory(150, 50);
      const markers = createEpochMarkers(trajectory);

      expect(markers[0].label).toBe('Epoch 0');
      expect(markers[1].label).toBe('Epoch 1');
    });
  });

  describe('LR Change Markers', () => {
    it('detects learning rate changes', () => {
      const logs = [
        createLog({ step: 0, epoch: 0, learningRate: 0.001 }),
        createLog({ step: 1, epoch: 0, learningRate: 0.001 }),
        createLog({ step: 2, epoch: 0, learningRate: 0.0001 }), // 90% change
        createLog({ step: 3, epoch: 0, learningRate: 0.0001 }),
      ];
      const trajectory = createTrajectory(logs);
      const markers = createLRChangeMarkers(trajectory);

      expect(markers).toHaveLength(1);
      expect(markers[0].step).toBe(2);
      expect(markers[0].type).toBe('lr_change');
    });

    it('ignores small learning rate changes', () => {
      const logs = [
        createLog({ step: 0, epoch: 0, learningRate: 0.001 }),
        createLog({ step: 1, epoch: 0, learningRate: 0.001001 }), // 0.1% change
        createLog({ step: 2, epoch: 0, learningRate: 0.001002 }),
      ];
      const trajectory = createTrajectory(logs);
      const markers = createLRChangeMarkers(trajectory, 0.01); // 1% threshold

      expect(markers).toHaveLength(0);
    });

    it('respects custom threshold', () => {
      const logs = [
        createLog({ step: 0, epoch: 0, learningRate: 0.001 }),
        createLog({ step: 1, epoch: 0, learningRate: 0.00095 }), // 5% change
      ];
      const trajectory = createTrajectory(logs);

      const markersLoose = createLRChangeMarkers(trajectory, 0.1); // 10% threshold
      const markersStrict = createLRChangeMarkers(trajectory, 0.01); // 1% threshold

      expect(markersLoose).toHaveLength(0);
      expect(markersStrict).toHaveLength(1);
    });

    it('includes descriptive label with LR values', () => {
      const logs = [
        createLog({ step: 0, epoch: 0, learningRate: 0.001 }),
        createLog({ step: 1, epoch: 0, learningRate: 0.0001 }),
      ];
      const trajectory = createTrajectory(logs);
      const markers = createLRChangeMarkers(trajectory);

      expect(markers[0].label).toContain('1.00e-3');
      expect(markers[0].label).toContain('1.00e-4');
    });
  });
});

describe('Determinism Guarantees', () => {
  it('same step always maps to same state across instances', () => {
    const trajectory = createStandardTrajectory(100, 50);

    const results = Array.from({ length: 5 }, () => {
      const timeAxis = new TimeAxis(trajectory);
      return timeAxis.getStateIndexForStep(42);
    });

    expect(new Set(results).size).toBe(1);
  });

  it('epoch boundaries are consistent across instances', () => {
    const trajectory = createStandardTrajectory(150, 50);

    const results = Array.from({ length: 5 }, () => {
      const timeAxis = new TimeAxis(trajectory);
      return JSON.stringify(timeAxis.getEpochBoundaries());
    });

    expect(new Set(results).size).toBe(1);
  });

  it('time coordinates are consistent across instances', () => {
    const trajectory = createStandardTrajectory(100, 50);

    const results = Array.from({ length: 5 }, () => {
      const timeAxis = new TimeAxis(trajectory);
      return JSON.stringify(timeAxis.getTimeCoordinate(42));
    });

    expect(new Set(results).size).toBe(1);
  });
});
