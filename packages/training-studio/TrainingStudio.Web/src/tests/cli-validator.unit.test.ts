/**
 * CLI Validator Unit Tests
 *
 * Test the command-line interface argument parsing and option handling.
 * Similar to ControlRoom's RunLocalScriptTests pattern.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Mock implementation of arg parser and path validator
 * (extracted from validate.ts for testing)
 */

interface CLIOptions {
  path: string;
  json: boolean;
}

function parseArgs(args: string[]): CLIOptions | null {
  const filtered = args.slice(0);

  if (filtered.length === 0) {
    return null;
  }

  const path = filtered.find(arg => !arg.startsWith('--'));
  const json = filtered.includes('--json');

  if (!path) {
    return null;
  }

  return { path, json };
}

interface PathValidation {
  valid: boolean;
  reason?: string;
}

function validatePath(filePath: string): PathValidation {
  // Reject paths with .. (directory traversal)
  if (filePath.includes('..')) {
    return { valid: false, reason: 'Path contains directory traversal (..)' };
  }

  // Reject absolute paths (Unix)
  if (filePath.startsWith('/')) {
    return { valid: false, reason: 'Absolute path (starts with /)' };
  }

  // Reject Windows extended path prefix (check before backslash check)
  if (filePath.startsWith('\\\\?\\')) {
    return { valid: false, reason: 'Windows extended path prefix not allowed' };
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

  // Reject leading ./
  if (filePath.startsWith('./')) {
    return { valid: false, reason: 'Leading ./ in path' };
  }

  return { valid: true };
}

describe('CLI Validator', () => {
  describe('Argument Parsing', () => {
    it('parses bundle path as first positional argument', () => {
      const result = parseArgs(['bundle/path']);
      expect(result).not.toBeNull();
      expect(result?.path).toBe('bundle/path');
      expect(result?.json).toBe(false);
    });

    it('parses --json flag', () => {
      const result = parseArgs(['bundle/path', '--json']);
      expect(result).not.toBeNull();
      expect(result?.path).toBe('bundle/path');
      expect(result?.json).toBe(true);
    });

    it('accepts --json before path', () => {
      const result = parseArgs(['--json', 'bundle/path']);
      expect(result).not.toBeNull();
      expect(result?.path).toBe('bundle/path');
      expect(result?.json).toBe(true);
    });

    it('returns null for empty args', () => {
      const result = parseArgs([]);
      expect(result).toBeNull();
    });

    it('returns null when no path provided', () => {
      const result = parseArgs(['--json']);
      expect(result).toBeNull();
    });

    it('parses path with relative directory structure', () => {
      const result = parseArgs(['exports/bundle_20240115']);
      expect(result?.path).toBe('exports/bundle_20240115');
    });

    it('parses .zip file path', () => {
      const result = parseArgs(['bundle.zip', '--json']);
      expect(result?.path).toBe('bundle.zip');
      expect(result?.json).toBe(true);
    });
  });

  describe('Path Validation', () => {
    describe('Valid Paths', () => {
      it('accepts relative directory paths', () => {
        const result = validatePath('bundle');
        expect(result.valid).toBe(true);
      });

      it('accepts nested relative paths', () => {
        const result = validatePath('exports/bundle_20240115');
        expect(result.valid).toBe(true);
      });

      it('accepts paths with hyphens and underscores', () => {
        const result = validatePath('my-bundle_export');
        expect(result.valid).toBe(true);
      });

      it('accepts .zip files', () => {
        const result = validatePath('bundle.zip');
        expect(result.valid).toBe(true);
      });

      it('accepts paths with numbers', () => {
        const result = validatePath('training_studio_v2_export_123');
        expect(result.valid).toBe(true);
      });

      it('accepts paths with forward slashes', () => {
        const result = validatePath('path/to/bundle');
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Paths - Directory Traversal', () => {
      it('rejects paths with .. (directory traversal)', () => {
        const result = validatePath('../etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('directory traversal');
      });

      it('rejects paths with .. in middle', () => {
        const result = validatePath('bundle/../../../etc/passwd');
        expect(result.valid).toBe(false);
      });

      it('rejects standalone ..', () => {
        const result = validatePath('..');
        expect(result.valid).toBe(false);
      });
    });

    describe('Invalid Paths - Absolute Paths', () => {
      it('rejects absolute Unix paths', () => {
        const result = validatePath('/etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Absolute path');
      });

      it('rejects paths with leading /', () => {
        const result = validatePath('/tmp/bundle');
        expect(result.valid).toBe(false);
      });
    });

    describe('Invalid Paths - Windows Paths', () => {
      it('rejects Windows drive letters', () => {
        const result = validatePath('C:\\bundle');
        expect(result.valid).toBe(false);
      });

      it('rejects Windows drive letter C:', () => {
        const result = validatePath('C:\\Users\\Alice\\bundle');
        expect(result.valid).toBe(false);
      });

      it('rejects backslashes', () => {
        const result = validatePath('path\\to\\bundle');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Backslash');
      });

      it('rejects extended path prefix', () => {
        const result = validatePath('\\\\?\\C:\\bundle');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('extended path prefix');
      });

      it('rejects UNC paths', () => {
        const result = validatePath('\\\\server\\share\\bundle');
        expect(result.valid).toBe(false);
      });

      it('rejects colons in paths', () => {
        const result = validatePath('bundle:stream');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('reserved character');
      });
    });

    describe('Invalid Paths - Leading Dot Slash', () => {
      it('rejects leading ./', () => {
        const result = validatePath('./bundle');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Leading ./');
      });

      it('rejects ./path/', () => {
        const result = validatePath('./path/to/bundle');
        expect(result.valid).toBe(false);
      });
    });

    describe('Invalid Paths - Special Characters', () => {
      it('allows dots for file extensions', () => {
        const result = validatePath('bundle.zip');
        expect(result.valid).toBe(true);
      });

      it('allows dots in directory names', () => {
        const result = validatePath('v0.1.0-alpha');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Integration - Parsing with Validation', () => {
    it('parses and validates a valid path from CLI args', () => {
      const parsed = parseArgs(['exports/bundle_20240115', '--json']);
      expect(parsed).not.toBeNull();

      if (parsed) {
        const pathValidation = validatePath(parsed.path);
        expect(pathValidation.valid).toBe(true);
      }
    });

    it('parses path but validation fails for traversal attempt', () => {
      const parsed = parseArgs(['../etc/passwd', '--json']);
      expect(parsed).not.toBeNull();

      if (parsed) {
        const pathValidation = validatePath(parsed.path);
        expect(pathValidation.valid).toBe(false);
      }
    });

    it('returns null parsing when no path, even with --json', () => {
      const parsed = parseArgs(['--json']);
      expect(parsed).toBeNull();
    });

    it('full flow: parse path with leading ./, validate rejects it', () => {
      const args = ['./exports/my_export.zip', '--json'];
      const parsed = parseArgs(args);

      expect(parsed).not.toBeNull();
      expect(parsed?.path).toBe('./exports/my_export.zip');
      expect(parsed?.json).toBe(true);

      // Path starts with ./ which should fail validation
      const pathValidation = validatePath(parsed!.path);
      expect(pathValidation.valid).toBe(false);
      expect(pathValidation.reason).toContain('Leading ./');
    });

    it('acceptable path passes all checks', () => {
      const args = ['exports/bundle_20240115', '--json'];
      const parsed = parseArgs(args);

      expect(parsed).not.toBeNull();

      const pathValidation = validatePath(parsed!.path);
      expect(pathValidation.valid).toBe(true);
      expect(parsed?.json).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles very long paths', () => {
      const longPath = 'a/'.repeat(50) + 'bundle';
      const result = validatePath(longPath);
      expect(result.valid).toBe(true);
    });

    it('handles unicode characters in path', () => {
      const unicodePath = 'bundle_日本語_export';
      const result = validatePath(unicodePath);
      expect(result.valid).toBe(true);
    });

    it('handles empty string path', () => {
      const result = validatePath('');
      expect(result.valid).toBe(true); // Empty is technically valid, IO will fail
    });

    it('handles single character path', () => {
      const result = parseArgs(['a']);
      expect(result?.path).toBe('a');
    });

    it('handles path with spaces (unusual but allowed)', () => {
      const result = validatePath('bundle files/export');
      expect(result.valid).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('provides helpful message for directory traversal', () => {
      const result = validatePath('../secrets');
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('directory traversal');
    });

    it('provides helpful message for absolute paths', () => {
      const result = validatePath('/etc/passwd');
      expect(result.reason).toContain('Absolute path');
    });

    it('provides helpful message for Windows paths', () => {
      const result = validatePath('C:\\Users\\Alice\\bundle');
      expect(result.reason).toBeDefined();
    });

    it('provides helpful message for backslashes', () => {
      const result = validatePath('path\\to\\bundle');
      expect(result.reason).toContain('Backslash');
    });
  });
});
