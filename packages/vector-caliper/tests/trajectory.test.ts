/**
 * VectorCaliper - Time & Trajectory Tests
 *
 * Tests:
 * 1. Trajectory building with validation
 * 2. Time controller scrubbing
 * 3. Velocity and path length computation
 * 4. Phase transition detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TrajectoryBuilder,
  TimeController,
  computeVelocities,
  computePathLength,
  findPhaseTransitions,
  computeStrokeWidths,
  computeHistoryOpacity,
} from '../src/time';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';
import type { ProjectedState } from '../src/types/state';

// Helper to create test states
const createTestState = (id: string, time: number, spread: number = 1) =>
  createModelState({
    id,
    time,
    geometry: {
      effectiveDimension: 2 + time * 0.1,
      anisotropy: 1.5,
      spread,
      density: 0.5,
    },
    uncertainty: {
      entropy: 1 + time * 0.1,
      margin: 0.5,
      calibration: 0.1,
    },
    performance: {
      accuracy: 0.8 + time * 0.01,
      loss: 0.2 - time * 0.01,
    },
  });

describe('TrajectoryBuilder', () => {
  let builder: TrajectoryBuilder;

  beforeEach(() => {
    builder = new TrajectoryBuilder('test-trajectory');
  });

  it('builds valid trajectory from states', () => {
    builder
      .add(createTestState('state-0', 0))
      .add(createTestState('state-1', 1))
      .add(createTestState('state-2', 2));

    const trajectory = builder.build();

    expect(trajectory.id).toBe('test-trajectory');
    expect(trajectory.states.length).toBe(3);
    expect(trajectory.timeRange.start).toBe(0);
    expect(trajectory.timeRange.end).toBe(2);
  });

  it('tracks length', () => {
    expect(builder.length).toBe(0);

    builder.add(createTestState('state-0', 0));
    expect(builder.length).toBe(1);

    builder.add(createTestState('state-1', 1));
    expect(builder.length).toBe(2);
  });

  it('clears states', () => {
    builder
      .add(createTestState('state-0', 0))
      .add(createTestState('state-1', 1));

    expect(builder.length).toBe(2);

    builder.clear();
    expect(builder.length).toBe(0);
  });

  it('rejects non-monotonic time', () => {
    builder.add(createTestState('state-0', 0));
    builder.add(createTestState('state-1', 2));

    expect(() => builder.add(createTestState('state-2', 1))).toThrow();
  });

  it('rejects equal consecutive times', () => {
    builder.add(createTestState('state-0', 0));

    expect(() => builder.add(createTestState('state-1', 0))).toThrow();
  });

  it('addAll adds multiple states', () => {
    builder.addAll([
      createTestState('state-0', 0),
      createTestState('state-1', 1),
      createTestState('state-2', 2),
    ]);

    expect(builder.length).toBe(3);
  });

  it('throws on empty build', () => {
    expect(() => builder.build()).toThrow();
  });
});

describe('TimeController', () => {
  let controller: TimeController;
  let projector: ProjectionEngine;

  beforeEach(() => {
    const builder = new TrajectoryBuilder('test');
    builder.addAll([
      createTestState('state-0', 0),
      createTestState('state-1', 1),
      createTestState('state-2', 2),
      createTestState('state-3', 3),
      createTestState('state-4', 4),
    ]);

    controller = new TimeController(builder.build());
    projector = new ProjectionEngine();
  });

  describe('Time Control', () => {
    it('starts at beginning', () => {
      expect(controller.getTime()).toBe(0);
      expect(controller.isAtStart()).toBe(true);
    });

    it('setTime moves to specific time', () => {
      controller.setTime(2.5);
      expect(controller.getTime()).toBe(2.5);
    });

    it('setTime clamps to range', () => {
      controller.setTime(-10);
      expect(controller.getTime()).toBe(0);

      controller.setTime(100);
      expect(controller.getTime()).toBe(4);
    });

    it('advance moves forward', () => {
      controller.advance(1.5);
      expect(controller.getTime()).toBe(1.5);

      controller.advance(1);
      expect(controller.getTime()).toBe(2.5);
    });

    it('advance can go backward', () => {
      controller.setTime(3);
      controller.advance(-1);
      expect(controller.getTime()).toBe(2);
    });

    it('toStart goes to beginning', () => {
      controller.setTime(3);
      controller.toStart();
      expect(controller.getTime()).toBe(0);
      expect(controller.isAtStart()).toBe(true);
    });

    it('toEnd goes to end', () => {
      controller.toEnd();
      expect(controller.getTime()).toBe(4);
      expect(controller.isAtEnd()).toBe(true);
    });
  });

  describe('Progress', () => {
    it('getProgress returns normalized value', () => {
      expect(controller.getProgress()).toBe(0);

      controller.setTime(2);
      expect(controller.getProgress()).toBe(0.5);

      controller.setTime(4);
      expect(controller.getProgress()).toBe(1);
    });

    it('setProgress moves by normalized value', () => {
      controller.setProgress(0.5);
      expect(controller.getTime()).toBe(2);

      controller.setProgress(0.25);
      expect(controller.getTime()).toBe(1);
    });

    it('setProgress clamps to [0, 1]', () => {
      controller.setProgress(-0.5);
      expect(controller.getTime()).toBe(0);

      controller.setProgress(1.5);
      expect(controller.getTime()).toBe(4);
    });
  });

  describe('State Access', () => {
    it('getCurrentState returns nearest state', () => {
      controller.setTime(0);
      expect(controller.getCurrentState().id).toBe('state-0');

      controller.setTime(1.3);
      expect(controller.getCurrentState().id).toBe('state-1');

      controller.setTime(1.7);
      expect(controller.getCurrentState().id).toBe('state-2');
    });

    it('getStateAtTime finds correct state', () => {
      expect(controller.getStateAtTime(0).id).toBe('state-0');
      expect(controller.getStateAtTime(2).id).toBe('state-2');
      expect(controller.getStateAtTime(4).id).toBe('state-4');
    });

    it('getCurrentIndex returns correct index', () => {
      controller.setTime(0);
      expect(controller.getCurrentIndex()).toBe(0);

      controller.setTime(2);
      expect(controller.getCurrentIndex()).toBe(2);
    });

    it('getHistory returns states up to current time', () => {
      controller.setTime(2.5);
      const history = controller.getHistory();

      expect(history.length).toBe(3); // states 0, 1, 2
      expect(history[0]!.id).toBe('state-0');
      expect(history[2]!.id).toBe('state-2');
    });
  });

  describe('With Projection', () => {
    it('setProjection enables projected state access', () => {
      controller.setProjection(projector);
      controller.setTime(2);

      const projected = controller.getCurrentProjectedState();
      expect(projected).not.toBeNull();
      expect(projected!.sourceId).toBe('state-2');
    });

    it('getProjectedHistory returns projected history', () => {
      controller.setProjection(projector);
      controller.setTime(2);

      const history = controller.getProjectedHistory();
      expect(history.length).toBe(3);
    });

    it('returns null before projection set', () => {
      expect(controller.getCurrentProjectedState()).toBeNull();
    });
  });

  describe('Trajectory Info', () => {
    it('getTrajectory returns the trajectory', () => {
      const trajectory = controller.getTrajectory();
      expect(trajectory.id).toBe('test');
      expect(trajectory.states.length).toBe(5);
    });

    it('getDuration returns correct duration', () => {
      expect(controller.getDuration()).toBe(4);
    });
  });
});

describe('Trajectory Analysis', () => {
  // Create projected states with known positions
  const createProjectedStates = (
    positions: { x: number; y: number; time: number }[]
  ): ProjectedState[] =>
    positions.map((p, i) => ({
      sourceId: `state-${i}`,
      time: p.time,
      position: { x: p.x, y: p.y },
      projection: { method: 'pca' as const, seed: 0, components: 2 },
      source: createTestState(`state-${i}`, p.time),
    }));

  describe('computeVelocities', () => {
    it('computes velocities between points', () => {
      const projected = createProjectedStates([
        { x: 0, y: 0, time: 0 },
        { x: 10, y: 0, time: 1 }, // 10 units in 1 time
        { x: 10, y: 20, time: 2 }, // 20 units in 1 time
      ]);

      const velocities = computeVelocities(projected);

      expect(velocities.length).toBe(2);
      expect(velocities[0]).toBe(10);
      expect(velocities[1]).toBe(20);
    });

    it('handles zero time delta', () => {
      const projected = createProjectedStates([
        { x: 0, y: 0, time: 0 },
        { x: 10, y: 0, time: 0 }, // Same time
      ]);

      const velocities = computeVelocities(projected);
      expect(velocities[0]).toBe(0);
    });

    it('returns empty for single point', () => {
      const projected = createProjectedStates([{ x: 0, y: 0, time: 0 }]);
      expect(computeVelocities(projected)).toEqual([]);
    });
  });

  describe('computePathLength', () => {
    it('computes cumulative path length', () => {
      const projected = createProjectedStates([
        { x: 0, y: 0, time: 0 },
        { x: 3, y: 4, time: 1 }, // 5 units
        { x: 3, y: 16, time: 2 }, // +12 units
      ]);

      const lengths = computePathLength(projected);

      expect(lengths.length).toBe(3);
      expect(lengths[0]).toBe(0);
      expect(lengths[1]).toBe(5);
      expect(lengths[2]).toBe(17);
    });
  });

  describe('findPhaseTransitions', () => {
    it('finds sudden velocity changes', () => {
      const projected = createProjectedStates([
        { x: 0, y: 0, time: 0 },
        { x: 1, y: 0, time: 1 }, // velocity 1
        { x: 2, y: 0, time: 2 }, // velocity 1
        { x: 7, y: 0, time: 3 }, // velocity 5 (5x increase)
        { x: 8, y: 0, time: 4 }, // velocity 1
      ]);

      const transitions = findPhaseTransitions(projected, 2);

      expect(transitions).toContain(2); // Jump at index 2->3
      expect(transitions).toContain(3); // Drop at index 3->4
    });

    it('returns empty for constant velocity', () => {
      const projected = createProjectedStates([
        { x: 0, y: 0, time: 0 },
        { x: 5, y: 0, time: 1 },
        { x: 10, y: 0, time: 2 },
        { x: 15, y: 0, time: 3 },
      ]);

      const transitions = findPhaseTransitions(projected, 2);
      expect(transitions.length).toBe(0);
    });
  });
});

describe('Visualization Helpers', () => {
  describe('computeStrokeWidths', () => {
    it('varies width by velocity', () => {
      const projected = [
        { sourceId: '0', time: 0, position: { x: 0, y: 0 }, projection: { method: 'pca' as const, seed: 0, components: 2 }, source: createTestState('0', 0) },
        { sourceId: '1', time: 1, position: { x: 10, y: 0 }, projection: { method: 'pca' as const, seed: 0, components: 2 }, source: createTestState('1', 1) },
        { sourceId: '2', time: 2, position: { x: 11, y: 0 }, projection: { method: 'pca' as const, seed: 0, components: 2 }, source: createTestState('2', 2) },
      ] as ProjectedState[];

      const widths = computeStrokeWidths(projected, 2, 1, 6);

      expect(widths.length).toBe(3);
      // Slower segment (1 unit) should have thicker stroke
      expect(widths[2]).toBeGreaterThan(widths[1]);
    });
  });

  describe('computeHistoryOpacity', () => {
    it('fades older points', () => {
      const opacities = computeHistoryOpacity(5, 3, 0.1, 1.0);

      expect(opacities.length).toBe(5);

      // Current should be brightest
      expect(opacities[3]).toBeCloseTo(1.0);

      // Older should be dimmer
      expect(opacities[2]).toBeLessThan(opacities[3]);
      expect(opacities[1]).toBeLessThan(opacities[2]);
      expect(opacities[0]).toBeLessThan(opacities[1]);

      // Future should be invisible
      expect(opacities[4]).toBe(0);
    });
  });
});
