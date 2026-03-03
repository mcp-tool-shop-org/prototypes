/**
 * VectorCaliper - Structured State Comparison
 *
 * Side-by-side comparison of two model states.
 * Read-only, descriptive (never prescriptive).
 *
 * INVARIANT: Diff is symmetric (A-B shows inverse of B-A)
 * INVARIANT: No value judgments ("better", "worse", "improved")
 * INVARIANT: Pure description, not prescription
 */

import type { ModelState } from '../types/state';
import type { SemanticVariable } from '../mapping/semantic-map';
import { VARIABLE_METADATA } from './tooltip-content';

// =============================================================================
// Types
// =============================================================================

/**
 * Direction of difference.
 */
export type DiffDirection = 'increase' | 'decrease' | 'unchanged';

/**
 * Comparison of a single variable.
 */
export interface VariableDiff {
  /** Variable path (e.g., 'geometry.effectiveDimension') */
  readonly variable: SemanticVariable;

  /** Human-readable name */
  readonly name: string;

  /** Value in state A */
  readonly valueA: number | null;

  /** Value in state B */
  readonly valueB: number | null;

  /** Absolute difference (B - A) */
  readonly difference: number | null;

  /** Relative difference as percentage ((B - A) / A * 100) */
  readonly percentChange: number | null;

  /** Direction of change */
  readonly direction: DiffDirection;

  /** Unit of measurement */
  readonly unit: string;

  /** Description from schema */
  readonly description: string;
}

/**
 * Comparison of a category of variables.
 */
export interface CategoryDiff {
  /** Category name (e.g., 'geometry', 'uncertainty') */
  readonly category: string;

  /** Human-readable category name */
  readonly displayName: string;

  /** Variable comparisons in this category */
  readonly variables: readonly VariableDiff[];

  /** Summary: number of increases, decreases, unchanged */
  readonly summary: {
    readonly increases: number;
    readonly decreases: number;
    readonly unchanged: number;
  };
}

/**
 * Complete state comparison.
 */
export interface StateComparison {
  /** ID of state A */
  readonly stateAId: string;

  /** ID of state B */
  readonly stateBId: string;

  /** Time of state A */
  readonly timeA: number;

  /** Time of state B */
  readonly timeB: number;

  /** Time difference (B - A) */
  readonly timeDiff: number;

  /** Comparisons by category */
  readonly categories: readonly CategoryDiff[];

  /** All variable diffs (flat) */
  readonly allDiffs: readonly VariableDiff[];

  /** Summary statistics */
  readonly summary: {
    readonly totalVariables: number;
    readonly increases: number;
    readonly decreases: number;
    readonly unchanged: number;
    readonly unavailable: number;
  };
}

// =============================================================================
// Comparison Functions
// =============================================================================

/**
 * Compare two model states.
 * Returns a symmetric, descriptive diff.
 *
 * INVARIANT: compareStates(A, B) shows inverse signs of compareStates(B, A)
 */
export function compareStates(
  stateA: ModelState,
  stateB: ModelState
): StateComparison {
  const diffs: VariableDiff[] = [];

  // Compare all semantic variables
  for (const [variable, meta] of Object.entries(VARIABLE_METADATA)) {
    const semVar = variable as SemanticVariable;
    const valueA = extractValue(stateA, semVar);
    const valueB = extractValue(stateB, semVar);

    diffs.push(createVariableDiff(semVar, meta, valueA, valueB));
  }

  // Group by category
  const categories = groupByCategory(diffs);

  // Compute summary
  const summary = computeSummary(diffs);

  return {
    stateAId: stateA.id,
    stateBId: stateB.id,
    timeA: stateA.time.value,
    timeB: stateB.time.value,
    timeDiff: stateB.time.value - stateA.time.value,
    categories,
    allDiffs: diffs,
    summary,
  };
}

/**
 * Create inverse comparison (B vs A instead of A vs B).
 * INVARIANT: Symmetric inversion.
 */
