/**
 * VectorCaliper - SVG Renderer Tests
 *
 * Tests:
 * 1. Valid SVG output
 * 2. IDs preserved
 * 3. Data attributes for traceability
 * 4. All shape types render correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SVGRenderer, DEFAULT_SVG_CONFIG } from '../src/render/svg';
import {
  Scene,
  SceneBuilder,
  createNodeId,
  createPointNode,
  createPathNode,
  createTextNode,
  createGroupNode,
} from '../src/scene';
import { SemanticMapper } from '../src/mapping';
import { ProjectionEngine } from '../src/projection';
import { createModelState } from '../src/schema';

describe('SVGRenderer', () => {
  let renderer: SVGRenderer;
  let scene: Scene;

  beforeEach(() => {
    renderer = new SVGRenderer();
    scene = new Scene('test');
  });

  describe('Basic Rendering', () => {
    it('renders empty scene', () => {
      const svg = renderer.render(scene);

      expect(svg).toContain('<?xml version="1.0"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('includes XML declaration', () => {
      const svg = renderer.render(scene);
      expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });

    it('includes correct dimensions', () => {
      const svg = renderer.render(scene);

      expect(svg).toContain(`width="${DEFAULT_SVG_CONFIG.width}"`);
      expect(svg).toContain(`height="${DEFAULT_SVG_CONFIG.height}"`);
    });

    it('includes background when configured', () => {
      const svg = renderer.render(scene);
      expect(svg).toContain('fill="#ffffff"');
    });

    it('omits background when null', () => {
      renderer.setConfig({ background: null });
      const svg = renderer.render(scene);
      expect(svg).not.toContain('fill="#ffffff"');
    });
  });

  describe('Point Node Rendering', () => {
    it('renders circle shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Circle',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'circle',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);

      expect(svg).toContain('<circle');
      expect(svg).toContain('id="state_test"');
    });

    it('renders square shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Square',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'square',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<rect');
    });

    it('renders diamond shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Diamond',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'diamond',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<polygon');
    });

    it('renders triangle shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Triangle',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'triangle',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<polygon');
    });

    it('renders star shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Star',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'star',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<polygon');
    });

    it('renders cross shape', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test Cross',
          layer: 'states',
          x: 50,
          y: 50,
          shape: 'cross',
          radius: 10,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<path');
    });

    it('includes HSL fill color', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 50,
          y: 50,
          fill: { h: 200, s: 0.7, l: 0.5, a: 1 },
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('hsl(200, 70%, 50%)');
    });

    it('includes HSLA for transparent fills', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 50,
          y: 50,
          fill: { h: 200, s: 0.7, l: 0.5, a: 0.5 },
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('hsla(200, 70%, 50%, 0.50)');
    });

    it('handles hidden nodes', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Hidden',
          layer: 'states',
          x: 50,
          y: 50,
          visible: false,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('visibility="hidden"');
    });
  });

  describe('Path Node Rendering', () => {
    it('renders linear path', () => {
      scene.addNode(
        createPathNode({
          id: createNodeId('trajectory', 'test'),
          label: 'Test Path',
          layer: 'trajectories',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 25 },
          ],
          interpolation: 'linear',
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<path');
      expect(svg).toMatch(/d="M\s/); // Path starts with M command
      expect(svg).toMatch(/L\s/); // Contains L commands
    });

    it('renders smooth path', () => {
      scene.addNode(
        createPathNode({
          id: createNodeId('trajectory', 'test'),
          label: 'Smooth Path',
          layer: 'trajectories',
          points: [
            { x: 0, y: 0 },
            { x: 25, y: 50 },
            { x: 50, y: 25 },
            { x: 75, y: 75 },
            { x: 100, y: 50 },
          ],
          interpolation: 'catmull-rom',
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<path');
      expect(svg).toContain(' C '); // Cubic bezier commands
    });

    it('handles closed paths', () => {
      scene.addNode(
        createPathNode({
          id: createNodeId('shape', 'test'),
          label: 'Closed Path',
          layer: 'shapes',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 25, y: 50 },
          ],
          closed: true,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain(' Z');
    });
  });

  describe('Text Node Rendering', () => {
    it('renders text element', () => {
      scene.addNode(
        createTextNode({
          id: createNodeId('label', 'test'),
          label: 'Test Label',
          layer: 'labels',
          x: 50,
          y: 50,
          text: 'Hello World',
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('<text');
      expect(svg).toContain('Hello World');
    });

    it('escapes special characters', () => {
      scene.addNode(
        createTextNode({
          id: createNodeId('label', 'test'),
          label: 'Test',
          layer: 'labels',
          x: 0,
          y: 0,
          text: '<script>alert("xss")</script>',
        })
      );

      const svg = renderer.render(scene);
      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
    });
  });

  describe('Data Attributes', () => {
    it('includes data-vc-type', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('data-vc-type="point"');
    });

    it('includes data-vc-layer', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'my-layer',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('data-vc-layer="my-layer"');
    });

    it('includes data-vc-label', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'My Label',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('data-vc-label="My Label"');
    });

    it('includes data-vc-state-id from meta', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
          meta: { stateId: 'original-state-123' },
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('data-vc-state-id="original-state-123"');
    });

    it('omits data attributes when disabled', () => {
      renderer.setConfig({ includeDataAttributes: false });

      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).not.toContain('data-vc-');
    });
  });

  describe('Layer Groups', () => {
    it('wraps nodes in layer groups', () => {
      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('id="layer-states"');
    });

    it('includes Inkscape layer attributes when enabled', () => {
      renderer.setConfig({ inkscapeCompat: true });

      scene.addNode(
        createPointNode({
          id: createNodeId('state', 'test'),
          label: 'Test',
          layer: 'states',
          x: 0,
          y: 0,
        })
      );

      const svg = renderer.render(scene);
      expect(svg).toContain('inkscape:groupmode="layer"');
      expect(svg).toContain('inkscape:label="states"');
    });
  });

  describe('Comments', () => {
    it('includes metadata comments', () => {
      const svg = renderer.render(scene);
      expect(svg).toContain('<!-- VectorCaliper Scene -->');
    });

    it('omits comments when disabled', () => {
      renderer.setConfig({ includeComments: false });
      const svg = renderer.render(scene);
      expect(svg).not.toContain('<!--');
    });
  });

  describe('Configuration', () => {
    it('respects custom width and height', () => {
      renderer.setConfig({ width: 1920, height: 1080 });
      const svg = renderer.render(scene);

      expect(svg).toContain('width="1920"');
      expect(svg).toContain('height="1080"');
    });

    it('getConfig returns current config', () => {
      const config = renderer.getConfig();
      expect(config.width).toBe(DEFAULT_SVG_CONFIG.width);
    });
  });

  describe('Integration with SceneBuilder', () => {
    it('renders scene built from model states', () => {
      const mapper = new SemanticMapper();
      const projector = new ProjectionEngine();
      const builder = new SceneBuilder(mapper);

      const states = [
        createModelState({
          id: 'state-1',
          time: 0,
          geometry: { effectiveDimension: 2, anisotropy: 1, spread: 1, density: 0.5 },
          uncertainty: { entropy: 1, margin: 0.5, calibration: 0.1 },
          performance: { accuracy: 0.8, loss: 0.2 },
        }),
        createModelState({
          id: 'state-2',
          time: 1,
          geometry: { effectiveDimension: 3, anisotropy: 2, spread: 2, density: 0.7 },
          uncertainty: { entropy: 1.5, margin: 0.6, calibration: 0.08 },
          performance: { accuracy: 0.85, loss: 0.15 },
        }),
      ];

      projector.fit(states);
      const projections = projector.projectBatch(states);
      builder.addStates(states, projections);
      builder.addTrajectory(states, projections);

      const builtScene = builder.getScene();
      const svg = renderer.render(builtScene);

      // Should have circles for states
      expect(svg).toContain('<circle');

      // Should have path for trajectory
      expect(svg).toContain('<path');

      // Should have state IDs
      expect(svg).toContain('data-vc-state-id="state-1"');
      expect(svg).toContain('data-vc-state-id="state-2"');

      // Should be valid XML structure
      expect(svg).toContain('<?xml');
      expect(svg).toContain('</svg>');
    });
  });
});
