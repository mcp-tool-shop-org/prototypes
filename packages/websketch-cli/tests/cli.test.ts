import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  renderAscii,
  renderForLLM,
  renderStructure,
  fingerprintCapture,
  fingerprintLayout,
  diff,
  formatDiff,
  formatDiffJson,
} from '@mcptoolshop/websketch-ir';

describe('websketch-cli dependencies', () => {
  it('imports all render functions from websketch-ir', () => {
    expect(typeof renderAscii).toBe('function');
    expect(typeof renderForLLM).toBe('function');
    expect(typeof renderStructure).toBe('function');
  });

  it('imports all fingerprint functions from websketch-ir', () => {
    expect(typeof fingerprintCapture).toBe('function');
    expect(typeof fingerprintLayout).toBe('function');
  });

  it('imports all diff functions from websketch-ir', () => {
    expect(typeof diff).toBe('function');
    expect(typeof formatDiff).toBe('function');
    expect(typeof formatDiffJson).toBe('function');
  });
});

describe('CLI version output', () => {
  it('--version matches package.json version', () => {
    const pkgJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );
    const output = execSync('node dist/index.js --version', { encoding: 'utf-8' }).trim();
    expect(output).toContain(pkgJson.version);
  });
});
