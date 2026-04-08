import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import {
  beginSession,
  endSession,
  resetSession,
  getCurrentStep,
  checkSafety,
  evaluateStep,
  advance,
  getLessonInfo,
} from '../src/tutor.js';
import { loadLedger, saveLedger } from '../src/ledger.js';
import type { Lesson, CommandResult } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-tutor');
const LEDGER_PATH = join(homedir(), '.terminal-tutor', 'progress.json');

const MOCK_LESSON: Lesson = {
  id: 'tutor-test',
  title: 'Tutor Test Lesson',
  difficulty: 'beginner',
  estimated_minutes: 5,
  goal: 'Test the tutor loop.',
  workspace: {
    scaffold: [
      { path: 'file.txt', content: 'hello world' },
    ],
  },
  safety: {
    blocked_patterns: ['rm -rf', 'sudo'],
    workspace_only: true,
  },
  steps: [
    {
      id: 'step-find',
      prompt: 'Find the file.',
      check: {
        type: 'output_contains' as const,
        expect: ['file.txt'],
      },
      hints: ['Try ls', 'Use: ls -la'],
      on_failure: [
        { pattern: 'command not found', response: 'Check spelling.' },
      ],
    },
    {
      id: 'step-read',
      prompt: 'Read the file.',
      check: {
        type: 'output_contains' as const,
        expect: ['hello world'],
      },
      hints: ['Try cat file.txt'],
    },
  ],
  reflection: 'You found and read a file. Well done.',
};

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

describe('tutor', () => {
  let originalLedger: string | null = null;

  beforeAll(() => {
    if (existsSync(LEDGER_PATH)) {
      originalLedger = readFileSync(LEDGER_PATH, 'utf-8');
    }
  });

  beforeEach(() => {
    // Write a completely clean ledger before each test
    const { mkdirSync } = require('node:fs');
    mkdirSync(join(homedir(), '.terminal-tutor'), { recursive: true });
    const { writeFileSync } = require('node:fs');
    writeFileSync(LEDGER_PATH, JSON.stringify({ learner: 'default', lessons: {} }), 'utf-8');
  });

  afterAll(() => {
    if (originalLedger !== null) {
      const { writeFileSync } = require('node:fs');
      writeFileSync(LEDGER_PATH, originalLedger, 'utf-8');
    }
  });

  it('begins a session with workspace and step presentation', () => {
    const session = beginSession(MOCK_LESSON, TMP);
    expect(session.workspace.initialized).toBe(true);
    expect(existsSync(join(session.workspace.root, 'file.txt'))).toBe(true);

    const step = getCurrentStep(session);
    expect(step).not.toBeNull();
    expect(step!.stepId).toBe('step-find');
    expect(step!.stepNumber).toBe(1);
    expect(step!.totalSteps).toBe(2);

    endSession(session);
  });

  it('checks command safety', () => {
    const session = beginSession(MOCK_LESSON, TMP);

    expect(checkSafety(session, 'ls -la').allowed).toBe(true);
    expect(checkSafety(session, 'rm -rf /').allowed).toBe(false);
    expect(checkSafety(session, 'sudo apt install vim').allowed).toBe(false);

    endSession(session);
  });

  it('evaluates a passing step', () => {
    const session = beginSession(MOCK_LESSON, TMP);
    const result = makeResult({ stdout: 'file.txt\nother.txt' });
    const stepResult = evaluateStep(session, result);

    expect(stepResult.outcome).toBe('pass');

    endSession(session);
  });

  it('evaluates a failing step with diagnosis', () => {
    const session = beginSession(MOCK_LESSON, TMP);
    const result = makeResult({ stderr: 'bash: grp: command not found' });
    const stepResult = evaluateStep(session, result);

    expect(stepResult.outcome).toBe('fail');
    if (stepResult.outcome === 'fail') {
      expect(stepResult.diagnosis).toBe('Check spelling.');
      expect(stepResult.hint).toBe('Try ls');
      expect(stepResult.attempts).toBeGreaterThanOrEqual(1);
    }

    endSession(session);
  });

  it('advances hint ladder on repeated failures', () => {
    // Use a unique lesson ID so hint_index starts fresh
    const hintLesson = {
      ...MOCK_LESSON,
      id: 'tutor-hint-' + Math.random().toString(36).slice(2, 10),
    };
    const session = beginSession(hintLesson, TMP);

    // First failure → hint 0
    const r1 = evaluateStep(session, makeResult({ stdout: 'wrong output' }));
    expect(r1.outcome).toBe('fail');
    if (r1.outcome === 'fail') expect(r1.hint).toBe('Try ls');

    // Second failure → hint 1
    const r2 = evaluateStep(session, makeResult({ stdout: 'still wrong' }));
    expect(r2.outcome).toBe('fail');
    if (r2.outcome === 'fail') expect(r2.hint).toBe('Use: ls -la');

    endSession(session);
  });

  it('advances to next step after pass', () => {
    const session = beginSession(MOCK_LESSON, TMP);

    // Pass step 1
    evaluateStep(session, makeResult({ stdout: 'file.txt' }));
    const advResult = advance(session);

    expect(advResult.done).toBe(false);
    expect(advResult.nextStep).not.toBeNull();
    expect(advResult.nextStep!.stepId).toBe('step-read');

    endSession(session);
  });

  it('completes lesson after last step', () => {
    const session = beginSession(MOCK_LESSON, TMP);

    // Pass step 1
    evaluateStep(session, makeResult({ stdout: 'file.txt' }));
    advance(session);

    // Pass step 2
    evaluateStep(session, makeResult({ stdout: 'hello world' }));
    const advResult = advance(session);

    expect(advResult.done).toBe(true);
    expect(advResult.reflection).toBe('You found and read a file. Well done.');

    endSession(session);
  });

  it('resets session workspace', () => {
    const session = beginSession(MOCK_LESSON, TMP);
    const { writeFileSync } = require('node:fs');
    writeFileSync(join(session.workspace.root, 'extra.txt'), 'rogue');

    const reset = resetSession(session);
    expect(existsSync(join(reset.workspace.root, 'extra.txt'))).toBe(false);
    expect(existsSync(join(reset.workspace.root, 'file.txt'))).toBe(true);

    endSession(reset);
  });

  it('provides lesson info with progress', () => {
    const info = getLessonInfo(MOCK_LESSON);
    expect(info.id).toBe('tutor-test');
    expect(info.stepCount).toBe(2);
    expect(info.status).toBe('not_started');
  });
});
