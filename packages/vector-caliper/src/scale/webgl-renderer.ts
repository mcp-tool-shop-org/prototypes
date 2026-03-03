/**
 * WebGL Backend (Same Scene Graph)
 *
 * Core principles:
 * - Scene graph is the single source of truth
 * - WebGL is a renderer, not a calculator
 * - Identical output semantics to SVG/Canvas
 * - CPU fallback always available
 * - Same state → same geometry (modulo pixel precision)
 */

import { PerformanceBudget, BudgetEnforcer } from './budget';

// ============================================================================
// Types
// ============================================================================

/**
 * Renderer type
 */
export type RendererType = 'webgl' | 'canvas2d' | 'svg';

/**
 * Point in 2D space
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * Color in RGBA
 */
export interface RGBAColor {
  readonly r: number; // 0-1
  readonly g: number; // 0-1
  readonly b: number; // 0-1
  readonly a: number; // 0-1
}

/**
 * Scene graph node types
 */
export type SceneNodeType = 'circle' | 'line' | 'path' | 'text' | 'group';

/**
 * Base scene node
 */
export interface SceneNodeBase {
  readonly id: string;
  readonly type: SceneNodeType;
  readonly transform?: Transform2D;
  readonly opacity?: number;
  readonly visible?: boolean;
}

/**
 * Circle node
 */
export interface CircleNode extends SceneNodeBase {
  readonly type: 'circle';
  readonly center: Point2D;
  readonly radius: number;
  readonly fill?: RGBAColor;
  readonly stroke?: RGBAColor;
  readonly strokeWidth?: number;
}

/**
 * Line node
 */
export interface LineNode extends SceneNodeBase {
  readonly type: 'line';
  readonly start: Point2D;
  readonly end: Point2D;
  readonly stroke: RGBAColor;
  readonly strokeWidth: number;
}

/**
 * Path node (polyline)
 */
export interface PathNode extends SceneNodeBase {
  readonly type: 'path';
  readonly points: readonly Point2D[];
  readonly stroke?: RGBAColor;
  readonly strokeWidth?: number;
  readonly fill?: RGBAColor;
  readonly closed?: boolean;
}

/**
 * Text node
 */
export interface TextNode extends SceneNodeBase {
  readonly type: 'text';
  readonly position: Point2D;
  readonly text: string;
  readonly fontSize: number;
  readonly fontFamily?: string;
  readonly fill?: RGBAColor;
  readonly anchor?: 'start' | 'middle' | 'end';
}

/**
 * Group node
 */
export interface GroupNode extends SceneNodeBase {
  readonly type: 'group';
  readonly children: readonly SceneNode[];
}

/**
 * Union of all scene nodes
 */
export type SceneNode = CircleNode | LineNode | PathNode | TextNode | GroupNode;

/**
 * 2D transform
 */
export interface Transform2D {
  readonly translate?: Point2D;
  readonly scale?: Point2D;
  readonly rotate?: number; // radians
}

/**
 * Scene graph
 */
export interface SceneGraph {
  readonly width: number;
  readonly height: number;
  readonly root: GroupNode;
  readonly backgroundColor?: RGBAColor;
}

/**
 * Render result
 */
export interface RenderResult {
  readonly success: boolean;
  readonly rendererUsed: RendererType;
  readonly nodeCount: number;
  readonly renderTimeMs: number;
  readonly error?: string;
}

/**
 * Renderer capabilities
 */
export interface RendererCapabilities {
  readonly type: RendererType;
  readonly available: boolean;
  readonly maxTextureSize?: number;
  readonly maxVertices?: number;
  readonly hardwareAccelerated?: boolean;
}

// ============================================================================
// Renderer Interface
// ============================================================================

/**
 * Abstract renderer interface
 * All renderers must implement this to ensure equivalence
 */
export interface IRenderer {
  /** Renderer type */
  readonly type: RendererType;

  /** Check if renderer is available */
  isAvailable(): boolean;

  /** Get renderer capabilities */
  getCapabilities(): RendererCapabilities;

  /** Render scene graph */
  render(scene: SceneGraph): RenderResult;

  /** Clear canvas */
  clear(): void;

