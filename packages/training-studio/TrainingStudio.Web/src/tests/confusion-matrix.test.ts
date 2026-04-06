/**
 * Confusion Matrix Unit Tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import {
  computeConfusionMatrix,
  formatConfusionMatrixJSON,
  ConfusionMatrixData
} from '../training/confusion-matrix';

describe('Confusion Matrix', () => {
  afterEach(() => {
    // Clean up tensors
    tf.disposeVariables();
  });

  describe('computeConfusionMatrix', () => {
    it('computes correct confusion matrix for perfect predictions', () => {
      // 3 samples, 3 classes - all correctly classified
      const yTrue = tf.tensor1d([0, 1, 2]);
      const yPred = tf.tensor1d([0, 1, 2]);

      const result = computeConfusionMatrix(yTrue, yPred, 3);

      expect(result.accuracy).toBe(1.0);
      expect(result.matrix).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
      expect(result.totalSamples).toBe(3);

      yTrue.dispose();
      yPred.dispose();
    });

    it('computes correct confusion matrix with misclassifications', () => {
      // Sample: actual class 0 predicted as 1, actual 1 predicted as 1, actual 2 predicted as 0
      const yTrue = tf.tensor1d([0, 1, 2]);
      const yPred = tf.tensor1d([1, 1, 0]);

      const result = computeConfusionMatrix(yTrue, yPred, 3);

      expect(result.accuracy).toBeCloseTo(1/3);
      // Row = actual, Col = predicted
      // Actual 0 -> Predicted 1: matrix[0][1] = 1
      // Actual 1 -> Predicted 1: matrix[1][1] = 1
      // Actual 2 -> Predicted 0: matrix[2][0] = 1
      expect(result.matrix).toEqual([
        [0, 1, 0],
        [0, 1, 0],
        [1, 0, 0]
      ]);

      yTrue.dispose();
      yPred.dispose();
    });

    it('handles one-hot encoded inputs', () => {
      // One-hot encoded: class 0, class 1, class 2
      const yTrue = tf.tensor2d([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
      // Predictions: class 0, class 0, class 2
      const yPred = tf.tensor2d([
        [0.9, 0.05, 0.05],
        [0.6, 0.3, 0.1],
        [0.1, 0.2, 0.7]
      ]);

      const result = computeConfusionMatrix(yTrue, yPred, 3);

      expect(result.accuracy).toBeCloseTo(2/3);
      expect(result.matrix).toEqual([
        [1, 0, 0],  // Class 0: 1 correct
        [1, 0, 0],  // Class 1: 1 misclassified as 0
        [0, 0, 1]   // Class 2: 1 correct
      ]);

      yTrue.dispose();
      yPred.dispose();
    });

    it('uses custom class labels', () => {
      const yTrue = tf.tensor1d([0, 1, 2]);
      const yPred = tf.tensor1d([0, 1, 2]);
      const labels = ['Cat', 'Dog', 'Bird'];

      const result = computeConfusionMatrix(yTrue, yPred, 3, labels);

      expect(result.labels).toEqual(['Cat', 'Dog', 'Bird']);
      expect(result.perClassMetrics[0].label).toBe('Cat');
      expect(result.perClassMetrics[1].label).toBe('Dog');
      expect(result.perClassMetrics[2].label).toBe('Bird');

      yTrue.dispose();
      yPred.dispose();
    });

    it('computes per-class precision, recall, and F1', () => {
      // Create scenario with known precision/recall
      // Class 0: TP=2, FP=1, FN=0 -> Precision=2/3, Recall=1
      // Class 1: TP=1, FP=0, FN=1 -> Precision=1, Recall=1/2
      const yTrue = tf.tensor1d([0, 0, 1, 1]);
      const yPred = tf.tensor1d([0, 0, 0, 1]);

      const result = computeConfusionMatrix(yTrue, yPred, 2);

      // Class 0 metrics
      expect(result.perClassMetrics[0].precision).toBeCloseTo(2/3);
      expect(result.perClassMetrics[0].recall).toBe(1);
      expect(result.perClassMetrics[0].support).toBe(2);

      // Class 1 metrics
      expect(result.perClassMetrics[1].precision).toBe(1);
      expect(result.perClassMetrics[1].recall).toBeCloseTo(0.5);
      expect(result.perClassMetrics[1].support).toBe(2);

      yTrue.dispose();
      yPred.dispose();
    });
  });

  describe('formatConfusionMatrixJSON', () => {
    it('formats confusion matrix data as JSON', () => {
      const data: ConfusionMatrixData = {
        matrix: [[2, 1], [0, 3]],
        labels: ['A', 'B'],
        totalSamples: 6,
        accuracy: 5/6,
        perClassMetrics: [
          { label: 'A', precision: 1, recall: 2/3, f1Score: 0.8, support: 3 },
          { label: 'B', precision: 3/4, recall: 1, f1Score: 6/7, support: 3 }
        ]
      };

      const json = formatConfusionMatrixJSON(data);
      const parsed = JSON.parse(json);

      expect(parsed.matrix).toEqual([[2, 1], [0, 3]]);
      expect(parsed.labels).toEqual(['A', 'B']);
      expect(parsed.total_samples).toBe(6);
      expect(parsed.accuracy).toBeCloseTo(5/6);
      expect(parsed.per_class_metrics).toHaveLength(2);
      expect(parsed.per_class_metrics[0].label).toBe('A');
      expect(parsed.per_class_metrics[0].precision).toBe(1);
    });
  });
});
