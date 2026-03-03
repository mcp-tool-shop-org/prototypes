/**
 * VectorCaliper - Tooltip Content Generator
 *
 * Generates tooltip content directly from schema metadata.
 * Content is purely declarative — no computed prose.
 *
 * RULE: Tooltip text matches schema exactly (byte-for-byte).
 * RULE: No information revealed that isn't in the state.
 */

import type { SceneNode, PointNode, PathNode, VariableBinding } from '../scene/node';
import type { ModelState } from '../types/state';
import type { SemanticVariable } from '../mapping/semantic-map';

// =============================================================================
// Schema Metadata (interpretations from types)
// =============================================================================

/**
 * Canonical interpretations for each semantic variable.
 * These are the exact strings from the schema.
 */
export const VARIABLE_METADATA: Record<
  SemanticVariable,
  {
    readonly name: string;
    readonly unit: string;
    readonly description: string;
    readonly bounds?: { min: number; max: number };
  }
> = {
  // Position (from projection)
  'position.x': {
    name: 'Position X',
    unit: 'projection units',
    description: 'X coordinate in reduced state space',
  },
  'position.y': {
    name: 'Position Y',
    unit: 'projection units',
    description: 'Y coordinate in reduced state space',
  },
  'position.z': {
    name: 'Position Z',
    unit: 'projection units',
    description: 'Z coordinate in reduced state space (if 3D)',
  },

  // Geometry
  'geometry.effectiveDimension': {
    name: 'Effective Dimension',
    unit: 'dimensions',
    description: 'Intrinsic dimensionality of the representation',
    bounds: { min: 0, max: Infinity },
  },
  'geometry.anisotropy': {
    name: 'Anisotropy',
    unit: 'ratio',
    description: 'Ratio of largest to smallest principal component',
    bounds: { min: 0, max: Infinity },
  },
  'geometry.spread': {
    name: 'Spread',
    unit: 'distance',
    description: 'Average pairwise distance in representation space',
    bounds: { min: 0, max: Infinity },
  },
  'geometry.density': {
    name: 'Density',
    unit: 'density',
    description: 'Clustering coefficient or local density measure',
    bounds: { min: 0, max: Infinity },
  },

  // Uncertainty
  'uncertainty.entropy': {
    name: 'Entropy',
    unit: 'bits',
    description: 'Shannon entropy of output distribution',
    bounds: { min: 0, max: Infinity },
  },
  'uncertainty.margin': {
    name: 'Margin',
    unit: 'probability',
    description: 'Difference between top-1 and top-2 probabilities',
    bounds: { min: 0, max: 1 },
  },
  'uncertainty.calibration': {
    name: 'Calibration Error',
    unit: 'error',
    description: 'Expected calibration error (ECE or similar)',
    bounds: { min: 0, max: 1 },
  },
  'uncertainty.epistemic': {
    name: 'Epistemic Uncertainty',
    unit: 'normalized',
    description: 'Model uncertainty estimate',
    bounds: { min: 0, max: 1 },
  },
  'uncertainty.aleatoric': {
    name: 'Aleatoric Uncertainty',
    unit: 'normalized',
    description: 'Data uncertainty estimate',
    bounds: { min: 0, max: 1 },
  },

  // Performance
  'performance.accuracy': {
    name: 'Accuracy',
    unit: 'ratio',
    description: 'Classification accuracy or regression R²',
    bounds: { min: 0, max: 1 },
  },
  'performance.loss': {
    name: 'Loss',
    unit: 'loss',
    description: 'Loss function value (lower is better)',
    bounds: { min: 0, max: Infinity },
  },
  'performance.taskScore': {
    name: 'Task Score',
    unit: 'score',
    description: 'Task-specific score (F1, BLEU, etc.)',
    bounds: { min: 0, max: 1 },
  },
  'performance.cost': {
    name: 'Compute Cost',
    unit: 'cost',
    description: 'Computational cost proxy (FLOPs, latency)',
    bounds: { min: 0, max: Infinity },
  },

  // Dynamics
  'dynamics.velocity': {
    name: 'Velocity',
    unit: 'units/step',
    description: 'Rate of change in representation space',
    bounds: { min: 0, max: Infinity },
  },
  'dynamics.acceleration': {
    name: 'Acceleration',
    unit: 'units/step²',
    description: 'Acceleration (second derivative)',
  },
  'dynamics.stability': {
    name: 'Stability',
    unit: 'lyapunov',
    description: 'Stability measure (Lyapunov exponent proxy)',
  },
  'dynamics.phase': {
    name: 'Phase',
    unit: 'index',
    description: 'Discrete regime identifier',
    bounds: { min: 0, max: Infinity },
  },

  // Derived
  'derived.magnitude': {
    name: 'Magnitude',
    unit: 'norm',
    description: 'Total state magnitude/norm',
    bounds: { min: 0, max: Infinity },
  },
  'derived.dominantDimension': {
    name: 'Dominant Dimension',
    unit: 'index',
    description: 'Index of the dimension with highest variance',
  },
};

// =============================================================================
// Tooltip Data Structure
// =============================================================================

/**
 * A single variable entry in a tooltip.
 */
export interface TooltipVariable {
  readonly name: string;
  readonly value: string;
  readonly unit: string;
  readonly description: string;
  readonly bounds?: string;
  readonly channel: string;
}

