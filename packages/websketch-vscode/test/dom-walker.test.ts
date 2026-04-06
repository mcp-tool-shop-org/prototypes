/**
 * Tests for dom-walker.ts — getDomWalkerScript output validation.
 *
 * The walker runs inside the browser, so we can't execute it in Node.
 * Instead we validate the generated script string for structural correctness.
 */

import { describe, it, expect } from 'vitest';
import { getDomWalkerScript } from '../src/dom-walker.js';

describe('getDomWalkerScript', () => {
  it('returns a non-empty string', () => {
    const script = getDomWalkerScript();
    expect(script).toBeTruthy();
    expect(typeof script).toBe('string');
  });

  it('returns an IIFE expression', () => {
    const script = getDomWalkerScript();
    // Should be wrapped as (function() { ... })()
    expect(script.startsWith('(')).toBe(true);
    expect(script.endsWith(')')).toBe(true);
  });

  it('contains MAX_DEPTH constant', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('MAX_DEPTH');
  });

  it('contains MAX_CHILDREN constant', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('MAX_CHILDREN');
  });

  it('contains MAX_NODES constant', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('MAX_NODES');
  });

  it('contains djb2 hash function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('djb2');
  });

  it('contains isVisible function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('isVisible');
  });

  it('contains isInteractive function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('isInteractive');
  });

  it('contains classify function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('classify');
  });

  it('contains ARIA role mapping', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('ARIA_MAP');
    expect(script).toContain('navigation');
  });

  it('contains TAG mapping', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('TAG_MAP');
  });

  it('contains walkElement function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('walkElement');
  });

  it('contains page_root identifier', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('page_root');
  });

  it('references window.location.href for URL capture', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('window.location.href');
  });

  it('references Date.now for timestamp', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('Date.now()');
  });

  it('references window.innerWidth and innerHeight', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('window.innerWidth');
    expect(script).toContain('window.innerHeight');
  });

  it('contains transparent tag handling', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('TRANSPARENT_TAGS');
    expect(script).toContain('THEAD');
    expect(script).toContain('TBODY');
  });

  it('contains repeated sibling detection', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('detectRepeatedSiblings');
  });

  it('contains extractSemantic function', () => {
    const script = getDomWalkerScript();
    expect(script).toContain('extractSemantic');
  });
});
