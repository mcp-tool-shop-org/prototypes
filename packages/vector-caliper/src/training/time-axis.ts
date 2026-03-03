/**
 * Time Axis — Step/Epoch Semantics
 *
 * Makes "time" in training explicit and meaningful.
 * Dual time axes: step (fine-grained) and epoch (coarse-grained).
 *
 * Guarantees:
 * - Scrubbing to step i always maps to the same state
 * - Epoch transitions are discrete, not interpolated
 * - Time scrubbing never skips implicit updates
 */

import { TrainingState, TrainingTrajectory, UpdateVector } from './types';

/**
 * Time coordinate in training.
 * Explicitly dual: step for fine-grained, epoch for coarse-grained.
 */
export interface TimeCoordinate {
  /** Training step (0-indexed) */
  step: number;
  /** Epoch number (0-indexed) */
  epoch: number;
  /** Progress within current epoch [0, 1) */
  epochProgress: number;
  /** Overall progress [0, 1] */
  overallProgress: number;
}

/**
 * Epoch boundary marker.
 */
export interface EpochBoundary {
  /** Epoch number that starts at this boundary */
  epoch: number;
  /** Step at which this epoch starts */
  startStep: number;
  /** State index at which this epoch starts */
  stateIndex: number;
  /** Whether this is the first epoch */
  isFirst: boolean;
  /** Whether this is the last epoch */
  isLast: boolean;
}

/**
 * Time range for querying.
 */
export interface TimeRange {
  /** Start step (inclusive) */
  startStep: number;
  /** End step (inclusive) */
  endStep: number;
  /** Optional: restrict to specific epochs */
  epochs?: number[];
}

/**
 * Time Axis Manager
 *
 * Provides deterministic mapping between time coordinates and states.
 * Time is always discrete — no interpolation.
 */
export class TimeAxis {
  private readonly trajectory: TrainingTrajectory;
  private readonly stepToIndex: Map<number, number>;
  private readonly epochBoundaries: EpochBoundary[];
  private readonly stepsPerEpoch: Map<number, number>;

  constructor(trajectory: TrainingTrajectory) {
    this.trajectory = trajectory;
    this.stepToIndex = this.buildStepIndex();
    this.epochBoundaries = this.buildEpochBoundaries();
    this.stepsPerEpoch = this.computeStepsPerEpoch();
  }

  /**
   * Get the time coordinate for a given state index.
   */
  getTimeCoordinate(stateIndex: number): TimeCoordinate {
    this.validateStateIndex(stateIndex);

    const state = this.trajectory.states[stateIndex];
    const epochSteps = this.stepsPerEpoch.get(state.epoch) ?? 1;

    // Find step within current epoch
    const epochStart = this.getEpochBoundary(state.epoch)?.startStep ?? 0;
    const stepInEpoch = state.step - epochStart;

    return {
      step: state.step,
      epoch: state.epoch,
      epochProgress: epochSteps > 1 ? stepInEpoch / (epochSteps - 1) : 0,
      overallProgress: this.trajectory.totalSteps > 1
        ? state.step / (this.trajectory.totalSteps - 1)
        : 0,
    };
  }

  /**
   * Get state index for a given step.
   * Returns undefined if step is not in trajectory.
   */
  getStateIndexForStep(step: number): number | undefined {
    return this.stepToIndex.get(step);
  }

  /**
   * Get state for a given step.
   * Returns undefined if step is not in trajectory.
   */
  getStateForStep(step: number): TrainingState | undefined {
    const index = this.getStateIndexForStep(step);
    return index !== undefined ? this.trajectory.states[index] : undefined;
  }

  /**
   * Get state index for a given epoch and progress within that epoch.
   * Progress is clamped to [0, 1].
   * Returns the closest state index within the epoch.
   */
  getStateIndexForEpochProgress(epoch: number, progress: number): number | undefined {
    const boundary = this.getEpochBoundary(epoch);
    if (!boundary) return undefined;

    const clampedProgress = Math.max(0, Math.min(1, progress));
    const epochStates = this.getStatesInEpoch(epoch);
    if (epochStates.length === 0) return undefined;

    if (epochStates.length === 1) {
      return boundary.stateIndex;
    }

    const targetIndex = Math.round(clampedProgress * (epochStates.length - 1));
    return boundary.stateIndex + targetIndex;
  }

  /**
   * Get all epoch boundaries.
   */
  getEpochBoundaries(): EpochBoundary[] {
    return [...this.epochBoundaries];
  }

  /**
   * Get a specific epoch boundary.
   */
  getEpochBoundary(epoch: number): EpochBoundary | undefined {
    return this.epochBoundaries.find((b) => b.epoch === epoch);
  }

  /**
   * Get all states within a specific epoch.
   */
  getStatesInEpoch(epoch: number): TrainingState[] {
    return this.trajectory.states.filter((s) => s.epoch === epoch);
  }

  /**
   * Get state indices within a time range.
   */
  getStatesInRange(range: TimeRange): number[] {
    const indices: number[] = [];

    for (let i = 0; i < this.trajectory.states.length; i++) {
      const state = this.trajectory.states[i];

      if (state.step < range.startStep || state.step > range.endStep) {
        continue;
      }

      if (range.epochs && !range.epochs.includes(state.epoch)) {
        continue;
      }

      indices.push(i);
    }

    return indices;
  }

  /**
   * Get update vectors that cross epoch boundaries.
   */
  getEpochCrossingUpdates(): UpdateVector[] {
    return this.trajectory.updates.filter((u) => u.crossesEpoch);
  }