/**
 * Complete tooltip content for a node.
 */
export interface TooltipContent {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly label: string;
  readonly layer: string;
  readonly variables: readonly TooltipVariable[];
  readonly stateId?: string;
  readonly time?: number;
}

// =============================================================================
// Content Generation
// =============================================================================

/**
 * Extract the raw value for a semantic variable from state.
 */
function extractValue(
  semantic: SemanticVariable,
  state: ModelState
): number | null {
  const parts = semantic.split('.');
  const group = parts[0];
  const field = parts[1];

  if (!group || !field) return null;

  switch (group) {
    case 'geometry': {
      const geo = state.geometry;
      switch (field) {
        case 'effectiveDimension':
          return geo.effectiveDimension.value;
        case 'anisotropy':
          return geo.anisotropy.value;
        case 'spread':
          return geo.spread.value;
        case 'density':
          return geo.density.value;
      }
      break;
    }
    case 'uncertainty': {
      const unc = state.uncertainty;
      switch (field) {
        case 'entropy':
          return unc.entropy.value;
        case 'margin':
          return unc.margin.value;
        case 'calibration':
          return unc.calibration.value;
        case 'epistemic':
          return unc.epistemic?.value ?? null;
        case 'aleatoric':
          return unc.aleatoric?.value ?? null;
      }
      break;
    }
    case 'performance': {
      const perf = state.performance;
      switch (field) {
        case 'accuracy':
          return perf.accuracy.value;
        case 'loss':
          return perf.loss.value;
        case 'taskScore':
          return perf.taskScore?.value ?? null;
        case 'cost':
          return perf.cost?.value ?? null;
      }
      break;
    }
    case 'dynamics': {
      const dyn = state.dynamics;
      if (!dyn) return null;
      switch (field) {
        case 'velocity':
          return dyn.velocity.value;
        case 'acceleration':
          return dyn.acceleration.value;
        case 'stability':
          return dyn.stability.value;
        case 'phase':
          return dyn.phase;
      }
      break;
    }
  }

  return null;
}

/**
 * Format a numeric value for display.
 */
function formatValue(value: number | null): string {
  if (value === null) return 'N/A';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4);
}

/**
 * Format bounds for display.
 */
function formatBounds(bounds?: { min: number; max: number }): string | undefined {
  if (!bounds) return undefined;
  const min = bounds.min === -Infinity ? '-∞' : bounds.min.toString();
  const max = bounds.max === Infinity ? '∞' : bounds.max.toString();
  return `[${min}, ${max}]`;
}

/**
 * Generate tooltip content for a scene node.
 */
export function generateTooltipContent(
  node: SceneNode,
  state?: ModelState
): TooltipContent {
  const variables: TooltipVariable[] = [];

  // Extract variable information from bindings
  for (const binding of node.bindings) {
    const meta = VARIABLE_METADATA[binding.semantic];
    if (!meta) continue;

    const rawValue = state ? extractValue(binding.semantic, state) : null;

    variables.push({
      name: meta.name,
      value: formatValue(rawValue),
      unit: meta.unit,
      description: meta.description,
      bounds: formatBounds(meta.bounds),
      channel: binding.channel,
    });
  }

  return {
    nodeId: node.id.value,
    nodeType: node.type,
    label: node.label,
    layer: node.layer,
    variables,
    stateId: node.meta?.stateId as string | undefined,
    time: node.meta?.time as number | undefined,
  };
}

/**
 * Generate tooltip HTML (declarative, no styling).
 */
export function generateTooltipHTML(content: TooltipContent): string {
  const lines: string[] = [];

  lines.push(`<div class="vc-tooltip" data-node-id="${escapeHTML(content.nodeId)}">`);
  lines.push(`  <div class="vc-tooltip-header">`);
  lines.push(`    <span class="vc-tooltip-label">${escapeHTML(content.label)}</span>`);
  lines.push(`    <span class="vc-tooltip-type">${escapeHTML(content.nodeType)}</span>`);
  lines.push(`  </div>`);

  if (content.stateId) {
    lines.push(`  <div class="vc-tooltip-state">State: ${escapeHTML(content.stateId)}</div>`);
  }

  if (content.time !== undefined) {
    lines.push(`  <div class="vc-tooltip-time">Time: ${content.time}</div>`);
  }

  if (content.variables.length > 0) {
    lines.push(`  <div class="vc-tooltip-variables">`);

    for (const v of content.variables) {
      lines.push(`    <div class="vc-tooltip-variable">`);
      lines.push(`      <div class="vc-tooltip-var-header">`);
      lines.push(`        <span class="vc-tooltip-var-name">${escapeHTML(v.name)}</span>`);
      lines.push(`        <span class="vc-tooltip-var-channel">[${escapeHTML(v.channel)}]</span>`);
      lines.push(`      </div>`);
      lines.push(`      <div class="vc-tooltip-var-value">${escapeHTML(v.value)} ${escapeHTML(v.unit)}</div>`);
      if (v.bounds) {
        lines.push(`      <div class="vc-tooltip-var-bounds">Bounds: ${escapeHTML(v.bounds)}</div>`);
      }
      lines.push(`      <div class="vc-tooltip-var-desc">${escapeHTML(v.description)}</div>`);
      lines.push(`    </div>`);
    }

    lines.push(`  </div>`);
  }

  lines.push(`</div>`);

  return lines.join('\n');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
