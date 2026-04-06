/**
 * Bundle Validator
 *
 * Validates Training Studio export bundles against the v0.1 contract.
 *
 * Invariants enforced:
 *   A (Integrity): Every artifact listed must exist and hash-match
 *   B (Completeness): Unlisted files are allowed but discouraged (warning)
 *   C (Digest): Bundle digest must match recomputed value
 */

import {
  BUNDLE_VERSION,
  BUNDLE_PATHS,
  BundleManifest,
  ValidationResult,
  ValidationIssue,
  ValidationStats,
  ValidationErrorCode,
  ValidationWarningCode
} from '../types/bundle.js';

type FileReader = (path: string) => Promise<Uint8Array | null>;
type FileExists = (path: string) => Promise<boolean>;
type ListFiles = () => Promise<string[]>;

export interface BundleAccess {
  readFile: FileReader;
  fileExists: FileExists;
  listFiles: ListFiles;
}

const REQUIRED_PATHS = [
  BUNDLE_PATHS.manifest,
  BUNDLE_PATHS.model.topology,
  BUNDLE_PATHS.model.weights,
  BUNDLE_PATHS.metrics.summary,
  BUNDLE_PATHS.config.run,
  BUNDLE_PATHS.data.schema
];

// New required fields in v0.1
const REQUIRED_MANIFEST_FIELDS = [
  'bundle_version', 'bundle_id', 'run_id', 'bundle_digest',
  'schema_uri', 'schema_version', 'created_utc',
  'app', 'backend', 'dataset', 'model', 'training', 'artifacts'
];

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
 * Recompute bundle digest from artifacts
 */
async function computeBundleDigest(
  artifacts: Array<{ path: string; sha256: string; size_bytes: number }>,
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
 * Validate a bundle manifest structure (without file access)
 */
export function validateManifestStructure(manifest: unknown): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push({
      code: ValidationErrorCode.E_PARSE_ERROR,
      message: 'Manifest is not an object'
    });
    return errors;
  }

  const m = manifest as Record<string, unknown>;

  // Check version
  if (m.bundle_version !== BUNDLE_VERSION) {
    errors.push({
      code: ValidationErrorCode.E_VERSION_UNSUPPORTED,
      message: `Expected bundle_version "${BUNDLE_VERSION}", got "${m.bundle_version}"`
    });
  }

  // Check required top-level fields
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in m)) {
      errors.push({
        code: ValidationErrorCode.E_MISSING_FIELD,
        message: `Missing required field: ${field}`
      });
    }
  }

  // Validate UUID format for IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (m.bundle_id && typeof m.bundle_id === 'string' && !uuidRegex.test(m.bundle_id)) {
    errors.push({
      code: ValidationErrorCode.E_INVALID_FIELD,
      message: 'bundle_id is not a valid UUID v4'
    });
  }
  if (m.run_id && typeof m.run_id === 'string' && !uuidRegex.test(m.run_id)) {
    errors.push({
      code: ValidationErrorCode.E_INVALID_FIELD,
      message: 'run_id is not a valid UUID v4'
    });
  }

  // Validate artifacts array
  if (Array.isArray(m.artifacts)) {
    for (let i = 0; i < (m.artifacts as unknown[]).length; i++) {
      const artifact = (m.artifacts as unknown[])[i] as Record<string, unknown>;
      if (!artifact.path || typeof artifact.path !== 'string') {
        errors.push({
          code: ValidationErrorCode.E_INVALID_FIELD,
          message: `Artifact ${i}: missing or invalid path`
        });
      }
      if (!artifact.sha256 || typeof artifact.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(artifact.sha256)) {
        errors.push({
          code: ValidationErrorCode.E_INVALID_FIELD,
          message: `Artifact ${i}: missing or invalid sha256`
        });
      }
      if (typeof artifact.size_bytes !== 'number' || artifact.size_bytes < 0) {
        errors.push({
          code: ValidationErrorCode.E_INVALID_FIELD,
          message: `Artifact ${i}: missing or invalid size_bytes`
        });
      }
    }
  } else {
    errors.push({
      code: ValidationErrorCode.E_INVALID_FIELD,
      message: 'artifacts must be an array'
    });
  }

  return errors;
}

