/**
 * VectorCaliper - Interactive Timeline Scrubber
 *
 * Deterministic timeline scrubbing for trajectories.
 * Output SVG is purely a function of t (no hysteresis).
 *
 * INVARIANT: Given same t, same output every time
 * INVARIANT: No internal state affects output beyond t
 */

import type {
  ModelState,
  StateTrajectory,
  ProjectedState,
} from '../types/state';
import type { Scene, SceneNode } from '../scene';
import type { SemanticMapper } from '../mapping/semantic-map';
import type { ProjectionEngine } from '../projection/engine';
import { TimeController, computeHistoryOpacity } from '../time/trajectory';
import { SceneBuilder } from '../scene/graph';

// =============================================================================
// Types
// =============================================================================

/**
 * Timeline scrubber configuration.
 */
export interface TimelineScrubberConfig {
  /** Whether to show trajectory path */
  readonly showPath: boolean;

  /** Whether to show past states as ghosts */
  readonly showHistory: boolean;

  /** Maximum number of history ghosts (0 = all) */
  readonly maxHistory: number;

  /** Ghost opacity */
  readonly ghostOpacity: number;

  /** Whether to fade history */
  readonly fadeHistory: boolean;

  /** Current state highlight scale */
  readonly currentScale: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_TIMELINE_CONFIG: TimelineScrubberConfig = {
  showPath: true,
  showHistory: true,
  maxHistory: 0,
  ghostOpacity: 0.3,
  fadeHistory: true,
  currentScale: 1.0,
};

/**
 * Scrubber state for deterministic output.
 */
export interface ScrubberState {
  /** Current time value */
  readonly time: number;

  /** Normalized progress [0, 1] */
  readonly progress: number;

  /** Index of current state in trajectory */
  readonly currentIndex: number;

  /** Total number of states */
  readonly totalStates: number;

  /** Time range */
  readonly timeRange: {
    readonly start: number;
    readonly end: number;
  };
}

/**
 * Scene snapshot at a specific time.
 * Used for determinism verification.
 */
export interface SceneSnapshot {
  /** Time value */
  readonly time: number;

  /** Node positions and properties */
  readonly nodes: ReadonlyArray<{
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly visible: boolean;
    readonly opacity: number;
  }>;

  /** Hash for quick comparison */
  readonly hash: string;
}

// =============================================================================
// Timeline Scrubber
// =============================================================================

/**
 * Deterministic timeline scrubber for trajectory visualization.
 *
 * The scrubber guarantees that given the same time t, it will
 * produce identical output regardless of how t was reached.
 */
export class TimelineScrubber {
  private controller: TimeController;
  private mapper: SemanticMapper;
  private projector: ProjectionEngine;
  private config: TimelineScrubberConfig;

  // Cached data for determinism
  private projectedStates: ProjectedState[];
  private trajectory: StateTrajectory;

  constructor(
    trajectory: StateTrajectory,
    mapper: SemanticMapper,
    projector: ProjectionEngine,
    config: Partial<TimelineScrubberConfig> = {}
  ) {
    this.trajectory = trajectory;
    this.mapper = mapper;
    this.projector = projector;
    this.config = { ...DEFAULT_TIMELINE_CONFIG, ...config };

    // Initialize controller
    this.controller = new TimeController(trajectory);

    // Pre-compute all projections for determinism
    // INVARIANT: Projection is fitted once and frozen
    this.projector.fit(trajectory.states as ModelState[]);
    this.projectedStates = this.projector.projectBatch(
      trajectory.states as ModelState[]
    );

    this.controller.setProjection(projector);
  }

  // ---------------------------------------------------------------------------
  // Time Control
  // ---------------------------------------------------------------------------

  /**
   * Set time value directly.
   * INVARIANT: Pure function of t, no side effects.
   */
  setTime(time: number): void {
    this.controller.setTime(time);
  }

  /**
   * Set by normalized progress [0, 1].
   * INVARIANT: Same progress always yields same state.
   */
  setProgress(progress: number): void {
    this.controller.setProgress(progress);
  }

  /**
   * Get current time.
   */
  getTime(): number {
    return this.controller.getTime();
  }

