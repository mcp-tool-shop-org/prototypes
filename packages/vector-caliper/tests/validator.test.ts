/**
 * VectorCaliper - State Validator Tests
 *
 * Tests for hard invariant checks and soft warnings.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateValidator, ValidationError } from '../src/validation';
import { createModelState } from '../src/schema';
import type { ModelState, StateTrajectory } from '../src/types/state';

describe('StateValidator', () => {
  let validator: StateValidator;

  beforeEach(() => {
    validator = new StateValidator();
  });

  // Helper to create valid state
  const createValidState = (overrides: Partial<Parameters<typeof createModelState>[0]> = {}) =>
    createModelState({
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
      ...overrides,
    });

  describe('Hard Invariant Checks', () => {
    it('validates correct state without throwing', () => {
      const state = createValidState();
      expect(() => validator.validate(state)).not.toThrow();
    });

    it('returns valid result for correct state', () => {
      const state = createValidState();
      const result = validator.validate(state);
      expect(result.valid).toBe(true);
      expect(result.checkedAt).toBeGreaterThan(0);
    });

    it('rejects state with empty id', () => {
      const state = createValidState({ id: '' });
      // Empty id causes factory to generate one, so we need to manually create
      const badState: ModelState = {
        ...createValidState(),
        id: '',
      };

      expect(() => validator.validate(badState)).toThrow(ValidationError);
    });

    it('rejects state with whitespace-only id', () => {
      const badState: ModelState = {
        ...createValidState(),
        id: '   ',
      };

      expect(() => validator.validate(badState)).toThrow(ValidationError);
    });
  });

  describe('isValid helper', () => {
    it('returns true for valid state', () => {
      const state = createValidState();
      expect(validator.isValid(state)).toBe(true);
    });

    it('returns false for invalid state', () => {
      const badState: ModelState = {
        ...createValidState(),
        id: '',
      };
      expect(validator.isValid(badState)).toBe(false);
    });
  });

  describe('assertValid', () => {
    it('does not throw for valid state', () => {
      const state = createValidState();
      expect(() => validator.assertValid(state)).not.toThrow();
    });

    it('throws for invalid state', () => {
      const badState: ModelState = {
        ...createValidState(),
        id: '',
      };
      expect(() => validator.assertValid(badState)).toThrow(ValidationError);
    });
  });

  describe('Soft Warnings', () => {
    it('warns on zero spread (collapsed representation)', () => {
      const state = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 1.5,
          spread: 0, // Zero spread
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
      });

      const result = validator.validate(state);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.path === 'geometry.spread')).toBe(true);
    });

    it('warns on very high anisotropy', () => {
      const state = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 150, // Very high
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
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'geometry.anisotropy')).toBe(true);
      expect(result.warnings.find((w) => w.path === 'geometry.anisotropy')?.severity).toBe('high');
    });

    it('warns on zero entropy', () => {
      const state = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 2.0,
          anisotropy: 1.5,
          spread: 1.0,
          density: 0.5,
        },
        uncertainty: {
          entropy: 0, // Zero entropy
          margin: 0.3,
          calibration: 0.05,
        },
        performance: {
          accuracy: 0.9,
          loss: 0.1,
        },
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'uncertainty.entropy')).toBe(true);
    });

    it('warns on high calibration error', () => {
      const state = createModelState({
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
          calibration: 0.3, // High calibration error
        },
        performance: {
          accuracy: 0.9,
          loss: 0.1,
        },
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'uncertainty.calibration')).toBe(true);
    });

    it('warns on perfect accuracy', () => {
      const state = createModelState({
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
          accuracy: 1.0, // Perfect
          loss: 0.1,
        },
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'performance.accuracy')).toBe(true);
    });

    it('warns on zero loss', () => {
      const state = createModelState({
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
          loss: 0, // Zero loss
        },
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'performance.loss')).toBe(true);
    });

    it('warns on effective dimension < 1', () => {
      const state = createModelState({
        time: 0,
        geometry: {
          effectiveDimension: 0.5, // Degenerate
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
      });

      const result = validator.validate(state);
      expect(result.warnings.some((w) => w.path === 'geometry.effectiveDimension')).toBe(true);
    });
  });

  describe('Trajectory Validation', () => {
    it('validates correct trajectory', () => {
      const trajectory: StateTrajectory = {
        id: 'test-trajectory',
        states: [
          createValidState({ id: 'state-1', time: 0 }),
          createValidState({ id: 'state-2', time: 1 }),
          createValidState({ id: 'state-3', time: 2 }),
        ],
        timeRange: { start: 0, end: 2 },
      };

      const result = validator.validateTrajectory(trajectory);
      expect(result.valid).toBe(true);
    });

    it('rejects empty trajectory', () => {
      const trajectory: StateTrajectory = {
        id: 'empty-trajectory',
        states: [],
        timeRange: { start: 0, end: 0 },
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('rejects trajectory with duplicate state IDs', () => {
      const trajectory: StateTrajectory = {
        id: 'dup-trajectory',
        states: [
          createValidState({ id: 'same-id', time: 0 }),
          createValidState({ id: 'same-id', time: 1 }), // Duplicate
        ],
        timeRange: { start: 0, end: 1 },
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('rejects trajectory with non-monotonic time', () => {
      const trajectory: StateTrajectory = {
        id: 'bad-time-trajectory',
        states: [
          createValidState({ id: 'state-1', time: 0 }),
          createValidState({ id: 'state-2', time: 2 }),
          createValidState({ id: 'state-3', time: 1 }), // Goes backwards
        ],
        timeRange: { start: 0, end: 1 },
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('rejects trajectory with equal consecutive times', () => {
      const trajectory: StateTrajectory = {
        id: 'equal-time-trajectory',
        states: [
          createValidState({ id: 'state-1', time: 0 }),
          createValidState({ id: 'state-2', time: 1 }),
          createValidState({ id: 'state-3', time: 1 }), // Same as previous
        ],
        timeRange: { start: 0, end: 1 },
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('rejects trajectory with mismatched timeRange.start', () => {
      const trajectory: StateTrajectory = {
        id: 'bad-start-trajectory',
        states: [
          createValidState({ id: 'state-1', time: 1 }),
          createValidState({ id: 'state-2', time: 2 }),
        ],
        timeRange: { start: 0, end: 2 }, // start doesn't match first state
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('rejects trajectory with mismatched timeRange.end', () => {
      const trajectory: StateTrajectory = {
        id: 'bad-end-trajectory',
        states: [
          createValidState({ id: 'state-1', time: 0 }),
          createValidState({ id: 'state-2', time: 1 }),
        ],
        timeRange: { start: 0, end: 5 }, // end doesn't match last state
      };

      expect(() => validator.validateTrajectory(trajectory)).toThrow(ValidationError);
    });

    it('aggregates warnings from all states in trajectory', () => {
      const trajectory: StateTrajectory = {
        id: 'warning-trajectory',
        states: [
          createModelState({
            id: 'state-1',
            time: 0,
            geometry: {
              effectiveDimension: 2.0,
              anisotropy: 1.5,
              spread: 0, // Warning
              density: 0.5,
            },
            uncertainty: { entropy: 1.0, margin: 0.3, calibration: 0.05 },
            performance: { accuracy: 0.9, loss: 0.1 },
          }),
          createModelState({
            id: 'state-2',
            time: 1,
            geometry: {
              effectiveDimension: 2.0,
              anisotropy: 1.5,
              spread: 1.0,
              density: 0.5,
            },
            uncertainty: { entropy: 0, margin: 0.3, calibration: 0.05 }, // Warning
            performance: { accuracy: 0.9, loss: 0.1 },
          }),
        ],
        timeRange: { start: 0, end: 1 },
      };

      const result = validator.validateTrajectory(trajectory);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.warnings.some((w) => w.path.includes('states[0]'))).toBe(true);
      expect(result.warnings.some((w) => w.path.includes('states[1]'))).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('includes path and value in error', () => {
      const badState: ModelState = {
        ...createValidState(),
        id: '',
      };

      try {
        validator.validate(badState);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        const ve = e as ValidationError;
        expect(ve.path).toBe('id');
        expect(ve.value).toBe('');
      }
    });
  });
});