/**
 * Full bundle validation with file access
 */
export async function validateBundle(access: BundleAccess): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const stats: ValidationStats = {
    files_total: 0,
    artifacts_listed: 0,
    artifacts_verified: 0
  };

  // Step 1: Check manifest exists
  const manifestData = await access.readFile(BUNDLE_PATHS.manifest);
  if (!manifestData) {
    return {
      valid: false,
      version: null,
      bundle_id: null,
      bundle_digest: null,
      schema_uri: null,
      schema_version: null,
      errors: [{ code: ValidationErrorCode.E_NO_MANIFEST, message: 'bundle.json not found' }],
      warnings: [],
      stats,
      summary: 'INVALID: No manifest'
    };
  }

  // Step 2: Parse manifest
  let manifest: BundleManifest;
  try {
    const text = new TextDecoder().decode(manifestData);
    manifest = JSON.parse(text) as BundleManifest;
  } catch (e) {
    return {
      valid: false,
      version: null,
      bundle_id: null,
      bundle_digest: null,
      schema_uri: null,
      schema_version: null,
      errors: [{ code: ValidationErrorCode.E_PARSE_ERROR, message: `Failed to parse bundle.json: ${e}` }],
      warnings: [],
      stats,
      summary: 'INVALID: Manifest parse error'
    };
  }

  // Step 3: Validate manifest structure
  const structureErrors = validateManifestStructure(manifest);
  errors.push(...structureErrors);

  if (structureErrors.length > 0) {
    return {
      valid: false,
      version: manifest.bundle_version ?? null,
      bundle_id: manifest.bundle_id ?? null,
      bundle_digest: manifest.bundle_digest ?? null,
      schema_uri: manifest.schema_uri ?? null,
      schema_version: manifest.schema_version ?? null,
      errors,
      warnings,
      stats,
      summary: `INVALID: ${structureErrors.length} structure error(s)`
    };
  }

  stats.artifacts_listed = manifest.artifacts.length;

  // Step 4: Check required paths exist in artifacts
  const artifactPaths = new Set(manifest.artifacts.map(a => a.path));
  for (const required of REQUIRED_PATHS) {
    if (required === BUNDLE_PATHS.manifest) continue;
    if (!artifactPaths.has(required)) {
      errors.push({
        code: ValidationErrorCode.E_ARTIFACT_MISSING,
        message: `Required file not in artifacts: ${required}`,
        path: required
      });
    }
  }

  // Step 5: Invariant A - Every artifact must exist and hash-match
  for (const artifact of manifest.artifacts) {
    const fileData = await access.readFile(artifact.path);

    if (!fileData) {
      errors.push({
        code: ValidationErrorCode.E_ARTIFACT_MISSING,
        message: `Artifact file not found: ${artifact.path}`,
        path: artifact.path
      });
      continue;
    }

    // Check size
    if (fileData.length !== artifact.size_bytes) {
      errors.push({
        code: ValidationErrorCode.E_SIZE_MISMATCH,
        message: `Size mismatch for ${artifact.path}: expected ${artifact.size_bytes}, got ${fileData.length}`,
        path: artifact.path
      });
    }

    // Check hash
    const computedHash = await sha256(fileData);
    if (computedHash !== artifact.sha256) {
      errors.push({
        code: ValidationErrorCode.E_HASH_MISMATCH,
        message: `Hash mismatch for ${artifact.path}`,
        path: artifact.path
      });
    } else {
      stats.artifacts_verified++;
    }
  }

  // Step 6: Invariant C - Verify bundle digest
  const recomputedDigest = await computeBundleDigest(manifest.artifacts, manifest.bundle_version);
  if (manifest.bundle_digest !== recomputedDigest) {
    errors.push({
      code: ValidationErrorCode.E_DIGEST_MISMATCH,
      message: `Bundle digest mismatch: expected ${manifest.bundle_digest}, computed ${recomputedDigest}`
    });
  }

  // Step 7: Completeness Rule (warning) - Unlisted files are allowed but discouraged
  const allFiles = await access.listFiles();
  stats.files_total = allFiles.length;

  for (const file of allFiles) {
    if (file === BUNDLE_PATHS.manifest) continue;
    if (!artifactPaths.has(file)) {
      warnings.push({
        code: ValidationWarningCode.W_UNLISTED_FILE,
        message: `File exists but not in artifacts: ${file}`,
        path: file
      });
    }
  }

  // Step 8: Check metrics.jsonl if it exists
  if (artifactPaths.has(BUNDLE_PATHS.metrics.epochs)) {
    const metricsData = await access.readFile(BUNDLE_PATHS.metrics.epochs);
    if (metricsData) {
      const lines = new TextDecoder().decode(metricsData).trim().split('\n');
      for (let i = 0; i < lines.length; i++) {
        try {
          const epoch = JSON.parse(lines[i]) as Record<string, unknown>;
          if (typeof epoch.epoch !== 'number' || typeof epoch.loss !== 'number') {
            warnings.push({
              code: ValidationWarningCode.W_MISSING_OPTIONAL,
              message: `Line ${i + 1} in metrics.jsonl missing required fields`,
              path: BUNDLE_PATHS.metrics.epochs
            });
          }
        } catch {
          errors.push({
            code: ValidationErrorCode.E_INVALID_JSONL,
            message: `Line ${i + 1} in metrics.jsonl is not valid JSON`,
            path: BUNDLE_PATHS.metrics.epochs
          });
        }
      }
    }
  }

  const valid = errors.length === 0;
  const summary = valid
    ? `VALID: v${manifest.bundle_version} bundle [${manifest.bundle_id.substring(0, 8)}] with ${manifest.artifacts.length} artifacts`
    : `INVALID: ${errors.length} error(s), ${warnings.length} warning(s)`;

  return {
    valid,
    version: manifest.bundle_version,
    bundle_id: manifest.bundle_id,
    bundle_digest: manifest.bundle_digest,
    schema_uri: manifest.schema_uri,
    schema_version: manifest.schema_version,
    errors,
    warnings,
    stats,
    summary
  };
}

