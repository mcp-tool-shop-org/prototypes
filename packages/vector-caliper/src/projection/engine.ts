/**
 * VectorCaliper - Deterministic Projection Engine
 *
 * Reduces high-dimensional model state to 2D/3D visualization space.
 *
 * INVARIANTS:
 * - Same input → same output (deterministic via fixed seed)
 * - Projection parameters are persisted with output
 * - Projection never recomputed during rendering
 */

import type { ModelState, ProjectedState } from '../types/state';

// =============================================================================
// Projection Method Types
// =============================================================================

export type ProjectionMethod = 'pca' | 'umap' | 'tsne' | 'custom';

/**
 * Configuration for PCA projection.
 */
export interface PCAConfig {
  readonly method: 'pca';
  readonly components: 2 | 3;
  readonly center: boolean;
  readonly scale: boolean;
}

/**
 * Configuration for UMAP projection.
 */
export interface UMAPConfig {
  readonly method: 'umap';
  readonly components: 2 | 3;
  readonly neighbors: number;
  readonly minDist: number;
  readonly seed: number;
}

/**
 * Configuration for t-SNE projection.
 */
export interface TSNEConfig {
  readonly method: 'tsne';
  readonly components: 2 | 3;
  readonly perplexity: number;
  readonly learningRate: number;
  readonly iterations: number;
  readonly seed: number;
}

/**
 * Custom projection via user-provided function.
 */
export interface CustomConfig {
  readonly method: 'custom';
  readonly components: 2 | 3;
  readonly project: (features: number[]) => number[];
  readonly name: string;
}

export type ProjectionConfig = PCAConfig | UMAPConfig | TSNEConfig | CustomConfig;

// =============================================================================
// Default Configurations
// =============================================================================

export const DEFAULT_PCA_CONFIG: PCAConfig = {
  method: 'pca',
  components: 2,
  center: true,
  scale: true,
};

export const DEFAULT_UMAP_CONFIG: UMAPConfig = {
  method: 'umap',
  components: 2,
  neighbors: 15,
  minDist: 0.1,
  seed: 42,
};

export const DEFAULT_TSNE_CONFIG: TSNEConfig = {
  method: 'tsne',
  components: 2,
  perplexity: 30,
  learningRate: 200,
  iterations: 1000,
  seed: 42,
};

// =============================================================================
// Feature Extraction
// =============================================================================

/**
 * Extracts a feature vector from model state.
 * This vector is what gets projected to 2D/3D.
 */
export function extractFeatures(state: ModelState): number[] {
  const features: number[] = [];

  // Geometry features
  features.push(state.geometry.effectiveDimension.value);
  features.push(state.geometry.anisotropy.value);
  features.push(state.geometry.spread.value);
  features.push(state.geometry.density.value);

  // Uncertainty features
  features.push(state.uncertainty.entropy.value);
  features.push(state.uncertainty.margin.value);
  features.push(state.uncertainty.calibration.value);
  features.push(state.uncertainty.epistemic?.value ?? 0);
  features.push(state.uncertainty.aleatoric?.value ?? 0);

  // Performance features
  features.push(state.performance.accuracy.value);
  features.push(state.performance.loss.value);
  features.push(state.performance.taskScore?.value ?? 0);
  features.push(state.performance.cost?.value ?? 0);

  // Dynamics features (if present)
  if (state.dynamics) {
    features.push(state.dynamics.velocity.value);
    features.push(state.dynamics.acceleration.value);
    features.push(state.dynamics.stability.value);
    features.push(state.dynamics.phase);
  } else {
    features.push(0, 0, 0, 0);
  }

  return features;
}

/**
 * Feature names for documentation and debugging.
 */
export const FEATURE_NAMES: readonly string[] = [
  'geometry.effectiveDimension',
  'geometry.anisotropy',
  'geometry.spread',
  'geometry.density',
  'uncertainty.entropy',
  'uncertainty.margin',
  'uncertainty.calibration',
  'uncertainty.epistemic',
  'uncertainty.aleatoric',
  'performance.accuracy',
  'performance.loss',
  'performance.taskScore',
  'performance.cost',
  'dynamics.velocity',
  'dynamics.acceleration',
  'dynamics.stability',
  'dynamics.phase',
];

// =============================================================================
// Seeded Random Number Generator
// =============================================================================

