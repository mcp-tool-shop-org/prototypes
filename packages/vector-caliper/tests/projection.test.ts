/**
 * VectorCaliper - Projection Engine Tests
 *
 * Tests:
 * 1. Same input → same output (determinism)
 * 2. Projection metadata persisted
 * 3. Features correctly extracted
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProjectionEngine,
  extractFeatures,
  createSeededRandom,
  FEATURE_NAMES,
  DEFAULT_PCA_CONFIG,
} from '../src/projection';
import { createModelState } from '../src/schema';
import type { ModelState } from '../src/types/state';

describe('Feature Extraction', () => {
  const createTestState = (overrides: Partial<Parameters<typeof createModelState>[0]> = {}) =>
    createModelState({
      time: 0,
      geometry: {
        effectiveDimension: 2.5,
        anisotropy: 1.5,
        spread: 3.0,
        density: 0.7,
      },
      uncertainty: {
        entropy: 1.2,
        margin: 0.4,
        calibration: 0.08,
      },
      performance: {
        accuracy: 0.88,
        loss: 0.12,
      },
      ...overrides,
    });

  it('extracts correct number of features', () => {
    const state = createTestState();
    const features = extractFeatures(state);

    expect(features.length).toBe(FEATURE_NAMES.length);
  });

  it('extracts geometry features correctly', () => {
    const state = createTestState();
    const features = extractFeatures(state);

    expect(features[0]).toBe(2.5); // effectiveDimension
    expect(features[1]).toBe(1.5); // anisotropy
    expect(features[2]).toBe(3.0); // spread
    expect(features[3]).toBe(0.7); // density
  });

  it('extracts uncertainty features correctly', () => {
    const state = createTestState();
    const features = extractFeatures(state);

    expect(features[4]).toBe(1.2); // entropy
    expect(features[5]).toBe(0.4); // margin
    expect(features[6]).toBe(0.08); // calibration
    expect(features[7]).toBe(0); // epistemic (null → 0)
    expect(features[8]).toBe(0); // aleatoric (null → 0)
  });

  it('extracts optional uncertainty features when present', () => {
    const state = createModelState({
      time: 0,
      geometry: {
        effectiveDimension: 2.0,
        anisotropy: 1.0,
        spread: 1.0,
        density: 0.5,
      },
      uncertainty: {
        entropy: 1.0,
        margin: 0.5,
        calibration: 0.1,
        epistemic: 0.3,
        aleatoric: 0.2,
      },
      performance: {
        accuracy: 0.8,
        loss: 0.2,
      },
    });

    const features = extractFeatures(state);

    expect(features[7]).toBe(0.3); // epistemic
    expect(features[8]).toBe(0.2); // aleatoric
  });

  it('extracts performance features correctly', () => {
    const state = createTestState();
    const features = extractFeatures(state);

    expect(features[9]).toBe(0.88); // accuracy
    expect(features[10]).toBe(0.12); // loss
    expect(features[11]).toBe(0); // taskScore (null → 0)
    expect(features[12]).toBe(0); // cost (null → 0)
  });

  it('handles missing dynamics with zeros', () => {
    const state = createTestState();
    const features = extractFeatures(state);

    // Dynamics features should be zeros when dynamics is null
    expect(features[13]).toBe(0); // velocity
    expect(features[14]).toBe(0); // acceleration
    expect(features[15]).toBe(0); // stability
    expect(features[16]).toBe(0); // phase
  });

  it('extracts dynamics features when present', () => {
    const state = createModelState({
      time: 0,
      geometry: {
        effectiveDimension: 2.0,
        anisotropy: 1.0,
        spread: 1.0,
        density: 0.5,
      },
      uncertainty: {
        entropy: 1.0,
        margin: 0.5,
        calibration: 0.1,
      },
      performance: {
        accuracy: 0.8,
        loss: 0.2,
      },
      dynamics: {
        velocity: 0.5,
        acceleration: 0.1,
        accelerationBounds: [-1, 1],
        stability: 0.3,
        stabilityBounds: [0, 1],
        phase: 2,
      },
    });

    const features = extractFeatures(state);

    expect(features[13]).toBe(0.5); // velocity
    expect(features[14]).toBe(0.1); // acceleration
    expect(features[15]).toBe(0.3); // stability
    expect(features[16]).toBe(2); // phase
  });
});

describe('Seeded Random', () => {
  it('produces deterministic sequence', () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(42);

    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(123);

    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];

    expect(seq1).not.toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = createSeededRandom(42);

    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('ProjectionEngine', () => {
  let engine: ProjectionEngine;

  const createTestStates = (): ModelState[] => [
    createModelState({
      id: 'state-1',
      time: 0,
      geometry: { effectiveDimension: 2.0, anisotropy: 1.0, spread: 1.0, density: 0.5 },
      uncertainty: { entropy: 1.0, margin: 0.5, calibration: 0.1 },
      performance: { accuracy: 0.8, loss: 0.2 },
    }),
    createModelState({
      id: 'state-2',
      time: 1,
      geometry: { effectiveDimension: 4.0, anisotropy: 2.0, spread: 3.0, density: 0.7 },
      uncertainty: { entropy: 2.0, margin: 0.3, calibration: 0.15 },
      performance: { accuracy: 0.85, loss: 0.15 },
    }),
    createModelState({
      id: 'state-3',
      time: 2,
      geometry: { effectiveDimension: 6.0, anisotropy: 3.0, spread: 5.0, density: 0.9 },
      uncertainty: { entropy: 3.0, margin: 0.7, calibration: 0.05 },
      performance: { accuracy: 0.95, loss: 0.05 },
    }),
  ];

  beforeEach(() => {
    engine = new ProjectionEngine(DEFAULT_PCA_CONFIG);
  });

  describe('Fitting', () => {
    it('fit() returns metadata', () => {
      const states = createTestStates();
      const metadata = engine.fit(states);

      expect(metadata.method).toBe('pca');
      expect(metadata.components).toBe(2);
      expect(metadata.featureNames).toEqual(FEATURE_NAMES);
      expect(metadata.timestamp).toBeGreaterThan(0);
    });

    it('isFitted() returns correct state', () => {
      expect(engine.isFitted()).toBe(false);

      engine.fit(createTestStates());

      expect(engine.isFitted()).toBe(true);
    });

    it('reset() clears fitted state', () => {
      engine.fit(createTestStates());
      expect(engine.isFitted()).toBe(true);

      engine.reset();

      expect(engine.isFitted()).toBe(false);
    });
  });

  describe('Projection', () => {
    it('project() returns ProjectedState', () => {
      const states = createTestStates();
      engine.fit(states);

      const projected = engine.project(states[0]!);

      expect(projected.sourceId).toBe('state-1');
      expect(projected.time).toBe(0);
      expect(typeof projected.position.x).toBe('number');
      expect(typeof projected.position.y).toBe('number');
      expect(projected.projection.method).toBe('pca');
      expect(projected.source).toBe(states[0]);
    });

    it('projectBatch() projects all states', () => {
      const states = createTestStates();
      engine.fit(states);

      const projected = engine.projectBatch(states);

      expect(projected.length).toBe(3);
      expect(projected[0]!.sourceId).toBe('state-1');
      expect(projected[1]!.sourceId).toBe('state-2');
      expect(projected[2]!.sourceId).toBe('state-3');
    });

    it('projection preserves source reference', () => {
      const states = createTestStates();
      engine.fit(states);

      const projected = engine.project(states[1]!);

      expect(projected.source).toBe(states[1]);
      expect(projected.source.id).toBe('state-2');
    });
  });

  describe('Determinism', () => {
    it('same input produces same output', () => {
      const states = createTestStates();

      const engine1 = new ProjectionEngine(DEFAULT_PCA_CONFIG);
      const engine2 = new ProjectionEngine(DEFAULT_PCA_CONFIG);

      engine1.fit(states);
      engine2.fit(states);

      const projected1 = engine1.projectBatch(states);
      const projected2 = engine2.projectBatch(states);

      for (let i = 0; i < states.length; i++) {
        expect(projected1[i]!.position.x).toBeCloseTo(projected2[i]!.position.x);
        expect(projected1[i]!.position.y).toBeCloseTo(projected2[i]!.position.y);
      }
    });

    it('projection is consistent across calls', () => {
      const states = createTestStates();
      engine.fit(states);

      const first = engine.project(states[0]!);
      const second = engine.project(states[0]!);

      expect(first.position.x).toBe(second.position.x);
      expect(first.position.y).toBe(second.position.y);
    });
  });

  describe('Projection Metadata', () => {
    it('metadata includes explained variance for PCA', () => {
      const states = createTestStates();
      const metadata = engine.fit(states);

      expect(metadata.explainedVariance).toBeDefined();
      expect(metadata.explainedVariance).toBeGreaterThan(0);
      expect(metadata.explainedVariance).toBeLessThanOrEqual(1);
    });

    it('projected state includes metadata', () => {
      const states = createTestStates();
      engine.fit(states);

      const projected = engine.project(states[0]!);

      expect(projected.projection.method).toBe('pca');
      expect(projected.projection.components).toBe(2);
      expect(projected.projection.explainedVariance).toBeDefined();
    });

    it('getMetadata() returns null before fitting', () => {
      expect(engine.getMetadata()).toBeNull();
    });

    it('getMetadata() returns metadata after fitting', () => {
      engine.fit(createTestStates());

      const metadata = engine.getMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata!.method).toBe('pca');
    });
  });

  describe('Configuration', () => {
    it('getConfig() returns current config', () => {
      expect(engine.getConfig()).toEqual(DEFAULT_PCA_CONFIG);
    });

    it('setConfig() updates config and resets', () => {
      engine.fit(createTestStates());
      expect(engine.isFitted()).toBe(true);

      engine.setConfig({ ...DEFAULT_PCA_CONFIG, components: 3 });

      expect(engine.isFitted()).toBe(false);
      expect(engine.getConfig().components).toBe(3);
    });
  });

  describe('Custom Projection', () => {
    it('supports custom projection function', () => {
      const customEngine = new ProjectionEngine({
        method: 'custom',
        components: 2,
        project: (features) => [features[0]! * 10, features[1]! * 10],
        name: 'test-custom',
      });

      customEngine.fit(createTestStates());
      const state = createTestStates()[0]!;
      const projected = customEngine.project(state);

      expect(projected.projection.method).toBe('custom');
      expect(projected.position.x).toBe(state.geometry.effectiveDimension.value * 10);
      expect(projected.position.y).toBe(state.geometry.anisotropy.value * 10);
    });
  });
});
