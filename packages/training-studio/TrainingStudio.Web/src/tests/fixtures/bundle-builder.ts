/**
 * Bundle Test Builder
 *
 * Helpers for creating test bundles with realistic structure,
 * similar to TestDbHelper pattern in ControlRoom.
 *
 * Usage:
 *   const bundle = new BundleBuilder()
 *     .withVersion('0.1')
 *     .addArtifact('model/model.json', JSON.stringify(modelData))
 *     .build();
 */

interface BundleArtifact {
  path: string;
  content: string | Uint8Array;
  mimeType?: string;
}

interface ManifestArtifact {
  path: string;
  sha256: string;
  size_bytes: number;
}

import { createHash } from 'crypto';

/**
 * Compute SHA-256 hash of data (sync version for test fixtures)
 * Uses Node.js crypto for consistency with what Web Crypto produces
 */
function sha256Sync(data: Uint8Array | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : Buffer.from(data);
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compute bundle digest from artifacts (matches bundle-validator.ts format)
 */
function computeBundleDigest(
  artifacts: ManifestArtifact[],
  bundleVersion: string
): string {
  const sorted = [...artifacts].sort((a, b) => a.path.localeCompare(b.path));
  let canonical = `bundle_version:${bundleVersion}\n`;
  for (const art of sorted) {
    canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
  }
  return sha256Sync(canonical);
}

/**
 * Builder for creating test bundles
 */
export class BundleBuilder {
  private version = '0.1';
  private bundleId = '00000000-0000-4000-8000-000000000000';
  private runId = '11111111-1111-4111-8111-111111111111';
  private schemaUri = 'https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json';
  private schemaVersion = '0.1';
  private artifacts: BundleArtifact[] = [];
  private metadata: Record<string, unknown> = {
    app: { name: 'Training Studio', version: '0.1.0' },
    backend: { name: 'TensorFlow.js', version: '4.22.0' },
    dataset: { name: 'test-dataset', rows: 100 },
    model: { type: 'sequential', layers: 3 },
    training: { epochs: 10, batchSize: 32, validationSplit: 0.2 }
  };

  withVersion(version: string): this {
    this.version = version;
    return this;
  }

  withBundleId(id: string): this {
    this.bundleId = id;
    return this;
  }

  withRunId(id: string): this {
    this.runId = id;
    return this;
  }

  addArtifact(path: string, content: string | Uint8Array): this {
    this.artifacts.push({ path, content });
    return this;
  }

  /**
   * Add standard required artifacts for a valid bundle
   */
  withRequiredArtifacts(): this {
    // Model topology
    this.addArtifact('model/model.json', JSON.stringify({
      modelTopology: {
        class_name: 'Sequential',
        config: [
          { class_name: 'Dense', config: { units: 64, activation: 'relu', inputShape: [4] } },
          { class_name: 'Dropout', config: { rate: 0.2 } },
          { class_name: 'Dense', config: { units: 32, activation: 'relu' } },
          { class_name: 'Dense', config: { units: 3, activation: 'softmax' } }
        ]
      },
      weightsManifest: [{ paths: ['weights.bin'] }],
      kerasVersion: '2.4.0'
    }, null, 2));

    // Model weights (minimal binary placeholder)
    this.addArtifact('model/weights.bin', new Uint8Array([0x00, 0x00, 0x00, 0x00]));

    // Metrics summary
    this.addArtifact('metrics/summary.json', JSON.stringify({
      finalEpoch: 10,
      bestEpoch: 8,
      trainLoss: 0.1234,
      valLoss: 0.1567,
      trainAccuracy: 0.9876,
      valAccuracy: 0.9543,
      trainingTime: 125.34
    }, null, 2));

    // Metrics per epoch (JSONL format)
    const metricsLines = [
      JSON.stringify({ epoch: 1, loss: 0.8234, accuracy: 0.5432, valLoss: 0.8012, valAccuracy: 0.5678 }),
      JSON.stringify({ epoch: 2, loss: 0.5234, accuracy: 0.7432, valLoss: 0.5412, valAccuracy: 0.7278 }),
      JSON.stringify({ epoch: 3, loss: 0.3234, accuracy: 0.8532, valLoss: 0.3512, valAccuracy: 0.8378 })
    ];
    this.addArtifact('metrics/metrics.jsonl', metricsLines.join('\n'));

    // Run config (hyperparameters)
    this.addArtifact('config/run_config.json', JSON.stringify({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      seed: 42,
      shuffleBuffer: 1000
    }, null, 2));

    // Data schema
    this.addArtifact('data/schema.json', JSON.stringify({
      version: '0.1',
      features: [
        { name: 'sepal_length', type: 'float32', shape: [] },
        { name: 'sepal_width', type: 'float32', shape: [] },
        { name: 'petal_length', type: 'float32', shape: [] },
        { name: 'petal_width', type: 'float32', shape: [] }
      ],
      label: { name: 'species', type: 'int32', classes: 3, shape: [] }
    }, null, 2));

    return this;
  }

  /**
   * Build and return the bundle manifest + in-memory file system
   */
  build(): {
    manifest: Record<string, unknown>;
    files: Map<string, Uint8Array>;
    fileList: string[];
  } {
    // Convert all artifacts to Uint8Array
    const files = new Map<string, Uint8Array>();
    const manifestArtifacts: ManifestArtifact[] = [];

    for (const artifact of this.artifacts) {
      let buffer: Uint8Array;
      if (typeof artifact.content === 'string') {
        buffer = new TextEncoder().encode(artifact.content);
      } else {
        buffer = artifact.content;
      }

      files.set(artifact.path, buffer);

      // Compute real SHA-256 hash
      const hash = sha256Sync(buffer);
      manifestArtifacts.push({
        path: artifact.path,
        sha256: hash,
        size_bytes: buffer.length
      });
    }

    // Compute bundle digest
    const bundleDigest = computeBundleDigest(manifestArtifacts, this.version);

    // Create manifest
    const manifest = {
      bundle_version: this.version,
      bundle_id: this.bundleId,
      run_id: this.runId,
      bundle_digest: bundleDigest,
      schema_uri: this.schemaUri,
      schema_version: this.schemaVersion,
      created_utc: new Date().toISOString(),
      app: this.metadata.app,
      backend: this.metadata.backend,
      dataset: this.metadata.dataset,
      model: this.metadata.model,
      training: this.metadata.training,
      artifacts: manifestArtifacts
    };

    // Add manifest to files
    const manifestJson = JSON.stringify(manifest, null, 2);
    files.set('bundle.json', new TextEncoder().encode(manifestJson));

    return {
      manifest,
      files,
      fileList: Array.from(files.keys())
    };
  }
}

/**
 * Create in-memory bundle access for validation testing
 */
export function createMemoryBundleAccess(files: Map<string, Uint8Array>, fileList: string[]) {
  return {
    readFile: async (path: string) => files.get(path) || null,
    fileExists: async (path: string) => files.has(path),
    listFiles: async () => fileList
  };
}

/**
 * Quick builders for common test scenarios
 */
export const BundleFixtures = {
  /**
   * Valid bundle with all required artifacts
   */
  validBundle(): {
    manifest: Record<string, unknown>;
    files: Map<string, Uint8Array>;
    access: ReturnType<typeof createMemoryBundleAccess>;
  } {
    const { manifest, files, fileList } = new BundleBuilder()
      .withRequiredArtifacts()
      .build();
    return {
      manifest,
      files,
      access: createMemoryBundleAccess(files, fileList)
    };
  },

  /**
   * Bundle missing required file
   */
  missingArtifactBundle(): {
    manifest: Record<string, unknown>;
    files: Map<string, Uint8Array>;
    access: ReturnType<typeof createMemoryBundleAccess>;
  } {
    const { manifest, files, fileList } = new BundleBuilder()
      .addArtifact('model/model.json', JSON.stringify({ modelTopology: {} }))
      .addArtifact('metrics/summary.json', JSON.stringify({}))
      .addArtifact('config/run_config.json', JSON.stringify({}))
      // Missing model/weights.bin, metrics/metrics.jsonl, and data/schema.json
      .build();
    return {
      manifest,
      files,
      access: createMemoryBundleAccess(files, fileList)
    };
  },

  /**
   * Bundle with corrupted file hash (mismatch)
   */
  corruptedHashBundle(): {
    manifest: Record<string, unknown>;
    files: Map<string, Uint8Array>;
    access: ReturnType<typeof createMemoryBundleAccess>;
  } {
    const { manifest, files, fileList } = new BundleBuilder()
      .withRequiredArtifacts()
      .build();

    // Mutate manifest to have wrong hash for model.json
    if (Array.isArray((manifest as any).artifacts)) {
      const artifacts = (manifest as any).artifacts;
      const modelArtifact = artifacts.find((a: any) => a.path === 'model/model.json');
      if (modelArtifact) {
        modelArtifact.sha256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      }
      // Recompute bundle digest since it's now wrong
      const sorted = [...artifacts].sort((a: any, b: any) => a.path.localeCompare(b.path));
      let canonical = `bundle_version:${manifest.bundle_version}\n`;
      for (const art of sorted) {
        canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
      }
      (manifest as any).bundle_digest = sha256Sync(canonical);

      // Re-serialize the manifest with the corrupted hash
      const manifestJson = JSON.stringify(manifest, null, 2);
      files.set('bundle.json', new TextEncoder().encode(manifestJson));
    }

    return {
      manifest,
      files,
      access: createMemoryBundleAccess(files, fileList)
    };
  },

  /**
   * Bundle with extra unlisted files (should warn)
   */
  extraFilesBundle(): {
    manifest: Record<string, unknown>;
    files: Map<string, Uint8Array>;
    access: ReturnType<typeof createMemoryBundleAccess>;
  } {
    const { manifest, files, fileList } = new BundleBuilder()
      .withRequiredArtifacts()
      .build();

    // Add extra file not in manifest
    const extraContent = new TextEncoder().encode('extra metadata');
    files.set('README.md', extraContent);

    // fileList includes the extra file (simulating listFiles() output)
    const updatedFileList = [...fileList, 'README.md'];

    return {
      manifest,
      files,
      access: createMemoryBundleAccess(files, updatedFileList)
    };
  }
};
