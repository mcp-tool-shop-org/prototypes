/**
 * VectorCaliper - SVG Backend Adapter
 *
 * Converts scene graph to SVG format.
 * IDs and data attributes preserved for traceability.
 *
 * RULE: Generated SVG opens cleanly in vector tools (Inkscape, etc.)
 * RULE: All elements trace back to state variables via data attributes
 */

import type {
  Scene,
  SceneNode,
  PointNode,
  PathNode,
  GroupNode,
  TextNode,
  AxisNode,
  NodeId,
} from '../scene';

// =============================================================================
// SVG Configuration
// =============================================================================

export interface SVGConfig {
  /** SVG width in pixels */
  readonly width: number;

  /** SVG height in pixels */
  readonly height: number;

  /** Padding around content */
  readonly padding: number;

  /** Background color (null for transparent) */
  readonly background: string | null;

  /** Whether to include data attributes for traceability */
  readonly includeDataAttributes: boolean;

  /** Whether to include human-readable comments */
  readonly includeComments: boolean;

  /** XML namespace for Inkscape compatibility */
  readonly inkscapeCompat: boolean;

  /** Decimal precision for coordinates */
  readonly precision: number;
}

export const DEFAULT_SVG_CONFIG: SVGConfig = {
  width: 800,
  height: 600,
  padding: 40,
  background: '#ffffff',
  includeDataAttributes: true,
  includeComments: true,
  inkscapeCompat: true,
  precision: 2,
};

// =============================================================================
// Color Utilities
// =============================================================================

