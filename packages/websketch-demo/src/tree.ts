/**
 * Tree view renderer for WebSketch captures.
 * Renders a UINode tree as indented DOM elements (XSS-safe — all textContent).
 */

import type { WebSketchCapture, UINode } from '@mcptoolshop/websketch-ir';

export function renderTree(capture: WebSketchCapture): HTMLElement {
  const container = document.createElement('div');
  container.className = 'tree-view';
  renderNodeTree(container, capture.root, 0);
  return container;
}

function renderNodeTree(parent: HTMLElement, node: UINode, depth: number): void {
  const row = document.createElement('div');
  row.className = 'tree-node';
  row.style.paddingLeft = `${depth * 16}px`;

  // Role badge
  const role = document.createElement('span');
  role.className = 'tree-role';
  role.textContent = node.role;
  row.appendChild(role);

  // Semantic hint
  if (node.semantic) {
    const sem = document.createElement('span');
    sem.className = 'tree-semantic';
    sem.textContent = `:${node.semantic}`;
    row.appendChild(sem);
  }

  // Interactive indicator
  if (node.interactive) {
    const inter = document.createElement('span');
    inter.className = 'tree-interactive';
    inter.textContent = ' [interactive]';
    row.appendChild(inter);
  }

  // Bbox display
  const bbox = document.createElement('span');
  bbox.className = 'tree-bbox';
  const [x, y, w, h] = node.bbox;
  bbox.textContent = ` [${(x * 100).toFixed(0)}%, ${(y * 100).toFixed(0)}%, ${(w * 100).toFixed(0)}%, ${(h * 100).toFixed(0)}%]`;
  row.appendChild(bbox);

  // Text indicator
  if (node.text && node.text.len) {
    const textIndicator = document.createElement('span');
    textIndicator.className = 'tree-text';
    const dots = node.text.len > 100 ? '····' : node.text.len > 20 ? '···' : '··';
    textIndicator.textContent = ` ${dots}(${node.text.len})`;
    row.appendChild(textIndicator);
  }

  parent.appendChild(row);

  // Recurse children
  if (node.children) {
    for (const child of node.children) {
      renderNodeTree(parent, child, depth + 1);
    }
  }
}
