/**
 * Training Comparison
 *
 * Compare how models learn, not just outcomes.
 * Side-by-side comparison of runs with different optimizers, learning rates, etc.
 *
 * Guarantees:
 * - No normalization between runs
 * - Incompatibility must be explicit
 * - Users can answer: "Why did this optimizer converge faster but less stably?"
 */

import { TrainingTrajectory, TrainingState, UpdateVector } from './types';
import { TimeAxis, TimeCoordinate } from './time-axis';
import { RegimeDetector, TrainingRegime, RegimeIndicator } from './regime-detection';

/**
 * Comparison between two training runs.
 */
export interface TrainingComparison {
  /** First trajectory (A) */
  trajectoryA: TrajectoryInfo;
  /** Second trajectory (B) */
  trajectoryB: TrajectoryInfo;
  /** Compatibility status */
  compatibility: CompatibilityStatus;
  /** Comparison metrics at aligned time points */
  alignedMetrics: AlignedMetric[];
  /** Regime comparison */
  regimeComparison: RegimeComparisonSummary;
  /** Summary statistics */
  summary: ComparisonSummary;
}

/**
 * Info about a trajectory being compared.
 */
export interface TrajectoryInfo {
  id: string;
  name: string;
  totalSteps: number;
  totalEpochs: number;
  stateCount: number;
}

/**
 * Compatibility status for comparison.
 */
export interface CompatibilityStatus {
  /** Whether trajectories can be meaningfully compared */
  compatible: boolean;
  /** Reasons for incompatibility (if any) */
  issues: string[];
  /** Warnings that don't prevent comparison */
  warnings: string[];
  /** Shared projection space available */
  sharedProjection: boolean;
}

/**
 * Metrics aligned at a specific time point.
 */
export interface AlignedMetric {
  /** Time coordinate (aligned by epoch progress or step) */
  alignedTime: number;
  /** State from trajectory A (if available at this time) */
  stateA?: TrainingState;
  /** State from trajectory B (if available at this time) */
  stateB?: TrainingState;
  /** Differences at this time point (neutral language) */
  differences: MetricDifference[];
}

/**
 * Difference in a specific metric.
 * Uses neutral language: "higher", "lower", not "better", "worse".
 */
export interface MetricDifference {
  /** Metric name */
  metric: string;
  /** Value in trajectory A */
  valueA: number | undefined;
  /** Value in trajectory B */
  valueB: number | undefined;
  /** Difference (B - A, if both defined) */
  difference: number | undefined;
  /** Relative difference ((B - A) / A, if both defined and A != 0) */
  relativeDifference: number | undefined;
  /** Neutral description */
  description: string;
}

/**
 * Regime comparison summary.
 */
export interface RegimeComparisonSummary {
  /** Regime distribution for trajectory A */
  regimeDistributionA: Map<TrainingRegime, number>;
  /** Regime distribution for trajectory B */
  regimeDistributionB: Map<TrainingRegime, number>;
  /** Time points where regimes differ */
  regimeDifferences: Array<{
    alignedTime: number;
    regimeA: TrainingRegime;
    regimeB: TrainingRegime;
  }>;
  /** Summary (neutral language) */
  summary: string;
}

/**
 * Summary statistics for comparison.
 */
export interface ComparisonSummary {
  /** Convergence speed comparison */
  convergenceSpeed: {
    stepsToLoss: { threshold: number; stepsA: number | undefined; stepsB: number | undefined };
    description: string;
  };
  /** Stability comparison */
  stability: {
    lossVarianceA: number;
    lossVarianceB: number;
    description: string;
  };
  /** Final performance comparison */
  finalPerformance: {
    finalLossA: number;
    finalLossB: number;
    description: string;
  };
  /** Update behavior comparison */
  updateBehavior: {
    meanAlignmentA: number;
    meanAlignmentB: number;
    description: string;
  };
}

/**
 * Configuration for comparison.
 */
export interface ComparisonConfig {
  /** Alignment mode: 'step' or 'epoch_progress' */
  alignmentMode: 'step' | 'epoch_progress';
  /** Number of aligned time points to compute */
  alignmentPoints: number;
  /** Loss threshold for convergence speed comparison */
  convergenceLossThreshold: number;
  /** Whether to compute regime comparison */
  includeRegimeComparison: boolean;
}

