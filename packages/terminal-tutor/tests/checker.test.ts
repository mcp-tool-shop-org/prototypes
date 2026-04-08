import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { normalize, evaluateCheck, matchFailurePattern } from '../src/checker.js';
import type { CommandResult, StepCheck } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-checker');

function makeResult(overrides: Partial<CommandResult> = {}): CommandResult {
  return {
    command: 'test',
    stdout: '',
    stderr: '',
    exitCode: 0,
    cwd: TMP,
    ...overrides,
  };
}

describe('normalize', () => {
  it('strips ANSI escape codes', () => {
    const input = '\x1B[31mError\x1B[0m: something failed';
    expect(normalize(input)).toBe('Error: something failed');
  });

  it('normalizes backslashes to forward slashes', () => {
    expect(normalize('src\\app\\main.js')).toBe('src/app/main.js');
  });

  it('trims whitespace per line', () => {
    expect(normalize('  hello  \n  world  ')).toBe('hello\nworld');
  });

  it('collapses multiple spaces', () => {
    expect(normalize('hello    world')).toBe('hello world');
  });

  it('handles case insensitive mode', () => {
    expect(normalize('Hello WORLD', { case_insensitive: true })).toBe('hello world');
  });

  it('applies all rules together', () => {
    const input = '\x1B[32m  src\\utils.js  :  2  \x1B[0m';
    const result = normalize(input);
    expect(result).toBe('src/utils.js : 2');
  });
});

describe('evaluateCheck', () => {
  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
  });

  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  describe('output_contains', () => {
    it('passes when all expected strings are present', () => {
      const check: StepCheck = { type: 'output_contains', expect: ['hello', 'world'] };
      const result = makeResult({ stdout: 'hello beautiful world' });
      expect(evaluateCheck(check, result, TMP).passed).toBe(true);
    });

    it('fails when a string is missing', () => {
      const check: StepCheck = { type: 'output_contains', expect: ['hello', 'missing'] };
      const result = makeResult({ stdout: 'hello world' });
      const r = evaluateCheck(check, result, TMP);
      expect(r.passed).toBe(false);
      expect(r.message).toContain('missing');
    });

    it('checks stderr too', () => {
      const check: StepCheck = { type: 'output_contains', expect: ['error found'] };
      const result = makeResult({ stderr: 'error found in file' });
      expect(evaluateCheck(check, result, TMP).passed).toBe(true);
    });

    it('normalizes before comparing', () => {
      const check: StepCheck = { type: 'output_contains', expect: ['src/app.js'] };
      const result = makeResult({ stdout: '\x1B[32msrc\\app.js\x1B[0m' });
      expect(evaluateCheck(check, result, TMP).passed).toBe(true);
    });
  });

  describe('output_ordered', () => {
    it('passes when items appear in order', () => {
      const check: StepCheck = { type: 'output_ordered', expect_ordered: ['first', 'second', 'third'] };
      const result = makeResult({ stdout: 'first line\nsecond line\nthird line' });
      expect(evaluateCheck(check, result, TMP).passed).toBe(true);
    });

    it('fails when order is wrong', () => {
      const check: StepCheck = { type: 'output_ordered', expect_ordered: ['second', 'first'] };
      const result = makeResult({ stdout: 'first line\nsecond line' });
      // 'second' appears at index 12, but 'first' appears at index 0 which is before 12
      // Actually this should fail since we need second before first
      // Wait: 'first line\nsecond line' — searching for 'second' finds it at index 11,
      // then searching for 'first' after index 11 won't find it
      expect(evaluateCheck(check, result, TMP).passed).toBe(false);
    });
  });

  describe('file_exists', () => {
    it('passes when files exist', () => {
      writeFileSync(join(TMP, 'exists.txt'), 'content');
      const check: StepCheck = { type: 'file_exists', files: ['exists.txt'] };
      expect(evaluateCheck(check, makeResult(), TMP).passed).toBe(true);
    });

    it('fails when files are missing', () => {
      const check: StepCheck = { type: 'file_exists', files: ['nope.txt'] };
      expect(evaluateCheck(check, makeResult(), TMP).passed).toBe(false);
    });
  });

  describe('file_contains', () => {
    it('passes when file has expected content', () => {
      writeFileSync(join(TMP, 'content.txt'), 'hello world\nfoo bar');
      const check: StepCheck = {
        type: 'file_contains',
        file_path: 'content.txt',
        file_patterns: ['hello', 'foo bar'],
      };
      expect(evaluateCheck(check, makeResult(), TMP).passed).toBe(true);
    });

    it('fails when content is missing', () => {
      writeFileSync(join(TMP, 'partial.txt'), 'hello world');
      const check: StepCheck = {
        type: 'file_contains',
        file_path: 'partial.txt',
        file_patterns: ['hello', 'missing stuff'],
      };
      const r = evaluateCheck(check, makeResult(), TMP);
      expect(r.passed).toBe(false);
      expect(r.message).toContain('missing stuff');
    });
  });

  describe('exit_code', () => {
    it('passes on expected exit code', () => {
      const check: StepCheck = { type: 'exit_code', code: 0 };
      expect(evaluateCheck(check, makeResult({ exitCode: 0 }), TMP).passed).toBe(true);
    });

    it('defaults to 0 when code not specified', () => {
      const check: StepCheck = { type: 'exit_code' };
      expect(evaluateCheck(check, makeResult({ exitCode: 0 }), TMP).passed).toBe(true);
    });

    it('fails on wrong exit code', () => {
      const check: StepCheck = { type: 'exit_code', code: 0 };
      expect(evaluateCheck(check, makeResult({ exitCode: 1 }), TMP).passed).toBe(false);
    });
  });
});

describe('matchFailurePattern', () => {
  it('matches the first pattern', () => {
    const result = makeResult({ stderr: 'bash: grp: command not found' });
    const patterns = [
      { pattern: 'command not found', response: 'Check your spelling.' },
      { pattern: 'permission denied', response: 'You need permissions.' },
    ];
    expect(matchFailurePattern(result, patterns)).toBe('Check your spelling.');
  });

  it('returns null when no patterns match', () => {
    const result = makeResult({ stdout: 'normal output' });
    const patterns = [{ pattern: 'error', response: 'Something broke.' }];
    expect(matchFailurePattern(result, patterns)).toBeNull();
  });
});
