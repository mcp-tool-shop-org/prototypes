import { describe, it, expect } from 'vitest';
import {
  validatePath,
  validateEncoding,
  validateGlobPattern,
  validateRegexPattern,
  validateLineRange,
  validatePositiveInt,
  sanitizePath,
  looksLikePath,
} from '../src/utils/validation.js';

describe('validatePath', () => {
  it('returns null for valid paths', () => {
    expect(validatePath('/tmp/test.txt')).toBeNull();
    expect(validatePath('./relative/path')).toBeNull();
  });

  it('rejects empty paths', () => {
    const error = validatePath('');
    expect(error).not.toBeNull();
    expect(error!.message).toContain('empty');
  });

  it('rejects paths with null bytes', () => {
    const error = validatePath('/tmp/test\0.txt');
    expect(error).not.toBeNull();
    expect(error!.message).toContain('null bytes');
  });

  it('rejects excessively long paths', () => {
    const longPath = 'a'.repeat(40000);
    const error = validatePath(longPath);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('too long');
  });
});

describe('validateEncoding', () => {
  it('accepts valid encodings', () => {
    expect(validateEncoding('utf-8')).toBeNull();
    expect(validateEncoding('utf8')).toBeNull();
    expect(validateEncoding('ascii')).toBeNull();
    expect(validateEncoding('base64')).toBeNull();
  });

  it('rejects invalid encodings', () => {
    const error = validateEncoding('invalid-encoding');
    expect(error).not.toBeNull();
  });
});

describe('validateGlobPattern', () => {
  it('accepts valid patterns', () => {
    expect(validateGlobPattern('**/*.ts')).toBeNull();
    expect(validateGlobPattern('src/*.js')).toBeNull();
  });

  it('rejects empty patterns', () => {
    const error = validateGlobPattern('');
    expect(error).not.toBeNull();
  });

  it('rejects patterns with excessive wildcards', () => {
    const error = validateGlobPattern('**/**/**/**/**/**/*.ts');
    expect(error).not.toBeNull();
    expect(error!.message).toContain('too many');
  });
});

describe('validateRegexPattern', () => {
  it('accepts valid regex', () => {
    expect(validateRegexPattern('^test.*$')).toBeNull();
  });

  it('rejects invalid regex', () => {
    const error = validateRegexPattern('[invalid');
    expect(error).not.toBeNull();
    expect(error!.message).toContain('Invalid regex');
  });
});

describe('validateLineRange', () => {
  it('accepts valid ranges', () => {
    expect(validateLineRange(1, 10)).toBeNull();
    expect(validateLineRange(5)).toBeNull();
    expect(validateLineRange(undefined, 20)).toBeNull();
  });

  it('rejects negative start', () => {
    const error = validateLineRange(0);
    expect(error).not.toBeNull();
  });

  it('rejects start > end', () => {
    const error = validateLineRange(10, 5);
    expect(error).not.toBeNull();
  });
});

describe('sanitizePath', () => {
  it('normalizes paths', () => {
    const result = sanitizePath('./test/../file.txt');
    expect(result).not.toContain('..');
  });
});

describe('looksLikePath', () => {
  it('identifies path-like strings', () => {
    expect(looksLikePath('./test.txt')).toBe(true);
    expect(looksLikePath('/absolute/path')).toBe(true);
    expect(looksLikePath('file.ts')).toBe(true);
  });

  it('rejects non-path strings', () => {
    expect(looksLikePath('hello world')).toBe(false);
  });
});
