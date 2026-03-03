/**
 * Integration Contract Tests
 *
 * Acceptance criteria:
 * - VectorCaliper can reject malformed or partial integrations cleanly
 * - Training code never imports VectorCaliper internals
 * - Failure condition: Integration requires modifying optimizer logic
 */

import { describe, it, expect } from 'vitest';
import {
  ContractValidator,
  BoundaryEnforcer,
  IntegrationMonitor,
  IntegrationBoundaryViolation,
  IntegrationPayload,
  INTEGRATION_CONTRACT_VERSION,
  FORBIDDEN_MUTATIONS,
  verifyRemovability,
} from '../src/integration';
import { RawTrainingLog } from '../src/training';

// Helper to create valid payload
function createValidPayload(overrides: Partial<IntegrationPayload> = {}): IntegrationPayload {
  return {
    step: 0,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 100,
    ...overrides,
  };
}

describe('ContractValidator', () => {
  describe('Required Fields', () => {
    it('validates a complete valid payload', () => {
      const validator = new ContractValidator();
      const payload = createValidPayload();

      const result = validator.validate(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.payload).toBeDefined();
    });

    it('rejects missing step', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).step;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'step')).toBe(true);
    });

    it('rejects missing epoch', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).epoch;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'epoch')).toBe(true);
    });

    it('rejects missing learningRate', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).learningRate;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'learningRate')).toBe(true);
    });

    it('rejects missing loss', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).loss;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'loss')).toBe(true);
    });

    it('rejects missing gradientNorm', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).gradientNorm;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'gradientNorm')).toBe(true);
    });

    it('rejects missing updateNorm', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).updateNorm;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'updateNorm')).toBe(true);
    });

    it('rejects missing parameterNorm', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload() };
      delete (payload as any).parameterNorm;

      const result = validator.validate(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'parameterNorm')).toBe(true);
    });
  });

  describe('Value Validation', () => {
    it('rejects negative step', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ step: -1 }));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'step')).toBe(true);
    });

    it('rejects non-integer step', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ step: 1.5 }));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'step')).toBe(true);
    });

    it('rejects zero learning rate', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ learningRate: 0 }));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'learningRate')).toBe(true);
    });

    it('rejects negative loss', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ loss: -1 }));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'loss')).toBe(true);
    });

    it('rejects NaN values', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ loss: NaN }));

      expect(result.valid).toBe(false);
    });

    it('rejects Infinity values', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ gradientNorm: Infinity }));

      expect(result.valid).toBe(false);
    });
  });

  describe('Optional Fields', () => {
    it('accepts payload without optional fields', () => {
      const validator = new ContractValidator();
      const payload = createValidPayload();

      const result = validator.validate(payload);

      expect(result.valid).toBe(true);
    });

    it('accepts valid accuracy', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ accuracy: 0.85 }));

      expect(result.valid).toBe(true);
    });

    it('accepts accuracy of -1 (not applicable)', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ accuracy: -1 }));

      expect(result.valid).toBe(true);
    });

    it('rejects accuracy outside [-1, 1]', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ accuracy: 1.5 }));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'accuracy')).toBe(true);
    });

    it('accepts valid momentum alignment', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ momentumAlignment: 0.5 }));

      expect(result.valid).toBe(true);
    });

    it('rejects momentum alignment outside [-1, 1]', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ momentumAlignment: 2 }));

      expect(result.valid).toBe(false);
    });

    it('accepts valid batch entropy', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ batchEntropy: 0.7 }));

      expect(result.valid).toBe(true);
    });

    it('rejects batch entropy outside [0, 1]', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({ batchEntropy: -0.1 }));

      expect(result.valid).toBe(false);
    });

    it('accepts metadata', () => {
      const validator = new ContractValidator();
      const result = validator.validate(createValidPayload({
        metadata: { experiment: 'test', run: 42 },
      }));

      expect(result.valid).toBe(true);
    });
  });

  describe('Warnings', () => {
    it('warns about unknown fields', () => {
      const validator = new ContractValidator();
      const payload = { ...createValidPayload(), unknownField: 'value' };

      const result = validator.validate(payload);

      expect(result.valid).toBe(true); // Still valid
      expect(result.warnings.some((w) => w.field === 'unknownField')).toBe(true);
    });

    it('warns about version mismatch', () => {
      const validator = new ContractValidator();
      const payload = createValidPayload({ contractVersion: 'v999' });

      const result = validator.validate(payload);

      expect(result.valid).toBe(true); // Still valid
      expect(result.warnings.some((w) => w.field === 'contractVersion')).toBe(true);
    });
  });

  describe('Batch Validation', () => {
    it('validates a batch of payloads', () => {
      const validator = new ContractValidator();
      const payloads = [
        createValidPayload({ step: 0 }),
        createValidPayload({ step: 1 }),
        createValidPayload({ step: 2 }),
      ];

      const result = validator.validateBatch(payloads);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it('separates valid and invalid payloads', () => {
      const validator = new ContractValidator();
      const payloads = [
        createValidPayload({ step: 0 }),
        { step: -1 }, // Invalid
        createValidPayload({ step: 2 }),
      ];

      const result = validator.validateBatch(payloads);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
    });
  });

  describe('Conversion', () => {
    it('converts validated payload to RawTrainingLog', () => {
      const validator = new ContractValidator();
      const payload = createValidPayload({
        accuracy: 0.9,
        momentumAlignment: 0.5,
        metadata: { test: true },
      });

      const log = validator.toTrainingLog(payload);

      expect(log.step).toBe(payload.step);
      expect(log.epoch).toBe(payload.epoch);
      expect(log.learningRate).toBe(payload.learningRate);
      expect(log.loss).toBe(payload.loss);
      expect(log.gradientNorm).toBe(payload.gradientNorm);
      expect(log.updateNorm).toBe(payload.updateNorm);
      expect(log.parameterNorm).toBe(payload.parameterNorm);
      expect(log.accuracy).toBe(payload.accuracy);
      expect(log.momentumAlignment).toBe(payload.momentumAlignment);
      expect(log.metadata).toEqual(payload.metadata);
    });
  });

  describe('Type Rejection', () => {
    it('rejects null', () => {
      const validator = new ContractValidator();
      const result = validator.validate(null);

      expect(result.valid).toBe(false);
    });

    it('rejects undefined', () => {
      const validator = new ContractValidator();
      const result = validator.validate(undefined);

      expect(result.valid).toBe(false);
    });

    it('rejects array', () => {
      const validator = new ContractValidator();
      const result = validator.validate([1, 2, 3]);

      expect(result.valid).toBe(false);
    });

    it('rejects string', () => {
      const validator = new ContractValidator();
      const result = validator.validate('not a payload');

      expect(result.valid).toBe(false);
    });
  });
});

