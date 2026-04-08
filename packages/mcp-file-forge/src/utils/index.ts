/**
 * MCP File Forge - Utilities Module
 *
 * Exports all utility functions.
 */

export { getLogger, resetLogger, log } from './logger.js';
export type { LogLevel } from './logger.js';

export {
  createError,
  formatErrorResult,
  errorResult,
  successResult,
  withErrorHandling,
  assertDefined,
  safeJsonParse,
  formatBytes,
  truncate,
} from './errors.js';

export {
  validateEncoding,
  normalizeEncoding,
  validatePath,
  sanitizePath,
  validateGlobPattern,
  validateRegexPattern,
  validateLineRange,
  validatePositiveInt,
  looksLikePath,
} from './validation.js';
