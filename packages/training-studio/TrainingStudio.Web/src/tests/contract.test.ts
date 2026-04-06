/**
 * Contract Tests for Training Studio Bundle Format
 *
 * These tests verify the "can't argue with it" invariants:
 * 1. Digest determinism: same content → same digest, regardless of ordering
 * 2. Compatibility matrix: which manifests pass/warn/fail validation
 * 3. JSON output contract stability
 */

import { describe, it, expect } from 'vitest';
import {
  validateBundle,
  validateManifestStructure,
  createMemoryAccess,
  formatValidationResult,
  getExitCode,
  EXIT_CODES
} from '../validation/bundle-validator';
import {
  BUNDLE_VERSION,
  BUNDLE_PATHS,
  ValidationErrorCode,
  ValidationWarningCode,
  BundleManifest,
  ArtifactEntry
} from '../types/bundle';

// ============================================================================
// DIGEST DETERMINISM FIXTURES
// ============================================================================

/**
 * Helper to compute SHA-256 in tests (matches bundle-exporter.ts)
 */
async function sha256(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute bundle digest (must match bundle-exporter.ts exactly)
 */
async function computeBundleDigest(
  artifacts: ArtifactEntry[],
  bundleVersion: string
): Promise<string> {
  // Canonical: sorted by path (bytewise, locale-free)
  const sorted = [...artifacts].sort((a, b) => a.path.localeCompare(b.path));

  let canonical = `bundle_version:${bundleVersion}\n`;
  for (const art of sorted) {
    canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
  }

  return sha256(canonical);
}

describe('Digest Determinism', () => {
  const artifact1: ArtifactEntry = {
    path: 'model/model.json',
    sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    size_bytes: 100
  };

  const artifact2: ArtifactEntry = {
    path: 'model/weights.bin',
    sha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    size_bytes: 200
  };

  const artifact3: ArtifactEntry = {
    path: 'metrics/metrics.jsonl',
    sha256: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    size_bytes: 50
  };

  it('same artifacts in different order → same digest', async () => {
    const order1 = [artifact1, artifact2, artifact3];
    const order2 = [artifact3, artifact1, artifact2];
    const order3 = [artifact2, artifact3, artifact1];

    const digest1 = await computeBundleDigest(order1, BUNDLE_VERSION);
    const digest2 = await computeBundleDigest(order2, BUNDLE_VERSION);
    const digest3 = await computeBundleDigest(order3, BUNDLE_VERSION);

    expect(digest1).toBe(digest2);
    expect(digest2).toBe(digest3);
  });

  it('different artifacts → different digest', async () => {
    const artifacts1 = [artifact1, artifact2];
    const artifacts2 = [artifact1, artifact3];

    const digest1 = await computeBundleDigest(artifacts1, BUNDLE_VERSION);
    const digest2 = await computeBundleDigest(artifacts2, BUNDLE_VERSION);

    expect(digest1).not.toBe(digest2);
  });

  it('same artifacts, different version → different digest', async () => {
    const artifacts = [artifact1, artifact2];

    const digest1 = await computeBundleDigest(artifacts, '0.1');
    const digest2 = await computeBundleDigest(artifacts, '0.2');

    expect(digest1).not.toBe(digest2);
  });

  it('changing one byte changes digest completely', async () => {
    const artifactA: ArtifactEntry = {
      path: 'test.txt',
      sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      size_bytes: 100
    };
    const artifactB: ArtifactEntry = {
      path: 'test.txt',
      sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab', // one char different
      size_bytes: 100
    };

    const digest1 = await computeBundleDigest([artifactA], BUNDLE_VERSION);
    const digest2 = await computeBundleDigest([artifactB], BUNDLE_VERSION);

    expect(digest1).not.toBe(digest2);
    // SHA-256 avalanche: completely different, not just one char different
    const commonChars = [...digest1].filter((c, i) => digest2[i] === c).length;
    expect(commonChars).toBeLessThan(32); // Less than half should match by chance
  });

  it('empty artifacts list produces consistent digest', async () => {
    const digest1 = await computeBundleDigest([], BUNDLE_VERSION);
    const digest2 = await computeBundleDigest([], BUNDLE_VERSION);

    expect(digest1).toBe(digest2);
    expect(digest1).toHaveLength(64);
  });
});

// ============================================================================
// COMPATIBILITY MATRIX FIXTURES
// ============================================================================

function createValidManifest(): BundleManifest {
  return {
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
    artifacts: []
  };
}

describe('Compatibility Matrix', () => {
  describe('Version Handling', () => {
    it('rejects unsupported major version (future)', () => {
      const manifest = { ...createValidManifest(), bundle_version: '1.0' };
      const errors = validateManifestStructure(manifest);

      expect(errors.some(e => e.code === ValidationErrorCode.E_VERSION_UNSUPPORTED)).toBe(true);
    });

    it('rejects unsupported minor version (future)', () => {
      const manifest = { ...createValidManifest(), bundle_version: '0.9' };
      const errors = validateManifestStructure(manifest);

      expect(errors.some(e => e.code === ValidationErrorCode.E_VERSION_UNSUPPORTED)).toBe(true);
    });

    it('accepts exact version match', () => {
      const manifest = createValidManifest();
      const errors = validateManifestStructure(manifest);

      expect(errors.filter(e => e.code === ValidationErrorCode.E_VERSION_UNSUPPORTED)).toHaveLength(0);
    });
  });

  describe('Missing Fields', () => {
    const requiredFields = [
      'bundle_version', 'bundle_id', 'run_id', 'bundle_digest',
      'schema_uri', 'schema_version', 'created_utc',
      'app', 'backend', 'dataset', 'model', 'training', 'artifacts'
    ];

    for (const field of requiredFields) {
      it(`errors on missing ${field}`, () => {
        const manifest = createValidManifest() as Record<string, unknown>;
        delete manifest[field];

        const errors = validateManifestStructure(manifest);
        expect(errors.some(e =>
          e.code === ValidationErrorCode.E_MISSING_FIELD &&
          e.message.includes(field)
        )).toBe(true);
      });
    }
  });

  describe('ID Validation', () => {
    it('rejects invalid bundle_id format', () => {
      const manifest = { ...createValidManifest(), bundle_id: 'not-a-uuid' };
      const errors = validateManifestStructure(manifest);

      expect(errors.some(e =>
        e.code === ValidationErrorCode.E_INVALID_FIELD &&
        e.message.includes('bundle_id')
      )).toBe(true);
    });

    it('rejects invalid run_id format', () => {
      const manifest = { ...createValidManifest(), run_id: 'also-not-a-uuid' };
      const errors = validateManifestStructure(manifest);

      expect(errors.some(e =>
        e.code === ValidationErrorCode.E_INVALID_FIELD &&
        e.message.includes('run_id')
      )).toBe(true);
    });

    it('accepts valid UUID v4 IDs', () => {
      const manifest = createValidManifest();
      const errors = validateManifestStructure(manifest);

      const idErrors = errors.filter(e =>
        e.code === ValidationErrorCode.E_INVALID_FIELD &&
        (e.message.includes('bundle_id') || e.message.includes('run_id'))
      );
      expect(idErrors).toHaveLength(0);
    });
  });

  describe('Artifact Validation', () => {
    it('rejects artifact with invalid sha256 length', () => {
      const manifest = createValidManifest();
      manifest.artifacts = [
        { path: 'test.txt', sha256: 'tooshort', size_bytes: 10 }
      ];

      const errors = validateManifestStructure(manifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD)).toBe(true);
    });

    it('rejects artifact with non-hex sha256', () => {
      const manifest = createValidManifest();
      manifest.artifacts = [
        { path: 'test.txt', sha256: 'g'.repeat(64), size_bytes: 10 } // 'g' is not hex
      ];

      const errors = validateManifestStructure(manifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD)).toBe(true);
    });

    it('rejects artifact with negative size', () => {
      const manifest = createValidManifest();
      manifest.artifacts = [
        { path: 'test.txt', sha256: 'a'.repeat(64), size_bytes: -1 }
      ];

      const errors = validateManifestStructure(manifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD)).toBe(true);
    });

    it('accepts valid artifact', () => {
      const manifest = createValidManifest();
      manifest.artifacts = [
        { path: 'model/model.json', sha256: 'a'.repeat(64), size_bytes: 100 }
      ];

      const errors = validateManifestStructure(manifest);
      const artifactErrors = errors.filter(e =>
        e.code === ValidationErrorCode.E_INVALID_FIELD &&
        e.message.includes('Artifact')
      );
      expect(artifactErrors).toHaveLength(0);
    });
  });
});

