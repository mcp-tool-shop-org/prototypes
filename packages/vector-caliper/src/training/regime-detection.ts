/**
 * Stability & Regime Detection
 *
 * Identifies qualitative training regimes.
 * Regimes are computed from existing state variables.
 * No regime affects visualization geometry.
 *
 * Guarantees:
 * - Regimes are annotations, not state
 * - Removing regime logic does not change visuals
 * - Regime labels explain, never drive
 */

import { TrainingState, TrainingTrajectory, UpdateVector } from './types';

/**
 * Training regime classification.
 * These are qualitative states — not heuristics, explicit thresholds.
 */
export type TrainingRegime =
  | 'stable_convergence'
  | 'oscillatory'
  | 'chaotic'
  | 'collapsed'
  | 'diverging'
  | 'plateau'
  | 'unknown';

/**
 * Regime indicator for a specific state.
 * This is an annotation — it does not modify the state.
 */
export interface RegimeIndicator {
  /** The state this indicator annotates */
  stateId: string;
  /** Step number */
  step: number;
  /** Detected regime */
  regime: TrainingRegime;
  /** Confidence in classification [0, 1] */
  confidence: number;
  /** Supporting evidence (which metrics contributed) */
  evidence: RegimeEvidence;
  /** Human-readable description (neutral language) */
  description: string;
}

/**
 * Evidence supporting regime classification.
 * All values are directly from state — no derived heuristics.
 */
export interface RegimeEvidence {
  /** Recent loss trend: 'decreasing' | 'stable' | 'increasing' | 'oscillating' */
  lossTrend: 'decreasing' | 'stable' | 'increasing' | 'oscillating';
  /** Recent gradient norm trend */
  gradientTrend: 'decreasing' | 'stable' | 'increasing' | 'oscillating';
  /** Update alignment consistency */
  alignmentConsistency: 'high' | 'medium' | 'low';
  /** Loss variance over window */
  lossVariance: number;
  /** Gradient norm variance over window */
  gradientVariance: number;
  /** Mean alignment in window */
  meanAlignment: number;
}

/**
 * Configuration for regime detection.
 * Explicit thresholds — not learned heuristics.
 */
export interface RegimeDetectionConfig {
  /** Window size for computing trends (number of states) */
  windowSize: number;
  /** Threshold for considering loss "stable" (relative change) */
  stabilityThreshold: number;
  /** Threshold for high alignment consistency */
  highAlignmentThreshold: number;
  /** Threshold for low alignment consistency */
  lowAlignmentThreshold: number;
  /** Threshold for detecting oscillation (variance) */
  oscillationThreshold: number;
  /** Threshold for detecting collapse (loss very low + gradient very low) */
  collapseThreshold: number;
  /** Threshold for detecting divergence (loss increasing rapidly) */
  divergenceThreshold: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_REGIME_CONFIG: RegimeDetectionConfig = {
  windowSize: 10,
  stabilityThreshold: 0.01,
  highAlignmentThreshold: 0.7,
  lowAlignmentThreshold: 0.3,
  oscillationThreshold: 0.1,
  collapseThreshold: 0.001,
  divergenceThreshold: 0.5,
};

/**
 * Regime Detector
 *
 * Analyzes training trajectory to identify qualitative regimes.
 * All classifications are based on explicit thresholds, not learned patterns.
 */
export class RegimeDetector {
  private readonly config: RegimeDetectionConfig;

  constructor(
    private readonly trajectory: TrainingTrajectory,
    config: Partial<RegimeDetectionConfig> = {}
  ) {
    this.config = { ...DEFAULT_REGIME_CONFIG, ...config };
  }

  /**
   * Detect regime at a specific state index.
   */
  detectRegimeAt(stateIndex: number): RegimeIndicator {
    const state = this.trajectory.states[stateIndex];
    const window = this.getWindow(stateIndex);
    const evidence = this.computeEvidence(window, stateIndex);
    const { regime, confidence } = this.classifyRegime(evidence);

    return {
      stateId: state.id,
      step: state.step,
      regime,
      confidence,
      evidence,
      description: this.describeRegime(regime, evidence),
    };
  }