/**
 * Default comparison configuration.
 */
export const DEFAULT_COMPARISON_CONFIG: ComparisonConfig = {
  alignmentMode: 'epoch_progress',
  alignmentPoints: 20,
  convergenceLossThreshold: 0.1,
  includeRegimeComparison: true,
};

/**
 * Training Comparator
 *
 * Compares two training trajectories.
 * No normalization — differences are reported as-is.
 */
export class TrainingComparator {
  private readonly config: ComparisonConfig;
  private readonly timeAxisA: TimeAxis;
  private readonly timeAxisB: TimeAxis;

  constructor(
    private readonly trajectoryA: TrainingTrajectory,
    private readonly trajectoryB: TrainingTrajectory,
    config: Partial<ComparisonConfig> = {}
  ) {
    this.config = { ...DEFAULT_COMPARISON_CONFIG, ...config };
    this.timeAxisA = new TimeAxis(trajectoryA);
    this.timeAxisB = new TimeAxis(trajectoryB);
  }

  /**
   * Perform full comparison.
   */
  compare(): TrainingComparison {
    const compatibility = this.checkCompatibility();
    const alignedMetrics = this.computeAlignedMetrics();
    const regimeComparison = this.config.includeRegimeComparison
      ? this.compareRegimes()
      : this.emptyRegimeComparison();
    const summary = this.computeSummary();

    return {
      trajectoryA: this.getTrajectoryInfo(this.trajectoryA),
      trajectoryB: this.getTrajectoryInfo(this.trajectoryB),
      compatibility,
      alignedMetrics,
      regimeComparison,
      summary,
    };
  }

  /**
   * Check compatibility of the two trajectories.
   */
  checkCompatibility(): CompatibilityStatus {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for empty trajectories
    if (this.trajectoryA.states.length === 0) {
      issues.push('Trajectory A is empty');
    }
    if (this.trajectoryB.states.length === 0) {
      issues.push('Trajectory B is empty');
    }

    // Check for significant length differences
    const lengthRatio = Math.max(
      this.trajectoryA.states.length / this.trajectoryB.states.length,
      this.trajectoryB.states.length / this.trajectoryA.states.length
    );
    if (lengthRatio > 10) {
      warnings.push(
        `Significant length difference: ${this.trajectoryA.states.length} vs ${this.trajectoryB.states.length} states`
      );
    }

    // Check for epoch count differences
    if (this.trajectoryA.totalEpochs !== this.trajectoryB.totalEpochs) {
      warnings.push(
        `Different epoch counts: ${this.trajectoryA.totalEpochs} vs ${this.trajectoryB.totalEpochs}`
      );
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings,
      sharedProjection: issues.length === 0, // Simplified for now
    };
  }

  /**
   * Compute metrics at aligned time points.
   */
  private computeAlignedMetrics(): AlignedMetric[] {
    const metrics: AlignedMetric[] = [];

    for (let i = 0; i < this.config.alignmentPoints; i++) {
      const progress = i / (this.config.alignmentPoints - 1);
      const { stateA, stateB } = this.getStatesAtProgress(progress);

      metrics.push({
        alignedTime: progress,
        stateA,
        stateB,
        differences: this.computeDifferences(stateA, stateB),
      });
    }

    return metrics;
  }

  /**
   * Get states at a specific progress point [0, 1].
   */
  private getStatesAtProgress(progress: number): {
    stateA: TrainingState | undefined;
    stateB: TrainingState | undefined;
  } {
    let stateA: TrainingState | undefined;
    let stateB: TrainingState | undefined;

    if (this.config.alignmentMode === 'step') {
      // Align by step
      const maxSteps = Math.max(this.timeAxisA.totalSteps, this.timeAxisB.totalSteps);
      const targetStep = Math.round(progress * (maxSteps - 1));

      stateA = this.timeAxisA.getStateForStep(targetStep);
      stateB = this.timeAxisB.getStateForStep(targetStep);
    } else {
      // Align by overall progress
      const indexA = Math.round(progress * (this.trajectoryA.states.length - 1));
      const indexB = Math.round(progress * (this.trajectoryB.states.length - 1));

      stateA = this.trajectoryA.states[indexA];
      stateB = this.trajectoryB.states[indexB];
    }

    return { stateA, stateB };
  }