  /**
   * Get normalized progress [0, 1].
   */
  getProgress(): number {
    return this.controller.getProgress();
  }

  /**
   * Go to start.
   */
  toStart(): void {
    this.controller.toStart();
  }

  /**
   * Go to end.
   */
  toEnd(): void {
    this.controller.toEnd();
  }

  /**
   * Step to next state.
   */
  stepForward(): void {
    const index = this.controller.getCurrentIndex();
    if (index < this.trajectory.states.length - 1) {
      const nextState = this.trajectory.states[index + 1]!;
      this.setTime(nextState.time.value);
    }
  }

  /**
   * Step to previous state.
   */
  stepBackward(): void {
    const index = this.controller.getCurrentIndex();
    if (index > 0) {
      const prevState = this.trajectory.states[index - 1]!;
      this.setTime(prevState.time.value);
    }
  }

  // ---------------------------------------------------------------------------
  // State Access
  // ---------------------------------------------------------------------------

  /**
   * Get current scrubber state.
   */
  getState(): ScrubberState {
    return {
      time: this.controller.getTime(),
      progress: this.controller.getProgress(),
      currentIndex: this.controller.getCurrentIndex(),
      totalStates: this.trajectory.states.length,
      timeRange: this.trajectory.timeRange,
    };
  }

  /**
   * Get current model state.
   */
  getCurrentModelState(): ModelState {
    return this.controller.getCurrentState();
  }

  /**
   * Get current projected state.
   */
  getCurrentProjectedState(): ProjectedState | null {
    return this.controller.getCurrentProjectedState();
  }

  // ---------------------------------------------------------------------------
  // Scene Generation (Deterministic)
  // ---------------------------------------------------------------------------

  /**
   * Build scene for current time.
   * INVARIANT: Same t produces identical scene every time.
   */
  buildScene(): Scene {
    const currentIndex = this.controller.getCurrentIndex();
    const currentState = this.controller.getCurrentState();
    const currentProjected = this.projectedStates[currentIndex]!;

    const builder = new SceneBuilder(this.mapper);

    // Add history (if enabled)
    if (this.config.showHistory && currentIndex > 0) {
      const historyCount = this.config.maxHistory > 0
        ? Math.min(this.config.maxHistory, currentIndex)
        : currentIndex;

      const startIdx = currentIndex - historyCount;
      const opacities = this.config.fadeHistory
        ? computeHistoryOpacity(
            historyCount,
            historyCount - 1,
            0.1,
            this.config.ghostOpacity
          )
        : new Array(historyCount).fill(this.config.ghostOpacity);

      for (let i = startIdx; i < currentIndex; i++) {
        const state = this.trajectory.states[i]!;
        const projected = this.projectedStates[i]!;
        const opacity = opacities[i - startIdx] ?? this.config.ghostOpacity;

        // Add ghost state with reduced opacity
        const node = builder.addState(state, projected);
        // Mark as ghost for rendering
        if (node.type === 'point') {
          const scene = builder.getScene();
          scene.updateNode(node.id, {
            ...node,
            fill: {
              ...node.fill,
              a: node.fill.a * opacity,
            },
          });
        }
      }
    }

    // Add trajectory path (if enabled)
    if (this.config.showPath) {
      const pathPoints = this.projectedStates
        .slice(0, currentIndex + 1)
        .map((p) => ({ x: p.position.x, y: p.position.y }));

      if (pathPoints.length >= 2) {
        builder.addTrajectoryPath(
          this.trajectory.id + '-path',
          pathPoints,
          'linear'
        );
      }
    }

    // Add current state (highlighted)
    builder.addState(currentState, currentProjected);

    return builder.getScene();
  }

  // ---------------------------------------------------------------------------
  // Snapshot for Determinism Verification
  // ---------------------------------------------------------------------------

