#!/usr/bin/env node
/**
 * Training Studio Bundle Validator CLI
 *
 * Usage:
 *   npx tsx src/cli/validate.ts <path-or-zip> [--json]
 *   trainingstudio validate <path-or-zip> [--json]
 *
 * Exit codes:
 *   0 - Valid bundle
 *   2 - Valid with warnings
 *   3 - Invalid bundle
 */

import { readFileSync, readdirSync, statSync, existsSync, lstatSync } from 'fs';
import { join, resolve, normalize } from 'path';
import {
  validateBundle,
  createMemoryAccess,
  formatValidationResult,
  formatValidationResultJSON,
  getExitCode,
  EXIT_CODES,
  BundleAccess
} from '../validation/bundle-validator.js';
import { ValidationErrorCode } from '../types/bundle.js';

interface CLIOptions {
  path: string;
  json: boolean;
}

function parseArgs(args: string[]): CLIOptions | null {
  const filtered = args.slice(2); // skip node and script path

  if (filtered.length === 0) {
    return null;
  }

  const path = filtered.find(arg => !arg.startsWith('--'));
  const json = filtered.includes('--json');

  if (!path) {
    return null;
  }

  return { path: resolve(path), json };
}

function printUsage(): void {
  console.log(`
Training Studio Bundle Validator

Usage:
  npx tsx src/cli/validate.ts <path-or-zip> [--json]

Arguments:
  <path-or-zip>  Path to bundle directory or .zip file

Options:
  --json         Output results as JSON (stable contract)

Exit Codes:
  0  Valid bundle
  2  Valid with warnings
  3  Invalid bundle

Examples:
  npx tsx src/cli/validate.ts ./exports/training_export_20240115_143022
  npx tsx src/cli/validate.ts ./bundle.zip --json
`);
}

/**
 * Portable path validation result
 */
interface PathValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate path for security and portability issues
 */
function validatePath(filePath: string): PathValidation {
  // Reject paths with .. (directory traversal)
  if (filePath.includes('..')) {
    return { valid: false, reason: 'Path contains directory traversal (..)' };
  }

  // Reject absolute paths (Unix)
  if (filePath.startsWith('/')) {
    return { valid: false, reason: 'Absolute path (starts with /)' };
  }

  // Reject Windows drive letters (C:, D:, etc.)
  if (/^[a-zA-Z]:/.test(filePath)) {
    return { valid: false, reason: 'Windows drive letter in path' };
  }

  // Reject backslashes (Windows path separator)
  if (filePath.includes('\\')) {
    return { valid: false, reason: 'Backslash in path (use forward slashes)' };
  }

  // Reject colons (Windows ADS or drive letters)
  if (filePath.includes(':')) {
    return { valid: false, reason: 'Colon in path (Windows reserved character)' };
  }

  // Reject Windows extended path prefix
  if (filePath.startsWith('\\\\?\\')) {
    return { valid: false, reason: 'Windows extended path prefix' };
  }

  // Reject leading ./
  if (filePath.startsWith('./')) {
    return { valid: false, reason: 'Leading ./ in path' };
  }

  return { valid: true };
}

interface IOError {
  path: string;
  code: ValidationErrorCode;
  message: string;
}

/**
 * Read directory recursively, handling edge cases
 */
