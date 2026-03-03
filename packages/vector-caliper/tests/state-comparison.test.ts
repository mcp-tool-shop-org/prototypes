/**
 * VectorCaliper - State Comparison Tests
 *
 * Verifies:
 * 1. Diff output is symmetric (A-B shows inverse of B-A)
 * 2. No prescription ("X is better"), only description
 * 3. All formatting is neutral
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  compareStates,
  invertComparison,
  verifySymmetry,
  formatDiffValue,
  formatDirection,
  directionSymbol,
  generateComparisonHTML,
  generateComparisonText,
  type StateComparison,
  type VariableDiff,
} from '../src/interactive/state-comparison';
import { createModelState } from '../src/schema';
import type { ModelState } from '../src/types/state';

describe('State Comparison', () => {
  let stateA: ModelState;
  let stateB: ModelState;

  beforeEach(() => {
    stateA = createModelState({
      id: 'state-a',
      time: 10,
      geometry: {
        effectiveDimension: 2.0,
        anisotropy: 1.5,
        spread: 4.0,
        density: 0.6,
      },
      uncertainty: {
        entropy: 1.0,
        margin: 0.7,
        calibration: 0.05,
      },
      performance: {
        accuracy: 0.8,
        loss: 0.2,
      },
    });

    stateB = createModelState({
      id: 'state-b',
      time: 20,
      geometry: {
        effectiveDimension: 3.0, // +1.0
        anisotropy: 1.2, // -0.3
        spread: 4.0, // unchanged
        density: 0.8, // +0.2
      },
      uncertainty: {
        entropy: 1.5, // +0.5
        margin: 0.6, // -0.1
        calibration: 0.08, // +0.03
      },
      performance: {
        accuracy: 0.85, // +0.05
        loss: 0.15, // -0.05
      },
    });
  });

  describe('compareStates', () => {
    it('produces comparison with correct state IDs', () => {
      const comparison = compareStates(stateA, stateB);

      expect(comparison.stateAId).toBe('state-a');
      expect(comparison.stateBId).toBe('state-b');
    });

    it('calculates correct time difference', () => {
      const comparison = compareStates(stateA, stateB);

      expect(comparison.timeA).toBe(10);
      expect(comparison.timeB).toBe(20);
      expect(comparison.timeDiff).toBe(10);
    });

    it('detects increases correctly', () => {
      const comparison = compareStates(stateA, stateB);

      // Effective dimension increased from 2.0 to 3.0
      const dimDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      );

      expect(dimDiff).toBeDefined();
      expect(dimDiff!.direction).toBe('increase');
      expect(dimDiff!.difference).toBe(1.0);
    });

    it('detects decreases correctly', () => {
      const comparison = compareStates(stateA, stateB);

      // Anisotropy decreased from 1.5 to 1.2
      const aniDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.anisotropy'
      );

      expect(aniDiff).toBeDefined();
      expect(aniDiff!.direction).toBe('decrease');
      expect(aniDiff!.difference).toBeCloseTo(-0.3, 5);
    });

    it('detects unchanged correctly', () => {
      const comparison = compareStates(stateA, stateB);

      // Spread is unchanged at 4.0
      const spreadDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.spread'
      );

      expect(spreadDiff).toBeDefined();
      expect(spreadDiff!.direction).toBe('unchanged');
      expect(spreadDiff!.difference).toBe(0);
    });

    it('calculates percent change correctly', () => {
      const comparison = compareStates(stateA, stateB);

      // Effective dimension: 2.0 -> 3.0 = +50%
      const dimDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      );

      expect(dimDiff!.percentChange).toBeCloseTo(50, 1);
    });

    it('groups by category', () => {
      const comparison = compareStates(stateA, stateB);

      const categoryNames = comparison.categories.map((c) => c.category);

      expect(categoryNames).toContain('geometry');
      expect(categoryNames).toContain('uncertainty');
      expect(categoryNames).toContain('performance');
    });

    it('computes summary correctly', () => {
      const comparison = compareStates(stateA, stateB);

      // Count actual changes
      const increases = comparison.allDiffs.filter(
        (d) => d.direction === 'increase'
      ).length;
      const decreases = comparison.allDiffs.filter(
        (d) => d.direction === 'decrease'
      ).length;
      const unchanged = comparison.allDiffs.filter(
        (d) => d.direction === 'unchanged'
      ).length;

      expect(comparison.summary.increases).toBe(increases);
      expect(comparison.summary.decreases).toBe(decreases);
      expect(comparison.summary.unchanged).toBe(unchanged);
    });
  });

  describe('Symmetry', () => {
    it('verifySymmetry returns true for valid comparisons', () => {
      const result = verifySymmetry(stateA, stateB);

      expect(result.symmetric).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('A-B diff is inverse of B-A diff', () => {
      const compAB = compareStates(stateA, stateB);
      const compBA = compareStates(stateB, stateA);

      // Check specific variable
      const dimAB = compAB.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      )!;
      const dimBA = compBA.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      )!;

      // Values should be swapped
      expect(dimAB.valueA).toBe(dimBA.valueB);
      expect(dimAB.valueB).toBe(dimBA.valueA);

      // Difference should be negated
      expect(dimAB.difference).toBe(-dimBA.difference!);

      // Direction should be opposite
      expect(dimAB.direction).toBe('increase');
      expect(dimBA.direction).toBe('decrease');
    });

    it('summary counts are swapped for inverse', () => {
      const compAB = compareStates(stateA, stateB);
      const compBA = compareStates(stateB, stateA);

      expect(compAB.summary.increases).toBe(compBA.summary.decreases);
      expect(compAB.summary.decreases).toBe(compBA.summary.increases);
      expect(compAB.summary.unchanged).toBe(compBA.summary.unchanged);
    });

    it('invertComparison produces correct inverse', () => {
      const original = compareStates(stateA, stateB);
      const inverted = invertComparison(original);

      expect(inverted.stateAId).toBe(original.stateBId);
      expect(inverted.stateBId).toBe(original.stateAId);
      expect(inverted.timeDiff).toBe(-original.timeDiff);
    });

    it('double inversion returns to original values', () => {
      const original = compareStates(stateA, stateB);
      const inverted = invertComparison(original);
      const doubleInverted = invertComparison(inverted);

      // Check a specific diff
      const origDiff = original.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      )!;
      const doubleDiff = doubleInverted.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      )!;

      expect(doubleDiff.valueA).toBe(origDiff.valueA);
      expect(doubleDiff.valueB).toBe(origDiff.valueB);
      expect(doubleDiff.difference).toBe(origDiff.difference);
      expect(doubleDiff.direction).toBe(origDiff.direction);
    });
  });

  describe('No Prescription', () => {
    it('formatDirection uses neutral language', () => {
      expect(formatDirection('increase')).toBe('higher');
      expect(formatDirection('decrease')).toBe('lower');
      expect(formatDirection('unchanged')).toBe('same');

      // Should NOT contain value judgments
      expect(formatDirection('increase')).not.toMatch(/better|improve|good/i);
      expect(formatDirection('decrease')).not.toMatch(/worse|degrade|bad/i);
    });

    it('directionSymbol is neutral', () => {
      expect(directionSymbol('increase')).toBe('↑');
      expect(directionSymbol('decrease')).toBe('↓');
      expect(directionSymbol('unchanged')).toBe('=');
    });

    it('formatDiffValue is purely descriptive', () => {
      const diff: VariableDiff = {
        variable: 'performance.accuracy',
        name: 'Accuracy',
        valueA: 0.8,
        valueB: 0.9,
        difference: 0.1,
        percentChange: 12.5,
        direction: 'increase',
        unit: 'ratio',
        description: 'Classification accuracy',
      };

      const formatted = formatDiffValue(diff);

      expect(formatted).toContain('0.8000');
      expect(formatted).toContain('0.9000');
      expect(formatted).toContain('→');

      // Should NOT contain value judgments
      expect(formatted).not.toMatch(/better|improve|good|worse|degrade|bad/i);
    });

    it('generateComparisonHTML contains no prescriptive language in labels', () => {
      const comparison = compareStates(stateA, stateB);
      const html = generateComparisonHTML(comparison);

      // Summary labels should use neutral language
      expect(html).toContain('higher');
      expect(html).toContain('lower');

      // Should NOT contain recommendations in generated content
      // (Note: descriptions from VARIABLE_METADATA may contain domain context)
      expect(html).not.toMatch(/should|recommend|suggest/i);
    });

    it('generateComparisonText contains no prescriptive language', () => {
      const comparison = compareStates(stateA, stateB);
      const text = generateComparisonText(comparison);

      // Should NOT contain value judgments
      expect(text).not.toMatch(/better|improve|good|worse|degrade|bad/i);
      expect(text).not.toMatch(/should|recommend|suggest/i);
    });
  });

  describe('Variable Metadata', () => {
    it('includes name from VARIABLE_METADATA', () => {
      const comparison = compareStates(stateA, stateB);

      const dimDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      );

      expect(dimDiff!.name).toBe('Effective Dimension');
    });

    it('includes description from VARIABLE_METADATA', () => {
      const comparison = compareStates(stateA, stateB);

      const dimDiff = comparison.allDiffs.find(
        (d) => d.variable === 'geometry.effectiveDimension'
      );

      expect(dimDiff!.description).toBeTruthy();
      expect(dimDiff!.description.length).toBeGreaterThan(0);
    });

    it('includes unit from VARIABLE_METADATA', () => {
      const comparison = compareStates(stateA, stateB);

      const accDiff = comparison.allDiffs.find(
        (d) => d.variable === 'performance.accuracy'
      );

      expect(accDiff!.unit).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles identical states', () => {
      const comparison = compareStates(stateA, stateA);

      // All diffs with available values should be unchanged
      for (const diff of comparison.allDiffs) {
        if (diff.valueA !== null && diff.valueB !== null) {
          expect(diff.direction).toBe('unchanged');
          expect(diff.difference).toBe(0);
        }
      }

      // All available comparisons should be unchanged
      const available = comparison.allDiffs.filter(
        (d) => d.valueA !== null && d.valueB !== null
      );
      const unchanged = comparison.allDiffs.filter(
        (d) => d.direction === 'unchanged'
      );

      // All available should be unchanged, plus all unavailable are also "unchanged"
      expect(comparison.summary.increases).toBe(0);
      expect(comparison.summary.decreases).toBe(0);
    });

    it('handles null values gracefully', () => {
      // State without dynamics
      const stateNoDynamics = createModelState({
        id: 'no-dynamics',
        time: 0,
        geometry: {
          effectiveDimension: 2,
          anisotropy: 1,
          spread: 3,
          density: 0.5,
        },
        uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 0.8, loss: 0.2 },
      });

      const comparison = compareStates(stateNoDynamics, stateA);

      // Should not crash
      expect(comparison).toBeDefined();
      expect(comparison.allDiffs.length).toBeGreaterThan(0);
    });

    it('handles zero values in percent change', () => {
      const stateZero = createModelState({
        id: 'zero',
        time: 0,
        geometry: {
          effectiveDimension: 0.001, // Very small
          anisotropy: 1,
          spread: 1,
          density: 0.5,
        },
        uncertainty: { entropy: 0.001, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 0.5, loss: 0.5 },
      });

      const comparison = compareStates(stateZero, stateA);

      // Should not produce NaN or Infinity
      for (const diff of comparison.allDiffs) {
        if (diff.percentChange !== null) {
          expect(Number.isFinite(diff.percentChange)).toBe(true);
        }
      }
    });
  });

  describe('HTML Generation', () => {
    it('generates valid HTML structure', () => {
      const comparison = compareStates(stateA, stateB);
      const html = generateComparisonHTML(comparison);

      expect(html).toContain('vc-comparison');
      expect(html).toContain('vc-comparison-header');
      expect(html).toContain('vc-diff-table');
      expect(html).toContain('<table');
      expect(html).toContain('</table>');
    });

    it('escapes HTML special characters', () => {
      const stateWithSpecialId = createModelState({
        id: '<script>alert("xss")</script>',
        time: 0,
        geometry: {
          effectiveDimension: 2,
          anisotropy: 1,
          spread: 3,
          density: 0.5,
        },
        uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 0.8, loss: 0.2 },
      });

      const comparison = compareStates(stateWithSpecialId, stateA);
      const html = generateComparisonHTML(comparison);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('includes all categories', () => {
      const comparison = compareStates(stateA, stateB);
      const html = generateComparisonHTML(comparison);

      expect(html).toContain('Geometry');
      expect(html).toContain('Uncertainty');
      expect(html).toContain('Performance');
    });
  });

  describe('Text Generation', () => {
    it('generates readable text output', () => {
      const comparison = compareStates(stateA, stateB);
      const text = generateComparisonText(comparison);

      expect(text).toContain('State Comparison');
      expect(text).toContain('state-a');
      expect(text).toContain('state-b');
      expect(text).toContain('Summary');
    });

    it('includes direction symbols', () => {
      const comparison = compareStates(stateA, stateB);
      const text = generateComparisonText(comparison);

      expect(text).toContain('↑');
      expect(text).toContain('↓');
    });
  });
});

describe('Comparison with Same States', () => {
  it('comparing state to itself yields zero diffs', () => {
    const state = createModelState({
      id: 'test',
      time: 0,
      geometry: {
        effectiveDimension: 2,
        anisotropy: 1.5,
        spread: 4,
        density: 0.6,
      },
      uncertainty: { entropy: 1, margin: 0.7, calibration: 0.05 },
      performance: { accuracy: 0.8, loss: 0.2 },
    });

    const comparison = compareStates(state, state);

    expect(comparison.timeDiff).toBe(0);
    expect(comparison.summary.increases).toBe(0);
    expect(comparison.summary.decreases).toBe(0);
  });
});