  /**
   * Take a snapshot of the scene at current time.
   * Used for determinism testing.
   */
  takeSnapshot(): SceneSnapshot {
    const scene = this.buildScene();
    const nodes = scene.getNodes();

    const nodeData = nodes.map((node) => {
      let x = 0, y = 0, opacity = 1;

      if (node.type === 'point') {
        x = node.x;
        y = node.y;
        opacity = node.fill.a;
      } else if (node.type === 'path' && node.points.length > 0) {
        x = node.points[0]!.x;
        y = node.points[0]!.y;
        opacity = node.stroke.color.a;
      }

      return {
        id: node.id.value,
        x,
        y,
        visible: node.visible,
        opacity,
      };
    });

    // Sort for consistent ordering
    nodeData.sort((a, b) => a.id.localeCompare(b.id));

    // Compute hash
    const hash = this.computeSnapshotHash(nodeData);

    return {
      time: this.controller.getTime(),
      nodes: nodeData,
      hash,
    };
  }

  /**
   * Verify determinism by comparing two snapshots.
   */
  static verifyDeterminism(
    snapshot1: SceneSnapshot,
    snapshot2: SceneSnapshot
  ): boolean {
    if (snapshot1.time !== snapshot2.time) {
      return false;
    }

    return snapshot1.hash === snapshot2.hash;
  }