function hslToString(h: number, s: number, l: number, a: number): string {
  const hDeg = Math.round(h);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  if (a < 1) {
    return `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a.toFixed(2)})`;
  }
  return `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
}

// =============================================================================
// Coordinate Transform
// =============================================================================

interface Transform {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

function computeTransform(
  scene: Scene,
  config: SVGConfig
): Transform {
  const bounds = scene.computeBounds();
  const contentWidth = bounds.maxX - bounds.minX || 1;
  const contentHeight = bounds.maxY - bounds.minY || 1;

  const availableWidth = config.width - 2 * config.padding;
  const availableHeight = config.height - 2 * config.padding;

  const scale = Math.min(
    availableWidth / contentWidth,
    availableHeight / contentHeight
  );

  return {
    scaleX: scale,
    scaleY: -scale, // Flip Y for SVG coordinate system
    offsetX: config.padding - bounds.minX * scale,
    offsetY: config.height - config.padding + bounds.minY * scale,
  };
}

function transformX(x: number, t: Transform): number {
  return x * t.scaleX + t.offsetX;
}

function transformY(y: number, t: Transform): number {
  return y * t.scaleY + t.offsetY;
}

// =============================================================================
// SVG Element Generation
// =============================================================================

function formatNumber(n: number, precision: number): string {
  return n.toFixed(precision);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function nodeIdToSvgId(id: NodeId): string {
  return id.value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generateDataAttributes(node: SceneNode, config: SVGConfig): string {
  if (!config.includeDataAttributes) return '';

  const attrs: string[] = [];
  attrs.push(`data-vc-type="${node.type}"`);
  attrs.push(`data-vc-layer="${escapeXml(node.layer)}"`);
  attrs.push(`data-vc-label="${escapeXml(node.label)}"`);

  // Add binding info
  if (node.bindings.length > 0) {
    const bindingStr = node.bindings
      .map((b) => `${b.channel}:${b.semantic}`)
      .join(';');
    attrs.push(`data-vc-bindings="${escapeXml(bindingStr)}"`);
  }

  // Add metadata
  if (node.meta) {
    if (node.meta.stateId) {
      attrs.push(`data-vc-state-id="${escapeXml(String(node.meta.stateId))}"`);
    }
    if (node.meta.time !== undefined) {
      attrs.push(`data-vc-time="${node.meta.time}"`);
    }
  }

  return attrs.join(' ');
}

// =============================================================================
// Shape Rendering
// =============================================================================

function renderPointNode(
  node: PointNode,
  transform: Transform,
  config: SVGConfig
): string {
  const x = transformX(node.x, transform);
  const y = transformY(node.y, transform);
  const r = node.radius * Math.abs(transform.scaleX);

  const fillColor = hslToString(node.fill.h, node.fill.s, node.fill.l, node.fill.a);
  const strokeColor = hslToString(
    node.stroke.color.h,
    node.stroke.color.s,
    node.stroke.color.l,
    node.stroke.color.a
  );

  const id = nodeIdToSvgId(node.id);
  const dataAttrs = generateDataAttributes(node, config);
  const visibility = node.visible ? '' : ' visibility="hidden"';
  const p = config.precision;

  let strokeDash = '';
  if (node.stroke.dash && node.stroke.dash.length > 0) {
    strokeDash = ` stroke-dasharray="${node.stroke.dash.join(' ')}"`;
  }

  // Different shapes
  switch (node.shape) {
    case 'circle':
      return `<circle id="${id}" ${dataAttrs} cx="${formatNumber(x, p)}" cy="${formatNumber(y, p)}" r="${formatNumber(r, p)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;

    case 'square': {
      const half = r;
      return `<rect id="${id}" ${dataAttrs} x="${formatNumber(x - half, p)}" y="${formatNumber(y - half, p)}" width="${formatNumber(r * 2, p)}" height="${formatNumber(r * 2, p)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
    }

    case 'diamond': {
      const points = [
        `${formatNumber(x, p)},${formatNumber(y - r, p)}`,
        `${formatNumber(x + r, p)},${formatNumber(y, p)}`,
        `${formatNumber(x, p)},${formatNumber(y + r, p)}`,
        `${formatNumber(x - r, p)},${formatNumber(y, p)}`,
      ].join(' ');
      return `<polygon id="${id}" ${dataAttrs} points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
    }

    case 'triangle': {
      const h = r * Math.sqrt(3);
      const points = [
        `${formatNumber(x, p)},${formatNumber(y - r, p)}`,
        `${formatNumber(x + h / 2, p)},${formatNumber(y + r / 2, p)}`,
        `${formatNumber(x - h / 2, p)},${formatNumber(y + r / 2, p)}`,
      ].join(' ');
      return `<polygon id="${id}" ${dataAttrs} points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
    }

    case 'star': {
      // 5-pointed star
      const inner = r * 0.4;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : inner;
        pts.push(
          `${formatNumber(x + rad * Math.cos(angle), p)},${formatNumber(y + rad * Math.sin(angle), p)}`
        );
      }
      return `<polygon id="${id}" ${dataAttrs} points="${pts.join(' ')}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
    }

    case 'cross': {
      const arm = r * 0.3;
      const d = `M ${formatNumber(x - r, p)} ${formatNumber(y - arm, p)} ` +
        `L ${formatNumber(x - arm, p)} ${formatNumber(y - arm, p)} ` +
        `L ${formatNumber(x - arm, p)} ${formatNumber(y - r, p)} ` +
        `L ${formatNumber(x + arm, p)} ${formatNumber(y - r, p)} ` +
        `L ${formatNumber(x + arm, p)} ${formatNumber(y - arm, p)} ` +
        `L ${formatNumber(x + r, p)} ${formatNumber(y - arm, p)} ` +
        `L ${formatNumber(x + r, p)} ${formatNumber(y + arm, p)} ` +
        `L ${formatNumber(x + arm, p)} ${formatNumber(y + arm, p)} ` +
        `L ${formatNumber(x + arm, p)} ${formatNumber(y + r, p)} ` +
        `L ${formatNumber(x - arm, p)} ${formatNumber(y + r, p)} ` +
        `L ${formatNumber(x - arm, p)} ${formatNumber(y + arm, p)} ` +
        `L ${formatNumber(x - r, p)} ${formatNumber(y + arm, p)} Z`;
      return `<path id="${id}" ${dataAttrs} d="${d}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
    }

    default:
      return `<circle id="${id}" ${dataAttrs} cx="${formatNumber(x, p)}" cy="${formatNumber(y, p)}" r="${formatNumber(r, p)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${visibility}/>`;
  }
}

