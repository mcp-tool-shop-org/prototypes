/**
 * Structured Error Shape — shipcheck gate B1.
 *
 * Every user-facing error has: code, message, hint, cause?, retryable?
 * Exit codes: 0 ok, 1 user error, 2 runtime error
 */

export interface StructuredError {
  code: string;
  message: string;
  hint: string;
  cause?: string;
  retryable?: boolean;
}

export class TutorError extends Error {
  readonly code: string;
  readonly hint: string;
  readonly cause_detail?: string;
  readonly retryable: boolean;
  readonly exitCode: number;

  constructor(opts: {
    code: string;
    message: string;
    hint: string;
    cause?: string;
    retryable?: boolean;
    exitCode?: number;
  }) {
    super(opts.message);
    this.name = 'TutorError';
    this.code = opts.code;
    this.hint = opts.hint;
    this.cause_detail = opts.cause;
    this.retryable = opts.retryable ?? false;
    this.exitCode = opts.exitCode ?? 1;
  }

  toJSON(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      ...(this.cause_detail ? { cause: this.cause_detail } : {}),
      retryable: this.retryable,
    };
  }
}

// ── Error Factories ──────────────────────────────────────────────

export function lessonNotFound(id: string): TutorError {
  return new TutorError({
    code: 'INPUT_LESSON_NOT_FOUND',
    message: `Lesson not found: ${id}`,
    hint: 'Run "terminal-tutor list" to see available lessons.',
    exitCode: 1,
  });
}

export function trackNotFound(id: string): TutorError {
  return new TutorError({
    code: 'INPUT_TRACK_NOT_FOUND',
    message: `Track not found: ${id}`,
    hint: 'Run "terminal-tutor tracks" to see available tracks.',
    exitCode: 1,
  });
}

export function runtimeUnavailable(type: string, remedy: string): TutorError {
  return new TutorError({
    code: 'DEP_RUNTIME_UNAVAILABLE',
    message: `Runtime "${type}" is not available on this system.`,
    hint: remedy,
    exitCode: 2,
    retryable: true,
  });
}

export function parseError(path: string, reason: string): TutorError {
  return new TutorError({
    code: 'INPUT_PARSE_ERROR',
    message: `Invalid lesson ${path}: ${reason}`,
    hint: 'Check the lesson YAML for syntax errors.',
    exitCode: 1,
  });
}

export function invalidArgument(usage: string): TutorError {
  return new TutorError({
    code: 'INPUT_INVALID_ARGUMENT',
    message: `Missing or invalid argument.`,
    hint: `Usage: ${usage}`,
    exitCode: 1,
  });
}

export function noActiveSession(lessonId: string): TutorError {
  return new TutorError({
    code: 'STATE_NO_SESSION',
    message: `No active session for ${lessonId}.`,
    hint: 'Start the lesson first with "terminal-tutor start <lesson-id>".',
    exitCode: 1,
  });
}

/**
 * Handle an error and exit with the appropriate code.
 * In debug mode (--debug flag), prints stack trace.
 * In normal mode, prints structured JSON.
 */
export function handleError(err: unknown, debug = false): never {
  if (err instanceof TutorError) {
    if (debug) {
      console.error(JSON.stringify(err.toJSON(), null, 2));
      console.error(err.stack);
    } else {
      console.error(JSON.stringify(err.toJSON()));
    }
    process.exit(err.exitCode);
  }

  // Unknown error — runtime error (exit code 2)
  const message = err instanceof Error ? err.message : String(err);
  const structured: StructuredError = {
    code: 'RUNTIME_UNKNOWN',
    message,
    hint: 'Run with --debug for more details.',
    retryable: false,
  };

  if (debug) {
    console.error(JSON.stringify(structured, null, 2));
    if (err instanceof Error) console.error(err.stack);
  } else {
    console.error(JSON.stringify(structured));
  }
  process.exit(2);
}