  /**
   * Compute hash for snapshot data.
   */
  private computeSnapshotHash(
    nodes: ReadonlyArray<{
      readonly id: string;
      readonly x: number;
      readonly y: number;
      readonly visible: boolean;
      readonly opacity: number;
    }>
  ): string {
    // Simple deterministic hash
    let hash = 0;
    const str = JSON.stringify(nodes, (_, v) =>
      typeof v === 'number' ? v.toFixed(6) : v
    );

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  // ---------------------------------------------------------------------------
  // HTML Integration
  // ---------------------------------------------------------------------------

  /**
   * Generate JavaScript for timeline scrubbing.
   */
  generateScrubScript(): string {
    const state = this.getState();
    const stateTimestamps = this.trajectory.states.map((s) => s.time.value);

    return `
// VectorCaliper Timeline Scrubber
(function() {
  const VC_TIMELINE = {
    time: ${state.time},
    progress: ${state.progress},
    timeRange: ${JSON.stringify(state.timeRange)},
    totalStates: ${state.totalStates},
    timestamps: ${JSON.stringify(stateTimestamps)}
  };

  // Set time value
  window.vcSetTime = function(time) {
    VC_TIMELINE.time = Math.max(
      VC_TIMELINE.timeRange.start,
      Math.min(VC_TIMELINE.timeRange.end, time)
    );
    VC_TIMELINE.progress = (VC_TIMELINE.time - VC_TIMELINE.timeRange.start) /
      (VC_TIMELINE.timeRange.end - VC_TIMELINE.timeRange.start || 1);
    updateTimeline();
    return VC_TIMELINE.time;
  };

  // Set progress [0, 1]
  window.vcSetProgress = function(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    const range = VC_TIMELINE.timeRange.end - VC_TIMELINE.timeRange.start;
    VC_TIMELINE.time = VC_TIMELINE.timeRange.start + clamped * range;
    VC_TIMELINE.progress = clamped;
    updateTimeline();
    return VC_TIMELINE.progress;
  };

  // Step to next state
  window.vcStepForward = function() {
    const idx = findCurrentIndex();
    if (idx < VC_TIMELINE.timestamps.length - 1) {
      vcSetTime(VC_TIMELINE.timestamps[idx + 1]);
    }
  };

  // Step to previous state
  window.vcStepBackward = function() {
    const idx = findCurrentIndex();
    if (idx > 0) {
      vcSetTime(VC_TIMELINE.timestamps[idx - 1]);
    }
  };

  // Go to start
  window.vcToStart = function() {
    vcSetTime(VC_TIMELINE.timeRange.start);
  };

  // Go to end
  window.vcToEnd = function() {
    vcSetTime(VC_TIMELINE.timeRange.end);
  };

  // Get current state
  window.vcGetTimelineState = function() {
    return JSON.parse(JSON.stringify(VC_TIMELINE));
  };

  // Find index of current time
  function findCurrentIndex() {
    let idx = 0;
    for (let i = 0; i < VC_TIMELINE.timestamps.length; i++) {
      if (VC_TIMELINE.timestamps[i] <= VC_TIMELINE.time) {
        idx = i;
      }
    }
    return idx;
  }

  // Update timeline display
  function updateTimeline() {
    const idx = findCurrentIndex();

    // Update slider
    const slider = document.getElementById('vc-timeline-slider');
    if (slider) {
      slider.value = VC_TIMELINE.progress * 100;
    }

    // Update time display
    const display = document.getElementById('vc-timeline-time');
    if (display) {
      display.textContent = 't = ' + VC_TIMELINE.time.toFixed(2);
    }

    // Update state visibility
    const allStates = document.querySelectorAll('[data-vc-state-id]');
    allStates.forEach(function(el, i) {
      const stateTime = parseFloat(el.getAttribute('data-vc-time') || '0');
      const isHistory = stateTime < VC_TIMELINE.time;
      const isCurrent = Math.abs(stateTime - VC_TIMELINE.timestamps[idx]) < 0.001;

      if (isCurrent) {
        el.style.opacity = '1';
        el.style.display = '';
      } else if (isHistory) {
        el.style.opacity = '0.3';
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('vc-timeline-change', {
      detail: VC_TIMELINE
    }));
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', updateTimeline);
})();
`;
  }

  /**
   * Generate HTML for timeline controls.
   */
  generateControlsHTML(): string {
    const state = this.getState();

    return `
<div class="vc-timeline-controls">
  <div class="vc-timeline-display" id="vc-timeline-time">t = ${state.time.toFixed(2)}</div>
  <div class="vc-timeline-slider-container">
    <button onclick="vcStepBackward()" title="Previous">◀</button>
    <button onclick="vcToStart()" title="Start">⏮</button>
    <input type="range" id="vc-timeline-slider"
           min="0" max="100" step="0.1"
           value="${state.progress * 100}"
           oninput="vcSetProgress(this.value / 100)">
    <button onclick="vcToEnd()" title="End">⏭</button>
    <button onclick="vcStepForward()" title="Next">▶</button>
  </div>
  <div class="vc-timeline-info">
    State ${state.currentIndex + 1} of ${state.totalStates}
  </div>
</div>
`;
  }
}

// =============================================================================
// CSS for Timeline Controls
// =============================================================================

export const TIMELINE_CONTROLS_CSS = `
.vc-timeline-controls {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vc-timeline-display {
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.vc-timeline-slider-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vc-timeline-slider-container button {
  width: 28px;
  height: 28px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 10px;
}

.vc-timeline-slider-container button:hover {
  background: #eee;
}

#vc-timeline-slider {
  width: 300px;
  height: 8px;
  cursor: pointer;
}

.vc-timeline-info {
  color: #666;
  font-size: 11px;
}
`;

// =============================================================================
// Determinism Testing Utilities
// =============================================================================

/**
 * Test determinism by taking multiple snapshots at the same time.
 */
export function testDeterminism(
  scrubber: TimelineScrubber,
  times: number[],
  iterations: number = 3
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const time of times) {
    const snapshots: SceneSnapshot[] = [];

    // Take multiple snapshots at same time
    for (let i = 0; i < iterations; i++) {
      scrubber.setTime(time);
      snapshots.push(scrubber.takeSnapshot());
    }

    // All snapshots should be identical
    const firstHash = snapshots[0]!.hash;
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i]!.hash !== firstHash) {
        failures.push(
          `Non-deterministic at t=${time}: iteration ${i} differs from iteration 0`
        );
      }
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

/**
 * Test that forward/backward scrubbing produces same result.
 */
export function testHysteresis(
  scrubber: TimelineScrubber,
  targetTime: number
): { passed: boolean; message: string } {
  // Approach from start
  scrubber.toStart();
  scrubber.setTime(targetTime);
  const fromStart = scrubber.takeSnapshot();

  // Approach from end
  scrubber.toEnd();
  scrubber.setTime(targetTime);
  const fromEnd = scrubber.takeSnapshot();

  const passed = TimelineScrubber.verifyDeterminism(fromStart, fromEnd);

  return {
    passed,
    message: passed
      ? `No hysteresis at t=${targetTime}`
      : `Hysteresis detected at t=${targetTime}: forward hash=${fromStart.hash}, backward hash=${fromEnd.hash}`,
  };
}