export function invertComparison(
  comparison: StateComparison
): StateComparison {
  const invertedDiffs = comparison.allDiffs.map(invertVariableDiff);
  const categories = groupByCategory(invertedDiffs);

  return {
    stateAId: comparison.stateBId,
    stateBId: comparison.stateAId,
    timeA: comparison.timeB,
    timeB: comparison.timeA,
    timeDiff: -comparison.timeDiff,
    categories,
    allDiffs: invertedDiffs,
    summary: {
      totalVariables: comparison.summary.totalVariables,
      increases: comparison.summary.decreases, // Swapped
      decreases: comparison.summary.increases, // Swapped
      unchanged: comparison.summary.unchanged,
      unavailable: comparison.summary.unavailable,
    },
  };
}

/**
 * Verify symmetric property: diff(A, B) is inverse of diff(B, A).
 */
export function verifySymmetry(
  stateA: ModelState,
  stateB: ModelState
): { symmetric: boolean; violations: string[] } {
  const compAB = compareStates(stateA, stateB);
  const compBA = compareStates(stateB, stateA);

  const violations: string[] = [];

  for (let i = 0; i < compAB.allDiffs.length; i++) {
    const diffAB = compAB.allDiffs[i]!;
    const diffBA = compBA.allDiffs[i]!;

    // Values should be swapped
    if (diffAB.valueA !== diffBA.valueB) {
      violations.push(`${diffAB.variable}: valueA mismatch`);
    }
    if (diffAB.valueB !== diffBA.valueA) {
      violations.push(`${diffAB.variable}: valueB mismatch`);
    }

    // Differences should be negated
    if (
      diffAB.difference !== null &&
      diffBA.difference !== null &&
      diffAB.difference !== -diffBA.difference
    ) {
      violations.push(`${diffAB.variable}: difference not symmetric`);
    }

    // Directions should be opposite (except unchanged)
    if (diffAB.direction !== 'unchanged' || diffBA.direction !== 'unchanged') {
      if (diffAB.direction === 'increase' && diffBA.direction !== 'decrease') {
        violations.push(`${diffAB.variable}: direction not symmetric`);
      }
      if (diffAB.direction === 'decrease' && diffBA.direction !== 'increase') {
        violations.push(`${diffAB.variable}: direction not symmetric`);
      }
    }
  }

  return {
    symmetric: violations.length === 0,
    violations,
  };
}

// =============================================================================
// Value Extraction
// =============================================================================

/**
 * Extract a variable value from state.
 */
function extractValue(
  state: ModelState,
  variable: SemanticVariable
): number | null {
  const parts = variable.split('.');

  // Handle position (derived from projection, not in state)
  if (parts[0] === 'position' || parts[0] === 'derived') {
    return null; // Not directly extractable from state
  }

  // Navigate object path
  let obj: any = state;
  for (const part of parts) {
    if (obj === null || obj === undefined) {
      return null;
    }
    obj = obj[part];
  }

  // Extract .value if it's a typed value
  if (obj && typeof obj === 'object' && 'value' in obj) {
    return obj.value as number;
  }

  if (typeof obj === 'number') {
    return obj;
  }

  return null;
}

// =============================================================================
// Diff Helpers
// =============================================================================

/**
 * Create a variable diff.
 */
function createVariableDiff(
  variable: SemanticVariable,
  meta: { name: string; unit: string; description: string },
  valueA: number | null,
  valueB: number | null
): VariableDiff {
  let difference: number | null = null;
  let percentChange: number | null = null;
  let direction: DiffDirection = 'unchanged';

  if (valueA !== null && valueB !== null) {
    difference = valueB - valueA;

    if (valueA !== 0) {
      percentChange = (difference / Math.abs(valueA)) * 100;
    }

    if (Math.abs(difference) < 1e-10) {
      direction = 'unchanged';
    } else if (difference > 0) {
      direction = 'increase';
    } else {
      direction = 'decrease';
    }
  }

  return {
    variable,
    name: meta.name,
    valueA,
    valueB,
    difference,
    percentChange,
    direction,
    unit: meta.unit,
    description: meta.description,
  };
}

/**
 * Invert a variable diff.
 */
