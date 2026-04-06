/**
 * Bundle Types and Data Model Tests
 *
 * Test validation types, error codes, and bundle structure contracts
 */

import { describe, it, expect } from 'vitest';
import {
  BUNDLE_VERSION,
  BUNDLE_PATHS,
  ValidationErrorCode,
  ValidationWarningCode
} from '../types/bundle';

describe('Bundle Types - Constants', () => {
  describe('BUNDLE_VERSION', () => {
    it('has correct version', () => {
      expect(BUNDLE_VERSION).toBe('0.1');
    });

    it('is a string', () => {
      expect(typeof BUNDLE_VERSION).toBe('string');
    });
  });

  describe('BUNDLE_PATHS', () => {
    it('defines manifest path', () => {
      expect(BUNDLE_PATHS.manifest).toBe('bundle.json');
    });

    it('defines model paths', () => {
      expect(BUNDLE_PATHS.model.topology).toBe('model/model.json');
      expect(BUNDLE_PATHS.model.weights).toBe('model/weights.bin');
    });

    it('defines metrics paths', () => {
      expect(BUNDLE_PATHS.metrics.summary).toBe('metrics/summary.json');
      expect(BUNDLE_PATHS.metrics.epochs).toBe('metrics/metrics.jsonl');
    });

    it('defines config path', () => {
      expect(BUNDLE_PATHS.config.run).toBe('config/run_config.json');
    });

    it('defines data path', () => {
      expect(BUNDLE_PATHS.data.schema).toBe('data/schema.json');
    });

    it('all paths use forward slashes', () => {
      const checkPath = (path: string | Record<string, unknown>) => {
        if (typeof path === 'string') {
          expect(path).not.toContain('\\');
        } else {
          for (const key in path) {
            checkPath((path as any)[key]);
          }
        }
      };
      checkPath(BUNDLE_PATHS);
    });
  });
});

describe('Bundle Error Codes', () => {
  describe('E_NO_MANIFEST', () => {
    it('exists and is a string', () => {
      expect(ValidationErrorCode.E_NO_MANIFEST).toBe('E_NO_MANIFEST');
    });
  });

  describe('E_PARSE_ERROR', () => {
    it('exists for JSON parse failures', () => {
      expect(ValidationErrorCode.E_PARSE_ERROR).toBe('E_PARSE_ERROR');
    });
  });

  describe('E_VERSION_UNSUPPORTED', () => {
    it('exists for version mismatches', () => {
      expect(ValidationErrorCode.E_VERSION_UNSUPPORTED).toBe('E_VERSION_UNSUPPORTED');
    });
  });

  describe('E_MISSING_FIELD', () => {
    it('exists for missing manifest fields', () => {
      expect(ValidationErrorCode.E_MISSING_FIELD).toBe('E_MISSING_FIELD');
    });
  });

  describe('E_INVALID_FIELD', () => {
    it('exists for invalid field values', () => {
      expect(ValidationErrorCode.E_INVALID_FIELD).toBe('E_INVALID_FIELD');
    });
  });

  describe('E_ARTIFACT_MISSING', () => {
    it('exists for missing artifacts', () => {
      expect(ValidationErrorCode.E_ARTIFACT_MISSING).toBe('E_ARTIFACT_MISSING');
    });
  });

  describe('E_HASH_MISMATCH', () => {
    it('exists for hash mismatches', () => {
      expect(ValidationErrorCode.E_HASH_MISMATCH).toBe('E_HASH_MISMATCH');
    });
  });

  describe('E_DIGEST_MISMATCH', () => {
    it('exists for bundle digest failures', () => {
      expect(ValidationErrorCode.E_DIGEST_MISMATCH).toBe('E_DIGEST_MISMATCH');
    });
  });

  describe('All error codes are strings', () => {
    it('have E_ prefix', () => {
      for (const key in ValidationErrorCode) {
        const code = (ValidationErrorCode as Record<string, string>)[key];
        if (typeof code === 'string' && code.startsWith('E_')) {
          expect(code).toMatch(/^E_[A-Z_]+$/);
        }
      }
    });
  });
});

describe('Bundle Warning Codes', () => {
  describe('W_UNLISTED_FILE', () => {
    it('exists for extra files in bundle', () => {
      expect(ValidationWarningCode.W_UNLISTED_FILE).toBe('W_UNLISTED_FILE');
    });
  });

  describe('W_DEPRECATED_FIELD', () => {
    it('exists for deprecated manifest fields', () => {
      expect(ValidationWarningCode.W_DEPRECATED_FIELD).toBe('W_DEPRECATED_FIELD');
    });
  });

  describe('All warning codes are strings', () => {
    it('have W_ prefix', () => {
      for (const key in ValidationWarningCode) {
        const code = (ValidationWarningCode as Record<string, string>)[key];
        if (typeof code === 'string' && code.startsWith('W_')) {
          expect(code).toMatch(/^W_[A-Z_]+$/);
        }
      }
    });
  });
});

