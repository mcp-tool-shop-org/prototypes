/**
 * VectorCaliper - Trajectory Support
 *
 * Represents state evolution over time.
 * Time is an explicit parameter, not a side effect.
 *
 * INVARIANTS:
 * - Time is monotonically increasing
 * - Trajectories are reproducible
 * - Animation is scrub-able (forward/backward)
 */

import type { ModelState, StateTrajectory, ProjectedState } from '../types/state';
import type { ProjectionEngine } from '../projection/engine';
import { validator } from '../validation/validator';

// =============================================================================
// Trajectory Builder
// =============================================================================

/**
 * Builds and validates state trajectories.
 */
export class TrajectoryBuilder {
  private states: ModelState[] = [];
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Add a state to the trajectory.
   * Validates time monotonicity.
   */
  add(state: ModelState): this {
    // Validate the state itself
    validator.assertValid(state);

    // Check time monotonicity
    if (this.states.length > 0) {
      const lastTime = this.states[this.states.length - 1]!.time.value;
      if (state.time.value <= lastTime) {
        throw new Error(
          `Time must be strictly increasing: ${lastTime} -> ${state.time.value}`
        );
      }
    }

    this.states.push(state);
    return this;
  }

  /**
   * Add multiple states at once.
   */
  addAll(states: ModelState[]): this {
    for (const state of states) {
      this.add(state);
    }
    return this;
  }

  /**
   * Build the trajectory.
   */
  build(): StateTrajectory {
    if (this.states.length === 0) {
      throw new Error('Trajectory must contain at least one state');
    }

    return {
      id: this.id,
      states: [...this.states],
      timeRange: {
        start: this.states[0]!.time.value,
        end: this.states[this.states.length - 1]!.time.value,
      },
    };
  }

  /**
   * Get current state count.
   */
  get length(): number {
    return this.states.length;
  }

  /**
   * Clear all states.
   */
  clear(): this {
    this.states = [];
    return this;
  }
}

// =============================================================================
// Time Controller
// =============================================================================

/**
 * Controls playback through a trajectory.
 * Time is explicit and scrub-able.
 */
export class TimeController {
  private trajectory: StateTrajectory;
  private currentTime: number;
  private projectedStates: ProjectedState[] | null = null;

  constructor(trajectory: StateTrajectory) {
    // Validate trajectory
    validator.validateTrajectory(trajectory);

    this.trajectory = trajectory;
    this.currentTime = trajectory.timeRange.start;
  }

  /**
   * Set projection engine for coordinate computation.
   */
  setProjection(engine: ProjectionEngine): void {
    engine.fit(this.trajectory.states as ModelState[]);
    this.projectedStates = engine.projectBatch(this.trajectory.states as ModelState[]);
  }

  /**
   * Get the current time.
   */
  getTime(): number {
    return this.currentTime;
  }

  /**
   * Set time directly (scrub).
   */
  setTime(time: number): void {
    this.currentTime = Math.max(
      this.trajectory.timeRange.start,
      Math.min(this.trajectory.timeRange.end, time)
    );
  }

  /**
   * Advance time by delta.
   */
  advance(delta: number): void {
    this.setTime(this.currentTime + delta);
  }

  /**
   * Go to start of trajectory.
   */
  toStart(): void {
    this.currentTime = this.trajectory.timeRange.start;
  }

  /**
   * Go to end of trajectory.
   */
  toEnd(): void {
    this.currentTime = this.trajectory.timeRange.end;
  }

  /**
   * Get normalized progress [0, 1].
   */
  getProgress(): number {
    const range =
      this.trajectory.timeRange.end - this.trajectory.timeRange.start;
    if (range === 0) return 1;
    return (this.currentTime - this.trajectory.timeRange.start) / range;
  }

  /**
   * Set by normalized progress [0, 1].
   */
  setProgress(progress: number): void {
    const clamped = Math.max(0, Math.min(1, progress));
    const range =
      this.trajectory.timeRange.end - this.trajectory.timeRange.start;
    this.currentTime = this.trajectory.timeRange.start + clamped * range;
  }

  /**
   * Get state at current time (interpolated if between samples).
   */
  getCurrentState(): ModelState {
    return this.getStateAtTime(this.currentTime);
  }

  /**
   * Get state at specific time.
   * Returns nearest state (no interpolation for now).
   */
  getStateAtTime(time: number): ModelState {
    const states = this.trajectory.states;

    // Binary search for nearest state
    let lo = 0;
    let hi = states.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (states[mid]!.time.value < time) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // Check if previous state is closer
    if (lo > 0) {
      const prev = states[lo - 1]!;
      const curr = states[lo]!;
      if (Math.abs(prev.time.value - time) < Math.abs(curr.time.value - time)) {
        return prev;
      }
    }

    return states[lo]!;
  }

  /**
   * Get index of state at current time.
   */
  getCurrentIndex(): number {
    const state = this.getCurrentState();
    return this.trajectory.states.findIndex((s) => s.id === state.id);
  }

  /**
   * Get projected state at current time.
   */
  getCurrentProjectedState(): ProjectedState | null {
    if (!this.projectedStates) return null;
    const index = this.getCurrentIndex();
    return this.projectedStates[index] ?? null;
  }

