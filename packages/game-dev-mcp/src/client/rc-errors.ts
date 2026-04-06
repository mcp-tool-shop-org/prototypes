import { ErrorCode, type ErrorCodeType } from '../types.js';

export class RCError extends Error {
  code: ErrorCodeType;
  details?: Record<string, unknown>;

  constructor(code: ErrorCodeType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'RCError';
    this.code = code;
    this.details = details;
  }
}

export function mapHttpError(status: number, body: string, url: string): RCError {
  if (status === 0) {
    return new RCError(
      ErrorCode.CONNECTION_FAILED,
      'Cannot connect to Unreal Engine. Is the editor running with Remote Control API plugin enabled?',
      { url },
    );
  }

  let parsed: { errorMessage?: string } | undefined;
  try {
    parsed = JSON.parse(body);
  } catch {
    // not JSON
  }

  const msg = parsed?.errorMessage ?? body;

  if (status === 404 || msg.includes('not found') || msg.includes('not valid')) {
    return new RCError(ErrorCode.OBJECT_NOT_FOUND, `Object not found: ${msg}`, { status, url });
  }

  if (msg.includes('function') && msg.includes('not found')) {
    return new RCError(ErrorCode.FUNCTION_NOT_FOUND, `Function not found: ${msg}`, { status, url });
  }

  if (msg.includes('property') && msg.includes('not found')) {
    return new RCError(ErrorCode.PROPERTY_NOT_FOUND, `Property not found: ${msg}`, { status, url });
  }

  return new RCError(ErrorCode.RC_API_ERROR, `RC API error (${status}): ${msg}`, { status, url });
}