/**
 * Create a BundleAccess interface for an in-memory file map
 */
export function createMemoryAccess(files: Map<string, Uint8Array | string>): BundleAccess {
  const normalized = new Map<string, Uint8Array>();

  for (const [path, content] of files) {
    const normalizedPath = path.replace(/\\/g, '/');
    const bytes = typeof content === 'string'
      ? new TextEncoder().encode(content)
      : content;
    normalized.set(normalizedPath, bytes);
  }

  return {
    readFile: async (path: string) => normalized.get(path) ?? null,
    fileExists: async (path: string) => normalized.has(path),
    listFiles: async () => Array.from(normalized.keys())
  };
}

/**
 * Format validation result for CLI output
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [result.summary];

  if (result.stats.artifacts_listed > 0) {
    lines.push(`  Artifacts: ${result.stats.artifacts_verified}/${result.stats.artifacts_listed} verified`);
  }

  if (result.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const err of result.errors) {
      lines.push(`  [${err.code}] ${err.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    for (const warn of result.warnings) {
      lines.push(`  [${warn.code}] ${warn.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * CLI exit codes
 */
export const EXIT_CODES = {
  VALID: 0,
  VALID_WITH_WARNINGS: 2,
  INVALID: 3
} as const;

/**
 * Get exit code for validation result
 */
export function getExitCode(result: ValidationResult): number {
  if (!result.valid) return EXIT_CODES.INVALID;
  if (result.warnings.length > 0) return EXIT_CODES.VALID_WITH_WARNINGS;
  return EXIT_CODES.VALID;
}

/**
 * Format validation result as stable JSON for CLI --json output
 */
export function formatValidationResultJSON(result: ValidationResult): string {
  const exitCode = getExitCode(result);

  return JSON.stringify({
    ok: result.valid,
    exit_code: exitCode,
    bundle_id: result.bundle_id,
    bundle_digest: result.bundle_digest,
    version: result.version,
    schema_uri: result.schema_uri,
    schema_version: result.schema_version,
    errors: result.errors,
    warnings: result.warnings,
    stats: result.stats
  }, null, 2);
}
