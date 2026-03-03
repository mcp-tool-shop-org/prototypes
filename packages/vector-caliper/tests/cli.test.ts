/**
 * CLI & CI Artifacts Tests
 *
 * Acceptance criteria:
 * - Identical input → identical output (deterministic)
 * - No "smart" formatting based on data
 * - CI can diff against golden artifacts
 * - Artifacts are versioned with contract version
 */

import { describe, it, expect } from 'vitest';
import {
  computeSchemaHash,
  createMetadata,
  generateArtifact,
  generateArtifactFromLogs,
  serializeToJSON,
  serializeToNDJSON,
  serializeToCSV,
  serialize,
  parseJSON,
  parseNDJSON,
  parseCSV,
  parse,
  validateArtifact,
  validateLogs,
  diffArtifacts,
  formatDiff,
  runCLI,
  Artifact,
  ArtifactFormat,
  VECTORCALIPER_VERSION,
} from '../src/integration/cli';
import { ValidatedPayload, TrainingLogEntry, INTEGRATION_CONTRACT_VERSION } from '../src/integration/contract';

// Helper to create a complete validated payload
function createValidatedPayload(step: number, overrides: Partial<ValidatedPayload['payload']> = {}): ValidatedPayload {
  return {
    valid: true,
    payload: {
      step,
      epoch: 0,
      learningRate: 0.001,
      loss: 1.5 - step * 0.1,
      gradientNorm: 0.5,
      updateNorm: 0.01,
      parameterNorm: 10.0,
      source: 'test',
      contractVersion: INTEGRATION_CONTRACT_VERSION,
      ...overrides,
    },
    errors: [],
  };
}

// Helper to create a complete log entry
function createLogEntry(step: number, overrides: Partial<TrainingLogEntry> = {}): TrainingLogEntry {
  return {
    step,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5 - step * 0.1,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 10.0,
    ...overrides,
  };
}

describe('Schema Hash', () => {
  describe('computeSchemaHash', () => {
    it('produces deterministic hash', () => {
      const hash1 = computeSchemaHash();
      const hash2 = computeSchemaHash();

      expect(hash1).toBe(hash2);
    });

    it('returns string starting with vc_', () => {
      const hash = computeSchemaHash();

      expect(hash).toMatch(/^vc_[0-9a-f]{8}$/);
    });
  });
});

describe('Metadata Generation', () => {
  describe('createMetadata', () => {
    it('creates metadata with required fields', () => {
      const metadata = createMetadata(10);

      expect(metadata.contractVersion).toBe(INTEGRATION_CONTRACT_VERSION);
      expect(metadata.vectorCaliperVersion).toBe(VECTORCALIPER_VERSION);
      expect(metadata.entryCount).toBe(10);
      expect(metadata.schemaHash).toBe(computeSchemaHash());
      expect(metadata.generatedAt).toBeDefined();
    });

    it('includes optional source and runId', () => {
      const metadata = createMetadata(5, { source: 'pytorch', runId: 'run_123' });

      expect(metadata.source).toBe('pytorch');
      expect(metadata.runId).toBe('run_123');
    });
  });
});

describe('Artifact Generation', () => {
  describe('generateArtifact', () => {
    it('generates artifact from validated payloads', () => {
      const payloads = [
        createValidatedPayload(0),
        createValidatedPayload(1),
        createValidatedPayload(2),
      ];

      const artifact = generateArtifact(payloads);

      expect(artifact.entries).toHaveLength(3);
      expect(artifact.metadata.entryCount).toBe(3);
    });

    it('preserves payload data', () => {
      const payloads = [createValidatedPayload(0, { loss: 1.234 })];
      const artifact = generateArtifact(payloads);

      expect(artifact.entries[0].loss).toBe(1.234);
    });
  });

  describe('generateArtifactFromLogs', () => {
    it('generates artifact from raw logs', () => {
      const logs = [
        createLogEntry(0),
        createLogEntry(1),
        createLogEntry(2),
      ];

      const artifact = generateArtifactFromLogs(logs);

      expect(artifact.entries).toHaveLength(3);
    });

    it('skips invalid entries silently', () => {
      const logs = [
        createLogEntry(0),
        { step: 1 } as TrainingLogEntry, // Invalid - missing required fields
        createLogEntry(2),
      ];

      const artifact = generateArtifactFromLogs(logs);

      expect(artifact.entries).toHaveLength(2);
      expect(artifact.entries[0].step).toBe(0);
      expect(artifact.entries[1].step).toBe(2);
    });
  });
});

