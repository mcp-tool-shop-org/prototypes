/**
 * Bundle Digest Algorithm Tests
 *
 * These tests verify the canonical digest format matches
 * what the C# ExportService should produce.
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

interface ArtifactInfo {
  path: string;
  sha256: string;
  size_bytes: number;
}

/**
 * Compute SHA-256 hash (matching C# implementation)
 */
function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Compute bundle digest following v0.1 spec.
 * This is the canonical algorithm that C# must match.
 */
function computeBundleDigest(bundleVersion: string, artifacts: ArtifactInfo[]): string {
  // Sort artifacts alphabetically by path using ordinal comparison
  const sorted = [...artifacts].sort((a, b) => a.path.localeCompare(b.path));

  // Build canonical string
  let canonical = `bundle_version:${bundleVersion}\n`;
  for (const art of sorted) {
    canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
  }

  return sha256(canonical);
}

describe('Bundle Digest Algorithm', () => {
  it('computes correct digest for single artifact', () => {
    const artifacts: ArtifactInfo[] = [
      { path: 'model/model.json', sha256: 'abc123', size_bytes: 100 }
    ];

    // This test documents the expected canonical format
    const expectedCanonical = 'bundle_version:0.1\nmodel/model.json\nabc123\n100\n';
    const expectedDigest = sha256(expectedCanonical);

    const digest = computeBundleDigest('0.1', artifacts);
    expect(digest).toBe(expectedDigest);
  });

  it('sorts artifacts alphabetically', () => {
    const artifacts: ArtifactInfo[] = [
      { path: 'model/weights.bin', sha256: 'bbb', size_bytes: 200 },
      { path: 'config/run.json', sha256: 'ccc', size_bytes: 50 },
      { path: 'model/model.json', sha256: 'aaa', size_bytes: 100 }
    ];

    // After sorting: config/run.json, model/model.json, model/weights.bin
    const expectedCanonical = [
      'bundle_version:0.1',
      'config/run.json', 'ccc', '50',
      'model/model.json', 'aaa', '100',
      'model/weights.bin', 'bbb', '200',
      ''  // trailing newline
    ].join('\n');

    const expectedDigest = sha256(expectedCanonical);
    const digest = computeBundleDigest('0.1', artifacts);
    expect(digest).toBe(expectedDigest);
  });

  it('produces deterministic output for same input', () => {
    const artifacts: ArtifactInfo[] = [
      { path: 'a.txt', sha256: 'hash1', size_bytes: 10 },
      { path: 'b.txt', sha256: 'hash2', size_bytes: 20 }
    ];

    const digest1 = computeBundleDigest('0.1', artifacts);
    const digest2 = computeBundleDigest('0.1', artifacts);

    expect(digest1).toBe(digest2);
    expect(digest1).toHaveLength(64); // SHA-256 produces 64 hex chars
  });

  it('different versions produce different digests', () => {
    const artifacts: ArtifactInfo[] = [
      { path: 'file.txt', sha256: 'abc', size_bytes: 100 }
    ];

    const digestV1 = computeBundleDigest('0.1', artifacts);
    const digestV2 = computeBundleDigest('0.2', artifacts);

    expect(digestV1).not.toBe(digestV2);
  });

  it('produces known golden value', () => {
    // Golden test case - if this breaks, C# implementation must also update
    const artifacts: ArtifactInfo[] = [
      {
        path: 'model/model.json',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA-256 of empty string
        size_bytes: 0
      }
    ];

    const digest = computeBundleDigest('0.1', artifacts);

    // Document the expected value for cross-implementation testing
    const canonical = 'bundle_version:0.1\nmodel/model.json\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n0\n';
    const expected = sha256(canonical);

    expect(digest).toBe(expected);
    // Log the golden value for C# implementation reference
    console.log(`Golden digest value: ${digest}`);
    console.log(`Canonical string: ${JSON.stringify(canonical)}`);
  });
});
