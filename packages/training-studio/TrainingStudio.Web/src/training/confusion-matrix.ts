import * as tf from '@tensorflow/tfjs';

export interface ConfusionMatrixData {
  matrix: number[][];
  labels: string[];
  totalSamples: number;
  accuracy: number;
  perClassMetrics: PerClassMetrics[];
}

export interface PerClassMetrics {
  label: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

/**
 * Compute confusion matrix from predictions and ground truth
 */
export function computeConfusionMatrix(
  yTrue: tf.Tensor,
  yPred: tf.Tensor,
  numClasses: number,
  classLabels?: string[]
): ConfusionMatrixData {
  // Get class indices from one-hot or direct predictions
  const trueIndices = yTrue.rank === 2 ? yTrue.argMax(-1) : yTrue;
  const predIndices = yPred.rank === 2 ? yPred.argMax(-1) : yPred;

  // Sync to get arrays
  const trueArr = trueIndices.arraySync() as number[];
  const predArr = predIndices.arraySync() as number[];

  // Cleanup tensors we created
  if (trueIndices !== yTrue) trueIndices.dispose();
  if (predIndices !== yPred) predIndices.dispose();

  // Initialize confusion matrix
  const matrix: number[][] = Array(numClasses)
    .fill(0)
    .map(() => Array(numClasses).fill(0));

  // Fill confusion matrix
  for (let i = 0; i < trueArr.length; i++) {
    const trueClass = trueArr[i];
    const predClass = predArr[i];
    matrix[trueClass][predClass]++;
  }

  // Generate labels if not provided
  const labels = classLabels || Array.from({ length: numClasses }, (_, i) => `Class ${i}`);

  // Calculate overall accuracy
  let correct = 0;
  for (let i = 0; i < numClasses; i++) {
    correct += matrix[i][i];
  }
  const accuracy = correct / trueArr.length;

  // Calculate per-class metrics
  const perClassMetrics: PerClassMetrics[] = labels.map((label, classIdx) => {
    // True positives: diagonal element
    const tp = matrix[classIdx][classIdx];

    // False positives: column sum minus TP
    let fp = 0;
    for (let i = 0; i < numClasses; i++) {
      if (i !== classIdx) fp += matrix[i][classIdx];
    }

    // False negatives: row sum minus TP
    let fn = 0;
    for (let j = 0; j < numClasses; j++) {
      if (j !== classIdx) fn += matrix[classIdx][j];
    }

    // Support: total actual samples for this class (row sum)
    let support = 0;
    for (let j = 0; j < numClasses; j++) {
      support += matrix[classIdx][j];
    }

    // Precision, recall, F1
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return {
      label,
      precision,
      recall,
      f1Score,
      support
    };
  });

  return {
    matrix,
    labels,
    totalSamples: trueArr.length,
    accuracy,
    perClassMetrics
  };
}

/**
 * Compute confusion matrix from model predictions on a dataset
 */
export async function computeModelConfusionMatrix(
  model: tf.Sequential,
  xData: tf.Tensor,
  yData: tf.Tensor,
  classLabels?: string[]
): Promise<ConfusionMatrixData> {
  // Get predictions
  const predictions = model.predict(xData) as tf.Tensor;

  // Determine number of classes from output shape
  const numClasses = predictions.shape[predictions.shape.length - 1];

  // Compute confusion matrix
  const result = computeConfusionMatrix(yData, predictions, numClasses, classLabels);

  // Cleanup
  predictions.dispose();

  return result;
}

/**
 * Format confusion matrix for JSON export
 */
export function formatConfusionMatrixJSON(data: ConfusionMatrixData): string {
  return JSON.stringify({
    matrix: data.matrix,
    labels: data.labels,
    total_samples: data.totalSamples,
    accuracy: data.accuracy,
    per_class_metrics: data.perClassMetrics.map(m => ({
      label: m.label,
      precision: m.precision,
      recall: m.recall,
      f1_score: m.f1Score,
      support: m.support
    }))
  }, null, 2);
}
