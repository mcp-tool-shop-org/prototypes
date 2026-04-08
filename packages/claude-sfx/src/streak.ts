/**
 * Streak tracker — momentum and error escalation state.
 *
 * Tracks two independent counters persisted in a temp file:
 *   - streak: consecutive successful plays → drives intensity (harmonic layering)
 *   - errorRun: consecutive error-status plays → drives escalation (urgency)
 *
 * State resets:
 *   - streak resets on error, on idle (30s gap), or on session end
 *   - errorRun resets on success or on session end
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const STREAK_FILE = join(tmpdir(), "claude-sfx-streak.json");

/** Idle timeout — streak resets if no play within this window. */
const IDLE_TIMEOUT_MS = 30_000; // 30 seconds

/** Maximum intensity level (caps harmonic layering). */
export const MAX_INTENSITY = 5;

/** Maximum error escalation level (caps urgency increase). */
export const MAX_ESCALATION = 5;

/** Intensity thresholds — streak count required for each intensity level. */
const INTENSITY_THRESHOLDS = [1, 3, 6, 10, 15];

export interface StreakState {
  /** Current streak count (consecutive successful plays). */
  streak: number;
  /** Current error run count (consecutive errors). */
  errorRun: number;
  /** Timestamp of last play (for idle detection). */
  lastPlayAt: number;
  /** Total successful plays this session (for fanfare). */
  sessionSuccesses: number;
  /** Total error plays this session (for fanfare). */
  sessionErrors: number;
}

function defaultState(): StreakState {
  return {
    streak: 0,
    errorRun: 0,
    lastPlayAt: 0,
    sessionSuccesses: 0,
    sessionErrors: 0,
  };
}

/** Read the current streak state from disk. */
export function readStreak(): StreakState {
  if (!existsSync(STREAK_FILE)) return defaultState();
  try {
    const raw = readFileSync(STREAK_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

/** Write streak state to disk. */
export function writeStreak(state: StreakState): void {
  writeFileSync(STREAK_FILE, JSON.stringify(state));
}

/**
 * Record a successful play and return the current intensity level (1-5).
 * Resets error run. Resets streak if idle too long.
 */
export function recordSuccess(verb: string): { intensity: number; state: StreakState } {
  const state = readStreak();
  const now = Date.now();

  // Reset streak if idle too long
  if (state.lastPlayAt > 0 && (now - state.lastPlayAt) > IDLE_TIMEOUT_MS) {
    state.streak = 0;
  }

  state.streak++;
  state.errorRun = 0;
  state.lastPlayAt = now;
  state.sessionSuccesses++;

  writeStreak(state);

  return { intensity: streakToIntensity(state.streak), state };
}

/**
 * Record an error play and return the current escalation level (1-5).
 * Resets streak.
 */
export function recordError(): { escalation: number; state: StreakState } {
  const state = readStreak();
  const now = Date.now();

  state.streak = 0;
  state.errorRun++;
  state.lastPlayAt = now;
  state.sessionErrors++;

  writeStreak(state);

  return { escalation: errorRunToEscalation(state.errorRun), state };
}

/** Convert streak count to intensity level (1-5). */
export function streakToIntensity(streak: number): number {
  let level = 1;
  for (const threshold of INTENSITY_THRESHOLDS) {
    if (streak >= threshold) level++;
  }
  return Math.min(level, MAX_INTENSITY);
}

/** Convert error run count to escalation level (1-5). */
export function errorRunToEscalation(errorRun: number): number {
  // Escalation is more aggressive: 1, 2, 3, 4, 5+
  return Math.min(Math.max(errorRun, 1), MAX_ESCALATION);
}

/**
 * Get session outcome for fanfare generation.
 * Returns a ratio (0.0 = all errors, 1.0 = all successes) and total count.
 */
export function getSessionOutcome(): {
  successRatio: number;
  totalPlays: number;
  successes: number;
  errors: number;
} {
  const state = readStreak();
  const total = state.sessionSuccesses + state.sessionErrors;
  return {
    successRatio: total > 0 ? state.sessionSuccesses / total : 1,
    totalPlays: total,
    successes: state.sessionSuccesses,
    errors: state.sessionErrors,
  };
}

/** Reset streak state (for session start or testing). */
export function resetStreak(): void {
  try { unlinkSync(STREAK_FILE); } catch { /* ignore */ }
}
