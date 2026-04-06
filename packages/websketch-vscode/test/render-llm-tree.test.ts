/**
 * Tests for render-llm-tree.ts — LLM-optimized tree renderer.
 *
 * shouldPrune, getCollapsedChild, getVisibleChildren — tree refinement helpers
 * renderLlmTree — full tree rendering with header, connectors, interactive markers
 */

import { describe, it, expect } from 'vitest';
import {
  renderLlmTree,
  shouldPrune,
  getCollapsedChild,
  getVisibleChildren,
} from '../src/render-llm-tree.js';
import type { RawNode, RawCapture } from '../src/dom-walker.js';

function makeNode(overrides: Partial<RawNode> = {}): RawNode {
  return {
    id: 'n1',
    role: 'SECTION',
    bbox: [0, 0, 1, 1],
    interactive: false,
    visible: true,
    ...overrides,
  };
}

// ── shouldPrune ──────────────────────────────────────────────────────────────

describe('shouldPrune', () => {
  it('prunes empty leaf with no info', () => {
    expect(shouldPrune(makeNode())).toBe(true);
  });

  it('does not prune interactive nodes', () => {
    expect(shouldPrune(makeNode({ interactive: true }))).toBe(false);
  });

  it('does not prune nodes with label', () => {
    expect(shouldPrune(makeNode({ label: 'Click me' }))).toBe(false);
  });

  it('does not prune nodes with semantic', () => {
    expect(shouldPrune(makeNode({ semantic: 'main' }))).toBe(false);
  });

  it('does not prune nodes with text', () => {
    expect(shouldPrune(makeNode({
      text: { hash: 'abc', len: 10, kind: 'short' },
    }))).toBe(false);
  });

  it('prunes node whose all children are prunable', () => {
    const node = makeNode({
      children: [
        makeNode({ id: 'c1' }),
        makeNode({ id: 'c2' }),
      ],
    });
    expect(shouldPrune(node)).toBe(true);
  });

  it('does not prune node with at least one surviving child', () => {
    const node = makeNode({
      children: [
        makeNode({ id: 'c1' }),
        makeNode({ id: 'c2', label: 'Visible' }),
      ],
    });
    expect(shouldPrune(node)).toBe(false);
  });

  it('prunes deeply nested empty structure', () => {
    const node = makeNode({
      children: [
        makeNode({
          id: 'c1',
          children: [makeNode({ id: 'gc1' })],
        }),
      ],
    });
    expect(shouldPrune(node)).toBe(true);
  });
});

// ── getVisibleChildren ───────────────────────────────────────────────────────

