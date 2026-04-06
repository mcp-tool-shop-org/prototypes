/**
 * Lightweight SVG dependency graph renderer.
 * Produces compact, inline SVG for embedding in HTML reports.
 * No external dependencies — pure computed layout.
 */

export interface GraphNode {
  id: string;
  label: string;
  kind: "changed" | "direct-dep" | "reverse-dep" | "indirect";
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: "imports" | "calls" | "depends";
  /** Terse justification for why this edge matters (e.g. "imports createInvoice") */
  reason?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerNodeId: string;
}

const NODE_COLORS: Record<GraphNode["kind"], { fill: string; stroke: string; text: string }> = {
  changed: { fill: "#f8514920", stroke: "#f85149", text: "#f85149" },
  "direct-dep": { fill: "#58a6ff15", stroke: "#58a6ff", text: "#58a6ff" },
  "reverse-dep": { fill: "#d2992215", stroke: "#d29922", text: "#d29922" },
  indirect: { fill: "#8b949e10", stroke: "#30363d", text: "#8b949e" },
};

const EDGE_COLORS: Record<GraphEdge["kind"], string> = {
  imports: "#58a6ff",
  calls: "#3fb950",
  depends: "#8b949e",
};

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Render a dependency graph as inline SVG.
 * Uses a radial layout with the center node in the middle,
 * reverse deps on the left, and forward deps on the right.
 */
export function renderSvgGraph(data: GraphData): string {
  if (data.nodes.length === 0) return "";
  if (data.nodes.length === 1) {
    // Single node — just show it centered
    return renderSingleNode(data.nodes[0]);
  }

  const nodeHeight = 32;
  const nodeMinWidth = 100;
  const charWidth = 7.5;
  const padding = 16;
  const colGap = 60;

  // Separate nodes into columns: reverse deps | center | forward deps
  const center = data.nodes.find((n) => n.id === data.centerNodeId);
  const reverseDeps = data.nodes.filter((n) => n.kind === "reverse-dep");
  const forwardDeps = data.nodes.filter((n) => n.kind === "direct-dep" || n.kind === "indirect");

  // Compute node widths
  function nodeWidth(label: string): number {
    return Math.max(nodeMinWidth, label.length * charWidth + padding * 2);
  }

  // Layout columns
  const leftCol = reverseDeps;
  const rightCol = forwardDeps;

  const leftMaxW = leftCol.length > 0
    ? Math.max(...leftCol.map((n) => nodeWidth(n.label)))
    : 0;
  const centerW = center ? nodeWidth(center.label) : nodeMinWidth;
  const rightMaxW = rightCol.length > 0
    ? Math.max(...rightCol.map((n) => nodeWidth(n.label)))
    : 0;

  const maxRows = Math.max(leftCol.length, 1, rightCol.length);
  const totalHeight = maxRows * (nodeHeight + 12) + padding * 2;

  // Column X positions
  const leftX = padding;
  const centerX = leftCol.length > 0
    ? leftX + leftMaxW + colGap
    : padding;
  const rightX = centerX + centerW + colGap;

  const totalWidth = (rightCol.length > 0 ? rightX + rightMaxW : centerX + centerW) + padding;

  // Position nodes
  const layoutNodes = new Map<string, LayoutNode>();

  if (center) {
    const cy = totalHeight / 2 - nodeHeight / 2;
    layoutNodes.set(center.id, {
      ...center,
      x: centerX,
      y: cy,
      width: centerW,
      height: nodeHeight,
    });
  }

  function layoutColumn(col: GraphNode[], x: number, maxW: number) {
    const startY = (totalHeight - col.length * (nodeHeight + 12)) / 2;
    for (let i = 0; i < col.length; i++) {
      const n = col[i];
      const w = nodeWidth(n.label);
      layoutNodes.set(n.id, {
        ...n,
        x: x + (maxW - w) / 2,
        y: startY + i * (nodeHeight + 12),
        width: w,
        height: nodeHeight,
      });
    }
  }

  if (leftCol.length > 0) layoutColumn(leftCol, leftX, leftMaxW);
  if (rightCol.length > 0) layoutColumn(rightCol, rightX, rightMaxW);

  // Build SVG
  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" style="width:100%;max-width:${totalWidth}px;height:auto;">`);

  // Edges (draw first so they're behind nodes)
  for (const edge of data.edges) {
    const from = layoutNodes.get(edge.from);
    const to = layoutNodes.get(edge.to);
    if (!from || !to) continue;

    const x1 = from.x + from.width;
    const y1 = from.y + from.height / 2;
    const x2 = to.x;
    const y2 = to.y + to.height / 2;

    // Determine direction — if "to" is to the left of "from", swap connection points
    let sx: number, sy: number, ex: number, ey: number;
    if (x2 >= x1) {
      sx = from.x + from.width;
      sy = y1;
      ex = to.x;
      ey = y2;
    } else {
      sx = from.x;
      sy = y1;
      ex = to.x + to.width;
      ey = y2;
    }

    const color = EDGE_COLORS[edge.kind] || EDGE_COLORS.depends;
    const mx = (sx + ex) / 2;
    const title = edge.reason ? `<title>${escSvg(edge.reason)}</title>` : "";
    lines.push(`<path d="M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6" marker-end="url(#arrow-${edge.kind})">${title}</path>`);
  }

  // Arrow markers
  const usedKinds = new Set(data.edges.map((e) => e.kind));
  for (const kind of usedKinds) {
    const color = EDGE_COLORS[kind] || EDGE_COLORS.depends;
    lines.push(`<defs><marker id="arrow-${kind}" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><polygon points="0 0, 10 3.5, 0 7" fill="${color}" opacity="0.6"/></marker></defs>`);
  }

  // Nodes
  for (const [, node] of layoutNodes) {
    const colors = NODE_COLORS[node.kind] || NODE_COLORS.indirect;
    const rx = 6;
    lines.push(`<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${rx}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`);
    lines.push(`<text x="${node.x + node.width / 2}" y="${node.y + node.height / 2 + 4}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="${colors.text}">${escSvg(truncate(node.label, 20))}</text>`);
  }

  lines.push("</svg>");
  return lines.join("\n");
}

function renderSingleNode(node: GraphNode): string {
  const colors = NODE_COLORS[node.kind] || NODE_COLORS.indirect;
  const w = Math.max(120, node.label.length * 7.5 + 32);
  const h = 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 20} ${h + 20}" style="width:100%;max-width:${w + 20}px;height:auto;">
    <rect x="10" y="10" width="${w}" height="${h}" rx="6" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>
    <text x="${10 + w / 2}" y="${10 + h / 2 + 4}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" fill="${colors.text}">${escSvg(node.label)}</text>
  </svg>`;
}

function escSvg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}
