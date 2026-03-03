/**
 * VectorCaliper - Error Formatting
 *
 * Consistent, user-friendly error messages.
 * No "health" or "quality" language.
 * Messages describe what happened, not what it means.
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error for VectorCaliper
 */
export class VectorCaliperError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'VectorCaliperError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validation error - invalid state data
 */
export class StateValidationError extends VectorCaliperError {
  constructor(message: string, path: string, value: unknown) {
    super(message, 'VALIDATION_ERROR', { path, value });
    this.name = 'StateValidationError';
  }
}

/**
 * Budget error - resource limits exceeded
 */
export class BudgetExceededError extends VectorCaliperError {
  constructor(
    message: string,
    resource: 'memory' | 'states' | 'render_time',
    limit: number,
    actual: number
  ) {
    super(message, 'BUDGET_EXCEEDED', { resource, limit, actual });
    this.name = 'BudgetExceededError';
  }
}

/**
 * Scale error - operation not available at this scale
 */
export class ScaleRestrictedError extends VectorCaliperError {
  constructor(operation: string, scaleClass: string) {
    super(
      `Operation '${operation}' is disabled for scale class '${scaleClass}'`,
      'SCALE_RESTRICTED',
      { operation, scaleClass }
    );
    this.name = 'ScaleRestrictedError';
  }
}

/**
 * Render error - rendering failed
 */
export class RenderError extends VectorCaliperError {
  constructor(message: string, renderer: string, details?: Record<string, unknown>) {
    super(message, 'RENDER_ERROR', { renderer, ...details });
    this.name = 'RenderError';
  }
}

/**
 * Stream error - streaming protocol error
 */
export class StreamError extends VectorCaliperError {
  constructor(message: string, sessionId?: string) {
    super(message, 'STREAM_ERROR', { sessionId });
    this.name = 'StreamError';
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format error for user display
 */
export function formatError(error: unknown): string {
  if (error instanceof VectorCaliperError) {
    return formatVectorCaliperError(error);
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Unknown error: ${String(error)}`;
}

/**
 * Format VectorCaliperError with details
 */
function formatVectorCaliperError(error: VectorCaliperError): string {
  const lines: string[] = [`[${error.code}] ${error.message}`];

  if (error.details) {
    const details = Object.entries(error.details)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `  ${k}: ${formatValue(v)}`)
      .join('\n');

    if (details) {
      lines.push(details);
    }
  }

  return lines.join('\n');
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(4);
  }
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ============================================================================
// User-Friendly Messages
// ============================================================================

/**
 * Standard messages for common situations
 */
export const MESSAGES = {
  // Budget messages
  BUDGET_EXCEEDED_STATES: (actual: number, limit: number) =>
    `Cannot load ${actual.toLocaleString()} states. Maximum is ${limit.toLocaleString()}.`,

  BUDGET_EXCEEDED_MEMORY: (actual: string, limit: string) =>
    `Memory usage (${actual}) exceeds budget (${limit}).`,

  BUDGET_SUGGESTION_REDUCE_STATES:
    'Reduce the number of captured states or sample your data before loading.',

  BUDGET_SUGGESTION_SIMPLIFY:
    'Simplify captured data or reduce visualization complexity.',

  // Scale messages
  SCALE_AUTOPLAY_DISABLED: (scaleClass: string) =>
    `Autoplay is disabled for ${scaleClass} runs.`,

  SCALE_SELECTION_DISABLED: (scaleClass: string) =>
    `Selection is disabled for ${scaleClass} runs.`,

  SCALE_DEGRADED_FPS: (fps: number) =>
    `Target framerate is ${fps}fps for this run size.`,

  // Validation messages
  VALIDATION_NAN: (path: string) =>
    `Value at '${path}' is NaN. All values must be finite numbers.`,

  VALIDATION_OUT_OF_RANGE: (path: string, value: number, min: number, max: number) =>
    `Value ${value} at '${path}' is outside range [${min}, ${max}].`,

  VALIDATION_NON_MONOTONIC: (path: string, prev: number, curr: number) =>
    `Time values must increase. Found ${prev} followed by ${curr} at '${path}'.`,

  VALIDATION_DUPLICATE_ID: (id: string) =>
    `Duplicate state ID: '${id}'. All state IDs must be unique.`,

  // Render messages
  RENDER_WEBGL_UNAVAILABLE:
    'WebGL is not available. Using Canvas2D fallback.',

  RENDER_NO_BACKEND:
    'No rendering backend available. Check browser compatibility.',

  RENDER_TIMEOUT: (ms: number) =>
    `Render exceeded time budget (${ms}ms). Consider reducing state count.`,

  // Stream messages
  STREAM_DISCONNECTED:
    'Connection lost. Displaying partial trajectory (marked as incomplete).',

  STREAM_LATE_DATA:
    'Late-arriving data appended. States are shown in arrival order.',

  // Progressive render messages
  PROGRESSIVE_SUBSET: (shown: number, total: number, strategy: string) =>
    `Showing ${shown.toLocaleString()} of ${total.toLocaleString()} states (${strategy} selection).`,

  PROGRESSIVE_COARSE:
    'Coarse view: not all states are rendered.',

  // General
  OPERATION_CANCELLED:
    'Operation cancelled.',

  LOADING: (percent: number) =>
    `Loading... ${percent}%`,
} as const;

// ============================================================================
// Console Helpers
// ============================================================================

/**
 * Console prefix for VectorCaliper messages
 */
const PREFIX = '[VectorCaliper]';

/**
 * Log info message
 */
export function logInfo(message: string): void {
  console.log(`${PREFIX} ${message}`);
}

/**
 * Log warning message
 */
export function logWarning(message: string): void {
  console.warn(`${PREFIX} ⚠ ${message}`);
}

/**
 * Log error message
 */
export function logError(error: unknown): void {
  console.error(`${PREFIX} ✗ ${formatError(error)}`);
}

/**
 * Log success message
 */
export function logSuccess(message: string): void {
  console.log(`${PREFIX} ✓ ${message}`);
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    if (data !== undefined) {
      console.debug(`${PREFIX} [debug] ${message}`, data);
    } else {
      console.debug(`${PREFIX} [debug] ${message}`);
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { VectorCaliperError as ErrorType };
