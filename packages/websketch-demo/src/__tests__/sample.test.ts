import { describe, it, expect } from 'vitest';
import {
  validateCapture,
  renderAscii,
  type WebSketchCapture,
  type WebSketchValidationIssue,
} from '@mcptoolshop/websketch-ir';
import { renderTree } from '../tree';
import { renderCompare } from '../compare';

// =============================================================================
// Fixtures
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
    children: [
      {
        id: 'nav-1',
        role: 'NAV',
        bbox: [0, 0, 1, 0.05],
        interactive: false,
        visible: true,
      },
      {
        id: 'btn-1',
        role: 'BUTTON',
        bbox: [0.3, 0.4, 0.4, 0.05],
        interactive: true,
        visible: true,
        semantic: 'login',
      },
    ],
  },
};

// =============================================================================
// IR imports
// =============================================================================

describe('IR imports', () => {
  it('validateCapture is a function', () => {
    expect(typeof validateCapture).toBe('function');
  });

  it('renderAscii is a function', () => {
    expect(typeof renderAscii).toBe('function');
  });
});

// =============================================================================
// Validation
// =============================================================================

describe('validateCapture for demo', () => {
  it('valid capture returns no issues', () => {
    const issues = validateCapture(validCapture);
    expect(issues).toHaveLength(0);
  });

  it('empty object returns multiple issues', () => {
    const issues = validateCapture({});
    expect(issues.length).toBeGreaterThan(0);
  });

  it('invalid version returns issue', () => {
    const issues = validateCapture({ version: '99.0' });
    const versionIssue = issues.find((i: WebSketchValidationIssue) => i.path === 'version');
    expect(versionIssue).toBeDefined();
  });

  it('XSS payload is treated as data, not code', () => {
    const issues = validateCapture({
      version: '<script>alert(1)</script>',
    });
    const versionIssue = issues.find((i: WebSketchValidationIssue) => i.path === 'version');
    expect(versionIssue).toBeDefined();
    expect(versionIssue!.received).toContain('<script>');
  });
});

// =============================================================================
// Tree view
// =============================================================================

describe('renderTree', () => {
  it('returns element with tree-node children', () => {
    const tree = renderTree(validCapture);
    expect(tree).toBeDefined();
    expect(tree.className).toBe('tree-view');
    const nodes = tree.querySelectorAll('.tree-node');
    // PAGE + NAV + BUTTON = 3 nodes
    expect(nodes.length).toBe(3);
  });

  it('shows role text for each node', () => {
    const tree = renderTree(validCapture);
    const roles = tree.querySelectorAll('.tree-role');
    const roleTexts = Array.from(roles).map((r) => r.textContent);
    expect(roleTexts).toContain('PAGE');
    expect(roleTexts).toContain('NAV');
    expect(roleTexts).toContain('BUTTON');
  });

  it('shows semantic hint when present', () => {
    const tree = renderTree(validCapture);
    const semantics = tree.querySelectorAll('.tree-semantic');
    expect(semantics.length).toBe(1);
    expect(semantics[0].textContent).toBe(':login');
  });
});

// =============================================================================
// ASCII rendering
// =============================================================================

describe('renderAscii for demo', () => {
  it('returns non-empty string', () => {
    const ascii = renderAscii(validCapture);
    expect(ascii.length).toBeGreaterThan(0);
  });

  it('contains expected role abbreviations', () => {
    const ascii = renderAscii(validCapture);
    // NAV and BTN should appear in the ASCII output
    expect(ascii).toContain('NAV');
  });
});

// =============================================================================
// Compare mode
// =============================================================================

describe('renderCompare', () => {
  it('A vs A contains "Identical"', () => {
    const result = renderCompare(validCapture, validCapture);
    expect(result).toBeDefined();
    expect(result.className).toBe('compare-view');
    // formatDiff output for identical captures should contain "Identical"
    expect(result.textContent).toContain('Identical');
  });

  it('contains ASCII comparison panels', () => {
    const result = renderCompare(validCapture, validCapture);
    const panels = result.querySelectorAll('.compare-panel');
    expect(panels.length).toBe(2);
  });
});
