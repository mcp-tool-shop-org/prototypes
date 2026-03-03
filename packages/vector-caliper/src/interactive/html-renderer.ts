/**
 * VectorCaliper - Interactive HTML Renderer
 *
 * Wraps SVG output in HTML with hover interactions.
 * Interactions are read-only — no state mutation.
 *
 * RULE: Hover does not cause layout shift or redraw.
 * RULE: All tooltip content matches schema exactly.
 */

import type { Scene, SceneNode } from '../scene';
import type { ModelState } from '../types/state';
import { SVGRenderer, type SVGConfig, DEFAULT_SVG_CONFIG } from '../render/svg';
import {
  generateTooltipContent,
  generateTooltipHTML,
  VARIABLE_METADATA,
  type TooltipContent,
} from './tooltip-content';

// =============================================================================
// HTML Configuration
// =============================================================================

export interface HTMLConfig extends SVGConfig {
  /** Page title */
  readonly title: string;

  /** Include default CSS styles */
  readonly includeDefaultStyles: boolean;

  /** Custom CSS to inject */
  readonly customCSS?: string;

  /** Enable hover tooltips */
  readonly enableTooltips: boolean;

  /** Tooltip position: 'cursor' follows mouse, 'fixed' stays in corner */
  readonly tooltipPosition: 'cursor' | 'fixed';
}

export const DEFAULT_HTML_CONFIG: HTMLConfig = {
  ...DEFAULT_SVG_CONFIG,
  title: 'VectorCaliper Visualization',
  includeDefaultStyles: true,
  enableTooltips: true,
  tooltipPosition: 'cursor',
};

// =============================================================================
// Default Styles
// =============================================================================

const DEFAULT_STYLES = `
/* VectorCaliper Interactive Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.vc-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.vc-svg-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 10px;
  position: relative;
}

.vc-svg-wrapper svg {
  display: block;
}

/* Tooltip styles */
.vc-tooltip {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none;
  z-index: 1000;
  max-width: 320px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.vc-tooltip.visible {
  opacity: 1;
}

.vc-tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.vc-tooltip-label {
  font-weight: 600;
  color: #333;
}

.vc-tooltip-type {
  font-size: 11px;
  color: #888;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.vc-tooltip-state,
.vc-tooltip-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.vc-tooltip-variables {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.vc-tooltip-variable {
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.vc-tooltip-var-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.vc-tooltip-var-name {
  font-weight: 500;
  color: #333;
}

.vc-tooltip-var-channel {
  font-size: 10px;
  color: #999;
  font-family: monospace;
}

.vc-tooltip-var-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a73e8;
  margin-bottom: 4px;
}

.vc-tooltip-var-bounds {
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
}

.vc-tooltip-var-desc {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

/* SVG element hover states */
.vc-svg-wrapper svg [data-vc-type] {
  cursor: pointer;
  transition: filter 0.1s ease;
}

.vc-svg-wrapper svg [data-vc-type]:hover {
  filter: brightness(1.1);
}

/* Fixed tooltip position variant */
.vc-tooltip.fixed {
  position: fixed;
  top: 20px;
  right: 20px;
}
`;

// =============================================================================
// Interaction Script
// =============================================================================