describe('getVisibleChildren', () => {
  it('returns empty for no children', () => {
    expect(getVisibleChildren(makeNode())).toEqual([]);
  });

  it('returns empty for undefined children', () => {
    expect(getVisibleChildren(makeNode({ children: undefined }))).toEqual([]);
  });

  it('filters out prunable children', () => {
    const node = makeNode({
      children: [
        makeNode({ id: 'c1' }), // prunable
        makeNode({ id: 'c2', label: 'Survives' }), // not prunable
        makeNode({ id: 'c3' }), // prunable
      ],
    });
    const result = getVisibleChildren(node);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('returns all children when none are prunable', () => {
    const node = makeNode({
      children: [
        makeNode({ id: 'c1', interactive: true }),
        makeNode({ id: 'c2', label: 'Visible' }),
      ],
    });
    expect(getVisibleChildren(node)).toHaveLength(2);
  });
});

// ── getCollapsedChild ────────────────────────────────────────────────────────

describe('getCollapsedChild', () => {
  it('returns null for non-SECTION role', () => {
    const node = makeNode({ role: 'NAV', children: [makeNode({ id: 'c1', label: 'X' })] });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns null when SECTION has a label', () => {
    const node = makeNode({ label: 'Labeled Section', children: [makeNode({ id: 'c1', label: 'X' })] });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns null when SECTION has semantic', () => {
    const node = makeNode({ semantic: 'main', children: [makeNode({ id: 'c1', label: 'X' })] });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns null when SECTION is interactive', () => {
    const node = makeNode({ interactive: true, children: [makeNode({ id: 'c1', label: 'X' })] });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns null when SECTION has sticky flag', () => {
    const node = makeNode({
      flags: { sticky: true },
      children: [makeNode({ id: 'c1', label: 'X' })],
    });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns null when SECTION has scrollable flag', () => {
    const node = makeNode({
      flags: { scrollable: true },
      children: [makeNode({ id: 'c1', label: 'X' })],
    });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns single visible child when SECTION is plain wrapper', () => {
    const child = makeNode({ id: 'c1', label: 'The Content' });
    const node = makeNode({ children: [child] });
    expect(getCollapsedChild(node)).toBe(child);
  });

  it('returns null when SECTION has multiple visible children', () => {
    const node = makeNode({
      children: [
        makeNode({ id: 'c1', label: 'A' }),
        makeNode({ id: 'c2', label: 'B' }),
      ],
    });
    expect(getCollapsedChild(node)).toBeNull();
  });

  it('returns the single surviving child when others are prunable', () => {
    const survivor = makeNode({ id: 'c2', label: 'Survive' });
    const node = makeNode({
      children: [
        makeNode({ id: 'c1' }), // prunable
        survivor,
      ],
    });
    expect(getCollapsedChild(node)).toBe(survivor);
  });
});

// ── renderLlmTree ────────────────────────────────────────────────────────────

describe('renderLlmTree', () => {
  function makeCapture(root: RawNode): RawCapture {
    return {
      url: 'https://example.com',
      timestamp_ms: 1700000000000,
      viewport: { w_px: 1280, h_px: 800 },
      root,
    };
  }

  it('includes URL header', () => {
    const capture = makeCapture(makeNode({ role: 'PAGE' }));
    const output = renderLlmTree(capture);
    expect(output).toContain('# WebSketch: https://example.com');
  });

  it('includes viewport header', () => {
    const capture = makeCapture(makeNode({ role: 'PAGE' }));
    const output = renderLlmTree(capture);
    expect(output).toContain('# Viewport: 1280\u00d7800');
  });

  it('includes captured timestamp header', () => {
    const capture = makeCapture(makeNode({ role: 'PAGE' }));
    const output = renderLlmTree(capture);
    expect(output).toContain('# Captured:');
  });

  it('renders PAGE role at root (no connector)', () => {
    const capture = makeCapture(makeNode({ role: 'PAGE' }));
    const output = renderLlmTree(capture);
    const lines = output.split('\n');
    // After headers and blank line, PAGE is on its own line
    expect(lines.some(l => l === 'PAGE')).toBe(true);
  });

  it('renders child nodes with tree connectors', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'nav', role: 'NAV', semantic: 'menu' }),
        makeNode({ id: 'main', role: 'SECTION', semantic: 'main' }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('\u251c\u2500 NAV');
    expect(output).toContain('\u2514\u2500 SECTION');
  });

  it('prefixes interactive nodes with *', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'btn', role: 'BUTTON', interactive: true, label: 'Submit' }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('*BUTTON');
  });

  it('includes semantic hints in angle brackets', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'h1', role: 'TEXT', semantic: 'h1', label: 'Welcome' }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('<h1>');
  });

  it('includes flags in curly braces', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'nav', role: 'NAV', semantic: 'menu', flags: { sticky: true } }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('{sticky}');
  });

  it('includes labels in double quotes', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'link', role: 'LINK', interactive: true, label: 'Home' }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('"Home"');
  });

  it('shows LIST item count', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({
          id: 'list',
          role: 'LIST',
          label: 'Items',
          children: [
            makeNode({ id: 'i1', role: 'TEXT', label: 'Item 1' }),
            makeNode({ id: 'i2', role: 'TEXT', label: 'Item 2' }),
            makeNode({ id: 'i3', role: 'TEXT', label: 'Item 3' }),
          ],
        }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('3 items');
  });

  it('shows singular "item" for single-item LIST', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({
          id: 'list',
          role: 'LIST',
          label: 'Items',
          children: [
            makeNode({ id: 'i1', role: 'TEXT', label: 'Only One' }),
          ],
        }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('1 item)');
  });

  it('prunes empty leaves from output', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({ id: 'empty1' }), // prunable — no info, no children
        makeNode({ id: 'btn', role: 'BUTTON', interactive: true, label: 'Click' }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).not.toContain('SECTION');
    expect(output).toContain('*BUTTON');
  });

  it('collapses single-child SECTION wrappers', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({
          id: 'wrapper',
          role: 'SECTION',
          children: [
            makeNode({ id: 'real', role: 'NAV', semantic: 'menu' }),
          ],
        }),
      ],
    }));
    const output = renderLlmTree(capture);
    // The SECTION wrapper should be collapsed, showing NAV directly
    expect(output).toContain('NAV');
    // Should not show the wrapper SECTION itself
    const lines = output.split('\n');
    const sectionLines = lines.filter(l => l.includes('SECTION'));
    expect(sectionLines).toHaveLength(0);
  });

  it('combines multiple flags', () => {
    const capture = makeCapture(makeNode({
      role: 'PAGE',
      children: [
        makeNode({
          id: 'nav',
          role: 'NAV',
          semantic: 'menu',
          flags: { sticky: true, scrollable: true },
        }),
      ],
    }));
    const output = renderLlmTree(capture);
    expect(output).toContain('{sticky, scrollable}');
  });
});
