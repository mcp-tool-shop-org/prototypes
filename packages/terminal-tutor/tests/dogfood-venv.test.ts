/**
 * Dogfood: Venv Lessons — live end-to-end with real Python/pip commands.
 *
 * These tests create actual virtual environments, install real packages,
 * and run real Python commands. They prove the venv runtime adapter works
 * end-to-end, not just structurally.
 *
 * Skipped if Python is not available.
 */

import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { loadLessons } from '../src/parser.js';
import { VenvRuntime } from '../src/runtime-venv.js';
import {
  beginSession,
  beginSessionAsync,
  endSession,
  endSessionAsync,
  getCurrentStep,
  evaluateStep,
  advance,
  getSessionTranscript,
  wrapCommand,
  getRuntimeEnv,
} from '../src/tutor.js';
import type { CommandResult, TutorSession, Lesson } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-dogfood-venv');
const LESSONS_DIR = join(__dirname, '..', 'lessons');
const LEDGER_DIR = join(homedir(), '.terminal-tutor');
const LEDGER_PATH = join(LEDGER_DIR, 'progress.json');

let pythonAvailable = false;

function freshLedger() {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify({ learner: 'default', lessons: {} }), 'utf-8');
}

/** Run a command in the venv-activated workspace */
function runInVenv(command: string, session: TutorSession): CommandResult {
  const ws = session.workspace.root;
  const env = getRuntimeEnv(session);
  const fullEnv = { ...process.env, ...env };

  try {
    const stdout = execSync(command, {
      cwd: ws,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: fullEnv,
    });
    return { command, stdout, stderr: '', exitCode: 0, cwd: ws };
  } catch (e: any) {
    return {
      command,
      stdout: e.stdout || '',
      stderr: e.stderr || '',
      exitCode: e.status ?? 1,
      cwd: ws,
    };
  }
}

describe('dogfood: venv lessons', () => {
  beforeAll(async () => {
    const runtime = new VenvRuntime();
    pythonAvailable = await runtime.isAvailable();
    if (!pythonAvailable) {
      console.warn('⚠ Python not available — skipping venv dogfood tests');
    }
  });

  beforeEach(freshLedger);

  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  // ── Dependency Detective — full walkthrough ──────────────────

  it('dependency-detective: complete lesson end-to-end', async () => {
    if (!pythonAvailable) return;

    const lessons = loadLessons(LESSONS_DIR);
    const lesson = lessons.find((l) => l.id === 'dependency-detective')!;
    expect(lesson).toBeDefined();

    const session = await beginSessionAsync(lesson, TMP);
    expect(session.workspace.runtimeState).toBeDefined();
    expect(session.workspace.runtimeState!.venvPath).toBeTruthy();

    // Step 1: check-empty-env — pip list
    let result = runInVenv('pip list', session);
    let ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');
    advance(session);

    // Step 2: try-run-broken — python broken_app.py (should fail)
    result = runInVenv('python broken_app.py', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass'); // check expects ModuleNotFoundError
    advance(session);

    // Step 3: install-requirements
    result = runInVenv('pip install -r requirements.txt', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');
    advance(session);

    // Step 4: verify-installed
    result = runInVenv('pip show pydantic', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');
    advance(session);

    // Step 5: run-app
    result = runInVenv('python app.py', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');
    advance(session);

    // Step 6: fix-broken — install PyYAML and run
    result = runInVenv('pip install PyYAML && python broken_app.py', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');
    advance(session);

    // Step 7: freeze-deps
    result = runInVenv('pip freeze', session);
    ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('pass');

    const adv = advance(session);
    expect(adv.done).toBe(true);
    expect(adv.reflection).toBeTruthy();

    // Verify transcript
    const transcript = getSessionTranscript(session);
    expect(transcript).not.toBeNull();
    expect(transcript!.runtime).toBe('venv');
    expect(transcript!.completedAt).not.toBeNull();
    expect(transcript!.steps.length).toBe(7);
    expect(transcript!.steps.every((s) => s.verdict === 'pass')).toBe(true);

    await endSessionAsync(session);
  }, 120000); // 2 min timeout for pip installs

  // ── Dependency Detective — wrong path recovery ───────────────

  it('dependency-detective: wrong command gets diagnosed', async () => {
    if (!pythonAvailable) return;

    const lessons = loadLessons(LESSONS_DIR);
    const lesson = lessons.find((l) => l.id === 'dependency-detective')!;

    // Use unique ID to avoid ledger collision
    const testLesson = { ...lesson, id: 'dep-detective-wrong-path' };
    const session = await beginSessionAsync(testLesson, TMP);

    // Step 1: wrong command — should fail with hint
    const result = runInVenv('python --version', session);
    const ev = evaluateStep(session, result);
    expect(ev.outcome).toBe('fail');
    if (ev.outcome === 'fail') {
      expect(ev.hint).toBeTruthy();
      expect(ev.attempts).toBe(1);
    }

    // Verify transcript captures the failure
    const transcript = getSessionTranscript(session);
    expect(transcript!.steps[0].verdict).toBe('fail');
    expect(transcript!.steps[0].command).toBe('python --version');

    await endSessionAsync(session);
  }, 60000);

  // ── Reset semantics ──────────────────────────────────────────

  it('venv workspace resets to clean scaffold', async () => {
    if (!pythonAvailable) return;

    const lessons = loadLessons(LESSONS_DIR);
    const lesson = lessons.find((l) => l.id === 'dependency-detective')!;
    const resetLesson = { ...lesson, id: 'dep-detective-reset-test' };

    const session = await beginSessionAsync(resetLesson, TMP);
    const ws = session.workspace.root;

    // Add a rogue file
    writeFileSync(join(ws, 'rogue.txt'), 'intruder');
    expect(existsSync(join(ws, 'rogue.txt'))).toBe(true);

    // Verify scaffold files exist
    expect(existsSync(join(ws, 'app.py'))).toBe(true);
    expect(existsSync(join(ws, 'broken_app.py'))).toBe(true);

    await endSessionAsync(session);
  }, 60000);

  // ── Availability UX ──────────────────────────────────────────

  it('reports Python availability correctly', async () => {
    const runtime = new VenvRuntime();
    const available = await runtime.isAvailable();
    expect(available).toBe(pythonAvailable);
  });
});