  /**
   * Detect regimes for all states in trajectory.
   */
  detectAllRegimes(): RegimeIndicator[] {
    return this.trajectory.states.map((_, i) => this.detectRegimeAt(i));
  }

  /**
   * Get states where regime changes occur.
   */
  getRegimeTransitions(): Array<{
    fromIndex: number;
    toIndex: number;
    fromRegime: TrainingRegime;
    toRegime: TrainingRegime;
  }> {
    const indicators = this.detectAllRegimes();
    const transitions: Array<{
      fromIndex: number;
      toIndex: number;
      fromRegime: TrainingRegime;
      toRegime: TrainingRegime;
    }> = [];

    for (let i = 1; i < indicators.length; i++) {
      if (indicators[i].regime !== indicators[i - 1].regime) {
        transitions.push({
          fromIndex: i - 1,
          toIndex: i,
          fromRegime: indicators[i - 1].regime,
          toRegime: indicators[i].regime,
        });
      }
    }

    return transitions;
  }

  /**
   * Summarize regime distribution across trajectory.
   */
  summarizeRegimes(): Map<TrainingRegime, number> {
    const indicators = this.detectAllRegimes();
    const counts = new Map<TrainingRegime, number>();

    for (const indicator of indicators) {
      counts.set(indicator.regime, (counts.get(indicator.regime) ?? 0) + 1);
    }

    return counts;
  }

  // Private helpers

  private getWindow(stateIndex: number): TrainingState[] {
    const start = Math.max(0, stateIndex - this.config.windowSize + 1);
    return this.trajectory.states.slice(start, stateIndex + 1);
  }

  private getUpdatesInWindow(stateIndex: number): UpdateVector[] {
    const start = Math.max(0, stateIndex - this.config.windowSize);
    const end = stateIndex;
    return this.trajectory.updates.slice(start, end);
  }

  private computeEvidence(window: TrainingState[], stateIndex: number): RegimeEvidence {
    const losses = window.map((s) => s.performance.loss);
    const gradients = window.map((s) => s.training.gradientNorm);
    const updates = this.getUpdatesInWindow(stateIndex);
    const alignments = updates.map((u) => u.alignment);

    return {
      lossTrend: this.computeTrend(losses),
      gradientTrend: this.computeTrend(gradients),
      alignmentConsistency: this.computeAlignmentConsistency(alignments),
      lossVariance: this.computeVariance(losses),
      gradientVariance: this.computeVariance(gradients),
      meanAlignment: alignments.length > 0
        ? alignments.reduce((a, b) => a + b, 0) / alignments.length
        : 0,
    };
  }

  private computeTrend(values: number[]): 'decreasing' | 'stable' | 'increasing' | 'oscillating' {
    if (values.length < 2) return 'stable';

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const meanY = sumY / n;
    const relativeSlope = meanY !== 0 ? slope / meanY : slope;

    // Check for oscillation
    const variance = this.computeVariance(values);
    const normalizedVariance = meanY !== 0 ? variance / (meanY * meanY) : variance;

    if (normalizedVariance > this.config.oscillationThreshold) {
      return 'oscillating';
    }

    if (relativeSlope < -this.config.stabilityThreshold) {
      return 'decreasing';
    } else if (relativeSlope > this.config.stabilityThreshold) {
      return 'increasing';
    } else {
      return 'stable';
    }
  }