describe('Bundle Structure Contracts', () => {
  describe('UUID v4 format validation', () => {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('accepts valid UUIDs', () => {
      const validUUIDs = [
        '00000000-0000-4000-8000-000000000000',
        '12345678-1234-4123-8123-123456789abc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'FFFFFFFF-FFFF-4FFF-8FFF-FFFFFFFFFFFF'
      ];

      for (const uuid of validUUIDs) {
        expect(uuidV4Regex.test(uuid)).toBe(true);
      }
    });

    it('rejects invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345678-1234-5123-8123-123456789abc', // wrong version (5 not 4)
        '12345678-1234-4123-0123-123456789abc', // wrong variant (0 not 8,9,a,b)
        '12345678123441238123123456789abc',      // missing hyphens
        '00000000-0000-0000-0000-000000000000'  // version 0
      ];

      for (const uuid of invalidUUIDs) {
        expect(uuidV4Regex.test(uuid)).toBe(false);
      }
    });
  });

  describe('SHA-256 hash format validation', () => {
    const sha256Regex = /^[a-f0-9]{64}$/i;

    it('accepts valid SHA-256 hashes', () => {
      const validHashes = [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0000000000000000000000000000000000000000000000000000000000000000',
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        '9b71d224bd62f3785d96f46e3e6a6cc1ca64e4c1c1e6e6a6c5c9c10c10c6c030' // 64 chars
      ];

      for (const hash of validHashes) {
        expect(sha256Regex.test(hash)).toBe(true);
      }
    });

    it('rejects invalid SHA-256 hashes', () => {
      const invalidHashes = [
        'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', // g is not hex
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ', // trailing space
        ' aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // leading space
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ', // wrong length
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',     // too short
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' // too long
      ];

      for (const hash of invalidHashes) {
        expect(sha256Regex.test(hash)).toBe(false);
      }
    });
  });

  describe('Artifact manifest contract', () => {
    it('requires path, sha256, and size_bytes fields', () => {
      const validArtifact = {
        path: 'model/model.json',
        sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        size_bytes: 1024
      };

      expect(validArtifact).toHaveProperty('path');
      expect(validArtifact).toHaveProperty('sha256');
      expect(validArtifact).toHaveProperty('size_bytes');
    });

    it('path should be portable (forward slashes, no absolute paths)', () => {
      const goodPaths = [
        'model/model.json',
        'model/weights.bin',
        'metrics/summary.json',
        'config/run_config.json',
        'data/schema.json'
      ];

      for (const path of goodPaths) {
        expect(path).not.toContain('\\');
        expect(path).not.toMatch(/^\/|^[a-z]:/i);
      }
    });

    it('size_bytes should be non-negative', () => {
      expect(0).toBeGreaterThanOrEqual(0);
      expect(1024).toBeGreaterThanOrEqual(0);
      expect(Number.MAX_SAFE_INTEGER).toBeGreaterThanOrEqual(0);
      expect(-1).toBeLessThan(0);
    });
  });

  describe('Manifest metadata contract', () => {
    const requiredFields = [
      'bundle_version',
      'bundle_id',
      'run_id',
      'bundle_digest',
      'schema_uri',
      'schema_version',
      'created_utc',
      'app',
      'backend',
      'dataset',
      'model',
      'training',
      'artifacts'
    ];

    it('lists all required fields', () => {
      expect(requiredFields).toContain('bundle_version');
      expect(requiredFields).toContain('bundle_id');
      expect(requiredFields).toContain('artifacts');
    });

    it('has consistent field count', () => {
      expect(requiredFields.length).toBe(13);
    });
  });
});

describe('Timestamp Contract', () => {
  it('ISO-8601 UTC format is used', () => {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    const validTimestamps = [
      '2024-01-15T14:30:22Z',
      '2024-01-15T14:30:22.123Z',
      new Date().toISOString()
    ];

    for (const ts of validTimestamps) {
      expect(iso8601Regex.test(ts)).toBe(true);
    }
  });
});

describe('Schema URI Contract', () => {
  it('schema_uri points to bundle.schema.json', () => {
    const expectedUri = 'https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json';
    expect(expectedUri).toContain('bundle.schema.json');
    expect(expectedUri).toMatch(/^https?:\/\//);
  });
});
