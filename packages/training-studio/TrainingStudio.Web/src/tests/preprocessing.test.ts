/**
 * Preprocessing Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeDataset,
  fillMissing,
  normalizeValues,
  oneHotEncode,
  computeCorrelationMatrix,
  DEFAULT_PREPROCESSING
} from '../training/preprocessing';

describe('Preprocessing', () => {
  describe('analyzeDataset', () => {
    it('identifies numeric columns', () => {
      const headers = ['age', 'income'];
      const data = [
        ['25', '50000'],
        ['30', '60000'],
        ['35', '70000']
      ];

      const analysis = analyzeDataset(headers, data);

      expect(analysis.columnStats[0].type).toBe('numeric');
      expect(analysis.columnStats[1].type).toBe('numeric');
    });

    it('identifies categorical columns', () => {
      const headers = ['color', 'size'];
      const data = [
        ['red', 'small'],
        ['blue', 'medium'],
        ['red', 'large']
      ];

      const analysis = analyzeDataset(headers, data);

      expect(analysis.columnStats[0].type).toBe('categorical');
      expect(analysis.columnStats[0].unique).toBe(2);
      expect(analysis.columnStats[1].type).toBe('categorical');
      expect(analysis.columnStats[1].unique).toBe(3);
    });

    it('counts missing values', () => {
      const headers = ['value'];
      const data = [['1'], [''], ['3'], ['NaN'], ['5']];

      const analysis = analyzeDataset(headers, data);

      expect(analysis.columnStats[0].missing).toBe(2);
      expect(analysis.nullCount).toBe(2);
      expect(analysis.hasNulls).toBe(true);
    });

    it('computes numeric statistics', () => {
      const headers = ['value'];
      const data = [['10'], ['20'], ['30']];

      const analysis = analyzeDataset(headers, data);

      expect(analysis.columnStats[0].mean).toBeCloseTo(20);
      expect(analysis.columnStats[0].min).toBe(10);
      expect(analysis.columnStats[0].max).toBe(30);
    });

    it('detects outliers when enabled', () => {
      const headers = ['value'];
      // Normal values around 50, one outlier at 200
      const data = [
        ['48'], ['50'], ['52'], ['49'], ['51'], ['200']
      ];

      const analysis = analyzeDataset(headers, data, { detectOutliers: true, outlierThreshold: 2 });

      expect(analysis.columnStats[0].outliers).toBeGreaterThan(0);
    });
  });

  describe('fillMissing', () => {
    it('fills with mean', () => {
      const values = ['10', '', '30', 'NaN', '50'];
      const filled = fillMissing(values, 'mean', true);

      // Mean of 10, 30, 50 = 30
      expect(filled[1]).toBe('30');
      expect(filled[3]).toBe('30');
    });

    it('fills with median', () => {
      const values = ['10', '', '50', 'NaN', '30'];
      const filled = fillMissing(values, 'median', true);

      // Median of 10, 30, 50 = 30
      expect(filled[1]).toBe('30');
      expect(filled[3]).toBe('30');
    });

    it('fills with zero', () => {
      const values = ['10', '', '30'];
      const filled = fillMissing(values, 'zero', true);

      expect(filled[1]).toBe('0');
    });

    it('does not modify non-missing values', () => {
      const values = ['10', '20', '30'];
      const filled = fillMissing(values, 'mean', true);

      expect(filled).toEqual(['10', '20', '30']);
    });
  });

  describe('normalizeValues', () => {
    it('applies z-score normalization', () => {
      const values = [10, 20, 30];
      const { normalized, params } = normalizeValues(values, 'z-score');

      expect(params.mean).toBeCloseTo(20);
      expect(normalized[0]).toBeLessThan(0); // Below mean
      expect(normalized[1]).toBeCloseTo(0);  // At mean
      expect(normalized[2]).toBeGreaterThan(0); // Above mean
    });

    it('applies min-max normalization', () => {
      const values = [10, 20, 30];
      const { normalized, params } = normalizeValues(values, 'min-max');

      expect(params.min).toBe(10);
      expect(params.max).toBe(30);
      expect(normalized[0]).toBe(0);   // Min
      expect(normalized[1]).toBe(0.5); // Middle
      expect(normalized[2]).toBe(1);   // Max
    });

    it('handles single value', () => {
      const values = [50];
      const { normalized } = normalizeValues(values, 'z-score');

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toBe(0); // Mean of single value
    });
  });

  describe('oneHotEncode', () => {
    it('encodes categorical values', () => {
      const values = ['red', 'blue', 'red', 'green'];
      const { encoded, categories } = oneHotEncode(values);

      expect(categories).toEqual(['blue', 'green', 'red']);
      expect(encoded[0]).toEqual([0, 0, 1]); // red
      expect(encoded[1]).toEqual([1, 0, 0]); // blue
      expect(encoded[2]).toEqual([0, 0, 1]); // red
      expect(encoded[3]).toEqual([0, 1, 0]); // green
    });

    it('uses provided categories', () => {
      const values = ['a', 'b'];
      const { encoded } = oneHotEncode(values, ['a', 'b', 'c']);

      expect(encoded[0]).toEqual([1, 0, 0]); // a
      expect(encoded[1]).toEqual([0, 1, 0]); // b
    });
  });

  describe('computeCorrelationMatrix', () => {
    it('computes correct diagonal', () => {
      const data = [
        [1, 2],
        [2, 4],
        [3, 6]
      ];
      const { matrix } = computeCorrelationMatrix(data, ['a', 'b']);

      expect(matrix[0][0]).toBe(1);
      expect(matrix[1][1]).toBe(1);
    });

    it('detects perfect positive correlation', () => {
      const data = [
        [1, 2],
        [2, 4],
        [3, 6]
      ];
      const { matrix } = computeCorrelationMatrix(data, ['a', 'b']);

      expect(matrix[0][1]).toBeCloseTo(1);
      expect(matrix[1][0]).toBeCloseTo(1);
    });

    it('detects no correlation', () => {
      const data = [
        [1, 5],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 3]
      ];
      const { matrix } = computeCorrelationMatrix(data, ['a', 'b']);

      // Should be close to 0 (no strong correlation)
      expect(Math.abs(matrix[0][1])).toBeLessThan(0.5);
    });
  });
});
