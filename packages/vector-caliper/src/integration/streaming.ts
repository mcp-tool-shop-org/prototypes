/**
 * Streaming Protocol with Partial-State Semantics
 *
 * Core principles:
 * - Partial states are visually distinct from complete states
 * - No interpolation to hide latency
 * - Streaming converges to offline (when all data arrives)
 * - Missing fields are explicit, not inferred
 */

import {
  TrainingLogEntry,
  ValidatedPayload,
  RequiredFields,
  OptionalFields,
  ContractValidator,
  INTEGRATION_CONTRACT_VERSION,
} from './contract';

// ============================================================================
// Types
// ============================================================================

/**
 * Streaming state completeness levels
 */
export type CompletenessLevel =
  | 'minimal'    // Only required fields present
  | 'partial'    // Some optional fields present
  | 'complete';  // All expected fields present

/**
 * Field presence tracking
 * NOTE: Matches contract.ts RequiredFields and OptionalFields exactly
 */
export interface FieldPresence {
  /** Contract-required fields (must all be present for valid payload) */
  readonly required: {
    readonly step: boolean;
    readonly epoch: boolean;
    readonly learningRate: boolean;
    readonly loss: boolean;
    readonly gradientNorm: boolean;
    readonly updateNorm: boolean;
    readonly parameterNorm: boolean;
  };
  /** Contract-optional fields (enhance analysis but not required) */
  readonly optional: {
    readonly accuracy: boolean;
    readonly momentumAlignment: boolean;
    readonly batchEntropy: boolean;
    readonly calibration: boolean;
    readonly metadata: boolean;
    readonly timestamp: boolean;
  };
}

/**
 * Streaming payload with completeness metadata
 */
export interface StreamingPayload {
  readonly payload: ValidatedPayload['payload'];
  readonly completeness: CompletenessLevel;
  readonly fieldPresence: FieldPresence;
  readonly arrivalTime: string;
  readonly sequenceNumber: number;
  readonly isTerminal: boolean;
}

/**
 * Streaming session state
 */
export interface StreamingSession {
  readonly sessionId: string;
  readonly startTime: string;
  readonly payloads: StreamingPayload[];
  readonly expectedFields: Set<keyof (RequiredFields & OptionalFields)>;
  readonly isComplete: boolean;
}

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  /** Expected optional fields (affects completeness calculation) */
  readonly expectedOptionalFields?: (keyof OptionalFields)[];
  /** Session ID for grouping payloads */
  readonly sessionId?: string;
  /** Whether to mark session complete on first terminal payload */
  readonly autoComplete?: boolean;
}

/**
 * Stream update event
 */
export interface StreamUpdate {
  readonly type: 'payload' | 'session_start' | 'session_end' | 'error';
  readonly payload?: StreamingPayload;
  readonly session?: StreamingSession;
  readonly error?: StreamingError;
}

/**
 * Streaming error
 */
export interface StreamingError {
  readonly code: StreamingErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly sequenceNumber?: number;
}

export type StreamingErrorCode =
  | 'missing_required_field'
  | 'invalid_field_value'
  | 'out_of_order'
  | 'duplicate_sequence'
  | 'session_closed';

// ============================================================================
// Field Presence Detection
// ============================================================================

/**
 * Detect which fields are present in a log entry
 * No inference — only explicit presence
 * NOTE: Matches contract.ts RequiredFields and OptionalFields
 */
export function detectFieldPresence(entry: Partial<TrainingLogEntry>): FieldPresence {
  return {
    required: {
      step: entry.step !== undefined,
      epoch: entry.epoch !== undefined,
      learningRate: entry.learningRate !== undefined,
      loss: entry.loss !== undefined,
      gradientNorm: entry.gradientNorm !== undefined,
      updateNorm: entry.updateNorm !== undefined,
      parameterNorm: entry.parameterNorm !== undefined,
    },
    optional: {
      accuracy: entry.accuracy !== undefined,
      momentumAlignment: (entry as any).momentumAlignment !== undefined,
      batchEntropy: (entry as any).batchEntropy !== undefined,
      calibration: (entry as any).calibration !== undefined,
      metadata: entry.metadata !== undefined,
      timestamp: entry.timestamp !== undefined,
    },
  };
}

