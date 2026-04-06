/**
 * Bundle Validator Integration Tests
 *
 * Test the full validation pipeline against realistic bundle structures.
 * Uses BundleBuilder fixtures to create test scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  validateBundle,
  validateManifestStructure,
  formatValidationResultJSON,
  getExitCode,
  EXIT_CODES,
  createMemoryAccess
} from '../validation/bundle-validator';
import {
  BUNDLE_VERSION,
  ValidationErrorCode,
  ValidationWarningCode
} from '../types/bundle';
import { BundleBuilder, BundleFixtures, createMemoryBundleAccess } from './fixtures/bundle-builder';

describe('Bundle Validator Integration Tests', () => {
  describe('Valid Bundles', () => {
    it('validates a complete bundle with all required artifacts', async () => {
      const { access } = BundleFixtures.validBundle();
      const result = await validateBundle(access);

      expect(result.valid).toBe(true);
      expect(result.version).toBe('0.1');
      expect(result.errors).toHaveLength(0);
      expect(result.stats.artifacts_verified).toBe(6);
      expect(getExitCode(result)).toBe(0);
    });

    it('validates bundle with custom IDs', async () => {
      const customId = '12345678-1234-4123-8123-123456789abc';
      const runId = 'abcdef01-abcd-4abc-8abc-abcdefabcdef';

      const { files, fileList } = new BundleBuilder()
        .withBundleId(customId)
        .withRunId(runId)
        .withRequiredArtifacts()
        .build();

      const access = createMemoryBundleAccess(files, fileList);
      const result = await validateBundle(access);

      expect(result.valid).toBe(true);
      expect(result.bundle_id).toBe(customId);
    });

    it('validates bundle with extra unlisted files', async () => {
      const { access } = BundleFixtures.extraFilesBundle();
      const result = await validateBundle(access);

      expect(result.valid).toBe(true);
      // Should warn about extra file
      expect(result.warnings.some(w => w.code === ValidationWarningCode.W_UNLISTED_FILE)).toBe(true);
      expect(getExitCode(result)).toBe(2); // EXIT_CODES.VALID_WITH_WARNINGS
    });
  });

  describe('Missing Artifacts', () => {
    it('fails when bundle.json is missing', async () => {
      const files = new Map<string, Uint8Array>();
      const access = createMemoryBundleAccess(files, []);

      const result = await validateBundle(access);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === ValidationErrorCode.E_NO_MANIFEST)).toBe(true);
      expect(getExitCode(result)).toBe(3); // EXIT_CODES.INVALID
    });

    it('fails when required artifact is missing', async () => {
      const { access } = BundleFixtures.missingArtifactBundle();
      const result = await validateBundle(access);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === ValidationErrorCode.E_ARTIFACT_MISSING)).toBe(true);
      expect(getExitCode(result)).toBe(3);
    });
  });

  describe('Hash Verification', () => {
    it('rejects bundle with hash mismatch', async () => {
      const { access } = BundleFixtures.corruptedHashBundle();
      const result = await validateBundle(access);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === ValidationErrorCode.E_HASH_MISMATCH)).toBe(true);
      expect(getExitCode(result)).toBe(3);
    });

    it('verifies all artifact hashes match', async () => {
      const { access } = BundleFixtures.validBundle();
      const result = await validateBundle(access);

      expect(result.valid).toBe(true);
      expect(result.stats.artifacts_verified).toBeGreaterThan(0);
      expect(result.stats.artifacts_verified).toBe(result.stats.artifacts_listed);
    });
  });

  describe('Manifest Structure', () => {
    it('validates manifest structure without file access', () => {
      const validManifest = {
        bundle_version: '0.1',
        bundle_id: '00000000-0000-4000-8000-000000000000',
        run_id: '11111111-1111-4111-8111-111111111111',
        bundle_digest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        schema_uri: 'https://example.com/schema.json',
        schema_version: '0.1',
        created_utc: '2024-01-01T00:00:00Z',
        app: { name: 'Test', version: '1.0' },
        backend: { name: 'TensorFlow.js', version: '4.0' },
        dataset: { name: 'test' },
        model: { type: 'sequential' },
        training: { epochs: 10 },
        artifacts: [
          {
            path: 'model/model.json',
            sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            size_bytes: 100
          }
        ]
      };

      const errors = validateManifestStructure(validManifest);
      expect(errors).toHaveLength(0);
    });

    it('rejects manifest with invalid bundle_version', () => {
      const invalidManifest = {
        bundle_version: '1.0', // Wrong version
        bundle_id: '00000000-0000-4000-8000-000000000000',
        artifacts: []
      };

      const errors = validateManifestStructure(invalidManifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_VERSION_UNSUPPORTED)).toBe(true);
    });

    it('rejects manifest missing required fields', () => {
      const incompleteManifest = {
        bundle_version: '0.1'
        // Missing many required fields
      };

      const errors = validateManifestStructure(incompleteManifest);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === ValidationErrorCode.E_MISSING_FIELD)).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      const invalidManifest = {
        bundle_version: '0.1',
        bundle_id: 'not-a-uuid',
        run_id: '11111111-1111-4111-8111-111111111111',
        bundle_digest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        schema_uri: 'https://example.com/schema.json',
        schema_version: '0.1',
        created_utc: '2024-01-01T00:00:00Z',
        app: {},
        backend: {},
        dataset: {},
        model: {},
        training: {},
        artifacts: []
      };

      const errors = validateManifestStructure(invalidManifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD && e.message.includes('bundle_id'))).toBe(true);
    });

    it('rejects artifact with invalid sha256', () => {
      const invalidManifest = {
        bundle_version: '0.1',
        bundle_id: '00000000-0000-4000-8000-000000000000',
        run_id: '11111111-1111-4111-8111-111111111111',
        bundle_digest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        schema_uri: 'https://example.com/schema.json',
        schema_version: '0.1',
        created_utc: '2024-01-01T00:00:00Z',
        app: {},
        backend: {},
        dataset: {},
        model: {},
        training: {},
        artifacts: [
          {
            path: 'model/model.json',
            sha256: 'not-a-valid-hex',
            size_bytes: 100
          }
        ]
      };

      const errors = validateManifestStructure(invalidManifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD && e.message.includes('sha256'))).toBe(true);
    });

    it('rejects artifact with negative size_bytes', () => {
      const invalidManifest = {
        bundle_version: '0.1',
        bundle_id: '00000000-0000-4000-8000-000000000000',
        run_id: '11111111-1111-4111-8111-111111111111',
        bundle_digest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        schema_uri: 'https://example.com/schema.json',
        schema_version: '0.1',
        created_utc: '2024-01-01T00:00:00Z',
        app: {},
        backend: {},
        dataset: {},
        model: {},
        training: {},
        artifacts: [
          {
            path: 'model/model.json',
            sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            size_bytes: -1
          }
        ]
      };

      const errors = validateManifestStructure(invalidManifest);
      expect(errors.some(e => e.code === ValidationErrorCode.E_INVALID_FIELD && e.message.includes('size_bytes'))).toBe(true);
    });
  });

  describe('JSON Output Formatting', () => {
    it('formats valid bundle result as JSON', () => {
      const result = {
        valid: true,
        version: '0.1',
        bundle_id: '00000000-0000-4000-8000-000000000000',
        bundle_digest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        schema_uri: 'https://example.com/schema.json',
        schema_version: '0.1',
        errors: [],
        warnings: [],
        stats: {
          files_total: 7,
          artifacts_listed: 6,
          artifacts_verified: 6
        },
        summary: 'VALID: v0.1 bundle with 6 artifacts'
      };

      const json = formatValidationResultJSON(result);
      expect(json).toContain('"ok": true');
      expect(json).toContain('"exit_code": 0');
      expect(json).toContain('"bundle_id"');
    });

    it('formats invalid bundle result as JSON', () => {
      const result = {
        valid: false,
        version: null,
        bundle_id: null,
        bundle_digest: null,
        schema_uri: null,
        schema_version: null,
        errors: [{ code: 'E_NO_MANIFEST', message: 'bundle.json not found' }],
        warnings: [],
        stats: { files_total: 0, artifacts_listed: 0, artifacts_verified: 0 },
        summary: 'INVALID: bundle.json not found'
      };

      const json = formatValidationResultJSON(result);
      expect(json).toContain('"ok": false');
      expect(json).toContain('"exit_code": 3');
    });
  });

  describe('Exit Codes', () => {
    it('returns 0 for valid bundle', () => {
      const validResult = {
        valid: true,
        errors: [],
        warnings: [],
        summary: 'VALID'
      } as any;

      expect(getExitCode(validResult)).toBe(0);
    });

    it('returns 2 for valid bundle with warnings', () => {
      const warningResult = {
        valid: true,
        errors: [],
        warnings: [{ code: 'W_UNLISTED_FILE', message: 'Extra file found' }],
        summary: 'VALID_WITH_WARNINGS'
      } as any;

      expect(getExitCode(warningResult)).toBe(2);
    });

    it('returns 3 for invalid bundle', () => {
      const invalidResult = {
        valid: false,
        errors: [{ code: 'E_NO_MANIFEST', message: 'Missing manifest' }],
        warnings: [],
        summary: 'INVALID'
      } as any;

      expect(getExitCode(invalidResult)).toBe(3);
    });
  });
});
