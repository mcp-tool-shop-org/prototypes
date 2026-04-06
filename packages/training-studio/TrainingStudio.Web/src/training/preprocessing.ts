/**
 * Data Preprocessing Module
 *
 * Provides preprocessing utilities for dataset preparation.
 */

export interface PreprocessingConfig {
  normalize: boolean;
  normalizationMethod: 'z-score' | 'min-max';
  handleMissing: 'drop' | 'mean' | 'median' | 'zero';
  oneHotEncode: boolean;
  detectOutliers: boolean;
  outlierThreshold: number; // Standard deviations from mean
}

export const DEFAULT_PREPROCESSING: PreprocessingConfig = {
  normalize: true,
  normalizationMethod: 'z-score',
  handleMissing: 'drop',
  oneHotEncode: false,
  detectOutliers: false,
  outlierThreshold: 3.0
};

export interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical';
  count: number;
  missing: number;
  missingPercent: number;
  unique?: number;
  categories?: string[];
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  outliers?: number;
}

export interface DatasetAnalysis {
  totalRows: number;
  totalColumns: number;
  columnStats: ColumnStats[];
  hasNulls: boolean;
  nullCount: number;
  recommendations: string[];
}

/**
 * Analyze a dataset to determine column types and statistics
 */
export function analyzeDataset(
  headers: string[],
  data: string[][],
  config: Partial<PreprocessingConfig> = {}
): DatasetAnalysis {
  const settings = { ...DEFAULT_PREPROCESSING, ...config };
  const columnStats: ColumnStats[] = [];
  let totalNulls = 0;
  const recommendations: string[] = [];

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const name = headers[colIdx];
    const values = data.map(row => row[colIdx]);

    // Count missing values
    const missing = values.filter(v => v === '' || v === null || v === undefined || v.toLowerCase() === 'nan').length;
    totalNulls += missing;
    const missingPercent = (missing / values.length) * 100;

    // Get non-missing values
    const validValues = values.filter(v => v !== '' && v !== null && v !== undefined && v.toLowerCase() !== 'nan');

    // Determine if numeric
    const numericValues = validValues.map(v => parseFloat(v)).filter(n => !isNaN(n));
    const isNumeric = numericValues.length === validValues.length && numericValues.length > 0;

    if (isNumeric) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      // Count outliers
      let outliers = 0;
      if (settings.detectOutliers && std > 0) {
        outliers = numericValues.filter(v =>
          Math.abs(v - mean) > settings.outlierThreshold * std
        ).length;
      }

      columnStats.push({
        name,
        type: 'numeric',
        count: values.length,
        missing,
        missingPercent,
        mean,
        std,
        min,
        max,
        outliers
      });

      if (outliers > 0) {
        recommendations.push(`Column "${name}" has ${outliers} outliers (> ${settings.outlierThreshold}σ from mean)`);
      }
    } else {
      // Categorical column
      const unique = new Set(validValues);

      columnStats.push({
        name,
        type: 'categorical',
        count: values.length,
        missing,
        missingPercent,
        unique: unique.size,
        categories: Array.from(unique).slice(0, 20) // Limit categories shown
      });

      if (unique.size > 10 && !settings.oneHotEncode) {
        recommendations.push(`Column "${name}" has ${unique.size} categories - consider one-hot encoding`);
      }
    }

    if (missingPercent > 5) {
      recommendations.push(`Column "${name}" has ${missingPercent.toFixed(1)}% missing values`);
    }
  }

  return {
    totalRows: data.length,
    totalColumns: headers.length,
    columnStats,
    hasNulls: totalNulls > 0,
    nullCount: totalNulls,
    recommendations
  };
}

/**
 * Fill missing values in a column
 */
export function fillMissing(
  values: string[],
  method: PreprocessingConfig['handleMissing'],
  isNumeric: boolean
): string[] {
  if (method === 'drop') {
    return values; // Handled at row level
  }

  const validValues = values.filter(v =>
    v !== '' && v !== null && v !== undefined && v.toLowerCase() !== 'nan'
  );

  if (!isNumeric || validValues.length === 0) {
    // For categorical or empty columns, replace with most common or empty string
    if (method === 'zero' || validValues.length === 0) {
      return values.map(v =>
        (v === '' || v === null || v === undefined || v.toLowerCase() === 'nan') ? '0' : v
      );
    }
    // Use mode (most common value)
    const counts = new Map<string, number>();
    for (const v of validValues) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    const mode = Array.from(counts.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    return values.map(v =>
      (v === '' || v === null || v === undefined || v.toLowerCase() === 'nan') ? mode : v
    );
  }

  const numericValues = validValues.map(v => parseFloat(v));
  let replacement: number;

  if (method === 'mean') {
    replacement = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
  } else if (method === 'median') {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    replacement = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    replacement = 0;
  }

  return values.map(v =>
    (v === '' || v === null || v === undefined || v.toLowerCase() === 'nan')
      ? replacement.toString()
      : v
  );
}

/**
 * Normalize numeric values
 */
export function normalizeValues(
  values: number[],
  method: PreprocessingConfig['normalizationMethod']
): { normalized: number[]; params: { mean?: number; std?: number; min?: number; max?: number } } {
  if (values.length === 0) {
    return { normalized: [], params: {} };
  }

  if (method === 'z-score') {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1; // Avoid division by zero

    return {
      normalized: values.map(v => (v - mean) / std),
      params: { mean, std }
    };
  } else {
    // min-max normalization to [0, 1]
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    return {
      normalized: values.map(v => (v - min) / range),
      params: { min, max }
    };
  }
}

/**
 * One-hot encode categorical values
 */
export function oneHotEncode(
  values: string[],
  categories?: string[]
): { encoded: number[][]; categories: string[] } {
  const cats = categories || Array.from(new Set(values)).sort();
  const catIndex = new Map(cats.map((c, i) => [c, i]));

  const encoded = values.map(v => {
    const row = new Array(cats.length).fill(0);
    const idx = catIndex.get(v);
    if (idx !== undefined) {
      row[idx] = 1;
    }
    return row;
  });

  return { encoded, categories: cats };
}

/**
 * Compute correlation matrix for numeric columns
 */
export function computeCorrelationMatrix(
  data: number[][],
  headers: string[]
): { matrix: number[][]; headers: string[] } {
  const n = data[0]?.length || 0;
  if (n === 0) return { matrix: [], headers: [] };

  // Compute means
  const means = new Array(n).fill(0);
  for (const row of data) {
    for (let j = 0; j < n; j++) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < n; j++) {
    means[j] /= data.length;
  }

  // Compute standard deviations
  const stds = new Array(n).fill(0);
  for (const row of data) {
    for (let j = 0; j < n; j++) {
      stds[j] += Math.pow(row[j] - means[j], 2);
    }
  }
  for (let j = 0; j < n; j++) {
    stds[j] = Math.sqrt(stds[j] / data.length) || 1;
  }

  // Compute correlation matrix
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1; // Diagonal is always 1
    for (let j = i + 1; j < n; j++) {
      let sum = 0;
      for (const row of data) {
        sum += ((row[i] - means[i]) / stds[i]) * ((row[j] - means[j]) / stds[j]);
      }
      const corr = sum / data.length;
      matrix[i][j] = corr;
      matrix[j][i] = corr; // Symmetric
    }
  }

  return { matrix, headers };
}