/**
 * Check if all required fields are present (per contract)
 */
export function hasAllRequiredFields(presence: FieldPresence): boolean {
  return (
    presence.required.step &&
    presence.required.epoch &&
    presence.required.learningRate &&
    presence.required.loss &&
    presence.required.gradientNorm &&
    presence.required.updateNorm &&
    presence.required.parameterNorm
  );
}

/**
 * Count present optional fields
 */
export function countOptionalFields(presence: FieldPresence): number {
  return Object.values(presence.optional).filter(Boolean).length;
}

/**
 * Calculate completeness level based on field presence and expected fields
 */
export function calculateCompleteness(
  presence: FieldPresence,
  expectedOptionalFields: Set<keyof OptionalFields> = new Set()
): CompletenessLevel {
  if (!hasAllRequiredFields(presence)) {
    // This shouldn't happen for valid entries, but handle gracefully
    return 'minimal';
  }

  if (expectedOptionalFields.size === 0) {
    // No optional fields expected — complete if required present
    return 'complete';
  }

  // Check if all expected optional fields are present
  const allExpectedPresent = Array.from(expectedOptionalFields).every(
    (field) => presence.optional[field]
  );

  if (allExpectedPresent) {
    return 'complete';
  }

  // Some optional fields present but not all expected
  if (countOptionalFields(presence) > 0) {
    return 'partial';
  }

  return 'minimal';
}

// ============================================================================
// Streaming Protocol
// ============================================================================

/**
 * Streaming protocol handler
 *
 * Manages streaming payloads with explicit partial-state semantics.
 * No interpolation, no inference, no hiding of incomplete data.
 */
export class StreamingProtocol {
  private sessions: Map<string, StreamingSessionInternal> = new Map();
  private readonly config: Required<StreamingConfig>;
  private readonly validator: ContractValidator;
  private listeners: Set<(update: StreamUpdate) => void> = new Set();

  constructor(config: StreamingConfig = {}) {
    this.config = {
      expectedOptionalFields: config.expectedOptionalFields ?? [],
      sessionId: config.sessionId ?? this.generateSessionId(),
      autoComplete: config.autoComplete ?? true,
    };
    this.validator = new ContractValidator();
  }

