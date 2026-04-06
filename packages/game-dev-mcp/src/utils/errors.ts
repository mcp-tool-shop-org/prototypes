import type { UnrealMcpError, ToolResult, ErrorCodeType } from '../types.js';
import { log } from './logger.js';

export function createError(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>,
): UnrealMcpError {
  return { code, message, details };
}

export function errorResult(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>,
): ToolResult {
  log.error(`${code}: ${message}`, 'error');
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(createError(code, message, details)) }],
  };
}

export function successResult(data: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}
