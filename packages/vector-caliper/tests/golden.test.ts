/**
 * VectorCaliper - Golden State & Visual Regression Tests
 *
 * These tests verify visual invariants against canonical states.
 * They catch semantic drift without requiring pixel-perfect comparison.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GOLDEN_STATES,
  GOLDEN_STATE_HIGH_CONFIDENCE,
  GOLDEN_STATE_HIGH_UNCERTAINTY,
  GOLDEN_STATE_COLLAPSED,
  GOLDEN_STATE_TRAINING,
  GOLDEN_STATE_MINIMAL,
  getGoldenState,
  getGoldenStateIds,
  runVisualTest,
  runAllVisualTests,
  runComparativeTests,
  generateTestReport,
  extractVisuals,
} from '../src/testing';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { SceneBuilder } from '../src/scene';
import { validator } from '../src/validation';

describe('Golden States', () => {
  describe('State Definitions', () => {
    it('all golden states are valid', () => {
      for (const golden of GOLDEN_STATES) {
        expect(() => validator.validate(golden.state)).not.toThrow();
      }
    });

    it('all golden states have unique IDs', () => {
      const ids = GOLDEN_STATES.map((gs) => gs.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all golden states have descriptions', () => {
      for (const golden of GOLDEN_STATES) {
        expect(golden.description.length).toBeGreaterThan(0);
      }
    });

    it('all golden states have expected properties', () => {
      for (const golden of GOLDEN_STATES) {
        expect(golden.expected.hueRange).toBeDefined();
        expect(golden.expected.saturationRange).toBeDefined();
        expect(golden.expected.lightnessRange).toBeDefined();
        expect(golden.expected.opacityRange).toBeDefined();
        expect(golden.expected.radiusLevel).toBeDefined();
        expect(typeof golden.expected.hasJitter).toBe('boolean');
      }
    });
  });

  describe('State Lookup', () => {
    it('getGoldenState returns state by ID', () => {
      const state = getGoldenState('high-confidence');
      expect(state).toBeDefined();
      expect(state!.id).toBe('high-confidence');
    });

    it('getGoldenState returns undefined for unknown ID', () => {
      expect(getGoldenState('nonexistent')).toBeUndefined();
    });

    it('getGoldenStateIds returns all IDs', () => {
      const ids = getGoldenStateIds();
      expect(ids.length).toBe(GOLDEN_STATES.length);
      expect(ids).toContain('high-confidence');
      expect(ids).toContain('high-uncertainty');
    });
  });

  describe('Validation Warnings', () => {
    it('COLLAPSED state triggers expected warnings', () => {
      const result = validator.validate(GOLDEN_STATE_COLLAPSED.state);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check for specific warnings
      const warningPaths = result.warnings.map((w) => w.path);
      expect(warningPaths).toContain('geometry.spread');
      expect(warningPaths).toContain('performance.accuracy');
    });

    it('HIGH_CONFIDENCE state has minimal warnings', () => {
      const result = validator.validate(GOLDEN_STATE_HIGH_CONFIDENCE.state);
      expect(result.valid).toBe(true);
      // High confidence state should have few or no warnings
      expect(result.warnings.length).toBeLessThan(3);
    });
  });
});

describe('Visual Assertions', () => {
  let mapper: SemanticMapper;
  let projector: ProjectionEngine;

  beforeEach(() => {
    mapper = new SemanticMapper();
    projector = new ProjectionEngine();
  });

  describe('extractVisuals', () => {
    it('extracts visual properties from point node', () => {
      const golden = GOLDEN_STATE_HIGH_CONFIDENCE;
      projector.fit([golden.state]);
      const projected = projector.project(golden.state);

      const builder = new SceneBuilder(mapper);
      const node = builder.addState(golden.state, projected);

      const visuals = extractVisuals(node);

      expect(typeof visuals.hue).toBe('number');
      expect(typeof visuals.saturation).toBe('number');
      expect(typeof visuals.lightness).toBe('number');
      expect(typeof visuals.opacity).toBe('number');
      expect(typeof visuals.radius).toBe('number');
      expect(typeof visuals.hasJitter).toBe('boolean');
    });
  });

  describe('runVisualTest', () => {
    it('HIGH_CONFIDENCE passes visual test', () => {
      const result = runVisualTest(
        GOLDEN_STATE_HIGH_CONFIDENCE,
        mapper,
        projector
      );

      expect(result.goldenStateId).toBe('high-confidence');
      expect(result.passed).toBe(true);
    });

    it('HIGH_UNCERTAINTY passes visual test', () => {
      const result = runVisualTest(
        GOLDEN_STATE_HIGH_UNCERTAINTY,
        mapper,
        projector
      );

      expect(result.goldenStateId).toBe('high-uncertainty');
      expect(result.passed).toBe(true);
    });

    it('TRAINING passes visual test', () => {
      const result = runVisualTest(GOLDEN_STATE_TRAINING, mapper, projector);

      expect(result.goldenStateId).toBe('training');
      expect(result.passed).toBe(true);
    });

    it('MINIMAL passes visual test', () => {
      const result = runVisualTest(GOLDEN_STATE_MINIMAL, mapper, projector);

      expect(result.goldenStateId).toBe('minimal');
      expect(result.passed).toBe(true);
    });

    it('returns assertion details', () => {
      const result = runVisualTest(
        GOLDEN_STATE_HIGH_CONFIDENCE,
        mapper,
        projector
      );

      expect(result.assertions.length).toBeGreaterThan(0);

      for (const assertion of result.assertions) {
        expect(assertion.name).toBeDefined();
        expect(assertion.message).toBeDefined();
        expect(typeof assertion.passed).toBe('boolean');
      }
    });

    it('includes validation warnings', () => {
      const result = runVisualTest(GOLDEN_STATE_COLLAPSED, mapper, projector);

      // Collapsed state should have warnings
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('runAllVisualTests', () => {
    it('runs tests against all golden states', () => {
      const results = runAllVisualTests(GOLDEN_STATES, mapper, projector);

      expect(results.length).toBe(GOLDEN_STATES.length);

      for (const result of results) {
        expect(result.goldenStateId).toBeDefined();
        expect(typeof result.passed).toBe('boolean');
      }
    });

    it('all golden states pass visual tests', () => {
      const results = runAllVisualTests(GOLDEN_STATES, mapper, projector);

      for (const result of results) {
        if (!result.passed) {
          console.log(`FAILED: ${result.goldenStateId}`);
          for (const assertion of result.assertions) {
            if (!assertion.passed) {
              console.log(`  - ${assertion.message}`);
            }
          }
        }
        expect(result.passed).toBe(true);
      }
    });
  });

  describe('Comparative Tests', () => {
    it('high confidence is more saturated than high uncertainty', () => {
      const results = runComparativeTests(GOLDEN_STATES, mapper, projector);

      const saturationTest = results.find((r) =>
        r.name.includes('saturated')
      );

      expect(saturationTest).toBeDefined();
      expect(saturationTest!.passed).toBe(true);
    });

    it('high confidence is brighter than high uncertainty', () => {
      const results = runComparativeTests(GOLDEN_STATES, mapper, projector);

      const brightnessTest = results.find((r) => r.name.includes('brighter'));

      expect(brightnessTest).toBeDefined();
      expect(brightnessTest!.passed).toBe(true);
    });

    it('high confidence is more opaque than high uncertainty', () => {
      const results = runComparativeTests(GOLDEN_STATES, mapper, projector);

      const opacityTest = results.find((r) => r.name.includes('opaque'));

      expect(opacityTest).toBeDefined();
      expect(opacityTest!.passed).toBe(true);
    });
  });

  describe('Test Report', () => {
    it('generates human-readable report', () => {
      const results = runAllVisualTests(GOLDEN_STATES, mapper, projector);
      const report = generateTestReport(results);

      expect(report).toContain('VectorCaliper');
      expect(report).toContain('high-confidence');
      expect(report).toContain('passed');
    });

    it('report includes pass/fail counts', () => {
      const results = runAllVisualTests(GOLDEN_STATES, mapper, projector);
      const report = generateTestReport(results);

      expect(report).toContain('Total:');
      expect(report).toContain('passed');
    });
  });
});

describe('Visual Invariants', () => {
  let mapper: SemanticMapper;
  let projector: ProjectionEngine;

  beforeEach(() => {
    mapper = new SemanticMapper();
    projector = new ProjectionEngine();
  });

  it('higher entropy produces more jitter', () => {
    const lowEntropyState = GOLDEN_STATE_HIGH_CONFIDENCE;
    const highEntropyState = GOLDEN_STATE_HIGH_UNCERTAINTY;

    projector.fit([lowEntropyState.state]);
    const lowProjected = projector.project(lowEntropyState.state);

    projector.reset();
    projector.fit([highEntropyState.state]);
    const highProjected = projector.project(highEntropyState.state);

    const lowBuilder = new SceneBuilder(mapper);
    const lowNode = lowBuilder.addState(lowEntropyState.state, lowProjected);

    const highBuilder = new SceneBuilder(mapper);
    const highNode = highBuilder.addState(highEntropyState.state, highProjected);

    const lowVisuals = extractVisuals(lowNode);
    const highVisuals = extractVisuals(highNode);

    expect(highVisuals.jitterAmplitude).toBeGreaterThan(lowVisuals.jitterAmplitude);
  });

  it('higher accuracy produces brighter output', () => {
    const highAccState = GOLDEN_STATE_HIGH_CONFIDENCE;
    const lowAccState = GOLDEN_STATE_HIGH_UNCERTAINTY;

    projector.fit([highAccState.state]);
    const highProjected = projector.project(highAccState.state);

    projector.reset();
    projector.fit([lowAccState.state]);
    const lowProjected = projector.project(lowAccState.state);

    const highBuilder = new SceneBuilder(mapper);
    const highNode = highBuilder.addState(highAccState.state, highProjected);

    const lowBuilder = new SceneBuilder(mapper);
    const lowNode = lowBuilder.addState(lowAccState.state, lowProjected);

    const highVisuals = extractVisuals(highNode);
    const lowVisuals = extractVisuals(lowNode);

    expect(highVisuals.lightness).toBeGreaterThan(lowVisuals.lightness);
  });

  it('higher margin produces more saturation', () => {
    const highMarginState = GOLDEN_STATE_HIGH_CONFIDENCE;
    const lowMarginState = GOLDEN_STATE_HIGH_UNCERTAINTY;

    projector.fit([highMarginState.state]);
    const highProjected = projector.project(highMarginState.state);

    projector.reset();
    projector.fit([lowMarginState.state]);
    const lowProjected = projector.project(lowMarginState.state);

    const highBuilder = new SceneBuilder(mapper);
    const highNode = highBuilder.addState(highMarginState.state, highProjected);

    const lowBuilder = new SceneBuilder(mapper);
    const lowNode = lowBuilder.addState(lowMarginState.state, lowProjected);

    const highVisuals = extractVisuals(highNode);
    const lowVisuals = extractVisuals(lowNode);

    expect(highVisuals.saturation).toBeGreaterThan(lowVisuals.saturation);
  });

  it('identical states produce identical visuals', () => {
    const state = GOLDEN_STATE_HIGH_CONFIDENCE;

    // First render
    projector.fit([state.state]);
    const projected1 = projector.project(state.state);
    const builder1 = new SceneBuilder(mapper);
    const node1 = builder1.addState(state.state, projected1);
    const visuals1 = extractVisuals(node1);

    // Second render (should be identical)
    projector.reset();
    projector.fit([state.state]);
    const projected2 = projector.project(state.state);
    const builder2 = new SceneBuilder(mapper);
    const node2 = builder2.addState(state.state, projected2);
    const visuals2 = extractVisuals(node2);

    expect(visuals1.hue).toBe(visuals2.hue);
    expect(visuals1.saturation).toBe(visuals2.saturation);
    expect(visuals1.lightness).toBe(visuals2.lightness);
    expect(visuals1.opacity).toBe(visuals2.opacity);
    expect(visuals1.radius).toBe(visuals2.radius);
  });
});
