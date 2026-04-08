import { describe, it, expect } from 'vitest';
import { enforceCapabilities, formatViolations } from '../src/runtime.js';
import type { CapabilitySpec } from '../src/types.js';

describe('enforceCapabilities', () => {
  describe('shell ceiling', () => {
    it('allows basic shell capabilities', () => {
      const caps: CapabilitySpec = {
        filesystem: 'workspace-only',
        git: true,
        python: false,
        network: false,
        processes: 'none',
        package_install: false,
        destructive: false,
      };
      expect(enforceCapabilities('shell', caps)).toEqual([]);
    });

    it('rejects python requirement on shell', () => {
      const caps: CapabilitySpec = { python: true };
      const violations = enforceCapabilities('shell', caps);
      expect(violations).toHaveLength(1);
      expect(violations[0].capability).toBe('python');
    });

    it('rejects destructive on shell', () => {
      const violations = enforceCapabilities('shell', { destructive: true });
      expect(violations).toHaveLength(1);
      expect(violations[0].capability).toBe('destructive');
    });

    it('rejects package_install on shell', () => {
      const violations = enforceCapabilities('shell', { package_install: true });
      expect(violations).toHaveLength(1);
      expect(violations[0].capability).toBe('package_install');
    });

    it('rejects network on shell', () => {
      const violations = enforceCapabilities('shell', { network: true });
      expect(violations).toHaveLength(1);
    });

    it('rejects process inspection on shell', () => {
      const violations = enforceCapabilities('shell', { processes: 'inspect-only' });
      expect(violations).toHaveLength(1);
      expect(violations[0].capability).toBe('processes');
    });
  });

  describe('venv ceiling', () => {
    it('allows python + packages', () => {
      const caps: CapabilitySpec = {
        python: true,
        package_install: true,
        filesystem: 'workspace-only',
      };
      expect(enforceCapabilities('venv', caps)).toEqual([]);
    });

    it('allows inspect-only processes', () => {
      expect(enforceCapabilities('venv', { processes: 'inspect-only' })).toEqual([]);
    });

    it('rejects destructive on venv — venv is NOT a safety boundary', () => {
      const violations = enforceCapabilities('venv', { destructive: true });
      expect(violations).toHaveLength(1);
      expect(violations[0].capability).toBe('destructive');
      expect(violations[0].runtime).toBe('venv');
    });

    it('rejects full process control on venv', () => {
      const violations = enforceCapabilities('venv', { processes: 'full' });
      expect(violations).toHaveLength(1);
    });

    it('rejects network on venv', () => {
      const violations = enforceCapabilities('venv', { network: true });
      expect(violations).toHaveLength(1);
    });

    it('rejects full filesystem on venv', () => {
      const violations = enforceCapabilities('venv', { filesystem: 'full' });
      expect(violations).toHaveLength(1);
    });
  });

  describe('docker ceiling', () => {
    it('allows everything', () => {
      const caps: CapabilitySpec = {
        filesystem: 'full',
        network: true,
        git: true,
        python: true,
        processes: 'full',
        package_install: true,
        destructive: true,
      };
      expect(enforceCapabilities('docker', caps)).toEqual([]);
    });

    it('allows destructive — docker is the containment boundary', () => {
      expect(enforceCapabilities('docker', { destructive: true })).toEqual([]);
    });
  });

  describe('multiple violations', () => {
    it('reports all violations at once', () => {
      const caps: CapabilitySpec = {
        python: true,
        destructive: true,
        network: true,
        processes: 'full',
      };
      const violations = enforceCapabilities('shell', caps);
      expect(violations.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('formatViolations', () => {
  it('returns empty string for no violations', () => {
    expect(formatViolations([])).toBe('');
  });

  it('formats violations into readable message', () => {
    const violations = enforceCapabilities('shell', { python: true, destructive: true });
    const message = formatViolations(violations);
    expect(message).toContain('shell');
    expect(message).toContain('python');
    expect(message).toContain('destructive');
  });
});
