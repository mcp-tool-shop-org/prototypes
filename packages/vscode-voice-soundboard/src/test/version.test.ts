import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

describe('version consistency', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

  it('package.json version is semver', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('version is >= 1.0.0', () => {
    const major = parseInt(pkg.version.split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it('CHANGELOG mentions current version', () => {
    const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain(pkg.version);
  });

  it('extension has publisher field', () => {
    expect(pkg.publisher).toBeTruthy();
  });

  it('extension has VS Code engine constraint', () => {
    expect(pkg.engines?.vscode).toBeTruthy();
  });
});
