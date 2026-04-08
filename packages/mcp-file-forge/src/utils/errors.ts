/**
 * MCP File Forge - Error Utilities
 *
 * Structured error handling and response formatting.
 */

import type { FileForgeError, ToolResult, ErrorCodeType } from '../types.js';
import { ErrorCode } from '../types.js';
import { log } from './logger.js';

/**
 * Create a structured error object.
 */
export function createError(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>
): FileForgeError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Format a FileForgeError as a tool error result.
 */
export function formatErrorResult(error: FileForgeError): ToolResult {
  log.error(`${error.code}: ${error.message}`, 'error');

  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(error),
      },
    ],
  };
}

/**
 * Create an error result directly.
 */
export function errorResult(
  code: ErrorCodeType,
  message: string,
  details?: Record<string, unknown>
): ToolResult {
  return formatErrorResult(createError(code, message, details));
}

/**
 * Format a success result with JSON data.
 */
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

/**
 * Wrap a function with error handling.
 */
export function withErrorHandling<T extends unknown[]>(
  fn: (...args: T) => Promise<ToolResult>,
  context: string
): (...args: T) => Promise<ToolResult> {
  return async (...args: T): Promise<ToolResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      log.error(`Unhandled error in ${context}: ${err.message}`, context);

      // Map common Node.js errors to our error codes
      switch (err.code) {
        case 'ENOENT':
          return errorResult(
            ErrorCode.FILE_NOT_FOUND,
            `File or directory not found: ${err.path ?? 'unknown'}`
          );

        case 'EACCES':
          return errorResult(
            ErrorCode.PERMISSION_DENIED,
            `Permission denied: ${err.path ?? 'unknown'}`
          );

        case 'EEXIST':
          return errorResult(
            ErrorCode.ALREADY_EXISTS,
            `File or directory already exists: ${err.path ?? 'unknown'}`
          );

        case 'ENOTEMPTY':
          return errorResult(
            ErrorCode.DIRECTORY_NOT_EMPTY,
            `Directory is not empty: ${err.path ?? 'unknown'}`
          );

        case 'EISDIR':
          return errorResult(
            ErrorCode.INVALID_PATH,
            `Expected a file but got a directory: ${err.path ?? 'unknown'}`
          );

        case 'ENOTDIR':
          return errorResult(
            ErrorCode.INVALID_PATH,
            `Expected a directory but got a file: ${err.path ?? 'unknown'}`
          );

        default:
          return errorResult(ErrorCode.UNKNOWN_ERROR, `Unexpected error: ${err.message}`, {
            error_code: err.code,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
          });
      }
    }
  };
}

/**
 * Validate that a value is defined.
 */
export function assertDefined<T>(
  value: T | undefined | null,
  errorMessage: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(errorMessage);
  }
}

/**
 * Safe JSON parse with error handling.
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