  /**
   * Start a new streaming session
   */
  startSession(sessionId?: string): StreamingSession {
    const id = sessionId ?? this.config.sessionId;

    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`);
    }

    const session: StreamingSessionInternal = {
      sessionId: id,
      startTime: new Date().toISOString(),
      payloads: [],
      expectedFields: new Set([
        'step', 'loss', 'gradientNorm', 'parameterNorm',
        ...this.config.expectedOptionalFields,
      ]),
      isComplete: false,
      nextSequence: 0,
      seenSequences: new Set(),
    };

    this.sessions.set(id, session);

    const publicSession = this.toPublicSession(session);
    this.emit({ type: 'session_start', session: publicSession });

    return publicSession;
  }

  /**
   * Receive a streaming payload
   */
  receive(
    entry: TrainingLogEntry,
    options: {
      sessionId?: string;
      isTerminal?: boolean;
      sequenceNumber?: number;
    } = {}
  ): StreamingPayload | StreamingError {
    const sessionId = options.sessionId ?? this.config.sessionId;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return this.createError(
        'session_closed',
        `Session ${sessionId} not found. Call startSession() first.`
      );
    }

    if (session.isComplete) {
      return this.createError(
        'session_closed',
        `Session ${sessionId} is already complete.`
      );
    }

    // Validate the entry
    const validated = this.validator.validate({
      ...entry,
      source: entry.source ?? 'streaming',
      contractVersion: INTEGRATION_CONTRACT_VERSION,
    });

    if (!validated.valid) {
      const error = validated.errors[0];
      return this.createError(
        'invalid_field_value',
        error.message,
        error.field,
        options.sequenceNumber
      );
    }

    // Handle sequence numbers
    const sequenceNumber = options.sequenceNumber ?? session.nextSequence;

    if (session.seenSequences.has(sequenceNumber)) {
      return this.createError(
        'duplicate_sequence',
        `Sequence number ${sequenceNumber} already received.`,
        undefined,
        sequenceNumber
      );
    }

    // Detect field presence and completeness
    const fieldPresence = detectFieldPresence(entry);
    const completeness = calculateCompleteness(
      fieldPresence,
      new Set(this.config.expectedOptionalFields)
    );

    // Create streaming payload
    const streamingPayload: StreamingPayload = {
      payload: validated.payload,
      completeness,
      fieldPresence,
      arrivalTime: new Date().toISOString(),
      sequenceNumber,
      isTerminal: options.isTerminal ?? false,
    };

    // Update session state
    session.payloads.push(streamingPayload);
    session.seenSequences.add(sequenceNumber);
    session.nextSequence = Math.max(session.nextSequence, sequenceNumber + 1);

    // Check for session completion
    if (options.isTerminal && this.config.autoComplete) {
      session.isComplete = true;
      this.emit({
        type: 'session_end',
        session: this.toPublicSession(session),
      });
    }

    this.emit({ type: 'payload', payload: streamingPayload });

    return streamingPayload;
  }

  /**
   * Mark a session as complete
   */
  completeSession(sessionId?: string): StreamingSession {
    const id = sessionId ?? this.config.sessionId;
    const session = this.sessions.get(id);

    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    session.isComplete = true;
    const publicSession = this.toPublicSession(session);

    this.emit({ type: 'session_end', session: publicSession });

    return publicSession;
  }

  /**
   * Get current session state
   */
  getSession(sessionId?: string): StreamingSession | undefined {
    const id = sessionId ?? this.config.sessionId;
    const session = this.sessions.get(id);
    return session ? this.toPublicSession(session) : undefined;
  }

  /**
   * Get all payloads for a session
   */
  getPayloads(sessionId?: string): readonly StreamingPayload[] {
    const id = sessionId ?? this.config.sessionId;
    const session = this.sessions.get(id);
    return session ? [...session.payloads] : [];
  }

  /**
   * Get payloads filtered by completeness
   */
  getPayloadsByCompleteness(
    level: CompletenessLevel,
    sessionId?: string
  ): readonly StreamingPayload[] {
    return this.getPayloads(sessionId).filter(
      (p) => p.completeness === level
    );
  }

  /**
   * Check if all payloads in a session are complete
   */
  isFullyComplete(sessionId?: string): boolean {
    const payloads = this.getPayloads(sessionId);
    return (
      payloads.length > 0 &&
      payloads.every((p) => p.completeness === 'complete')
    );
  }

  /**
   * Subscribe to stream updates
   */
  subscribe(listener: (update: StreamUpdate) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Convert streaming session to offline trajectory format
   * Only works if session is complete
   */
  toOfflineFormat(sessionId?: string): ValidatedPayload[] {
    const session = this.getSession(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isComplete) {
      throw new Error('Cannot convert incomplete session to offline format');
    }

    return session.payloads.map((p) => ({
      valid: true as const,
      payload: p.payload,
      errors: [] as never[],
      warnings: [] as never[],
    }));
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private generateSessionId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private toPublicSession(session: StreamingSessionInternal): StreamingSession {
    return {
      sessionId: session.sessionId,
      startTime: session.startTime,
      payloads: [...session.payloads],
      expectedFields: new Set(session.expectedFields),
      isComplete: session.isComplete,
    };
  }

  private createError(
    code: StreamingErrorCode,
    message: string,
    field?: string,
    sequenceNumber?: number
  ): StreamingError {
    const error: StreamingError = { code, message, field, sequenceNumber };
    this.emit({ type: 'error', error });
    return error;
  }

  private emit(update: StreamUpdate): void {
    for (const listener of this.listeners) {
      try {
        listener(update);
      } catch {
        // Listeners should not throw, but don't let one break others
      }
    }
  }
}

/**
 * Internal session state with mutable tracking
 */
interface StreamingSessionInternal {
  sessionId: string;
  startTime: string;
  payloads: StreamingPayload[];
  expectedFields: Set<keyof (RequiredFields & OptionalFields)>;
  isComplete: boolean;
  nextSequence: number;
  seenSequences: Set<number>;
}

// ============================================================================
// Partial State Visual Indicators
// ============================================================================

/**
 * Visual indicator for streaming state completeness
 *
 * Used by visualization layer to render partial states distinctly.
 * No interpolation — partial states look partial.
 */
export interface CompletenessVisualIndicator {
  /** Opacity multiplier (1.0 = complete, lower = incomplete) */
  readonly opacity: number;
  /** Whether to show dashed outline */
  readonly dashed: boolean;
  /** Badge text to show (e.g., "partial", "minimal") */
  readonly badge: string | null;
  /** Whether the state can be selected/compared */
  readonly interactive: boolean;
}

/**
 * Get visual indicator for a completeness level
 */
export function getCompletenessIndicator(
  level: CompletenessLevel
): CompletenessVisualIndicator {
  switch (level) {
    case 'complete':
      return {
        opacity: 1.0,
        dashed: false,
        badge: null,
        interactive: true,
      };
    case 'partial':
      return {
        opacity: 0.7,
        dashed: true,
        badge: 'partial',
        interactive: true,
      };
    case 'minimal':
      return {
        opacity: 0.4,
        dashed: true,
        badge: 'minimal',
        interactive: false,
      };
  }
}

// ============================================================================
// Convergence Verification
// ============================================================================

/**
 * Verify that streamed data matches offline format
 *
 * Core guarantee: offline = streamed (when data complete)
 */
export function verifyStreamingConvergence(
  streamed: StreamingPayload[],
  offline: ValidatedPayload[]
): {
  converged: boolean;
  differences: Array<{
    index: number;
    field: string;
    streamed: unknown;
    offline: unknown;
  }>;
} {
  const differences: Array<{
    index: number;
    field: string;
    streamed: unknown;
    offline: unknown;
  }> = [];

  // Only compare complete payloads
  const completeStreamed = streamed.filter((p) => p.completeness === 'complete');

  if (completeStreamed.length !== offline.length) {
    return {
      converged: false,
      differences: [{
        index: -1,
        field: 'length',
        streamed: completeStreamed.length,
        offline: offline.length,
      }],
    };
  }

  for (let i = 0; i < completeStreamed.length; i++) {
    const s = completeStreamed[i].payload;
    const o = offline[i].payload;

    // Compare each field (excluding arrival-time metadata)
    const fields = [
      'step', 'epoch', 'loss', 'gradientNorm', 'parameterNorm',
      'updateNorm', 'learningRate', 'accuracy', 'source',
    ] as const;

    for (const field of fields) {
      const sVal = s?.[field];
      const oVal = o?.[field];

      if (sVal !== oVal) {
        differences.push({
          index: i,
          field,
          streamed: sVal,
          offline: oVal,
        });
      }
    }
  }

  return {
    converged: differences.length === 0,
    differences,
  };
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a streaming protocol instance with default config
 */
export function createStreamingProtocol(
  config?: StreamingConfig
): StreamingProtocol {
  return new StreamingProtocol(config);
}

/**
 * Create a streaming payload from a validated payload
 * Useful for converting existing data to streaming format
 */
export function createStreamingPayload(
  validated: ValidatedPayload,
  sequenceNumber: number,
  isTerminal: boolean = false,
  expectedOptionalFields: (keyof OptionalFields)[] = []
): StreamingPayload {
  const p = validated.payload!;
  const entry: Partial<TrainingLogEntry> = {
    step: p.step,
    epoch: p.epoch,
    loss: p.loss,
    gradientNorm: p.gradientNorm,
    parameterNorm: p.parameterNorm,
    updateNorm: p.updateNorm,
    learningRate: p.learningRate,
    accuracy: p.accuracy,
    timestamp: p.timestamp,
    metadata: p.metadata,
  };

  const fieldPresence = detectFieldPresence(entry);
  const completeness = calculateCompleteness(
    fieldPresence,
    new Set(expectedOptionalFields)
  );

  return {
    payload: validated.payload,
    completeness,
    fieldPresence,
    arrivalTime: new Date().toISOString(),
    sequenceNumber,
    isTerminal,
  };
}
