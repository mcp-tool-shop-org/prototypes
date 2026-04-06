import * as tf from '@tensorflow/tfjs';
import {
  BUNDLE_VERSION,
  BUNDLE_PATHS,
  SCHEMA_URI,
  BundleManifest,
  AppInfo,
  BackendInfo,
  DatasetInfo,
  ModelInfo,
  TrainingInfo,
  LayerSummary,
  ArtifactEntry,
  EpochMetric,
  MetricsSummary,
  HyperparamsRecord
} from '../types/bundle';
import { LoadedDataset } from './data-loader';
import { HyperParams, ModelPreset } from './model-factory';
import { TrainingMetrics } from './trainer';

const APP_VERSION = '0.1.0';
const APP_NAME = 'Training Studio';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Compute bundle digest from sorted artifact list
 * Format: path\nsha256\nsize_bytes for each artifact, sorted by path
 */
async function computeBundleDigest(
  artifacts: ArtifactEntry[],
  bundleVersion: string
): Promise<string> {
  const sorted = [...artifacts].sort((a, b) => a.path.localeCompare(b.path));

  let canonical = `bundle_version:${bundleVersion}\n`;
  for (const art of sorted) {
    canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
  }

  return sha256(canonical);
}

/**
 * Compute dataset ID from content hash
 */
async function computeDatasetId(
  sourceFile: string,
  features: string[],
  label: string,
  totalRows: number
): Promise<string> {
  const content = `${sourceFile}|${features.join(',')}|${label}|${totalRows}`;
  const hash = await sha256(content);
  return hash.substring(0, 16); // Short ID
}

export interface RunContext {
  model: tf.Sequential;
  dataset: LoadedDataset;
  hyperparams: HyperParams;
  modelPreset: ModelPreset;
  sourceFileName: string;
  featureColumns: string[];
  labelColumn: string;
  metrics: TrainingMetrics;
  epochMetrics: EpochMetric[];
  trainingDurationMs: number;
  earlyStopped: boolean;
}

export interface ExportBundle {
  manifest: BundleManifest;
  files: Map<string, Uint8Array | string>;
}

/**
 * Get current TF.js backend information
 */
export async function getBackendInfo(): Promise<BackendInfo> {
  const backend = tf.getBackend();
  let deviceInfo: string | undefined;

  // Try to get WebGPU adapter info if available
  if (backend === 'webgpu' && 'gpu' in navigator) {
    try {
      const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
      if (adapter) {
        const info = await adapter.requestAdapterInfo();
        deviceInfo = `${info.vendor} ${info.architecture} (${info.device})`;
      }
    } catch {
      // WebGPU info not available
    }
  }

  // Get WebGL renderer info if WebGL backend
  if (backend === 'webgl') {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          deviceInfo = renderer;
        }
      }
    } catch {
      // WebGL info not available
    }
  }

  return {
    tfjs_version: tf.version.tfjs,
    backend: backend as BackendInfo['backend'],
    device_info: deviceInfo,
    flags: tf.env().features
  };
}

/**
 * Extract model layer information
 */
function extractModelInfo(
  model: tf.Sequential,
  preset: ModelPreset,
  dataset: LoadedDataset
): ModelInfo {
  const layers: LayerSummary[] = model.layers.map(layer => {
    const config = layer.getConfig();
    const outputShape = layer.outputShape;

    return {
      name: layer.name,
      type: layer.getClassName(),
      output_shape: Array.isArray(outputShape[0])
        ? (outputShape as number[][]).flat()
        : outputShape as number[],
      params: layer.countParams(),
      config: config as Record<string, unknown>
    };
  });

  let totalParams = 0;
  let trainableParams = 0;
  model.layers.forEach(layer => {
    const params = layer.countParams();
    totalParams += params;
    if (layer.trainable) trainableParams += params;
  });

  return {
    preset,
    input_shape: dataset.featureCount,
    output_shape: dataset.labelInfo.numClasses ?? 1,
    task_type: dataset.labelInfo.type,
    num_classes: dataset.labelInfo.numClasses,
    class_labels: dataset.labelInfo.classLabels,
    layer_config: layers,
    total_params: totalParams,
    trainable_params: trainableParams
  };
}

/**
 * Compute SHA-256 hash of data
 */
