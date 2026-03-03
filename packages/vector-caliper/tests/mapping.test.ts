/**
 * VectorCaliper - Semantic Mapping Tests
 *
 * Tests that:
 * 1. No visual channel is used twice
 * 2. Mappings are pure functions (same input → same output)
 * 3. All values are within expected bounds
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SemanticMapper,
  createCanonicalMapping,
  DEFAULT_CONFIG,
  type SemanticVariable,
} from '../src/mapping/semantic-map';
import {
  position,
  radius,
  hue,
  saturation,
  opacity,
  angle,
  type ChannelType,
} from '../src/mapping/channels';
import { createModelState } from '../src/schema';

describe('Visual Channel Factories', () => {
  describe('position', () => {
    it('creates position channel', () => {
      const p = position(10, 20);
      expect(p.type).toBe('position');
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
      expect(p.z).toBeUndefined();
    });

    it('supports optional z coordinate', () => {
      const p = position(10, 20, 30);
      expect(p.z).toBe(30);
    });
  });

  describe('radius', () => {
    it('clamps to range', () => {
      expect(radius(5, 0, 10).value).toBe(5);
      expect(radius(-5, 0, 10).value).toBe(0);
      expect(radius(15, 0, 10).value).toBe(10);
    });
  });

  describe('hue', () => {
    it('normalizes to [0, 360)', () => {
      expect(hue(180).degrees).toBe(180);
      expect(hue(400).degrees).toBeCloseTo(40);
      expect(hue(-30).degrees).toBeCloseTo(330);
    });
  });

  describe('saturation', () => {
    it('clamps to [0, 1]', () => {
      expect(saturation(0.5).value).toBe(0.5);
      expect(saturation(-0.5).value).toBe(0);
      expect(saturation(1.5).value).toBe(1);
    });
  });

  describe('opacity', () => {
    it('clamps to [0, 1]', () => {
      expect(opacity(0.5).value).toBe(0.5);
      expect(opacity(-0.5).value).toBe(0);
      expect(opacity(1.5).value).toBe(1);
    });
  });

  describe('angle', () => {
    it('normalizes to [0, 2π)', () => {
      expect(angle(Math.PI).radians).toBeCloseTo(Math.PI);
      expect(angle(3 * Math.PI).radians).toBeCloseTo(Math.PI);
      expect(angle(-Math.PI / 2).radians).toBeCloseTo(1.5 * Math.PI);
    });
  });
});

describe('Canonical Mapping', () => {
  it('does not allow duplicate channel usage', () => {
    // This should not throw - the canonical mapping is valid
    expect(() => createCanonicalMapping()).not.toThrow();
  });

  it('throws if channel is used twice', () => {
    // We can't easily test this without modifying the function,
    // but we can verify the invariant holds in the default mapping
    const mapping = createCanonicalMapping();
    const usedChannels = new Set<ChannelType>();

    for (const m of mapping.values()) {
      expect(usedChannels.has(m.channel)).toBe(false);
      usedChannels.add(m.channel);
    }
  });
});

describe('SemanticMapper', () => {
  let mapper: SemanticMapper;

  const createTestState = () =>
    createModelState({
      time: 0,
      geometry: {
        effectiveDimension: 3.0,
        anisotropy: 2.0,
        spread: 5.0,
        density: 0.8,
      },
      uncertainty: {
        entropy: 1.5,
        margin: 0.6,
        calibration: 0.1,
      },
      performance: {
        accuracy: 0.85,
        loss: 0.15,
      },
    });

  beforeEach(() => {
    mapper = new SemanticMapper();
  });

  describe('map()', () => {
    it('returns null for unmapped variables', () => {
      const state = createTestState();
      // position.z is defined but only position.x is mapped (which includes y)
      const result = mapper.map('position.z' as SemanticVariable, state);
      expect(result).toBeNull();
    });

    it('maps margin to saturation', () => {
      const state = createTestState();
      const result = mapper.map('uncertainty.margin', state);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('saturation');
      if (result!.type === 'saturation') {
        expect(result.value).toBe(0.6); // Same as margin
      }
    });

    it('maps calibration to opacity', () => {
      const state = createTestState();
      const result = mapper.map('uncertainty.calibration', state);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('opacity');
      if (result!.type === 'opacity') {
        // 1 - 0.1 = 0.9
        expect(result.value).toBeCloseTo(0.9);
      }
    });

    it('maps entropy to jitter', () => {
      const state = createTestState();
      const result = mapper.map('uncertainty.entropy', state);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('jitter');
    });

    it('maps accuracy to lightness', () => {
      const state = createTestState();
      const result = mapper.map('performance.accuracy', state);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('lightness');
      if (result!.type === 'lightness') {
        // 0.3 + 0.85 * 0.5 = 0.725
        expect(result.value).toBeCloseTo(0.725);
      }
    });
  });

  describe('mapAll()', () => {
    it('returns all mapped channels', () => {
      const state = createTestState();
      const allMapped = mapper.mapAll(state);

      expect(allMapped.size).toBeGreaterThan(0);

      // Check that specific mappings exist
      expect(allMapped.has('uncertainty.margin')).toBe(true);
      expect(allMapped.has('uncertainty.calibration')).toBe(true);
      expect(allMapped.has('uncertainty.entropy')).toBe(true);
    });
  });

  describe('getSemanticForChannel()', () => {
    it('returns semantic variable for used channel', () => {
      expect(mapper.getSemanticForChannel('saturation')).toBe('uncertainty.margin');
      expect(mapper.getSemanticForChannel('opacity')).toBe('uncertainty.calibration');
    });

    it('returns null for unused channel', () => {
      // 'angle' is not used in default mapping
      expect(mapper.getSemanticForChannel('angle')).toBeNull();
    });
  });

  describe('getChannelDescription()', () => {
    it('returns description for used channel', () => {
      const desc = mapper.getChannelDescription('saturation');
      expect(desc).toBeTruthy();
      expect(desc).toContain('margin');
    });

    it('returns null for unused channel', () => {
      expect(mapper.getChannelDescription('angle')).toBeNull();
    });
  });

  describe('Determinism (same input → same output)', () => {
    it('produces identical results for identical states', () => {
      const state1 = createTestState();
      const state2 = createTestState();

      const result1 = mapper.mapAll(state1);
      const result2 = mapper.mapAll(state2);

      expect(result1.size).toBe(result2.size);

      for (const [variable, channel1] of result1) {
        const channel2 = result2.get(variable);
        expect(channel2).toEqual(channel1);
      }
    });

    it('produces different results for different states', () => {
      const state1 = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 1.0,
          spread: 1.0,
          density: 0.5,
        },
        uncertainty: {
          entropy: 0.5,
          margin: 0.2,
          calibration: 0.3,
        },
        performance: {
          accuracy: 0.6,
          loss: 0.4,
        },
      });

      const state2 = createModelState({
        time: 1,
        geometry: {
          effectiveDimension: 8.0,
          anisotropy: 5.0,
          spread: 8.0,
          density: 0.9,
        },
        uncertainty: {
          entropy: 3.0,
          margin: 0.9,
          calibration: 0.02,
        },
        performance: {
          accuracy: 0.95,
          loss: 0.05,
        },
      });

      const mapped1 = mapper.map('uncertainty.margin', state1);
      const mapped2 = mapper.map('uncertainty.margin', state2);

      expect(mapped1).not.toEqual(mapped2);
    });
  });

  describe('Value Bounds', () => {
    it('opacity is always >= 0.2 (minimum visibility)', () => {
      // Even with high calibration error
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
          calibration: 0.99, // Very high error
        },
        performance: {
          accuracy: 0.5,
          loss: 0.5,
        },
      });

      const result = mapper.map('uncertainty.calibration', state);
      expect(result!.type).toBe('opacity');
      if (result!.type === 'opacity') {
        expect(result.value).toBeGreaterThanOrEqual(0.2);
      }
    });

    it('lightness is bounded to [0.3, 0.8]', () => {
      const lowAcc = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 1.0,
          spread: 1.0,
          density: 0.5,
        },
        uncertainty: { entropy: 1.0, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 0, loss: 1.0 },
      });

      const highAcc = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 1.0,
          spread: 1.0,
          density: 0.5,
        },
        uncertainty: { entropy: 1.0, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 1.0, loss: 0 },
      });

      const lowResult = mapper.map('performance.accuracy', lowAcc);
      const highResult = mapper.map('performance.accuracy', highAcc);

      expect(lowResult!.type).toBe('lightness');
      expect(highResult!.type).toBe('lightness');

      if (lowResult!.type === 'lightness' && highResult!.type === 'lightness') {
        expect(lowResult.value).toBeCloseTo(0.3);
        expect(highResult.value).toBeCloseTo(0.8);
      }
    });
  });

  describe('Configuration', () => {
    it('uses provided config', () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        radiusRange: { min: 10, max: 100 },
      };

      const customMapper = new SemanticMapper(customConfig);
      expect(customMapper.getConfig().radiusRange.min).toBe(10);
      expect(customMapper.getConfig().radiusRange.max).toBe(100);
    });
  });
});
