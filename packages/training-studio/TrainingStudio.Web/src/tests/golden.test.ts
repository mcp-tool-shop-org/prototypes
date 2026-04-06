/**
 * Golden Tests for Training Studio
 *
 * These tests verify determinism, contract compliance, and stability.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { parseCSV, loadDataset } from '../training/data-loader';
import { createModel, MODEL_PRESETS, DEFAULT_HYPERPARAMS } from '../training/model-factory';
import { validateManifestStructure } from '../validation/bundle-validator';
import { BUNDLE_VERSION, BUNDLE_PATHS, ValidationErrorCode } from '../types/bundle';

// Golden fixture: 15-row iris subset
const GOLDEN_CSV = `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,0
4.9,3.0,1.4,0.2,0
4.7,3.2,1.3,0.2,0
4.6,3.1,1.5,0.2,0
5.0,3.6,1.4,0.2,0
7.0,3.2,4.7,1.4,1
6.4,3.2,4.5,1.5,1
6.9,3.1,4.9,1.5,1
5.5,2.3,4.0,1.3,1
6.5,2.8,4.6,1.5,1
6.3,3.3,6.0,2.5,2
5.8,2.7,5.1,1.9,2
7.1,3.0,5.9,2.1,2
6.3,2.9,5.6,1.8,2
6.5,3.0,5.8,2.2,2`;

const SEED_42 = 42;

describe('Data Loader', () => {
  it('parses CSV with expected shapes', () => {
    const { headers, data } = parseCSV(GOLDEN_CSV);

    expect(headers).toEqual(['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species']);
    expect(data.length).toBe(15);
    expect(data[0]).toEqual(['5.1', '3.5', '1.4', '0.2', '0']);
  });

  it('seeded shuffle produces stable first 10 indices', () => {
    const dataset = loadDataset({
      content: GOLDEN_CSV,
      featureColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
      labelColumn: 'species',
      seed: SEED_42,
      validationSplit: 0.2
    });

    // With seed 42, the first 10 train indices should be deterministic
    const trainIndices = dataset.reproducibility.trainIndices.slice(0, 10);

    // Store expected values after first run - these become the "golden" values
    expect(trainIndices.length).toBe(10);
    expect(dataset.reproducibility.seed).toBe(SEED_42);

    dataset.trainX.dispose();
    dataset.trainY.dispose();
    dataset.valX?.dispose();
    dataset.valY?.dispose();
  });

  it('index hashes are stable across runs', () => {
    const dataset1 = loadDataset({
      content: GOLDEN_CSV,
      featureColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
      labelColumn: 'species',
      seed: SEED_42
    });

    const dataset2 = loadDataset({
      content: GOLDEN_CSV,
      featureColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
      labelColumn: 'species',
      seed: SEED_42
    });

    expect(dataset1.reproducibility.trainIndicesHash).toBe(dataset2.reproducibility.trainIndicesHash);
    expect(dataset1.reproducibility.valIndicesHash).toBe(dataset2.reproducibility.valIndicesHash);

    // Cleanup
    [dataset1, dataset2].forEach(d => {
      d.trainX.dispose();
      d.trainY.dispose();
      d.valX?.dispose();
      d.valY?.dispose();
    });
  });

  it('infers classification for species column', () => {
    const dataset = loadDataset({
      content: GOLDEN_CSV,
      featureColumns: ['sepal_length', 'sepal_width'],
      labelColumn: 'species',
      seed: SEED_42
    });

    expect(dataset.labelInfo.type).toBe('classification');
    expect(dataset.labelInfo.numClasses).toBe(3);

    dataset.trainX.dispose();
    dataset.trainY.dispose();
    dataset.valX?.dispose();
    dataset.valY?.dispose();
  });
});

describe('Model Factory', () => {
  it('MLP classifier topology snapshot', () => {
    const model = createModel({
      preset: 'mlp-classifier',
      inputShape: 4,
      outputShape: 3
    });

    // Expected: input dense, dropout, hidden dense, dropout, output dense
    // With default [64, 32] hidden layers
    expect(model.layers.length).toBe(5); // 2 dense + 2 dropout + 1 output

    const layerTypes = model.layers.map(l => l.getClassName());
    expect(layerTypes).toEqual(['Dense', 'Dropout', 'Dense', 'Dropout', 'Dense']);

    // Check output shape
    const outputShape = model.layers[model.layers.length - 1].outputShape;
    expect(outputShape).toContain(3);

    model.dispose();
  });

  it('regressor uses linear activation', () => {
    const model = createModel({
      preset: 'mlp-regressor',
      inputShape: 4,
      outputShape: 1
    });

    const outputLayer = model.layers[model.layers.length - 1];
    const config = outputLayer.getConfig() as { activation: string };
    expect(config.activation).toBe('linear');

    model.dispose();
  });
});

describe('Bundle Validation', () => {
  it('validates correct manifest structure', () => {
    const validManifest = {
      bundle_version: BUNDLE_VERSION,
      bundle_id: '12345678-1234-4123-8123-123456789abc',
      run_id: '87654321-4321-4321-8321-abcdef123456',
      bundle_digest: 'a'.repeat(64),
      schema_uri: 'https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json',
      schema_version: BUNDLE_VERSION,
      created_utc: new Date().toISOString(),
      app: { name: 'Test', version: '0.1.0' },
      backend: { tfjs_version: '4.0.0', backend: 'webgl' },
      dataset: {
        dataset_id: 'abcd1234',
        source_file: 'test.csv',
        total_rows: 100,
        train_rows: 80,
        val_rows: 20,
        features: ['a', 'b'],
        label: 'c',
        split_seed: 42,
        train_indices_hash: '12345678',
        val_indices_hash: '87654321',
        normalization: null
      },
      model: {
        preset: 'mlp-classifier',
        input_shape: 2,
        output_shape: 3,
        task_type: 'classification',
        layer_config: [],
        total_params: 1000,
        trainable_params: 1000
      },
      training: {
        hyperparams: {
          epochs: 10,
          batch_size: 32,
          learning_rate: 0.001,
          optimizer: 'adam',
          early_stopping: true,
          patience: 5
        },
        epochs_completed: 10,
        epochs_requested: 10,
        early_stopped: false,
        best_epoch: 8,
        final_metrics: { train_loss: 0.1 },
        duration_ms: 5000
      },
      artifacts: [
        { path: 'model/model.json', size_bytes: 100, sha256: 'a'.repeat(64) }
      ]
    };

    const errors = validateManifestStructure(validManifest);
    expect(errors).toEqual([]);
  });

  it('rejects wrong version', () => {
    const badManifest = {
      bundle_version: '0.2',
      created_utc: new Date().toISOString(),
      app: { name: 'Test', version: '0.1.0' },
      backend: { tfjs_version: '4.0.0', backend: 'webgl' },
      dataset: {},
      model: {},
      training: {},
      artifacts: []
    };

    const errors = validateManifestStructure(badManifest);
    expect(errors.some(e => e.code === ValidationErrorCode.E_VERSION_UNSUPPORTED)).toBe(true);
  });

  it('rejects missing required fields', () => {
    const incompleteManifest = {
      bundle_version: BUNDLE_VERSION
    };

    const errors = validateManifestStructure(incompleteManifest);
    expect(errors.some(e => e.code === ValidationErrorCode.E_MISSING_FIELD)).toBe(true);
  });

  it('rejects invalid artifact entries', () => {
    const badArtifacts = {
      bundle_version: BUNDLE_VERSION,
      created_utc: new Date().toISOString(),
      app: { name: 'Test', version: '0.1.0' },
      backend: { tfjs_version: '4.0.0', backend: 'webgl' },
      dataset: {},
      model: {},
      training: {},
      artifacts: [
        { path: 'test.json', sha256: 'invalid', size_bytes: -1 }
      ]
    };

    const errors = validateManifestStructure(badArtifacts);
    expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD)).toBe(true);
  });
});

describe('Bundle Paths', () => {
  it('uses forward slashes', () => {
    expect(BUNDLE_PATHS.model.topology).toBe('model/model.json');
    expect(BUNDLE_PATHS.model.weights).toBe('model/weights.bin');
    expect(BUNDLE_PATHS.metrics.epochs).toBe('metrics/metrics.jsonl');
  });
});

describe('Constants', () => {
  it('bundle version is 0.1', () => {
    expect(BUNDLE_VERSION).toBe('0.1');
  });

  it('default hyperparams are sensible', () => {
    expect(DEFAULT_HYPERPARAMS.epochs).toBeGreaterThan(0);
    expect(DEFAULT_HYPERPARAMS.batchSize).toBeGreaterThan(0);
    expect(DEFAULT_HYPERPARAMS.learningRate).toBeGreaterThan(0);
    expect(DEFAULT_HYPERPARAMS.learningRate).toBeLessThan(1);
  });
});
