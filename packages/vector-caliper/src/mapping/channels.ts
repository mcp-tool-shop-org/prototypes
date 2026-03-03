/**
 * VectorCaliper - Visual Channel Definitions
 *
 * Defines the visual primitives available for encoding state.
 * Each channel can only encode ONE semantic meaning.
 *
 * INVARIANT: No visual channel is used for two meanings.
 */

// =============================================================================
// Visual Channel Types
// =============================================================================

/**
 * Position in 2D/3D space.
 * Use for: Reduced state location, projection coordinates.
 */
export interface PositionChannel {
  readonly type: 'position';
  readonly x: number;
  readonly y: number;
  readonly z?: number;
}

/**
 * Distance/radius from origin or reference.
 * Use for: Magnitude, norm, total strength.
 */
export interface RadiusChannel {
  readonly type: 'radius';
  readonly value: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Angular position.
 * Use for: Phase, alignment, correlation direction.
 */
export interface AngleChannel {
  readonly type: 'angle';
  readonly radians: number; // [0, 2π)
}

/**
 * Area of shape.
 * Use for: Weight, importance, probability mass.
 */
export interface AreaChannel {
  readonly type: 'area';
  readonly value: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Color hue (0-360 degrees on color wheel).
 * Use for: Category, dimension identity, discrete class.
 */
export interface HueChannel {
  readonly type: 'hue';
  readonly degrees: number; // [0, 360)
}

/**
 * Color saturation (0-1).
 * Use for: Confidence, certainty, signal strength.
 */
export interface SaturationChannel {
  readonly type: 'saturation';
  readonly value: number; // [0, 1]
}

/**
 * Color lightness/value (0-1).
 * Use for: Intensity, activation level.
 */
export interface LightnessChannel {
  readonly type: 'lightness';
  readonly value: number; // [0, 1]
}

/**
 * Opacity/alpha (0-1).
 * Use for: Uncertainty, confidence intervals.
 */
export interface OpacityChannel {
  readonly type: 'opacity';
  readonly value: number; // [0, 1]
}

/**
 * Stroke width.
 * Use for: Stability, confidence bounds.
 */
export interface StrokeWidthChannel {
  readonly type: 'strokeWidth';
  readonly value: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Stroke dash pattern.
 * Use for: State type, prediction vs actual.
 */
export interface StrokeDashChannel {
  readonly type: 'strokeDash';
  readonly pattern: readonly number[]; // SVG dash array
}

/**
 * Shape curvature/smoothness.
 * Use for: Rate of change, acceleration.
 */
export interface CurvatureChannel {
  readonly type: 'curvature';
  readonly value: number; // Higher = more curved
}

/**
 * Jitter/noise amount.
 * Use for: Instability, variance, noise level.
 */
export interface JitterChannel {
  readonly type: 'jitter';
  readonly amplitude: number;
  readonly frequency: number;
}

/**
 * Animation velocity.
 * Use for: Time evolution speed, update rate.
 */
export interface VelocityChannel {
  readonly type: 'velocity';
  readonly pixelsPerSecond: number;
}

/**
 * Shape type (glyph selection).
 * Use for: Discrete category, model type.
 */
export interface ShapeChannel {
  readonly type: 'shape';
  readonly shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'cross';
}

// =============================================================================
// Channel Union
// =============================================================================

export type VisualChannel =
  | PositionChannel
  | RadiusChannel
  | AngleChannel
  | AreaChannel
  | HueChannel
  | SaturationChannel
  | LightnessChannel
  | OpacityChannel
  | StrokeWidthChannel
  | StrokeDashChannel
  | CurvatureChannel
  | JitterChannel
  | VelocityChannel
  | ShapeChannel;

export type ChannelType = VisualChannel['type'];

// =============================================================================
// Channel Factories
// =============================================================================

export function position(x: number, y: number, z?: number): PositionChannel {
  return { type: 'position', x, y, z };
}

export function radius(value: number, min: number, max: number): RadiusChannel {
  return { type: 'radius', value: clamp(value, min, max), min, max };
}

export function angle(radians: number): AngleChannel {
  // Normalize to [0, 2π)
  const normalized = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { type: 'angle', radians: normalized };
}

export function area(value: number, min: number, max: number): AreaChannel {
  return { type: 'area', value: clamp(value, min, max), min, max };
}

export function hue(degrees: number): HueChannel {
  // Normalize to [0, 360)
  const normalized = ((degrees % 360) + 360) % 360;
  return { type: 'hue', degrees: normalized };
}

export function saturation(value: number): SaturationChannel {
  return { type: 'saturation', value: clamp(value, 0, 1) };
}

export function lightness(value: number): LightnessChannel {
  return { type: 'lightness', value: clamp(value, 0, 1) };
}

export function opacity(value: number): OpacityChannel {
  return { type: 'opacity', value: clamp(value, 0, 1) };
}

export function strokeWidth(value: number, min: number, max: number): StrokeWidthChannel {
  return { type: 'strokeWidth', value: clamp(value, min, max), min, max };
}

export function strokeDash(pattern: readonly number[]): StrokeDashChannel {
  return { type: 'strokeDash', pattern };
}

export function curvature(value: number): CurvatureChannel {
  return { type: 'curvature', value: Math.max(0, value) };
}

export function jitter(amplitude: number, frequency: number): JitterChannel {
  return {
    type: 'jitter',
    amplitude: Math.max(0, amplitude),
    frequency: Math.max(0, frequency),
  };
}

export function velocity(pixelsPerSecond: number): VelocityChannel {
  return { type: 'velocity', pixelsPerSecond: Math.max(0, pixelsPerSecond) };
}

export function shape(s: ShapeChannel['shape']): ShapeChannel {
  return { type: 'shape', shape: s };
}

// =============================================================================
// Helpers
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