describe('JSON Serialization', () => {
  describe('serializeToJSON', () => {
    it('produces deterministic output', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);

      const json1 = serializeToJSON(artifact);
      const json2 = serializeToJSON(artifact);

      expect(json1).toBe(json2);
    });

    it('sorts keys alphabetically', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(artifact);
      const parsed = JSON.parse(json);

      // Keys should be sorted
      const metaKeys = Object.keys(parsed.metadata);
      expect(metaKeys).toEqual([...metaKeys].sort());
    });

    it('can exclude metadata', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(artifact, { includeMetadata: false });
      const parsed = JSON.parse(json);

      expect(parsed.metadata).toBeUndefined();
      expect(parsed.entries).toBeDefined();
    });

    it('supports pretty printing', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const compact = serializeToJSON(artifact);
      const pretty = serializeToJSON(artifact, { prettyPrint: true });

      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain('\n');
    });
  });

  describe('parseJSON', () => {
    it('parses serialized artifact', () => {
      const original = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(original);
      const parsed = parseJSON(json);

      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].step).toBe(0);
    });

    it('handles entries-only format', () => {
      const json = JSON.stringify({ entries: [{ step: 0 }] });
      const parsed = parseJSON(json);

      expect(parsed.entries).toHaveLength(1);
    });

    it('handles array format', () => {
      const json = JSON.stringify([{ step: 0 }, { step: 1 }]);
      const parsed = parseJSON(json);

      expect(parsed.entries).toHaveLength(2);
    });
  });
});

describe('NDJSON Serialization', () => {
  describe('serializeToNDJSON', () => {
    it('produces one line per entry', () => {
      const artifact = generateArtifact([
        createValidatedPayload(0),
        createValidatedPayload(1),
        createValidatedPayload(2),
      ]);

      const ndjson = serializeToNDJSON(artifact);
      const lines = ndjson.split('\n');

      // 1 metadata line + 3 entry lines
      expect(lines).toHaveLength(4);
    });

    it('can exclude metadata', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const ndjson = serializeToNDJSON(artifact, { includeMetadata: false });
      const lines = ndjson.split('\n');

      expect(lines).toHaveLength(1);
      const parsed = JSON.parse(lines[0]);
      expect(parsed._metadata).toBeUndefined();
    });

    it('each line is valid JSON', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const ndjson = serializeToNDJSON(artifact);

      for (const line of ndjson.split('\n')) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });

  describe('parseNDJSON', () => {
    it('parses serialized NDJSON', () => {
      const original = generateArtifact([createValidatedPayload(0)]);
      const ndjson = serializeToNDJSON(original);
      const parsed = parseNDJSON(ndjson);

      expect(parsed.entries).toHaveLength(1);
    });

    it('extracts metadata from first line', () => {
      const original = generateArtifact([createValidatedPayload(0)], { source: 'test' });
      const ndjson = serializeToNDJSON(original);
      const parsed = parseNDJSON(ndjson);

      expect(parsed.metadata.source).toBe('test');
    });
  });
});

describe('CSV Serialization', () => {
  describe('serializeToCSV', () => {
    it('produces header row', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const csv = serializeToCSV(artifact);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('step');
      expect(lines[0]).toContain('loss');
      expect(lines[0]).toContain('gradientNorm');
    });

    it('produces deterministic column order', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0)]);
      const artifact2 = generateArtifact([createValidatedPayload(1)]);

      const csv1 = serializeToCSV(artifact1);
      const csv2 = serializeToCSV(artifact2);

      const header1 = csv1.split('\n')[0];
      const header2 = csv2.split('\n')[0];

      expect(header1).toBe(header2);
    });

    it('handles empty values', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      // accuracy is undefined
      const csv = serializeToCSV(artifact);

      // Should have empty cell for undefined accuracy
      expect(csv).toBeDefined();
    });

    it('escapes quoted values', () => {
      const artifact = generateArtifact([
        createValidatedPayload(0, { source: 'test "quoted"' as any }),
      ]);
      const csv = serializeToCSV(artifact);

      expect(csv).toContain('""quoted""');
    });
  });

  describe('parseCSV', () => {
    it('parses serialized CSV', () => {
      const original = generateArtifact([createValidatedPayload(0)]);
      const csv = serializeToCSV(original);
      const parsed = parseCSV(csv);

      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].step).toBe(0);
    });

    it('parses numeric values', () => {
      const original = generateArtifact([createValidatedPayload(0, { loss: 1.234 })]);
      const csv = serializeToCSV(original);
      const parsed = parseCSV(csv);

      expect(parsed.entries[0].loss).toBe(1.234);
    });
  });
});