async function sha256(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;

  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as Uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute metrics summary including best epoch and optional confusion matrix
 */
function computeMetricsSummary(
  metrics: TrainingMetrics,
  epochMetrics: EpochMetric[],
  durationMs: number,
  earlyStopped: boolean,
  labelInfo: { type: string; numClasses?: number; classLabels?: string[] }
): MetricsSummary {
  // Find best epoch by validation loss (or training loss if no validation)
  let bestEpoch = 0;
  let bestValLoss = Infinity;

  if (metrics.valLoss.length > 0) {
    metrics.valLoss.forEach((loss, i) => {
      if (loss < bestValLoss) {
        bestValLoss = loss;
        bestEpoch = i + 1;
      }
    });
  } else {
    metrics.loss.forEach((loss, i) => {
      if (loss < bestValLoss) {
        bestValLoss = loss;
        bestEpoch = i + 1;
      }
    });
  }

  const lastIdx = metrics.loss.length - 1;

  return {
    best_epoch: bestEpoch,
    best_val_loss: metrics.valLoss.length > 0 ? Math.min(...metrics.valLoss) : undefined,
    best_val_accuracy: metrics.valAccuracy.length > 0 ? Math.max(...metrics.valAccuracy) : undefined,
    final_train_loss: metrics.loss[lastIdx],
    final_train_accuracy: metrics.accuracy.length > 0 ? metrics.accuracy[lastIdx] : undefined,
    final_val_loss: metrics.valLoss.length > 0 ? metrics.valLoss[lastIdx] : undefined,
    final_val_accuracy: metrics.valAccuracy.length > 0 ? metrics.valAccuracy[lastIdx] : undefined,
    class_labels: labelInfo.classLabels,
    total_epochs: metrics.epochs.length,
    early_stopped: earlyStopped,
    training_duration_ms: durationMs
  };
}

/**
 * Save model and extract artifacts
 */
async function extractModelArtifacts(model: tf.Sequential): Promise<{
  modelJson: string;
  weightsBuffer: Uint8Array;
}> {
  const artifacts = await new Promise<tf.io.ModelArtifacts>((resolve, reject) => {
    model.save(tf.io.withSaveHandler(async (arts) => {
      resolve(arts);
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON' as const
        }
      };
    })).catch(reject);
  });

  const modelJson = JSON.stringify({
    modelTopology: artifacts.modelTopology,
    weightsManifest: [{
      paths: ['weights.bin'],
      weights: artifacts.weightSpecs
    }]
  }, null, 2);

  let weightsBuffer: Uint8Array;
  if (artifacts.weightData) {
    const weightData = artifacts.weightData;
    if (Array.isArray(weightData)) {
      const totalLength = weightData.reduce((sum, buf) => sum + buf.byteLength, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const buf of weightData) {
        combined.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
      }
      weightsBuffer = combined;
    } else {
      weightsBuffer = new Uint8Array(weightData);
    }
  } else {
    weightsBuffer = new Uint8Array(0);
  }

  return { modelJson, weightsBuffer };
}

/**
 * Create a complete export bundle from a training run
 */