function generateInteractionScript(
  tooltipData: Map<string, TooltipContent>,
  config: HTMLConfig
): string {
  // Serialize tooltip data as JSON
  const tooltipDataJSON = JSON.stringify(
    Object.fromEntries(tooltipData),
    null,
    2
  );

  return `
<script>
(function() {
  'use strict';

  // Tooltip data from schema (read-only)
  const tooltipData = ${tooltipDataJSON};

  const tooltip = document.getElementById('vc-tooltip');
  const svgWrapper = document.querySelector('.vc-svg-wrapper');
  const positionMode = '${config.tooltipPosition}';

  if (!tooltip || !svgWrapper) return;

  // Track current hovered element
  let currentElement = null;

  // Position tooltip near cursor
  function positionTooltip(e) {
    if (positionMode === 'fixed') {
      tooltip.classList.add('fixed');
      return;
    }

    const padding = 15;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = e.clientX + padding;
    let y = e.clientY + padding;

    // Keep within viewport
    if (x + rect.width > viewportWidth) {
      x = e.clientX - rect.width - padding;
    }
    if (y + rect.height > viewportHeight) {
      y = e.clientY - rect.height - padding;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  // Show tooltip for element
  function showTooltip(element, e) {
    const nodeId = element.id;
    const data = tooltipData[nodeId];

    if (!data) {
      tooltip.classList.remove('visible');
      return;
    }

    // Build tooltip HTML (declarative, from pre-computed data)
    let html = '<div class="vc-tooltip-header">';
    html += '<span class="vc-tooltip-label">' + escapeHTML(data.label) + '</span>';
    html += '<span class="vc-tooltip-type">' + escapeHTML(data.nodeType) + '</span>';
    html += '</div>';

    if (data.stateId) {
      html += '<div class="vc-tooltip-state">State: ' + escapeHTML(data.stateId) + '</div>';
    }

    if (data.time !== undefined) {
      html += '<div class="vc-tooltip-time">Time: ' + data.time + '</div>';
    }

    if (data.variables && data.variables.length > 0) {
      html += '<div class="vc-tooltip-variables">';
      for (const v of data.variables) {
        html += '<div class="vc-tooltip-variable">';
        html += '<div class="vc-tooltip-var-header">';
        html += '<span class="vc-tooltip-var-name">' + escapeHTML(v.name) + '</span>';
        html += '<span class="vc-tooltip-var-channel">[' + escapeHTML(v.channel) + ']</span>';
        html += '</div>';
        html += '<div class="vc-tooltip-var-value">' + escapeHTML(v.value) + ' ' + escapeHTML(v.unit) + '</div>';
        if (v.bounds) {
          html += '<div class="vc-tooltip-var-bounds">Bounds: ' + escapeHTML(v.bounds) + '</div>';
        }
        html += '<div class="vc-tooltip-var-desc">' + escapeHTML(v.description) + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    tooltip.innerHTML = html;
    positionTooltip(e);
    tooltip.classList.add('visible');
  }

  // Hide tooltip
  function hideTooltip() {
    tooltip.classList.remove('visible');
    currentElement = null;
  }

  // Event delegation on SVG wrapper
  svgWrapper.addEventListener('mouseover', function(e) {
    const target = e.target.closest('[data-vc-type]');
    if (target && target !== currentElement) {
      currentElement = target;
      showTooltip(target, e);
    }
  });

  svgWrapper.addEventListener('mousemove', function(e) {
    if (currentElement && positionMode === 'cursor') {
      positionTooltip(e);
    }
  });

  svgWrapper.addEventListener('mouseout', function(e) {
    const target = e.target.closest('[data-vc-type]');
    const related = e.relatedTarget ? e.relatedTarget.closest('[data-vc-type]') : null;
    if (target && target !== related) {
      hideTooltip();
    }
  });

  // Escape HTML helper
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
</script>
`;
}

// =============================================================================
// HTML Renderer
// =============================================================================

/**
 * Renders scene to interactive HTML with semantic hover.
 */
export class HTMLRenderer {
  private config: HTMLConfig;
  private svgRenderer: SVGRenderer;
  private stateMap: Map<string, ModelState> = new Map();

  constructor(config: Partial<HTMLConfig> = {}) {
    this.config = { ...DEFAULT_HTML_CONFIG, ...config };
    this.svgRenderer = new SVGRenderer(this.config);
  }

  /**
   * Register a state for tooltip data extraction.
   */
  registerState(stateId: string, state: ModelState): void {
    this.stateMap.set(stateId, state);
  }

  /**
   * Register multiple states.
   */
  registerStates(states: ModelState[]): void {
    for (const state of states) {
      this.stateMap.set(state.id, state);
    }
  }

  /**
   * Clear registered states.
   */
  clearStates(): void {
    this.stateMap.clear();
  }

  /**
   * Render scene to interactive HTML.
   */
  render(scene: Scene): string {
    // Generate SVG
    const svg = this.svgRenderer.render(scene);

    // Generate tooltip data for each node
    const tooltipData = new Map<string, TooltipContent>();

    for (const node of scene.getAllNodes()) {
      const stateId = node.meta?.stateId as string | undefined;
      const state = stateId ? this.stateMap.get(stateId) : undefined;

      // Generate tooltip content from schema
      const content = generateTooltipContent(node, state);

      // Use SVG-safe ID (matches what SVGRenderer produces)
      const svgId = node.id.value.replace(/[^a-zA-Z0-9_-]/g, '_');
      tooltipData.set(svgId, content);
    }

    // Build HTML
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html lang="en">');
    lines.push('<head>');
    lines.push('  <meta charset="UTF-8">');
    lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    lines.push(`  <title>${escapeHTML(this.config.title)}</title>`);

    if (this.config.includeDefaultStyles) {
      lines.push('  <style>');
      lines.push(DEFAULT_STYLES);
      lines.push('  </style>');
    }

    if (this.config.customCSS) {
      lines.push('  <style>');
      lines.push(this.config.customCSS);
      lines.push('  </style>');
    }

    lines.push('</head>');
    lines.push('<body>');
    lines.push('  <div class="vc-container">');
    lines.push('    <div class="vc-svg-wrapper">');
    lines.push(svg);
    lines.push('    </div>');
    lines.push('  </div>');

    if (this.config.enableTooltips) {
      lines.push('  <div id="vc-tooltip" class="vc-tooltip"></div>');
      lines.push(generateInteractionScript(tooltipData, this.config));
    }

    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  /**
   * Get configuration.
   */
  getConfig(): Readonly<HTMLConfig> {
    return this.config;
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<HTMLConfig>): void {
    this.config = { ...this.config, ...config };
    this.svgRenderer.setConfig(this.config);
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// Singleton Export
// =============================================================================

export const defaultHTMLRenderer = new HTMLRenderer();
