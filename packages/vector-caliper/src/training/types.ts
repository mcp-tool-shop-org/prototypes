/**
 * Training Dynamics Types
 *
 * These types extend the core state schema for training-specific data.
 * Training variables are state, not annotations.
 */

/**
 * Raw training log entry from an optimizer.
 * This is the input format — unprocessed, traceable to source.
 */
export interface RawTrainingLog {
  /** Training step (0-indexed) */
  step: number;
  /** Epoch number (0-indexed) */
  epoch: number;
  /** Current learning rate */
  learningRate: number;
  /** Loss value at this step */
  loss: number;
  /** Optional accuracy if classification task */
  accuracy?: number;
  /** L2 norm of gradients */
  gradientNorm: number;
  /** L2 norm of parameter update */
  updateNorm: number;
  /** L2 norm of all parameters */
  parameterNorm: number;
  /** Optional: gradient-momentum alignment (cosine similarity) */
  momentumAlignment?: number;
  /** Optional: batch entropy (for diversity tracking) */
  batchEntropy?: number;
  /** Optional: model-specific metadata (preserved but not visualized) */
  metadata?: Record<string, unknown>;
}

/**
 * Validated training state — canonical form for VectorCaliper.
 * All values are required and within valid ranges.
 */
export interface TrainingState {
  /** Unique identifier for this state */
  id: string;
  /** Training step (0-indexed) */
  step: number;
  /** Epoch number (0-indexed) */
  epoch: number;

  /** Training dynamics group */
  training: {
    /** Current learning rate (must be > 0) */
    learningRate: number;
    /** L2 norm of gradients (>= 0) */
    gradientNorm: number;
    /** L2 norm of parameter update (>= 0) */
    updateNorm: number;
    /** Gradient-momentum alignment [-1, 1], default 0 if no momentum */
    momentumAlignment: number;
    /** Batch entropy [0, 1], normalized, default 0.5 if unknown */
    batchEntropy: number;
  };

  /** Model geometry group */
  model: {
    /** L2 norm of all parameters (>= 0) */
    parameterNorm: number;
    /** Effective dimensionality estimate (>= 1) */
    effectiveDim: number;
    /** Anisotropy measure [0, 1] — how "stretched" the representation is */
    anisotropy: number;
    /** Local curvature estimate (>= 0) */
    curvature: number;
  };

  /** Performance group — informative, not primary */
  performance: {
    /** Loss value (>= 0) */
    loss: number;
    /** Accuracy [0, 1], -1 if not applicable */
    accuracy: number;
    /** Calibration error [0, 1], -1 if not computed */
    calibration: number;
  };
}

/**
 * Update vector — first-class object representing state transitions.
 * This is the key abstraction for training dynamics.
 */
export interface UpdateVector {
  /** Source state ID */
  fromStateId: string;
  /** Target state ID */
  toStateId: string;
  /** Step of the source state */
  fromStep: number;
  /** Step of the target state */
  toStep: number;
  /** Direction vector in reduced space (unit vector) */
  direction: number[];
  /** Magnitude of the update (L2 norm in original space) */
  magnitude: number;
  /** Alignment with previous update [-1, 1] (momentum coherence) */
  alignment: number;
  /** Whether this crosses an epoch boundary */
  crossesEpoch: boolean;
}

/**
 * Training trajectory — sequence of states with update vectors.
 */
export interface TrainingTrajectory {
  /** Unique identifier for this training run */
  id: string;
  /** Human-readable name (e.g., "Adam lr=1e-3") */
  name: string;
  /** Ordered sequence of training states */
  states: TrainingState[];
  /** Update vectors between consecutive states */
  updates: UpdateVector[];
  /** Total number of epochs */
  totalEpochs: number;
  /** Total number of steps */
  totalSteps: number;
  /** Epoch boundary indices (which state indices start new epochs) */
  epochBoundaries: number[];
}

/**
 * Adapter configuration — controls how raw logs are processed.
 */
export interface AdapterConfig {
  /** How to handle missing optional fields */
  missingValueStrategy: 'default' | 'error';
  /** Default values for optional fields when strategy is 'default' */
  defaults: {
    momentumAlignment: number;
    batchEntropy: number;
    accuracy: number;
    calibration: number;
    effectiveDim: number;
    anisotropy: number;
    curvature: number;
  };
  /** Whether to validate ranges strictly */
  strictValidation: boolean;
}

/**
 * Default adapter configuration.
 */
export const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  missingValueStrategy: 'default',
  defaults: {
    momentumAlignment: 0,      // No momentum info
    batchEntropy: 0.5,         // Unknown entropy
    accuracy: -1,              // Not applicable
    calibration: -1,           // Not computed
    effectiveDim: 1,           // Minimum dimensionality
    anisotropy: 0,             // Isotropic assumption
    curvature: 0,              // Flat assumption
  },
  strictValidation: true,
};