describe('BoundaryEnforcer', () => {
  it('allows non-forbidden actions', () => {
    const enforcer = new BoundaryEnforcer();

    expect(() => enforcer.assertNotForbidden('read_gradient_norm')).not.toThrow();
    expect(() => enforcer.assertNotForbidden('compute_statistics')).not.toThrow();
    expect(() => enforcer.assertNotForbidden('render_visualization')).not.toThrow();
  });

  it('throws on forbidden mutations', () => {
    const enforcer = new BoundaryEnforcer();

    expect(() => enforcer.assertNotForbidden('modify_optimizer_state')).toThrow(
      IntegrationBoundaryViolation
    );
  });

  it('records violations', () => {
    const enforcer = new BoundaryEnforcer();

    try {
      enforcer.assertNotForbidden('modify_learning_rate');
    } catch (e) {
      // Expected
    }

    expect(enforcer.hasViolations()).toBe(true);
    expect(enforcer.getViolations()).toHaveLength(1);
    expect(enforcer.getViolations()[0].mutation).toBe('modify_learning_rate');
  });

  it('can clear violations', () => {
    const enforcer = new BoundaryEnforcer();

    try {
      enforcer.assertNotForbidden('modify_gradient');
    } catch (e) {
      // Expected
    }

    enforcer.clearViolations();

    expect(enforcer.hasViolations()).toBe(false);
    expect(enforcer.getViolations()).toHaveLength(0);
  });

  it('detects all forbidden mutations', () => {
    FORBIDDEN_MUTATIONS.forEach((mutation) => {
      const enforcer = new BoundaryEnforcer();
      expect(() => enforcer.assertNotForbidden(mutation)).toThrow(IntegrationBoundaryViolation);
    });
  });
});