  /**
   * Compute differences between two states.
   */
  private computeDifferences(
    stateA: TrainingState | undefined,
    stateB: TrainingState | undefined
  ): MetricDifference[] {
    const differences: MetricDifference[] = [];

    // Loss comparison
    differences.push(
      this.createDifference('loss', stateA?.performance.loss, stateB?.performance.loss)
    );

    // Accuracy comparison
    if (stateA?.performance.accuracy !== -1 || stateB?.performance.accuracy !== -1) {
      differences.push(
        this.createDifference(
          'accuracy',
          stateA?.performance.accuracy === -1 ? undefined : stateA?.performance.accuracy,
          stateB?.performance.accuracy === -1 ? undefined : stateB?.performance.accuracy
        )
      );
    }

    // Gradient norm comparison
    differences.push(
      this.createDifference(
        'gradient_norm',
        stateA?.training.gradientNorm,
        stateB?.training.gradientNorm
      )
    );

    // Update norm comparison
    differences.push(
      this.createDifference(
        'update_norm',
        stateA?.training.updateNorm,
        stateB?.training.updateNorm
      )
    );

    // Learning rate comparison
    differences.push(
      this.createDifference(
        'learning_rate',
        stateA?.training.learningRate,
        stateB?.training.learningRate
      )
    );

    return differences;
  }

  /**
   * Create a metric difference with neutral language.
   */
  private createDifference(
    metric: string,
    valueA: number | undefined,
    valueB: number | undefined
  ): MetricDifference {
    let difference: number | undefined;
    let relativeDifference: number | undefined;
    let description: string;

    if (valueA !== undefined && valueB !== undefined) {
      difference = valueB - valueA;
      relativeDifference = valueA !== 0 ? (valueB - valueA) / valueA : undefined;

      // Neutral language: higher/lower, not better/worse
      if (Math.abs(difference) < 0.0001) {
        description = `${metric}: approximately equal`;
      } else if (difference > 0) {
        const pct = relativeDifference !== undefined
          ? ` (${(relativeDifference * 100).toFixed(1)}% higher)`
          : '';
        description = `${metric}: B is higher than A${pct}`;
      } else {
        const pct = relativeDifference !== undefined
          ? ` (${(Math.abs(relativeDifference) * 100).toFixed(1)}% lower)`
          : '';
        description = `${metric}: B is lower than A${pct}`;
      }
    } else if (valueA !== undefined) {
      description = `${metric}: only available in A`;
    } else if (valueB !== undefined) {
      description = `${metric}: only available in B`;
    } else {
      description = `${metric}: not available in either`;
    }

    return {
      metric,
      valueA,
      valueB,
      difference,
      relativeDifference,
      description,
    };
  }

  /**
   * Compare regimes between trajectories.
   */
  private compareRegimes(): RegimeComparisonSummary {
    const detectorA = new RegimeDetector(this.trajectoryA);
    const detectorB = new RegimeDetector(this.trajectoryB);

    const indicatorsA = detectorA.detectAllRegimes();
    const indicatorsB = detectorB.detectAllRegimes();

    const regimeDistributionA = detectorA.summarizeRegimes();
    const regimeDistributionB = detectorB.summarizeRegimes();

    // Find regime differences at aligned time points
    const regimeDifferences: Array<{
      alignedTime: number;
      regimeA: TrainingRegime;
      regimeB: TrainingRegime;
    }> = [];

    for (let i = 0; i < this.config.alignmentPoints; i++) {
      const progress = i / (this.config.alignmentPoints - 1);
      const indexA = Math.round(progress * (indicatorsA.length - 1));
      const indexB = Math.round(progress * (indicatorsB.length - 1));

      if (indicatorsA[indexA]?.regime !== indicatorsB[indexB]?.regime) {
        regimeDifferences.push({
          alignedTime: progress,
          regimeA: indicatorsA[indexA]?.regime ?? 'unknown',
          regimeB: indicatorsB[indexB]?.regime ?? 'unknown',
        });
      }
    }

    // Generate neutral summary
    const dominantA = this.getDominantRegime(regimeDistributionA);
    const dominantB = this.getDominantRegime(regimeDistributionB);

    let summary: string;
    if (dominantA === dominantB) {
      summary = `Both trajectories predominantly in ${dominantA.replace('_', ' ')} regime`;
    } else {
      summary = `A predominantly in ${dominantA.replace('_', ' ')}, B predominantly in ${dominantB.replace('_', ' ')}`;
    }

    return {
      regimeDistributionA,
      regimeDistributionB,
      regimeDifferences,
      summary,
    };
  }

