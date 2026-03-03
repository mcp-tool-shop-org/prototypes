/**
 * VectorCaliper - State Schema Tests
 *
 * Tests that invariants are enforced at construction time.
 * Invalid states must never be created.
 */

import { describe, it, expect } from 'vitest';
import {
  boundedValue,
  normalizedValue,
  positiveValue,
  createGeometryState,
  createUncertaintyState,
  createPerformanceState,
  createDynamicsState,
  createModelState,
} from '../src/schema';

describe('Value Type Factories', () => {
  describe('boundedValue', () => {
    it('accepts value within bounds', () => {
      const v = boundedValue(5, 0, 10, 'units');
      expect(v.value).toBe(5);
      expect(v.min).toBe(0);
      expect(v.max).toBe(10);
    });

    it('accepts value at boundaries', () => {
      expect(() => boundedValue(0, 0, 10, 'units')).not.toThrow();
      expect(() => boundedValue(10, 0, 10, 'units')).not.toThrow();
    });

    it('rejects value below min', () => {
      expect(() => boundedValue(-1, 0, 10, 'units')).toThrow(RangeError);
    });

    it('rejects value above max', () => {
      expect(() => boundedValue(11, 0, 10, 'units')).toThrow(RangeError);
    });

    it('rejects invalid bounds (min > max)', () => {
      expect(() => boundedValue(5, 10, 0, 'units')).toThrow(RangeError);
    });
  });

  describe('normalizedValue', () => {
    it('accepts value in [0, 1]', () => {
      const v = normalizedValue(0.5, 'test');
      expect(v.value).toBe(0.5);
      expect(v.interpretation).toBe('test');
    });

    it('accepts boundary values', () => {
      expect(() => normalizedValue(0, 'zero')).not.toThrow();
      expect(() => normalizedValue(1, 'one')).not.toThrow();
    });

    it('rejects negative values', () => {
      expect(() => normalizedValue(-0.1, 'negative')).toThrow(RangeError);
    });

    it('rejects values > 1', () => {
      expect(() => normalizedValue(1.1, 'too high')).toThrow(RangeError);
    });
  });

  describe('positiveValue', () => {
    it('accepts positive values', () => {
      const v = positiveValue(42, 'count');
      expect(v.value).toBe(42);
      expect(v.unit).toBe('count');
    });

    it('accepts zero', () => {
      expect(() => positiveValue(0, 'units')).not.toThrow();
    });

    it('rejects negative values', () => {
      expect(() => positiveValue(-1, 'units')).toThrow(RangeError);
    });

    it('rejects Infinity', () => {
      expect(() => positiveValue(Infinity, 'units')).toThrow(RangeError);
    });

    it('rejects NaN', () => {
      expect(() => positiveValue(NaN, 'units')).toThrow(RangeError);
    });
  });
});

describe('State Group Factories', () => {
  describe('createGeometryState', () => {
    it('creates valid geometry state', () => {
      const geo = createGeometryState({
        effectiveDimension: 2.5,
        anisotropy: 3.2,
        spread: 1.0,
        density: 0.8,
      });

      expect(geo.effectiveDimension.value).toBe(2.5);
      expect(geo.anisotropy.value).toBe(3.2);
      expect(geo.spread.value).toBe(1.0);
      expect(geo.density.value).toBe(0.8);
    });

    it('rejects negative effective dimension', () => {
      expect(() =>
        createGeometryState({
          effectiveDimension: -1,
          anisotropy: 1,
          spread: 1,
          density: 1,
        })
      ).toThrow(RangeError);
    });
  });

  describe('createUncertaintyState', () => {
    it('creates valid uncertainty state', () => {
      const unc = createUncertaintyState({
        entropy: 1.5,
        margin: 0.3,
        calibration: 0.05,
      });

      expect(unc.entropy.value).toBe(1.5);
      expect(unc.margin.value).toBe(0.3);
      expect(unc.calibration.value).toBe(0.05);
      expect(unc.epistemic).toBeNull();
      expect(unc.aleatoric).toBeNull();
    });

    it('handles optional epistemic/aleatoric', () => {
      const unc = createUncertaintyState({
        entropy: 1.0,
        margin: 0.5,
        calibration: 0.1,
        epistemic: 0.2,
        aleatoric: 0.3,
      });

      expect(unc.epistemic?.value).toBe(0.2);
      expect(unc.aleatoric?.value).toBe(0.3);
    });

    it('rejects margin > 1', () => {
      expect(() =>
        createUncertaintyState({
          entropy: 1.0,
          margin: 1.5,
          calibration: 0.1,
        })
      ).toThrow(RangeError);
    });
  });

  describe('createPerformanceState', () => {
    it('creates valid performance state', () => {
      const perf = createPerformanceState({
        accuracy: 0.95,
        loss: 0.05,
      });

      expect(perf.accuracy.value).toBe(0.95);
      expect(perf.loss.value).toBe(0.05);
      expect(perf.taskScore).toBeNull();
      expect(perf.cost).toBeNull();
    });

    it('rejects accuracy > 1', () => {
      expect(() =>
        createPerformanceState({
          accuracy: 1.1,
          loss: 0.1,
        })
      ).toThrow(RangeError);
    });

    it('rejects negative loss', () => {
      expect(() =>
        createPerformanceState({
          accuracy: 0.9,
          loss: -0.1,
        })
      ).toThrow(RangeError);
    });
  });
});

describe('createModelState', () => {
  const validParams = {
    time: 0,
    geometry: {
      effectiveDimension: 2.0,
      anisotropy: 1.5,
      spread: 1.0,
      density: 0.5,
    },
    uncertainty: {
      entropy: 1.0,
      margin: 0.3,
      calibration: 0.05,
    },
    performance: {
      accuracy: 0.9,
      loss: 0.1,
    },
  };

  it('creates valid model state', () => {
    const state = createModelState(validParams);

    expect(state.id).toMatch(/^state-\d+$/);
    expect(state.time.value).toBe(0);
    expect(state.geometry.effectiveDimension.value).toBe(2.0);
    expect(state.uncertainty.entropy.value).toBe(1.0);
    expect(state.performance.accuracy.value).toBe(0.9);
    expect(state.dynamics).toBeNull();
  });

  it('accepts custom id', () => {
    const state = createModelState({
      ...validParams,
      id: 'custom-id',
    });

    expect(state.id).toBe('custom-id');
  });

  it('includes metadata when provided', () => {
    const state = createModelState({
      ...validParams,
      metadata: {
        source: 'test',
        version: '1.0.0',
        tags: ['test', 'example'],
      },
    });

    expect(state.metadata?.source).toBe('test');
    expect(state.metadata?.version).toBe('1.0.0');
    expect(state.metadata?.tags).toEqual(['test', 'example']);
  });

  it('rejects negative time', () => {
    expect(() =>
      createModelState({
        ...validParams,
        time: -1,
      })
    ).toThrow(RangeError);
  });

  it('propagates invariant violations from nested states', () => {
    expect(() =>
      createModelState({
        ...validParams,
        uncertainty: {
          entropy: 1.0,
          margin: 1.5, // Invalid: > 1
          calibration: 0.05,
        },
      })
    ).toThrow(RangeError);
  });
});