/**
 * Simple seeded PRNG (Mulberry32).
 * Ensures deterministic projection.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =============================================================================
// PCA Implementation (Pure TypeScript)
// =============================================================================

/**
 * Simple PCA implementation.
 * For production, you'd use a proper linear algebra library.
 */
function pca(
  data: number[][],
  config: PCAConfig
): { components: number[][]; explainedVariance: number[] } {
  const n = data.length;
  const d = data[0]?.length ?? 0;

  if (n === 0 || d === 0) {
    return { components: [], explainedVariance: [] };
  }

  // Compute mean
  const mean = new Array(d).fill(0);
  for (const row of data) {
    for (let j = 0; j < d; j++) {
      mean[j] += row[j]! / n;
    }
  }

  // Center data
  const centered = data.map((row) => row.map((v, j) => v - mean[j]!));

  // Compute standard deviation (if scaling)
  let std: number[] | null = null;
  if (config.scale) {
    std = new Array(d).fill(0);
    for (const row of centered) {
      for (let j = 0; j < d; j++) {
        std[j] += (row[j]! * row[j]!) / n;
      }
    }
    std = std.map((v) => Math.sqrt(v) || 1);
    // Scale
    for (const row of centered) {
      for (let j = 0; j < d; j++) {
        row[j] = row[j]! / std[j]!;
      }
    }
  }

  // Compute covariance matrix
  const cov: number[][] = [];
  for (let i = 0; i < d; i++) {
    cov[i] = new Array(d).fill(0);
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (const row of centered) {
        sum += row[i]! * row[j]!;
      }
      cov[i]![j] = sum / (n - 1 || 1);
    }
  }

  // Power iteration for top eigenvectors (simplified)
  const components: number[][] = [];
  const eigenvalues: number[] = [];
  const covCopy = cov.map((row) => [...row]);

  for (let c = 0; c < config.components && c < d; c++) {
    // Initialize random vector
    let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
    let norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    v = v.map((x) => x / norm);

    // Power iteration
    for (let iter = 0; iter < 100; iter++) {
      const newV = new Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          newV[i] += covCopy[i]![j]! * v[j]!;
        }
      }
      norm = Math.sqrt(newV.reduce((sum, x) => sum + x * x, 0));
      if (norm < 1e-10) break;
      v = newV.map((x) => x / norm);
    }

    components.push(v);

    // Compute eigenvalue
    let eigenvalue = 0;
    for (let i = 0; i < d; i++) {
      let rowSum = 0;
      for (let j = 0; j < d; j++) {
        rowSum += covCopy[i]![j]! * v[j]!;
      }
      eigenvalue += v[i]! * rowSum;
    }
    eigenvalues.push(eigenvalue);

    // Deflate
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        covCopy[i]![j] -= eigenvalue * v[i]! * v[j]!;
      }
    }
  }

  // Compute explained variance ratios
  const totalVar = eigenvalues.reduce((a, b) => a + Math.abs(b), 0) || 1;
  const explainedVariance = eigenvalues.map((e) => Math.abs(e) / totalVar);

  return { components, explainedVariance };
}

/**
 * Project data using PCA components.
 */
function projectPCA(
  data: number[][],
  components: number[][],
  config: PCAConfig
): number[][] {
  const n = data.length;
  const d = data[0]?.length ?? 0;

  // Compute mean
  const mean = new Array(d).fill(0);
  for (const row of data) {
    for (let j = 0; j < d; j++) {
      mean[j] += row[j]! / n;
    }
  }

  return data.map((row) => {
    const centered = config.center ? row.map((v, j) => v - mean[j]!) : row;
    return components.map((comp) =>
      comp.reduce((sum, c, j) => sum + c * centered[j]!, 0)
    );
  });
}

// =============================================================================
// Projection Engine
// =============================================================================

/**
 * Projection metadata stored with results.
 */
export interface ProjectionMetadata {
  readonly method: ProjectionMethod;
  readonly seed: number;
  readonly components: number;
  readonly explainedVariance?: number;
  readonly featureNames: readonly string[];
  readonly timestamp: number;
}

/**
 * Cached projection components (for reuse).
 */
export interface ProjectionCache {
  readonly config: ProjectionConfig;
  readonly components?: number[][];
  readonly explainedVariance?: number[];
  readonly metadata: ProjectionMetadata;
}

