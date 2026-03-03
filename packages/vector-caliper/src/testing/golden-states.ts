/**
 * VectorCaliper - Golden States
 *
 * Canonical reference states for testing and regression.
 * These states have known, expected visual outputs.
 *
 * PURPOSE:
 * - Lock meaning in place
 * - Detect semantic drift
 * - Verify visual invariants
 */

import { createModelState } from '../schema';
import type { ModelState } from '../types/state';

// =============================================================================
// Golden State Definitions
// =============================================================================

/**
 * A golden state with expected visual properties.
 */
export interface GoldenState {
  /** Unique identifier */
  readonly id: string;

  /** Human-readable description */
  readonly description: string;

  /** The canonical model state */
  readonly state: ModelState;

  /** Expected visual properties (for assertions) */
  readonly expected: {
    /** Expected relative radius (high/medium/low) */
    readonly radiusLevel: 'high' | 'medium' | 'low';

    /** Expected hue range (degrees) */
    readonly hueRange: [number, number];

    /** Expected saturation range */
    readonly saturationRange: [number, number];

    /** Expected lightness range */
    readonly lightnessRange: [number, number];

    /** Expected opacity range */
    readonly opacityRange: [number, number];

    /** Should jitter be present? */
    readonly hasJitter: boolean;

    /** Additional invariants */
    readonly invariants?: readonly string[];
  };
}

// =============================================================================
// Canonical Golden States
// =============================================================================

/**
 * GOLDEN_STATE_1: High Confidence Baseline
 *
 * A well-trained model with high accuracy, low uncertainty.
 * Should appear: bright, saturated, solid, stable.
 */
export const GOLDEN_STATE_HIGH_CONFIDENCE: GoldenState = {
  id: 'high-confidence',
  description: 'Well-trained model: high accuracy, low entropy, good calibration',
  state: createModelState({
    id: 'golden-high-confidence',
    time: 100,
    geometry: {
      effectiveDimension: 3.0,
      anisotropy: 1.2,
      spread: 5.0,
      density: 0.8,
    },
    uncertainty: {
      entropy: 0.5, // Low entropy
      margin: 0.85, // High margin
      calibration: 0.03, // Good calibration
    },
    performance: {
      accuracy: 0.95, // High accuracy
      loss: 0.05,
    },
  }),
  expected: {
    radiusLevel: 'medium',
    hueRange: [200, 280], // Blue-ish (moderate dimension)
    saturationRange: [0.7, 1.0], // High saturation (confident)
    lightnessRange: [0.6, 0.8], // Bright (high accuracy)
    opacityRange: [0.9, 1.0], // Solid (well-calibrated)
    hasJitter: false, // Low entropy = minimal jitter
    invariants: [
      'Higher accuracy than UNCERTAIN state',
      'Lower entropy than UNCERTAIN state',
      'More saturated than UNCERTAIN state',
    ],
  },
};

/**
 * GOLDEN_STATE_2: High Uncertainty
 *
 * A model with high entropy, poor calibration.
 * Should appear: desaturated, transparent, jittery.
 */
export const GOLDEN_STATE_HIGH_UNCERTAINTY: GoldenState = {
  id: 'high-uncertainty',
  description: 'Uncertain model: high entropy, poor calibration, wide margin',
  state: createModelState({
    id: 'golden-high-uncertainty',
    time: 50,
    geometry: {
      effectiveDimension: 8.0, // High dimension
      anisotropy: 3.5,
      spread: 2.0,
      density: 0.4,
    },
    uncertainty: {
      entropy: 3.5, // High entropy
      margin: 0.15, // Low margin
      calibration: 0.25, // Poor calibration
    },
    performance: {
      accuracy: 0.6, // Moderate accuracy
      loss: 0.4,
    },
  }),
  expected: {
    radiusLevel: 'low',
    hueRange: [300, 360], // Red-ish (high dimension)
    saturationRange: [0.1, 0.3], // Low saturation (uncertain)
    lightnessRange: [0.55, 0.65], // Dimmer (lower accuracy: 0.3 + 0.6*0.5 = 0.6)
    opacityRange: [0.5, 0.8], // More transparent (poor calibration)
    hasJitter: true, // High entropy = visible jitter
    invariants: [
      'Lower accuracy than HIGH_CONFIDENCE state',
      'Higher entropy than HIGH_CONFIDENCE state',
      'More transparent than HIGH_CONFIDENCE state',
    ],
  },
};