describe('IntegrationMonitor', () => {
  it('tracks payload counts', () => {
    const monitor = new IntegrationMonitor();

    monitor.recordPayload(createValidPayload({ step: 0 }));
    monitor.recordPayload(createValidPayload({ step: 1 }));
    monitor.recordPayload({ invalid: true });

    const health = monitor.getHealth();

    expect(health.payloadsReceived).toBe(3);
    expect(health.payloadsValid).toBe(2);
    expect(health.payloadsInvalid).toBe(1);
  });

  it('reports healthy when no errors', () => {
    const monitor = new IntegrationMonitor();

    monitor.recordPayload(createValidPayload());
    monitor.recordPayload(createValidPayload({ step: 1 }));

    const health = monitor.getHealth();

    expect(health.healthy).toBe(true);
  });

  it('reports unhealthy when errors exist', () => {
    const monitor = new IntegrationMonitor();

    monitor.recordPayload(createValidPayload());
    monitor.recordPayload({ invalid: true });

    const health = monitor.getHealth();

    expect(health.healthy).toBe(false);
  });

  it('tracks last payload time', () => {
    const monitor = new IntegrationMonitor();

    const before = new Date().toISOString();
    monitor.recordPayload(createValidPayload());
    const after = new Date().toISOString();

    const health = monitor.getHealth();

    expect(health.lastPayloadTime).toBeDefined();
    expect(health.lastPayloadTime! >= before).toBe(true);
    expect(health.lastPayloadTime! <= after).toBe(true);
  });

  it('can reset state', () => {
    const monitor = new IntegrationMonitor();

    monitor.recordPayload(createValidPayload());
    monitor.recordPayload({ invalid: true });
    monitor.reset();

    const health = monitor.getHealth();

    expect(health.payloadsReceived).toBe(0);
    expect(health.payloadsValid).toBe(0);
    expect(health.payloadsInvalid).toBe(0);
    expect(health.lastPayloadTime).toBeUndefined();
  });

  it('reports contract version', () => {
    const monitor = new IntegrationMonitor();
    const health = monitor.getHealth();

    expect(health.version).toBe(INTEGRATION_CONTRACT_VERSION);
  });
});

describe('Removability', () => {
  it('verifies integration is removable', () => {
    const result = verifyRemovability();

    expect(result.removable).toBe(true);
    expect(result.reason).toContain('read-only');
  });
});

describe('Contract Version', () => {
  it('has a defined version', () => {
    expect(INTEGRATION_CONTRACT_VERSION).toBe('v1');
  });
});

describe('Forbidden Mutations', () => {
  it('lists all forbidden mutations', () => {
    expect(FORBIDDEN_MUTATIONS).toContain('modify_optimizer_state');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_model_parameters');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_learning_rate');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_gradient');
    expect(FORBIDDEN_MUTATIONS).toContain('inject_regularization');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_loss');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_batch_data');
    expect(FORBIDDEN_MUTATIONS).toContain('modify_training_loop');
    expect(FORBIDDEN_MUTATIONS).toContain('call_backward');
    expect(FORBIDDEN_MUTATIONS).toContain('call_step');
  });
});
