/**
 * VectorCaliper - Scene Graph Nodes
 *
 * Semantic scene graph nodes with stable IDs and variable bindings.
 * Each node represents a visual element bound to state data.
 *
 * INVARIANT: No rendering assumptions inside the graph.
 * The scene graph is a data structure, not a drawing API.
 */

import type { VisualChannel, ChannelType } from '../mapping/channels';
import type { SemanticVariable } from '../mapping/semantic-map';

// =============================================================================
// Node Identity
// =============================================================================

/**
 * Unique, stable identifier for a scene node.
 * Must be deterministic and reproducible.
 */
export interface NodeId {
  readonly value: string;
  readonly namespace: string; // e.g., 'state', 'trajectory', 'annotation'
}

export function createNodeId(namespace: string, ...parts: (string | number)[]): NodeId {
  return {
    namespace,
    value: `${namespace}:${parts.join(':')}`,
  };
}

// =============================================================================
// Variable Binding
// =============================================================================

/**
 * Binds a visual channel to a semantic variable.
 * This is the "meaning" attached to a visual property.
 */
export interface VariableBinding {
  readonly channel: ChannelType;
  readonly semantic: SemanticVariable;
  readonly resolved: VisualChannel;
}

// =============================================================================
// Node Types
// =============================================================================

/**
 * Base properties for all scene nodes.
 */
export interface BaseNode {
  /** Stable, unique identifier */
  readonly id: NodeId;

  /** Human-readable label (for debugging/inspection) */
  readonly label: string;

  /** Variable bindings (what this node encodes) */
  readonly bindings: readonly VariableBinding[];

  /** Layer this node belongs to */
  readonly layer: string;

  /** Whether the node is currently visible */
  readonly visible: boolean;

  /** Optional parent node ID (for grouping) */
  readonly parent?: NodeId;

  /** Arbitrary metadata */
  readonly meta?: Record<string, unknown>;
}

/**
 * A point/glyph in the scene.
 * Represents a single state snapshot.
 */
export interface PointNode extends BaseNode {
  readonly type: 'point';

  /** Center position */
  readonly x: number;
  readonly y: number;
  readonly z?: number;

  /** Shape of the glyph */
  readonly shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'cross';

  /** Radius/size */
  readonly radius: number;

  /** Fill color (HSL) */
  readonly fill: {
    readonly h: number; // [0, 360)
    readonly s: number; // [0, 1]
    readonly l: number; // [0, 1]
    readonly a: number; // [0, 1]
  };

  /** Stroke properties */
  readonly stroke: {
    readonly color: { h: number; s: number; l: number; a: number };
    readonly width: number;
    readonly dash?: readonly number[];
  };

  /** Jitter/noise (for uncertainty visualization) */
  readonly jitter?: {
    readonly amplitude: number;
    readonly frequency: number;
  };
}

/**
 * A path/trajectory connecting points.
 */
export interface PathNode extends BaseNode {
  readonly type: 'path';

  /** Sequence of points forming the path */
  readonly points: readonly { x: number; y: number; z?: number }[];

  /** Whether path is closed (forms a loop) */
  readonly closed: boolean;

  /** Stroke properties */
  readonly stroke: {
    readonly color: { h: number; s: number; l: number; a: number };
    readonly width: number;
    readonly dash?: readonly number[];
  };

  /** Fill (for closed paths) */
  readonly fill?: {
    readonly h: number;
    readonly s: number;
    readonly l: number;
    readonly a: number;
  };

  /** Smoothing/interpolation method */
  readonly interpolation: 'linear' | 'bezier' | 'catmull-rom';
}

/**
 * A group of nodes (for organization).
 */
export interface GroupNode extends BaseNode {
  readonly type: 'group';

  /** Child node IDs */
  readonly children: readonly NodeId[];

  /** Transform applied to all children */
  readonly transform?: {
    readonly translateX: number;
    readonly translateY: number;
    readonly scale: number;
    readonly rotate: number; // radians
  };
}

/**
 * A text label/annotation.
 */
export interface TextNode extends BaseNode {
  readonly type: 'text';

  /** Position */
  readonly x: number;
  readonly y: number;

  /** Text content */
  readonly text: string;

  /** Font properties */
  readonly font: {
    readonly family: string;
    readonly size: number;
    readonly weight: 'normal' | 'bold';
  };

  /** Text color */
  readonly color: {
    readonly h: number;
    readonly s: number;
    readonly l: number;
    readonly a: number;
  };

  /** Anchor point */
  readonly anchor: 'start' | 'middle' | 'end';
}

/**
 * An axis/scale indicator.
 */
export interface AxisNode extends BaseNode {
  readonly type: 'axis';

  /** Start and end positions */
  readonly start: { x: number; y: number };
  readonly end: { x: number; y: number };

  /** Tick marks */
  readonly ticks: readonly {
    readonly position: number; // 0-1 along axis
    readonly label: string;
    readonly value: number;
  }[];

  /** Axis label */
  readonly axisLabel: string;

  /** Stroke properties */
  readonly stroke: {
    readonly color: { h: number; s: number; l: number; a: number };
    readonly width: number;
  };
}

// =============================================================================
// Scene Node Union
// =============================================================================

export type SceneNode = PointNode | PathNode | GroupNode | TextNode | AxisNode;