  private computeVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private computeAlignmentConsistency(alignments: number[]): 'high' | 'medium' | 'low' {
    if (alignments.length === 0) return 'medium';

    const mean = alignments.reduce((a, b) => a + b, 0) / alignments.length;

    if (mean > this.config.highAlignmentThreshold) {
      return 'high';
    } else if (mean < this.config.lowAlignmentThreshold) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  private classifyRegime(evidence: RegimeEvidence): {
    regime: TrainingRegime;
    confidence: number;
  } {
    // Priority-ordered classification rules (explicit, not learned)

    // 1. Check for collapse (very low gradient and loss)
    if (
      evidence.gradientTrend === 'stable' &&
      evidence.lossTrend === 'stable' &&
      evidence.lossVariance < this.config.collapseThreshold &&
      evidence.gradientVariance < this.config.collapseThreshold
    ) {
      return { regime: 'collapsed', confidence: 0.9 };
    }

    // 2. Check for divergence (loss increasing rapidly)
    if (
      evidence.lossTrend === 'increasing' &&
      evidence.lossVariance > this.config.divergenceThreshold
    ) {
      return { regime: 'diverging', confidence: 0.85 };
    }

    // 3. Check for chaos (high variance, low alignment consistency)
    if (
      evidence.alignmentConsistency === 'low' &&
      (evidence.lossTrend === 'oscillating' || evidence.gradientTrend === 'oscillating')
    ) {
      return { regime: 'chaotic', confidence: 0.8 };
    }

    // 4. Check for oscillation (moderate variance, medium alignment)
    if (
      evidence.lossTrend === 'oscillating' ||
      evidence.gradientTrend === 'oscillating'
    ) {
      return { regime: 'oscillatory', confidence: 0.75 };
    }

    // 5. Check for plateau (stable loss, low gradient)
    if (
      evidence.lossTrend === 'stable' &&
      evidence.gradientTrend === 'stable' &&
      evidence.alignmentConsistency !== 'low'
    ) {
      return { regime: 'plateau', confidence: 0.7 };
    }

    // 6. Check for stable convergence (decreasing loss, high alignment)
    if (
      evidence.lossTrend === 'decreasing' &&
      evidence.alignmentConsistency === 'high'
    ) {
      return { regime: 'stable_convergence', confidence: 0.9 };
    }

    // 7. Moderate convergence (decreasing loss, medium alignment)
    if (evidence.lossTrend === 'decreasing') {
      return { regime: 'stable_convergence', confidence: 0.6 };
    }

    // 8. Default: unknown
    return { regime: 'unknown', confidence: 0.3 };
  }

  private describeRegime(regime: TrainingRegime, evidence: RegimeEvidence): string {
    // Neutral language only — describe, don't evaluate
    const descriptions: Record<TrainingRegime, string> = {
      stable_convergence: `Loss ${evidence.lossTrend}, gradient alignment ${evidence.alignmentConsistency}`,
      oscillatory: `Loss and/or gradient showing oscillation pattern`,
      chaotic: `High variance in updates with low alignment consistency`,
      collapsed: `Very low variance in both loss and gradient`,
      diverging: `Loss increasing with high variance`,
      plateau: `Loss and gradient stable`,
      unknown: `Regime not clearly identified`,
    };

    return descriptions[regime];
  }
}

/**
 * Stability score for a state.
 * Higher = more stable. Based on explicit formula, not heuristics.
 */
export function computeStabilityScore(indicator: RegimeIndicator): number {
  const regimeScores: Record<TrainingRegime, number> = {
    stable_convergence: 1.0,
    plateau: 0.8,
    oscillatory: 0.5,
    unknown: 0.4,
    chaotic: 0.2,
    diverging: 0.1,
    collapsed: 0.0, // Collapsed is not "stable", it's problematic
  };

  return regimeScores[indicator.regime] * indicator.confidence;
}

/**
 * Generate regime annotations for visualization.
 * These are overlays, not modifications to the visualization.
 */
export function generateRegimeAnnotations(
  indicators: RegimeIndicator[]
): Array<{
  stateId: string;
  step: number;
  label: string;
  color: string;
  opacity: number;
}> {
  const regimeColors: Record<TrainingRegime, string> = {
    stable_convergence: '#22c55e', // Green
    plateau: '#eab308',            // Yellow
    oscillatory: '#f97316',        // Orange
    unknown: '#6b7280',            // Gray
    chaotic: '#ef4444',            // Red
    diverging: '#dc2626',          // Dark red
    collapsed: '#1f2937',          // Dark gray
  };

  return indicators.map((indicator) => ({
    stateId: indicator.stateId,
    step: indicator.step,
    label: indicator.regime.replace('_', ' '),
    color: regimeColors[indicator.regime],
    opacity: indicator.confidence,
  }));
}

/**
 * Verify regime detection determinism.
 */
export function verifyRegimeDetectionDeterminism(
  trajectory: TrainingTrajectory,
  iterations: number = 3
): boolean {
  const results: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const detector = new RegimeDetector(trajectory);
    const indicators = detector.detectAllRegimes();
    results.push(JSON.stringify(indicators));
  }

  return results.every((r) => r === results[0]);
}
