/**
 * Training Studio Export Bundle Contract v0.1
 *
 * This defines the versioned contract for export bundles.
 * Breaking changes require a version bump.
 *
 * See COMPAT.md for versioning rules.
 */

export const BUNDLE_VERSION = '0.1';
export const SCHEMA_URI = 'https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json';

export interface BundleManifest {
  // === Identity ===
  bundle_version: typeof BUNDLE_VERSION;
  bundle_id: string;           // UUID v4 - unique identifier for this bundle
  run_id: string;              // UUID v4 - identifies the training run (may equal bundle_id)
  bundle_digest: string;       // SHA-256 of canonical artifact list (for dedup/caching)

  // === Schema reference ===
  schema_uri: string;          // URL to the schema definition
  schema_version: string;      // Version of schema used (matches bundle_version)

  // === Timestamps ===
  created_utc: string;

  // === Provenance ===
  app: AppInfo;
  backend: BackendInfo;

  // === Content ===
  dataset: DatasetInfo;
  model: ModelInfo;
  training: TrainingInfo;
  artifacts: ArtifactEntry[];
}

export interface AppInfo {
  name: string;
  version: string;
  git_sha?: string;
}

export interface BackendInfo {
  tfjs_version: string;
  backend: 'webgpu' | 'webgl' | 'cpu' | 'wasm';
  device_info?: string;
  flags?: Record<string, unknown>;
}

export interface DatasetInfo {
  dataset_id: string;          // Hash-derived ID for dataset identity
  source_file: string;
  total_rows: number;
  train_rows: number;
  val_rows: number;
  features: string[];
  label: string;
  split_seed: number;
  train_indices_hash: string;
  val_indices_hash: string;
  normalization: NormalizationInfo | null;
}

export interface NormalizationInfo {
  feature_means: number[];
  feature_stds: number[];
}

export interface ModelInfo {
  preset: string;
  input_shape: number;
  output_shape: number;
  task_type: 'classification' | 'regression';
  num_classes?: number;
  class_labels?: string[];
  layer_config: LayerSummary[];
  total_params: number;
  trainable_params: number;
}

export interface LayerSummary {
  name: string;
  type: string;
  output_shape: number[];
  params: number;
  config: Record<string, unknown>;
}

export interface TrainingInfo {
  hyperparams: HyperparamsRecord;
  epochs_completed: number;
  epochs_requested: number;
  early_stopped: boolean;
  best_epoch: number;
  final_metrics: FinalMetrics;
  duration_ms: number;
}

export interface HyperparamsRecord {
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimizer: string;
  early_stopping: boolean;
  patience: number;
}

export interface FinalMetrics {
  train_loss: number;
  train_accuracy?: number;
  val_loss?: number;
  val_accuracy?: number;
  best_val_loss?: number;
  best_val_accuracy?: number;
}

export interface ArtifactEntry {
  path: string;
  size_bytes: number;
  sha256: string;
}

/**
 * Epoch-level metrics for JSONL streaming format
 * One line per epoch in metrics.jsonl
 */
export interface EpochMetric {
  epoch: number;
  timestamp_ms: number;
  loss: number;
  accuracy?: number;
  val_loss?: number;
  val_accuracy?: number;
  learning_rate?: number;
  batch_time_avg_ms?: number;
}

/**
 * Summary metrics computed at end of training
 */
export interface MetricsSummary {
  best_epoch: number;
  best_val_loss?: number;
  best_val_accuracy?: number;
  final_train_loss: number;
  final_train_accuracy?: number;
  final_val_loss?: number;
  final_val_accuracy?: number;
  confusion_matrix?: number[][];
  class_labels?: string[];
  total_epochs: number;
  early_stopped: boolean;
  training_duration_ms: number;
}

/**
 * Bundle file structure:
 *
 * training_export_YYYYMMDD_HHMMSS/
 * ├── bundle.json           # BundleManifest
 * ├── model/
 * │   ├── model.json        # TF.js model topology
 * │   └── weights.bin       # Model weights
 * ├── metrics/
 * │   ├── metrics.jsonl     # EpochMetric per line
 * │   └── summary.json      # MetricsSummary
 * ├── config/
 * │   └── run_config.json   # Full hyperparams + settings
 * └── data/
 *     └── schema.json       # Feature/label mapping + normalization
 */

export const BUNDLE_PATHS = {
  manifest: 'bundle.json',
  model: {
    topology: 'model/model.json',
    weights: 'model/weights.bin'
  },
  metrics: {
    epochs: 'metrics/metrics.jsonl',
    summary: 'metrics/summary.json'
  },
  config: {
    run: 'config/run_config.json'
  },
  data: {
    schema: 'data/schema.json'
  }
} as const;

/**
 * Validation error codes (fatal - bundle is invalid)
 */
export enum ValidationErrorCode {
  E_NO_MANIFEST = 'E_NO_MANIFEST',
  E_PARSE_ERROR = 'E_PARSE_ERROR',
  E_VERSION_UNSUPPORTED = 'E_VERSION_UNSUPPORTED',
  E_MISSING_FIELD = 'E_MISSING_FIELD',
  E_INVALID_FIELD = 'E_INVALID_FIELD',
  E_ARTIFACT_MISSING = 'E_ARTIFACT_MISSING',
  E_HASH_MISMATCH = 'E_HASH_MISMATCH',
  E_SIZE_MISMATCH = 'E_SIZE_MISMATCH',
  E_DIGEST_MISMATCH = 'E_DIGEST_MISMATCH',
  E_INVALID_JSONL = 'E_INVALID_JSONL',
  E_IO_READ = 'E_IO_READ',
  E_PATH_INVALID = 'E_PATH_INVALID',
  E_SYMLINK_FORBIDDEN = 'E_SYMLINK_FORBIDDEN',
}

/**
 * Validation warning codes (non-fatal - bundle is valid but has issues)
 */
export enum ValidationWarningCode {
  W_UNLISTED_FILE = 'W_UNLISTED_FILE',
  W_UNKNOWN_FIELD = 'W_UNKNOWN_FIELD',
  W_MISSING_OPTIONAL = 'W_MISSING_OPTIONAL',
  W_DEPRECATED_FIELD = 'W_DEPRECATED_FIELD',
}

/**
 * Validation result with formalized structure
 */
export interface ValidationResult {
  valid: boolean;
  version: string | null;
  bundle_id: string | null;
  bundle_digest: string | null;
  schema_uri: string | null;
  schema_version: string | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: ValidationStats;
  summary: string;
}

export interface ValidationIssue {
  code: ValidationErrorCode | ValidationWarningCode;
  message: string;
  path?: string;
}

export interface ValidationStats {
  files_total: number;
  artifacts_listed: number;
  artifacts_verified: number;
}

/**
 * CLI JSON output contract (stable shape for --json flag)
 */
export interface CLIValidationOutput {
  ok: boolean;
  exit_code: 0 | 2 | 3;
  bundle_id: string | null;
  bundle_digest: string | null;
  version: string | null;
  schema_uri: string | null;
  schema_version: string | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: ValidationStats;
}