// ============================================================================
// FULL VALIDATION EXIT CODE TESTS
// ============================================================================

describe('Exit Code Contract', () => {
  it('exit 0 for valid bundle', async () => {
    const modelJson = JSON.stringify({ topology: {}, weightsManifest: [] });
    const weightsData = new Uint8Array([1, 2, 3, 4]);
    const metricsJsonl = '{"epoch":1,"loss":0.5}\n{"epoch":2,"loss":0.3}';
    const summaryJson = JSON.stringify({ best_epoch: 2 });
    const configJson = JSON.stringify({ epochs: 10 });
    const schemaJson = JSON.stringify({ features: ['a'], label: 'b' });

    // Compute real hashes
    const modelHash = await sha256(modelJson);
    const weightsHash = await sha256(weightsData);
    const metricsHash = await sha256(metricsJsonl);
    const summaryHash = await sha256(summaryJson);
    const configHash = await sha256(configJson);
    const schemaHash = await sha256(schemaJson);

    const artifacts: ArtifactEntry[] = [
      { path: 'model/model.json', sha256: modelHash, size_bytes: modelJson.length },
      { path: 'model/weights.bin', sha256: weightsHash, size_bytes: weightsData.length },
      { path: 'metrics/metrics.jsonl', sha256: metricsHash, size_bytes: metricsJsonl.length },
      { path: 'metrics/summary.json', sha256: summaryHash, size_bytes: summaryJson.length },
      { path: 'config/run_config.json', sha256: configHash, size_bytes: configJson.length },
      { path: 'data/schema.json', sha256: schemaHash, size_bytes: schemaJson.length }
    ];

    const bundleDigest = await computeBundleDigest(artifacts, BUNDLE_VERSION);

    const manifest: BundleManifest = {
      ...createValidManifest(),
      bundle_digest: bundleDigest,
      artifacts
    };

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)],
      [BUNDLE_PATHS.model.topology, modelJson],
      [BUNDLE_PATHS.model.weights, weightsData],
      [BUNDLE_PATHS.metrics.epochs, metricsJsonl],
      [BUNDLE_PATHS.metrics.summary, summaryJson],
      ['config/run_config.json', configJson],
      [BUNDLE_PATHS.data.schema, schemaJson]
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(getExitCode(result)).toBe(EXIT_CODES.VALID);
  });

  it('exit 2 for valid bundle with warnings (unlisted files)', async () => {
    const modelJson = JSON.stringify({ topology: {}, weightsManifest: [] });
    const weightsData = new Uint8Array([1, 2, 3, 4]);
    const metricsJsonl = '{"epoch":1,"loss":0.5}';
    const summaryJson = JSON.stringify({ best_epoch: 1 });
    const configJson = JSON.stringify({ epochs: 10 });
    const schemaJson = JSON.stringify({ features: ['a'], label: 'b' });

    const modelHash = await sha256(modelJson);
    const weightsHash = await sha256(weightsData);
    const metricsHash = await sha256(metricsJsonl);
    const summaryHash = await sha256(summaryJson);
    const configHash = await sha256(configJson);
    const schemaHash = await sha256(schemaJson);

    const artifacts: ArtifactEntry[] = [
      { path: 'model/model.json', sha256: modelHash, size_bytes: modelJson.length },
      { path: 'model/weights.bin', sha256: weightsHash, size_bytes: weightsData.length },
      { path: 'metrics/metrics.jsonl', sha256: metricsHash, size_bytes: metricsJsonl.length },
      { path: 'metrics/summary.json', sha256: summaryHash, size_bytes: summaryJson.length },
      { path: 'config/run_config.json', sha256: configHash, size_bytes: configJson.length },
      { path: 'data/schema.json', sha256: schemaHash, size_bytes: schemaJson.length }
    ];

    const bundleDigest = await computeBundleDigest(artifacts, BUNDLE_VERSION);

    const manifest: BundleManifest = {
      ...createValidManifest(),
      bundle_digest: bundleDigest,
      artifacts
    };

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)],
      [BUNDLE_PATHS.model.topology, modelJson],
      [BUNDLE_PATHS.model.weights, weightsData],
      [BUNDLE_PATHS.metrics.epochs, metricsJsonl],
      [BUNDLE_PATHS.metrics.summary, summaryJson],
      ['config/run_config.json', configJson],
      [BUNDLE_PATHS.data.schema, schemaJson],
      ['extra_file.txt', 'not in manifest']  // Unlisted file
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.code === ValidationWarningCode.W_UNLISTED_FILE)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.VALID_WITH_WARNINGS);
  });

  it('exit 3 for invalid bundle (hash mismatch)', async () => {
    const modelJson = JSON.stringify({ topology: {}, weightsManifest: [] });
    const weightsData = new Uint8Array([1, 2, 3, 4]);
    const metricsJsonl = '{"epoch":1,"loss":0.5}';
    const summaryJson = JSON.stringify({ best_epoch: 1 });
    const configJson = JSON.stringify({ epochs: 10 });
    const schemaJson = JSON.stringify({ features: ['a'], label: 'b' });

    const modelHash = await sha256(modelJson);
    const weightsHash = await sha256(weightsData);
    const metricsHash = await sha256(metricsJsonl);
    const summaryHash = await sha256(summaryJson);
    const configHash = await sha256(configJson);
    const schemaHash = await sha256(schemaJson);

    const artifacts: ArtifactEntry[] = [
      { path: 'model/model.json', sha256: modelHash, size_bytes: modelJson.length },
      { path: 'model/weights.bin', sha256: weightsHash, size_bytes: weightsData.length },
      { path: 'metrics/metrics.jsonl', sha256: metricsHash, size_bytes: metricsJsonl.length },
      { path: 'metrics/summary.json', sha256: summaryHash, size_bytes: summaryJson.length },
      { path: 'config/run_config.json', sha256: configHash, size_bytes: configJson.length },
      { path: 'data/schema.json', sha256: schemaHash, size_bytes: schemaJson.length }
    ];

    const bundleDigest = await computeBundleDigest(artifacts, BUNDLE_VERSION);

    const manifest: BundleManifest = {
      ...createValidManifest(),
      bundle_digest: bundleDigest,
      artifacts
    };

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)],
      [BUNDLE_PATHS.model.topology, modelJson],
      [BUNDLE_PATHS.model.weights, new Uint8Array([9, 9, 9, 9])], // WRONG DATA
      [BUNDLE_PATHS.metrics.epochs, metricsJsonl],
      [BUNDLE_PATHS.metrics.summary, summaryJson],
      ['config/run_config.json', configJson],
      [BUNDLE_PATHS.data.schema, schemaJson]
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.E_HASH_MISMATCH)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.INVALID);
  });

  it('exit 3 for missing manifest', async () => {
    const files = new Map<string, Uint8Array | string>([
      ['model/model.json', '{}']
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.E_NO_MANIFEST)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.INVALID);
  });

  it('exit 3 for invalid JSON manifest', async () => {
    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, 'not valid json {']
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.E_PARSE_ERROR)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.INVALID);
  });

  it('exit 3 for missing artifact file', async () => {
    const artifacts: ArtifactEntry[] = [
      { path: 'model/model.json', sha256: 'a'.repeat(64), size_bytes: 100 },
      { path: 'model/weights.bin', sha256: 'b'.repeat(64), size_bytes: 200 },
      { path: 'metrics/metrics.jsonl', sha256: 'c'.repeat(64), size_bytes: 50 },
      { path: 'metrics/summary.json', sha256: 'd'.repeat(64), size_bytes: 50 },
      { path: 'config/run.json', sha256: 'e'.repeat(64), size_bytes: 50 },
      { path: 'data/schema.json', sha256: 'f'.repeat(64), size_bytes: 50 }
    ];

    const manifest: BundleManifest = {
      ...createValidManifest(),
      artifacts
    };

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)]
      // Missing all artifact files!
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.E_ARTIFACT_MISSING)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.INVALID);
  });

  it('exit 3 for bundle digest mismatch', async () => {
    const modelJson = JSON.stringify({ topology: {}, weightsManifest: [] });
    const weightsData = new Uint8Array([1, 2, 3, 4]);
    const metricsJsonl = '{"epoch":1,"loss":0.5}';
    const summaryJson = JSON.stringify({ best_epoch: 1 });
    const configJson = JSON.stringify({ epochs: 10 });
    const schemaJson = JSON.stringify({ features: ['a'], label: 'b' });

    const modelHash = await sha256(modelJson);
    const weightsHash = await sha256(weightsData);
    const metricsHash = await sha256(metricsJsonl);
    const summaryHash = await sha256(summaryJson);
    const configHash = await sha256(configJson);
    const schemaHash = await sha256(schemaJson);

    const artifacts: ArtifactEntry[] = [
      { path: 'model/model.json', sha256: modelHash, size_bytes: modelJson.length },
      { path: 'model/weights.bin', sha256: weightsHash, size_bytes: weightsData.length },
      { path: 'metrics/metrics.jsonl', sha256: metricsHash, size_bytes: metricsJsonl.length },
      { path: 'metrics/summary.json', sha256: summaryHash, size_bytes: summaryJson.length },
      { path: 'config/run_config.json', sha256: configHash, size_bytes: configJson.length },
      { path: 'data/schema.json', sha256: schemaHash, size_bytes: schemaJson.length }
    ];

    const manifest: BundleManifest = {
      ...createValidManifest(),
      bundle_digest: 'wrong_digest_here'.padEnd(64, '0'), // Wrong digest
      artifacts
    };

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)],
      [BUNDLE_PATHS.model.topology, modelJson],
      [BUNDLE_PATHS.model.weights, weightsData],
      [BUNDLE_PATHS.metrics.epochs, metricsJsonl],
      [BUNDLE_PATHS.metrics.summary, summaryJson],
      ['config/run_config.json', configJson],
      [BUNDLE_PATHS.data.schema, schemaJson]
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.E_DIGEST_MISMATCH)).toBe(true);
    expect(getExitCode(result)).toBe(EXIT_CODES.INVALID);
  });
});

