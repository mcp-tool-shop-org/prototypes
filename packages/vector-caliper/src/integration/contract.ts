/**
 * Integration Contract — v1
 *
 * Defines the boundary between training code and VectorCaliper.
 * Training code never imports VectorCaliper internals.
 * VectorCaliper never mutates training behavior.
 *
 * Non-negotiable invariants:
 * - Integrations are optional and removable
 * - No optimizer advice
 * - No bidirectional coupling
 */

import { RawTrainingLog } from '../training/types';

/**
 * Integration contract version.
 * Breaking changes require version bump.
 */
export const INTEGRATION_CONTRACT_VERSION = 'v1';

/**
 * Required fields for integration.
 * These must always be present in captured data.
 */
export interface RequiredFields {
  /** Training step (0-indexed, must be integer >= 0) */
  step: number;
  /** Epoch number (0-indexed, must be integer >= 0) */
  epoch: number;
  /** Current learning rate (must be > 0) */
  learningRate: number;
  /** Loss value (must be >= 0, finite) */
  loss: number;
  /** L2 norm of gradients (must be >= 0, finite) */
  gradientNorm: number;
  /** L2 norm of parameter update (must be >= 0, finite) */
  updateNorm: number;
  /** L2 norm of all parameters (must be >= 0, finite) */
  parameterNorm: number;
}

/**
 * Optional fields for integration.
 * These enhance analysis but are not required.
 */
export interface OptionalFields {
  /** Accuracy [0, 1] — -1 if not applicable */
  accuracy?: number;
  /** Gradient-momentum alignment [-1, 1] */
  momentumAlignment?: number;
  /** Batch entropy [0, 1] */
  batchEntropy?: number;
  /** Calibration error [0, 1] */
  calibration?: number;
  /** User-defined metadata (preserved but not visualized) */
  metadata?: Record<string, unknown>;
}

/**
 * Complete integration payload.
 */
export interface IntegrationPayload extends RequiredFields, OptionalFields {
  /** Timestamp of capture (ISO 8601) */
  timestamp?: string;
  /** Source framework identifier */
  source?: 'pytorch' | 'jax' | 'tensorflow' | 'custom';
  /** Contract version used */
  contractVersion?: string;
}

/** Training log entry — alias for IntegrationPayload at the integration boundary. */
export type TrainingLogEntry = IntegrationPayload;

/**
 * Validation result for integration payloads.
 */
export interface ValidationResult {
  /** Whether the payload is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors: ValidationError[];
  /** Validation warnings (non-fatal) */
  warnings: ValidationWarning[];
  /** Validated payload (if valid) */
  payload?: IntegrationPayload;
}

/** Validated payload — alias for ValidationResult. */
export type ValidatedPayload = ValidationResult;

/**
 * Validation error (fatal).
 */
export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

/**
 * Validation warning (non-fatal).
 */
export interface ValidationWarning {
  field: string;
  message: string;
  value: unknown;
}

/**
 * Forbidden mutations.
 * VectorCaliper MUST NOT perform any of these.
 */
export const FORBIDDEN_MUTATIONS = [
  'modify_optimizer_state',
  'modify_model_parameters',
  'modify_learning_rate',
  'modify_gradient',
  'inject_regularization',
  'modify_loss',
  'modify_batch_data',
  'modify_training_loop',
  'call_backward',
  'call_step',
] as const;

export type ForbiddenMutation = typeof FORBIDDEN_MUTATIONS[number];

/**
 * Integration Contract Validator
 *
 * Validates integration payloads against the contract.
 * Rejects malformed or partial integrations cleanly.
 */
export class ContractValidator {
  private readonly version: string;

  constructor(version: string = INTEGRATION_CONTRACT_VERSION) {
    this.version = version;
  }

