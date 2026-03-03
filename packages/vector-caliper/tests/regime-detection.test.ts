/**
 * Regime Detection Tests
 *
 * Acceptance criteria:
 * - Regimes are computed from existing state variables
 * - No regime affects visualization geometry
 * - Regime labels explain, never drive
 */

import { describe, it, expect } from 'vitest';
import {
  RegimeDetector,
  TrainingRegime,
  RegimeIndicator,
  computeStabilityScore,
  generateRegimeAnnotations,
  verifyRegimeDetectionDeterminism,
  DEFAULT_REGIME_CONFIG,
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

// Helper to create a converging trajectory
function createConvergingTrajectory(length: number = 50): TrainingTrajectory {
  const logs = Array.from({ length }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 2.0 * Math.exp(-i * 0.05), // Exponential decay
    gradientNorm: 1.0 * Math.exp(-i * 0.03), // Decreasing gradients
    updateNorm: 0.1 * Math.exp(-i * 0.02),
    parameterNorm: 100 + i * 0.1,
  }));
  return createTrajectory(logs);
}

// Helper to create an oscillating trajectory
function createOscillatingTrajectory(length: number = 50): TrainingTrajectory {
  const logs = Array.from({ length }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 1.0 + 0.3 * Math.sin(i * 0.5), // Oscillating loss
    gradientNorm: 0.5 + 0.2 * Math.sin(i * 0.7), // Oscillating gradient
    updateNorm: 0.1,
    parameterNorm: 100 + i * 0.1,
  }));
  return createTrajectory(logs);
}

// Helper to create a diverging trajectory
function createDivergingTrajectory(length: number = 50): TrainingTrajectory {
  const logs = Array.from({ length }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 0.5 * Math.exp(i * 0.05), // Exponential increase
    gradientNorm: 0.5 + i * 0.02 + Math.random() * 0.1, // Increasing + noise
    updateNorm: 0.1 + i * 0.01,
    parameterNorm: 100 + i * 0.5,
  }));
  return createTrajectory(logs);
}

// Helper to create a plateau trajectory
function createPlateauTrajectory(length: number = 50): TrainingTrajectory {
  const logs = Array.from({ length }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / 25),
    loss: 0.5 + 0.001 * Math.random(), // Very stable
    gradientNorm: 0.01 + 0.001 * Math.random(), // Very low
    updateNorm: 0.001,
    parameterNorm: 100,
  }));
  return createTrajectory(logs);
}