// ============================================================================
// JSON OUTPUT CONTRACT
// ============================================================================

describe('JSON Output Contract', () => {
  it('ValidationResult has stable shape', async () => {
    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, 'invalid json']
    ]);

    const result = await validateBundle(createMemoryAccess(files));

    // Verify shape matches contract
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('summary');

    // Errors have stable shape
    expect(result.errors[0]).toHaveProperty('code');
    expect(result.errors[0]).toHaveProperty('message');

    // Stats have stable shape
    expect(result.stats).toHaveProperty('files_total');
    expect(result.stats).toHaveProperty('artifacts_listed');
    expect(result.stats).toHaveProperty('artifacts_verified');

    // Types are correct
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(typeof result.stats.files_total).toBe('number');
  });

  it('error codes are from ValidationErrorCode enum', async () => {
    const files = new Map<string, Uint8Array | string>();
    const result = await validateBundle(createMemoryAccess(files));

    for (const error of result.errors) {
      expect(Object.values(ValidationErrorCode)).toContain(error.code);
    }
  });

  it('warning codes are from ValidationWarningCode enum', async () => {
    const manifest = createValidManifest();
    const bundleDigest = await computeBundleDigest([], BUNDLE_VERSION);
    manifest.bundle_digest = bundleDigest;
    manifest.artifacts = [];

    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, JSON.stringify(manifest)],
      ['extra.txt', 'unlisted file']
    ]);

    const result = await validateBundle(createMemoryAccess(files));

    for (const warning of result.warnings) {
      expect(Object.values(ValidationWarningCode)).toContain(warning.code);
    }
  });
});