  /**
   * Validate an integration payload.
   */
  validate(payload: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type check
    if (typeof payload !== 'object' || payload === null) {
      return {
        valid: false,
        errors: [{ field: 'payload', message: 'must be an object', value: payload }],
        warnings: [],
      };
    }

    const obj = payload as Record<string, unknown>;

    // Required fields
    this.validateRequiredField(obj, 'step', this.isNonNegativeInteger, errors);
    this.validateRequiredField(obj, 'epoch', this.isNonNegativeInteger, errors);
    this.validateRequiredField(obj, 'learningRate', this.isPositiveNumber, errors);
    this.validateRequiredField(obj, 'loss', this.isNonNegativeFinite, errors);
    this.validateRequiredField(obj, 'gradientNorm', this.isNonNegativeFinite, errors);
    this.validateRequiredField(obj, 'updateNorm', this.isNonNegativeFinite, errors);
    this.validateRequiredField(obj, 'parameterNorm', this.isNonNegativeFinite, errors);

    // Optional fields with validation when present
    if (obj.accuracy !== undefined) {
      if (!this.isInRange(obj.accuracy, -1, 1)) {
        errors.push({
          field: 'accuracy',
          message: 'must be in range [-1, 1] (use -1 for not applicable)',
          value: obj.accuracy,
        });
      }
    }

    if (obj.momentumAlignment !== undefined) {
      if (!this.isInRange(obj.momentumAlignment, -1, 1)) {
        errors.push({
          field: 'momentumAlignment',
          message: 'must be in range [-1, 1]',
          value: obj.momentumAlignment,
        });
      }
    }

    if (obj.batchEntropy !== undefined) {
      if (!this.isInRange(obj.batchEntropy, 0, 1)) {
        errors.push({
          field: 'batchEntropy',
          message: 'must be in range [0, 1]',
          value: obj.batchEntropy,
        });
      }
    }

    // Version compatibility check
    if (obj.contractVersion !== undefined && obj.contractVersion !== this.version) {
      warnings.push({
        field: 'contractVersion',
        message: `version mismatch: expected ${this.version}, got ${obj.contractVersion}`,
        value: obj.contractVersion,
      });
    }

    // Unknown fields warning
    const knownFields = new Set([
      'step', 'epoch', 'learningRate', 'loss', 'gradientNorm', 'updateNorm',
      'parameterNorm', 'accuracy', 'momentumAlignment', 'batchEntropy',
      'calibration', 'metadata', 'timestamp', 'source', 'contractVersion',
    ]);

    for (const key of Object.keys(obj)) {
      if (!knownFields.has(key)) {
        warnings.push({
          field: key,
          message: 'unknown field (will be ignored)',
          value: obj[key],
        });
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    return {
      valid: true,
      errors: [],
      warnings,
      payload: obj as unknown as IntegrationPayload,
    };
  }

  /**
   * Validate a batch of payloads.
   */
  validateBatch(payloads: unknown[]): {
    valid: IntegrationPayload[];
    invalid: Array<{ index: number; errors: ValidationError[] }>;
    warnings: Array<{ index: number; warnings: ValidationWarning[] }>;
  } {
    const valid: IntegrationPayload[] = [];
    const invalid: Array<{ index: number; errors: ValidationError[] }> = [];
    const warnings: Array<{ index: number; warnings: ValidationWarning[] }> = [];

    payloads.forEach((payload, index) => {
      const result = this.validate(payload);
      if (result.valid && result.payload) {
        valid.push(result.payload);
      } else {
        invalid.push({ index, errors: result.errors });
      }
      if (result.warnings.length > 0) {
        warnings.push({ index, warnings: result.warnings });
      }
    });

    return { valid, invalid, warnings };
  }

  /**
   * Convert validated payload to RawTrainingLog.
   */
  toTrainingLog(payload: IntegrationPayload): RawTrainingLog {
    return {
      step: payload.step,
      epoch: payload.epoch,
      learningRate: payload.learningRate,
      loss: payload.loss,
      gradientNorm: payload.gradientNorm,
      updateNorm: payload.updateNorm,
      parameterNorm: payload.parameterNorm,
      accuracy: payload.accuracy,
      momentumAlignment: payload.momentumAlignment,
      batchEntropy: payload.batchEntropy,
      metadata: payload.metadata,
    };
  }

  // Validation helpers

  private validateRequiredField(
    obj: Record<string, unknown>,
    field: string,
    validator: (value: unknown) => boolean,
    errors: ValidationError[]
  ): void {
    if (obj[field] === undefined) {
      errors.push({ field, message: 'is required', value: undefined });
    } else if (!validator(obj[field])) {
      errors.push({ field, message: 'has invalid value', value: obj[field] });
    }
  }

  private isNonNegativeInteger = (value: unknown): boolean => {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
  };

  private isPositiveNumber = (value: unknown): boolean => {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  };

  private isNonNegativeFinite = (value: unknown): boolean => {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  };

  private isInRange = (value: unknown, min: number, max: number): boolean => {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  };
}

/**
 * Integration boundary enforcer.
 * Ensures VectorCaliper does not perform forbidden mutations.
 */
export class BoundaryEnforcer {
  private readonly violations: Array<{ mutation: ForbiddenMutation; timestamp: string }> = [];

  /**
   * Assert that a mutation is not forbidden.
   * Throws if the mutation is in the forbidden list.
   */
  assertNotForbidden(action: string): void {
    const mutation = FORBIDDEN_MUTATIONS.find((m) => action.includes(m));
    if (mutation) {
      const violation = { mutation, timestamp: new Date().toISOString() };
      this.violations.push(violation);
      throw new IntegrationBoundaryViolation(mutation);
    }
  }

  /**
   * Get all recorded violations.
   */
  getViolations(): ReadonlyArray<{ mutation: ForbiddenMutation; timestamp: string }> {
    return [...this.violations];
  }

  /**
   * Check if any violations have occurred.
   */
  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  /**
   * Clear violation history.
   */
  clearViolations(): void {
    this.violations.length = 0;
  }
}

/**
 * Error thrown when an integration boundary is violated.
 */
export class IntegrationBoundaryViolation extends Error {
  constructor(public readonly mutation: ForbiddenMutation) {
    super(`Integration boundary violation: attempted forbidden mutation '${mutation}'`);
    this.name = 'IntegrationBoundaryViolation';
  }
}

/**
 * Integration health status.
 */
export interface IntegrationHealth {
  /** Contract version */
  version: string;
  /** Whether the integration is healthy */
  healthy: boolean;
  /** Number of payloads received */
  payloadsReceived: number;
  /** Number of valid payloads */
  payloadsValid: number;
  /** Number of invalid payloads */
  payloadsInvalid: number;
  /** Any boundary violations */
  boundaryViolations: number;
  /** Last payload timestamp */
  lastPayloadTime?: string;
}

/**
 * Integration monitor.
 * Tracks integration health without affecting behavior.
 */
export class IntegrationMonitor {
  private payloadsReceived = 0;
  private payloadsValid = 0;
  private payloadsInvalid = 0;
  private lastPayloadTime?: string;
  private readonly validator = new ContractValidator();
  private readonly enforcer = new BoundaryEnforcer();

  /**
   * Record a payload.
   */
  recordPayload(payload: unknown): ValidationResult {
    this.payloadsReceived++;
    const result = this.validator.validate(payload);

    if (result.valid) {
      this.payloadsValid++;
    } else {
      this.payloadsInvalid++;
    }

    this.lastPayloadTime = new Date().toISOString();
    return result;
  }

  /**
   * Get integration health status.
   */
  getHealth(): IntegrationHealth {
    return {
      version: INTEGRATION_CONTRACT_VERSION,
      healthy: this.payloadsInvalid === 0 && !this.enforcer.hasViolations(),
      payloadsReceived: this.payloadsReceived,
      payloadsValid: this.payloadsValid,
      payloadsInvalid: this.payloadsInvalid,
      boundaryViolations: this.enforcer.getViolations().length,
      lastPayloadTime: this.lastPayloadTime,
    };
  }

  /**
   * Reset monitor state.
   */
  reset(): void {
    this.payloadsReceived = 0;
    this.payloadsValid = 0;
    this.payloadsInvalid = 0;
    this.lastPayloadTime = undefined;
    this.enforcer.clearViolations();
  }
}

/**
 * Verify that removing integration has zero effect on training.
 * This is a structural guarantee, not a runtime check.
 */
export function verifyRemovability(): {
  removable: true;
  reason: string;
} {
  // VectorCaliper integration is always removable because:
  // 1. It only reads data (no writes to training state)
  // 2. It has no callbacks that affect training flow
  // 3. It doesn't modify optimizer, model, or data
  // 4. All hooks are explicit and user-controlled

  return {
    removable: true,
    reason: 'VectorCaliper integration is read-only with no side effects on training',
  };
}
