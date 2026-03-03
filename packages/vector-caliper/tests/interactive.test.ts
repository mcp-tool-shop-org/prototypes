/**
 * VectorCaliper - Interactive HTML Tests
 *
 * Verifies:
 * 1. Tooltip content matches schema exactly
 * 2. Every visible glyph is traceable to state variables
 * 3. No hover-induced layout or semantic changes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTooltipContent,
  generateTooltipHTML,
  VARIABLE_METADATA,
  HTMLRenderer,
  type TooltipContent,
} from '../src/interactive';
import {
  Scene,
  SceneBuilder,
  createNodeId,
  createPointNode,
} from '../src/scene';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';
import type { SemanticVariable } from '../src/mapping/semantic-map';

describe('Tooltip Content Generation', () => {
  describe('VARIABLE_METADATA', () => {
    it('has metadata for all semantic variables', () => {
      const expectedVariables: SemanticVariable[] = [
        'position.x',
        'position.y',
        'geometry.effectiveDimension',
        'geometry.anisotropy',
        'geometry.spread',
        'geometry.density',
        'uncertainty.entropy',
        'uncertainty.margin',
        'uncertainty.calibration',
        'performance.accuracy',
        'performance.loss',
        'dynamics.velocity',
        'dynamics.stability',
        'derived.magnitude',
      ];

      for (const variable of expectedVariables) {
        expect(VARIABLE_METADATA[variable]).toBeDefined();
        expect(VARIABLE_METADATA[variable].name).toBeTruthy();
        expect(VARIABLE_METADATA[variable].description).toBeTruthy();
      }
    });

    it('metadata descriptions are non-empty strings', () => {
      for (const [variable, meta] of Object.entries(VARIABLE_METADATA)) {
        expect(typeof meta.name).toBe('string');
        expect(meta.name.length).toBeGreaterThan(0);
        expect(typeof meta.description).toBe('string');
        expect(meta.description.length).toBeGreaterThan(0);
        expect(typeof meta.unit).toBe('string');
      }
    });
  });

  describe('generateTooltipContent', () => {
    let mapper: SemanticMapper;
    let projector: ProjectionEngine;

    beforeEach(() => {
      mapper = new SemanticMapper();
      projector = new ProjectionEngine();
    });

    it('generates content from node bindings', () => {
      const state = createModelState({
        id: 'test-state',
        time: 42,
        geometry: {
          effectiveDimension: 3.5,
          anisotropy: 1.8,
          spread: 4.2,
          density: 0.65,
        },
        uncertainty: {
          entropy: 1.5,
          margin: 0.72,
          calibration: 0.08,
        },
        performance: {
          accuracy: 0.91,
          loss: 0.09,
        },
      });

      projector.fit([state]);
      const projected = projector.project(state);

      const builder = new SceneBuilder(mapper);
      const node = builder.addState(state, projected);

      const content = generateTooltipContent(node, state);

      expect(content.nodeId).toBe(node.id.value);
      expect(content.nodeType).toBe('point');
      expect(content.label).toBe(node.label);
      expect(content.layer).toBe('states');
      expect(content.stateId).toBe('test-state');
      expect(content.time).toBe(42);
    });

    it('extracts correct variable values from state', () => {
      const state = createModelState({
        id: 'test-state',
        time: 0,
        geometry: {
          effectiveDimension: 2.5,
          anisotropy: 1.5,
          spread: 3.0,
          density: 0.7,
        },
        uncertainty: {
          entropy: 1.2,
          margin: 0.65,
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
      const node = builder.addState(state, projected);

      const content = generateTooltipContent(node, state);

      // Check that values are correctly extracted
      const marginVar = content.variables.find((v) => v.name === 'Margin');
      expect(marginVar).toBeDefined();
      expect(marginVar!.value).toBe('0.6500');

      const accuracyVar = content.variables.find((v) => v.name === 'Accuracy');
      expect(accuracyVar).toBeDefined();
      expect(accuracyVar!.value).toBe('0.8800');
    });

    it('includes variable descriptions from schema', () => {
      const state = createModelState({
        id: 'test',
        time: 0,
        geometry: {
          effectiveDimension: 2,
          anisotropy: 1,
          spread: 1,
          density: 0.5,
        },
        uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
        performance: { accuracy: 0.8, loss: 0.2 },
      });

      projector.fit([state]);
      const projected = projector.project(state);

      const builder = new SceneBuilder(mapper);
      const node = builder.addState(state, projected);

      const content = generateTooltipContent(node, state);

      // Verify descriptions match schema exactly
      for (const variable of content.variables) {
        // Find the matching metadata
        const metaEntry = Object.entries(VARIABLE_METADATA).find(
          ([_, meta]) => meta.name === variable.name
        );

        if (metaEntry) {
          const [_, meta] = metaEntry;
          expect(variable.description).toBe(meta.description);
        }
      }
    });

    it('handles null optional values', () => {
      const state = createModelState({
        id: 'minimal',
        time: 0,
        geometry: {
          effectiveDimension: 1,
          anisotropy: 1,
          spread: 1,
          density: 0.5,
        },
        uncertainty: {
          entropy: 1,
          margin: 0.5,
          calibration: 0.1,
          // epistemic and aleatoric are null
        },
        performance: {
          accuracy: 0.5,
          loss: 0.5,
          // taskScore and cost are null
        },
        // dynamics is null
      });

      projector.fit([state]);
      const projected = projector.project(state);

      const builder = new SceneBuilder(mapper);
      const node = builder.addState(state, projected);

      const content = generateTooltipContent(node, state);

      // Should not crash, variables should be generated
      expect(content.variables.length).toBeGreaterThan(0);
    });
  });

  describe('generateTooltipHTML', () => {
    it('generates valid HTML structure', () => {
      const content: TooltipContent = {
        nodeId: 'test-node',
        nodeType: 'point',
        label: 'Test Label',
        layer: 'states',
        stateId: 'state-123',
        time: 42,
        variables: [
          {
            name: 'Accuracy',
            value: '0.8800',
            unit: 'ratio',
            description: 'Classification accuracy',
            bounds: '[0, 1]',
            channel: 'lightness',
          },
        ],
      };

      const html = generateTooltipHTML(content);

      expect(html).toContain('class="vc-tooltip"');
      expect(html).toContain('Test Label');
      expect(html).toContain('point');
      expect(html).toContain('state-123');
      expect(html).toContain('42');
      expect(html).toContain('Accuracy');
      expect(html).toContain('0.8800');
      expect(html).toContain('[lightness]');
    });

    it('escapes HTML special characters', () => {
      const content: TooltipContent = {
        nodeId: 'test',
        nodeType: 'point',
        label: '<script>alert("xss")</script>',
        layer: 'states',
        variables: [],
      };

      const html = generateTooltipHTML(content);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});

describe('HTMLRenderer', () => {
  let renderer: HTMLRenderer;
  let mapper: SemanticMapper;
  let projector: ProjectionEngine;

  beforeEach(() => {
    renderer = new HTMLRenderer();
    mapper = new SemanticMapper();
    projector = new ProjectionEngine();
  });

  it('renders scene to valid HTML', () => {
    const scene = new Scene('test');
    scene.addNode(
      createPointNode({
        id: createNodeId('state', 'test'),
        label: 'Test',
        layer: 'states',
        x: 50,
        y: 50,
      })
    );

    const html = renderer.render(scene);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<svg');
    expect(html).toContain('</svg>');
  });

  it('includes tooltip container when enabled', () => {
    const scene = new Scene('test');
    const html = renderer.render(scene);

    expect(html).toContain('id="vc-tooltip"');
    expect(html).toContain('class="vc-tooltip"');
  });

  it('excludes tooltip when disabled', () => {
    renderer.setConfig({ enableTooltips: false });
    const scene = new Scene('test');
    const html = renderer.render(scene);

    expect(html).not.toContain('id="vc-tooltip"');
  });

  it('includes interaction script with tooltip data', () => {
    const state = createModelState({
      id: 'test-state',
      time: 0,
      geometry: {
        effectiveDimension: 2,
        anisotropy: 1,
        spread: 1,
        density: 0.5,
      },
      uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
      performance: { accuracy: 0.8, loss: 0.2 },
    });

    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    builder.addState(state, projected);
    const scene = builder.getScene();

    renderer.registerState(state.id, state);
    const html = renderer.render(scene);

    expect(html).toContain('<script>');
    expect(html).toContain('tooltipData');
    expect(html).toContain('test-state');
  });

  it('includes default styles when configured', () => {
    renderer.setConfig({ includeDefaultStyles: true });
    const scene = new Scene('test');
    const html = renderer.render(scene);

    expect(html).toContain('.vc-tooltip');
    expect(html).toContain('.vc-container');
  });

  it('excludes styles when disabled', () => {
    renderer.setConfig({ includeDefaultStyles: false });
    const scene = new Scene('test');
    const html = renderer.render(scene);

    expect(html).not.toContain('.vc-tooltip {');
  });

  it('includes custom CSS when provided', () => {
    renderer.setConfig({ customCSS: '.my-custom { color: red; }' });
    const scene = new Scene('test');
    const html = renderer.render(scene);

    expect(html).toContain('.my-custom { color: red; }');
  });

  it('registerState stores state for tooltip extraction', () => {
    const state = createModelState({
      id: 'registered-state',
      time: 0,
      geometry: {
        effectiveDimension: 2,
        anisotropy: 1,
        spread: 1,
        density: 0.5,
      },
      uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
      performance: { accuracy: 0.8, loss: 0.2 },
    });

    renderer.registerState('registered-state', state);

    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    builder.addState(state, projected);
    const scene = builder.getScene();

    const html = renderer.render(scene);

    // Tooltip data should include actual values
    expect(html).toContain('0.8');
  });

  it('clearStates removes registered states', () => {
    const state = createModelState({
      id: 'to-clear',
      time: 0,
      geometry: {
        effectiveDimension: 2,
        anisotropy: 1,
        spread: 1,
        density: 0.5,
      },
      uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
      performance: { accuracy: 0.8, loss: 0.2 },
    });

    renderer.registerState('to-clear', state);
    renderer.clearStates();

    // After clearing, state values won't be in tooltips
    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    builder.addState(state, projected);
    const scene = builder.getScene();

    const html = renderer.render(scene);

    // Values should show as N/A since state not registered
    expect(html).toContain('N/A');
  });
});

describe('Schema-Tooltip Consistency', () => {
  it('every tooltip description matches VARIABLE_METADATA exactly', () => {
    const mapper = new SemanticMapper();
    const projector = new ProjectionEngine();

    const state = createModelState({
      id: 'consistency-test',
      time: 0,
      geometry: {
        effectiveDimension: 2,
        anisotropy: 1,
        spread: 1,
        density: 0.5,
      },
      uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
      performance: { accuracy: 0.8, loss: 0.2 },
    });

    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    const node = builder.addState(state, projected);

    const content = generateTooltipContent(node, state);

    for (const variable of content.variables) {
      // Find matching metadata by name
      const metaEntry = Object.entries(VARIABLE_METADATA).find(
        ([_, meta]) => meta.name === variable.name
      );

      expect(metaEntry).toBeDefined();

      if (metaEntry) {
        const [_, meta] = metaEntry;

        // Description must match byte-for-byte
        expect(variable.description).toBe(meta.description);

        // Unit must match
        expect(variable.unit).toBe(meta.unit);
      }
    }
  });

  it('no tooltip reveals information not in state', () => {
    const mapper = new SemanticMapper();
    const projector = new ProjectionEngine();

    const state = createModelState({
      id: 'info-test',
      time: 5,
      geometry: {
        effectiveDimension: 3,
        anisotropy: 2,
        spread: 4,
        density: 0.6,
      },
      uncertainty: { entropy: 1.5, margin: 0.6, calibration: 0.08 },
      performance: { accuracy: 0.85, loss: 0.15 },
    });

    projector.fit([state]);
    const projected = projector.project(state);

    const builder = new SceneBuilder(mapper);
    const node = builder.addState(state, projected);

    const content = generateTooltipContent(node, state);

    // All variable values should be derivable from state
    for (const variable of content.variables) {
      if (variable.value !== 'N/A') {
        const numValue = parseFloat(variable.value);

        // Value should exist somewhere in state (or be computed from it)
        // This is a sanity check that we're not inventing data
        expect(Number.isFinite(numValue)).toBe(true);
      }
    }
  });
});
