import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('version alignment', () => {
  const corePkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));
  const rootPkg = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', '..', 'package.json'), 'utf-8'));

  it('core package version is semver', () => {
    const parts = corePkg.version.split('.');
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(Number.isInteger(Number(part))).toBe(true);
    }
  });

  it('core version matches root version', () => {
    expect(corePkg.version).toBe(rootPkg.version);
  });

  it('CHANGELOG mentions current version', () => {
    const changelog = readFileSync(join(__dirname, '..', '..', '..', '..', 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain(corePkg.version);
  });
});