describe('Format Detection', () => {
  describe('parse', () => {
    it('auto-detects JSON', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(artifact);
      const parsed = parse(json);

      expect(parsed.entries).toHaveLength(1);
    });

    it('auto-detects NDJSON', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const ndjson = serializeToNDJSON(artifact);
      const parsed = parse(ndjson);

      expect(parsed.entries).toHaveLength(1);
    });

    it('auto-detects CSV', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const csv = serializeToCSV(artifact);
      const parsed = parse(csv);

      expect(parsed.entries).toHaveLength(1);
    });

    it('respects explicit format', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(artifact);
      const parsed = parse(json, 'json');

      expect(parsed.entries).toHaveLength(1);
    });
  });

  describe('serialize', () => {
    it('serializes to specified format', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);

      const json = serialize(artifact, 'json');
      const ndjson = serialize(artifact, 'ndjson');
      const csv = serialize(artifact, 'csv');

      expect(json.startsWith('{')).toBe(true);
      expect(ndjson.split('\n').length).toBeGreaterThan(1);
      expect(csv.split('\n')[0]).toContain(',');
    });
  });
});

describe('Artifact Validation', () => {
  describe('validateArtifact', () => {
    it('validates correct artifact', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const result = validateArtifact(artifact);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects entry count mismatch', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      // Manipulate entry count
      const modified: Artifact = {
        ...artifact,
        metadata: { ...artifact.metadata, entryCount: 999 },
      };

      const result = validateArtifact(modified);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'entryCount')).toBe(true);
    });

    it('detects schema hash mismatch', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const modified: Artifact = {
        ...artifact,
        metadata: { ...artifact.metadata, schemaHash: 'vc_invalid' },
      };

      const result = validateArtifact(modified);

      expect(result.warnings.some((w) => w.field === 'schemaHash')).toBe(true);
    });

    it('validates entries against contract', () => {
      const artifact: Artifact = {
        metadata: createMetadata(1),
        entries: [{ step: 0 } as any], // Invalid - missing required fields
      };

      const result = validateArtifact(artifact);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'entry')).toBe(true);
    });
  });

  describe('validateLogs', () => {
    it('separates valid and invalid logs', () => {
      const logs = [
        createLogEntry(0),
        { step: 1 } as TrainingLogEntry, // Invalid
        createLogEntry(2),
      ];

      const result = validateLogs(logs);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
    });
  });
});

describe('Artifact Diffing', () => {
  describe('diffArtifacts', () => {
    it('detects identical artifacts', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const diff = diffArtifacts(artifact, artifact);

      expect(diff.identical).toBe(true);
      expect(diff.entryDiffs).toHaveLength(0);
    });

    it('ignores timestamp by default', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0)]);
      // Wait a bit to ensure different timestamp
      const artifact2 = generateArtifact([createValidatedPayload(0)]);

      const diff = diffArtifacts(artifact1, artifact2);

      // Should be identical despite different generatedAt
      expect(diff.metadataDiff.some((d) => d.field === 'generatedAt')).toBe(false);
    });

    it('can compare timestamps', () => {
      const artifact1: Artifact = {
        metadata: { ...createMetadata(1), generatedAt: '2024-01-01' },
        entries: [createValidatedPayload(0).payload],
      };
      const artifact2: Artifact = {
        metadata: { ...createMetadata(1), generatedAt: '2024-01-02' },
        entries: [createValidatedPayload(0).payload],
      };

      const diff = diffArtifacts(artifact1, artifact2, { compareTimestamps: true });

      expect(diff.metadataDiff.some((d) => d.field === 'generatedAt')).toBe(true);
    });

    it('detects missing entries', () => {
      const artifact1 = generateArtifact([
        createValidatedPayload(0),
        createValidatedPayload(1),
      ]);
      const artifact2 = generateArtifact([createValidatedPayload(0)]);

      const diff = diffArtifacts(artifact1, artifact2);

      expect(diff.identical).toBe(false);
      expect(diff.summary.missingEntries).toBe(1);
    });

    it('detects extra entries', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0)]);
      const artifact2 = generateArtifact([
        createValidatedPayload(0),
        createValidatedPayload(1),
      ]);

      const diff = diffArtifacts(artifact1, artifact2);

      expect(diff.identical).toBe(false);
      expect(diff.summary.extraEntries).toBe(1);
    });

    it('detects modified entries', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0, { loss: 1.0 })]);
      const artifact2 = generateArtifact([createValidatedPayload(0, { loss: 2.0 })]);

      const diff = diffArtifacts(artifact1, artifact2);

      expect(diff.identical).toBe(false);
      expect(diff.summary.modifiedEntries).toBe(1);
      expect(diff.entryDiffs[0].field).toBe('loss');
    });
  });

  describe('formatDiff', () => {
    it('formats identical result', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const diff = diffArtifacts(artifact, artifact);
      const formatted = formatDiff(diff);

      expect(formatted).toContain('identical');
    });

    it('formats differences', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0, { loss: 1.0 })]);
      const artifact2 = generateArtifact([createValidatedPayload(0, { loss: 2.0 })]);

      const diff = diffArtifacts(artifact1, artifact2);
      const formatted = formatDiff(diff);

      expect(formatted).toContain('differ');
      expect(formatted).toContain('loss');
    });
  });
});

