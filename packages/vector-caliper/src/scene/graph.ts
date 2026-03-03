/**
 * VectorCaliper - Scene Graph
 *
 * A semantic scene graph where every node has:
 * - A stable, unique ID
 * - Variable bindings (what it encodes)
 * - Layer membership
 *
 * INVARIANT: Scene graph can be serialized without loss.
 * INVARIANT: No rendering assumptions in the graph.
 */

import type {
  SceneNode,
  NodeId,
  PointNode,
  PathNode,
  GroupNode,
  TextNode,
  AxisNode,
} from './node';
import {
  createNodeId,
  createPointNode,
  createPathNode,
  createGroupNode,
} from './node';
import type { ModelState, ProjectedState } from '../types/state';
import type { SemanticMapper } from '../mapping/semantic-map';
import type { VisualChannel } from '../mapping/channels';
import type { VariableBinding } from './node';

// =============================================================================
// Scene Graph
// =============================================================================

/**
 * Metadata about the scene.
 */
export interface SceneMetadata {
  readonly createdAt: number;
  readonly version: string;
  readonly source: string;
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
  };
}

/**
 * The complete scene graph.
 */
export interface SceneGraph {
  readonly metadata: SceneMetadata;
  readonly nodes: ReadonlyMap<string, SceneNode>;
  readonly layers: ReadonlyMap<string, Set<string>>; // layer -> node IDs
  readonly rootNodes: readonly string[]; // Nodes with no parent
}

/**
 * Scene graph builder/manager.
 */
export class Scene {
  private nodes: Map<string, SceneNode> = new Map();
  private layers: Map<string, Set<string>> = new Map();
  private rootNodes: Set<string> = new Set();
  private metadata: SceneMetadata;

  constructor(source: string = 'VectorCaliper') {
    this.metadata = {
      createdAt: Date.now(),
      version: '1.0.0',
      source,
      bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    };
  }

  // ---------------------------------------------------------------------------
  // Node Management
  // ---------------------------------------------------------------------------

  /**
   * Add a node to the scene.
   */
  addNode(node: SceneNode): void {
    const idStr = node.id.value;

    if (this.nodes.has(idStr)) {
      throw new Error(`Node with ID '${idStr}' already exists`);
    }

    this.nodes.set(idStr, node);

    // Track layer membership
    if (!this.layers.has(node.layer)) {
      this.layers.set(node.layer, new Set());
    }
    this.layers.get(node.layer)!.add(idStr);

    // Track root nodes
    if (!node.parent) {
      this.rootNodes.add(idStr);
    }
  }

  /**
   * Get a node by ID.
   */
  getNode(id: NodeId | string): SceneNode | undefined {
    const idStr = typeof id === 'string' ? id : id.value;
    return this.nodes.get(idStr);
  }

  /**
   * Check if a node exists.
   */
  hasNode(id: NodeId | string): boolean {
    const idStr = typeof id === 'string' ? id : id.value;
    return this.nodes.has(idStr);
  }

  /**
   * Remove a node by ID.
   */
  removeNode(id: NodeId | string): boolean {
    const idStr = typeof id === 'string' ? id : id.value;
    const node = this.nodes.get(idStr);

    if (!node) return false;

    // Remove from layer
    this.layers.get(node.layer)?.delete(idStr);

    // Remove from root nodes
    this.rootNodes.delete(idStr);

    // Remove node
    this.nodes.delete(idStr);

    return true;
  }

  /**
   * Get all nodes.
   */
  getAllNodes(): readonly SceneNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all nodes (alias for getAllNodes).
   */
  getNodes(): readonly SceneNode[] {
    return this.getAllNodes();
  }

  /**
   * Update a node in place.
   * INVARIANT: Only modifies node properties, preserves ID and layer membership.
   */
  updateNode(id: NodeId | string, updated: SceneNode): void {
    const idStr = typeof id === 'string' ? id : id.value;
    const existing = this.nodes.get(idStr);

    if (!existing) {
      throw new Error(`Cannot update non-existent node: ${idStr}`);
    }

    // Ensure ID matches
    if (updated.id.value !== idStr) {
      throw new Error(`Cannot change node ID during update`);
    }

    // If layer changed, update layer membership
    if (existing.layer !== updated.layer) {
      this.layers.get(existing.layer)?.delete(idStr);
      if (!this.layers.has(updated.layer)) {
        this.layers.set(updated.layer, new Set());
      }
      this.layers.get(updated.layer)!.add(idStr);
    }

    this.nodes.set(idStr, updated);
  }

