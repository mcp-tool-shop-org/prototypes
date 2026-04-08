import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('version alignment', () => {
  const pkgPath = join(__dirname, '..', '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('package.json version exists', () => {
    expect(pkg.version).toBeTruthy();
  });

  it('version is semver', () => {
    const parts = pkg.version.split('.');
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(Number.isInteger(Number(part))).toBe(true);
    }
  });

  it('CHANGELOG mentions current version', () => {
    const changelog = readFileSync(join(__dirname, '..', '..', 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain(pkg.version);
  });
});
