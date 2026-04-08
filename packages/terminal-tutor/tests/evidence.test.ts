import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import {
  beginSession,
  endSession,
  evaluateStep,
  advance,
  getSessionTranscript,
} from '../src/tutor.js';
import { loadLedger, saveLedger } from '../src/ledger.js';
import type { Lesson, CommandResult } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-evidence');
const LEDGER_DIR = join(homedir(), '.terminal-tutor');
const LEDGER_PATH = join(LEDGER_DIR, 'progress.json');

let testCounter = 0;

function makeLesson(idSuffix?: string): Lesson {
  testCounter++;
  const id = `evidence-test-${idSuffix || testCounter}`;
  return {
    id,
    title: 'Evidence Test',
    difficulty: 'beginner',
    estimated_minutes: 1,
    goal: 'Test evidence capture.',
    workspace: {
      scaffold: [{ path: 'file.txt', content: 'hello' }],
    },
    safety: { blocked_patterns: [], workspace_only: true },
    steps: [
      {
        id: 'step-1',
        prompt: 'Find the file.',
        check: { type: 'output_contains' as const, expect: ['file.txt'] },
        hints: ['Try ls'],
        on_failure: [{ pattern: 'command not found', response: 'Check spelling.' }],
      },
      {
        id: 'step-2',
        prompt: 'Read the file.',
        check: { type: 'output_contains' as const, expect: ['hello'] },
        hints: ['Try cat'],
      },
    ],
    reflection: 'Done.',
  };
}

function makeResult(overrides: Partial<CommandResult> = {}): CommandResult {
  return { command: 'test', stdout: '', stderr: '', exitCode: 0, cwd: TMP, ...overrides };
}

function freshLedger() {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify({ learner: 'default', lessons: {} }), 'utf-8');
}

let originalLedger: string | null = null;

describe('evidence capture', () => {
  beforeEach(() => {
    if (existsSync(LEDGER_PATH)) {
      originalLedger = readFileSync(LEDGER_PATH, 'utf-8');
    }
    freshLedger();
  });

  afterAll(() => {
    if (originalLedger !== null) {
      writeFileSync(LEDGER_PATH, originalLedger, 'utf-8');
    }
    rmSync(TMP, { recursive: true, force: true });
  });

  it('captures evidence on step pass', () => {
    const lesson = makeLesson('pass');
    const session = beginSession(lesson, TMP);
    evaluateStep(session, makeResult({ command: 'ls', stdout: 'file.txt\nother.txt' }));

    const transcript = getSessionTranscript(session);
    expect(transcript).not.toBeNull();
    expect(transcript!.steps).toHaveLength(1);

    const ev = transcript!.steps[0];
    expect(ev.stepId).toBe('step-1');
    expect(ev.command).toBe('ls');
    expect(ev.verdict).toBe('pass');
    expect(ev.checkType).toBe('output_contains');
    expect(ev.failurePatternHit).toBeNull();
    expect(ev.hintLevel).toBeNull();
    expect(ev.attemptNumber).toBe(1);

    endSession(session);
  });

  it('captures evidence on step fail with failure pattern match', () => {
    const lesson = makeLesson('fail-pattern');
    const session = beginSession(lesson, TMP);
    evaluateStep(session, makeResult({
      command: 'grp',
      stderr: 'bash: grp: command not found',
    }));

    const transcript = getSessionTranscript(session);
    const ev = transcript!.steps[0];
    expect(ev.verdict).toBe('fail');
    expect(ev.failurePatternHit).toBe('Check spelling.');
    expect(ev.hintLevel).toBe(0);
    expect(ev.attemptNumber).toBe(1);

    endSession(session);
  });

  it('captures multiple attempts with advancing hints', () => {
    const lesson = makeLesson('multi-attempt');
    const session = beginSession(lesson, TMP);

    // Fail twice
    evaluateStep(session, makeResult({ stdout: 'wrong' }));
    evaluateStep(session, makeResult({ stdout: 'still wrong' }));

    // Pass
    evaluateStep(session, makeResult({ stdout: 'file.txt' }));

    const transcript = getSessionTranscript(session);
    expect(transcript!.steps).toHaveLength(3);
    expect(transcript!.steps[0].verdict).toBe('fail');
    expect(transcript!.steps[0].hintLevel).toBe(0);
    expect(transcript!.steps[1].verdict).toBe('fail');
    expect(transcript!.steps[2].verdict).toBe('pass');

    endSession(session);
  });

  it('captures raw and normalized output', () => {
    const lesson = makeLesson('raw-output');
    const session = beginSession(lesson, TMP);
    evaluateStep(session, makeResult({
      stdout: '\x1B[32mfile.txt\x1B[0m',
    }));

    const transcript = getSessionTranscript(session);
    const ev = transcript!.steps[0];
    expect(ev.rawStdout).toContain('\x1B[32m');
    expect(ev.normalizedOutput).not.toContain('\x1B[32m');
    expect(ev.normalizedOutput).toContain('file.txt');

    endSession(session);
  });

  it('marks transcript complete when lesson finishes', () => {
    const lesson = makeLesson('complete');
    const session = beginSession(lesson, TMP);

    // Pass step 1
    evaluateStep(session, makeResult({ stdout: 'file.txt' }));
    advance(session);

    // Pass step 2
    evaluateStep(session, makeResult({ stdout: 'hello' }));
    advance(session);

    const transcript = getSessionTranscript(session);
    expect(transcript!.completedAt).not.toBeNull();

    endSession(session);
  });

  it('records lesson runtime type', () => {
    const lesson = makeLesson('runtime-type');
    const session = beginSession(lesson, TMP);
    // Transcript is created on first evaluateStep
    evaluateStep(session, makeResult({ stdout: 'file.txt' }));
    const transcript = getSessionTranscript(session);
    expect(transcript).not.toBeNull();
    // No runtime spec → default shell
    expect(transcript!.runtime).toBe('shell');
    endSession(session);
  });
});