function invertVariableDiff(diff: VariableDiff): VariableDiff {
  let invertedDirection: DiffDirection = 'unchanged';
  if (diff.direction === 'increase') {
    invertedDirection = 'decrease';
  } else if (diff.direction === 'decrease') {
    invertedDirection = 'increase';
  }

  return {
    ...diff,
    valueA: diff.valueB,
    valueB: diff.valueA,
    difference: diff.difference !== null ? -diff.difference : null,
    percentChange: diff.percentChange !== null ? -diff.percentChange : null,
    direction: invertedDirection,
  };
}

/**
 * Group diffs by category.
 */
function groupByCategory(diffs: readonly VariableDiff[]): CategoryDiff[] {
  const categoryMap = new Map<string, VariableDiff[]>();
  const categoryNames: Record<string, string> = {
    geometry: 'Geometry',
    uncertainty: 'Uncertainty',
    performance: 'Performance',
    dynamics: 'Dynamics',
    position: 'Position',
    derived: 'Derived',
  };

  for (const diff of diffs) {
    const category = diff.variable.split('.')[0] ?? 'other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(diff);
  }

  return Array.from(categoryMap.entries()).map(([category, vars]) => {
    const summary = {
      increases: vars.filter((v) => v.direction === 'increase').length,
      decreases: vars.filter((v) => v.direction === 'decrease').length,
      unchanged: vars.filter((v) => v.direction === 'unchanged').length,
    };

    return {
      category,
      displayName: categoryNames[category] ?? category,
      variables: vars,
      summary,
    };
  });
}

/**
 * Compute summary statistics.
 */
function computeSummary(
  diffs: readonly VariableDiff[]
): StateComparison['summary'] {
  return {
    totalVariables: diffs.length,
    increases: diffs.filter((d) => d.direction === 'increase').length,
    decreases: diffs.filter((d) => d.direction === 'decrease').length,
    unchanged: diffs.filter((d) => d.direction === 'unchanged').length,
    unavailable: diffs.filter(
      (d) => d.valueA === null || d.valueB === null
    ).length,
  };
}

// =============================================================================
// Formatting (Descriptive Only)
// =============================================================================

/**
 * Format a diff value for display.
 * INVARIANT: No value judgments.
 */
export function formatDiffValue(diff: VariableDiff): string {
  if (diff.valueA === null || diff.valueB === null) {
    return 'N/A';
  }

  const sign = diff.difference! >= 0 ? '+' : '';
  const absChange = Math.abs(diff.percentChange ?? 0);
  const pctStr =
    diff.percentChange !== null ? ` (${sign}${diff.percentChange.toFixed(1)}%)` : '';

  return `${diff.valueA.toFixed(4)} → ${diff.valueB.toFixed(4)}${pctStr}`;
}

/**
 * Format direction without value judgment.
 * INVARIANT: No "better" or "worse", only "higher" or "lower".
 */
export function formatDirection(direction: DiffDirection): string {
  switch (direction) {
    case 'increase':
      return 'higher';
    case 'decrease':
      return 'lower';
    case 'unchanged':
      return 'same';
  }
}

/**
 * Generate symbol for direction.
 */
export function directionSymbol(direction: DiffDirection): string {
  switch (direction) {
    case 'increase':
      return '↑';
    case 'decrease':
      return '↓';
    case 'unchanged':
      return '=';
  }
}

// =============================================================================
// HTML Generation
// =============================================================================

/**
 * Generate HTML for state comparison.
 * INVARIANT: Pure description, no prescription.
 */
