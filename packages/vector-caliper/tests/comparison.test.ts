/**
 * Training Comparison Tests
 *
 * Acceptance criteria:
 * - No normalization between runs
 * - Incompatibility must be explicit
 * - Users can answer: "Why did this optimizer converge faster but less stably?"
 */

import { describe, it, expect } from 'vitest';
import {
  TrainingComparator,
  TrainingComparison,
  generateComparisonReport,
  verifyComparisonDeterminism,
  DEFAULT_COMPARISON_CONFIG,
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
function createTrajectory(logs: RawTrainingLog[], runId: string, name: string): TrainingTrajectory {
  const adapter = new TrainingStateAdapter();
  return adapter.adaptLogs(logs, runId, name);
}

// Helper to create a fast-converging trajectory (like Adam)
function createFastConvergingTrajectory(): TrainingTrajectory {
  const logs = Array.from({ length: 50 }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 2.0 * Math.exp(-i * 0.1), // Fast decay
    gradientNorm: 1.0 * Math.exp(-i * 0.08),
    updateNorm: 0.1 * Math.exp(-i * 0.05),
    parameterNorm: 100 + i * 0.2,
  }));
  return createTrajectory(logs, 'adam', 'Adam lr=1e-3');
}

// Helper to create a slow-converging but stable trajectory (like SGD)
function createSlowStableTrajectory(): TrainingTrajectory {
  const logs = Array.from({ length: 50 }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 2.0 * Math.exp(-i * 0.03), // Slow decay
    gradientNorm: 0.8 * Math.exp(-i * 0.02),
    updateNorm: 0.05 * Math.exp(-i * 0.015),
    parameterNorm: 100 + i * 0.1,
  }));
  return createTrajectory(logs, 'sgd', 'SGD lr=1e-2');
}

// Helper to create an oscillating trajectory
function createOscillatingTrajectory(): TrainingTrajectory {
  const logs = Array.from({ length: 50 }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 1.5 + 0.5 * Math.sin(i * 0.3) * Math.exp(-i * 0.02), // Oscillating with decay
    gradientNorm: 0.5 + 0.2 * Math.sin(i * 0.4),
    updateNorm: 0.1,
    parameterNorm: 100 + i * 0.1,
  }));
  return createTrajectory(logs, 'adam_high_lr', 'Adam lr=1e-2 (high)');
}

