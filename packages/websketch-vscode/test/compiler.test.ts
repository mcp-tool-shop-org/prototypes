/**
 * Tests for compiler.ts pure helpers.
 *
 * toUIRole, toBBox01, toTextSignal — type-safe converters from raw DOM data
 * compileNode — recursive tree compiler
 * compile — top-level entry (needs websketch-ir mock)
 */

import { describe, it, expect, vi } from 'vitest';

// Mock @mcptoolshop/websketch-ir (compile calls assignNodeIds, hashSync, validateCapture)
vi.mock('@mcptoolshop/websketch-ir', () => ({
  assignNodeIds: (node: any) => { /* no-op for tests */ },
  hashSync: (s: string) => 'mock_hash',
  validateCapture: () => [],
}));

import { toUIRole, toBBox01, toTextSignal, compileNode, compile } from '../src/compiler.js';
import type { RawNode, RawCapture } from '../src/dom-walker.js';

// ── toUIRole ──────────────────────────────────────────────────────────────────

describe('toUIRole', () => {
  it('returns PAGE for valid role', () => {
    expect(toUIRole('PAGE')).toBe('PAGE');
  });

  it('returns BUTTON for valid role', () => {
    expect(toUIRole('BUTTON')).toBe('BUTTON');
  });

  it('returns LINK for valid role', () => {
    expect(toUIRole('LINK')).toBe('LINK');
  });

  it('returns UNKNOWN for unrecognized role', () => {
    expect(toUIRole('WIDGET')).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for empty string', () => {
    expect(toUIRole('')).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for lowercase valid role', () => {
    // VALID_ROLES stores uppercase only
    expect(toUIRole('button')).toBe('UNKNOWN');
  });

  it('accepts all 22 valid roles', () => {
    const validRoles = [
      'PAGE', 'NAV', 'HEADER', 'FOOTER', 'SECTION', 'CARD', 'LIST', 'TABLE',
      'MODAL', 'TOAST', 'DROPDOWN', 'FORM', 'INPUT', 'BUTTON', 'LINK',
      'CHECKBOX', 'RADIO', 'ICON', 'IMAGE', 'TEXT', 'PAGINATION', 'UNKNOWN',
    ];
    for (const role of validRoles) {
      expect(toUIRole(role)).toBe(role);
    }
  });
});

// ── toBBox01 ──────────────────────────────────────────────────────────────────