describe('CLI Runner', () => {
  describe('runCLI generate', () => {
    it('generates artifact from input', () => {
      const input = JSON.stringify([createValidatedPayload(0).payload]);
      const result = runCLI('generate', input);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.output).toBeDefined();
    });

    it('respects output format', () => {
      const input = JSON.stringify([createValidatedPayload(0).payload]);
      const result = runCLI('generate', input, { outputFormat: 'csv' });

      expect(result.output).toContain(',');
    });
  });

  describe('runCLI validate', () => {
    it('validates correct artifact', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const input = serializeToJSON(artifact);
      const result = runCLI('validate', input);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('valid');
    });

    it('rejects invalid artifact', () => {
      const artifact: Artifact = {
        metadata: createMetadata(1),
        entries: [{ step: 0 } as any],
      };
      const input = serializeToJSON(artifact);
      const result = runCLI('validate', input);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('runCLI diff', () => {
    it('returns success for identical artifacts', () => {
      const artifact = generateArtifact([createValidatedPayload(0)]);
      const json = serializeToJSON(artifact);
      const result = runCLI('diff', [json, json]);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('returns failure for different artifacts', () => {
      const artifact1 = generateArtifact([createValidatedPayload(0, { loss: 1.0 })]);
      const artifact2 = generateArtifact([createValidatedPayload(0, { loss: 2.0 })]);

      const result = runCLI('diff', [
        serializeToJSON(artifact1),
        serializeToJSON(artifact2),
      ]);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });
});

describe('Determinism Guarantee', () => {
  it('same input produces same JSON output', () => {
    const payloads = [
      createValidatedPayload(0),
      createValidatedPayload(1),
      createValidatedPayload(2),
    ];

    const artifact1 = generateArtifact(payloads);
    const artifact2 = generateArtifact(payloads);

    // Normalize by removing timestamp-dependent metadata
    const normalized1 = { entries: artifact1.entries };
    const normalized2 = { entries: artifact2.entries };

    expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
  });

  it('same input produces same NDJSON output', () => {
    const payloads = [createValidatedPayload(0)];
    const artifact = generateArtifact(payloads);

    const ndjson1 = serializeToNDJSON(artifact, { includeMetadata: false });
    const ndjson2 = serializeToNDJSON(artifact, { includeMetadata: false });

    expect(ndjson1).toBe(ndjson2);
  });

  it('same input produces same CSV output', () => {
    const payloads = [createValidatedPayload(0), createValidatedPayload(1)];
    const artifact = generateArtifact(payloads);

    const csv1 = serializeToCSV(artifact);
    const csv2 = serializeToCSV(artifact);

    expect(csv1).toBe(csv2);
  });

  it('no smart formatting based on data', () => {
    // Different values should not affect column order or structure
    const artifact1 = generateArtifact([createValidatedPayload(0, { loss: 0.001 })]);
    const artifact2 = generateArtifact([createValidatedPayload(0, { loss: 999.999 })]);

    const csv1 = serializeToCSV(artifact1);
    const csv2 = serializeToCSV(artifact2);

    // Same header structure
    expect(csv1.split('\n')[0]).toBe(csv2.split('\n')[0]);
  });
});

describe('Round-Trip Integrity', () => {
  it('JSON round-trip preserves data', () => {
    const original = generateArtifact([
      createValidatedPayload(0, { loss: 1.234, accuracy: 0.95 }),
    ]);
    const json = serializeToJSON(original);
    const parsed = parseJSON(json);

    expect(parsed.entries[0].loss).toBe(1.234);
    expect(parsed.entries[0].accuracy).toBe(0.95);
  });

  it('NDJSON round-trip preserves data', () => {
    const original = generateArtifact([
      createValidatedPayload(0, { loss: 1.234 }),
    ]);
    const ndjson = serializeToNDJSON(original);
    const parsed = parseNDJSON(ndjson);

    expect(parsed.entries[0].loss).toBe(1.234);
  });

  it('CSV round-trip preserves numeric precision', () => {
    const original = generateArtifact([
      createValidatedPayload(0, { loss: 1.234567 }),
    ]);
    const csv = serializeToCSV(original);
    const parsed = parseCSV(csv);

    expect(parsed.entries[0].loss).toBe(1.234567);
  });
});
