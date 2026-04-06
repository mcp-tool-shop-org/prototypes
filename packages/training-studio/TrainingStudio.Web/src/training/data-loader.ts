import * as tf from '@tensorflow/tfjs';

export interface DatasetConfig {
  content: string;
  featureColumns: string[];
  labelColumn: string;
  validationSplit?: number;
  shuffle?: boolean;
  normalize?: boolean;
  seed?: number;  // Determinism: fixed seed for reproducibility
}

export interface LoadedDataset {
  trainX: tf.Tensor2D;
  trainY: tf.Tensor;
  valX?: tf.Tensor2D;
  valY?: tf.Tensor;
  featureCount: number;
  labelInfo: LabelInfo;
  stats: DatasetStats;
  reproducibility: ReproducibilityInfo;
}

export interface LabelInfo {
  type: 'classification' | 'regression';
  numClasses?: number;
  classLabels?: string[];
}

export interface DatasetStats {
  totalSamples: number;
  trainSamples: number;
  valSamples: number;
  featureMeans?: number[];
  featureStds?: number[];
}

export interface ReproducibilityInfo {
  seed: number;
  trainIndices: number[];
  valIndices: number[];
  trainIndicesHash: string;
  valIndicesHash: string;
}

export function parseCSV(content: string): { headers: string[]; data: string[][] } {
  const lines = content.trim().split('\n');
  const headers = parseCsvLine(lines[0]);
  const data: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === headers.length) {
      data.push(row);
    }
  }

  return { headers, data };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const c of line) {
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Deterministic given the same seed
 */
function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG
 */
function seededShuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Simple hash function for index arrays (for reproducibility tracking)
 */
function hashIndices(indices: number[]): string {
  let hash = 0;
  const str = indices.join(',');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function loadDataset(config: DatasetConfig): LoadedDataset {
  const { headers, data } = parseCSV(config.content);

  // Get column indices
  const featureIndices = config.featureColumns.map(col => headers.indexOf(col));
  const labelIndex = headers.indexOf(config.labelColumn);

  if (featureIndices.some(i => i === -1)) {
    throw new Error('One or more feature columns not found');
  }
  if (labelIndex === -1) {
    throw new Error('Label column not found');
  }

  // Extract features and labels
  let features: number[][] = [];
  let labels: (number | string)[] = [];
  let originalIndices: number[] = [];

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    const featureRow = featureIndices.map(i => parseFloat(row[i]));
    if (featureRow.some(isNaN)) continue; // Skip rows with invalid numbers

    features.push(featureRow);
    labels.push(row[labelIndex]);
    originalIndices.push(rowIdx);
  }

  // Deterministic seed - use provided or generate from timestamp
  const seed = config.seed ?? Date.now();
  const random = createSeededRandom(seed);

  // Shuffle with seeded RNG if requested
  let shuffledIndices = Array.from({ length: features.length }, (_, i) => i);
  if (config.shuffle !== false) {
    shuffledIndices = seededShuffle(shuffledIndices, random);
    features = shuffledIndices.map(i => features[i]);
    labels = shuffledIndices.map(i => labels[i]);
  }

  // Determine label type
  const labelInfo = inferLabelInfo(labels);

  // Convert labels to tensors
  let labelTensor: tf.Tensor;
  if (labelInfo.type === 'classification') {
    const numericLabels = labels.map(l => {
      if (typeof l === 'number') return l;
      return labelInfo.classLabels!.indexOf(l);
    });
    labelTensor = tf.oneHot(tf.tensor1d(numericLabels, 'int32'), labelInfo.numClasses!);
  } else {
    labelTensor = tf.tensor1d(labels.map(l => typeof l === 'number' ? l : parseFloat(l)));
  }

  // Normalize features if requested
  let featureTensor = tf.tensor2d(features);
  let featureMeans: number[] | undefined;
  let featureStds: number[] | undefined;

  if (config.normalize !== false) {
    const moments = tf.moments(featureTensor, 0);
    const mean = moments.mean as tf.Tensor1D;
    const variance = moments.variance as tf.Tensor1D;
    const std = tf.sqrt(variance.add(1e-7)) as tf.Tensor1D;

    featureMeans = Array.from(mean.dataSync());
    featureStds = Array.from(std.dataSync());

    featureTensor = featureTensor.sub(mean).div(std) as tf.Tensor2D;

    mean.dispose();
    variance.dispose();
    std.dispose();
    moments.mean.dispose();
    moments.variance.dispose();
  }

  // Split into train/validation
  const valSplit = config.validationSplit ?? 0.2;
  const splitIndex = Math.floor(features.length * (1 - valSplit));

  const trainIndices = shuffledIndices.slice(0, splitIndex);
  const valIndices = shuffledIndices.slice(splitIndex);

  const trainX = featureTensor.slice([0, 0], [splitIndex, -1]) as tf.Tensor2D;
  const trainY = labelTensor.slice([0], [splitIndex]);
  const valX = featureTensor.slice([splitIndex, 0]) as tf.Tensor2D;
  const valY = labelTensor.slice([splitIndex]);

  // Clean up original tensors
  featureTensor.dispose();
  labelTensor.dispose();

  return {
    trainX,
    trainY,
    valX,
    valY,
    featureCount: config.featureColumns.length,
    labelInfo,
    stats: {
      totalSamples: features.length,
      trainSamples: splitIndex,
      valSamples: features.length - splitIndex,
      featureMeans,
      featureStds
    },
    reproducibility: {
      seed,
      trainIndices,
      valIndices,
      trainIndicesHash: hashIndices(trainIndices),
      valIndicesHash: hashIndices(valIndices)
    }
  };
}

function inferLabelInfo(labels: (number | string)[]): LabelInfo {
  const uniqueLabels = [...new Set(labels)];

  // If all numeric and more than 10 unique values, treat as regression
  const allNumeric = uniqueLabels.every(l => typeof l === 'number' || !isNaN(parseFloat(String(l))));
  if (allNumeric && uniqueLabels.length > 10) {
    return { type: 'regression' };
  }

  // Classification
  return {
    type: 'classification',
    numClasses: uniqueLabels.length,
    classLabels: uniqueLabels.map(String)
  };
}

export function disposeDataset(dataset: LoadedDataset): void {
  dataset.trainX.dispose();
  dataset.trainY.dispose();
  dataset.valX?.dispose();
  dataset.valY?.dispose();
}