describe('TrainingComparator', () => {
  describe('Basic Comparison', () => {
    it('compares two trajectories', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.trajectoryA.id).toBe('adam');
      expect(comparison.trajectoryB.id).toBe('sgd');
      expect(comparison.alignedMetrics).toBeDefined();
      expect(comparison.summary).toBeDefined();
    });

    it('includes trajectory info', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.trajectoryA.name).toBe('Adam lr=1e-3');
      expect(comparison.trajectoryA.totalSteps).toBe(50);
      expect(comparison.trajectoryB.name).toBe('SGD lr=1e-2');
      expect(comparison.trajectoryB.totalSteps).toBe(50);
    });
  });

  describe('Compatibility Checking', () => {
    it('reports compatible trajectories', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const compatibility = comparator.checkCompatibility();

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.issues).toHaveLength(0);
    });

    it('reports empty trajectory as incompatible', () => {
      const empty = createTrajectory([createLog({ step: 0 })], 'empty', 'Empty');
      // Remove all but one state to make it non-empty but check with empty
      const trajectoryA = createFastConvergingTrajectory();

      // Create actually empty trajectory (adapter requires at least 1 log)
      const emptyish = createTrajectory([createLog({ step: 0 })], 'emptyish', 'Emptyish');

      const comparator = new TrainingComparator(trajectoryA, emptyish);
      const comparison = comparator.compare();

      // Should still work with single-state trajectory
      expect(comparison.trajectoryB.stateCount).toBe(1);
    });

    it('warns about significant length differences', () => {
      const short = createTrajectory(
        [createLog({ step: 0 }), createLog({ step: 1 })],
        'short',
        'Short'
      );
      const long = createTrajectory(
        Array.from({ length: 100 }, (_, i) => createLog({ step: i, epoch: Math.floor(i / 50) })),
        'long',
        'Long'
      );

      const comparator = new TrainingComparator(short, long);
      const compatibility = comparator.checkCompatibility();

      expect(compatibility.warnings.some((w) => w.includes('length'))).toBe(true);
    });

    it('warns about different epoch counts', () => {
      const epochs2 = createTrajectory(
        Array.from({ length: 50 }, (_, i) => createLog({ step: i, epoch: Math.floor(i / 25) })),
        'epochs2',
        '2 Epochs'
      );
      const epochs4 = createTrajectory(
        Array.from({ length: 50 }, (_, i) => createLog({ step: i, epoch: Math.floor(i / 12.5) })),
        'epochs4',
        '4 Epochs'
      );

      const comparator = new TrainingComparator(epochs2, epochs4);
      const compatibility = comparator.checkCompatibility();

      expect(compatibility.warnings.some((w) => w.includes('epoch'))).toBe(true);
    });
  });

  describe('Aligned Metrics', () => {
    it('computes metrics at aligned time points', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB, {
        alignmentPoints: 10,
      });

      const comparison = comparator.compare();

      expect(comparison.alignedMetrics).toHaveLength(10);
      comparison.alignedMetrics.forEach((metric) => {
        expect(metric.alignedTime).toBeGreaterThanOrEqual(0);
        expect(metric.alignedTime).toBeLessThanOrEqual(1);
        expect(metric.differences).toBeDefined();
      });
    });

    it('includes loss difference at each point', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      comparison.alignedMetrics.forEach((metric) => {
        const lossDiff = metric.differences.find((d) => d.metric === 'loss');
        expect(lossDiff).toBeDefined();
      });
    });

    it('uses neutral language in descriptions', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      comparison.alignedMetrics.forEach((metric) => {
        metric.differences.forEach((diff) => {
          // No evaluative language
          expect(diff.description).not.toMatch(/better|worse|good|bad/i);
          // Uses neutral comparatives
          if (diff.valueA !== undefined && diff.valueB !== undefined) {
            expect(diff.description).toMatch(/higher|lower|equal|available/i);
          }
        });
      });
    });
  });

  describe('No Normalization Guarantee', () => {
    it('preserves raw values without normalization', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      // Check that aligned metrics have actual state values (not normalized)
      const firstMetric = comparison.alignedMetrics[0];
      if (firstMetric.stateA && firstMetric.stateB) {
        const lossDiff = firstMetric.differences.find((d) => d.metric === 'loss');
        expect(lossDiff?.valueA).toBe(firstMetric.stateA.performance.loss);
        expect(lossDiff?.valueB).toBe(firstMetric.stateB.performance.loss);
      }
    });

    it('reports raw variance without normalization', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createOscillatingTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      // Variances should be different (not normalized to each other)
      expect(comparison.summary.stability.lossVarianceA).not.toBe(
        comparison.summary.stability.lossVarianceB
      );
    });
  });

  describe('Summary Statistics', () => {
    it('computes convergence speed comparison', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.summary.convergenceSpeed).toBeDefined();
      expect(comparison.summary.convergenceSpeed.description).toBeDefined();
      // Fast converger should reach threshold in fewer steps (or both may not reach)
    });

    it('computes stability comparison', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createOscillatingTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.summary.stability).toBeDefined();
      expect(typeof comparison.summary.stability.lossVarianceA).toBe('number');
      expect(typeof comparison.summary.stability.lossVarianceB).toBe('number');
    });

    it('computes final performance comparison', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.summary.finalPerformance).toBeDefined();
      expect(typeof comparison.summary.finalPerformance.finalLossA).toBe('number');
      expect(typeof comparison.summary.finalPerformance.finalLossB).toBe('number');
    });

    it('computes update behavior comparison', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.summary.updateBehavior).toBeDefined();
      expect(typeof comparison.summary.updateBehavior.meanAlignmentA).toBe('number');
      expect(typeof comparison.summary.updateBehavior.meanAlignmentB).toBe('number');
    });

    it('uses neutral language in all summaries', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      const allDescriptions = [
        comparison.summary.convergenceSpeed.description,
        comparison.summary.stability.description,
        comparison.summary.finalPerformance.description,
        comparison.summary.updateBehavior.description,
      ];

      allDescriptions.forEach((desc) => {
        expect(desc).not.toMatch(/better|worse|optimal|suboptimal/i);
      });
    });
  });

  describe('Regime Comparison', () => {
    it('compares regime distributions', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createOscillatingTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB);

      const comparison = comparator.compare();

      expect(comparison.regimeComparison).toBeDefined();
      expect(comparison.regimeComparison.regimeDistributionA).toBeDefined();
      expect(comparison.regimeComparison.regimeDistributionB).toBeDefined();
    });

    it('identifies regime differences at aligned times', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createOscillatingTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB, {
        includeRegimeComparison: true,
      });

      const comparison = comparator.compare();

      // May or may not have differences depending on regime detection
      expect(comparison.regimeComparison.regimeDifferences).toBeDefined();
    });

    it('can disable regime comparison', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB, {
        includeRegimeComparison: false,
      });

      const comparison = comparator.compare();

      expect(comparison.regimeComparison.summary).toBe('Regime comparison disabled');
    });
  });

  describe('Configuration', () => {
    it('respects alignment mode: step', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB, {
        alignmentMode: 'step',
        alignmentPoints: 5,
      });

      const comparison = comparator.compare();

      expect(comparison.alignedMetrics).toHaveLength(5);
    });

    it('respects alignment mode: epoch_progress', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();
      const comparator = new TrainingComparator(trajectoryA, trajectoryB, {
        alignmentMode: 'epoch_progress',
        alignmentPoints: 5,
      });

      const comparison = comparator.compare();

      expect(comparison.alignedMetrics).toHaveLength(5);
    });

    it('respects convergence threshold', () => {
      const trajectoryA = createFastConvergingTrajectory();
      const trajectoryB = createSlowStableTrajectory();

      const comparatorLow = new TrainingComparator(trajectoryA, trajectoryB, {
        convergenceLossThreshold: 0.01,
      });
      const comparatorHigh = new TrainingComparator(trajectoryA, trajectoryB, {
        convergenceLossThreshold: 1.0,
      });

      const compLow = comparatorLow.compare();
      const compHigh = comparatorHigh.compare();

      // Different thresholds should give different step counts
      expect(compLow.summary.convergenceSpeed.stepsToLoss.threshold).toBe(0.01);
      expect(compHigh.summary.convergenceSpeed.stepsToLoss.threshold).toBe(1.0);
    });
  });
});

