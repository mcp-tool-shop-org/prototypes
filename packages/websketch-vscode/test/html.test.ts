/**
 * Tests for webview/html.ts — HTML generation utilities.
 *
 * escapeHtml — XSS-safe HTML entity encoding
 * syntaxHighlightJson — regex-based JSON syntax coloring
 * generateHtml — full webview HTML (needs websketch-ir mock)
 */

import { describe, it, expect, vi } from 'vitest';

// Mock @mcptoolshop/websketch-ir (generateHtml calls renderForLLM)
vi.mock('@mcptoolshop/websketch-ir', () => ({
  renderForLLM: () => 'mock ascii wireframe',
}));

import { escapeHtml, syntaxHighlightJson, generateHtml } from '../src/webview/html.js';
import type { WebSketchCapture, UINode, BBox01 } from '@mcptoolshop/websketch-ir';

// ── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes all special chars in one string', () => {
    expect(escapeHtml('<a href="/">&</a>')).toBe('&lt;a href=&quot;/&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles multiple ampersands', () => {
    expect(escapeHtml('a & b & c')).toBe('a &amp; b &amp; c');
  });
});

// ── syntaxHighlightJson ──────────────────────────────────────────────────────

describe('syntaxHighlightJson', () => {
  it('wraps JSON keys in key span', () => {
    const input = '"name": "value"';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-key"');
    expect(output).toContain('"name"');
  });

  it('wraps string values in string span', () => {
    const input = '"key": "hello"';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-string"');
  });

  it('wraps integer values in number span', () => {
    const input = '"count": 42';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-number"');
    expect(output).toContain('42');
  });

  it('wraps float values in number span', () => {
    const input = '"ratio": 3.14';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-number"');
    expect(output).toContain('3.14');
  });

  it('wraps true in bool span', () => {
    const input = '"active": true';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-bool"');
    expect(output).toContain('true');
  });

  it('wraps false in bool span', () => {
    const input = '"active": false';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-bool"');
    expect(output).toContain('false');
  });

  it('wraps null in null span', () => {
    const input = '"data": null';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-null"');
    expect(output).toContain('null');
  });

  it('handles multi-line JSON', () => {
    const input = '{\n  "a": 1,\n  "b": "two"\n}';
    const output = syntaxHighlightJson(input);
    expect(output).toContain('class="json-key"');
    expect(output).toContain('class="json-number"');
    expect(output).toContain('class="json-string"');
  });

  it('returns plain text without colons unchanged', () => {
    expect(syntaxHighlightJson('no json here')).toBe('no json here');
  });
});

// ── generateHtml ─────────────────────────────────────────────────────────────

describe('generateHtml', () => {
  function makeCapture(): WebSketchCapture {
    const bbox = [0, 0, 1, 1] as unknown as BBox01;
    const root: UINode = {
      id: 'page_root',
      role: 'PAGE' as any,
      bbox,
      interactive: false,
      visible: true,
      children: [
        {
          id: 'nav1',
          role: 'NAV' as any,
          bbox: [0, 0, 1, 0.08] as unknown as BBox01,
          interactive: false,
          visible: true,
        },
      ],
    };
    return {
      version: '0.1' as const,
      url: 'https://example.com',
      timestamp_ms: 1700000000000,
      viewport: { w_px: 1280, h_px: 800, aspect: 1.6 },
      compiler: { name: 'websketch-ir', version: '0.1.0', options_hash: 'abc' },
      root,
    };
  }

  it('returns a complete HTML document', () => {
    const html = generateHtml(makeCapture(), 'LLM tree output', 'test-nonce-123');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('includes CSP meta tag with nonce', () => {
    const html = generateHtml(makeCapture(), 'LLM tree', 'nonce-abc');
    expect(html).toContain("nonce-abc");
  });

  it('includes tab buttons for LLM, ASCII, Tree, JSON', () => {
    const html = generateHtml(makeCapture(), 'LLM tree', 'nonce');
    expect(html).toContain('data-tab="llm"');
    expect(html).toContain('data-tab="ascii"');
    expect(html).toContain('data-tab="tree"');
    expect(html).toContain('data-tab="json"');
  });

  it('includes LLM content (escaped)', () => {
    const html = generateHtml(makeCapture(), '<script>alert(1)</script>', 'nonce');
    // Should be escaped
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('includes URL in header bar', () => {
    const html = generateHtml(makeCapture(), 'tree', 'nonce');
    expect(html).toContain('https://example.com');
  });

  it('includes viewport dimensions in header bar', () => {
    const html = generateHtml(makeCapture(), 'tree', 'nonce');
    expect(html).toContain('1280');
    expect(html).toContain('800');
  });

  it('includes copy buttons', () => {
    const html = generateHtml(makeCapture(), 'tree', 'nonce');
    expect(html).toContain('copy-btn');
    expect(html).toContain('Copy for LLM');
  });

  it('includes role badges in tree view', () => {
    const html = generateHtml(makeCapture(), 'tree', 'nonce');
    expect(html).toContain('role-badge');
    expect(html).toContain('PAGE');
    expect(html).toContain('NAV');
  });

  it('includes script for tab switching', () => {
    const html = generateHtml(makeCapture(), 'tree', 'nonce');
    expect(html).toContain('acquireVsCodeApi');
  });
});
