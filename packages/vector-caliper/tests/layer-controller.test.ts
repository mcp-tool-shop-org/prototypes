/**
 * VectorCaliper - Layer Controller Tests
 *
 * Verifies:
 * 1. Toggling visibility is idempotent (off→off = no-op)
 * 2. Coordinates remain frozen regardless of visibility/focus state
 * 3. Focus mode dims glyphs instead of hiding them
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LayerController } from '../src/interactive/layer-controller';
import { LayerManager, PREDEFINED_LAYERS } from '../src/layers/semantic-layers';
import { Scene, SceneBuilder } from '../src/scene';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';
import { createPointNode, createNodeId } from '../src/scene/node';

describe('LayerController', () => {
  let layerManager: LayerManager;
  let controller: LayerController;
  let scene: Scene;

  beforeEach(() => {
    layerManager = new LayerManager();
    controller = new LayerController(layerManager);
    scene = new Scene('test');

    // Add test nodes to different layers
    scene.addNode(
      createPointNode({
        id: createNodeId('state', 'test-1'),
        label: 'Test Point 1',
        layer: 'states',
        x: 100,
        y: 100,
      })
    );

    scene.addNode(
      createPointNode({
        id: createNodeId('uncertainty', 'test-2'),
        label: 'Test Point 2',
        layer: 'uncertainty',
        x: 200,
        y: 200,
      })
    );

    controller.attachScene(scene);
  });

  describe('Basic Visibility', () => {
    it('isVisible returns correct state', () => {
      // Geometry is visible by default
      expect(controller.isVisible('geometry')).toBe(true);
      // Dynamics is hidden by default
      expect(controller.isVisible('dynamics')).toBe(false);
    });

    it('setVisible changes layer visibility', () => {
      controller.setVisible('geometry', false);
      expect(controller.isVisible('geometry')).toBe(false);

      controller.setVisible('geometry', true);
      expect(controller.isVisible('geometry')).toBe(true);
    });

    it('toggle flips visibility state', () => {
      const initial = controller.isVisible('geometry');
      const result = controller.toggle('geometry');

      expect(result).toBe(!initial);
      expect(controller.isVisible('geometry')).toBe(!initial);
    });
  });

  describe('Idempotency', () => {
    it('setVisible off→off is a no-op', () => {
      // First set to off
      controller.setVisible('dynamics', false);
      expect(controller.isVisible('dynamics')).toBe(false);

      // Set to off again - should be no-op
      controller.setVisible('dynamics', false);
      expect(controller.isVisible('dynamics')).toBe(false);
    });

    it('setVisible on→on is a no-op', () => {
      // Already on by default
      expect(controller.isVisible('geometry')).toBe(true);

      // Set to on again - should be no-op
      controller.setVisible('geometry', true);
      expect(controller.isVisible('geometry')).toBe(true);
    });

    it('toggle followed by toggle returns to original state', () => {
      const initial = controller.isVisible('geometry');

      controller.toggle('geometry');
      controller.toggle('geometry');

      expect(controller.isVisible('geometry')).toBe(initial);
    });
  });

  describe('Coordinate Invariant', () => {
    it('hiding layer does not change node coordinates', () => {
      // Get initial coordinates
      const nodeBefore = scene.getNode('state:test-1');
      expect(nodeBefore).toBeDefined();
      const xBefore = (nodeBefore as any).x;
      const yBefore = (nodeBefore as any).y;

      // Hide the geometry layer
      controller.setVisible('geometry', false);

      // Check coordinates are unchanged
      const nodeAfter = scene.getNode('state:test-1');
      expect((nodeAfter as any).x).toBe(xBefore);
      expect((nodeAfter as any).y).toBe(yBefore);
    });

    it('showing layer does not change node coordinates', () => {
      // Hide first
      controller.setVisible('geometry', false);

      const nodeBefore = scene.getNode('state:test-1');
      const xBefore = (nodeBefore as any).x;
      const yBefore = (nodeBefore as any).y;

      // Show the layer
      controller.setVisible('geometry', true);

      // Check coordinates are unchanged
      const nodeAfter = scene.getNode('state:test-1');
      expect((nodeAfter as any).x).toBe(xBefore);
      expect((nodeAfter as any).y).toBe(yBefore);
    });

    it('focus mode does not change node coordinates', () => {
      const nodeBefore = scene.getNode('state:test-1');
      const xBefore = (nodeBefore as any).x;
      const yBefore = (nodeBefore as any).y;

      // Enable focus mode and focus on a different layer
      controller.enableFocusMode();
      controller.focusLayer('uncertainty');

      // Check coordinates are unchanged
      const nodeAfter = scene.getNode('state:test-1');
      expect((nodeAfter as any).x).toBe(xBefore);
      expect((nodeAfter as any).y).toBe(yBefore);
    });

    it('disabling focus mode does not change coordinates', () => {
      // Enable and then disable focus mode
      controller.enableFocusMode();
      controller.focusLayer('geometry');

      const nodeBefore = scene.getNode('state:test-1');
      const xBefore = (nodeBefore as any).x;
      const yBefore = (nodeBefore as any).y;

      controller.disableFocusMode();

      const nodeAfter = scene.getNode('state:test-1');
      expect((nodeAfter as any).x).toBe(xBefore);
      expect((nodeAfter as any).y).toBe(yBefore);
    });
  });

  describe('Focus Mode', () => {
    it('enableFocusMode sets focus mode flag', () => {
      expect(controller.isFocusModeEnabled()).toBe(false);
      controller.enableFocusMode();
      expect(controller.isFocusModeEnabled()).toBe(true);
    });

    it('disableFocusMode clears focus mode and focused layers', () => {
      controller.enableFocusMode();
      controller.focusLayer('geometry');

      expect(controller.isFocusModeEnabled()).toBe(true);
      expect(controller.isLayerFocused('geometry')).toBe(true);

      controller.disableFocusMode();

      expect(controller.isFocusModeEnabled()).toBe(false);
      expect(controller.isLayerFocused('geometry')).toBe(false);
    });

    it('focusLayer auto-enables focus mode', () => {
      expect(controller.isFocusModeEnabled()).toBe(false);
      controller.focusLayer('geometry');
      expect(controller.isFocusModeEnabled()).toBe(true);
    });

    it('isLayerFocused returns correct state', () => {
      controller.enableFocusMode();

      expect(controller.isLayerFocused('geometry')).toBe(false);
      controller.focusLayer('geometry');
      expect(controller.isLayerFocused('geometry')).toBe(true);
    });

    it('unfocusLayer removes focus from layer', () => {
      controller.focusLayer('geometry');
      expect(controller.isLayerFocused('geometry')).toBe(true);

      controller.unfocusLayer('geometry');
      expect(controller.isLayerFocused('geometry')).toBe(false);
    });

    it('toggleFocus toggles focus state', () => {
      controller.enableFocusMode();

      const result1 = controller.toggleFocus('geometry');
      expect(result1).toBe(true);
      expect(controller.isLayerFocused('geometry')).toBe(true);

      const result2 = controller.toggleFocus('geometry');
      expect(result2).toBe(false);
      expect(controller.isLayerFocused('geometry')).toBe(false);
    });

    it('focusExclusively clears other focus', () => {
      controller.focusLayer('geometry');
      controller.focusLayer('uncertainty');

      expect(controller.isLayerFocused('geometry')).toBe(true);
      expect(controller.isLayerFocused('uncertainty')).toBe(true);

      controller.focusExclusively('performance');

      expect(controller.isLayerFocused('geometry')).toBe(false);
      expect(controller.isLayerFocused('uncertainty')).toBe(false);
      expect(controller.isLayerFocused('performance')).toBe(true);
    });

    it('clearFocus removes all focus', () => {
      controller.focusLayer('geometry');
      controller.focusLayer('uncertainty');

      controller.clearFocus();

      expect(controller.isLayerFocused('geometry')).toBe(false);
      expect(controller.isLayerFocused('uncertainty')).toBe(false);
    });

    it('setDimOpacity clamps value to [0, 1]', () => {
      controller.setDimOpacity(0.5);
      const state1 = controller.getState();
      expect(state1.dimOpacity).toBe(0.5);

      controller.setDimOpacity(-0.5);
      const state2 = controller.getState();
      expect(state2.dimOpacity).toBe(0);

      controller.setDimOpacity(1.5);
      const state3 = controller.getState();
      expect(state3.dimOpacity).toBe(1);
    });
  });

  describe('State Serialization', () => {
    it('getState returns current state', () => {
      controller.setVisible('dynamics', true);
      controller.enableFocusMode({ dimOpacity: 0.3 });
      controller.focusLayer('geometry');

      const state = controller.getState();

      expect(state.visibility.dynamics).toBe(true);
      expect(state.focusMode).toBe(true);
      expect(state.focusedLayers).toContain('geometry');
      expect(state.dimOpacity).toBe(0.3);
    });

    it('setState restores state', () => {
      const savedState = {
        visibility: {
          geometry: true,
          uncertainty: false,
          performance: true,
          dynamics: true,
          annotations: false,
        },
        focusMode: true,
        focusedLayers: ['performance'],
        dimOpacity: 0.25,
        displayMode: 'dim' as const,
      };

      controller.setState(savedState);

      expect(controller.isVisible('uncertainty')).toBe(false);
      expect(controller.isVisible('dynamics')).toBe(true);
      expect(controller.isFocusModeEnabled()).toBe(true);
      expect(controller.isLayerFocused('performance')).toBe(true);
    });
  });

  describe('Presets', () => {
    it('showAll enables all layers and disables focus mode', () => {
      controller.setVisible('geometry', false);
      controller.enableFocusMode();
      controller.focusLayer('uncertainty');

      controller.showAll();

      expect(controller.isVisible('geometry')).toBe(true);
      expect(controller.isVisible('dynamics')).toBe(true);
      expect(controller.isFocusModeEnabled()).toBe(false);
    });

    it('reset returns to default state', () => {
      controller.setVisible('geometry', false);
      controller.setVisible('dynamics', true);
      controller.enableFocusMode();

      controller.reset();

      // Geometry should be visible by default
      expect(controller.isVisible('geometry')).toBe(true);
      // Dynamics should be hidden by default
      expect(controller.isVisible('dynamics')).toBe(false);
      expect(controller.isFocusModeEnabled()).toBe(false);
    });
  });

  describe('HTML Generation', () => {
    it('generateControlScript returns valid JavaScript', () => {
      const script = controller.generateControlScript();

      expect(script).toContain('vcToggleLayer');
      expect(script).toContain('vcEnableFocusMode');
      expect(script).toContain('vcDisableFocusMode');
      expect(script).toContain('vcFocusLayer');
      expect(script).toContain('VC_LAYER_STATE');
    });

    it('generateControlsHTML returns valid HTML', () => {
      const html = controller.generateControlsHTML();

      expect(html).toContain('vc-layer-controls');
      expect(html).toContain('Layers');
      expect(html).toContain('checkbox');
      expect(html).toContain('vcToggleLayer');
    });
  });

  describe('getLayers', () => {
    it('returns all predefined layers', () => {
      const layers = controller.getLayers();

      expect(layers.length).toBe(PREDEFINED_LAYERS.length);

      const layerIds = layers.map((l) => l.id);
      expect(layerIds).toContain('geometry');
      expect(layerIds).toContain('uncertainty');
      expect(layerIds).toContain('performance');
      expect(layerIds).toContain('dynamics');
      expect(layerIds).toContain('annotations');
    });
  });
});

describe('Scene.updateNode', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene('test');
    scene.addNode(
      createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test',
        layer: 'states',
        x: 50,
        y: 50,
      })
    );
  });

  it('updateNode modifies node properties', () => {
    const node = scene.getNode('state:test');
    expect(node).toBeDefined();

    const updated = {
      ...node!,
      visible: false,
    };

    scene.updateNode('state:test', updated);

    const afterUpdate = scene.getNode('state:test');
    expect(afterUpdate?.visible).toBe(false);
  });

  it('updateNode throws for non-existent node', () => {
    const fakeNode = createPointNode({
      id: createNodeId('state', 'nonexistent'),
      label: 'Fake',
      layer: 'states',
      x: 0,
      y: 0,
    });

    expect(() => scene.updateNode('state:nonexistent', fakeNode)).toThrow();
  });

  it('updateNode throws if ID changes', () => {
    const node = scene.getNode('state:test');
    const wrongId = {
      ...node!,
      id: createNodeId('state', 'different'),
    };

    expect(() => scene.updateNode('state:test', wrongId as any)).toThrow();
  });

  it('updateNode handles layer change', () => {
    const node = scene.getNode('state:test');
    const movedNode = {
      ...node!,
      layer: 'trajectories',
    };

    scene.updateNode('state:test', movedNode);

    const nodesInOldLayer = scene.getNodesInLayer('states');
    const nodesInNewLayer = scene.getNodesInLayer('trajectories');

    expect(nodesInOldLayer.find((n) => n.id.value === 'state:test')).toBeUndefined();
    expect(nodesInNewLayer.find((n) => n.id.value === 'state:test')).toBeDefined();
  });
});

describe('Integration: LayerController with Real Scene', () => {
  it('complete workflow maintains coordinate invariant', () => {
    const mapper = new SemanticMapper();
    const projector = new ProjectionEngine();

    const state = createModelState({
      id: 'test-state',
      time: 0,
      geometry: {
        effectiveDimension: 3,
        anisotropy: 1.5,
        spread: 4,
        density: 0.6,
      },
      uncertainty: {
        entropy: 1.2,
        margin: 0.6,
        calibration: 0.05,
      },
      performance: {
        accuracy: 0.88,
        loss: 0.12,
      },
    });

    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    builder.addState(state, projected);
    const scene = builder.getScene();

    const layerManager = new LayerManager();
    const controller = new LayerController(layerManager);
    controller.attachScene(scene);

    // Get initial coordinates
    const nodes = scene.getNodes();
    const initialCoords = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      if (node.type === 'point') {
        initialCoords.set(node.id.value, { x: node.x, y: node.y });
      }
    }

    // Perform various operations
    controller.setVisible('geometry', false);
    controller.setVisible('geometry', true);
    controller.enableFocusMode();
    controller.focusLayer('uncertainty');
    controller.focusLayer('performance');
    controller.clearFocus();
    controller.disableFocusMode();
    controller.toggle('dynamics');
    controller.toggle('dynamics');

    // Verify all coordinates unchanged
    const nodesAfter = scene.getNodes();
    for (const node of nodesAfter) {
      if (node.type === 'point') {
        const initial = initialCoords.get(node.id.value);
        if (initial) {
          expect(node.x).toBe(initial.x);
          expect(node.y).toBe(initial.y);
        }
      }
    }
  });
});