  /**
   * Get the most common regime.
   */
  private getDominantRegime(distribution: Map<TrainingRegime, number>): TrainingRegime {
    let dominant: TrainingRegime = 'unknown';
    let maxCount = 0;

    distribution.forEach((count, regime) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = regime;
      }
    });

    return dominant;
  }

  /**
   * Empty regime comparison (when disabled).
   */
  private emptyRegimeComparison(): RegimeComparisonSummary {
    return {
      regimeDistributionA: new Map(),
      regimeDistributionB: new Map(),
      regimeDifferences: [],
      summary: 'Regime comparison disabled',
    };
  }

  /**
   * Compute summary statistics.
   */
  private computeSummary(): ComparisonSummary {
    return {
      convergenceSpeed: this.computeConvergenceSpeed(),
      stability: this.computeStability(),
      finalPerformance: this.computeFinalPerformance(),
      updateBehavior: this.computeUpdateBehavior(),
    };
  }

  /**
   * Compare convergence speed.
   */
  private computeConvergenceSpeed(): ComparisonSummary['convergenceSpeed'] {
    const threshold = this.config.convergenceLossThreshold;

    const stepsA = this.findStepsToLoss(this.trajectoryA, threshold);
    const stepsB = this.findStepsToLoss(this.trajectoryB, threshold);

    let description: string;
    if (stepsA !== undefined && stepsB !== undefined) {
      if (stepsA < stepsB) {
        description = `A reached loss ${threshold} in fewer steps (${stepsA} vs ${stepsB})`;
      } else if (stepsB < stepsA) {
        description = `B reached loss ${threshold} in fewer steps (${stepsB} vs ${stepsA})`;
      } else {
        description = `Both reached loss ${threshold} at the same step`;
      }
    } else if (stepsA !== undefined) {
      description = `Only A reached loss ${threshold} (at step ${stepsA})`;
    } else if (stepsB !== undefined) {
      description = `Only B reached loss ${threshold} (at step ${stepsB})`;
    } else {
      description = `Neither reached loss ${threshold}`;
    }

    return {
      stepsToLoss: { threshold, stepsA, stepsB },
      description,
    };
  }

  /**
   * Find the step at which loss first drops below threshold.
   */
  private findStepsToLoss(trajectory: TrainingTrajectory, threshold: number): number | undefined {
    for (const state of trajectory.states) {
      if (state.performance.loss <= threshold) {
        return state.step;
      }
    }
    return undefined;
  }

  /**
   * Compare stability (loss variance).
   */
  private computeStability(): ComparisonSummary['stability'] {
    const varianceA = this.computeLossVariance(this.trajectoryA);
    const varianceB = this.computeLossVariance(this.trajectoryB);

    let description: string;
    if (Math.abs(varianceA - varianceB) < 0.0001) {
      description = 'Similar loss variance';
    } else if (varianceA < varianceB) {
      description = `A has lower loss variance (${varianceA.toExponential(2)} vs ${varianceB.toExponential(2)})`;
    } else {
      description = `B has lower loss variance (${varianceB.toExponential(2)} vs ${varianceA.toExponential(2)})`;
    }

    return {
      lossVarianceA: varianceA,
      lossVarianceB: varianceB,
      description,
    };
  }

  /**
   * Compute loss variance.
   */
  private computeLossVariance(trajectory: TrainingTrajectory): number {
    const losses = trajectory.states.map((s) => s.performance.loss);
    if (losses.length === 0) return 0;

    const mean = losses.reduce((a, b) => a + b, 0) / losses.length;
    return losses.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / losses.length;
  }

  /**
   * Compare final performance.
   */
  private computeFinalPerformance(): ComparisonSummary['finalPerformance'] {
    const finalA = this.trajectoryA.states[this.trajectoryA.states.length - 1];
    const finalB = this.trajectoryB.states[this.trajectoryB.states.length - 1];

    const finalLossA = finalA?.performance.loss ?? NaN;
    const finalLossB = finalB?.performance.loss ?? NaN;

    let description: string;
    if (isNaN(finalLossA) || isNaN(finalLossB)) {
      description = 'Final loss comparison not available';
    } else if (Math.abs(finalLossA - finalLossB) < 0.0001) {
      description = 'Similar final loss';
    } else if (finalLossA < finalLossB) {
      description = `A has lower final loss (${finalLossA.toFixed(4)} vs ${finalLossB.toFixed(4)})`;
    } else {
      description = `B has lower final loss (${finalLossB.toFixed(4)} vs ${finalLossA.toFixed(4)})`;
    }

    return {
      finalLossA,
      finalLossB,
      description,
    };
  }

  /**
   * Compare update behavior (mean alignment).
   */
  private computeUpdateBehavior(): ComparisonSummary['updateBehavior'] {
    const meanAlignmentA = this.computeMeanAlignment(this.trajectoryA);
    const meanAlignmentB = this.computeMeanAlignment(this.trajectoryB);

    let description: string;
    if (Math.abs(meanAlignmentA - meanAlignmentB) < 0.05) {
      description = 'Similar update alignment';
    } else if (meanAlignmentA > meanAlignmentB) {
      description = `A has higher mean alignment (${meanAlignmentA.toFixed(2)} vs ${meanAlignmentB.toFixed(2)})`;
    } else {
      description = `B has higher mean alignment (${meanAlignmentB.toFixed(2)} vs ${meanAlignmentA.toFixed(2)})`;
    }

    return {
      meanAlignmentA,
      meanAlignmentB,
      description,
    };
  }

  /**
   * Compute mean update alignment.
   */
  private computeMeanAlignment(trajectory: TrainingTrajectory): number {
    if (trajectory.updates.length === 0) return 0;
    const sum = trajectory.updates.reduce((s, u) => s + u.alignment, 0);
    return sum / trajectory.updates.length;
  }

  /**
   * Get trajectory info.
   */
  private getTrajectoryInfo(trajectory: TrainingTrajectory): TrajectoryInfo {
    return {
      id: trajectory.id,
      name: trajectory.name,
      totalSteps: trajectory.totalSteps,
      totalEpochs: trajectory.totalEpochs,
      stateCount: trajectory.states.length,
    };
  }
}