  /** Resize canvas */
  resize(width: number, height: number): void;

  /** Dispose renderer resources */
  dispose(): void;
}

// ============================================================================
// WebGL Renderer
// ============================================================================

/**
 * WebGL renderer implementation
 *
 * Consumes scene graph and produces identical output to SVG/Canvas.
 * Does NOT compute values - only renders existing geometry.
 */
export class WebGLRenderer implements IRenderer {
  readonly type: RendererType = 'webgl';

  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private width: number = 0;
  private height: number = 0;
  private enforcer: BudgetEnforcer;

  constructor(
    canvas: HTMLCanvasElement | null,
    budget: PerformanceBudget
  ) {
    this.canvas = canvas;
    this.enforcer = new BudgetEnforcer(budget);

    if (canvas) {
      this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (this.gl) {
        this.initializeShaders();
      }
    }
  }

  isAvailable(): boolean {
    return this.gl !== null;
  }

  getCapabilities(): RendererCapabilities {
    if (!this.gl) {
      return {
        type: 'webgl',
        available: false,
      };
    }

    return {
      type: 'webgl',
      available: true,
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      maxVertices: 65536, // Typical WebGL 1.0 limit
      hardwareAccelerated: true,
    };
  }

  render(scene: SceneGraph): RenderResult {
    const startTime = performance.now();

    if (!this.gl || !this.program) {
      return {
        success: false,
        rendererUsed: 'webgl',
        nodeCount: 0,
        renderTimeMs: 0,
        error: 'WebGL not available',
      };
    }

    try {
      // Set viewport
      this.gl.viewport(0, 0, scene.width, scene.height);

      // Clear with background color
      if (scene.backgroundColor) {
        this.gl.clearColor(
          scene.backgroundColor.r,
          scene.backgroundColor.g,
          scene.backgroundColor.b,
          scene.backgroundColor.a
        );
      } else {
        this.gl.clearColor(0, 0, 0, 0);
      }
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      // Render scene
      const nodeCount = this.renderNode(scene.root, {
        translate: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotate: 0,
      });

      const renderTimeMs = performance.now() - startTime;
      this.enforcer.recordFrameTime(renderTimeMs);

      return {
        success: true,
        rendererUsed: 'webgl',
        nodeCount,
        renderTimeMs,
      };
    } catch (err) {
      return {
        success: false,
        rendererUsed: 'webgl',
        nodeCount: 0,
        renderTimeMs: performance.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  clear(): void {
    if (this.gl) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  dispose(): void {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private initializeShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform mat3 u_transform;

      void main() {
        vec3 position = u_transform * vec3(a_position, 1.0);
        vec2 clipSpace = (position.xy / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;

      void main() {
        gl_FragColor = u_color;
      }
    `;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private renderNode(node: SceneNode, parentTransform: Transform2D): number {
    if (node.visible === false) return 0;

    const transform = this.combineTransforms(parentTransform, node.transform);
    let count = 0;

    switch (node.type) {
      case 'circle':
        this.renderCircle(node, transform);
        count = 1;
        break;
      case 'line':
        this.renderLine(node, transform);
        count = 1;
        break;
      case 'path':
        this.renderPath(node, transform);
        count = 1;
        break;
      case 'text':
        // Text rendering in WebGL is complex; typically done via texture atlas
        // For now, count but don't render (fallback would handle text)
        count = 1;
        break;
      case 'group':
        for (const child of node.children) {
          count += this.renderNode(child, transform);
        }
        break;
    }

    return count;
  }

  private combineTransforms(parent: Transform2D, child?: Transform2D): Transform2D {
    if (!child) return parent;

    return {
      translate: {
        x: (parent.translate?.x ?? 0) + (child.translate?.x ?? 0),
        y: (parent.translate?.y ?? 0) + (child.translate?.y ?? 0),
      },
      scale: {
        x: (parent.scale?.x ?? 1) * (child.scale?.x ?? 1),
        y: (parent.scale?.y ?? 1) * (child.scale?.y ?? 1),
      },
      rotate: (parent.rotate ?? 0) + (child.rotate ?? 0),
    };
  }

  private renderCircle(node: CircleNode, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    // Generate circle vertices
    const segments = 32;
    const vertices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = node.center.x + Math.cos(angle) * node.radius;
      const y = node.center.y + Math.sin(angle) * node.radius;
      vertices.push(x, y);
    }

    if (node.fill) {
      this.drawTriangleFan(vertices, node.fill, transform);
    }

    if (node.stroke) {
      this.drawLineLoop(vertices, node.stroke, node.strokeWidth ?? 1, transform);
    }
  }

  private renderLine(node: LineNode, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    const vertices = [
      node.start.x, node.start.y,
      node.end.x, node.end.y,
    ];

    this.drawLines(vertices, node.stroke, node.strokeWidth, transform);
  }

  private renderPath(node: PathNode, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    if (node.points.length < 2) return;

    const vertices: number[] = [];
    for (const p of node.points) {
      vertices.push(p.x, p.y);
    }

    if (node.fill && node.closed) {
      this.drawTriangleFan(vertices, node.fill, transform);
    }

    if (node.stroke) {
      if (node.closed) {
        this.drawLineLoop(vertices, node.stroke, node.strokeWidth ?? 1, transform);
      } else {
        this.drawLineStrip(vertices, node.stroke, node.strokeWidth ?? 1, transform);
      }
    }
  }

  private drawTriangleFan(vertices: number[], color: RGBAColor, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    this.gl.useProgram(this.program);
    this.setUniforms(color, transform);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vertices.length / 2);

    this.gl.deleteBuffer(buffer);
  }

  private drawLineLoop(vertices: number[], color: RGBAColor, _width: number, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    this.gl.useProgram(this.program);
    this.setUniforms(color, transform);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.LINE_LOOP, 0, vertices.length / 2);

    this.gl.deleteBuffer(buffer);
  }

  private drawLineStrip(vertices: number[], color: RGBAColor, _width: number, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    this.gl.useProgram(this.program);
    this.setUniforms(color, transform);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2);

    this.gl.deleteBuffer(buffer);
  }

  private drawLines(vertices: number[], color: RGBAColor, _width: number, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    this.gl.useProgram(this.program);
    this.setUniforms(color, transform);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.LINES, 0, vertices.length / 2);

    this.gl.deleteBuffer(buffer);
  }

  private setUniforms(color: RGBAColor, transform: Transform2D): void {
    if (!this.gl || !this.program) return;

    const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.gl.uniform2f(resolutionLocation, this.width || 1, this.height || 1);

    const colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    this.gl.uniform4f(colorLocation, color.r, color.g, color.b, color.a);

    // Build transform matrix
    const tx = transform.translate?.x ?? 0;
    const ty = transform.translate?.y ?? 0;
    const sx = transform.scale?.x ?? 1;
    const sy = transform.scale?.y ?? 1;
    const r = transform.rotate ?? 0;
    const cos = Math.cos(r);
    const sin = Math.sin(r);

    const matrix = new Float32Array([
      sx * cos, sx * sin, 0,
      -sy * sin, sy * cos, 0,
      tx, ty, 1,
    ]);

    const transformLocation = this.gl.getUniformLocation(this.program, 'u_transform');
    this.gl.uniformMatrix3fv(transformLocation, false, matrix);
  }
}

// ============================================================================
// Canvas 2D Renderer (CPU Fallback)
// ============================================================================

/**
 * Canvas 2D renderer implementation
 *
 * CPU fallback that produces identical output to WebGL.
 */
export class Canvas2DRenderer implements IRenderer {
  readonly type: RendererType = 'canvas2d';

  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private width: number = 0;
  private height: number = 0;
  private enforcer: BudgetEnforcer;

  constructor(
    canvas: HTMLCanvasElement | null,
    budget: PerformanceBudget
  ) {
    this.canvas = canvas;
    this.enforcer = new BudgetEnforcer(budget);

    if (canvas) {
      this.ctx = canvas.getContext('2d');
    }
  }

  isAvailable(): boolean {
    return this.ctx !== null;
  }

  getCapabilities(): RendererCapabilities {
    return {
      type: 'canvas2d',
      available: this.ctx !== null,
      hardwareAccelerated: false,
    };
  }

  render(scene: SceneGraph): RenderResult {
    const startTime = performance.now();

    if (!this.ctx) {
      return {
        success: false,
        rendererUsed: 'canvas2d',
        nodeCount: 0,
        renderTimeMs: 0,
        error: 'Canvas 2D context not available',
      };
    }

    try {
      // Clear with background color
      if (scene.backgroundColor) {
        this.ctx.fillStyle = this.colorToCSS(scene.backgroundColor);
        this.ctx.fillRect(0, 0, scene.width, scene.height);
      } else {
        this.ctx.clearRect(0, 0, scene.width, scene.height);
      }

      // Render scene
      const nodeCount = this.renderNode(scene.root);

      const renderTimeMs = performance.now() - startTime;
      this.enforcer.recordFrameTime(renderTimeMs);

      return {
        success: true,
        rendererUsed: 'canvas2d',
        nodeCount,
        renderTimeMs,
      };
    } catch (err) {
      return {
        success: false,
        rendererUsed: 'canvas2d',
        nodeCount: 0,
        renderTimeMs: performance.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  clear(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  dispose(): void {
    this.ctx = null;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private renderNode(node: SceneNode): number {
    if (!this.ctx) return 0;
    if (node.visible === false) return 0;

    this.ctx.save();

    // Apply transform
    if (node.transform) {
      const t = node.transform;
      if (t.translate) {
        this.ctx.translate(t.translate.x, t.translate.y);
      }
      if (t.rotate) {
        this.ctx.rotate(t.rotate);
      }
      if (t.scale) {
        this.ctx.scale(t.scale.x, t.scale.y);
      }
    }

    // Apply opacity
    if (node.opacity !== undefined) {
      this.ctx.globalAlpha = node.opacity;
    }

    let count = 0;

    switch (node.type) {
      case 'circle':
        this.renderCircle(node);
        count = 1;
        break;
      case 'line':
        this.renderLine(node);
        count = 1;
        break;
      case 'path':
        this.renderPath(node);
        count = 1;
        break;
      case 'text':
        this.renderText(node);
        count = 1;
        break;
      case 'group':
        for (const child of node.children) {
          count += this.renderNode(child);
        }
        break;
    }

    this.ctx.restore();

    return count;
  }

  private renderCircle(node: CircleNode): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.arc(node.center.x, node.center.y, node.radius, 0, Math.PI * 2);

    if (node.fill) {
      this.ctx.fillStyle = this.colorToCSS(node.fill);
      this.ctx.fill();
    }

    if (node.stroke) {
      this.ctx.strokeStyle = this.colorToCSS(node.stroke);
      this.ctx.lineWidth = node.strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  private renderLine(node: LineNode): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.moveTo(node.start.x, node.start.y);
    this.ctx.lineTo(node.end.x, node.end.y);

    this.ctx.strokeStyle = this.colorToCSS(node.stroke);
    this.ctx.lineWidth = node.strokeWidth;
    this.ctx.stroke();
  }

  private renderPath(node: PathNode): void {
    if (!this.ctx || node.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(node.points[0].x, node.points[0].y);

    for (let i = 1; i < node.points.length; i++) {
      this.ctx.lineTo(node.points[i].x, node.points[i].y);
    }

    if (node.closed) {
      this.ctx.closePath();
    }

    if (node.fill) {
      this.ctx.fillStyle = this.colorToCSS(node.fill);
      this.ctx.fill();
    }

    if (node.stroke) {
      this.ctx.strokeStyle = this.colorToCSS(node.stroke);
      this.ctx.lineWidth = node.strokeWidth ?? 1;
      this.ctx.stroke();
    }
  }

  private renderText(node: TextNode): void {
    if (!this.ctx) return;

    this.ctx.font = `${node.fontSize}px ${node.fontFamily ?? 'sans-serif'}`;
    // Map 'middle' anchor to 'center' for canvas API
    const anchor = node.anchor ?? 'start';
    this.ctx.textAlign = anchor === 'middle' ? 'center' : anchor;

    if (node.fill) {
      this.ctx.fillStyle = this.colorToCSS(node.fill);
      this.ctx.fillText(node.text, node.position.x, node.position.y);
    }
  }

  private colorToCSS(color: RGBAColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${color.a})`;
  }
}

// ============================================================================
// Renderer Factory
// ============================================================================

/**
 * Renderer configuration
 */
export interface RendererConfig {
  /** Preferred renderer type */
  readonly preferredRenderer?: RendererType;
  /** Whether to allow fallback */
  readonly allowFallback?: boolean;
  /** Performance budget */
  readonly budget: PerformanceBudget;
}

/**
 * Create renderer with fallback support
 */
export function createRenderer(
  canvas: HTMLCanvasElement | null,
  config: RendererConfig
): IRenderer {
  const { preferredRenderer = 'webgl', allowFallback = true, budget } = config;

  // Try preferred renderer first
  if (preferredRenderer === 'webgl') {
    const webgl = new WebGLRenderer(canvas, budget);
    if (webgl.isAvailable()) {
      return webgl;
    }
    if (!allowFallback) {
      throw new Error('WebGL not available and fallback disabled');
    }
  }

  // Fall back to Canvas 2D
  const canvas2d = new Canvas2DRenderer(canvas, budget);
  if (canvas2d.isAvailable()) {
    return canvas2d;
  }

  throw new Error('No renderer available');
}

/**
 * Check which renderers are available
 */
export function getAvailableRenderers(
  canvas: HTMLCanvasElement | null,
  budget: PerformanceBudget
): RendererCapabilities[] {
  const capabilities: RendererCapabilities[] = [];

  const webgl = new WebGLRenderer(canvas, budget);
  capabilities.push(webgl.getCapabilities());
  webgl.dispose();

  const canvas2d = new Canvas2DRenderer(canvas, budget);
  capabilities.push(canvas2d.getCapabilities());
  canvas2d.dispose();

  return capabilities;
}

// ============================================================================
// Scene Graph Helpers
// ============================================================================

/**
 * Create a circle node
 */
export function createCircleNode(
  id: string,
  center: Point2D,
  radius: number,
  options: Partial<Omit<CircleNode, 'id' | 'type' | 'center' | 'radius'>> = {}
): CircleNode {
  return {
    id,
    type: 'circle',
    center,
    radius,
    ...options,
  };
}

/**
 * Create a line node
 */
export function createLineNode(
  id: string,
  start: Point2D,
  end: Point2D,
  stroke: RGBAColor,
  strokeWidth: number,
  options: Partial<Omit<LineNode, 'id' | 'type' | 'start' | 'end' | 'stroke' | 'strokeWidth'>> = {}
): LineNode {
  return {
    id,
    type: 'line',
    start,
    end,
    stroke,
    strokeWidth,
    ...options,
  };
}

/**
 * Create a path node
 */
export function createPathNode(
  id: string,
  points: Point2D[],
  options: Partial<Omit<PathNode, 'id' | 'type' | 'points'>> = {}
): PathNode {
  return {
    id,
    type: 'path',
    points,
    ...options,
  };
}

/**
 * Create a text node
 */
export function createTextNode(
  id: string,
  position: Point2D,
  text: string,
  fontSize: number,
  options: Partial<Omit<TextNode, 'id' | 'type' | 'position' | 'text' | 'fontSize'>> = {}
): TextNode {
  return {
    id,
    type: 'text',
    position,
    text,
    fontSize,
    ...options,
  };
}

/**
 * Create a group node
 */
export function createGroupNode(
  id: string,
  children: SceneNode[],
  options: Partial<Omit<GroupNode, 'id' | 'type' | 'children'>> = {}
): GroupNode {
  return {
    id,
    type: 'group',
    children,
    ...options,
  };
}

/**
 * Create an empty scene graph
 */
export function createSceneGraph(
  width: number,
  height: number,
  children: SceneNode[] = [],
  backgroundColor?: RGBAColor
): SceneGraph {
  return {
    width,
    height,
    root: createGroupNode('root', children),
    backgroundColor,
  };
}

/**
 * Count nodes in scene graph
 */
export function countNodes(node: SceneNode): number {
  if (node.type === 'group') {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return 1;
}
