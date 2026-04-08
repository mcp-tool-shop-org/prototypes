/**
 * Structured error handling for claude-sfx.
 *
 * Error contract (Shipcheck Tier 1):
 *   { code, message, hint, cause?, retryable? }
 *
 * Exit codes (CLI):
 *   0 = ok
 *   1 = user error (bad input, missing args, invalid config)
 *   2 = runtime error (IO failure, audio subsystem, unexpected crash)
 */

export const EXIT_OK = 0;
export const EXIT_USER = 1;
export const EXIT_RUNTIME = 2;

/** Error codes — namespaced, stable once released. */
export type ErrorCode =
  | "INPUT_MISSING_VERB"
  | "INPUT_UNKNOWN_VERB"
  | "INPUT_INVALID_STATUS"
  | "INPUT_INVALID_SCOPE"
  | "INPUT_INVALID_DIRECTION"
  | "INPUT_INVALID_VOLUME"
  | "INPUT_MISSING_ARG"
  | "INPUT_UNKNOWN_COMMAND"
  | "CONFIG_INVALID_KEY"
  | "CONFIG_INVALID_VALUE"
  | "CONFIG_PROFILE_NOT_FOUND"
  | "IO_AUDIO_FAILED"
  | "IO_CONFIG_WRITE"
  | "RUNTIME_UNEXPECTED";

export class SfxError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;
  readonly retryable: boolean;

  constructor(opts: {
    code: ErrorCode;
    message: string;
    hint?: string;
    cause?: Error;
    retryable?: boolean;
  }) {
    super(opts.message);
    this.name = "SfxError";
    this.code = opts.code;
    this.hint = opts.hint;
    this.cause = opts.cause;
    this.retryable = opts.retryable ?? false;
  }

  /** Format for CLI output (user-facing). */
  toUserString(): string {
    let out = `Error [${this.code}]: ${this.message}`;
    if (this.hint) out += `\n  Hint: ${this.hint}`;
    return out;
  }
}

/**
 * Print an SfxError to stderr and return the appropriate exit code.
 * For generic errors, wraps them in a RUNTIME_UNEXPECTED SfxError.
 */
export function handleError(err: unknown, debug: boolean): number {
  if (err instanceof SfxError) {
    console.error(`  ${err.toUserString()}`);
    if (debug && err.cause) {
      console.error("\n  Stack trace:");
      console.error(`  ${(err.cause as Error).stack ?? err.cause}`);
    }
    return err.code.startsWith("INPUT_") || err.code.startsWith("CONFIG_")
      ? EXIT_USER
      : EXIT_RUNTIME;
  }

  // Unexpected error — wrap and display
  const message = err instanceof Error ? err.message : String(err);
  console.error(`  Error [RUNTIME_UNEXPECTED]: ${message}`);
  console.error("  Hint: This is an unexpected error. Run with --debug for details.");
  if (debug && err instanceof Error && err.stack) {
    console.error("\n  Stack trace:");
    console.error(`  ${err.stack}`);
  }
  return EXIT_RUNTIME;
}