  /**
   * Get updates within a specific epoch.
   */
  getUpdatesInEpoch(epoch: number): UpdateVector[] {
    return this.trajectory.updates.filter((u) => {
      const fromState = this.getStateForStep(u.fromStep);
      return fromState?.epoch === epoch && !u.crossesEpoch;
    });
  }

  /**
   * Find the nearest state index to a given step.
   * If step is exactly in trajectory, returns that index.
   * Otherwise, returns the index of the closest state.
   */
  getNearestStateIndex(step: number): number {
    const exact = this.stepToIndex.get(step);
    if (exact !== undefined) return exact;

    // Binary search for nearest
    const states = this.trajectory.states;
    let left = 0;
    let right = states.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (states[mid].step < step) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Check if left-1 is closer
    if (left > 0) {
      const diffLeft = Math.abs(states[left - 1].step - step);
      const diffRight = Math.abs(states[left].step - step);
      if (diffLeft < diffRight) {
        return left - 1;
      }
    }

    return left;
  }

  /**
   * Get total number of epochs.
   */
  get totalEpochs(): number {
    return this.trajectory.totalEpochs;
  }

  /**
   * Get total number of steps.
   */
  get totalSteps(): number {
    return this.trajectory.totalSteps;
  }

  /**
   * Get total number of states (may differ from steps if not all steps logged).
   */
  get totalStates(): number {
    return this.trajectory.states.length;
  }

  /**
   * Check if trajectory has gaps (missing steps).
   */
  hasGaps(): boolean {
    const states = this.trajectory.states;
    for (let i = 1; i < states.length; i++) {
      if (states[i].step !== states[i - 1].step + 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get gap information (steps that are missing between logged states).
   */
  getGaps(): Array<{ afterStep: number; missingCount: number }> {
    const gaps: Array<{ afterStep: number; missingCount: number }> = [];
    const states = this.trajectory.states;

    for (let i = 1; i < states.length; i++) {
      const expected = states[i - 1].step + 1;
      const actual = states[i].step;
      if (actual !== expected) {
        gaps.push({
          afterStep: states[i - 1].step,
          missingCount: actual - expected,
        });
      }
    }

    return gaps;
  }

  // Private helpers

  private buildStepIndex(): Map<number, number> {
    const map = new Map<number, number>();
    for (let i = 0; i < this.trajectory.states.length; i++) {
      map.set(this.trajectory.states[i].step, i);
    }
    return map;
  }

  private buildEpochBoundaries(): EpochBoundary[] {
    const boundaries: EpochBoundary[] = [];
    const states = this.trajectory.states;

    if (states.length === 0) return boundaries;

    // First state always starts epoch 0
    boundaries.push({
      epoch: states[0].epoch,
      startStep: states[0].step,
      stateIndex: 0,
      isFirst: true,
      isLast: states.length === 1,
    });

    for (let i = 1; i < states.length; i++) {
      if (states[i].epoch > states[i - 1].epoch) {
        boundaries.push({
          epoch: states[i].epoch,
          startStep: states[i].step,
          stateIndex: i,
          isFirst: false,
          isLast: false,
        });
      }
    }

    // Mark last boundary
    if (boundaries.length > 0) {
      boundaries[boundaries.length - 1].isLast = true;
    }

    return boundaries;
  }

  private computeStepsPerEpoch(): Map<number, number> {
    const map = new Map<number, number>();
    const states = this.trajectory.states;

    for (const state of states) {
      map.set(state.epoch, (map.get(state.epoch) ?? 0) + 1);
    }

    return map;
  }

  private validateStateIndex(index: number): void {
    if (index < 0 || index >= this.trajectory.states.length) {
      throw new Error(
        `State index ${index} out of bounds [0, ${this.trajectory.states.length - 1}]`
      );
    }
  }
}

/**
 * Phase marker for training visualization.
 * Represents a significant point in training (not a heuristic — explicit configuration).
 */
export interface PhaseMarker {
  /** Marker identifier */
  id: string;
  /** Step at which this phase marker appears */
  step: number;
  /** Epoch at which this phase marker appears */
  epoch: number;
  /** State index (computed, not stored) */
  stateIndex?: number;
  /** Human-readable label */
  label: string;
  /** Optional: marker type for styling */
  type: 'epoch_start' | 'checkpoint' | 'lr_change' | 'custom';
}

/**
 * Create epoch start markers from a trajectory.
 */
export function createEpochMarkers(trajectory: TrainingTrajectory): PhaseMarker[] {
  const timeAxis = new TimeAxis(trajectory);
  const boundaries = timeAxis.getEpochBoundaries();

  return boundaries.map((b) => ({
    id: `epoch_${b.epoch}_start`,
    step: b.startStep,
    epoch: b.epoch,
    stateIndex: b.stateIndex,
    label: `Epoch ${b.epoch}`,
    type: 'epoch_start' as const,
  }));
}

/**
 * Create markers for learning rate changes.
 * Detects significant LR changes (>1% change from previous).
 */
export function createLRChangeMarkers(
  trajectory: TrainingTrajectory,
  threshold: number = 0.01
): PhaseMarker[] {
  const markers: PhaseMarker[] = [];
  const states = trajectory.states;

  for (let i = 1; i < states.length; i++) {
    const prevLR = states[i - 1].training.learningRate;
    const currLR = states[i].training.learningRate;
    const change = Math.abs(currLR - prevLR) / prevLR;

    if (change > threshold) {
      markers.push({
        id: `lr_change_step_${states[i].step}`,
        step: states[i].step,
        epoch: states[i].epoch,
        stateIndex: i,
        label: `LR: ${prevLR.toExponential(2)} → ${currLR.toExponential(2)}`,
        type: 'lr_change',
      });
    }
  }

  return markers;
}