function renderPathNode(
  node: PathNode,
  transform: Transform,
  config: SVGConfig
): string {
  if (node.points.length === 0) return '';

  const id = nodeIdToSvgId(node.id);
  const dataAttrs = generateDataAttributes(node, config);
  const visibility = node.visible ? '' : ' visibility="hidden"';
  const p = config.precision;

  const strokeColor = hslToString(
    node.stroke.color.h,
    node.stroke.color.s,
    node.stroke.color.l,
    node.stroke.color.a
  );

  let fillAttr = 'none';
  if (node.fill && node.closed) {
    fillAttr = hslToString(node.fill.h, node.fill.s, node.fill.l, node.fill.a);
  }

  let strokeDash = '';
  if (node.stroke.dash && node.stroke.dash.length > 0) {
    strokeDash = ` stroke-dasharray="${node.stroke.dash.join(' ')}"`;
  }

  // Transform points
  const pts = node.points.map((pt) => ({
    x: transformX(pt.x, transform),
    y: transformY(pt.y, transform),
  }));

  let d: string;

  if (node.interpolation === 'linear' || pts.length < 3) {
    // Simple linear path
    d = pts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${formatNumber(pt.x, p)} ${formatNumber(pt.y, p)}`)
      .join(' ');
    if (node.closed) d += ' Z';
  } else if (node.interpolation === 'bezier' || node.interpolation === 'catmull-rom') {
    // Catmull-Rom spline approximation using cubic beziers
    d = `M ${formatNumber(pts[0]!.x, p)} ${formatNumber(pts[0]!.y, p)}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(pts.length - 1, i + 2)]!;

      // Catmull-Rom to Bezier control points
      const tension = 6;
      const cp1x = p1.x + (p2.x - p0.x) / tension;
      const cp1y = p1.y + (p2.y - p0.y) / tension;
      const cp2x = p2.x - (p3.x - p1.x) / tension;
      const cp2y = p2.y - (p3.y - p1.y) / tension;

      d += ` C ${formatNumber(cp1x, p)} ${formatNumber(cp1y, p)}, ${formatNumber(cp2x, p)} ${formatNumber(cp2y, p)}, ${formatNumber(p2.x, p)} ${formatNumber(p2.y, p)}`;
    }

    if (node.closed) d += ' Z';
  } else {
    d = pts
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${formatNumber(pt.x, p)} ${formatNumber(pt.y, p)}`)
      .join(' ');
  }

  return `<path id="${id}" ${dataAttrs} d="${d}" fill="${fillAttr}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"${strokeDash}${visibility}/>`;
}

function renderTextNode(
  node: TextNode,
  transform: Transform,
  config: SVGConfig
): string {
  const x = transformX(node.x, transform);
  const y = transformY(node.y, transform);

  const id = nodeIdToSvgId(node.id);
  const dataAttrs = generateDataAttributes(node, config);
  const visibility = node.visible ? '' : ' visibility="hidden"';

  const color = hslToString(node.color.h, node.color.s, node.color.l, node.color.a);

  const anchorMap = {
    start: 'start',
    middle: 'middle',
    end: 'end',
  };

  return `<text id="${id}" ${dataAttrs} x="${formatNumber(x, config.precision)}" y="${formatNumber(y, config.precision)}" font-family="${node.font.family}" font-size="${node.font.size}" font-weight="${node.font.weight}" text-anchor="${anchorMap[node.anchor]}" fill="${color}"${visibility}>${escapeXml(node.text)}</text>`;
}

function renderAxisNode(
  node: AxisNode,
  transform: Transform,
  config: SVGConfig
): string {
  const id = nodeIdToSvgId(node.id);
  const dataAttrs = generateDataAttributes(node, config);
  const visibility = node.visible ? '' : ' visibility="hidden"';
  const p = config.precision;

  const x1 = transformX(node.start.x, transform);
  const y1 = transformY(node.start.y, transform);
  const x2 = transformX(node.end.x, transform);
  const y2 = transformY(node.end.y, transform);

  const strokeColor = hslToString(
    node.stroke.color.h,
    node.stroke.color.s,
    node.stroke.color.l,
    node.stroke.color.a
  );

  const lines: string[] = [];

  // Main axis line
  lines.push(
    `<line x1="${formatNumber(x1, p)}" y1="${formatNumber(y1, p)}" x2="${formatNumber(x2, p)}" y2="${formatNumber(y2, p)}" stroke="${strokeColor}" stroke-width="${node.stroke.width}"/>`
  );

  // Tick marks
  const dx = x2 - x1;
  const dy = y2 - y1;
  const tickLen = 5;

  // Perpendicular direction for ticks
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  for (const tick of node.ticks) {
    const tx = x1 + tick.position * dx;
    const ty = y1 + tick.position * dy;

    lines.push(
      `<line x1="${formatNumber(tx, p)}" y1="${formatNumber(ty, p)}" x2="${formatNumber(tx + perpX * tickLen, p)}" y2="${formatNumber(ty + perpY * tickLen, p)}" stroke="${strokeColor}" stroke-width="1"/>`
    );

    lines.push(
      `<text x="${formatNumber(tx + perpX * tickLen * 2, p)}" y="${formatNumber(ty + perpY * tickLen * 2, p)}" font-size="10" text-anchor="middle" fill="${strokeColor}">${escapeXml(tick.label)}</text>`
    );
  }

  // Axis label
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  lines.push(
    `<text x="${formatNumber(midX + perpX * 30, p)}" y="${formatNumber(midY + perpY * 30, p)}" font-size="12" text-anchor="middle" fill="${strokeColor}">${escapeXml(node.axisLabel)}</text>`
  );

  return `<g id="${id}" ${dataAttrs}${visibility}>\n  ${lines.join('\n  ')}\n</g>`;
}

function renderGroupNode(
  node: GroupNode,
  scene: Scene,
  transform: Transform,
  config: SVGConfig
): string {
  const id = nodeIdToSvgId(node.id);
  const dataAttrs = generateDataAttributes(node, config);
  const visibility = node.visible ? '' : ' visibility="hidden"';

  let transformAttr = '';
  if (node.transform) {
    const parts: string[] = [];
    if (node.transform.translateX || node.transform.translateY) {
      parts.push(`translate(${node.transform.translateX}, ${node.transform.translateY})`);
    }
    if (node.transform.scale !== 1) {
      parts.push(`scale(${node.transform.scale})`);
    }
    if (node.transform.rotate) {
      parts.push(`rotate(${(node.transform.rotate * 180) / Math.PI})`);
    }
    if (parts.length > 0) {
      transformAttr = ` transform="${parts.join(' ')}"`;
    }
  }

  const children = scene.getChildren(node.id);
  const childrenSvg = children.map((child) => renderNode(child, scene, transform, config));

  return `<g id="${id}" ${dataAttrs}${transformAttr}${visibility}>\n  ${childrenSvg.join('\n  ')}\n</g>`;
}

function renderNode(
  node: SceneNode,
  scene: Scene,
  transform: Transform,
  config: SVGConfig
): string {
  switch (node.type) {
    case 'point':
      return renderPointNode(node, transform, config);
    case 'path':
      return renderPathNode(node, transform, config);
    case 'text':
      return renderTextNode(node, transform, config);
    case 'axis':
      return renderAxisNode(node, transform, config);
    case 'group':
      return renderGroupNode(node, scene, transform, config);
  }
}

// =============================================================================
// SVG Renderer
// =============================================================================

/**
 * Renders a scene graph to SVG string.
 */
export class SVGRenderer {
  private config: SVGConfig;

  constructor(config: Partial<SVGConfig> = {}) {
    this.config = { ...DEFAULT_SVG_CONFIG, ...config };
  }

  /**
   * Render scene to SVG string.
   */
  render(scene: Scene): string {
    const transform = computeTransform(scene, this.config);
    const lines: string[] = [];

    // XML declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    // SVG element with namespaces
    let svgAttrs = `xmlns="http://www.w3.org/2000/svg" width="${this.config.width}" height="${this.config.height}" viewBox="0 0 ${this.config.width} ${this.config.height}"`;

    if (this.config.inkscapeCompat) {
      svgAttrs += ' xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"';
      svgAttrs += ' xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"';
    }

    lines.push(`<svg ${svgAttrs}>`);

    // Metadata comment
    if (this.config.includeComments) {
      const meta = scene.getMetadata();
      lines.push('  <!-- VectorCaliper Scene -->');
      lines.push(`  <!-- Source: ${escapeXml(meta.source)} -->`);
      lines.push(`  <!-- Created: ${new Date(meta.createdAt).toISOString()} -->`);
      lines.push(`  <!-- Bounds: [${meta.bounds.minX}, ${meta.bounds.minY}] to [${meta.bounds.maxX}, ${meta.bounds.maxY}] -->`);
    }

    // Background
    if (this.config.background) {
      lines.push(`  <rect width="100%" height="100%" fill="${this.config.background}"/>`);
    }

    // Render layers in order
    for (const layer of scene.getLayers()) {
      if (this.config.includeComments) {
        lines.push(`  <!-- Layer: ${escapeXml(layer)} -->`);
      }

      const layerAttr = this.config.inkscapeCompat
        ? ` inkscape:groupmode="layer" inkscape:label="${escapeXml(layer)}"`
        : '';

      lines.push(`  <g id="layer-${layer}"${layerAttr}>`);

      // Get root nodes in this layer (non-grouped nodes)
      const nodes = scene.getNodesInLayer(layer);
      for (const node of nodes) {
        // Skip if node has a parent (it will be rendered by its parent group)
        if (node.parent) continue;

        const svg = renderNode(node, scene, transform, this.config);
        lines.push('    ' + svg.split('\n').join('\n    '));
      }

      lines.push('  </g>');
    }

    lines.push('</svg>');

    return lines.join('\n');
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<SVGConfig> {
    return this.config;
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<SVGConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const defaultSVGRenderer = new SVGRenderer();
