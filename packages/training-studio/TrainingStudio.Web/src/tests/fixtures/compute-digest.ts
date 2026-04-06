/**
 * Compute bundle digest for golden fixture
 * Run with: npx tsx src/tests/fixtures/compute-digest.ts
 */

import { createHash } from 'crypto';

const BUNDLE_VERSION = '0.1';

interface ArtifactEntry {
  path: string;
  sha256: string;
  size_bytes: number;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function computeBundleDigest(artifacts: ArtifactEntry[], bundleVersion: string): string {
  const sorted = [...artifacts].sort((a, b) => a.path.localeCompare(b.path));

  let canonical = `bundle_version:${bundleVersion}\n`;
  for (const art of sorted) {
    canonical += `${art.path}\n${art.sha256}\n${art.size_bytes}\n`;
  }

  console.log('Canonical string:');
  console.log(canonical);
  console.log('---');

  return sha256(canonical);
}

// Golden v1 artifacts (already sorted by path)
const artifacts: ArtifactEntry[] = [
  { path: 'config/run_config.json', sha256: 'ae5eca0136ba71775cd4552813a9d64aa992c81c6e19dddc473db4b8199ca901', size_bytes: 139 },
  { path: 'data/schema.json', sha256: '5afe14baea8df0d9d96756b205f9c79d3725920231940233417b4d38ee1337d3', size_bytes: 154 },
  { path: 'metrics/metrics.jsonl', sha256: '8fff11a08bd4db690e9047820a777dcfdf30dc583a4685b856c777817bd60691', size_bytes: 179 },
  { path: 'metrics/summary.json', sha256: '851df1ebd2e5cde7345defec71981c7b0e46c67e5c45c031bd73694d98600307', size_bytes: 193 },
  { path: 'model/model.json', sha256: '52c2b401364e3484a9fa10bb010235a419995b64f0cee6cd75dd416856236b15', size_bytes: 223 },
  { path: 'model/weights.bin', sha256: '18b1cb9d01d1298fb45e2ca9a181a08134c08d7722c88c3348a11ff2171da6cc', size_bytes: 6 }
];

const digest = computeBundleDigest(artifacts, BUNDLE_VERSION);
console.log('Bundle digest:', digest);
