/**
 * VectorCaliper - Semantic Layers Tests
 *
 * Tests:
 * 1. Layer management (add, remove, get)
 * 2. Visibility control
 * 3. Scene integration
 * 4. Presets
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LayerManager,
  PREDEFINED_LAYERS,
  GEOMETRY_LAYER,
  UNCERTAINTY_LAYER,
  PERFORMANCE_LAYER,
  DYNAMICS_LAYER,
  VISIBILITY_PRESETS,
  type SemanticLayer,
} from '../src/layers';
import { Scene, createNodeId, createPointNode } from '../src/scene';

describe('LayerManager', () => {
  let manager: LayerManager;

  beforeEach(() => {
    manager = new LayerManager();
  });

  describe('Layer Registration', () => {
    it('initializes with predefined layers', () => {
      const layers = manager.getLayers();

      expect(layers.length).toBe(PREDEFINED_LAYERS.length);
      expect(layers.some((l) => l.id === 'geometry')).toBe(true);
      expect(layers.some((l) => l.id === 'uncertainty')).toBe(true);
      expect(layers.some((l) => l.id === 'performance')).toBe(true);
      expect(layers.some((l) => l.id === 'dynamics')).toBe(true);
    });

    it('getLayers returns sorted by order', () => {
      const layers = manager.getLayers();

      for (let i = 1; i < layers.length; i++) {
        expect(layers[i]!.order).toBeGreaterThanOrEqual(layers[i - 1]!.order);
      }
    });

    it('getLayer returns layer by ID', () => {
      const layer = manager.getLayer('geometry');

      expect(layer).toBeDefined();
      expect(layer!.id).toBe('geometry');
      expect(layer!.name).toBe('Geometry');
    });

    it('getLayer returns undefined for unknown ID', () => {
      expect(manager.getLayer('nonexistent')).toBeUndefined();
    });

    it('addLayer adds custom layer', () => {
      const custom: SemanticLayer = {
        id: 'custom',
        name: 'Custom Layer',
        description: 'A custom layer',
        variables: [],
        sceneLayerIds: ['custom'],
        defaultVisible: true,
        order: 5,
      };

      manager.addLayer(custom);

      expect(manager.getLayer('custom')).toBeDefined();
      expect(manager.getLayers().some((l) => l.id === 'custom')).toBe(true);
    });

    it('addLayer throws on duplicate ID', () => {
      const duplicate: SemanticLayer = {
        ...GEOMETRY_LAYER,
        name: 'Duplicate',
      };

      expect(() => manager.addLayer(duplicate)).toThrow();
    });

    it('removeLayer removes layer', () => {
      manager.removeLayer('geometry');

      expect(manager.getLayer('geometry')).toBeUndefined();
    });

    it('removeLayer returns false for unknown ID', () => {
      expect(manager.removeLayer('nonexistent')).toBe(false);
    });
  });

  describe('Visibility Control', () => {
    it('isVisible returns default visibility', () => {
      expect(manager.isVisible('geometry')).toBe(true);
      expect(manager.isVisible('dynamics')).toBe(false);
    });

    it('setVisible changes visibility', () => {
      manager.setVisible('geometry', false);
      expect(manager.isVisible('geometry')).toBe(false);

      manager.setVisible('dynamics', true);
      expect(manager.isVisible('dynamics')).toBe(true);
    });

    it('setVisible throws for unknown layer', () => {
      expect(() => manager.setVisible('nonexistent', true)).toThrow();
    });

    it('toggle toggles visibility', () => {
      expect(manager.isVisible('geometry')).toBe(true);

      const result1 = manager.toggle('geometry');
      expect(result1).toBe(false);
      expect(manager.isVisible('geometry')).toBe(false);

      const result2 = manager.toggle('geometry');
      expect(result2).toBe(true);
      expect(manager.isVisible('geometry')).toBe(true);
    });

    it('showAll makes all layers visible', () => {
      manager.setVisible('geometry', false);
      manager.setVisible('uncertainty', false);

      manager.showAll();

      for (const layer of manager.getLayers()) {
        expect(manager.isVisible(layer.id)).toBe(true);
      }
    });

    it('hideAll makes all layers invisible', () => {
      manager.hideAll();

      for (const layer of manager.getLayers()) {
        expect(manager.isVisible(layer.id)).toBe(false);
      }
    });

    it('resetToDefaults restores default visibility', () => {
      manager.showAll();
      expect(manager.isVisible('dynamics')).toBe(true);

      manager.resetToDefaults();
      expect(manager.isVisible('dynamics')).toBe(false);
      expect(manager.isVisible('geometry')).toBe(true);
    });
  });

  describe('Visibility State Serialization', () => {
    it('getVisibilityState returns current state', () => {
      manager.setVisible('geometry', false);
      manager.setVisible('dynamics', true);

      const state = manager.getVisibilityState();

      expect(state['geometry']).toBe(false);
      expect(state['dynamics']).toBe(true);
    });

    it('setVisibilityState restores state', () => {
      const state = {
        geometry: false,
        uncertainty: false,
        performance: true,
        dynamics: true,
        annotations: true,
      };

      manager.setVisibilityState(state);

      expect(manager.isVisible('geometry')).toBe(false);
      expect(manager.isVisible('uncertainty')).toBe(false);
      expect(manager.isVisible('performance')).toBe(true);
      expect(manager.isVisible('dynamics')).toBe(true);
    });

    it('setVisibilityState ignores unknown layers', () => {
      const state = {
        geometry: true,
        nonexistent: true,
      };

      expect(() => manager.setVisibilityState(state)).not.toThrow();
    });
  });

  describe('Scene Integration', () => {
    let scene: Scene;

    beforeEach(() => {
      scene = new Scene('test');

      // Add nodes to different scene layers
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
          layer: 'uncertainty',
          x: 10,
          y: 10,
        })
      );

      manager.attachScene(scene);
    });

    it('attachScene applies current visibility', () => {
      manager.setVisible('geometry', false);

      // Re-attach to apply
      manager.attachScene(scene);

      const statesNodes = scene.getNodesInLayer('states');
      expect(statesNodes[0]?.visible).toBe(false);
    });

    it('setVisible updates scene layer visibility', () => {
      manager.setVisible('uncertainty', false);

      const uncertaintyNodes = scene.getNodesInLayer('uncertainty');
      expect(uncertaintyNodes[0]?.visible).toBe(false);
    });

    it('detachScene stops scene updates', () => {
      manager.detachScene();
      manager.setVisible('geometry', false);

      // Should not throw, but also not update scene
      const statesNodes = scene.getNodesInLayer('states');
      expect(statesNodes[0]?.visible).toBe(true); // Unchanged
    });
  });

  describe('Variable Queries', () => {
    it('getLayerForVariable finds correct layer', () => {
      const layer = manager.getLayerForVariable('geometry.spread');
      expect(layer?.id).toBe('geometry');

      const layer2 = manager.getLayerForVariable('uncertainty.entropy');
      expect(layer2?.id).toBe('uncertainty');

      const layer3 = manager.getLayerForVariable('performance.accuracy');
      expect(layer3?.id).toBe('performance');
    });

    it('getLayerForVariable returns undefined for unknown variable', () => {
      // Cast to bypass type checking for test
      const layer = manager.getLayerForVariable('unknown.variable' as any);
      expect(layer).toBeUndefined();
    });

    it('getVisibleVariables returns variables from visible layers', () => {
      manager.hideAll();
      manager.setVisible('geometry', true);

      const visible = manager.getVisibleVariables();

      expect(visible).toContain('geometry.spread');
      expect(visible).toContain('position.x');
      expect(visible).not.toContain('uncertainty.entropy');
    });

    it('isVariableVisible checks layer visibility', () => {
      manager.setVisible('uncertainty', false);

      expect(manager.isVariableVisible('geometry.spread')).toBe(true);
      expect(manager.isVariableVisible('uncertainty.entropy')).toBe(false);
    });
  });

  describe('Presets', () => {
    it('applies "all" preset', () => {
      manager.setVisibilityState(VISIBILITY_PRESETS.all);

      for (const layer of manager.getLayers()) {
        expect(manager.isVisible(layer.id)).toBe(true);
      }
    });

    it('applies "minimal" preset', () => {
      manager.setVisibilityState(VISIBILITY_PRESETS.minimal);

      expect(manager.isVisible('geometry')).toBe(true);
      expect(manager.isVisible('uncertainty')).toBe(false);
      expect(manager.isVisible('performance')).toBe(false);
      expect(manager.isVisible('dynamics')).toBe(false);
    });

    it('applies "confidence" preset', () => {
      manager.setVisibilityState(VISIBILITY_PRESETS.confidence);

      expect(manager.isVisible('geometry')).toBe(true);
      expect(manager.isVisible('uncertainty')).toBe(true);
      expect(manager.isVisible('performance')).toBe(false);
      expect(manager.isVisible('annotations')).toBe(true);
    });

    it('applies "temporal" preset', () => {
      manager.setVisibilityState(VISIBILITY_PRESETS.temporal);

      expect(manager.isVisible('dynamics')).toBe(true);
      expect(manager.isVisible('performance')).toBe(false);
    });
  });
});

describe('Predefined Layers', () => {
  it('GEOMETRY_LAYER has correct variables', () => {
    expect(GEOMETRY_LAYER.variables).toContain('geometry.effectiveDimension');
    expect(GEOMETRY_LAYER.variables).toContain('geometry.spread');
    expect(GEOMETRY_LAYER.variables).toContain('position.x');
  });

  it('UNCERTAINTY_LAYER has correct variables', () => {
    expect(UNCERTAINTY_LAYER.variables).toContain('uncertainty.entropy');
    expect(UNCERTAINTY_LAYER.variables).toContain('uncertainty.margin');
    expect(UNCERTAINTY_LAYER.variables).toContain('uncertainty.calibration');
  });

  it('PERFORMANCE_LAYER has correct variables', () => {
    expect(PERFORMANCE_LAYER.variables).toContain('performance.accuracy');
    expect(PERFORMANCE_LAYER.variables).toContain('performance.loss');
  });

  it('DYNAMICS_LAYER has correct variables', () => {
    expect(DYNAMICS_LAYER.variables).toContain('dynamics.velocity');
    expect(DYNAMICS_LAYER.variables).toContain('dynamics.stability');
    expect(DYNAMICS_LAYER.variables).toContain('dynamics.phase');
  });

  it('all layers have unique IDs', () => {
    const ids = PREDEFINED_LAYERS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all layers have descriptions', () => {
    for (const layer of PREDEFINED_LAYERS) {
      expect(layer.description.length).toBeGreaterThan(0);
    }
  });
});
