/**
 * VectorCaliper - Scene Graph Tests
 *
 * Tests:
 * 1. Node creation with stable IDs
 * 2. Scene graph operations (add, get, remove)
 * 3. Layer management
 * 4. Serialization
 * 5. Scene building from states
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNodeId,
  createPointNode,
  createPathNode,
  createGroupNode,
  createTextNode,
  Scene,
  SceneBuilder,
  type NodeId,
} from '../src/scene';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';

describe('Node ID', () => {
  it('creates deterministic IDs', () => {
    const id1 = createNodeId('state', 'abc', 123);
    const id2 = createNodeId('state', 'abc', 123);

    expect(id1.value).toBe(id2.value);
    expect(id1.namespace).toBe('state');
  });

  it('different parts create different IDs', () => {
    const id1 = createNodeId('state', 'abc');
    const id2 = createNodeId('state', 'xyz');

    expect(id1.value).not.toBe(id2.value);
  });
});

describe('Node Factories', () => {
  describe('createPointNode', () => {
    it('creates point with defaults', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test Point',
        layer: 'states',
        x: 10,
        y: 20,
      });

      expect(node.type).toBe('point');
      expect(node.x).toBe(10);
      expect(node.y).toBe(20);
      expect(node.shape).toBe('circle');
      expect(node.radius).toBe(10);
      expect(node.visible).toBe(true);
    });

    it('accepts custom properties', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Custom Point',
        layer: 'custom',
        x: 10,
        y: 20,
        z: 30,
        shape: 'diamond',
        radius: 25,
        fill: { h: 100, s: 0.5, l: 0.6, a: 0.8 },
        visible: false,
      });

      expect(node.z).toBe(30);
      expect(node.shape).toBe('diamond');
      expect(node.radius).toBe(25);
      expect(node.fill.h).toBe(100);
      expect(node.visible).toBe(false);
    });

    it('includes jitter when specified', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Jittery Point',
        layer: 'states',
        x: 0,
        y: 0,
        jitter: { amplitude: 5, frequency: 0.5 },
      });

      expect(node.jitter).toBeDefined();
      expect(node.jitter!.amplitude).toBe(5);
      expect(node.jitter!.frequency).toBe(0.5);
    });
  });

  describe('createPathNode', () => {
    it('creates path with points', () => {
      const node = createPathNode({
        id: createNodeId('trajectory', 'test'),
        label: 'Test Path',
        layer: 'trajectories',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 5 },
        ],
      });

      expect(node.type).toBe('path');
      expect(node.points.length).toBe(3);
      expect(node.closed).toBe(false);
      expect(node.interpolation).toBe('linear');
    });
  });

  describe('createGroupNode', () => {
    it('creates group with children', () => {
      const childId = createNodeId('state', 'child');
      const node = createGroupNode({
        id: createNodeId('group', 'test'),
        label: 'Test Group',
        layer: 'groups',
        children: [childId],
      });

      expect(node.type).toBe('group');
      expect(node.children.length).toBe(1);
      expect(node.children[0]).toBe(childId);
    });
  });
});

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene('test');
  });

  describe('Node Management', () => {
    it('adds and retrieves nodes', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test',
        layer: 'states',
        x: 0,
        y: 0,
      });

      scene.addNode(node);

      expect(scene.hasNode(node.id)).toBe(true);
      expect(scene.getNode(node.id)).toBe(node);
      expect(scene.size).toBe(1);
    });

    it('retrieves node by string ID', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test',
        layer: 'states',
        x: 0,
        y: 0,
      });

      scene.addNode(node);

      expect(scene.getNode('state:test')).toBe(node);
    });

    it('throws on duplicate ID', () => {
      const node1 = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test 1',
        layer: 'states',
        x: 0,
        y: 0,
      });

      const node2 = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test 2',
        layer: 'states',
        x: 10,
        y: 10,
      });

      scene.addNode(node1);
      expect(() => scene.addNode(node2)).toThrow();
    });

    it('removes nodes', () => {
      const node = createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test',
        layer: 'states',
        x: 0,
        y: 0,
      });

      scene.addNode(node);
      expect(scene.removeNode(node.id)).toBe(true);
      expect(scene.hasNode(node.id)).toBe(false);
      expect(scene.size).toBe(0);
    });

    it('returns false when removing non-existent node', () => {
      expect(scene.removeNode('nonexistent')).toBe(false);
    });
  });

  describe('Type Queries', () => {
    it('filters nodes by type', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'Point 1',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      scene.addNode(
        createPointNode({
          id: createNodeId('state', '2'),
          label: 'Point 2',
          layer: 'states',
          x: 10,
          y: 10,
        })
      );

      scene.addNode(
        createPathNode({
          id: createNodeId('trajectory', '1'),
          label: 'Path 1',
          layer: 'trajectories',
          points: [{ x: 0, y: 0 }],
        })
      );

      const points = scene.getNodesByType('point');
      const paths = scene.getNodesByType('path');

      expect(points.length).toBe(2);
      expect(paths.length).toBe(1);
    });
  });

  describe('Layer Management', () => {
    it('tracks nodes by layer', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'State 1',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      scene.addNode(
        createPointNode({
          id: createNodeId('state', '2'),
          label: 'State 2',
          layer: 'states',
          x: 10,
          y: 10,
        })
      );

      scene.addNode(
        createPathNode({
          id: createNodeId('trajectory', '1'),
          label: 'Trajectory',
          layer: 'trajectories',
          points: [],
        })
      );

      expect(scene.getLayers()).toContain('states');
      expect(scene.getLayers()).toContain('trajectories');

      const stateNodes = scene.getNodesInLayer('states');
      expect(stateNodes.length).toBe(2);
    });

    it('sets layer visibility', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'State 1',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      scene.setLayerVisibility('states', false);

      const node = scene.getNode('state:1');
      expect(node?.visible).toBe(false);
    });
  });

  describe('Hierarchy', () => {
    it('tracks root nodes', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'Root Node',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const roots = scene.getRootNodes();
      expect(roots.length).toBe(1);
    });

    it('does not include parented nodes in roots', () => {
      const parentId = createNodeId('group', 'parent');

      scene.addNode(
        createGroupNode({
          id: parentId,
          label: 'Parent',
          layer: 'groups',
        })
      );

      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'child'),
          label: 'Child',
          layer: 'states',
          x: 0,
          y: 0,
          parent: parentId,
        })
      );

      const roots = scene.getRootNodes();
      expect(roots.length).toBe(1);
      expect(roots[0]!.id.value).toBe('group:parent');
    });
  });

  describe('Bounds', () => {
    it('computes bounds from point nodes', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'Point 1',
          layer: 'states',
          x: -10,
          y: 5,
          radius: 5,
        })
      );

      scene.addNode(
        createPointNode({
          id: createNodeId('state', '2'),
          label: 'Point 2',
          layer: 'states',
          x: 20,
          y: 30,
          radius: 10,
        })
      );

      const bounds = scene.computeBounds();

      expect(bounds.minX).toBe(-15); // -10 - 5
      expect(bounds.maxX).toBe(30); // 20 + 10
      expect(bounds.minY).toBe(0); // 5 - 5
      expect(bounds.maxY).toBe(40); // 30 + 10
    });
  });

  describe('Serialization', () => {
    it('exports to graph structure', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const graph = scene.toGraph();

      expect(graph.metadata.source).toBe('test');
      expect(graph.nodes.size).toBe(1);
      expect(graph.rootNodes.length).toBe(1);
    });

    it('exports to JSON-serializable object', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', '1'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const json = scene.toJSON();

      expect(() => JSON.stringify(json)).not.toThrow();
    });
  });
});

describe('SceneBuilder', () => {
  let builder: SceneBuilder;
  let mapper: SemanticMapper;
  let projector: ProjectionEngine;

  beforeEach(() => {
    mapper = new SemanticMapper();
    builder = new SceneBuilder(mapper);
    projector = new ProjectionEngine();
  });

  const createTestState = (id: string, time: number) =>
    createModelState({
      id,
      time,
      geometry: {
        effectiveDimension: 2.0 + time,
        anisotropy: 1.5,
        spread: 3.0,
        density: 0.6,
      },
      uncertainty: {
        entropy: 1.0 + time * 0.1,
        margin: 0.5,
        calibration: 0.1,
      },
      performance: {
        accuracy: 0.8 + time * 0.01,
        loss: 0.2 - time * 0.01,
      },
    });

  it('adds state as point node', () => {
    const state = createTestState('state-1', 0);
    projector.fit([state]);
    const projected = projector.project(state);

    const node = builder.addState(state, projected);

    expect(node.type).toBe('point');
    expect(node.id.namespace).toBe('state');
    expect(node.layer).toBe('states');
    expect(node.meta?.stateId).toBe('state-1');
  });

  it('includes variable bindings', () => {
    const state = createTestState('state-1', 0);
    projector.fit([state]);
    const projected = projector.project(state);

    const node = builder.addState(state, projected);

    expect(node.bindings.length).toBeGreaterThan(0);

    // Check that bindings have proper structure
    for (const binding of node.bindings) {
      expect(binding.channel).toBeDefined();
      expect(binding.semantic).toBeDefined();
      expect(binding.resolved).toBeDefined();
    }
  });

  it('adds multiple states', () => {
    const states = [
      createTestState('state-1', 0),
      createTestState('state-2', 1),
      createTestState('state-3', 2),
    ];

    projector.fit(states);
    const projections = projector.projectBatch(states);

    const nodes = builder.addStates(states, projections);

    expect(nodes.length).toBe(3);

    const scene = builder.getScene();
    expect(scene.size).toBe(3);
  });

  it('adds trajectory connecting states', () => {
    const states = [
      createTestState('state-1', 0),
      createTestState('state-2', 1),
      createTestState('state-3', 2),
    ];

    projector.fit(states);
    const projections = projector.projectBatch(states);

    builder.addStates(states, projections);
    const trajectoryNode = builder.addTrajectory(states, projections);

    expect(trajectoryNode.type).toBe('path');
    expect(trajectoryNode.points.length).toBe(3);
    expect(trajectoryNode.layer).toBe('trajectories');

    const scene = builder.getScene();
    expect(scene.size).toBe(4); // 3 states + 1 trajectory
  });

  it('uses projected coordinates for position', () => {
    const state = createTestState('state-1', 0);
    projector.fit([state]);
    const projected = projector.project(state);

    const node = builder.addState(state, projected);

    expect(node.x).toBe(projected.position.x);
    expect(node.y).toBe(projected.position.y);
  });

  it('maps semantic channels to visual properties', () => {
    const state = createModelState({
      id: 'test',
      time: 0,
      geometry: {
        effectiveDimension: 5.0,
        anisotropy: 1.0,
        spread: 5.0,
        density: 0.5,
      },
      uncertainty: {
        entropy: 2.0, // Should affect jitter
        margin: 0.8, // Should affect saturation
        calibration: 0.05, // Should affect opacity
      },
      performance: {
        accuracy: 0.95, // Should affect lightness
        loss: 0.05,
      },
    });

    projector.fit([state]);
    const projected = projector.project(state);
    const node = builder.addState(state, projected);

    // High margin → high saturation
    expect(node.fill.s).toBeGreaterThan(0.5);

    // Low calibration error → high opacity
    expect(node.fill.a).toBeGreaterThan(0.8);

    // High accuracy → high lightness
    expect(node.fill.l).toBeGreaterThan(0.5);

    // High entropy → jitter present
    expect(node.jitter).toBeDefined();
    expect(node.jitter!.amplitude).toBeGreaterThan(0);
  });
});
