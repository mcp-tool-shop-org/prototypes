/**
 * VectorCaliper - Timeline Scrubber Tests
 *
 * Verifies:
 * 1. Given same t, same output every time (determinism)
 * 2. No hysteresis (forward vs backward approach yields same result)
 * 3. Snapshot consistency
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TimelineScrubber,
  testDeterminism,
  testHysteresis,
  type SceneSnapshot,
} from '../src/interactive/timeline-scrubber';
import { TrajectoryBuilder } from '../src/time/trajectory';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';
import type { StateTrajectory } from '../src/types/state';

describe('TimelineScrubber', () => {
  let trajectory: StateTrajectory;
  let mapper: SemanticMapper;
  let projector: ProjectionEngine;

  beforeEach(() => {
    // Build a test trajectory
    const builder = new TrajectoryBuilder('test-trajectory');

    for (let i = 0; i < 5; i++) {
      builder.add(
        createModelState({
          id: `state-${i}`,
          time: i * 10,
          geometry: {
            effectiveDimension: 2 + i * 0.5,
            anisotropy: 1 + i * 0.2,
            spread: 3 + i * 0.5,
            density: 0.5 + i * 0.1,
          },
          uncertainty: {
            entropy: 1 + i * 0.3,
            margin: 0.8 - i * 0.1,
            calibration: 0.05 + i * 0.02,
          },
          performance: {
            accuracy: 0.6 + i * 0.08,
            loss: 0.4 - i * 0.08,
          },
        })
      );
    }

    trajectory = builder.build();
    mapper = new SemanticMapper();
    projector = new ProjectionEngine();
  });

  describe('Basic Operations', () => {
    it('initializes with correct time range', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      const state = scrubber.getState();

      expect(state.timeRange.start).toBe(0);
      expect(state.timeRange.end).toBe(40);
      expect(state.totalStates).toBe(5);
    });

    it('setTime updates current time', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(20);
      expect(scrubber.getTime()).toBe(20);

      scrubber.setTime(35);
      expect(scrubber.getTime()).toBe(35);
    });

    it('setTime clamps to valid range', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(-10);
      expect(scrubber.getTime()).toBe(0);

      scrubber.setTime(100);
      expect(scrubber.getTime()).toBe(40);
    });

    it('setProgress updates by normalized value', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setProgress(0);
      expect(scrubber.getTime()).toBe(0);

      scrubber.setProgress(0.5);
      expect(scrubber.getTime()).toBe(20);

      scrubber.setProgress(1);
      expect(scrubber.getTime()).toBe(40);
    });

    it('getProgress returns correct normalized value', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(0);
      expect(scrubber.getProgress()).toBe(0);

      scrubber.setTime(20);
      expect(scrubber.getProgress()).toBe(0.5);

      scrubber.setTime(40);
      expect(scrubber.getProgress()).toBe(1);
    });

    it('toStart goes to beginning', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(25);
      scrubber.toStart();
      expect(scrubber.getTime()).toBe(0);
    });

    it('toEnd goes to end', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.toStart();
      scrubber.toEnd();
      expect(scrubber.getTime()).toBe(40);
    });

    it('stepForward advances to next state', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.toStart();

      scrubber.stepForward();
      expect(scrubber.getTime()).toBe(10);

      scrubber.stepForward();
      expect(scrubber.getTime()).toBe(20);
    });

    it('stepBackward goes to previous state', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.toEnd();

      scrubber.stepBackward();
      expect(scrubber.getTime()).toBe(30);

      scrubber.stepBackward();
      expect(scrubber.getTime()).toBe(20);
    });
  });

  describe('Determinism', () => {
    it('same time produces identical snapshot (basic)', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(20);
      const snapshot1 = scrubber.takeSnapshot();

      scrubber.setTime(20);
      const snapshot2 = scrubber.takeSnapshot();

      expect(snapshot1.hash).toBe(snapshot2.hash);
      expect(snapshot1.time).toBe(snapshot2.time);
    });

    it('same time produces identical snapshot after navigation', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      // First snapshot at t=20
      scrubber.setTime(20);
      const snapshot1 = scrubber.takeSnapshot();

      // Navigate away and back
      scrubber.toEnd();
      scrubber.toStart();
      scrubber.setTime(35);
      scrubber.setTime(5);
      scrubber.setTime(20); // Back to t=20

      const snapshot2 = scrubber.takeSnapshot();

      expect(TimelineScrubber.verifyDeterminism(snapshot1, snapshot2)).toBe(true);
    });

    it('testDeterminism utility passes for valid scrubber', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      const result = testDeterminism(scrubber, [0, 10, 20, 30, 40], 5);

      expect(result.passed).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it('different times produce different snapshots', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(10);
      const snapshot1 = scrubber.takeSnapshot();

      scrubber.setTime(30);
      const snapshot2 = scrubber.takeSnapshot();

      // Different times should have different hashes
      expect(snapshot1.hash).not.toBe(snapshot2.hash);
    });
  });

  describe('No Hysteresis', () => {
    it('approaching from start yields same result as from end', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      const result = testHysteresis(scrubber, 20);

      expect(result.passed).toBe(true);
    });

    it('testHysteresis passes for all times', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      const times = [5, 10, 15, 20, 25, 30, 35];
      for (const t of times) {
        const result = testHysteresis(scrubber, t);
        expect(result.passed).toBe(true);
      }
    });

    it('zigzag navigation maintains determinism', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      // Take initial snapshot at t=20
      scrubber.setTime(20);
      const initial = scrubber.takeSnapshot();

      // Zigzag navigation
      scrubber.setTime(10);
      scrubber.setTime(30);
      scrubber.setTime(5);
      scrubber.setTime(35);
      scrubber.setTime(15);
      scrubber.setTime(25);
      scrubber.setTime(20); // Back to t=20

      const afterZigzag = scrubber.takeSnapshot();

      expect(TimelineScrubber.verifyDeterminism(initial, afterZigzag)).toBe(true);
    });
  });

  describe('Scene Building', () => {
    it('buildScene produces valid scene', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(20);

      const scene = scrubber.buildScene();

      expect(scene).toBeDefined();
      expect(scene.getNodes().length).toBeGreaterThan(0);
    });

    it('buildScene at same time produces identical scenes', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(15);
      const scene1 = scrubber.buildScene();

      scrubber.setTime(15);
      const scene2 = scrubber.buildScene();

      // Same number of nodes
      expect(scene1.getNodes().length).toBe(scene2.getNodes().length);

      // Same node IDs
      const ids1 = scene1.getNodes().map((n) => n.id.value).sort();
      const ids2 = scene2.getNodes().map((n) => n.id.value).sort();
      expect(ids1).toEqual(ids2);
    });

    it('scene has path when showPath is enabled', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector, {
        showPath: true,
      });
      scrubber.setTime(20);

      const scene = scrubber.buildScene();
      const pathNodes = scene.getNodesByType('path');

      expect(pathNodes.length).toBeGreaterThan(0);
    });

    it('scene has no path when showPath is disabled', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector, {
        showPath: false,
      });
      scrubber.setTime(20);

      const scene = scrubber.buildScene();
      const pathNodes = scene.getNodesByType('path');

      expect(pathNodes.length).toBe(0);
    });
  });

  describe('Snapshot', () => {
    it('takeSnapshot includes all node data', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(20);

      const snapshot = scrubber.takeSnapshot();

      expect(snapshot.time).toBe(20);
      expect(snapshot.nodes.length).toBeGreaterThan(0);
      expect(snapshot.hash).toBeTruthy();

      for (const node of snapshot.nodes) {
        expect(typeof node.id).toBe('string');
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(typeof node.visible).toBe('boolean');
        expect(typeof node.opacity).toBe('number');
      }
    });

    it('snapshot nodes are sorted by ID', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(20);

      const snapshot = scrubber.takeSnapshot();

      const ids = snapshot.nodes.map((n) => n.id);
      const sortedIds = [...ids].sort();

      expect(ids).toEqual(sortedIds);
    });

    it('verifyDeterminism returns false for different times', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      scrubber.setTime(10);
      const snapshot1 = scrubber.takeSnapshot();

      scrubber.setTime(30);
      const snapshot2 = scrubber.takeSnapshot();

      expect(TimelineScrubber.verifyDeterminism(snapshot1, snapshot2)).toBe(false);
    });
  });

  describe('State', () => {
    it('getState returns complete state', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(25);

      const state = scrubber.getState();

      expect(state.time).toBe(25);
      expect(state.progress).toBeCloseTo(0.625, 5);
      expect(state.totalStates).toBe(5);
      expect(state.timeRange.start).toBe(0);
      expect(state.timeRange.end).toBe(40);
    });

    it('getCurrentModelState returns correct state', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);

      // At t=0, should get first state
      scrubber.setTime(0);
      const state0 = scrubber.getCurrentModelState();
      expect(state0.id).toBe('state-0');

      // At t=10, should get second state
      scrubber.setTime(10);
      const state1 = scrubber.getCurrentModelState();
      expect(state1.id).toBe('state-1');

      // At t=40, should get last state
      scrubber.setTime(40);
      const state4 = scrubber.getCurrentModelState();
      expect(state4.id).toBe('state-4');
    });

    it('getCurrentProjectedState returns valid projection', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      scrubber.setTime(20);

      const projected = scrubber.getCurrentProjectedState();

      expect(projected).not.toBeNull();
      expect(projected!.position).toBeDefined();
      expect(typeof projected!.position.x).toBe('number');
      expect(typeof projected!.position.y).toBe('number');
    });
  });

  describe('HTML Generation', () => {
    it('generateScrubScript returns valid JavaScript', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      const script = scrubber.generateScrubScript();

      expect(script).toContain('vcSetTime');
      expect(script).toContain('vcSetProgress');
      expect(script).toContain('vcStepForward');
      expect(script).toContain('vcStepBackward');
      expect(script).toContain('VC_TIMELINE');
    });

    it('generateControlsHTML returns valid HTML', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector);
      const html = scrubber.generateControlsHTML();

      expect(html).toContain('vc-timeline-controls');
      expect(html).toContain('vc-timeline-slider');
      expect(html).toContain('input type="range"');
    });
  });

  describe('Configuration', () => {
    it('respects showHistory config', () => {
      const scrubberWithHistory = new TimelineScrubber(
        trajectory,
        mapper,
        projector,
        { showHistory: true }
      );

      const scrubberNoHistory = new TimelineScrubber(
        trajectory,
        mapper,
        projector,
        { showHistory: false }
      );

      scrubberWithHistory.setTime(30);
      scrubberNoHistory.setTime(30);

      const sceneWith = scrubberWithHistory.buildScene();
      const sceneWithout = scrubberNoHistory.buildScene();

      // History shows more nodes (past states)
      expect(sceneWith.getNodes().length).toBeGreaterThan(
        sceneWithout.getNodes().length
      );
    });

    it('maxHistory limits history count', () => {
      const scrubber = new TimelineScrubber(trajectory, mapper, projector, {
        showHistory: true,
        maxHistory: 2,
      });

      scrubber.toEnd();
      const scene = scrubber.buildScene();

      // Should have: 2 history + 1 current + path
      const pointNodes = scene.getNodesByType('point');
      expect(pointNodes.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('Determinism with Multiple Instances', () => {
  it('two scrubbers with same trajectory produce identical output', () => {
    const builder = new TrajectoryBuilder('test');
    for (let i = 0; i < 3; i++) {
      builder.add(
        createModelState({
          id: `s${i}`,
          time: i * 10,
          geometry: {
            effectiveDimension: 2,
            anisotropy: 1,
            spread: 3,
            density: 0.5,
          },
          uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
          performance: { accuracy: 0.8, loss: 0.2 },
        })
      );
    }
    const trajectory = builder.build();

    const mapper1 = new SemanticMapper();
    const mapper2 = new SemanticMapper();
    const proj1 = new ProjectionEngine();
    const proj2 = new ProjectionEngine();

    const scrubber1 = new TimelineScrubber(trajectory, mapper1, proj1);
    const scrubber2 = new TimelineScrubber(trajectory, mapper2, proj2);

    scrubber1.setTime(10);
    scrubber2.setTime(10);

    const snapshot1 = scrubber1.takeSnapshot();
    const snapshot2 = scrubber2.takeSnapshot();

    // Both should produce same hash
    expect(snapshot1.hash).toBe(snapshot2.hash);
  });
});