/**
 * GOLDEN_STATE_3: Collapsed Representation
 *
 * Degenerate case with very low effective dimension.
 * Should trigger validation warnings.
 */
export const GOLDEN_STATE_COLLAPSED: GoldenState = {
  id: 'collapsed',
  description: 'Collapsed representation: near-zero spread, degenerate dimension',
  state: createModelState({
    id: 'golden-collapsed',
    time: 0,
    geometry: {
      effectiveDimension: 0.8, // Degenerate
      anisotropy: 50.0, // Very high
      spread: 0.01, // Near-zero
      density: 0.99,
    },
    uncertainty: {
      entropy: 0.01, // Near-deterministic
      margin: 0.99,
      calibration: 0.01,
    },
    performance: {
      accuracy: 1.0, // Suspicious perfect
      loss: 0.0,
    },
  }),
  expected: {
    radiusLevel: 'low',
    hueRange: [200, 230], // Blue (low dimension)
    saturationRange: [0.9, 1.0], // Very saturated
    lightnessRange: [0.75, 0.8], // Very bright
    opacityRange: [0.95, 1.0], // Very solid
    hasJitter: false,
    invariants: [
      'Should trigger spread warning (zero spread)',
      'Should trigger accuracy warning (perfect accuracy)',
      'Should trigger dimension warning (< 1)',
    ],
  },
};

/**
 * GOLDEN_STATE_4: Training in Progress
 *
 * Mid-training state with dynamics.
 */
export const GOLDEN_STATE_TRAINING: GoldenState = {
  id: 'training',
  description: 'Mid-training state with active dynamics',
  state: createModelState({
    id: 'golden-training',
    time: 25,
    geometry: {
      effectiveDimension: 5.0,
      anisotropy: 2.0,
      spread: 3.0,
      density: 0.6,
    },
    uncertainty: {
      entropy: 2.0,
      margin: 0.4,
      calibration: 0.12,
    },
    performance: {
      accuracy: 0.75,
      loss: 0.25,
    },
    dynamics: {
      velocity: 2.5,
      acceleration: 0.3,
      accelerationBounds: [-1, 1],
      stability: 0.4,
      stabilityBounds: [0, 1],
      phase: 1,
    },
  }),
  expected: {
    radiusLevel: 'low', // spread=3.0 → normalized=0.30 → low
    hueRange: [260, 320],
    saturationRange: [0.3, 0.5],
    lightnessRange: [0.6, 0.72], // 0.3 + 0.75*0.5 = 0.675
    opacityRange: [0.8, 0.95],
    hasJitter: true,
    invariants: [
      'Should have dynamics data',
      'Should be mid-range in most properties',
    ],
  },
};

/**
 * GOLDEN_STATE_5: Edge Case - All Optional Null
 *
 * Minimal state with all optional fields null.
 */
export const GOLDEN_STATE_MINIMAL: GoldenState = {
  id: 'minimal',
  description: 'Minimal valid state with all optional fields null',
  state: createModelState({
    id: 'golden-minimal',
    time: 0,
    geometry: {
      effectiveDimension: 1.0,
      anisotropy: 1.0,
      spread: 1.0,
      density: 0.5,
    },
    uncertainty: {
      entropy: 1.0,
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
  }),
  expected: {
    radiusLevel: 'low',
    hueRange: [200, 240],
    saturationRange: [0.4, 0.6],
    lightnessRange: [0.5, 0.6],
    opacityRange: [0.85, 0.95],
    hasJitter: true,
    invariants: [
      'Should render without errors',
      'Should not crash on null optionals',
    ],
  },
};

/**
 * All golden states.
 */
export const GOLDEN_STATES: readonly GoldenState[] = [
  GOLDEN_STATE_HIGH_CONFIDENCE,
  GOLDEN_STATE_HIGH_UNCERTAINTY,
  GOLDEN_STATE_COLLAPSED,
  GOLDEN_STATE_TRAINING,
  GOLDEN_STATE_MINIMAL,
];

// =============================================================================
// Golden State Lookup
// =============================================================================

const goldenStateMap = new Map<string, GoldenState>(
  GOLDEN_STATES.map((gs) => [gs.id, gs])
);

/**
 * Get a golden state by ID.
 */
export function getGoldenState(id: string): GoldenState | undefined {
  return goldenStateMap.get(id);
}

/**
 * Get all golden state IDs.
 */
export function getGoldenStateIds(): readonly string[] {
  return GOLDEN_STATES.map((gs) => gs.id);
}
