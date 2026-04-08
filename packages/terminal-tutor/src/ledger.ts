/**
 * Progress Ledger — persists lesson progress across sessions.
 *
 * Storage: .terminal-tutor/progress.json in the user's home dir.
 * Simple JSON, no database, no server.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ProgressLedger, LessonProgress } from './types.js';

const LEDGER_DIR = '.terminal-tutor';
const LEDGER_FILE = 'progress.json';

function getLedgerPath(): string {
  return join(homedir(), LEDGER_DIR, LEDGER_FILE);
}

function emptyLedger(): ProgressLedger {
  return { learner: 'default', lessons: {} };
}

function emptyProgress(): LessonProgress {
  return {
    status: 'not_started',
    current_step: null,
    started_at: null,
    completed_at: null,
    attempts: {},
    hint_index: {},
  };
}

/** Load the progress ledger from disk */
export function loadLedger(): ProgressLedger {
  const path = getLedgerPath();
  if (!existsSync(path)) {
    return emptyLedger();
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as ProgressLedger;
  } catch {
    return emptyLedger();
  }
}

/** Save the progress ledger to disk */
export function saveLedger(ledger: ProgressLedger): void {
  const dir = join(homedir(), LEDGER_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getLedgerPath(), JSON.stringify(ledger, null, 2), 'utf-8');
}

/** Get progress for a specific lesson, creating if needed */
export function getLessonProgress(ledger: ProgressLedger, lessonId: string): LessonProgress {
  if (!ledger.lessons[lessonId]) {
    ledger.lessons[lessonId] = emptyProgress();
  }
  return ledger.lessons[lessonId];
}

/** Mark a lesson as started */
export function startLesson(ledger: ProgressLedger, lessonId: string, firstStepId: string): void {
  const progress = getLessonProgress(ledger, lessonId);
  if (progress.status === 'not_started') {
    progress.status = 'in_progress';
    progress.started_at = new Date().toISOString();
  }
  progress.current_step = firstStepId;
  saveLedger(ledger);
}

/** Record an attempt on a step */
export function recordAttempt(ledger: ProgressLedger, lessonId: string, stepId: string): void {
  const progress = getLessonProgress(ledger, lessonId);
  progress.attempts[stepId] = (progress.attempts[stepId] || 0) + 1;
  saveLedger(ledger);
}

/** Advance the hint index for a step */
export function advanceHint(ledger: ProgressLedger, lessonId: string, stepId: string, maxHints: number): number {
  const progress = getLessonProgress(ledger, lessonId);
  const current = progress.hint_index[stepId] || 0;
  const next = Math.min(current + 1, maxHints - 1);
  progress.hint_index[stepId] = next;
  saveLedger(ledger);
  return next;
}

/** Move to the next step */
export function advanceStep(ledger: ProgressLedger, lessonId: string, nextStepId: string): void {
  const progress = getLessonProgress(ledger, lessonId);
  progress.current_step = nextStepId;
  saveLedger(ledger);
}

/** Mark a lesson as complete */
export function completeLesson(ledger: ProgressLedger, lessonId: string): void {
  const progress = getLessonProgress(ledger, lessonId);
  progress.status = 'complete';
  progress.current_step = null;
  progress.completed_at = new Date().toISOString();
  saveLedger(ledger);
}

/** Get a summary of all lesson progress */
export function getProgressSummary(ledger: ProgressLedger): Array<{
  lessonId: string;
  status: string;
  totalAttempts: number;
  completedAt: string | null;
}> {
  return Object.entries(ledger.lessons).map(([lessonId, progress]) => ({
    lessonId,
    status: progress.status,
    totalAttempts: Object.values(progress.attempts).reduce((a, b) => a + b, 0),
    completedAt: progress.completed_at,
  }));
}
