/**
 * Game Engine — replayable scenario evaluation on top of the tutor loop.
 *
 * A game is a lesson with win/lose conditions, scoring, and replay.
 * It reuses the same parser, runtimes, checker, and workspace system.
 * The game engine adds:
 * - Win condition evaluation (check all conditions at once)
 * - Fail condition tracking (timeout, command count)
 * - Scoring (par time, hint penalty, command economy)
 * - Session timing
 *
 * Product law: commands ARE the mechanics. No fake game loops.
 */

import type {
  Lesson,
  GameSpec,
  GameVerdict,
  GameScore,
  WinCondition,
  FailCondition,
  CommandResult,
  StepCheck,
  TutorSession,
} from './types.js';
import { evaluateCheck } from './checker.js';

// ── Win Condition Evaluation ─────────────────────────────────────

/**
 * Evaluate all win conditions for a game.
 * This is the "did you beat the scenario?" check, separate from
 * step-by-step evaluation which is the guided path.
 *
 * In a game, the player can check win conditions at any time
 * to see if they've completed the mission.
 */
export function evaluateWinConditions(
  game: GameSpec,
  lastResult: CommandResult,
  workspaceRoot: string,
): GameVerdict {
  const details = game.win_conditions.map((wc) => {
    const check = winConditionToCheck(wc);
    const result = evaluateCheck(check, lastResult, workspaceRoot);
    return {
      description: wc.description,
      met: result.passed,
      message: result.message,
    };
  });

  const conditionsMet = details.filter((d) => d.met).length;

  return {
    won: conditionsMet === details.length,
    conditionsMet,
    conditionsTotal: details.length,
    details,
  };
}

/** Convert a WinCondition to a StepCheck (same shape, different name) */
function winConditionToCheck(wc: WinCondition): StepCheck {
  return {
    type: wc.type,
    expect: wc.expect,
    expect_ordered: wc.expect_ordered,
    files: wc.files,
    file_path: wc.file_path,
    file_patterns: wc.file_patterns,
    code: wc.code,
    branch: wc.branch,
    clean: wc.clean,
    commit_pattern: wc.commit_pattern,
  };
}

// ── Fail Condition Tracking ──────────────────────────────────────

export interface GameState {
  startTime: number;
  commandCount: number;
  hintsUsed: number;
  resets: number;
}

export function createGameState(): GameState {
  return {
    startTime: Date.now(),
    commandCount: 0,
    hintsUsed: 0,
    resets: 0,
  };
}

/**
 * Check if any fail condition has been triggered.
 * Returns the first triggered condition, or null.
 */
export function checkFailConditions(
  failConditions: FailCondition[] | undefined,
  state: GameState,
): { failed: boolean; condition?: FailCondition } {
  if (!failConditions || failConditions.length === 0) {
    return { failed: false };
  }

  for (const fc of failConditions) {
    switch (fc.type) {
      case 'timeout': {
        const elapsed = (Date.now() - state.startTime) / 1000;
        if (fc.value && elapsed > fc.value) {
          return { failed: true, condition: fc };
        }
        break;
      }
      case 'max_commands': {
        if (fc.value && state.commandCount > fc.value) {
          return { failed: true, condition: fc };
        }
        break;
      }
      // blocked_action is handled by the safety system, not here
    }
  }

  return { failed: false };
}

// ── Scoring ──────────────────────────────────────────────────────

/**
 * Compute the game score after a win.
 */
export function computeGameScore(
  game: GameSpec,
  state: GameState,
): GameScore {
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  const parTime = game.scoring.par_time;

  let parRating: GameScore['parRating'];
  if (!parTime) {
    parRating = 'no_par';
  } else if (elapsed < parTime * 0.8) {
    parRating = 'under_par';
  } else if (elapsed <= parTime * 1.2) {
    parRating = 'at_par';
  } else {
    parRating = 'over_par';
  }

  return {
    elapsed,
    commandCount: state.commandCount,
    hintsUsed: state.hintsUsed,
    resets: state.resets,
    parRating,
    noHints: state.hintsUsed === 0,
  };
}

// ── Game Session Helpers ─────────────────────────────────────────

/** Check if a lesson is a game */
export function isGame(lesson: Lesson): boolean {
  return lesson.mode === 'game' && lesson.game !== undefined;
}

/** Get the game briefing text */
export function getBriefing(lesson: Lesson): string | null {
  if (!isGame(lesson)) return null;
  return lesson.game!.briefing;
}

/** Get the victory/defeat text */
export function getOutcomeText(lesson: Lesson, won: boolean): string | null {
  if (!isGame(lesson)) return null;
  return won ? lesson.game!.victory : (lesson.game!.defeat ?? 'Mission failed.');
}
