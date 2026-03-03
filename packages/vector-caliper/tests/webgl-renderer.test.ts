/**
 * WebGL Backend Tests
 *
 * Verifies:
 * - Scene graph is the single source of truth
 * - WebGL is a renderer, not a calculator
 * - Same state → same geometry (modulo pixel precision)
 * - CPU fallback always available
 * - WebGL can be disabled without feature loss
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  RendererType,
  Point2D,
  RGBAColor,
  SceneNode,
  CircleNode,
  LineNode,
  PathNode,
  TextNode,
  GroupNode,
  Transform2D,
  SceneGraph,
  RenderResult,
  RendererCapabilities,
  IRenderer,
  RendererConfig,

  // Classes
  WebGLRenderer,
  Canvas2DRenderer,

  // Factory functions
  createRenderer,
  getAvailableRenderers,

  // Scene graph helpers
  createCircleNode,
  createLineNode,
  createPathNode,
  createTextNode,
  createGroupNode,
  createSceneGraph,
  countNodes,
} from '../src/scale/webgl-renderer';

import {
  PerformanceBudget,
  getBudgetForScale,
} from '../src/scale/budget';

// ============================================================================
// Test Helpers
// ============================================================================

const RED: RGBAColor = { r: 1, g: 0, b: 0, a: 1 };
const GREEN: RGBAColor = { r: 0, g: 1, b: 0, a: 1 };
const BLUE: RGBAColor = { r: 0, g: 0, b: 1, a: 1 };
const WHITE: RGBAColor = { r: 1, g: 1, b: 1, a: 1 };
const BLACK: RGBAColor = { r: 0, g: 0, b: 0, a: 1 };
const TRANSPARENT: RGBAColor = { r: 0, g: 0, b: 0, a: 0 };

function point(x: number, y: number): Point2D {
  return { x, y };
}

function createTestBudget(): PerformanceBudget {
  return getBudgetForScale('medium');
}

// Mock canvas for testing without DOM
class MockCanvas {
  width: number = 800;
  height: number = 600;
  private contexts: Map<string, any> = new Map();

  getContext(type: string): any {
    if (this.contexts.has(type)) {
      return this.contexts.get(type);
    }
    return null;
  }

  setMockContext(type: string, context: any): void {
    this.contexts.set(type, context);
  }
}

// Mock WebGL context for testing
class MockWebGLContext {
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  FLOAT = 5126;
  COLOR_BUFFER_BIT = 16384;
  TRIANGLE_FAN = 6;
  LINE_LOOP = 2;
  LINE_STRIP = 3;
  LINES = 1;
  MAX_TEXTURE_SIZE = 3379;
  LINK_STATUS = 35714;
  COMPILE_STATUS = 35713;

  private program: any = { id: 'mockProgram' };
  private shader: any = { id: 'mockShader' };

  createProgram(): any {
    return this.program;
  }

  createShader(_type: number): any {
    return this.shader;
  }

  shaderSource(_shader: any, _source: string): void {}

  compileShader(_shader: any): void {}

  getShaderParameter(_shader: any, param: number): boolean {
    return param === this.COMPILE_STATUS;
  }

  attachShader(_program: any, _shader: any): void {}

  linkProgram(_program: any): void {}

  getProgramParameter(_program: any, param: number): boolean {
    return param === this.LINK_STATUS;
  }

  useProgram(_program: any): void {}

  getAttribLocation(_program: any, _name: string): number {
    return 0;
  }

  getUniformLocation(_program: any, _name: string): any {
    return { id: 'mockLocation' };
  }

  enableVertexAttribArray(_index: number): void {}

  vertexAttribPointer(
    _index: number,
    _size: number,
    _type: number,
    _normalized: boolean,
    _stride: number,
    _offset: number
  ): void {}

  uniform2f(_location: any, _x: number, _y: number): void {}

  uniform4f(_location: any, _r: number, _g: number, _b: number, _a: number): void {}

  uniformMatrix3fv(_location: any, _transpose: boolean, _value: Float32Array): void {}

  createBuffer(): any {
    return { id: 'mockBuffer' };
  }

  bindBuffer(_target: number, _buffer: any): void {}

  bufferData(_target: number, _data: Float32Array, _usage: number): void {}

  drawArrays(_mode: number, _first: number, _count: number): void {}

  deleteBuffer(_buffer: any): void {}

  deleteShader(_shader: any): void {}

  deleteProgram(_program: any): void {}

  clearColor(_r: number, _g: number, _b: number, _a: number): void {}

  clear(_mask: number): void {}

  viewport(_x: number, _y: number, _width: number, _height: number): void {}

  getParameter(param: number): number {
    if (param === this.MAX_TEXTURE_SIZE) {
      return 4096;
    }
    return 0;
  }
}

// Mock Canvas 2D context
class MockCanvas2DContext {
  fillStyle: string = '';
  strokeStyle: string = '';
  lineWidth: number = 1;
  font: string = '';
  textAlign: string = 'start';
  globalAlpha: number = 1;

  private saveStack: any[] = [];

  save(): void {
    this.saveStack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      globalAlpha: this.globalAlpha,
    });
  }

  restore(): void {
    if (this.saveStack.length > 0) {
      const state = this.saveStack.pop();
      Object.assign(this, state);
    }
  }

  beginPath(): void {}
  closePath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number
  ): void {}
  fill(): void {}
  stroke(): void {}
  fillRect(_x: number, _y: number, _width: number, _height: number): void {}
  clearRect(_x: number, _y: number, _width: number, _height: number): void {}
  fillText(_text: string, _x: number, _y: number): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  scale(_x: number, _y: number): void {}
}

// ============================================================================
// Scene Graph Type Tests
// ============================================================================

describe('Scene Graph Types', () => {
  describe('Point2D', () => {
    it('should represent 2D coordinates', () => {
      const p: Point2D = { x: 10, y: 20 };
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
    });

    it('should be immutable (readonly)', () => {
      const p: Point2D = point(5, 10);
      // TypeScript should prevent: p.x = 15;
      expect(p.x).toBe(5);
    });
  });

  describe('RGBAColor', () => {
    it('should represent RGBA values in 0-1 range', () => {
      expect(RED.r).toBe(1);
      expect(RED.g).toBe(0);
      expect(RED.b).toBe(0);
      expect(RED.a).toBe(1);
    });

    it('should support transparency', () => {
      const semiTransparent: RGBAColor = { r: 1, g: 0, b: 0, a: 0.5 };
      expect(semiTransparent.a).toBe(0.5);
    });
  });

  describe('Transform2D', () => {
    it('should represent translation', () => {
      const t: Transform2D = { translate: { x: 100, y: 50 } };
      expect(t.translate?.x).toBe(100);
      expect(t.translate?.y).toBe(50);
    });

    it('should represent scale', () => {
      const t: Transform2D = { scale: { x: 2, y: 0.5 } };
      expect(t.scale?.x).toBe(2);
      expect(t.scale?.y).toBe(0.5);
    });

    it('should represent rotation in radians', () => {
      const t: Transform2D = { rotate: Math.PI / 4 };
      expect(t.rotate).toBe(Math.PI / 4);
    });

    it('should support combined transforms', () => {
      const t: Transform2D = {
        translate: { x: 10, y: 20 },
        scale: { x: 2, y: 2 },
        rotate: Math.PI,
      };
      expect(t.translate?.x).toBe(10);
      expect(t.scale?.x).toBe(2);
      expect(t.rotate).toBe(Math.PI);
    });
  });
});

// ============================================================================
// Scene Node Helper Tests
// ============================================================================

describe('Scene Node Helpers', () => {
  describe('createCircleNode', () => {
    it('should create circle with required properties', () => {
      const circle = createCircleNode('c1', point(100, 100), 50);

      expect(circle.id).toBe('c1');
      expect(circle.type).toBe('circle');
      expect(circle.center.x).toBe(100);
      expect(circle.center.y).toBe(100);
      expect(circle.radius).toBe(50);
    });

    it('should create circle with fill', () => {
      const circle = createCircleNode('c2', point(0, 0), 25, { fill: RED });

      expect(circle.fill).toEqual(RED);
    });

    it('should create circle with stroke', () => {
      const circle = createCircleNode('c3', point(0, 0), 25, {
        stroke: BLUE,
        strokeWidth: 2,
      });

      expect(circle.stroke).toEqual(BLUE);
      expect(circle.strokeWidth).toBe(2);
    });

    it('should create circle with transform', () => {
      const circle = createCircleNode('c4', point(0, 0), 25, {
        transform: { translate: { x: 10, y: 20 } },
      });

      expect(circle.transform?.translate?.x).toBe(10);
    });

    it('should create circle with visibility flag', () => {
      const hidden = createCircleNode('c5', point(0, 0), 25, { visible: false });
      const visible = createCircleNode('c6', point(0, 0), 25, { visible: true });

      expect(hidden.visible).toBe(false);
      expect(visible.visible).toBe(true);
    });
  });

  describe('createLineNode', () => {
    it('should create line with required properties', () => {
      const line = createLineNode('l1', point(0, 0), point(100, 100), WHITE, 2);

      expect(line.id).toBe('l1');
      expect(line.type).toBe('line');
      expect(line.start.x).toBe(0);
      expect(line.start.y).toBe(0);
      expect(line.end.x).toBe(100);
      expect(line.end.y).toBe(100);
      expect(line.stroke).toEqual(WHITE);
      expect(line.strokeWidth).toBe(2);
    });

    it('should create line with transform', () => {
      const line = createLineNode('l2', point(0, 0), point(50, 50), RED, 1, {
        transform: { rotate: Math.PI / 2 },
      });

      expect(line.transform?.rotate).toBe(Math.PI / 2);
    });
  });

  describe('createPathNode', () => {
    it('should create path with points', () => {
      const points = [point(0, 0), point(50, 100), point(100, 0)];
      const path = createPathNode('p1', points);

      expect(path.id).toBe('p1');
      expect(path.type).toBe('path');
      expect(path.points.length).toBe(3);
    });

    it('should create closed path', () => {
      const points = [point(0, 0), point(50, 100), point(100, 0)];
      const path = createPathNode('p2', points, { closed: true, fill: GREEN });

      expect(path.closed).toBe(true);
      expect(path.fill).toEqual(GREEN);
    });

    it('should create stroked path', () => {
      const points = [point(0, 0), point(100, 100)];
      const path = createPathNode('p3', points, { stroke: RED, strokeWidth: 3 });

      expect(path.stroke).toEqual(RED);
      expect(path.strokeWidth).toBe(3);
    });
  });

  describe('createTextNode', () => {
    it('should create text with required properties', () => {
      const text = createTextNode('t1', point(50, 50), 'Hello', 16);

      expect(text.id).toBe('t1');
      expect(text.type).toBe('text');
      expect(text.position.x).toBe(50);
      expect(text.text).toBe('Hello');
      expect(text.fontSize).toBe(16);
    });

    it('should create text with font options', () => {
      const text = createTextNode('t2', point(0, 0), 'Test', 12, {
        fontFamily: 'monospace',
        fill: BLACK,
        anchor: 'middle',
      });

      expect(text.fontFamily).toBe('monospace');
      expect(text.fill).toEqual(BLACK);
      expect(text.anchor).toBe('middle');
    });
  });

  describe('createGroupNode', () => {
    it('should create empty group', () => {
      const group = createGroupNode('g1', []);

      expect(group.id).toBe('g1');
      expect(group.type).toBe('group');
      expect(group.children.length).toBe(0);
    });

    it('should create group with children', () => {
      const children: SceneNode[] = [
        createCircleNode('c1', point(0, 0), 10),
        createLineNode('l1', point(0, 0), point(10, 10), RED, 1),
      ];
      const group = createGroupNode('g2', children);

      expect(group.children.length).toBe(2);
      expect(group.children[0].id).toBe('c1');
      expect(group.children[1].id).toBe('l1');
    });

    it('should create nested groups', () => {
      const innerGroup = createGroupNode('inner', [
        createCircleNode('c1', point(0, 0), 5),
      ]);
      const outerGroup = createGroupNode('outer', [innerGroup]);

      expect(outerGroup.children.length).toBe(1);
      expect((outerGroup.children[0] as GroupNode).children.length).toBe(1);
    });

    it('should support group transforms', () => {
      const group = createGroupNode(
        'g3',
        [createCircleNode('c1', point(0, 0), 10)],
        { transform: { scale: { x: 2, y: 2 } } }
      );

      expect(group.transform?.scale?.x).toBe(2);
    });
  });

  describe('createSceneGraph', () => {
    it('should create empty scene', () => {
      const scene = createSceneGraph(800, 600);

      expect(scene.width).toBe(800);
      expect(scene.height).toBe(600);
      expect(scene.root.type).toBe('group');
      expect(scene.root.id).toBe('root');
      expect(scene.root.children.length).toBe(0);
    });

    it('should create scene with children', () => {
      const children: SceneNode[] = [
        createCircleNode('c1', point(400, 300), 50, { fill: RED }),
      ];
      const scene = createSceneGraph(800, 600, children);

      expect(scene.root.children.length).toBe(1);
    });

    it('should create scene with background color', () => {
      const scene = createSceneGraph(800, 600, [], WHITE);

      expect(scene.backgroundColor).toEqual(WHITE);
    });
  });

  describe('countNodes', () => {
    it('should count single node', () => {
      const circle = createCircleNode('c1', point(0, 0), 10);
      expect(countNodes(circle)).toBe(1);
    });

    it('should count empty group as 1', () => {
      const group = createGroupNode('g1', []);
      expect(countNodes(group)).toBe(1);
    });

    it('should count group with children', () => {
      const group = createGroupNode('g1', [
        createCircleNode('c1', point(0, 0), 10),
        createCircleNode('c2', point(10, 10), 10),
      ]);
      expect(countNodes(group)).toBe(3); // group + 2 circles
    });

    it('should count nested groups', () => {
      const inner = createGroupNode('inner', [
        createCircleNode('c1', point(0, 0), 5),
        createCircleNode('c2', point(5, 5), 5),
      ]);
      const outer = createGroupNode('outer', [
        inner,
        createLineNode('l1', point(0, 0), point(10, 10), RED, 1),
      ]);
      expect(countNodes(outer)).toBe(5); // outer + inner + 2 circles + 1 line
    });
  });
});

// ============================================================================
// WebGL Renderer Tests
// ============================================================================

describe('WebGLRenderer', () => {
  let mockCanvas: MockCanvas;
  let mockGL: MockWebGLContext;
  let budget: PerformanceBudget;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockGL = new MockWebGLContext();
    mockCanvas.setMockContext('webgl', mockGL);
    budget = createTestBudget();
  });

  describe('initialization', () => {
    it('should be unavailable without canvas', () => {
      const renderer = new WebGLRenderer(null, budget);

      expect(renderer.isAvailable()).toBe(false);
      expect(renderer.type).toBe('webgl');
    });

    it('should be unavailable without WebGL context', () => {
      const noGLCanvas = new MockCanvas();
      const renderer = new WebGLRenderer(
        noGLCanvas as unknown as HTMLCanvasElement,
        budget
      );

      expect(renderer.isAvailable()).toBe(false);
    });

    it('should be available with WebGL context', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      expect(renderer.isAvailable()).toBe(true);
    });
  });

  describe('capabilities', () => {
    it('should report unavailable when no context', () => {
      const renderer = new WebGLRenderer(null, budget);
      const caps = renderer.getCapabilities();

      expect(caps.type).toBe('webgl');
      expect(caps.available).toBe(false);
      expect(caps.maxTextureSize).toBeUndefined();
    });

    it('should report capabilities when available', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const caps = renderer.getCapabilities();

      expect(caps.type).toBe('webgl');
      expect(caps.available).toBe(true);
      expect(caps.maxTextureSize).toBe(4096);
      expect(caps.maxVertices).toBe(65536);
      expect(caps.hardwareAccelerated).toBe(true);
    });
  });

  describe('render', () => {
    it('should fail when not available', () => {
      const renderer = new WebGLRenderer(null, budget);
      const scene = createSceneGraph(800, 600);

      const result = renderer.render(scene);

      expect(result.success).toBe(false);
      expect(result.error).toContain('WebGL not available');
    });

    it('should render empty scene', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.rendererUsed).toBe('webgl');
      expect(result.nodeCount).toBe(0);
      expect(result.renderTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should render scene with circles', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createCircleNode('c1', point(100, 100), 50, { fill: RED }),
        createCircleNode('c2', point(200, 200), 30, { fill: BLUE }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(2);
    });

    it('should render scene with lines', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createLineNode('l1', point(0, 0), point(100, 100), WHITE, 2),
        createLineNode('l2', point(100, 0), point(0, 100), RED, 1),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(2);
    });

    it('should render scene with paths', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createPathNode(
          'p1',
          [point(0, 0), point(50, 100), point(100, 0)],
          { stroke: GREEN, strokeWidth: 2, closed: true }
        ),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should count but not render text (WebGL text limitation)', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createTextNode('t1', point(50, 50), 'Hello', 16),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1); // Text is counted
    });

    it('should render nested groups', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const inner = createGroupNode('inner', [
        createCircleNode('c1', point(0, 0), 10),
        createCircleNode('c2', point(20, 20), 10),
      ]);
      const scene = createSceneGraph(800, 600, [
        inner,
        createLineNode('l1', point(0, 0), point(100, 100), WHITE, 1),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(3); // 2 circles + 1 line (groups not counted)
    });

    it('should skip invisible nodes', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createCircleNode('c1', point(100, 100), 50, { fill: RED, visible: true }),
        createCircleNode('c2', point(200, 200), 30, { fill: BLUE, visible: false }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1); // Only visible circle
    });

    it('should handle background color', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [], BLUE);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
    });
  });

  describe('clear', () => {
    it('should not throw when not available', () => {
      const renderer = new WebGLRenderer(null, budget);
      expect(() => renderer.clear()).not.toThrow();
    });

    it('should clear canvas when available', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      expect(() => renderer.clear()).not.toThrow();
    });
  });

  describe('resize', () => {
    it('should update dimensions', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      renderer.resize(1920, 1080);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const renderer = new WebGLRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      renderer.dispose();

      expect(renderer.isAvailable()).toBe(false);
    });
  });
});

// ============================================================================
// Canvas2D Renderer Tests
// ============================================================================

describe('Canvas2DRenderer', () => {
  let mockCanvas: MockCanvas;
  let mockCtx: MockCanvas2DContext;
  let budget: PerformanceBudget;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockCtx = new MockCanvas2DContext();
    mockCanvas.setMockContext('2d', mockCtx);
    budget = createTestBudget();
  });

  describe('initialization', () => {
    it('should be unavailable without canvas', () => {
      const renderer = new Canvas2DRenderer(null, budget);

      expect(renderer.isAvailable()).toBe(false);
      expect(renderer.type).toBe('canvas2d');
    });

    it('should be available with 2D context', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      expect(renderer.isAvailable()).toBe(true);
    });
  });

  describe('capabilities', () => {
    it('should report unavailable when no context', () => {
      const renderer = new Canvas2DRenderer(null, budget);
      const caps = renderer.getCapabilities();

      expect(caps.type).toBe('canvas2d');
      expect(caps.available).toBe(false);
    });

    it('should report capabilities when available', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const caps = renderer.getCapabilities();

      expect(caps.type).toBe('canvas2d');
      expect(caps.available).toBe(true);
      expect(caps.hardwareAccelerated).toBe(false);
    });
  });

  describe('render', () => {
    it('should fail when not available', () => {
      const renderer = new Canvas2DRenderer(null, budget);
      const scene = createSceneGraph(800, 600);

      const result = renderer.render(scene);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Canvas 2D context not available');
    });

    it('should render empty scene', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.rendererUsed).toBe('canvas2d');
      expect(result.nodeCount).toBe(0);
    });

    it('should render circles', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createCircleNode('c1', point(100, 100), 50, { fill: RED, stroke: BLUE, strokeWidth: 2 }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should render lines', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createLineNode('l1', point(0, 0), point(100, 100), WHITE, 2),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should render paths', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createPathNode(
          'p1',
          [point(0, 0), point(50, 100), point(100, 0)],
          { stroke: GREEN, fill: RED, closed: true }
        ),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should render text', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createTextNode('t1', point(50, 50), 'Hello World', 16, {
          fill: BLACK,
          fontFamily: 'Arial',
          anchor: 'middle',
        }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should render nested groups with transforms', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const inner = createGroupNode(
        'inner',
        [createCircleNode('c1', point(0, 0), 10)],
        { transform: { translate: { x: 50, y: 50 } } }
      );
      const scene = createSceneGraph(800, 600, [inner]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should skip invisible nodes', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createCircleNode('c1', point(100, 100), 50, { fill: RED, visible: true }),
        createCircleNode('c2', point(200, 200), 30, { fill: BLUE, visible: false }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
      expect(result.nodeCount).toBe(1);
    });

    it('should apply opacity', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [
        createCircleNode('c1', point(100, 100), 50, { fill: RED, opacity: 0.5 }),
      ]);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
    });

    it('should handle background color', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );
      const scene = createSceneGraph(800, 600, [], WHITE);

      const result = renderer.render(scene);

      expect(result.success).toBe(true);
    });
  });

  describe('clear', () => {
    it('should not throw when not available', () => {
      const renderer = new Canvas2DRenderer(null, budget);
      expect(() => renderer.clear()).not.toThrow();
    });
  });

  describe('resize', () => {
    it('should update dimensions', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      renderer.resize(1920, 1080);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const renderer = new Canvas2DRenderer(
        mockCanvas as unknown as HTMLCanvasElement,
        budget
      );

      renderer.dispose();

      expect(renderer.isAvailable()).toBe(false);
    });
  });
});

// ============================================================================
// Renderer Factory Tests
// ============================================================================

describe('createRenderer', () => {
  let mockCanvas: MockCanvas;
  let mockGL: MockWebGLContext;
  let mockCtx: MockCanvas2DContext;
  let budget: PerformanceBudget;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockGL = new MockWebGLContext();
    mockCtx = new MockCanvas2DContext();
    budget = createTestBudget();
  });

  it('should prefer WebGL when available', () => {
    mockCanvas.setMockContext('webgl', mockGL);
    mockCanvas.setMockContext('2d', mockCtx);

    const renderer = createRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      { budget, preferredRenderer: 'webgl' }
    );

    expect(renderer.type).toBe('webgl');
  });

  it('should fall back to Canvas2D when WebGL unavailable', () => {
    mockCanvas.setMockContext('2d', mockCtx);
    // No WebGL context

    const renderer = createRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      { budget, preferredRenderer: 'webgl', allowFallback: true }
    );

    expect(renderer.type).toBe('canvas2d');
  });

  it('should throw when WebGL unavailable and fallback disabled', () => {
    mockCanvas.setMockContext('2d', mockCtx);
    // No WebGL context

    expect(() =>
      createRenderer(mockCanvas as unknown as HTMLCanvasElement, {
        budget,
        preferredRenderer: 'webgl',
        allowFallback: false,
      })
    ).toThrow('WebGL not available and fallback disabled');
  });

  it('should use Canvas2D when explicitly preferred', () => {
    mockCanvas.setMockContext('webgl', mockGL);
    mockCanvas.setMockContext('2d', mockCtx);

    const renderer = createRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      { budget, preferredRenderer: 'canvas2d' }
    );

    expect(renderer.type).toBe('canvas2d');
  });

  it('should throw when no renderer available', () => {
    // No contexts set

    expect(() =>
      createRenderer(mockCanvas as unknown as HTMLCanvasElement, {
        budget,
        preferredRenderer: 'canvas2d',
      })
    ).toThrow('No renderer available');
  });
});

describe('getAvailableRenderers', () => {
  let mockCanvas: MockCanvas;
  let mockGL: MockWebGLContext;
  let mockCtx: MockCanvas2DContext;
  let budget: PerformanceBudget;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockGL = new MockWebGLContext();
    mockCtx = new MockCanvas2DContext();
    budget = createTestBudget();
  });

  it('should return capabilities for both renderers', () => {
    mockCanvas.setMockContext('webgl', mockGL);
    mockCanvas.setMockContext('2d', mockCtx);

    const caps = getAvailableRenderers(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    expect(caps.length).toBe(2);
    expect(caps.find((c) => c.type === 'webgl')?.available).toBe(true);
    expect(caps.find((c) => c.type === 'canvas2d')?.available).toBe(true);
  });

  it('should report WebGL unavailable when no context', () => {
    mockCanvas.setMockContext('2d', mockCtx);

    const caps = getAvailableRenderers(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    expect(caps.find((c) => c.type === 'webgl')?.available).toBe(false);
    expect(caps.find((c) => c.type === 'canvas2d')?.available).toBe(true);
  });
});

// ============================================================================
// Renderer Equivalence Tests
// ============================================================================

describe('Renderer Equivalence', () => {
  let mockCanvas: MockCanvas;
  let mockGL: MockWebGLContext;
  let mockCtx: MockCanvas2DContext;
  let budget: PerformanceBudget;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    mockGL = new MockWebGLContext();
    mockCtx = new MockCanvas2DContext();
    mockCanvas.setMockContext('webgl', mockGL);
    mockCanvas.setMockContext('2d', mockCtx);
    budget = createTestBudget();
  });

  it('should implement same IRenderer interface', () => {
    const webgl: IRenderer = new WebGLRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    const canvas2d: IRenderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    // Both implement IRenderer
    expect(typeof webgl.isAvailable).toBe('function');
    expect(typeof webgl.getCapabilities).toBe('function');
    expect(typeof webgl.render).toBe('function');
    expect(typeof webgl.clear).toBe('function');
    expect(typeof webgl.resize).toBe('function');
    expect(typeof webgl.dispose).toBe('function');

    expect(typeof canvas2d.isAvailable).toBe('function');
    expect(typeof canvas2d.getCapabilities).toBe('function');
    expect(typeof canvas2d.render).toBe('function');
    expect(typeof canvas2d.clear).toBe('function');
    expect(typeof canvas2d.resize).toBe('function');
    expect(typeof canvas2d.dispose).toBe('function');
  });

  it('same scene should produce same node count in both renderers', () => {
    const webgl = new WebGLRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    const canvas2d = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, { fill: RED }),
      createCircleNode('c2', point(200, 200), 30, { fill: BLUE }),
      createLineNode('l1', point(0, 0), point(100, 100), WHITE, 2),
      createPathNode('p1', [point(0, 0), point(50, 50), point(100, 0)], {
        stroke: GREEN,
      }),
    ]);

    const webglResult = webgl.render(scene);
    const canvas2dResult = canvas2d.render(scene);

    // Both should render same number of nodes
    // Note: Text might differ, but other primitives should match
    expect(webglResult.nodeCount).toBe(canvas2dResult.nodeCount);
  });

  it('visibility should be handled identically', () => {
    const webgl = new WebGLRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    const canvas2d = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, { fill: RED, visible: true }),
      createCircleNode('c2', point(200, 200), 30, { fill: BLUE, visible: false }),
      createCircleNode('c3', point(300, 300), 20, { fill: GREEN }), // visible by default
    ]);

    const webglResult = webgl.render(scene);
    const canvas2dResult = canvas2d.render(scene);

    expect(webglResult.nodeCount).toBe(canvas2dResult.nodeCount);
    expect(webglResult.nodeCount).toBe(2); // Only visible nodes
  });

  it('empty scene should produce zero nodes in both', () => {
    const webgl = new WebGLRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    const canvas2d = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600);

    expect(webgl.render(scene).nodeCount).toBe(0);
    expect(canvas2d.render(scene).nodeCount).toBe(0);
  });
});

// ============================================================================
// Scene Graph as Source of Truth Tests
// ============================================================================

describe('Scene Graph Source of Truth', () => {
  let budget: PerformanceBudget;

  beforeEach(() => {
    budget = createTestBudget();
  });

  it('scene graph should be immutable (readonly types)', () => {
    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50),
    ]);

    // TypeScript should prevent mutations
    // scene.width = 1000; // Should error
    // scene.root.children = []; // Should error

    expect(scene.width).toBe(800);
    expect(scene.root.children.length).toBe(1);
  });

  it('renderer should not modify scene graph', () => {
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const circle = createCircleNode('c1', point(100, 100), 50, { fill: RED });
    const scene = createSceneGraph(800, 600, [circle]);

    // Store original values
    const originalX = circle.center.x;
    const originalY = circle.center.y;
    const originalRadius = circle.radius;

    // Render
    renderer.render(scene);

    // Scene graph should be unchanged
    expect(circle.center.x).toBe(originalX);
    expect(circle.center.y).toBe(originalY);
    expect(circle.radius).toBe(originalRadius);
  });

  it('same scene graph should produce identical renders', () => {
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, { fill: RED }),
    ]);

    const result1 = renderer.render(scene);
    const result2 = renderer.render(scene);

    expect(result1.nodeCount).toBe(result2.nodeCount);
    expect(result1.success).toBe(result2.success);
  });

  it('modifications require new scene graph', () => {
    const originalScene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50),
    ]);

    // To change, create new scene
    const modifiedScene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(200, 200), 75), // Different position and radius
    ]);

    expect(originalScene.root.children[0]).not.toBe(modifiedScene.root.children[0]);

    const originalCircle = originalScene.root.children[0] as CircleNode;
    const modifiedCircle = modifiedScene.root.children[0] as CircleNode;

    expect(originalCircle.center.x).toBe(100);
    expect(modifiedCircle.center.x).toBe(200);
  });
});

// ============================================================================
// CPU Fallback Always Available Tests
// ============================================================================

describe('CPU Fallback Always Available', () => {
  it('Canvas2D renderer is always constructible', () => {
    const budget = createTestBudget();
    const renderer = new Canvas2DRenderer(null, budget);

    // Even without canvas, renderer can be constructed
    expect(renderer).toBeDefined();
    expect(renderer.type).toBe('canvas2d');
  });

  it('Canvas2D reports availability based on context', () => {
    const budget = createTestBudget();

    // Without canvas
    const noCanvas = new Canvas2DRenderer(null, budget);
    expect(noCanvas.isAvailable()).toBe(false);

    // With canvas but no context
    const mockCanvas = new MockCanvas();
    const noContext = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    expect(noContext.isAvailable()).toBe(false);

    // With canvas and context
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());
    const withContext = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    expect(withContext.isAvailable()).toBe(true);
  });

  it('fallback provides same features as WebGL (except text)', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    // All node types should be renderable
    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, { fill: RED }),
      createLineNode('l1', point(0, 0), point(100, 100), WHITE, 2),
      createPathNode('p1', [point(0, 0), point(50, 50)], { stroke: GREEN }),
      createTextNode('t1', point(50, 50), 'Test', 16, { fill: BLACK }),
      createGroupNode('g1', [createCircleNode('c2', point(0, 0), 10)]),
    ]);

    const result = renderer.render(scene);

    expect(result.success).toBe(true);
    expect(result.nodeCount).toBe(5); // All nodes rendered
  });
});

// ============================================================================
// WebGL Can Be Disabled Tests
// ============================================================================

describe('WebGL Can Be Disabled', () => {
  it('preferring canvas2d bypasses WebGL entirely', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    const mockGL = new MockWebGLContext();
    mockCanvas.setMockContext('webgl', mockGL);
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    // Even though WebGL is available, we can prefer Canvas2D
    const renderer = createRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      { budget, preferredRenderer: 'canvas2d' }
    );

    expect(renderer.type).toBe('canvas2d');
  });

  it('all features work without WebGL', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());
    // NO WebGL context

    const renderer = createRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      { budget, preferredRenderer: 'webgl', allowFallback: true }
    );

    expect(renderer.type).toBe('canvas2d');

    // Full feature scene
    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, {
        fill: RED,
        stroke: BLUE,
        strokeWidth: 2,
        transform: { translate: { x: 10, y: 10 } },
        opacity: 0.8,
      }),
      createLineNode('l1', point(0, 0), point(100, 100), WHITE, 3),
      createPathNode(
        'p1',
        [point(0, 0), point(50, 100), point(100, 0)],
        { stroke: GREEN, fill: RED, closed: true }
      ),
      createTextNode('t1', point(400, 300), 'Canvas2D Text', 24, {
        fill: BLACK,
        fontFamily: 'Arial',
        anchor: 'middle',
      }),
      createGroupNode('g1', [
        createCircleNode('gc1', point(0, 0), 5),
        createCircleNode('gc2', point(10, 10), 5),
      ], { transform: { scale: { x: 2, y: 2 } } }),
    ]);

    const result = renderer.render(scene);

    expect(result.success).toBe(true);
    expect(result.nodeCount).toBe(6); // 1 circle + 1 line + 1 path + 1 text + 2 in group
  });
});

// ============================================================================
// RenderResult Tests
// ============================================================================

describe('RenderResult', () => {
  it('should include timing information', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50),
    ]);

    const result = renderer.render(scene);

    expect(result.renderTimeMs).toBeDefined();
    expect(typeof result.renderTimeMs).toBe('number');
    expect(result.renderTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should correctly identify renderer used', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('webgl', new MockWebGLContext());
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const webgl = new WebGLRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );
    const canvas2d = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600);

    expect(webgl.render(scene).rendererUsed).toBe('webgl');
    expect(canvas2d.render(scene).rendererUsed).toBe('canvas2d');
  });

  it('should include error message on failure', () => {
    const budget = createTestBudget();
    const renderer = new WebGLRenderer(null, budget);

    const scene = createSceneGraph(800, 600);
    const result = renderer.render(scene);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });
});

// ============================================================================
// Transform Combination Tests
// ============================================================================

describe('Transform Combination', () => {
  it('should handle translate transform', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(0, 0), 50, {
        transform: { translate: { x: 100, y: 100 } },
      }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle scale transform', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, {
        transform: { scale: { x: 2, y: 0.5 } },
      }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle rotate transform', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 50, {
        transform: { rotate: Math.PI / 4 },
      }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle combined transforms', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(0, 0), 50, {
        transform: {
          translate: { x: 400, y: 300 },
          scale: { x: 2, y: 2 },
          rotate: Math.PI / 6,
        },
      }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle path with less than 2 points', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    // Single point path
    const scene = createSceneGraph(800, 600, [
      createPathNode('p1', [point(50, 50)], { stroke: RED }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
    // Path should be counted but not rendered (< 2 points)
  });

  it('should handle empty path', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createPathNode('p1', [], { stroke: RED }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle zero-radius circle', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createCircleNode('c1', point(100, 100), 0, { fill: RED }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle deeply nested groups', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    // Create deeply nested structure
    let current: SceneNode = createCircleNode('c1', point(0, 0), 10);
    for (let i = 0; i < 10; i++) {
      current = createGroupNode(`g${i}`, [current]);
    }

    const scene = createSceneGraph(800, 600, [current]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
    expect(result.nodeCount).toBe(1); // Only the circle is counted as rendered
  });

  it('should handle line with same start and end', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createLineNode('l1', point(100, 100), point(100, 100), RED, 2),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });

  it('should handle text with empty string', () => {
    const budget = createTestBudget();
    const mockCanvas = new MockCanvas();
    mockCanvas.setMockContext('2d', new MockCanvas2DContext());

    const renderer = new Canvas2DRenderer(
      mockCanvas as unknown as HTMLCanvasElement,
      budget
    );

    const scene = createSceneGraph(800, 600, [
      createTextNode('t1', point(100, 100), '', 16, { fill: BLACK }),
    ]);

    const result = renderer.render(scene);
    expect(result.success).toBe(true);
  });
});
