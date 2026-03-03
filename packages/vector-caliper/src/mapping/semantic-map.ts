/**
 * VectorCaliper - Semantic to Visual Mapping
 *
 * Defines the canonical mapping from state variables to visual channels.
 * This is the core "meaning" layer of the instrument.
 *
 * RULE: Each semantic variable maps to exactly ONE visual channel.
 * RULE: Each visual channel encodes exactly ONE semantic meaning.
 * RULE: All mappings are explicit functions, not heuristics.
 */

import type { ModelState, ProjectedState } from '../types/state';
import type {
  VisualChannel,
  ChannelType,
  PositionChannel,
  RadiusChannel,
  HueChannel,
  SaturationChannel,
  OpacityChannel,
  StrokeWidthChannel,
  JitterChannel,
  LightnessChannel,
} from './channels';
import {
  position,
  radius,
  hue,
  saturation,
  opacity,
  strokeWidth,
  jitter,
  lightness,
} from './channels';

// =============================================================================
// Semantic Variable Identifiers
// =============================================================================

/**
 * All semantic variables that can be visualized.
 * This is the complete vocabulary of "meanings".
 */
export type SemanticVariable =
  // From ProjectedState
  | 'position.x'
  | 'position.y'
  | 'position.z'
  // From Geometry
  | 'geometry.effectiveDimension'
  | 'geometry.anisotropy'
  | 'geometry.spread'
  | 'geometry.density'
  // From Uncertainty
  | 'uncertainty.entropy'
  | 'uncertainty.margin'
  | 'uncertainty.calibration'
  | 'uncertainty.epistemic'
  | 'uncertainty.aleatoric'
  // From Performance
  | 'performance.accuracy'
  | 'performance.loss'
  | 'performance.taskScore'
  | 'performance.cost'
  // From Dynamics
  | 'dynamics.velocity'
  | 'dynamics.acceleration'
  | 'dynamics.stability'
  | 'dynamics.phase'
  // Derived/computed
  | 'derived.magnitude'
  | 'derived.dominantDimension';

// =============================================================================
// Mapping Configuration
// =============================================================================

/**
 * A mapping from semantic variable to visual channel.
 */
export interface ChannelMapping<T extends VisualChannel = VisualChannel> {
  readonly semantic: SemanticVariable;
  readonly channel: ChannelType;
  readonly transform: (state: ModelState, projected?: ProjectedState) => T;
  readonly description: string;
}

/**
 * Configuration for the default semantic-to-visual mapping.
 * Can be overridden for domain-specific visualizations.
 */
export interface MappingConfig {
  // Visual bounds
  readonly radiusRange: { min: number; max: number };
  readonly strokeWidthRange: { min: number; max: number };
  readonly jitterAmplitudeMax: number;

  // Color configuration
  readonly hueRange: { start: number; end: number }; // Degrees
  readonly baseSaturation: number;
  readonly baseLightness: number;

  // Scaling
  readonly entropyMax: number; // Expected max entropy for scaling
  readonly anisotropyMax: number; // Expected max anisotropy for scaling
}

export const DEFAULT_CONFIG: MappingConfig = {
  radiusRange: { min: 5, max: 50 },
  strokeWidthRange: { min: 1, max: 8 },
  jitterAmplitudeMax: 10,
  hueRange: { start: 200, end: 360 }, // Blue to red
  baseSaturation: 0.7,
  baseLightness: 0.5,
  entropyMax: 5, // ~5 bits for typical classification
  anisotropyMax: 100,
};

// =============================================================================
// Canonical Mapping Table
// =============================================================================

/**
 * The canonical mapping from semantic variables to visual channels.
 *
 * This table enforces:
 * 1. No channel used twice
 * 2. Every mapping is a pure function
 * 3. Mappings are documented
 */
