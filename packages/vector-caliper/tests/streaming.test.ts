/**
 * Streaming Protocol Tests
 *
 * Acceptance criteria:
 * - Partial states are visually distinct from complete states
 * - No interpolation to hide latency
 * - Streaming converges to offline (when all data arrives)
 * - Missing fields are explicit, not inferred
 */

import { describe, it, expect, vi } from 'vitest';
import {
  StreamingProtocol,
  detectFieldPresence,
  hasAllRequiredFields,
  countOptionalFields,
  calculateCompleteness,
  getCompletenessIndicator,
  verifyStreamingConvergence,
  createStreamingProtocol,
  createStreamingPayload,
  CompletenessLevel,
  StreamingPayload,
  StreamingError,
  StreamUpdate,
} from '../src/integration/streaming';
import { TrainingLogEntry, ValidatedPayload } from '../src/integration/contract';

// Helper to create a complete log entry (all contract-required + all optional)
function createCompleteEntry(step: number, overrides: Partial<TrainingLogEntry> = {}): TrainingLogEntry {
  return {
    // Contract-required fields
    step,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5 - step * 0.1,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 10.0,
    // Optional fields
    accuracy: 0.8,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create a minimal entry (only contract-required fields, no optional)
// NOTE: Contract requires: step, epoch, learningRate, loss, gradientNorm, updateNorm, parameterNorm
function createMinimalEntry(step: number): TrainingLogEntry {
  return {
    step,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 10.0,
    // No optional fields (accuracy, timestamp, metadata)
  };
}

// Helper to create a partial entry (contract-required + some optional)
function createPartialEntry(step: number): TrainingLogEntry {
  return {
    // Contract-required fields
    step,
    epoch: 0,
    learningRate: 0.001,
    loss: 1.5,
    gradientNorm: 0.5,
    updateNorm: 0.01,
    parameterNorm: 10.0,
    // Some optional (accuracy present, timestamp missing)
    accuracy: 0.8,
  };
}

describe('Field Presence Detection', () => {
  describe('detectFieldPresence', () => {
    it('detects all required fields present', () => {
      const entry = createCompleteEntry(0);
      const presence = detectFieldPresence(entry);

      // Contract-required fields
      expect(presence.required.step).toBe(true);
      expect(presence.required.epoch).toBe(true);
      expect(presence.required.learningRate).toBe(true);
      expect(presence.required.loss).toBe(true);
      expect(presence.required.gradientNorm).toBe(true);
      expect(presence.required.updateNorm).toBe(true);
      expect(presence.required.parameterNorm).toBe(true);
    });

    it('detects optional fields present', () => {
      const entry = createCompleteEntry(0);
      const presence = detectFieldPresence(entry);

      // Contract-optional fields
      expect(presence.optional.accuracy).toBe(true);
      expect(presence.optional.timestamp).toBe(true);
    });

    it('detects missing optional fields', () => {
      const entry = createMinimalEntry(0);
      const presence = detectFieldPresence(entry);

      // Minimal entry has no optional fields
      expect(presence.optional.accuracy).toBe(false);
      expect(presence.optional.timestamp).toBe(false);
      expect(presence.optional.metadata).toBe(false);
    });

    it('does not infer missing fields', () => {
      const entry: Partial<TrainingLogEntry> = { step: 0 };
      const presence = detectFieldPresence(entry);

      // Missing required fields should be explicitly false
      expect(presence.required.epoch).toBe(false);
      expect(presence.required.learningRate).toBe(false);
      expect(presence.required.loss).toBe(false);
      expect(presence.required.gradientNorm).toBe(false);
      expect(presence.required.updateNorm).toBe(false);
      expect(presence.required.parameterNorm).toBe(false);
    });
  });

  describe('hasAllRequiredFields', () => {
    it('returns true when all required fields present', () => {
      const presence = detectFieldPresence(createMinimalEntry(0));
      expect(hasAllRequiredFields(presence)).toBe(true);
    });

    it('returns false when required field missing', () => {
      const presence = detectFieldPresence({ step: 0 } as TrainingLogEntry);
      expect(hasAllRequiredFields(presence)).toBe(false);
    });
  });

  describe('countOptionalFields', () => {
    it('counts present optional fields', () => {
      const complete = detectFieldPresence(createCompleteEntry(0));
      expect(countOptionalFields(complete)).toBe(2); // accuracy, timestamp

      const minimal = detectFieldPresence(createMinimalEntry(0));
      expect(countOptionalFields(minimal)).toBe(0); // no optional fields

      const partial = detectFieldPresence(createPartialEntry(0));
      expect(countOptionalFields(partial)).toBe(1); // accuracy only
    });
  });
});

describe('Completeness Calculation', () => {
  describe('calculateCompleteness', () => {
    it('returns complete when no optional fields expected', () => {
      const presence = detectFieldPresence(createMinimalEntry(0));
      const level = calculateCompleteness(presence);

      expect(level).toBe('complete');
    });

    it('returns complete when all expected optional fields present', () => {
      const presence = detectFieldPresence(createCompleteEntry(0));
      // accuracy and timestamp are contract-optional, complete entry has both
      const level = calculateCompleteness(presence, new Set(['accuracy', 'timestamp']));

      expect(level).toBe('complete');
    });

    it('returns partial when some expected optional fields present', () => {
      // Partial entry has accuracy but not timestamp
      const entry = createPartialEntry(0);
      const presence = detectFieldPresence(entry);
      const level = calculateCompleteness(presence, new Set(['accuracy', 'timestamp']));

      expect(level).toBe('partial');
    });

    it('returns minimal when no optional fields present but expected', () => {
      // Minimal entry has no optional fields
      const presence = detectFieldPresence(createMinimalEntry(0));
      const level = calculateCompleteness(presence, new Set(['accuracy']));

      expect(level).toBe('minimal');
    });
  });
});

describe('Completeness Visual Indicators', () => {
  describe('getCompletenessIndicator', () => {
    it('returns full opacity for complete', () => {
      const indicator = getCompletenessIndicator('complete');

      expect(indicator.opacity).toBe(1.0);
      expect(indicator.dashed).toBe(false);
      expect(indicator.badge).toBeNull();
      expect(indicator.interactive).toBe(true);
    });

    it('returns reduced opacity and dashed for partial', () => {
      const indicator = getCompletenessIndicator('partial');

      expect(indicator.opacity).toBe(0.7);
      expect(indicator.dashed).toBe(true);
      expect(indicator.badge).toBe('partial');
      expect(indicator.interactive).toBe(true);
    });

    it('returns low opacity and non-interactive for minimal', () => {
      const indicator = getCompletenessIndicator('minimal');

      expect(indicator.opacity).toBe(0.4);
      expect(indicator.dashed).toBe(true);
      expect(indicator.badge).toBe('minimal');
      expect(indicator.interactive).toBe(false);
    });
  });
});

describe('StreamingProtocol', () => {
  describe('Session Management', () => {
    it('creates a new session', () => {
      const protocol = createStreamingProtocol();
      const session = protocol.startSession('test-session');

      expect(session.sessionId).toBe('test-session');
      expect(session.payloads).toHaveLength(0);
      expect(session.isComplete).toBe(false);
    });

    it('prevents duplicate sessions', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      expect(() => protocol.startSession('test-session')).toThrow();
    });

    it('marks session complete', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const session = protocol.completeSession('test-session');

      expect(session.isComplete).toBe(true);
    });

    it('generates unique session IDs', () => {
      const protocol1 = createStreamingProtocol();
      const protocol2 = createStreamingProtocol();

      const session1 = protocol1.startSession();
      const session2 = protocol2.startSession();

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('Payload Reception', () => {
    it('receives valid payloads', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const result = protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
      });

      expect('completeness' in result).toBe(true);
      expect((result as StreamingPayload).completeness).toBe('complete');
    });

    it('rejects payloads without session', () => {
      const protocol = createStreamingProtocol();

      const result = protocol.receive(createCompleteEntry(0), {
        sessionId: 'nonexistent',
      });

      expect('code' in result).toBe(true);
      expect((result as StreamingError).code).toBe('session_closed');
    });

    it('rejects payloads after session complete', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');
      protocol.completeSession('test-session');

      const result = protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
      });

      expect('code' in result).toBe(true);
      expect((result as StreamingError).code).toBe('session_closed');
    });

    it('tracks sequence numbers', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const r1 = protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
        sequenceNumber: 0,
      }) as StreamingPayload;
      const r2 = protocol.receive(createCompleteEntry(1), {
        sessionId: 'test-session',
        sequenceNumber: 1,
      }) as StreamingPayload;

      expect(r1.sequenceNumber).toBe(0);
      expect(r2.sequenceNumber).toBe(1);
    });

    it('rejects duplicate sequence numbers', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
        sequenceNumber: 0,
      });

      const result = protocol.receive(createCompleteEntry(1), {
        sessionId: 'test-session',
        sequenceNumber: 0, // Duplicate
      });

      expect('code' in result).toBe(true);
      expect((result as StreamingError).code).toBe('duplicate_sequence');
    });

    it('auto-increments sequence numbers', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const r1 = protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
      }) as StreamingPayload;
      const r2 = protocol.receive(createCompleteEntry(1), {
        sessionId: 'test-session',
      }) as StreamingPayload;

      expect(r1.sequenceNumber).toBe(0);
      expect(r2.sequenceNumber).toBe(1);
    });

    it('handles terminal payloads', () => {
      const protocol = createStreamingProtocol({ autoComplete: true });
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), {
        sessionId: 'test-session',
        isTerminal: true,
      });

      const session = protocol.getSession('test-session');
      expect(session?.isComplete).toBe(true);
    });
  });

  describe('Completeness Tracking', () => {
    it('calculates completeness based on expected fields', () => {
      const protocol = createStreamingProtocol({
        // accuracy and timestamp are contract-optional fields
        expectedOptionalFields: ['accuracy', 'timestamp'],
      });
      protocol.startSession('test-session');

      // Minimal entry (missing expected optional fields)
      const minimal = protocol.receive(createMinimalEntry(0), {
        sessionId: 'test-session',
      }) as StreamingPayload;

      // Complete entry (has all expected optional fields)
      const complete = protocol.receive(createCompleteEntry(1), {
        sessionId: 'test-session',
      }) as StreamingPayload;

      expect(minimal.completeness).toBe('minimal');
      expect(complete.completeness).toBe('complete');
    });

    it('tracks field presence per payload', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const result = protocol.receive(createPartialEntry(0), {
        sessionId: 'test-session',
      }) as StreamingPayload;

      // All required fields present
      expect(result.fieldPresence.required.step).toBe(true);
      expect(result.fieldPresence.required.epoch).toBe(true);
      expect(result.fieldPresence.required.learningRate).toBe(true);
      // Partial has accuracy but not timestamp
      expect(result.fieldPresence.optional.accuracy).toBe(true);
      expect(result.fieldPresence.optional.timestamp).toBe(false);
    });
  });

  describe('Payload Retrieval', () => {
    it('retrieves all payloads', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });
      protocol.receive(createCompleteEntry(1), { sessionId: 'test-session' });
      protocol.receive(createCompleteEntry(2), { sessionId: 'test-session' });

      const payloads = protocol.getPayloads('test-session');
      expect(payloads).toHaveLength(3);
    });

    it('retrieves payloads by completeness', () => {
      const protocol = createStreamingProtocol({
        // accuracy is contract-optional
        expectedOptionalFields: ['accuracy'],
      });
      protocol.startSession('test-session');

      // Minimal entries have no optional fields
      protocol.receive(createMinimalEntry(0), { sessionId: 'test-session' });
      // Complete entry has accuracy
      protocol.receive(createCompleteEntry(1), { sessionId: 'test-session' });
      protocol.receive(createMinimalEntry(2), { sessionId: 'test-session' });

      const complete = protocol.getPayloadsByCompleteness('complete', 'test-session');
      const minimal = protocol.getPayloadsByCompleteness('minimal', 'test-session');

      expect(complete).toHaveLength(1);
      expect(minimal).toHaveLength(2);
    });

    it('checks if fully complete', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });
      protocol.receive(createCompleteEntry(1), { sessionId: 'test-session' });

      expect(protocol.isFullyComplete('test-session')).toBe(true);
    });

    it('detects incomplete sessions', () => {
      const protocol = createStreamingProtocol({
        // accuracy is contract-optional
        expectedOptionalFields: ['accuracy'],
      });
      protocol.startSession('test-session');

      // Complete entry has accuracy
      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });
      // Minimal entry does not have accuracy
      protocol.receive(createMinimalEntry(1), { sessionId: 'test-session' });

      expect(protocol.isFullyComplete('test-session')).toBe(false);
    });
  });

  describe('Event Subscription', () => {
    it('emits session_start events', () => {
      const protocol = createStreamingProtocol();
      const listener = vi.fn();

      protocol.subscribe(listener);
      protocol.startSession('test-session');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session_start',
          session: expect.objectContaining({ sessionId: 'test-session' }),
        })
      );
    });

    it('emits payload events', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const listener = vi.fn();
      protocol.subscribe(listener);

      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payload',
          payload: expect.objectContaining({ sequenceNumber: 0 }),
        })
      );
    });

    it('emits session_end events', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      const listener = vi.fn();
      protocol.subscribe(listener);

      protocol.completeSession('test-session');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session_end',
          session: expect.objectContaining({ isComplete: true }),
        })
      );
    });

    it('emits error events', () => {
      const protocol = createStreamingProtocol();
      const listener = vi.fn();

      protocol.subscribe(listener);
      protocol.receive(createCompleteEntry(0), { sessionId: 'nonexistent' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({ code: 'session_closed' }),
        })
      );
    });

    it('allows unsubscription', () => {
      const protocol = createStreamingProtocol();
      const listener = vi.fn();

      const unsubscribe = protocol.subscribe(listener);
      unsubscribe();

      protocol.startSession('test-session');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Offline Conversion', () => {
    it('converts complete session to offline format', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });
      protocol.receive(createCompleteEntry(1), { sessionId: 'test-session' });
      protocol.completeSession('test-session');

      const offline = protocol.toOfflineFormat('test-session');

      expect(offline).toHaveLength(2);
      expect(offline[0].valid).toBe(true);
      expect(offline[0].payload.step).toBe(0);
    });

    it('throws for incomplete session', () => {
      const protocol = createStreamingProtocol();
      protocol.startSession('test-session');

      protocol.receive(createCompleteEntry(0), { sessionId: 'test-session' });

      expect(() => protocol.toOfflineFormat('test-session')).toThrow(
        'Cannot convert incomplete session'
      );
    });
  });
});

