/**
 * Structured error shape for MCP App Builder (Shipcheck B.1).
 *
 * All user-visible errors carry: code, message, hint, cause?, retryable?
 */

export type ErrorCode =
    | 'INPUT_INVALID_SCHEMA'
    | 'INPUT_MISSING_FILE'
    | 'INPUT_PARSE_ERROR'
    | 'IO_FILE_WRITE'
    | 'IO_FILE_READ'
    | 'CONFIG_MISSING'
    | 'CONFIG_INVALID'
    | 'RUNTIME_SCAFFOLD'
    | 'RUNTIME_CODEGEN'
    | 'RUNTIME_TEST'
    | 'RUNTIME_TRANSPORT'
    | 'RUNTIME_UNEXPECTED';

export class AppBuilderError extends Error {
    readonly code: ErrorCode;
    readonly hint?: string;
    readonly retryable: boolean;
    override readonly cause?: Error;

    constructor(opts: {
        code: ErrorCode;
        message: string;
        hint?: string;
        cause?: Error;
        retryable?: boolean;
    }) {
        super(opts.message);
        this.name = 'AppBuilderError';
        this.code = opts.code;
        this.hint = opts.hint;
        this.cause = opts.cause;
        this.retryable = opts.retryable ?? false;
    }

    /** One-line user-safe message with code and optional hint. */
    toUserString(): string {
        const base = `[${this.code}] ${this.message}`;
        return this.hint ? `${base}\nHint: ${this.hint}` : base;
    }
}