  /**
   * Get all states up to current time (history).
   */
  getHistory(): readonly ModelState[] {
    return this.trajectory.states.filter(
      (s) => s.time.value <= this.currentTime
    );
  }

  /**
   * Get all projected states up to current time.
   */
  getProjectedHistory(): readonly ProjectedState[] {
    if (!this.projectedStates) return [];
    const currentIndex = this.getCurrentIndex();
    return this.projectedStates.slice(0, currentIndex + 1);
  }

  /**
   * Get the trajectory.
   */
  getTrajectory(): StateTrajectory {
    return this.trajectory;
  }

  /**
   * Get trajectory duration.
   */
  getDuration(): number {
    return this.trajectory.timeRange.end - this.trajectory.timeRange.start;
  }

  /**
   * Check if at start.
   */
  isAtStart(): boolean {
    return this.currentTime <= this.trajectory.timeRange.start;
  }

  /**
   * Check if at end.
   */
  isAtEnd(): boolean {
    return this.currentTime >= this.trajectory.timeRange.end;
  }
}

// =============================================================================
// Trajectory Analysis
// =============================================================================

/**
 * Compute velocity between consecutive states.
 */
export function computeVelocities(
  projected: readonly ProjectedState[]
): number[] {
  const velocities: number[] = [];

  for (let i = 1; i < projected.length; i++) {
    const prev = projected[i - 1]!;
    const curr = projected[i]!;

    const dx = curr.position.x - prev.position.x;
    const dy = curr.position.y - prev.position.y;
    const dz = (curr.position.z ?? 0) - (prev.position.z ?? 0);
    const dt = curr.time - prev.time;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    velocities.push(dt > 0 ? distance / dt : 0);
  }

  return velocities;
}

/**
 * Compute cumulative path length.
 */
export function computePathLength(
  projected: readonly ProjectedState[]
): number[] {
  const lengths: number[] = [0];

  for (let i = 1; i < projected.length; i++) {
    const prev = projected[i - 1]!;
    const curr = projected[i]!;

    const dx = curr.position.x - prev.position.x;
    const dy = curr.position.y - prev.position.y;
    const dz = (curr.position.z ?? 0) - (prev.position.z ?? 0);

    const segment = Math.sqrt(dx * dx + dy * dy + dz * dz);
    lengths.push(lengths[i - 1]! + segment);
  }

  return lengths;
}

/**
 * Find phase transitions (abrupt changes in velocity or direction).
 */
export function findPhaseTransitions(
  projected: readonly ProjectedState[],
  threshold: number = 2.0
): number[] {
  const velocities = computeVelocities(projected);
  const transitions: number[] = [];

  for (let i = 1; i < velocities.length; i++) {
    const prev = velocities[i - 1]!;
    const curr = velocities[i]!;

    // Detect sudden velocity changes
    if (prev > 0 && curr / prev > threshold) {
      transitions.push(i);
    } else if (prev > 0 && prev / curr > threshold) {
      transitions.push(i);
    }
  }

  return transitions;
}

// =============================================================================
// Trajectory Visualization Helpers
// =============================================================================

/**
 * Style configuration for trajectory visualization.
 */
export interface TrajectoryStyle {
  /** Base stroke width */
  readonly strokeWidth: number;

  /** Whether to vary stroke width by velocity */
  readonly velocityWidth: boolean;

  /** Whether to fade older segments */
  readonly fadeHistory: boolean;

  /** Number of historical points to show (0 = all) */
  readonly historyLength: number;

  /** Whether to show direction arrows */
  readonly showArrows: boolean;

  /** Ghost/trail opacity */
  readonly ghostOpacity: number;
}

export const DEFAULT_TRAJECTORY_STYLE: TrajectoryStyle = {
  strokeWidth: 2,
  velocityWidth: true,
  fadeHistory: true,
  historyLength: 0,
  showArrows: false,
  ghostOpacity: 0.3,
};

/**
 * Compute stroke widths based on velocity.
 */
export function computeStrokeWidths(
  projected: readonly ProjectedState[],
  baseWidth: number = 2,
  minWidth: number = 1,
  maxWidth: number = 6
): number[] {
  const velocities = computeVelocities(projected);
  if (velocities.length === 0) return [baseWidth];

  const maxVel = Math.max(...velocities, 0.001);
  const minVel = Math.min(...velocities);

  // Start with base width for first point
  const widths = [baseWidth];

  for (const vel of velocities) {
    // Slower = thicker (more time spent there)
    const normalized = 1 - (vel - minVel) / (maxVel - minVel + 0.001);
    const width = minWidth + normalized * (maxWidth - minWidth);
    widths.push(width);
  }

  return widths;
}

/**
 * Compute opacity values for history fading.
 */
export function computeHistoryOpacity(
  count: number,
  currentIndex: number,
  minOpacity: number = 0.1,
  maxOpacity: number = 1.0
): number[] {
  const opacities: number[] = [];

  for (let i = 0; i < count; i++) {
    if (i > currentIndex) {
      opacities.push(0); // Future = invisible
    } else {
      // Fade based on distance from current
      const distance = currentIndex - i;
      const fade = Math.pow(0.9, distance);
      opacities.push(minOpacity + fade * (maxOpacity - minOpacity));
    }
  }

  return opacities;
}