describe('toBBox01', () => {
  it('passes through valid [0,1] values unchanged', () => {
    const result = toBBox01([0.1, 0.2, 0.8, 0.6]);
    expect(result).toEqual([0.1, 0.2, 0.8, 0.6]);
  });

  it('clamps negative values to 0', () => {
    const result = toBBox01([-0.1, -0.5, 0.5, 0.5]);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
  });

  it('clamps values above 1 to 1', () => {
    const result = toBBox01([0.5, 0.5, 1.5, 2.0]);
    expect(result[2]).toBe(1);
    expect(result[3]).toBe(1);
  });

  it('handles all zeros', () => {
    expect(toBBox01([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
  });

  it('handles all ones', () => {
    expect(toBBox01([1, 1, 1, 1])).toEqual([1, 1, 1, 1]);
  });

  it('returns exactly 4 elements', () => {
    const result = toBBox01([0.1, 0.2, 0.3, 0.4]);
    expect(result).toHaveLength(4);
  });
});

// ── toTextSignal ─────────────────────────────────────────────────────────────

describe('toTextSignal', () => {
  it('preserves hash and len from input', () => {
    const result = toTextSignal({ hash: 'abc123', len: 42, kind: 'short' });
    expect(result.hash).toBe('abc123');
    expect(result.len).toBe(42);
  });

  it('accepts valid kind "none"', () => {
    expect(toTextSignal({ hash: 'x', len: 0, kind: 'none' }).kind).toBe('none');
  });

  it('accepts valid kind "short"', () => {
    expect(toTextSignal({ hash: 'x', len: 5, kind: 'short' }).kind).toBe('short');
  });

  it('accepts valid kind "sentence"', () => {
    expect(toTextSignal({ hash: 'x', len: 50, kind: 'sentence' }).kind).toBe('sentence');
  });

  it('accepts valid kind "paragraph"', () => {
    expect(toTextSignal({ hash: 'x', len: 200, kind: 'paragraph' }).kind).toBe('paragraph');
  });

  it('accepts valid kind "mixed"', () => {
    expect(toTextSignal({ hash: 'x', len: 100, kind: 'mixed' }).kind).toBe('mixed');
  });

  it('defaults invalid kind to "short"', () => {
    expect(toTextSignal({ hash: 'x', len: 10, kind: 'bogus' }).kind).toBe('short');
  });

  it('defaults empty kind to "short"', () => {
    expect(toTextSignal({ hash: 'x', len: 10, kind: '' }).kind).toBe('short');
  });
});

// ── compileNode ──────────────────────────────────────────────────────────────

describe('compileNode', () => {
  function makeRawNode(overrides: Partial<RawNode> = {}): RawNode {
    return {
      id: 'n1',
      role: 'SECTION',
      bbox: [0.1, 0.2, 0.5, 0.3] as [number, number, number, number],
      interactive: false,
      visible: true,
      ...overrides,
    };
  }

  it('maps id, role, bbox, interactive, visible', () => {
    const result = compileNode(makeRawNode());
    expect(result.id).toBe('n1');
    expect(result.role).toBe('SECTION');
    expect(result.interactive).toBe(false);
    expect(result.visible).toBe(true);
  });

  it('clamps bbox values', () => {
    const result = compileNode(makeRawNode({ bbox: [-0.1, 0.2, 1.5, 0.3] }));
    expect(result.bbox[0]).toBe(0);
    expect(result.bbox[2]).toBe(1);
  });

  it('converts invalid role to UNKNOWN', () => {
    const result = compileNode(makeRawNode({ role: 'WIDGET' }));
    expect(result.role).toBe('UNKNOWN');
  });

  it('sets enabled=false when raw has enabled=false', () => {
    const result = compileNode(makeRawNode({ enabled: false }));
    expect(result.enabled).toBe(false);
  });

  it('omits enabled when not explicitly false', () => {
    const result = compileNode(makeRawNode());
    expect(result.enabled).toBeUndefined();
  });

  it('sets focusable when raw.focusable is true', () => {
    const result = compileNode(makeRawNode({ focusable: true }));
    expect(result.focusable).toBe(true);
  });

  it('omits focusable when raw.focusable is falsy', () => {
    const result = compileNode(makeRawNode());
    expect(result.focusable).toBeUndefined();
  });

  it('copies semantic when present', () => {
    const result = compileNode(makeRawNode({ semantic: 'main' }));
    expect(result.semantic).toBe('main');
  });

  it('converts text signal', () => {
    const result = compileNode(makeRawNode({
      text: { hash: 'abc', len: 10, kind: 'short' },
    }));
    expect(result.text).toBeDefined();
    expect(result.text!.hash).toBe('abc');
    expect(result.text!.kind).toBe('short');
  });

  it('copies flags', () => {
    const result = compileNode(makeRawNode({
      flags: { sticky: true, scrollable: true },
    }));
    expect(result.flags).toEqual({ sticky: true, scrollable: true });
  });

  it('copies z-index', () => {
    const result = compileNode(makeRawNode({ z: 5 }));
    expect(result.z).toBe(5);
  });

  it('recursively compiles children', () => {
    const raw = makeRawNode({
      children: [
        makeRawNode({ id: 'child1', role: 'BUTTON', interactive: true }),
        makeRawNode({ id: 'child2', role: 'TEXT' }),
      ],
    });
    const result = compileNode(raw);
    expect(result.children).toHaveLength(2);
    expect(result.children![0].id).toBe('child1');
    expect(result.children![0].role).toBe('BUTTON');
    expect(result.children![1].id).toBe('child2');
  });

  it('omits children when empty', () => {
    const result = compileNode(makeRawNode({ children: [] }));
    expect(result.children).toBeUndefined();
  });

  it('omits children when undefined', () => {
    const result = compileNode(makeRawNode());
    expect(result.children).toBeUndefined();
  });
});

// ── compile ──────────────────────────────────────────────────────────────────

describe('compile', () => {
  function makeRawCapture(): RawCapture {
    return {
      url: 'https://example.com',
      timestamp_ms: 1700000000000,
      viewport: { w_px: 1280, h_px: 800 },
      root: {
        id: 'page_root',
        role: 'PAGE',
        bbox: [0, 0, 1, 1],
        interactive: false,
        visible: true,
        children: [
          {
            id: 'nav1',
            role: 'NAV',
            bbox: [0, 0, 1, 0.08],
            interactive: false,
            visible: true,
          },
        ],
      },
    };
  }

  it('sets version to 0.1', () => {
    const result = compile(makeRawCapture());
    expect(result.version).toBe('0.1');
  });

  it('preserves url', () => {
    const result = compile(makeRawCapture());
    expect(result.url).toBe('https://example.com');
  });

  it('preserves timestamp', () => {
    const result = compile(makeRawCapture());
    expect(result.timestamp_ms).toBe(1700000000000);
  });

  it('computes viewport aspect ratio', () => {
    const result = compile(makeRawCapture());
    expect(result.viewport.w_px).toBe(1280);
    expect(result.viewport.h_px).toBe(800);
    expect(result.viewport.aspect).toBe(1.6);
  });

  it('sets compiler metadata', () => {
    const result = compile(makeRawCapture());
    expect(result.compiler.name).toBe('websketch-ir');
    expect(result.compiler.version).toBe('0.1.0');
    expect(result.compiler.options_hash).toBe('mock_hash');
  });

  it('compiles root and children', () => {
    const result = compile(makeRawCapture());
    expect(result.root.role).toBe('PAGE');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children![0].role).toBe('NAV');
  });
});