export function generateComparisonHTML(comparison: StateComparison): string {
  let html = `
<div class="vc-comparison">
  <div class="vc-comparison-header">
    <div class="vc-state-label">State A: ${escapeHtml(comparison.stateAId)} (t=${comparison.timeA})</div>
    <div class="vc-state-label">State B: ${escapeHtml(comparison.stateBId)} (t=${comparison.timeB})</div>
    <div class="vc-time-diff">Δt = ${comparison.timeDiff}</div>
  </div>
  <div class="vc-comparison-summary">
    <span class="vc-summary-item vc-increase">↑ ${comparison.summary.increases} higher</span>
    <span class="vc-summary-item vc-decrease">↓ ${comparison.summary.decreases} lower</span>
    <span class="vc-summary-item vc-unchanged">= ${comparison.summary.unchanged} same</span>
  </div>
`;

  for (const category of comparison.categories) {
    html += `
  <div class="vc-category">
    <div class="vc-category-header">${escapeHtml(category.displayName)}</div>
    <table class="vc-diff-table">
      <thead>
        <tr>
          <th>Variable</th>
          <th>State A</th>
          <th>State B</th>
          <th>Δ</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
`;

    for (const diff of category.variables) {
      const dirClass = `vc-${diff.direction}`;
      const symbol = directionSymbol(diff.direction);
      const valueAStr = diff.valueA !== null ? diff.valueA.toFixed(4) : 'N/A';
      const valueBStr = diff.valueB !== null ? diff.valueB.toFixed(4) : 'N/A';
      const diffStr =
        diff.difference !== null
          ? (diff.difference >= 0 ? '+' : '') + diff.difference.toFixed(4)
          : 'N/A';

      html += `
        <tr class="${dirClass}" title="${escapeHtml(diff.description)}">
          <td class="vc-var-name">${escapeHtml(diff.name)}</td>
          <td class="vc-value">${valueAStr}</td>
          <td class="vc-value">${valueBStr}</td>
          <td class="vc-diff">${diffStr}</td>
          <td class="vc-direction">${symbol}</td>
        </tr>
`;
    }

    html += `
      </tbody>
    </table>
  </div>
`;
  }

  html += '</div>';

  return html;
}

/**
 * Generate plain text comparison.
 */
export function generateComparisonText(comparison: StateComparison): string {
  let text = `State Comparison: ${comparison.stateAId} → ${comparison.stateBId}\n`;
  text += `Time: ${comparison.timeA} → ${comparison.timeB} (Δ${comparison.timeDiff})\n`;
  text += '─'.repeat(60) + '\n\n';

  text += `Summary: ${comparison.summary.increases} higher, `;
  text += `${comparison.summary.decreases} lower, `;
  text += `${comparison.summary.unchanged} unchanged\n\n`;

  for (const category of comparison.categories) {
    text += `[${category.displayName}]\n`;

    for (const diff of category.variables) {
      const symbol = directionSymbol(diff.direction);
      const change = formatDiffValue(diff);
      text += `  ${symbol} ${diff.name}: ${change}\n`;
    }

    text += '\n';
  }

  return text;
}

// =============================================================================
// CSS for Comparison
// =============================================================================

export const COMPARISON_CSS = `
.vc-comparison {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  max-width: 800px;
  margin: 0 auto;
}

.vc-comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 12px;
}

.vc-state-label {
  font-weight: bold;
}

.vc-time-diff {
  color: #666;
  font-family: monospace;
}

.vc-comparison-summary {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.vc-summary-item {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.vc-summary-item.vc-increase {
  background: #e8f5e9;
  color: #2e7d32;
}

.vc-summary-item.vc-decrease {
  background: #fce4ec;
  color: #c62828;
}

.vc-summary-item.vc-unchanged {
  background: #f5f5f5;
  color: #666;
}

.vc-category {
  margin-bottom: 16px;
}

.vc-category-header {
  font-weight: bold;
  padding: 8px 0;
  border-bottom: 2px solid #ddd;
  margin-bottom: 8px;
}

.vc-diff-table {
  width: 100%;
  border-collapse: collapse;
}

.vc-diff-table th,
.vc-diff-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.vc-diff-table th {
  font-weight: 500;
  color: #666;
  font-size: 11px;
  text-transform: uppercase;
}

.vc-var-name {
  font-weight: 500;
}

.vc-value {
  font-family: monospace;
  font-size: 12px;
}

.vc-diff {
  font-family: monospace;
  font-size: 12px;
}

.vc-direction {
  text-align: center;
  font-size: 14px;
}

tr.vc-increase {
  background: #f1f8e9;
}

tr.vc-increase .vc-direction {
  color: #2e7d32;
}

tr.vc-decrease {
  background: #fce4ec;
}

tr.vc-decrease .vc-direction {
  color: #c62828;
}

tr.vc-unchanged {
  color: #999;
}
`;

// =============================================================================
// Helper Functions
// =============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