  /**
   * Get nodes by type.
   */
  getNodesByType<T extends SceneNode['type']>(
    type: T
  ): readonly Extract<SceneNode, { type: T }>[] {
    return Array.from(this.nodes.values()).filter(
      (n): n is Extract<SceneNode, { type: T }> => n.type === type
    );
  }

  // ---------------------------------------------------------------------------
  // Layer Management
  // ---------------------------------------------------------------------------

  /**
   * Get all nodes in a layer.
   */
  getNodesInLayer(layer: string): readonly SceneNode[] {
    const nodeIds = this.layers.get(layer);
    if (!nodeIds) return [];

    return Array.from(nodeIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is SceneNode => n !== undefined);
  }

  /**
   * Get all layer names.
   */
  getLayers(): readonly string[] {
    return Array.from(this.layers.keys());
  }

  /**
   * Set visibility for all nodes in a layer.
   */
  setLayerVisibility(layer: string, visible: boolean): void {
    const nodeIds = this.layers.get(layer);
    if (!nodeIds) return;

    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (node) {
        // Create new node with updated visibility
        this.nodes.set(id, { ...node, visible });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Hierarchy
  // ---------------------------------------------------------------------------

  /**
   * Get root nodes (nodes with no parent).
   */
  getRootNodes(): readonly SceneNode[] {
    return Array.from(this.rootNodes)
      .map((id) => this.nodes.get(id))
      .filter((n): n is SceneNode => n !== undefined);
  }

  /**
   * Get children of a group node.
   */
  getChildren(groupId: NodeId | string): readonly SceneNode[] {
    const idStr = typeof groupId === 'string' ? groupId : groupId.value;
    const node = this.nodes.get(idStr);

    if (!node || node.type !== 'group') return [];

    return (node as GroupNode).children
      .map((childId) => this.nodes.get(childId.value))
      .filter((n): n is SceneNode => n !== undefined);
  }

  // ---------------------------------------------------------------------------
  // Bounds
  // ---------------------------------------------------------------------------

  /**
   * Compute bounds from all point nodes.
   */
  computeBounds(): SceneMetadata['bounds'] {
    const points = this.getNodesByType('point');

    if (points.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x - point.radius);
      maxX = Math.max(maxX, point.x + point.radius);
      minY = Math.min(minY, point.y - point.radius);
      maxY = Math.max(maxY, point.y + point.radius);
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Update metadata bounds.
   */
  updateBounds(): void {
    const bounds = this.computeBounds();
    this.metadata = { ...this.metadata, bounds };
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Export the scene graph as a serializable object.
   */
  toGraph(): SceneGraph {
    return {
      metadata: this.metadata,
      nodes: new Map(this.nodes),
      layers: new Map(
        Array.from(this.layers.entries()).map(([k, v]) => [k, new Set(v)])
      ),
      rootNodes: Array.from(this.rootNodes),
    };
  }

  /**
   * Export as JSON-serializable object.
   */
  toJSON(): object {
    return {
      metadata: this.metadata,
      nodes: Array.from(this.nodes.entries()),
      layers: Array.from(this.layers.entries()).map(([k, v]) => [k, Array.from(v)]),
      rootNodes: Array.from(this.rootNodes),
    };
  }

  /**
   * Get scene metadata.
   */
  getMetadata(): SceneMetadata {
    return this.metadata;
  }

  /**
   * Get node count.
   */
  get size(): number {
    return this.nodes.size;
  }

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  /**
   * Clear all nodes.
   */
  clear(): void {
    this.nodes.clear();
    this.layers.clear();
    this.rootNodes.clear();
  }
}

// =============================================================================
// Scene Builder (from State)
// =============================================================================

/**
 * Builds scene graph from model states using semantic mapping.
 */
export class SceneBuilder {
  private scene: Scene;
  private mapper: SemanticMapper;

  constructor(mapper: SemanticMapper, source: string = 'VectorCaliper') {
    this.scene = new Scene(source);
    this.mapper = mapper;
  }

  /**
   * Add a state as a point node.
   */
  addState(state: ModelState, projected: ProjectedState): PointNode {
    const channels = this.mapper.mapAll(state, projected);
    const bindings = this.createBindings(channels);

    // Extract visual properties from mapped channels
    const position = channels.get('position.x');
    const radiusCh = channels.get('derived.magnitude');
    const hueCh = channels.get('derived.dominantDimension');
    const satCh = channels.get('uncertainty.margin');
    const lightCh = channels.get('performance.accuracy');
    const opacityCh = channels.get('uncertainty.calibration');
    const jitterCh = channels.get('uncertainty.entropy');
    const strokeCh = channels.get('dynamics.stability');

    const node = createPointNode({
      id: createNodeId('state', state.id),
      label: `State ${state.id}`,
      layer: 'states',
      x: projected.position.x,
      y: projected.position.y,
      z: projected.position.z,
      radius: radiusCh?.type === 'radius' ? radiusCh.value : 10,
      fill: {
        h: hueCh?.type === 'hue' ? hueCh.degrees : 200,
        s: satCh?.type === 'saturation' ? satCh.value : 0.7,
        l: lightCh?.type === 'lightness' ? lightCh.value : 0.5,
        a: opacityCh?.type === 'opacity' ? opacityCh.value : 1,
      },
      stroke: {
        color: { h: 0, s: 0, l: 0.2, a: 1 },
        width: strokeCh?.type === 'strokeWidth' ? strokeCh.value : 2,
      },
      jitter:
        jitterCh?.type === 'jitter'
          ? { amplitude: jitterCh.amplitude, frequency: jitterCh.frequency }
          : undefined,
      bindings,
      meta: {
        stateId: state.id,
        time: state.time.value,
      },
    });

    this.scene.addNode(node);
    return node;
  }

  /**
   * Add multiple states.
   */
  addStates(
    states: ModelState[],
    projections: ProjectedState[]
  ): readonly PointNode[] {
    return states.map((state, i) => this.addState(state, projections[i]!));
  }

  /**
   * Add a trajectory connecting states.
   */
  addTrajectory(
    states: ModelState[],
    projections: ProjectedState[],
    id: string = 'trajectory'
  ): PathNode {
    const points = projections.map((p) => ({
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
    }));

    const node = createPathNode({
      id: createNodeId('trajectory', id),
      label: `Trajectory ${id}`,
      layer: 'trajectories',
      points,
      interpolation: 'catmull-rom',
      stroke: {
        color: { h: 0, s: 0, l: 0.4, a: 0.6 },
        width: 2,
      },
      meta: {
        stateIds: states.map((s) => s.id),
        timeRange: {
          start: states[0]?.time.value,
          end: states[states.length - 1]?.time.value,
        },
      },
    });

    this.scene.addNode(node);
    return node;
  }

  /**
   * Add a simple path from points.
   * Used for trajectory visualization.
   */
  addTrajectoryPath(
    id: string,
    points: Array<{ x: number; y: number }>,
    interpolation: 'linear' | 'catmull-rom' = 'linear'
  ): PathNode {
    const node = createPathNode({
      id: createNodeId('trajectory', id),
      label: `Path ${id}`,
      layer: 'trajectories',
      points: points.map((p) => ({ x: p.x, y: p.y })),
      interpolation,
      stroke: {
        color: { h: 0, s: 0, l: 0.4, a: 0.6 },
        width: 2,
      },
    });

    this.scene.addNode(node);
    return node;
  }

  /**
   * Create variable bindings from mapped channels.
   */
  private createBindings(
    channels: Map<string, VisualChannel>
  ): readonly VariableBinding[] {
    const bindings: VariableBinding[] = [];

    for (const [semantic, channel] of channels) {
      bindings.push({
        channel: channel.type,
        semantic: semantic as any,
        resolved: channel,
      });
    }

    return bindings;
  }

  /**
   * Get the built scene.
   */
  getScene(): Scene {
    this.scene.updateBounds();
    return this.scene;
  }

  /**
   * Clear and start fresh.
   */
  reset(): void {
    this.scene.clear();
  }
}