/**
 * Generate comparison report text.
 */
export function generateComparisonReport(comparison: TrainingComparison): string {
  const lines: string[] = [];

  lines.push(`# Training Comparison: ${comparison.trajectoryA.name} vs ${comparison.trajectoryB.name}`);
  lines.push('');

  // Compatibility
  if (!comparison.compatibility.compatible) {
    lines.push('## Compatibility Issues');
    comparison.compatibility.issues.forEach((issue) => lines.push(`- ${issue}`));
    lines.push('');
  }

  if (comparison.compatibility.warnings.length > 0) {
    lines.push('## Warnings');
    comparison.compatibility.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push('');
  }

  // Summary
  lines.push('## Summary');
  lines.push(`- Convergence: ${comparison.summary.convergenceSpeed.description}`);
  lines.push(`- Stability: ${comparison.summary.stability.description}`);
  lines.push(`- Final Performance: ${comparison.summary.finalPerformance.description}`);
  lines.push(`- Update Behavior: ${comparison.summary.updateBehavior.description}`);
  lines.push('');

  // Regime comparison
  if (comparison.regimeComparison.summary !== 'Regime comparison disabled') {
    lines.push('## Regime Comparison');
    lines.push(comparison.regimeComparison.summary);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Verify comparison determinism.
 */
export function verifyComparisonDeterminism(
  trajectoryA: TrainingTrajectory,
  trajectoryB: TrainingTrajectory,
  iterations: number = 3
): boolean {
  const results: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const comparator = new TrainingComparator(trajectoryA, trajectoryB);
    const comparison = comparator.compare();
    results.push(JSON.stringify(comparison, (key, value) => {
      // Handle Map serialization
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }));
  }

  return results.every((r) => r === results[0]);
}
