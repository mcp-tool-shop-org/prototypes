/**
 * CLI & CI Artifacts
 *
 * Deterministic artifact generation for CI/CD integration.
 *
 * Core principles:
 * - Identical input → identical output (deterministic)
 * - No "smart" formatting based on data
 * - CI can diff against golden artifacts
 * - Artifacts are versioned with contract version
 */

import {
  TrainingLogEntry,
  ValidatedPayload,
  ContractValidator,
  INTEGRATION_CONTRACT_VERSION,
} from './contract';
import {
  StreamingProtocol,
  StreamingPayload,
  createStreamingPayload,
  CompletenessLevel,
} from './streaming';

// ============================================================================
// Types
// ============================================================================

/**
 * Artifact format types
 */
export type ArtifactFormat = 'json' | 'ndjson' | 'csv';

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  /** Contract version used */
  readonly contractVersion: string;
  /** Artifact generation timestamp */
  readonly generatedAt: string;
  /** VectorCaliper version */
  readonly vectorCaliperVersion: string;
  /** Number of entries */
  readonly entryCount: number;
  /** Schema hash for validation */
  readonly schemaHash: string;
  /** Source identifier */
  readonly source?: string;
  /** Run identifier */
  readonly runId?: string;
}

/**
 * Complete artifact with metadata
 */
export interface Artifact {
  readonly metadata: ArtifactMetadata;
  readonly entries: readonly ValidatedPayload['payload'][];
}

/**
 * CLI configuration
 */
export interface CLIConfig {
  /** Input format */
  readonly inputFormat?: ArtifactFormat;
  /** Output format */
  readonly outputFormat?: ArtifactFormat;
  /** Include metadata in output */
  readonly includeMetadata?: boolean;
  /** Pretty print JSON (not recommended for CI) */
  readonly prettyPrint?: boolean;
  /** Source identifier */
  readonly source?: string;
  /** Run identifier */
  readonly runId?: string;
}

/**
 * Validation result for artifact
 */
export interface ArtifactValidationResult {
  readonly valid: boolean;
  readonly errors: ArtifactValidationError[];
  readonly warnings: ArtifactValidationWarning[];
  readonly metadata?: ArtifactMetadata;
}

/**
 * Artifact validation error
 */
export interface ArtifactValidationError {
  readonly type: 'schema' | 'entry' | 'metadata' | 'format';
  readonly message: string;
  readonly index?: number;
  readonly field?: string;
}

/**
 * Artifact validation warning
 */
export interface ArtifactValidationWarning {
  readonly type: 'version_mismatch' | 'unknown_field' | 'missing_metadata';
  readonly message: string;
  readonly field?: string;
}

/**
 * Diff result between two artifacts
 */
export interface ArtifactDiff {
  readonly identical: boolean;
  readonly metadataDiff: readonly MetadataDifference[];
  readonly entryDiffs: readonly EntryDifference[];
  readonly summary: DiffSummary;
}

/**
 * Metadata difference
 */
