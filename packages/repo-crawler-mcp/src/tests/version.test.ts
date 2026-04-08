import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'),
);

describe('version alignment', () => {
  it('package.json version is valid semver', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('package.json version is >= 1.0.0', () => {
    const [major] = pkg.version.split('.').map(Number);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it('CHANGELOG.md mentions current version', () => {
    const changelog = readFileSync(
      join(__dirname, '..', '..', 'CHANGELOG.md'),
      'utf-8',
    );
    expect(changelog).toContain(`[${pkg.version}]`);
  });
});