// Helper for creating complete validated payloads (all contract-required fields)
function createValidatedPayload(overrides: Partial<ValidatedPayload['payload']> = {}): ValidatedPayload {
  return {
    valid: true,
    payload: {
      step: 0,
      epoch: 0,
      learningRate: 0.001,
      loss: 1.5,
      gradientNorm: 0.5,
      updateNorm: 0.01,
      parameterNorm: 10.0,
      source: 'test',
      contractVersion: 'v1',
      ...overrides,
    },
    errors: [],
  };
}

describe('Streaming Convergence', () => {
  describe('verifyStreamingConvergence', () => {
    it('verifies convergence for matching data', () => {
      const streamed: StreamingPayload[] = [
        createStreamingPayload(createValidatedPayload({ step: 0 }), 0),
      ];

      const offline: ValidatedPayload[] = [
        createValidatedPayload({ step: 0 }),
      ];

      const result = verifyStreamingConvergence(streamed, offline);

      expect(result.converged).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('detects differences in field values', () => {
      const streamed: StreamingPayload[] = [
        createStreamingPayload(createValidatedPayload({ step: 0, loss: 1.5 }), 0),
      ];

      const offline: ValidatedPayload[] = [
        createValidatedPayload({ step: 0, loss: 1.6 }), // Different!
      ];

      const result = verifyStreamingConvergence(streamed, offline);

      expect(result.converged).toBe(false);
      expect(result.differences).toHaveLength(1);
      expect(result.differences[0].field).toBe('loss');
    });

    it('detects length differences', () => {
      const streamed: StreamingPayload[] = [
        createStreamingPayload(createValidatedPayload({ step: 0 }), 0),
      ];

      const offline: ValidatedPayload[] = []; // Empty!

      const result = verifyStreamingConvergence(streamed, offline);

      expect(result.converged).toBe(false);
      expect(result.differences[0].field).toBe('length');
    });

    it('only compares complete payloads', () => {
      // Create a complete payload and force its completeness to partial
      const partialPayload = createStreamingPayload(
        createValidatedPayload({ step: 0, loss: 999 }), // Different value
        0
      );
      // Override completeness to partial
      const partial = { ...partialPayload, completeness: 'partial' as CompletenessLevel };

      // Create another complete payload
      const complete = createStreamingPayload(
        createValidatedPayload({ step: 1, loss: 1.5 }),
        1
      );

      const streamed = [partial, complete];

      const offline: ValidatedPayload[] = [
        createValidatedPayload({ step: 1, loss: 1.5 }),
      ];

      // Should only compare the complete payload
      const result = verifyStreamingConvergence(streamed, offline);

      expect(result.converged).toBe(true);
    });
  });
});

describe('Factory Functions', () => {
  describe('createStreamingProtocol', () => {
    it('creates protocol with default config', () => {
      const protocol = createStreamingProtocol();
      expect(protocol).toBeDefined();
    });

    it('creates protocol with custom config', () => {
      const protocol = createStreamingProtocol({
        // accuracy is a contract-optional field
        expectedOptionalFields: ['accuracy'],
        autoComplete: false,
      });

      protocol.startSession('test');
      protocol.receive(createCompleteEntry(0), {
        sessionId: 'test',
        isTerminal: true,
      });

      // autoComplete is false, so session should still be incomplete
      expect(protocol.getSession('test')?.isComplete).toBe(false);
    });
  });

  describe('createStreamingPayload', () => {
    it('creates streaming payload from validated payload', () => {
      const validated = createValidatedPayload({ step: 0 });

      const streaming = createStreamingPayload(validated, 5, true);

      expect(streaming.sequenceNumber).toBe(5);
      expect(streaming.isTerminal).toBe(true);
      expect(streaming.payload).toBe(validated.payload);
    });
  });
});

describe('No Interpolation Guarantee', () => {
  it('does not interpolate between payloads', () => {
    const protocol = createStreamingProtocol();
    protocol.startSession('test-session');

    // Receive payloads with gaps
    protocol.receive(createCompleteEntry(0, { loss: 1.0 }), {
      sessionId: 'test-session',
      sequenceNumber: 0,
    });
    protocol.receive(createCompleteEntry(10, { loss: 0.5 }), {
      sessionId: 'test-session',
      sequenceNumber: 10,
    });

    const payloads = protocol.getPayloads('test-session');

    // Should only have 2 payloads, not interpolated values
    expect(payloads).toHaveLength(2);
    expect(payloads[0].payload.step).toBe(0);
    expect(payloads[1].payload.step).toBe(10);
    // No payloads for steps 1-9
  });

  it('does not infer missing optional field values', () => {
    const protocol = createStreamingProtocol({
      // accuracy is a contract-optional field
      expectedOptionalFields: ['accuracy'],
    });
    protocol.startSession('test-session');

    // Receive entry without accuracy (minimal entry)
    const result = protocol.receive(createMinimalEntry(0), {
      sessionId: 'test-session',
    }) as StreamingPayload;

    // accuracy should be undefined, not inferred
    expect(result.payload.accuracy).toBeUndefined();
    expect(result.fieldPresence.optional.accuracy).toBe(false);
  });
});

describe('Validation Integration', () => {
  it('rejects invalid payloads', () => {
    const protocol = createStreamingProtocol();
    protocol.startSession('test-session');

    // Invalid: negative loss
    const result = protocol.receive(
      { ...createCompleteEntry(0), loss: -1 },
      { sessionId: 'test-session' }
    );

    expect('code' in result).toBe(true);
    expect((result as StreamingError).code).toBe('invalid_field_value');
  });
});
