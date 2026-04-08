/**
 * MCP File Forge - Validation Utilities
 *
 * Input validation and path sanitization.
 */

import * as path from 'node:path';
import type { FileForgeError } from '../types.js';
import { ErrorCode } from '../types.js';

/**
 * Supported file encodings.
 */
const SUPPORTED_ENCODINGS = [
  'utf-8',
  'utf8',
  'utf-16le',
  'utf16le',
  'latin1',
  'binary',
  'ascii',
  'base64',
  'hex',
] as const;

type SupportedEncoding = (typeof SUPPORTED_ENCODINGS)[number];

/**
 * Validate and normalize an encoding string.
 */
export function validateEncoding(encoding: string): FileForgeError | null {
  const normalized = encoding.toLowerCase().replace('-', '') as SupportedEncoding;

  if (!SUPPORTED_ENCODINGS.includes(normalized)) {
    return {
      code: ErrorCode.INVALID_ENCODING,
      message: `Unsupported encoding: ${encoding}`,
      details: {
        supported: SUPPORTED_ENCODINGS,
      },
    };
  }

  return null;
}

/**
 * Normalize an encoding string to Node.js format.
 */
export function normalizeEncoding(encoding: string): BufferEncoding {
  const normalized = encoding.toLowerCase().replace('-', '');

  // Map common variations
  const mapping: Record<string, BufferEncoding> = {
    utf8: 'utf-8',
    utf16le: 'utf-16le',
  };

  return (mapping[normalized] ?? encoding) as BufferEncoding;
}

/**
 * Validate a file path is not empty or malformed.
 */
export function validatePath(inputPath: string): FileForgeError | null {
  // Check for empty path
  if (!inputPath || inputPath.trim() === '') {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Path cannot be empty',
    };
  }

  // Check for null bytes
  if (inputPath.includes('\0')) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Path contains null bytes',
    };
  }

  // Check for overly long paths (Windows limit)
  if (inputPath.length > 32767) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Path is too long',
      details: {
        length: inputPath.length,
        max_length: 32767,
      },
    };
  }

  return null;
}

/**
 * Sanitize a path for safe use.
 */
export function sanitizePath(inputPath: string): string {
  // Resolve to absolute path
  const resolved = path.resolve(inputPath);

  // Normalize path separators and remove redundant components
  return path.normalize(resolved);
}

/**
 * Validate a glob pattern.
 */
export function validateGlobPattern(pattern: string): FileForgeError | null {
  // Check for empty pattern
  if (!pattern || pattern.trim() === '') {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Glob pattern cannot be empty',
    };
  }

  // Check for patterns that might cause excessive recursion
  const doubleStarCount = (pattern.match(/\*\*/g) || []).length;
  if (doubleStarCount > 5) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Glob pattern has too many ** wildcards',
      details: {
        count: doubleStarCount,
        max: 5,
      },
    };
  }

  return null;
}

/**
 * Validate a regex pattern.
 */
export function validateRegexPattern(pattern: string): FileForgeError | null {
  try {
    new RegExp(pattern);
    return null;
  } catch (error) {
    const err = error as Error;
    return {
      code: ErrorCode.INVALID_PATH,
      message: `Invalid regex pattern: ${err.message}`,
      details: {
        pattern,
      },
    };
  }
}

/**
 * Validate line numbers for file reading.
 */
export function validateLineRange(
  startLine?: number,
  endLine?: number
): FileForgeError | null {
  if (startLine !== undefined && startLine < 1) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Start line must be 1 or greater',
      details: { start_line: startLine },
    };
  }

  if (endLine !== undefined && endLine < 1) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'End line must be 1 or greater',
      details: { end_line: endLine },
    };
  }

  if (startLine !== undefined && endLine !== undefined && startLine > endLine) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: 'Start line cannot be greater than end line',
      details: { start_line: startLine, end_line: endLine },
    };
  }

  return null;
}

/**
 * Validate a positive integer.
 */
export function validatePositiveInt(
  value: number,
  fieldName: string
): FileForgeError | null {
  if (!Number.isInteger(value) || value < 0) {
    return {
      code: ErrorCode.INVALID_PATH,
      message: `${fieldName} must be a non-negative integer`,
      details: { value },
    };
  }
  return null;
}

/**
 * Check if a string looks like a path (vs. content).
 */
export function looksLikePath(str: string): boolean {
  // Check for common path patterns
  if (str.startsWith('/') || str.startsWith('./') || str.startsWith('../')) {
    return true;
  }

  // Windows absolute paths
  if (/^[A-Za-z]:[/\\]/.test(str)) {
    return true;
  }

  // Contains path separators
  if (str.includes('/') || str.includes('\\')) {
    return true;
  }

  // Common file extensions
  if (/\.[a-zA-Z0-9]{1,10}$/.test(str)) {
    return true;
  }

  return false;
}