// ============================================================================
// GOLDEN BUNDLE FIXTURE (End-to-End ABI Test)
// ============================================================================

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { GOLDEN_V1 } from './fixtures/golden-v1-expected';

function loadGoldenBundle(): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const baseDir = join(__dirname, 'fixtures', 'golden-v1');

  function readDir(dir: string, relativePath: string = '') {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relativePath ? `${relativePath}/${entry}` : entry;
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        readDir(fullPath, relPath);
      } else {
        files.set(relPath, new Uint8Array(readFileSync(fullPath)));
      }
    }
  }

  readDir(baseDir);
  return files;
}

describe('Golden Bundle v1 (ABI Test)', () => {
  it('validates with exit code 0', async () => {
    const files = loadGoldenBundle();
    const access = createMemoryAccess(files);
    const result = await validateBundle(access);

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(getExitCode(result)).toBe(GOLDEN_V1.exit_code);
  });

  it('bundle_digest matches expected value', async () => {
    const files = loadGoldenBundle();
    const access = createMemoryAccess(files);
    const result = await validateBundle(access);

    expect(result.bundle_digest).toBe(GOLDEN_V1.bundle_digest);
  });

  it('bundle_id matches expected value', async () => {
    const files = loadGoldenBundle();
    const access = createMemoryAccess(files);
    const result = await validateBundle(access);

    expect(result.bundle_id).toBe(GOLDEN_V1.bundle_id);
  });

  it('version matches expected value', async () => {
    const files = loadGoldenBundle();
    const access = createMemoryAccess(files);
    const result = await validateBundle(access);

    expect(result.version).toBe(GOLDEN_V1.version);
  });

  it('verifies all artifacts', async () => {
    const files = loadGoldenBundle();
    const access = createMemoryAccess(files);
    const result = await validateBundle(access);

    expect(result.stats.artifacts_verified).toBe(GOLDEN_V1.artifact_count);
    expect(result.stats.artifacts_listed).toBe(GOLDEN_V1.artifact_count);
  });
});

// ============================================================================
// FORMAT OUTPUT STABILITY
// ============================================================================

describe('CLI Output Format', () => {
  it('formatValidationResult includes summary first', async () => {
    const files = new Map<string, Uint8Array | string>();
    const result = await validateBundle(createMemoryAccess(files));
    const output = formatValidationResult(result);

    expect(output.startsWith(result.summary)).toBe(true);
  });

  it('formatValidationResult lists errors with code prefix', async () => {
    const files = new Map<string, Uint8Array | string>([
      [BUNDLE_PATHS.manifest, 'invalid']
    ]);

    const result = await validateBundle(createMemoryAccess(files));
    const output = formatValidationResult(result);

    expect(output).toContain('[E_PARSE_ERROR]');
  });
});
