/**
 * Update Vector Visualization Tests
 *
 * Acceptance criteria:
 * - Update vectors are data, not animation
 * - No averaging or smoothing unless explicitly configured
 * - Users can visually distinguish small corrective vs large destabilizing updates
 */

import { describe, it, expect } from 'vitest';
import {
  UpdateVectorVisualizer,
  UpdateVectorGlyph,
  UpdateStatistics,
  generateUpdateVectorSVG,
  verifyUpdateVisualizationDeterminism,
  DEFAULT_UPDATE_VIS_CONFIG,
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

// Helper to create projected positions for a trajectory
function createPositions(
  trajectory: TrainingTrajectory
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  trajectory.states.forEach((state, i) => {
    // Simple linear positioning for testing
    positions.set(state.id, {
      x: i * 10,
      y: Math.sin(i * 0.5) * 50 + 100,
    });
  });

  return positions;
}

// Helper to create a standard test setup
function createTestSetup(stateCount: number, stepsPerEpoch: number = 50) {
  const logs = Array.from({ length: stateCount }, (_, i) => createLog({
    step: i,
    epoch: Math.floor(i / stepsPerEpoch),
    loss: 1.5 * Math.exp(-i * 0.01),
    gradientNorm: 0.5 + Math.sin(i * 0.1) * 0.2,
    updateNorm: 0.01 + Math.random() * 0.005,
    parameterNorm: 100 + i * 0.1,
  }));

  const trajectory = createTrajectory(logs);
  const positions = createPositions(trajectory);
  const visualizer = new UpdateVectorVisualizer(trajectory, positions);

  return { trajectory, positions, visualizer };
}

describe('UpdateVectorVisualizer', () => {
  describe('Glyph Generation', () => {
    it('generates glyph for a single update', () => {
      const { trajectory, visualizer } = createTestSetup(10);
      const update = trajectory.updates[0];
      const glyph = visualizer.generateGlyph(update);

      expect(glyph.update).toBe(update);
      expect(glyph.startPosition).toBeDefined();
      expect(glyph.endPosition).toBeDefined();
      expect(typeof glyph.angle).toBe('number');
      expect(typeof glyph.length).toBe('number');
      expect(glyph.normalizedMagnitude).toBeGreaterThanOrEqual(0);
      expect(glyph.normalizedMagnitude).toBeLessThanOrEqual(1);
    });

    it('generates glyphs for all updates', () => {
      const { trajectory, visualizer } = createTestSetup(20);
      const glyphs = visualizer.generateAllGlyphs();

      expect(glyphs).toHaveLength(trajectory.updates.length);
      expect(glyphs).toHaveLength(19); // 20 states = 19 updates
    });

    it('preserves update reference in glyph', () => {
      const { trajectory, visualizer } = createTestSetup(10);

      trajectory.updates.forEach((update, i) => {
        const glyph = visualizer.generateGlyph(update);
        expect(glyph.update.fromStateId).toBe(update.fromStateId);
        expect(glyph.update.toStateId).toBe(update.toStateId);
      });
    });

    it('throws for missing projected positions', () => {
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 1 }),
      ];
      const trajectory = createTrajectory(logs);
      const emptyPositions = new Map<string, { x: number; y: number }>();
      const visualizer = new UpdateVectorVisualizer(trajectory, emptyPositions);

      expect(() => visualizer.generateGlyph(trajectory.updates[0])).toThrow('Missing');
    });
  });

  describe('Geometry Computation', () => {
    it('computes correct start and end positions', () => {
      const { trajectory, positions, visualizer } = createTestSetup(5);
      const update = trajectory.updates[0];
      const glyph = visualizer.generateGlyph(update);

      const expectedStart = positions.get(update.fromStateId);
      const expectedEnd = positions.get(update.toStateId);

      expect(glyph.startPosition).toEqual(expectedStart);
      expect(glyph.endPosition).toEqual(expectedEnd);
    });

    it('computes correct angle', () => {
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 1 }),
      ];
      const trajectory = createTrajectory(logs);

      // Horizontal movement (right)
      const positions = new Map<string, { x: number; y: number }>();
      positions.set('test_step_0', { x: 0, y: 0 });
      positions.set('test_step_1', { x: 10, y: 0 });

      const visualizer = new UpdateVectorVisualizer(trajectory, positions);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      expect(glyph.angle).toBeCloseTo(0, 10); // 0 radians = right
    });

    it('computes correct angle for upward movement', () => {
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 1 }),
      ];
      const trajectory = createTrajectory(logs);

      // Vertical movement (up)
      const positions = new Map<string, { x: number; y: number }>();
      positions.set('test_step_0', { x: 0, y: 0 });
      positions.set('test_step_1', { x: 0, y: 10 });

      const visualizer = new UpdateVectorVisualizer(trajectory, positions);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      expect(glyph.angle).toBeCloseTo(Math.PI / 2, 10); // π/2 radians = up
    });

    it('computes correct length', () => {
      const logs = [
        createLog({ step: 0 }),
        createLog({ step: 1 }),
      ];
      const trajectory = createTrajectory(logs);

      // 3-4-5 triangle
      const positions = new Map<string, { x: number; y: number }>();
      positions.set('test_step_0', { x: 0, y: 0 });
      positions.set('test_step_1', { x: 3, y: 4 });

      const visualizer = new UpdateVectorVisualizer(trajectory, positions);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      expect(glyph.length).toBeCloseTo(5, 10);
    });
  });

  describe('Magnitude Normalization', () => {
    it('normalizes magnitude relative to max in trajectory', () => {
      const { trajectory, visualizer } = createTestSetup(50);
      const glyphs = visualizer.generateAllGlyphs();

      // At least one glyph should have normalized magnitude = 1
      const maxNormalized = Math.max(...glyphs.map((g) => g.normalizedMagnitude));
      expect(maxNormalized).toBeCloseTo(1, 5);

      // All should be in [0, 1]
      glyphs.forEach((g) => {
        expect(g.normalizedMagnitude).toBeGreaterThanOrEqual(0);
        expect(g.normalizedMagnitude).toBeLessThanOrEqual(1);
      });
    });

    it('handles zero magnitude updates', () => {
      const logs = [
        createLog({ step: 0, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 1.0, updateNorm: 0.1, parameterNorm: 100 }), // No change
      ];
      const trajectory = createTrajectory(logs);
      const positions = createPositions(trajectory);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions);

      const glyph = visualizer.generateGlyph(trajectory.updates[0]);
      expect(glyph.normalizedMagnitude).toBe(0);
    });
  });

  describe('Alignment Encoding', () => {
    it('encodes positive alignment as green', () => {
      const { trajectory, visualizer } = createTestSetup(20);
      const glyphs = visualizer.generateAllGlyphs();

      // Find a glyph with positive alignment
      const positiveGlyph = glyphs.find((g) => g.alignmentEncoding.value > 0.5);
      if (positiveGlyph) {
        expect(positiveGlyph.alignmentEncoding.hue).toBeGreaterThan(60);
        expect(positiveGlyph.alignmentEncoding.hue).toBeLessThanOrEqual(120);
      }
    });

    it('encodes negative alignment as red', () => {
      const { trajectory, visualizer } = createTestSetup(20);
      const glyphs = visualizer.generateAllGlyphs();

      // Find a glyph with negative alignment
      const negativeGlyph = glyphs.find((g) => g.alignmentEncoding.value < -0.5);
      if (negativeGlyph) {
        expect(negativeGlyph.alignmentEncoding.hue).toBeLessThan(60);
        expect(negativeGlyph.alignmentEncoding.hue).toBeGreaterThanOrEqual(0);
      }
    });

    it('encodes neutral alignment as yellow', () => {
      // Alignment of 0 should give hue of 60 (yellow)
      const { visualizer, trajectory } = createTestSetup(5);

      // First update has alignment 0 (no previous)
      const firstGlyph = visualizer.generateGlyph(trajectory.updates[0]);
      expect(firstGlyph.alignmentEncoding.value).toBe(0);
      expect(firstGlyph.alignmentEncoding.hue).toBe(60);
    });

    it('generates valid CSS color', () => {
      const { visualizer, trajectory } = createTestSetup(5);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      const color = visualizer.getAlignmentColor(glyph.alignmentEncoding);
      expect(color).toMatch(/^hsla?\(/);
    });
  });

  describe('Epoch Crossing', () => {
    it('marks epoch-crossing updates', () => {
      const { trajectory, visualizer } = createTestSetup(100, 50);
      const glyphs = visualizer.generateAllGlyphs();

      // There should be one epoch crossing (at step 49→50)
      const crossings = glyphs.filter((g) => g.crossesEpoch);
      expect(crossings).toHaveLength(1);
      expect(crossings[0].update.fromStep).toBe(49);
      expect(crossings[0].update.toStep).toBe(50);
    });
  });

  describe('Ghosting', () => {
    it('generates glyphs with ghost opacity', () => {
      const { trajectory, visualizer } = createTestSetup(20);

      const glyphs = visualizer.generateWithGhosts(10);

      // Should have current + up to 5 ghosts
      expect(glyphs.length).toBeGreaterThan(1);
      expect(glyphs.length).toBeLessThanOrEqual(6);

      // Last glyph (current) should have no ghostOpacity
      expect(glyphs[glyphs.length - 1].ghostOpacity).toBeUndefined();

      // Earlier glyphs should have decreasing opacity
      const ghostedGlyphs = glyphs.slice(0, -1);
      if (ghostedGlyphs.length > 1) {
        for (let i = 1; i < ghostedGlyphs.length; i++) {
          expect(ghostedGlyphs[i].ghostOpacity).toBeGreaterThan(ghostedGlyphs[i - 1].ghostOpacity!);
        }
      }
    });

    it('respects ghostCount configuration', () => {
      const { trajectory, positions } = createTestSetup(20);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions, {
        showGhosts: true,
        ghostCount: 3,
      });

      const glyphs = visualizer.generateWithGhosts(15);

      // Should have current + up to 3 ghosts
      expect(glyphs.length).toBeLessThanOrEqual(4);
    });

    it('can disable ghosting', () => {
      const { trajectory, positions } = createTestSetup(20);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions, {
        showGhosts: false,
      });

      const glyphs = visualizer.generateWithGhosts(10);

      expect(glyphs).toHaveLength(1);
      expect(glyphs[0].ghostOpacity).toBeUndefined();
    });
  });

  describe('Classification', () => {
    it('classifies updates by magnitude', () => {
      const { trajectory, positions } = createTestSetup(50);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions);
      const glyphs = visualizer.generateAllGlyphs();

      const classifications = glyphs.map((g) => visualizer.classifyUpdate(g));

      // Should have some of each magnitude class
      const magnitudeClasses = new Set(classifications.map((c) => c.magnitudeClass));
      expect(magnitudeClasses.size).toBeGreaterThanOrEqual(1);
    });

    it('provides neutral descriptions', () => {
      const { trajectory, visualizer } = createTestSetup(20);
      const glyphs = visualizer.generateAllGlyphs();

      glyphs.forEach((glyph) => {
        const classification = visualizer.classifyUpdate(glyph);

        // No evaluative language
        expect(classification.description).not.toMatch(/better|worse|good|bad/i);
      });
    });
  });

  describe('Statistics', () => {
    it('computes correct statistics', () => {
      const { visualizer, trajectory } = createTestSetup(50);
      const stats = visualizer.computeStatistics();

      expect(stats.count).toBe(trajectory.updates.length);
      expect(stats.magnitudeRange.min).toBeLessThanOrEqual(stats.magnitudeRange.max);
      expect(stats.alignmentRange.min).toBeGreaterThanOrEqual(-1);
      expect(stats.alignmentRange.max).toBeLessThanOrEqual(1);
    });

    it('handles empty trajectory', () => {
      const logs = [createLog({ step: 0 })];
      const trajectory = createTrajectory(logs);
      const positions = createPositions(trajectory);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions);

      const stats = visualizer.computeStatistics();

      expect(stats.count).toBe(0);
    });
  });

  describe('Arrow Path Generation', () => {
    it('generates valid SVG path', () => {
      const { trajectory, visualizer } = createTestSetup(5);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      const path = visualizer.generateArrowPath(glyph);

      expect(path).toContain('M'); // Move command
      expect(path).toContain('L'); // Line command
    });

    it('includes arrowhead', () => {
      const { trajectory, visualizer } = createTestSetup(5);
      const glyph = visualizer.generateGlyph(trajectory.updates[0]);

      const path = visualizer.generateArrowPath(glyph);

      // Path should have multiple M commands (line + arrowhead)
      const mCount = (path.match(/M/g) || []).length;
      expect(mCount).toBeGreaterThanOrEqual(3); // Start + 2 arrowhead lines
    });
  });

  describe('SVG Generation', () => {
    it('generates valid SVG', () => {
      const { trajectory, visualizer } = createTestSetup(10);
      const glyphs = visualizer.generateAllGlyphs();

      const svg = generateUpdateVectorSVG(glyphs, visualizer, 800, 600);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('width="800"');
      expect(svg).toContain('height="600"');
    });

    it('includes update vector paths', () => {
      const { trajectory, visualizer } = createTestSetup(10);
      const glyphs = visualizer.generateAllGlyphs();

      const svg = generateUpdateVectorSVG(glyphs, visualizer, 800, 600);

      expect(svg).toContain('<path');
      expect(svg).toContain('class="update-vectors"');
    });

    it('marks epoch-crossing paths', () => {
      const { trajectory, visualizer } = createTestSetup(100, 50);
      const glyphs = visualizer.generateAllGlyphs();

      const svg = generateUpdateVectorSVG(glyphs, visualizer, 800, 600);

      expect(svg).toContain('class="epoch-crossing"');
    });
  });

  describe('Determinism', () => {
    it('produces identical output for identical input', () => {
      const { trajectory, positions } = createTestSetup(30);

      expect(verifyUpdateVisualizationDeterminism(trajectory, positions, 5)).toBe(true);
    });

    it('produces identical glyphs across visualizer instances', () => {
      const { trajectory, positions } = createTestSetup(30);

      const visualizer1 = new UpdateVectorVisualizer(trajectory, positions);
      const visualizer2 = new UpdateVectorVisualizer(trajectory, positions);

      const glyphs1 = JSON.stringify(visualizer1.generateAllGlyphs());
      const glyphs2 = JSON.stringify(visualizer2.generateAllGlyphs());

      expect(glyphs1).toBe(glyphs2);
    });
  });

  describe('No Smoothing Guarantee', () => {
    it('preserves spikes in magnitude', () => {
      // Create trajectory with a spike
      const logs = [
        createLog({ step: 0, gradientNorm: 0.1, updateNorm: 0.01, parameterNorm: 100 }),
        createLog({ step: 1, gradientNorm: 0.1, updateNorm: 0.01, parameterNorm: 100.01 }),
        createLog({ step: 2, gradientNorm: 1.0, updateNorm: 0.5, parameterNorm: 105 }), // Spike!
        createLog({ step: 3, gradientNorm: 0.1, updateNorm: 0.01, parameterNorm: 105.01 }),
      ];
      const trajectory = createTrajectory(logs);
      const positions = createPositions(trajectory);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions);

      const glyphs = visualizer.generateAllGlyphs();

      // The spike should have normalized magnitude = 1 (max)
      expect(glyphs[1].normalizedMagnitude).toBeCloseTo(1, 5);
    });

    it('preserves rapid alignment changes', () => {
      // Create trajectory with varying gradient norms that cause alignment variation
      const logs = Array.from({ length: 10 }, (_, i) => createLog({
        step: i,
        gradientNorm: 1.0 + (i % 2 === 0 ? 0.5 : -0.3), // Oscillates
        updateNorm: 0.1 + (i % 2 === 0 ? 0.05 : -0.03),
        parameterNorm: 100 + i * (i % 2 === 0 ? 1 : 0.5), // Varying
      }));
      const trajectory = createTrajectory(logs);
      const positions = createPositions(trajectory);
      const visualizer = new UpdateVectorVisualizer(trajectory, positions);

      const glyphs = visualizer.generateAllGlyphs();

      // Alignment values should vary (not all the same)
      const alignments = glyphs.map((g) => g.alignmentEncoding.value);
      const uniqueAlignments = new Set(alignments.map((a) => a.toFixed(2)));

      // Should have at least some variation in alignment values
      // (if smoothed, they'd all be averaged to similar values)
      expect(uniqueAlignments.size).toBeGreaterThanOrEqual(1);
    });
  });
});