export function createCanonicalMapping(
  config: MappingConfig = DEFAULT_CONFIG
): Map<SemanticVariable, ChannelMapping> {
  const usedChannels = new Set<ChannelType>();

  function register<T extends VisualChannel>(
    mapping: ChannelMapping<T>
  ): ChannelMapping<T> {
    if (usedChannels.has(mapping.channel)) {
      throw new Error(
        `Channel '${mapping.channel}' already used. Each channel can only encode one semantic.`
      );
    }
    usedChannels.add(mapping.channel);
    return mapping;
  }

  const mappings = new Map<SemanticVariable, ChannelMapping>();

  // ---------------------------------------------------------------------------
  // Position: From projection (x, y)
  // ---------------------------------------------------------------------------
  mappings.set(
    'position.x',
    register<PositionChannel>({
      semantic: 'position.x',
      channel: 'position',
      transform: (_state, projected) => {
        if (!projected) {
          return position(0, 0);
        }
        return position(projected.position.x, projected.position.y, projected.position.z);
      },
      description: 'Reduced state location in 2D/3D projection space',
    })
  );

  // ---------------------------------------------------------------------------
  // Radius: Magnitude/norm of state
  // ---------------------------------------------------------------------------
  mappings.set(
    'derived.magnitude',
    register<RadiusChannel>({
      semantic: 'derived.magnitude',
      channel: 'radius',
      transform: (state) => {
        // Compute magnitude from geometry spread (proxy for state norm)
        const spread = state.geometry.spread.value;
        const normalized = Math.min(spread / 10, 1); // Assume max spread ~10
        const r =
          config.radiusRange.min +
          normalized * (config.radiusRange.max - config.radiusRange.min);
        return radius(r, config.radiusRange.min, config.radiusRange.max);
      },
      description: 'Total state magnitude/norm encoded as glyph radius',
    })
  );

  // ---------------------------------------------------------------------------
  // Hue: Dominant dimension / category
  // ---------------------------------------------------------------------------
  mappings.set(
    'derived.dominantDimension',
    register<HueChannel>({
      semantic: 'derived.dominantDimension',
      channel: 'hue',
      transform: (state) => {
        // Map effective dimension to hue
        // Low dimension (1-2) = blue, high dimension (10+) = red
        const dim = state.geometry.effectiveDimension.value;
        const normalized = Math.min(dim / 10, 1);
        const degrees =
          config.hueRange.start +
          normalized * (config.hueRange.end - config.hueRange.start);
        return hue(degrees);
      },
      description: 'Dominant dimension mapped to color hue (blue=low, red=high)',
    })
  );

  // ---------------------------------------------------------------------------
  // Saturation: Confidence/certainty
  // ---------------------------------------------------------------------------
  mappings.set(
    'uncertainty.margin',
    register<SaturationChannel>({
      semantic: 'uncertainty.margin',
      channel: 'saturation',
      transform: (state) => {
        // Higher margin = more confident = more saturated
        return saturation(state.uncertainty.margin.value);
      },
      description: 'Prediction margin encoded as color saturation',
    })
  );

  // ---------------------------------------------------------------------------
  // Opacity: Calibration quality
  // ---------------------------------------------------------------------------
  mappings.set(
    'uncertainty.calibration',
    register<OpacityChannel>({
      semantic: 'uncertainty.calibration',
      channel: 'opacity',
      transform: (state) => {
        // Lower calibration error = more opaque (more trustworthy)
        const calibrationError = state.uncertainty.calibration.value;
        const alpha = 1 - calibrationError; // Invert: low error = high opacity
        return opacity(Math.max(0.2, alpha)); // Min 0.2 so always visible
      },
      description: 'Calibration quality encoded as opacity (solid=well-calibrated)',
    })
  );

  // ---------------------------------------------------------------------------
  // Stroke Width: Stability
  // ---------------------------------------------------------------------------
  mappings.set(
    'dynamics.stability',
    register<StrokeWidthChannel>({
      semantic: 'dynamics.stability',
      channel: 'strokeWidth',
      transform: (state) => {
        if (!state.dynamics) {
          // No dynamics = neutral stroke
          const mid =
            (config.strokeWidthRange.min + config.strokeWidthRange.max) / 2;
          return strokeWidth(mid, config.strokeWidthRange.min, config.strokeWidthRange.max);
        }
        // Higher stability = thicker stroke
        const stability = state.dynamics.stability;
        const range = stability.max - stability.min;
        const normalized = range > 0 ? (stability.value - stability.min) / range : 0.5;
        const inverted = 1 - normalized; // High stability value often means unstable
        const width =
          config.strokeWidthRange.min +
          inverted * (config.strokeWidthRange.max - config.strokeWidthRange.min);
        return strokeWidth(width, config.strokeWidthRange.min, config.strokeWidthRange.max);
      },
      description: 'Training stability encoded as stroke width (thick=stable)',
    })
  );

  // ---------------------------------------------------------------------------
  // Jitter: Entropy/instability
  // ---------------------------------------------------------------------------
  mappings.set(
    'uncertainty.entropy',
    register<JitterChannel>({
      semantic: 'uncertainty.entropy',
      channel: 'jitter',
      transform: (state) => {
        // Higher entropy = more jitter
        const entropy = state.uncertainty.entropy.value;
        const normalized = Math.min(entropy / config.entropyMax, 1);
        const amplitude = normalized * config.jitterAmplitudeMax;
        return jitter(amplitude, 0.5); // Fixed frequency
      },
      description: 'Output entropy encoded as visual jitter/noise',
    })
  );

  // ---------------------------------------------------------------------------
  // Lightness: Performance (accuracy)
  // ---------------------------------------------------------------------------
  mappings.set(
    'performance.accuracy',
    register<LightnessChannel>({
      semantic: 'performance.accuracy',
      channel: 'lightness',
      transform: (state) => {
        // Higher accuracy = brighter
        const acc = state.performance.accuracy.value;
        // Map to [0.3, 0.8] to avoid pure black/white
        return lightness(0.3 + acc * 0.5);
      },
      description: 'Accuracy encoded as lightness (bright=high accuracy)',
    })
  );

  return mappings;
}

