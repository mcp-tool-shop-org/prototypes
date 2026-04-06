import { describe, it, expect } from 'vitest';
import {
  renderAscii,
  diff,
  fingerprintCapture,
  validateCapture,
  isWebSketchException,
  formatWebSketchError,
  WebSketchException,
  type WebSketchCapture,
} from '@mcptoolshop/websketch-ir';

// =============================================================================
// IR validation imports available to MCP
// =============================================================================

describe('websketch-mcp validation imports', () => {
  it('imports validateCapture from websketch-ir', () => {
    expect(typeof validateCapture).toBe('function');
  });

  it('imports isWebSketchException from websketch-ir', () => {
    expect(typeof isWebSketchException).toBe('function');
  });

  it('imports formatWebSketchError from websketch-ir', () => {
    expect(typeof formatWebSketchError).toBe('function');
  });

  it('imports WebSketchException class from websketch-ir', () => {
    const err = new WebSketchException({
      code: 'WS_INTERNAL',
      message: 'test',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.ws.code).toBe('WS_INTERNAL');
  });
});

// =============================================================================
// validateCapture for MCP tool args
// =============================================================================

const validCapture: WebSketchCapture = {
  version: '0.1',
  url: 'https://example.com',
  timestamp_ms: 1700000000000,
  viewport: { w_px: 1920, h_px: 1080, aspect: 1920 / 1080 },
  compiler: { name: 'websketch-ir', version: '0.2.1', options_hash: 'test' },
  root: {
    id: '',
    role: 'PAGE',
    bbox: [0, 0, 1, 1],
    interactive: false,
    visible: true,
  },
};

describe('validateCapture for MCP args', () => {
  it('valid capture → no issues', () => {
    const issues = validateCapture(validCapture);
    expect(issues).toHaveLength(0);
  });

  it('empty object → issues for missing fields', () => {
    const issues = validateCapture({});
    expect(issues.length).toBeGreaterThan(0);
    // Should report missing version, url, timestamp_ms, viewport, compiler, root
    const paths = issues.map((i) => i.path);
    expect(paths).toContain('version');
    expect(paths).toContain('url');
  });

  it('null → issue', () => {
    const issues = validateCapture(null);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('string → issue', () => {
    const issues = validateCapture('not an object');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('capture with invalid node role → issue with path', () => {
    const bad = {
      ...validCapture,
      root: { ...validCapture.root, role: 'NONEXISTENT' },
    };
    const issues = validateCapture(bad);
    const roleIssue = issues.find((i) => i.path === 'root.role');
    expect(roleIssue).toBeDefined();
  });

  it('validated capture works with renderAscii', () => {
    const issues = validateCapture(validCapture);
    expect(issues).toHaveLength(0);
    // After validation, safe to pass to render
    const output = renderAscii(validCapture);
    expect(output).toBeTruthy();
  });

  it('validated capture works with fingerprintCapture', () => {
    const issues = validateCapture(validCapture);
    expect(issues).toHaveLength(0);
    const fp = fingerprintCapture(validCapture);
    expect(fp).toMatch(/^[0-9a-f]{16}$/);
  });

  it('validated captures work with diff', () => {
    const result = diff(validCapture, validCapture);
    expect(result.summary.identical).toBe(true);
  });
});
