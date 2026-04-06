/**
 * Training History Module Tests
 */

import { describe, it, expect } from 'vitest';
import { generateRunId, formatDuration, compareRuns, TrainingRun } from '../training/history';

describe('Training History', () => {
  describe('generateRunId', () => {
    it('generates unique IDs', () => {
      const id1 = generateRunId();
      const id2 = generateRunId();
      expect(id1).not.toBe(id2);
    });

    it('includes timestamp prefix', () => {
      const id = generateRunId();
      expect(id).toMatch(/^run_\d+_[a-z0-9]+$/);
    });
  });

  describe('formatDuration', () => {
    it('formats seconds only', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(45000)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3600000)).toBe('1h 0m 0s');
      expect(formatDuration(3665000)).toBe('1h 1m 5s');
      expect(formatDuration(7325000)).toBe('2h 2m 5s');
    });
  });

  describe('compareRuns', () => {
    const createMockRun = (overrides: Partial<TrainingRun>): TrainingRun => ({
      id: 'test_run',
      timestamp: Date.now(),
      name: 'Test Run',
      tags: [],
      notes: '',
      datasetName: 'test.csv',
      modelType: 'mlp-classifier',
      hyperparams: {
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
        earlyStopping: true,
        patience: 5
      },
      metrics: {
        epochs: [1, 2, 3],
        loss: [0.5, 0.3, 0.2],
        accuracy: [0.7, 0.8, 0.85],
        valLoss: [0.6, 0.4, 0.3],
        valAccuracy: [0.65, 0.75, 0.8]
      },
      finalMetrics: {
        trainLoss: 0.2,
        valLoss: 0.3,
        trainAccuracy: 0.85,
        valAccuracy: 0.8
      },
      durationMs: 60000,
      earlyStopped: false,
      ...overrides
    });

    it('identifies better run by validation loss', () => {
      const run1 = createMockRun({ finalMetrics: { trainLoss: 0.2, valLoss: 0.25, trainAccuracy: 0.85, valAccuracy: 0.82 } });
      const run2 = createMockRun({ finalMetrics: { trainLoss: 0.18, valLoss: 0.35, trainAccuracy: 0.88, valAccuracy: 0.78 } });

      const result = compareRuns(run1, run2);
      expect(result.run1Better).toBe(true); // run1 has lower val_loss
    });

    it('detects tie correctly', () => {
      const run1 = createMockRun({ finalMetrics: { trainLoss: 0.2, valLoss: 0.3, trainAccuracy: 0.85, valAccuracy: 0.8 } });
      const run2 = createMockRun({ finalMetrics: { trainLoss: 0.2, valLoss: 0.3, trainAccuracy: 0.85, valAccuracy: 0.8 } });

      const result = compareRuns(run1, run2);
      const valLossComparison = result.metricComparison.find(c => c.metric === 'Validation Loss');
      expect(valLossComparison?.better).toBe('tie');
    });

    it('compares all metrics', () => {
      const run1 = createMockRun({
        finalMetrics: { trainLoss: 0.2, valLoss: 0.3, trainAccuracy: 0.85, valAccuracy: 0.8 }
      });
      const run2 = createMockRun({
        finalMetrics: { trainLoss: 0.15, valLoss: 0.35, trainAccuracy: 0.9, valAccuracy: 0.78 }
      });

      const result = compareRuns(run1, run2);

      expect(result.metricComparison).toHaveLength(3);
      expect(result.metricComparison.find(c => c.metric === 'Validation Loss')?.better).toBe('run1');
      expect(result.metricComparison.find(c => c.metric === 'Validation Accuracy')?.better).toBe('run1');
      expect(result.metricComparison.find(c => c.metric === 'Training Loss')?.better).toBe('run2');
    });
  });
});