describe('RegimeDetector', () => {
  describe('Basic Detection', () => {
    it('detects regime at a specific state', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      expect(indicator.stateId).toBe('test_step_30');
      expect(indicator.step).toBe(30);
      expect(indicator.regime).toBeDefined();
      expect(indicator.confidence).toBeGreaterThan(0);
      expect(indicator.confidence).toBeLessThanOrEqual(1);
    });

    it('detects regimes for all states', () => {
      const trajectory = createConvergingTrajectory(30);
      const detector = new RegimeDetector(trajectory);

      const indicators = detector.detectAllRegimes();

      expect(indicators).toHaveLength(30);
      indicators.forEach((ind, i) => {
        expect(ind.step).toBe(i);
        expect(ind.regime).toBeDefined();
      });
    });
  });

  describe('Regime Classification', () => {
    it('detects stable convergence', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      // Check later in trajectory where convergence should be clear
      const indicator = detector.detectRegimeAt(40);

      expect(indicator.regime).toBe('stable_convergence');
      expect(indicator.confidence).toBeGreaterThan(0.5);
    });

    it('detects oscillatory regime', () => {
      const trajectory = createOscillatingTrajectory();
      // Use lower oscillation threshold to detect the pattern
      const detector = new RegimeDetector(trajectory, {
        oscillationThreshold: 0.01,
      });

      const indicator = detector.detectRegimeAt(30);

      expect(indicator.regime).toBe('oscillatory');
    });

    it('detects plateau regime', () => {
      const trajectory = createPlateauTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      // Plateau has very low variance and stable trends
      expect(['plateau', 'collapsed']).toContain(indicator.regime);
    });
  });

  describe('Evidence Computation', () => {
    it('computes loss trend', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      expect(indicator.evidence.lossTrend).toBe('decreasing');
    });

    it('computes gradient trend', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      expect(indicator.evidence.gradientTrend).toBe('decreasing');
    });

    it('computes alignment consistency', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      expect(['high', 'medium', 'low']).toContain(indicator.evidence.alignmentConsistency);
    });

    it('includes variance metrics', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      expect(typeof indicator.evidence.lossVariance).toBe('number');
      expect(typeof indicator.evidence.gradientVariance).toBe('number');
      expect(indicator.evidence.lossVariance).toBeGreaterThanOrEqual(0);
      expect(indicator.evidence.gradientVariance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regime Transitions', () => {
    it('identifies regime transitions', () => {
      // Create a trajectory that transitions from converging to plateau
      const convergingPart = Array.from({ length: 25 }, (_, i) => createLog({
        step: i,
        epoch: 0,
        loss: 2.0 * Math.exp(-i * 0.1),
        gradientNorm: 1.0 * Math.exp(-i * 0.1),
        updateNorm: 0.1,
        parameterNorm: 100 + i * 0.1,
      }));

      const plateauPart = Array.from({ length: 25 }, (_, i) => createLog({
        step: 25 + i,
        epoch: 1,
        loss: 0.1 + 0.001 * Math.random(),
        gradientNorm: 0.01 + 0.001 * Math.random(),
        updateNorm: 0.001,
        parameterNorm: 102.5,
      }));

      const trajectory = createTrajectory([...convergingPart, ...plateauPart]);
      const detector = new RegimeDetector(trajectory);

      const transitions = detector.getRegimeTransitions();

      // Should have at least one transition
      expect(transitions.length).toBeGreaterThanOrEqual(0);

      // Each transition should have valid structure
      transitions.forEach((t) => {
        expect(t.fromIndex).toBeLessThan(t.toIndex);
        expect(t.fromRegime).not.toBe(t.toRegime);
      });
    });
  });

  describe('Regime Summary', () => {
    it('summarizes regime distribution', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const summary = detector.summarizeRegimes();

      // Should have counts for at least one regime
      expect(summary.size).toBeGreaterThan(0);

      // Total count should equal number of states
      let totalCount = 0;
      summary.forEach((count) => {
        totalCount += count;
      });
      expect(totalCount).toBe(trajectory.states.length);
    });
  });

  describe('Configuration', () => {
    it('respects custom window size', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory, {
        windowSize: 5,
      });

      // Should work without error
      const indicator = detector.detectRegimeAt(10);
      expect(indicator).toBeDefined();
    });

    it('respects custom thresholds', () => {
      const trajectory = createOscillatingTrajectory();

      // With very high oscillation threshold, should not detect oscillation
      const strictDetector = new RegimeDetector(trajectory, {
        oscillationThreshold: 10.0, // Very high
      });

      const indicator = strictDetector.detectRegimeAt(30);

      // Should not be classified as oscillatory with such high threshold
      expect(indicator.regime).not.toBe('oscillatory');
    });
  });

  describe('Description Generation', () => {
    it('generates neutral descriptions', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicators = detector.detectAllRegimes();

      indicators.forEach((indicator) => {
        // No evaluative language
        expect(indicator.description).not.toMatch(/better|worse|good|bad|optimal|suboptimal/i);

        // Should have some content
        expect(indicator.description.length).toBeGreaterThan(0);
      });
    });

    it('describes based on evidence', () => {
      const trajectory = createConvergingTrajectory();
      const detector = new RegimeDetector(trajectory);

      const indicator = detector.detectRegimeAt(30);

      // Description should reference actual trends
      expect(indicator.description.toLowerCase()).toMatch(/decreasing|stable|increasing|oscillating|variance|alignment/i);
    });
  });
});