export async function createExportBundle(context: RunContext): Promise<ExportBundle> {
  const files = new Map<string, Uint8Array | string>();
  const artifacts: ArtifactEntry[] = [];

  // Get backend info
  const backendInfo = await getBackendInfo();

  // Extract model artifacts
  const { modelJson, weightsBuffer } = await extractModelArtifacts(context.model);

  // Model files
  files.set(BUNDLE_PATHS.model.topology, modelJson);
  files.set(BUNDLE_PATHS.model.weights, weightsBuffer);

  // Metrics files
  const metricsJsonl = context.epochMetrics
    .map(m => JSON.stringify(m))
    .join('\n');
  files.set(BUNDLE_PATHS.metrics.epochs, metricsJsonl);

  const metricsSummary = computeMetricsSummary(
    context.metrics,
    context.epochMetrics,
    context.trainingDurationMs,
    context.earlyStopped,
    context.dataset.labelInfo
  );
  files.set(BUNDLE_PATHS.metrics.summary, JSON.stringify(metricsSummary, null, 2));

  // Config file
  const runConfig: HyperparamsRecord = {
    epochs: context.hyperparams.epochs,
    batch_size: context.hyperparams.batchSize,
    learning_rate: context.hyperparams.learningRate,
    optimizer: context.hyperparams.optimizer,
    early_stopping: context.hyperparams.earlyStopping,
    patience: context.hyperparams.patience
  };
  files.set(BUNDLE_PATHS.config.run, JSON.stringify(runConfig, null, 2));

  // Data schema
  const dataSchema = {
    features: context.featureColumns,
    label: context.labelColumn,
    normalization: context.dataset.stats.featureMeans ? {
      feature_means: context.dataset.stats.featureMeans,
      feature_stds: context.dataset.stats.featureStds
    } : null,
    label_info: context.dataset.labelInfo
  };
  files.set(BUNDLE_PATHS.data.schema, JSON.stringify(dataSchema, null, 2));

  // Compute SHA-256 for all files
  for (const [path, content] of files) {
    const data = typeof content === 'string'
      ? new TextEncoder().encode(content)
      : content;
    const hash = await sha256(data);

    artifacts.push({
      path,
      size_bytes: data.byteLength,
      sha256: hash
    });
  }

  // Generate IDs
  const bundleId = generateUUID();
  const runId = generateUUID();
  const datasetId = await computeDatasetId(
    context.sourceFileName,
    context.featureColumns,
    context.labelColumn,
    context.dataset.stats.totalSamples
  );

  // Compute bundle digest
  const bundleDigest = await computeBundleDigest(artifacts, BUNDLE_VERSION);

  // Build manifest
  const now = new Date();
  const appInfo: AppInfo = {
    name: APP_NAME,
    version: APP_VERSION
  };

  const datasetInfo: DatasetInfo = {
    dataset_id: datasetId,
    source_file: context.sourceFileName,
    total_rows: context.dataset.stats.totalSamples,
    train_rows: context.dataset.stats.trainSamples,
    val_rows: context.dataset.stats.valSamples,
    features: context.featureColumns,
    label: context.labelColumn,
    split_seed: context.dataset.reproducibility.seed,
    train_indices_hash: context.dataset.reproducibility.trainIndicesHash,
    val_indices_hash: context.dataset.reproducibility.valIndicesHash,
    normalization: context.dataset.stats.featureMeans ? {
      feature_means: context.dataset.stats.featureMeans,
      feature_stds: context.dataset.stats.featureStds!
    } : null
  };

  const modelInfo = extractModelInfo(context.model, context.modelPreset, context.dataset);

  const trainingInfo: TrainingInfo = {
    hyperparams: runConfig,
    epochs_completed: context.metrics.epochs.length,
    epochs_requested: context.hyperparams.epochs,
    early_stopped: context.earlyStopped,
    best_epoch: metricsSummary.best_epoch,
    final_metrics: {
      train_loss: metricsSummary.final_train_loss,
      train_accuracy: metricsSummary.final_train_accuracy,
      val_loss: metricsSummary.final_val_loss,
      val_accuracy: metricsSummary.final_val_accuracy,
      best_val_loss: metricsSummary.best_val_loss,
      best_val_accuracy: metricsSummary.best_val_accuracy
    },
    duration_ms: context.trainingDurationMs
  };

  const manifest: BundleManifest = {
    // Identity
    bundle_version: BUNDLE_VERSION,
    bundle_id: bundleId,
    run_id: runId,
    bundle_digest: bundleDigest,

    // Schema reference
    schema_uri: SCHEMA_URI,
    schema_version: BUNDLE_VERSION,

    // Timestamp
    created_utc: now.toISOString(),

    // Provenance
    app: appInfo,
    backend: backendInfo,

    // Content
    dataset: datasetInfo,
    model: modelInfo,
    training: trainingInfo,
    artifacts
  };

  // Add manifest to files
  const manifestJson = JSON.stringify(manifest, null, 2);
  files.set(BUNDLE_PATHS.manifest, manifestJson);

  return { manifest, files };
}

/**
 * Convert bundle to format suitable for bridge transfer
 */
export function bundleToTransfer(bundle: ExportBundle): {
  manifest: BundleManifest;
  filesBase64: Record<string, string>;
} {
  const filesBase64: Record<string, string> = {};

  for (const [path, content] of bundle.files) {
    if (typeof content === 'string') {
      filesBase64[path] = btoa(unescape(encodeURIComponent(content)));
    } else {
      let binary = '';
      for (let i = 0; i < content.length; i++) {
        binary += String.fromCharCode(content[i]);
      }
      filesBase64[path] = btoa(binary);
    }
  }

  return {
    manifest: bundle.manifest,
    filesBase64
  };
}
