import { describe, it, expect } from 'vitest';
import { renderAscii, diff, fingerprintCapture } from '@mcptoolshop/websketch-ir';

describe('websketch-mcp dependencies', () => {
  it('imports renderAscii from websketch-ir', () => {
    expect(typeof renderAscii).toBe('function');
  });

  it('imports diff from websketch-ir', () => {
    expect(typeof diff).toBe('function');
  });

  it('imports fingerprintCapture from websketch-ir', () => {
    expect(typeof fingerprintCapture).toBe('function');
  });
});