function readDirectoryRecursive(
  dir: string,
  base: string = '',
  errors: IOError[] = []
): { files: Map<string, Uint8Array>; errors: IOError[] } {
  const files = new Map<string, Uint8Array>();

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (e) {
    errors.push({
      path: dir,
      code: ValidationErrorCode.E_IO_READ,
      message: `Cannot read directory: ${e}`
    });
    return { files, errors };
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = base ? `${base}/${entry}` : entry;

    // Validate the relative path for portability
    const pathValidation = validatePath(relativePath);
    if (!pathValidation.valid) {
      errors.push({
        path: relativePath,
        code: ValidationErrorCode.E_PATH_INVALID,
        message: pathValidation.reason!
      });
      continue;
    }

    let stat;
    try {
      stat = lstatSync(fullPath); // Use lstat to detect symlinks
    } catch (e) {
      errors.push({
        path: relativePath,
        code: ValidationErrorCode.E_IO_READ,
        message: `Cannot stat: ${e}`
      });
      continue;
    }

    // Symlinks are forbidden (security: avoid symlink attacks)
    if (stat.isSymbolicLink()) {
      errors.push({
        path: relativePath,
        code: ValidationErrorCode.E_SYMLINK_FORBIDDEN,
        message: 'Symlinks are not allowed in bundles'
      });
      continue;
    }

    if (stat.isDirectory()) {
      const subResult = readDirectoryRecursive(fullPath, relativePath, errors);
      for (const [path, content] of subResult.files) {
        files.set(path, content);
      }
    } else if (stat.isFile()) {
      try {
        const content = readFileSync(fullPath);
        files.set(relativePath, new Uint8Array(content));
      } catch (e) {
        errors.push({
          path: relativePath,
          code: ValidationErrorCode.E_IO_READ,
          message: `Cannot read file: ${e}`
        });
      }
    }
    // Skip other types (devices, sockets, etc.)
  }

  return { files, errors };
}

async function loadBundleFromDirectory(dirPath: string): Promise<{ access: BundleAccess; ioErrors: IOError[] }> {
  const { files, errors } = readDirectoryRecursive(dirPath);
  return {
    access: createMemoryAccess(files),
    ioErrors: errors
  };
}

async function loadBundleFromZip(_zipPath: string): Promise<{ access: BundleAccess; ioErrors: IOError[] }> {
  // For ZIP support, we'd need a ZIP library
  // For now, throw an error with instructions
  throw new Error(
    'ZIP file validation requires unzipping first.\n' +
    'Use: unzip bundle.zip -d bundle_dir && npx tsx src/cli/validate.ts bundle_dir'
  );
}

function outputError(message: string, code: ValidationErrorCode, json: boolean): void {
  if (json) {
    console.log(JSON.stringify({
      ok: false,
      exit_code: EXIT_CODES.INVALID,
      bundle_id: null,
      bundle_digest: null,
      version: null,
      schema_uri: null,
      schema_version: null,
      errors: [{ code, message }],
      warnings: [],
      stats: { files_total: 0, artifacts_listed: 0, artifacts_verified: 0 }
    }, null, 2));
  } else {
    console.error(`Error: ${message}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  if (!options) {
    printUsage();
    process.exit(1);
  }

  if (!existsSync(options.path)) {
    outputError(`Path not found: ${options.path}`, ValidationErrorCode.E_IO_READ, options.json);
    process.exit(EXIT_CODES.INVALID);
  }

  try {
    let stat;
    try {
      stat = statSync(options.path);
    } catch (e) {
      outputError(`Cannot access path: ${e}`, ValidationErrorCode.E_IO_READ, options.json);
      process.exit(EXIT_CODES.INVALID);
    }

    let access: BundleAccess;
    let ioErrors: IOError[] = [];

    if (stat.isDirectory()) {
      const loadResult = await loadBundleFromDirectory(options.path);
      access = loadResult.access;
      ioErrors = loadResult.ioErrors;
    } else if (options.path.endsWith('.zip')) {
      const loadResult = await loadBundleFromZip(options.path);
      access = loadResult.access;
      ioErrors = loadResult.ioErrors;
    } else {
      outputError('Path must be a directory or .zip file', ValidationErrorCode.E_PATH_INVALID, options.json);
      process.exit(EXIT_CODES.INVALID);
    }

    const result = await validateBundle(access);

    // Add IO errors to the result (with proper error codes)
    for (const ioErr of ioErrors) {
      result.errors.push({
        code: ioErr.code,
        message: ioErr.message,
        path: ioErr.path
      });
    }

    // Recalculate validity if we added IO errors
    if (ioErrors.length > 0) {
      result.valid = false;
      result.summary = `INVALID: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
    }

    const exitCode = getExitCode(result);

    if (options.json) {
      console.log(formatValidationResultJSON(result));
    } else {
      console.log(formatValidationResult(result));
    }

    process.exit(exitCode);
  } catch (error) {
    outputError(String(error), ValidationErrorCode.E_IO_READ, options.json);
    process.exit(EXIT_CODES.INVALID);
  }
}

main();
