/**
 * LLM-optimized indented tree renderer.
 *
 * Produces a compact, human-readable tree from a RawCapture that
 * pastes directly into LLM prompts. Features:
 *   - `*` prefix for interactive elements
 *   - `<semantic>` hints (h1, search, main, aside, etc.)
 *   - `{flags}` for sticky/scrollable
 *   - `"label"` with actual visible text content
 *   - LIST item counts
 *   - Tree-drawing characters for structure
 *
 * Refinements (applied in renderer, not walker):
 *   - Empty SECTIONs (no label, no semantic, no children) are pruned
 *   - UNKNOWN nodes without meaningful content are hidden
 *   - Single-child wrapper SECTIONs are collapsed (child promoted)
 */

import type { RawCapture, RawNode } from './dom-walker';

export function renderLlmTree(capture: RawCapture): string {
  const lines: string[] = [];

  lines.push(`# WebSketch: ${capture.url}`);
  lines.push(`# Viewport: ${capture.viewport.w_px}\u00d7${capture.viewport.h_px}`);
  lines.push(`# Captured: ${new Date(capture.timestamp_ms).toISOString()}`);
  lines.push('');

  renderNode(capture.root, lines, '', true);

  return lines.join('\n');
}

/** Should this node be hidden from the LLM tree? */
export function shouldPrune(node: RawNode): boolean {
  // Nodes that carry their own information always survive
  if (node.interactive) { return false; }
  if (node.label) { return false; }
  if (node.semantic) { return false; }
  if (node.text) { return false; }

  // Leaf with nothing to offer → prune
  if (!node.children || node.children.length === 0) { return true; }

  // All children are prunable → this node is just a hollow wrapper → prune
  return node.children.every(shouldPrune);
}

/** Should this wrapper be collapsed (replaced by its single child)? */
export function getCollapsedChild(node: RawNode): RawNode | null {
  if (node.role !== 'SECTION') { return null; }
  if (node.label || node.semantic || node.interactive) { return null; }
  if (node.flags?.sticky || node.flags?.scrollable) { return null; }

  const visible = getVisibleChildren(node);
  if (visible.length === 1) { return visible[0]; }
  return null;
}

/** Get children that pass pruning (memoized per render). */
export function getVisibleChildren(node: RawNode): RawNode[] {
  if (!node.children) { return []; }
  return node.children.filter(c => !shouldPrune(c));
}

function renderNode(node: RawNode, lines: string[], prefix: string, isLast: boolean): void {
  // Check if this SECTION should collapse into its single child
  const collapsed = getCollapsedChild(node);
  if (collapsed) {
    renderNode(collapsed, lines, prefix, isLast);
    return;
  }

  // Build the description line
  let desc = '';

  // Interactive marker (no space — *LINK, *BUTTON, etc.)
  if (node.interactive) { desc += '*'; }

  // Role name
  desc += node.role;

  // LIST item count
  if (node.role === 'LIST') {
    const visible = getVisibleChildren(node);
    desc += ` (${visible.length} ${visible.length === 1 ? 'item' : 'items'})`;
  }

  // Semantic hint in angle brackets
  if (node.semantic) {
    desc += ` <${node.semantic}>`;
  }

  // Flags in curly braces
  const flags: string[] = [];
  if (node.flags?.sticky) { flags.push('sticky'); }
  if (node.flags?.scrollable) { flags.push('scrollable'); }
  if (flags.length > 0) {
    desc += ` {${flags.join(', ')}}`;
  }

  // Label in double quotes
  if (node.label) {
    desc += ` "${node.label}"`;
  }

  // Write line
  if (node.role === 'PAGE') {
    lines.push(desc);
  } else {
    const connector = isLast ? '\u2514\u2500 ' : '\u251c\u2500 ';
    lines.push(prefix + connector + desc);
  }

  // Recurse visible children
  const visibleChildren = getVisibleChildren(node);
  if (visibleChildren.length > 0) {
    const childPrefix = node.role === 'PAGE'
      ? ''
      : prefix + (isLast ? '   ' : '\u2502  ');

    const len = visibleChildren.length;
    for (let i = 0; i < len; i++) {
      renderNode(visibleChildren[i], lines, childPrefix, i === len - 1);
    }
  }
}
