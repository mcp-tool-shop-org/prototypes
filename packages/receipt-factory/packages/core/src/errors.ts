/**
 * Structured error for all rf packages.
 * Follows Shipcheck Tier 1+ error contract.
 */
export class RfError extends Error {
  readonly code: string;
  readonly hint?: string;
  override readonly cause?: Error;
  readonly retryable: boolean;

  constructor(opts: {
    code: string;
    message: string;
    hint?: string;
    cause?: Error;
    retryable?: boolean;
  }) {
    super(opts.message);
    this.name = "RfError";
    this.code = opts.code;
    this.hint = opts.hint;
    this.cause = opts.cause;
    this.retryable = opts.retryable ?? false;
  }

  /** Machine-readable output for MCP tool results. */
  toStructured(): { code: string; message: string; hint?: string; retryable: boolean } {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      retryable: this.retryable,
    };
  }

  /** Human-friendly single-line output for CLI. */
  toCliText(): string {
    const parts = [`[${this.code}] ${this.message}`];
    if (this.hint) parts.push(`  Hint: ${this.hint}`);
    return parts.join("\n");
  }
}

/** Wrap an unknown thrown value into an RfError. */
export function wrapError(err: unknown, code: string, hint?: string): RfError {
  if (err instanceof RfError) return err;
  const cause = err instanceof Error ? err : new Error(String(err));
  return new RfError({
    code,
    message: cause.message,
    hint,
    cause,
    retryable: false,
  });
}