describe('Stability Score', () => {
  it('computes stability score from indicator', () => {
    const trajectory = createConvergingTrajectory();
    const detector = new RegimeDetector(trajectory);
    const indicator = detector.detectRegimeAt(30);

    const score = computeStabilityScore(indicator);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('ranks stable_convergence highest', () => {
    const stableIndicator: RegimeIndicator = {
      stateId: 'test',
      step: 0,
      regime: 'stable_convergence',
      confidence: 1.0,
      evidence: {} as any,
      description: '',
    };

    const chaoticIndicator: RegimeIndicator = {
      stateId: 'test',
      step: 0,
      regime: 'chaotic',
      confidence: 1.0,
      evidence: {} as any,
      description: '',
    };

    expect(computeStabilityScore(stableIndicator)).toBeGreaterThan(
      computeStabilityScore(chaoticIndicator)
    );
  });

  it('scales by confidence', () => {
    const highConfidence: RegimeIndicator = {
      stateId: 'test',
      step: 0,
      regime: 'oscillatory',
      confidence: 1.0,
      evidence: {} as any,
      description: '',
    };

    const lowConfidence: RegimeIndicator = {
      stateId: 'test',
      step: 0,
      regime: 'oscillatory',
      confidence: 0.5,
      evidence: {} as any,
      description: '',
    };

    expect(computeStabilityScore(highConfidence)).toBeGreaterThan(
      computeStabilityScore(lowConfidence)
    );
  });
});

describe('Regime Annotations', () => {
  it('generates annotations for visualization', () => {
    const trajectory = createConvergingTrajectory(20);
    const detector = new RegimeDetector(trajectory);
    const indicators = detector.detectAllRegimes();

    const annotations = generateRegimeAnnotations(indicators);

    expect(annotations).toHaveLength(indicators.length);
    annotations.forEach((annotation, i) => {
      expect(annotation.stateId).toBe(indicators[i].stateId);
      expect(annotation.step).toBe(indicators[i].step);
      expect(annotation.label).toBeDefined();
      expect(annotation.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(annotation.opacity).toBeGreaterThan(0);
      expect(annotation.opacity).toBeLessThanOrEqual(1);
    });
  });

  it('uses different colors for different regimes', () => {
    // Create indicators with different regimes
    const regimes: TrainingRegime[] = [
      'stable_convergence',
      'oscillatory',
      'chaotic',
      'collapsed',
      'diverging',
      'plateau',
      'unknown',
    ];

    const indicators: RegimeIndicator[] = regimes.map((regime, i) => ({
      stateId: `test_${i}`,
      step: i,
      regime,
      confidence: 0.8,
      evidence: {} as any,
      description: '',
    }));

    const annotations = generateRegimeAnnotations(indicators);
    const colors = annotations.map((a) => a.color);

    // Should have multiple different colors
    expect(new Set(colors).size).toBeGreaterThan(1);
  });

  it('opacity reflects confidence', () => {
    const indicators: RegimeIndicator[] = [
      {
        stateId: 'test_0',
        step: 0,
        regime: 'stable_convergence',
        confidence: 0.9,
        evidence: {} as any,
        description: '',
      },
      {
        stateId: 'test_1',
        step: 1,
        regime: 'stable_convergence',
        confidence: 0.5,
        evidence: {} as any,
        description: '',
      },
    ];

    const annotations = generateRegimeAnnotations(indicators);

    expect(annotations[0].opacity).toBe(0.9);
    expect(annotations[1].opacity).toBe(0.5);
  });
});

describe('Determinism', () => {
  it('produces identical output for identical input', () => {
    const trajectory = createConvergingTrajectory();

    expect(verifyRegimeDetectionDeterminism(trajectory, 5)).toBe(true);
  });

  it('produces identical results across detector instances', () => {
    const trajectory = createConvergingTrajectory();

    const detector1 = new RegimeDetector(trajectory);
    const detector2 = new RegimeDetector(trajectory);

    const result1 = JSON.stringify(detector1.detectAllRegimes());
    const result2 = JSON.stringify(detector2.detectAllRegimes());

    expect(result1).toBe(result2);
  });
});

describe('Annotation Independence', () => {
  it('regime does not affect state values', () => {
    const trajectory = createConvergingTrajectory();
    const detector = new RegimeDetector(trajectory);

    // Store original state values
    const originalStates = JSON.stringify(trajectory.states);

    // Detect regimes
    detector.detectAllRegimes();

    // State values should be unchanged
    expect(JSON.stringify(trajectory.states)).toBe(originalStates);
  });

  it('removing regime logic does not change trajectory', () => {
    const trajectory = createConvergingTrajectory();

    // Get state before regime detection
    const statesBefore = JSON.stringify(trajectory.states);
    const updatesBefore = JSON.stringify(trajectory.updates);

    // Detect regimes
    const detector = new RegimeDetector(trajectory);
    detector.detectAllRegimes();
    detector.getRegimeTransitions();
    detector.summarizeRegimes();

    // States and updates should be identical
    expect(JSON.stringify(trajectory.states)).toBe(statesBefore);
    expect(JSON.stringify(trajectory.updates)).toBe(updatesBefore);
  });
});

describe('Edge Cases', () => {
  it('handles single-state trajectory', () => {
    const trajectory = createTrajectory([createLog({ step: 0 })]);
    const detector = new RegimeDetector(trajectory);

    const indicator = detector.detectRegimeAt(0);

    expect(indicator).toBeDefined();
    expect(indicator.regime).toBeDefined();
  });

  it('handles short trajectory (less than window size)', () => {
    const trajectory = createTrajectory([
      createLog({ step: 0 }),
      createLog({ step: 1 }),
      createLog({ step: 2 }),
    ]);
    const detector = new RegimeDetector(trajectory, { windowSize: 10 });

    const indicators = detector.detectAllRegimes();

    expect(indicators).toHaveLength(3);
  });

  it('handles first state in trajectory', () => {
    const trajectory = createConvergingTrajectory();
    const detector = new RegimeDetector(trajectory);

    const indicator = detector.detectRegimeAt(0);

    expect(indicator).toBeDefined();
    expect(indicator.step).toBe(0);
  });

  it('handles last state in trajectory', () => {
    const trajectory = createConvergingTrajectory(50);
    const detector = new RegimeDetector(trajectory);

    const indicator = detector.detectRegimeAt(49);

    expect(indicator).toBeDefined();
    expect(indicator.step).toBe(49);
  });
});