// =============================================================================
// Semantic Mapper Class
// =============================================================================

/**
 * Maps model state to visual channels using the canonical mapping.
 */
export class SemanticMapper {
  private readonly mappings: Map<SemanticVariable, ChannelMapping>;
  private readonly config: MappingConfig;

  constructor(config: MappingConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.mappings = createCanonicalMapping(config);
  }

  /**
   * Get the visual channel for a semantic variable.
   */
  map(
    variable: SemanticVariable,
    state: ModelState,
    projected?: ProjectedState
  ): VisualChannel | null {
    const mapping = this.mappings.get(variable);
    if (!mapping) {
      return null;
    }
    return mapping.transform(state, projected);
  }

  /**
   * Get all mapped channels for a state.
   */
  mapAll(
    state: ModelState,
    projected?: ProjectedState
  ): Map<SemanticVariable, VisualChannel> {
    const result = new Map<SemanticVariable, VisualChannel>();

    for (const [variable, mapping] of this.mappings) {
      result.set(variable, mapping.transform(state, projected));
    }

    return result;
  }

  /**
   * Get the semantic variable encoded by a channel type.
   * Returns null if channel is not used.
   */
  getSemanticForChannel(channel: ChannelType): SemanticVariable | null {
    for (const [variable, mapping] of this.mappings) {
      if (mapping.channel === channel) {
        return variable;
      }
    }
    return null;
  }

  /**
   * Get description of what a channel encodes.
   */
  getChannelDescription(channel: ChannelType): string | null {
    for (const mapping of this.mappings.values()) {
      if (mapping.channel === channel) {
        return mapping.description;
      }
    }
    return null;
  }

  /**
   * Get all registered mappings (for documentation/inspection).
   */
  getMappings(): ReadonlyMap<SemanticVariable, ChannelMapping> {
    return this.mappings;
  }

  /**
   * Get the configuration.
   */
  getConfig(): Readonly<MappingConfig> {
    return this.config;
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const defaultMapper = new SemanticMapper();
