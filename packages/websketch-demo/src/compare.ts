/**
 * Compare mode renderer for WebSketch captures.
 * Shows diff summary + side-by-side ASCII (XSS-safe — all textContent).
 */

import { diff, formatDiff, renderAscii, type WebSketchCapture } from '@mcptoolshop/websketch-ir';

export function renderCompare(captureA: WebSketchCapture, captureB: WebSketchCapture): HTMLElement {
  const container = document.createElement('div');
  container.className = 'compare-view';

  // Diff summary
  const result = diff(captureA, captureB);
  const summary = formatDiff(result);

  const summaryHeader = document.createElement('h3');
  summaryHeader.textContent = 'Diff Summary';
  container.appendChild(summaryHeader);

  const summaryPre = document.createElement('pre');
  summaryPre.className = 'compare-summary';
  summaryPre.textContent = summary;
  container.appendChild(summaryPre);

  // Side-by-side ASCII
  const asciiHeader = document.createElement('h3');
  asciiHeader.textContent = 'ASCII Comparison';
  container.appendChild(asciiHeader);

  const sideBySide = document.createElement('div');
  sideBySide.className = 'compare-ascii';

  const panelA = document.createElement('div');
  panelA.className = 'compare-panel';
  const labelA = document.createElement('div');
  labelA.className = 'compare-label';
  labelA.textContent = 'Capture A';
  panelA.appendChild(labelA);
  const preA = document.createElement('pre');
  preA.textContent = renderAscii(captureA, { width: 40, height: 16 });
  panelA.appendChild(preA);

  const panelB = document.createElement('div');
  panelB.className = 'compare-panel';
  const labelB = document.createElement('div');
  labelB.className = 'compare-label';
  labelB.textContent = 'Capture B';
  panelB.appendChild(labelB);
  const preB = document.createElement('pre');
  preB.textContent = renderAscii(captureB, { width: 40, height: 16 });
  panelB.appendChild(preB);

  sideBySide.appendChild(panelA);
  sideBySide.appendChild(panelB);
  container.appendChild(sideBySide);

  return container;
}