export interface MetadataDifference {
  readonly field: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

/**
 * Entry difference
 */
export interface EntryDifference {
  readonly index: number;
  readonly type: 'missing' | 'extra' | 'modified';
  readonly field?: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
}

/**
 * Diff summary
 */
export interface DiffSummary {
  readonly totalEntries: {
    readonly expected: number;
    readonly actual: number;
  };
  readonly missingEntries: number;
  readonly extraEntries: number;
  readonly modifiedEntries: number;
  readonly identicalEntries: number;
}

// ============================================================================
// Constants
// ============================================================================

/** VectorCaliper version for artifacts */
export const VECTORCALIPER_VERSION = '0.4.0';

/** Schema hash algorithm */
const SCHEMA_VERSION = 'v1';

// ============================================================================
// Artifact Generation
// ============================================================================

/**
 * Compute schema hash for validation
 * Simple deterministic hash of required field names
 */
export function computeSchemaHash(): string {
  const requiredFields = [
    'step', 'epoch', 'learningRate', 'loss',
    'gradientNorm', 'updateNorm', 'parameterNorm',
  ].sort();

  // Simple hash: join and compute character sum mod 2^32
  const str = requiredFields.join(',') + SCHEMA_VERSION;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `vc_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Create artifact metadata
 */
export function createMetadata(
  entryCount: number,
  options: { source?: string; runId?: string } = {}
): ArtifactMetadata {
  return {
    contractVersion: INTEGRATION_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    vectorCaliperVersion: VECTORCALIPER_VERSION,
    entryCount,
    schemaHash: computeSchemaHash(),
    source: options.source,
    runId: options.runId,
  };
}

/**
 * Generate artifact from validated payloads
 */
export function generateArtifact(
  payloads: ValidatedPayload[],
  options: { source?: string; runId?: string } = {}
): Artifact {
  const entries = payloads.map((p) => p.payload);
  return {
    metadata: createMetadata(entries.length, options),
    entries,
  };
}

/**
 * Generate artifact from raw log entries
 */
export function generateArtifactFromLogs(
  logs: TrainingLogEntry[],
  options: { source?: string; runId?: string } = {}
): Artifact {
  const validator = new ContractValidator();
  const entries: ValidatedPayload['payload'][] = [];

  for (const log of logs) {
    const result = validator.validate({
      ...log,
      source: log.source ?? options.source ?? 'cli',
      contractVersion: INTEGRATION_CONTRACT_VERSION,
    });

    if (result.valid && result.payload) {
      entries.push(result.payload);
    }
    // Invalid entries are silently skipped (use validateLogs for validation)
  }

  return {
    metadata: createMetadata(entries.length, options),
    entries,
  };
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize artifact to JSON (deterministic)
 *
 * Keys are sorted alphabetically for deterministic output.
 * No pretty printing by default for CI diffing.
 */
export function serializeToJSON(
  artifact: Artifact,
  options: { prettyPrint?: boolean; includeMetadata?: boolean } = {}
): string {
  const output = options.includeMetadata !== false
    ? artifact
    : { entries: artifact.entries };

  // Deterministic JSON: sort keys
  return JSON.stringify(output, sortedReplacer, options.prettyPrint ? 2 : undefined);
}

/**
 * Serialize artifact to NDJSON (newline-delimited JSON)
 * One entry per line for streaming and easy diffing
 */
export function serializeToNDJSON(
  artifact: Artifact,
  options: { includeMetadata?: boolean } = {}
): string {
  const lines: string[] = [];

  if (options.includeMetadata !== false) {
    lines.push(JSON.stringify({ _metadata: artifact.metadata }, sortedReplacer));
  }

  for (const entry of artifact.entries) {
    lines.push(JSON.stringify(entry, sortedReplacer));
  }

  return lines.join('\n');
}

/**
 * Serialize artifact to CSV
 * Fixed column order for deterministic output
 */
export function serializeToCSV(artifact: Artifact): string {
  const columns = [
    'step', 'epoch', 'learningRate', 'loss',
    'gradientNorm', 'updateNorm', 'parameterNorm',
    'accuracy', 'timestamp', 'source',
  ];

  const header = columns.join(',');
  const rows = artifact.entries.map((entry) => {
    return columns.map((col) => {
      const val = (entry as unknown as Record<string, unknown>)[col];
      if (val === undefined || val === null) return '';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return String(val);
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Serialize artifact to specified format
 */
export function serialize(
  artifact: Artifact,
  format: ArtifactFormat,
  options: { prettyPrint?: boolean; includeMetadata?: boolean } = {}
): string {
  switch (format) {
    case 'json':
      return serializeToJSON(artifact, options);
    case 'ndjson':
      return serializeToNDJSON(artifact, options);
    case 'csv':
      return serializeToCSV(artifact);
  }
}

/**
 * JSON replacer that sorts keys for deterministic output
 */
function sortedReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value).sort();
    for (const k of keys) {
      sorted[k] = (value as Record<string, unknown>)[k];
    }
    return sorted;
  }
  return value;
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse JSON artifact
 */
export function parseJSON(content: string): Artifact {
  const parsed = JSON.parse(content);

  if (parsed.metadata && parsed.entries) {
    return parsed as Artifact;
  }

  // Handle entries-only format
  if (Array.isArray(parsed.entries)) {
    return {
      metadata: createMetadata(parsed.entries.length),
      entries: parsed.entries,
    };
  }

  // Handle array format
  if (Array.isArray(parsed)) {
    return {
      metadata: createMetadata(parsed.length),
      entries: parsed,
    };
  }

  throw new Error('Invalid artifact format: expected object with entries or array');
}

/**
 * Parse NDJSON artifact
 */
export function parseNDJSON(content: string): Artifact {
  const lines = content.split('\n').filter((l) => l.trim());
  const entries: ValidatedPayload['payload'][] = [];
  let metadata: ArtifactMetadata | undefined;

  for (const line of lines) {
    const parsed = JSON.parse(line);

    if (parsed._metadata) {
      metadata = parsed._metadata;
    } else {
      entries.push(parsed);
    }
  }

  return {
    metadata: metadata ?? createMetadata(entries.length),
    entries,
  };
}

/**
 * Parse CSV artifact
 */
export function parseCSV(content: string): Artifact {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    return { metadata: createMetadata(0), entries: [] };
  }

  const header = lines[0].split(',');
  const entries: ValidatedPayload['payload'][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const entry: Record<string, unknown> = {};

    for (let j = 0; j < header.length; j++) {
      const col = header[j];
      const val = values[j];

      if (val === '' || val === undefined) continue;

      // Parse numbers
      if (['step', 'epoch', 'loss', 'gradientNorm', 'updateNorm', 'parameterNorm', 'learningRate', 'accuracy'].includes(col)) {
        entry[col] = parseFloat(val);
      } else {
        entry[col] = val;
      }
    }

    entries.push(entry as unknown as ValidatedPayload['payload']);
  }

  return { metadata: createMetadata(entries.length), entries };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Parse artifact from content with auto-detected format
 */
export function parse(content: string, format?: ArtifactFormat): Artifact {
  if (format) {
    switch (format) {
      case 'json': return parseJSON(content);
      case 'ndjson': return parseNDJSON(content);
      case 'csv': return parseCSV(content);
    }
  }

  // Auto-detect format
  const trimmed = content.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Check for NDJSON (multiple JSON objects on separate lines)
    const lines = trimmed.split('\n');
    if (lines.length > 1 && lines.every((l) => l.startsWith('{'))) {
      return parseNDJSON(content);
    }
    return parseJSON(content);
  }

  // Assume CSV
  return parseCSV(content);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate artifact structure and entries
 */
export function validateArtifact(artifact: Artifact): ArtifactValidationResult {
  const errors: ArtifactValidationError[] = [];
  const warnings: ArtifactValidationWarning[] = [];
  const validator = new ContractValidator();

  // Validate metadata
  if (!artifact.metadata) {
    errors.push({
      type: 'metadata',
      message: 'Missing artifact metadata',
    });
  } else {
    // Check contract version
    if (artifact.metadata.contractVersion !== INTEGRATION_CONTRACT_VERSION) {
      warnings.push({
        type: 'version_mismatch',
        message: `Contract version mismatch: expected ${INTEGRATION_CONTRACT_VERSION}, got ${artifact.metadata.contractVersion}`,
        field: 'contractVersion',
      });
    }

    // Check schema hash
    const expectedHash = computeSchemaHash();
    if (artifact.metadata.schemaHash !== expectedHash) {
      warnings.push({
        type: 'version_mismatch',
        message: `Schema hash mismatch: expected ${expectedHash}, got ${artifact.metadata.schemaHash}`,
        field: 'schemaHash',
      });
    }

    // Check entry count
    if (artifact.metadata.entryCount !== artifact.entries.length) {
      errors.push({
        type: 'metadata',
        message: `Entry count mismatch: metadata says ${artifact.metadata.entryCount}, actual is ${artifact.entries.length}`,
        field: 'entryCount',
      });
    }
  }

  // Validate entries
  for (let i = 0; i < artifact.entries.length; i++) {
    const entry = artifact.entries[i];
    const result = validator.validate({
      ...entry,
      contractVersion: INTEGRATION_CONTRACT_VERSION,
    });

    if (!result.valid) {
      for (const err of result.errors) {
        errors.push({
          type: 'entry',
          message: err.message,
          index: i,
          field: err.field,
        });
      }
    }

    for (const warn of result.warnings) {
      warnings.push({
        type: 'unknown_field',
        message: warn.message,
        field: warn.field,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: artifact.metadata,
  };
}

/**
 * Validate raw log entries
 */
export function validateLogs(logs: TrainingLogEntry[]): {
  valid: TrainingLogEntry[];
  invalid: Array<{ index: number; errors: string[] }>;
} {
  const validator = new ContractValidator();
  const valid: TrainingLogEntry[] = [];
  const invalid: Array<{ index: number; errors: string[] }> = [];

  for (let i = 0; i < logs.length; i++) {
    const result = validator.validate({
      ...logs[i],
      contractVersion: INTEGRATION_CONTRACT_VERSION,
    });

    if (result.valid) {
      valid.push(logs[i]);
    } else {
      invalid.push({
        index: i,
        errors: result.errors.map((e) => `${e.field}: ${e.message}`),
      });
    }
  }

  return { valid, invalid };
}

// ============================================================================
// Diffing
// ============================================================================

/**
 * Diff two artifacts for CI comparison
 *
 * Deterministic comparison:
 * - Compares metadata (excluding generatedAt timestamp)
 * - Compares entries field by field
 * - Reports all differences
 */
export function diffArtifacts(
  expected: Artifact,
  actual: Artifact,
  options: { compareTimestamps?: boolean } = {}
): ArtifactDiff {
  const metadataDiff: MetadataDifference[] = [];
  const entryDiffs: EntryDifference[] = [];

  // Compare metadata (exclude generatedAt unless requested)
  const metaFields = ['contractVersion', 'vectorCaliperVersion', 'entryCount', 'schemaHash', 'source', 'runId'];
  if (options.compareTimestamps) {
    metaFields.push('generatedAt');
  }

  for (const field of metaFields) {
    const expVal = (expected.metadata as unknown as Record<string, unknown>)[field];
    const actVal = (actual.metadata as unknown as Record<string, unknown>)[field];

    if (!deepEqual(expVal, actVal)) {
      metadataDiff.push({ field, expected: expVal, actual: actVal });
    }
  }

  // Compare entries
  const maxLen = Math.max(expected.entries.length, actual.entries.length);
  let identicalCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const expEntry = expected.entries[i];
    const actEntry = actual.entries[i];

    if (!expEntry) {
      entryDiffs.push({ index: i, type: 'extra', actual: actEntry });
    } else if (!actEntry) {
      entryDiffs.push({ index: i, type: 'missing', expected: expEntry });
    } else {
      // Compare fields
      const allFields = new Set([
        ...Object.keys(expEntry),
        ...Object.keys(actEntry),
      ]);

      let entryIdentical = true;
      for (const field of allFields) {
        const expVal = (expEntry as unknown as Record<string, unknown>)[field];
        const actVal = (actEntry as unknown as Record<string, unknown>)[field];

        // Skip timestamp comparison unless requested
        if (field === 'timestamp' && !options.compareTimestamps) {
          continue;
        }

        if (!deepEqual(expVal, actVal)) {
          entryDiffs.push({
            index: i,
            type: 'modified',
            field,
            expected: expVal,
            actual: actVal,
          });
          entryIdentical = false;
        }
      }

      if (entryIdentical) {
        identicalCount++;
      }
    }
  }

  const summary: DiffSummary = {
    totalEntries: {
      expected: expected.entries.length,
      actual: actual.entries.length,
    },
    missingEntries: entryDiffs.filter((d) => d.type === 'missing').length,
    extraEntries: entryDiffs.filter((d) => d.type === 'extra').length,
    modifiedEntries: new Set(
      entryDiffs.filter((d) => d.type === 'modified').map((d) => d.index)
    ).size,
    identicalEntries: identicalCount,
  };

  return {
    identical: metadataDiff.length === 0 && entryDiffs.length === 0,
    metadataDiff,
    entryDiffs,
    summary,
  };
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => deepEqual(v, b[i]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }

  return false;
}

/**
 * Format diff result as human-readable string
 */
export function formatDiff(diff: ArtifactDiff): string {
  const lines: string[] = [];

  if (diff.identical) {
    lines.push('Artifacts are identical');
    return lines.join('\n');
  }

  lines.push('Artifacts differ:');
  lines.push('');

  // Metadata differences
  if (diff.metadataDiff.length > 0) {
    lines.push('Metadata differences:');
    for (const d of diff.metadataDiff) {
      lines.push(`  ${d.field}: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`);
    }
    lines.push('');
  }

  // Entry differences summary
  lines.push('Entry summary:');
  lines.push(`  Expected: ${diff.summary.totalEntries.expected} entries`);
  lines.push(`  Actual: ${diff.summary.totalEntries.actual} entries`);
  lines.push(`  Identical: ${diff.summary.identicalEntries}`);
  lines.push(`  Missing: ${diff.summary.missingEntries}`);
  lines.push(`  Extra: ${diff.summary.extraEntries}`);
  lines.push(`  Modified: ${diff.summary.modifiedEntries}`);
  lines.push('');

  // Detailed differences (first 10)
  const maxDiffs = 10;
  if (diff.entryDiffs.length > 0) {
    lines.push(`Entry differences (showing first ${Math.min(diff.entryDiffs.length, maxDiffs)}):`);

    for (let i = 0; i < Math.min(diff.entryDiffs.length, maxDiffs); i++) {
      const d = diff.entryDiffs[i];
      switch (d.type) {
        case 'missing':
          lines.push(`  [${d.index}] MISSING`);
          break;
        case 'extra':
          lines.push(`  [${d.index}] EXTRA`);
          break;
        case 'modified':
          lines.push(`  [${d.index}] ${d.field}: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`);
          break;
      }
    }

    if (diff.entryDiffs.length > maxDiffs) {
      lines.push(`  ... and ${diff.entryDiffs.length - maxDiffs} more differences`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// CLI Runner
// ============================================================================

/**
 * CLI command result
 */
export interface CLIResult {
  readonly success: boolean;
  readonly output?: string;
  readonly error?: string;
  readonly exitCode: number;
}

/**
 * Run CLI command
 */
export function runCLI(
  command: 'generate' | 'validate' | 'diff',
  input: string | [string, string],
  config: CLIConfig = {}
): CLIResult {
  try {
    switch (command) {
      case 'generate':
        return runGenerate(input as string, config);
      case 'validate':
        return runValidate(input as string, config);
      case 'diff':
        return runDiff(input as [string, string], config);
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      exitCode: 1,
    };
  }
}

function runGenerate(input: string, config: CLIConfig): CLIResult {
  const artifact = parse(input, config.inputFormat);
  const output = serialize(artifact, config.outputFormat ?? 'json', {
    prettyPrint: config.prettyPrint,
    includeMetadata: config.includeMetadata,
  });

  return { success: true, output, exitCode: 0 };
}

function runValidate(input: string, config: CLIConfig): CLIResult {
  const artifact = parse(input, config.inputFormat);
  const result = validateArtifact(artifact);

  const lines: string[] = [];

  if (result.valid) {
    lines.push('Artifact is valid');
    lines.push(`  Entries: ${artifact.entries.length}`);
    lines.push(`  Contract version: ${artifact.metadata.contractVersion}`);
  } else {
    lines.push('Artifact is invalid');
    for (const err of result.errors) {
      lines.push(`  ERROR: ${err.message}`);
    }
  }

  for (const warn of result.warnings) {
    lines.push(`  WARNING: ${warn.message}`);
  }

  return {
    success: result.valid,
    output: lines.join('\n'),
    exitCode: result.valid ? 0 : 1,
  };
}

function runDiff(inputs: [string, string], config: CLIConfig): CLIResult {
  const [expectedContent, actualContent] = inputs;
  const expected = parse(expectedContent, config.inputFormat);
  const actual = parse(actualContent, config.inputFormat);

  const diff = diffArtifacts(expected, actual);
  const output = formatDiff(diff);

  return {
    success: diff.identical,
    output,
    exitCode: diff.identical ? 0 : 1,
  };
}