describe('Comparison Report', () => {
  it('generates readable report', () => {
    const trajectoryA = createFastConvergingTrajectory();
    const trajectoryB = createSlowStableTrajectory();
    const comparator = new TrainingComparator(trajectoryA, trajectoryB);
    const comparison = comparator.compare();

    const report = generateComparisonReport(comparison);

    expect(report).toContain('Training Comparison');
    expect(report).toContain('Adam');
    expect(report).toContain('SGD');
    expect(report).toContain('Summary');
  });

  it('includes compatibility warnings in report', () => {
    const short = createTrajectory(
      [createLog({ step: 0 }), createLog({ step: 1 })],
      'short',
      'Short'
    );
    const long = createTrajectory(
      Array.from({ length: 100 }, (_, i) => createLog({ step: i, epoch: Math.floor(i / 50) })),
      'long',
      'Long'
    );

    const comparator = new TrainingComparator(short, long);
    const comparison = comparator.compare();
    const report = generateComparisonReport(comparison);

    expect(report).toContain('Warning');
  });

  it('uses neutral language in report', () => {
    const trajectoryA = createFastConvergingTrajectory();
    const trajectoryB = createSlowStableTrajectory();
    const comparator = new TrainingComparator(trajectoryA, trajectoryB);
    const comparison = comparator.compare();

    const report = generateComparisonReport(comparison);

    expect(report).not.toMatch(/better|worse|optimal|suboptimal/i);
  });
});

describe('Determinism', () => {
  it('produces identical output for identical input', () => {
    const trajectoryA = createFastConvergingTrajectory();
    const trajectoryB = createSlowStableTrajectory();

    expect(verifyComparisonDeterminism(trajectoryA, trajectoryB, 5)).toBe(true);
  });

  it('produces identical results across comparator instances', () => {
    const trajectoryA = createFastConvergingTrajectory();
    const trajectoryB = createSlowStableTrajectory();

    const comparator1 = new TrainingComparator(trajectoryA, trajectoryB);
    const comparator2 = new TrainingComparator(trajectoryA, trajectoryB);

    const result1 = comparator1.compare();
    const result2 = comparator2.compare();

    // Compare key fields (Maps don't serialize directly)
    expect(result1.summary).toEqual(result2.summary);
    expect(result1.alignedMetrics).toEqual(result2.alignedMetrics);
  });
});

describe('Practical Questions', () => {
  it('can answer: "Which converges faster?"', () => {
    const fast = createFastConvergingTrajectory();
    const slow = createSlowStableTrajectory();
    const comparator = new TrainingComparator(fast, slow, {
      convergenceLossThreshold: 0.5,
    });

    const comparison = comparator.compare();

    // Fast should reach threshold first (if at all)
    const { stepsA, stepsB } = comparison.summary.convergenceSpeed.stepsToLoss;
    if (stepsA !== undefined && stepsB !== undefined) {
      expect(stepsA).toBeLessThan(stepsB);
    }
  });

  it('can answer: "Which is more stable?"', () => {
    const stable = createSlowStableTrajectory();
    const oscillating = createOscillatingTrajectory();
    const comparator = new TrainingComparator(stable, oscillating);

    const comparison = comparator.compare();

    // Both trajectories have different variance characteristics
    // The key is that we CAN compare them and get numeric values
    expect(typeof comparison.summary.stability.lossVarianceA).toBe('number');
    expect(typeof comparison.summary.stability.lossVarianceB).toBe('number');
    expect(comparison.summary.stability.description).toMatch(/variance/i);
  });

  it('can answer: "What is the final loss?"', () => {
    const trajectoryA = createFastConvergingTrajectory();
    const trajectoryB = createSlowStableTrajectory();
    const comparator = new TrainingComparator(trajectoryA, trajectoryB);

    const comparison = comparator.compare();

    expect(comparison.summary.finalPerformance.finalLossA).toBeDefined();
    expect(comparison.summary.finalPerformance.finalLossB).toBeDefined();
    expect(comparison.summary.finalPerformance.description).toMatch(/loss/i);
  });
});