export type NodeType = SceneNode['type'];

// =============================================================================
// Node Factory Functions
// =============================================================================

/**
 * Create a point/glyph node.
 */
export function createPointNode(params: {
  id: NodeId;
  label: string;
  layer: string;
  x: number;
  y: number;
  z?: number;
  shape?: PointNode['shape'];
  radius?: number;
  fill?: Partial<PointNode['fill']>;
  stroke?: Partial<PointNode['stroke']>;
  jitter?: PointNode['jitter'];
  bindings?: readonly VariableBinding[];
  visible?: boolean;
  parent?: NodeId;
  meta?: Record<string, unknown>;
}): PointNode {
  return {
    type: 'point',
    id: params.id,
    label: params.label,
    layer: params.layer,
    x: params.x,
    y: params.y,
    z: params.z,
    shape: params.shape ?? 'circle',
    radius: params.radius ?? 10,
    fill: {
      h: params.fill?.h ?? 200,
      s: params.fill?.s ?? 0.7,
      l: params.fill?.l ?? 0.5,
      a: params.fill?.a ?? 1,
    },
    stroke: {
      color: params.stroke?.color ?? { h: 0, s: 0, l: 0.2, a: 1 },
      width: params.stroke?.width ?? 1,
      dash: params.stroke?.dash,
    },
    jitter: params.jitter,
    bindings: params.bindings ?? [],
    visible: params.visible ?? true,
    parent: params.parent,
    meta: params.meta,
  };
}

/**
 * Create a path node.
 */
export function createPathNode(params: {
  id: NodeId;
  label: string;
  layer: string;
  points: readonly { x: number; y: number; z?: number }[];
  closed?: boolean;
  stroke?: Partial<PathNode['stroke']>;
  fill?: PathNode['fill'];
  interpolation?: PathNode['interpolation'];
  bindings?: readonly VariableBinding[];
  visible?: boolean;
  parent?: NodeId;
  meta?: Record<string, unknown>;
}): PathNode {
  return {
    type: 'path',
    id: params.id,
    label: params.label,
    layer: params.layer,
    points: params.points,
    closed: params.closed ?? false,
    stroke: {
      color: params.stroke?.color ?? { h: 0, s: 0, l: 0.3, a: 1 },
      width: params.stroke?.width ?? 2,
      dash: params.stroke?.dash,
    },
    fill: params.fill,
    interpolation: params.interpolation ?? 'linear',
    bindings: params.bindings ?? [],
    visible: params.visible ?? true,
    parent: params.parent,
    meta: params.meta,
  };
}

/**
 * Create a group node.
 */
export function createGroupNode(params: {
  id: NodeId;
  label: string;
  layer: string;
  children?: readonly NodeId[];
  transform?: GroupNode['transform'];
  bindings?: readonly VariableBinding[];
  visible?: boolean;
  parent?: NodeId;
  meta?: Record<string, unknown>;
}): GroupNode {
  return {
    type: 'group',
    id: params.id,
    label: params.label,
    layer: params.layer,
    children: params.children ?? [],
    transform: params.transform,
    bindings: params.bindings ?? [],
    visible: params.visible ?? true,
    parent: params.parent,
    meta: params.meta,
  };
}

/**
 * Create a text node.
 */
export function createTextNode(params: {
  id: NodeId;
  label: string;
  layer: string;
  x: number;
  y: number;
  text: string;
  font?: Partial<TextNode['font']>;
  color?: Partial<TextNode['color']>;
  anchor?: TextNode['anchor'];
  bindings?: readonly VariableBinding[];
  visible?: boolean;
  parent?: NodeId;
  meta?: Record<string, unknown>;
}): TextNode {
  return {
    type: 'text',
    id: params.id,
    label: params.label,
    layer: params.layer,
    x: params.x,
    y: params.y,
    text: params.text,
    font: {
      family: params.font?.family ?? 'sans-serif',
      size: params.font?.size ?? 12,
      weight: params.font?.weight ?? 'normal',
    },
    color: {
      h: params.color?.h ?? 0,
      s: params.color?.s ?? 0,
      l: params.color?.l ?? 0.2,
      a: params.color?.a ?? 1,
    },
    anchor: params.anchor ?? 'start',
    bindings: params.bindings ?? [],
    visible: params.visible ?? true,
    parent: params.parent,
    meta: params.meta,
  };
}

/**
 * Create an axis node.
 */
export function createAxisNode(params: {
  id: NodeId;
  label: string;
  layer: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  ticks: readonly { position: number; label: string; value: number }[];
  axisLabel: string;
  stroke?: Partial<AxisNode['stroke']>;
  bindings?: readonly VariableBinding[];
  visible?: boolean;
  parent?: NodeId;
  meta?: Record<string, unknown>;
}): AxisNode {
  return {
    type: 'axis',
    id: params.id,
    label: params.label,
    layer: params.layer,
    start: params.start,
    end: params.end,
    ticks: params.ticks,
    axisLabel: params.axisLabel,
    stroke: {
      color: params.stroke?.color ?? { h: 0, s: 0, l: 0.3, a: 1 },
      width: params.stroke?.width ?? 1,
    },
    bindings: params.bindings ?? [],
    visible: params.visible ?? true,
    parent: params.parent,
    meta: params.meta,
  };
}