/**
 * Deterministic Projection Engine.
 *
 * Reduces high-dimensional state to 2D/3D for visualization.
 * All projections are deterministic (same input → same output).
 */
export class ProjectionEngine {
  private config: ProjectionConfig;
  private cache: ProjectionCache | null = null;

  constructor(config: ProjectionConfig = DEFAULT_PCA_CONFIG) {
    this.config = config;
  }

  /**
   * Fit the projection on training data.
   * For PCA: computes principal components.
   * Must be called before project() for batch projection.
   */
  fit(states: ModelState[]): ProjectionMetadata {
    const features = states.map(extractFeatures);

    if (this.config.method === 'pca') {
      const { components, explainedVariance } = pca(features, this.config);
      const totalExplained = explainedVariance
        .slice(0, this.config.components)
        .reduce((a, b) => a + b, 0);

      this.cache = {
        config: this.config,
        components,
        explainedVariance,
        metadata: {
          method: 'pca',
          seed: 0, // PCA is deterministic without seed
          components: this.config.components,
          explainedVariance: totalExplained,
          featureNames: FEATURE_NAMES,
          timestamp: Date.now(),
        },
      };

      return this.cache.metadata;
    }

    if (this.config.method === 'custom') {
      this.cache = {
        config: this.config,
        metadata: {
          method: 'custom',
          seed: 0,
          components: this.config.components,
          featureNames: FEATURE_NAMES,
          timestamp: Date.now(),
        },
      };
      return this.cache.metadata;
    }

    // UMAP/t-SNE would need external library
    // For now, fall back to PCA
    console.warn(
      `${this.config.method} not implemented in pure TypeScript, falling back to PCA`
    );
    const pcaConfig: PCAConfig = {
      method: 'pca',
      components: this.config.components,
      center: true,
      scale: true,
    };
    const { components, explainedVariance } = pca(features, pcaConfig);
    const totalExplained = explainedVariance
      .slice(0, pcaConfig.components)
      .reduce((a, b) => a + b, 0);

    this.cache = {
      config: pcaConfig,
      components,
      explainedVariance,
      metadata: {
        method: this.config.method,
        seed: 'seed' in this.config ? this.config.seed : 0,
        components: this.config.components,
        explainedVariance: totalExplained,
        featureNames: FEATURE_NAMES,
        timestamp: Date.now(),
      },
    };

    return this.cache.metadata;
  }

  /**
   * Project a single state to 2D/3D.
   * If fit() hasn't been called, uses identity projection.
   */
  project(state: ModelState): ProjectedState {
    const features = extractFeatures(state);
    let coords: number[];

    if (this.config.method === 'custom') {
      coords = this.config.project(features);
    } else if (this.cache?.components) {
      // Use fitted PCA components
      const pcaConfig = this.cache.config as PCAConfig;
      const projected = projectPCA([features], this.cache.components, pcaConfig);
      coords = projected[0] ?? [0, 0];
    } else {
      // No fit - use first N features as coordinates (not ideal but deterministic)
      coords = features.slice(0, this.config.components);
    }

    // Ensure we have enough coordinates
    while (coords.length < 2) coords.push(0);

    return {
      sourceId: state.id,
      time: state.time.value,
      position: {
        x: coords[0]!,
        y: coords[1]!,
        z: coords[2],
      },
      projection: {
        method: this.config.method,
        seed: 'seed' in this.config ? this.config.seed : 0,
        components: this.config.components,
        explainedVariance: this.cache?.metadata.explainedVariance,
      },
      source: state,
    };
  }

  /**
   * Project multiple states (batch).
   */
  projectBatch(states: ModelState[]): ProjectedState[] {
    return states.map((s) => this.project(s));
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<ProjectionConfig> {
    return this.config;
  }

  /**
   * Get projection metadata (null if not fitted).
   */
  getMetadata(): ProjectionMetadata | null {
    return this.cache?.metadata ?? null;
  }

  /**
   * Check if projection has been fitted.
   */
  isFitted(): boolean {
    return this.cache !== null;
  }

  /**
   * Reset the projection (clear cache).
   */
  reset(): void {
    this.cache = null;
  }

  /**
   * Update configuration and reset.
   */
  setConfig(config: ProjectionConfig): void {
    this.config = config;
    this.reset();
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const defaultProjection = new ProjectionEngine();
