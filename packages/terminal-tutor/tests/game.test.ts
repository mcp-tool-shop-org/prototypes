import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadLessons } from '../src/parser.js';
import {
  evaluateWinConditions,
  checkFailConditions,
  computeGameScore,
  createGameState,
  isGame,
  getBriefing,
  getOutcomeText,
} from '../src/game.js';
import type { CommandResult, GameSpec } from '../src/types.js';

const GAMES_DIR = join(__dirname, '..', 'games');
const LESSONS_DIR = join(__dirname, '..', 'lessons');

function makeResult(overrides: Partial<CommandResult> = {}): CommandResult {
  return { command: 'test', stdout: '', stderr: '', exitCode: 0, cwd: '/tmp', ...overrides };
}

describe('game engine', () => {
  describe('game detection', () => {
    it('identifies games vs lessons', () => {
      const lessons = loadLessons(LESSONS_DIR);
      const games = loadLessons(GAMES_DIR);

      // Lessons have mode: lesson (or undefined)
      for (const lesson of lessons) {
        expect(isGame(lesson)).toBe(false);
      }

      // Games have mode: game
      for (const game of games) {
        expect(isGame(game)).toBe(true);
      }
    });
  });

  describe('game parsing', () => {
    it('parses all games from the games directory', () => {
      const games = loadLessons(GAMES_DIR);
      expect(games.length).toBe(3);
      expect(games.map((g) => g.id)).toContain('filesystem-salvage');
      expect(games.map((g) => g.id)).toContain('dependency-lab');
      expect(games.map((g) => g.id)).toContain('service-siege');
    });

    it('every game has required game spec fields', () => {
      const games = loadLessons(GAMES_DIR);
      for (const game of games) {
        expect(game.mode).toBe('game');
        expect(game.game).toBeDefined();
        expect(game.game!.win_conditions.length).toBeGreaterThan(0);
        expect(game.game!.scoring).toBeDefined();
        expect(game.game!.briefing).toBeTruthy();
        expect(game.game!.victory).toBeTruthy();
      }
    });

    it('every game also has valid lesson structure (steps, hints)', () => {
      const games = loadLessons(GAMES_DIR);
      for (const game of games) {
        expect(game.steps.length).toBeGreaterThan(0);
        for (const step of game.steps) {
          expect(step.hints.length).toBeGreaterThanOrEqual(1);
        }
        expect(game.reflection).toBeTruthy();
        expect(game.flavor).toBeTruthy();
      }
    });
  });

  describe('briefing and outcome', () => {
    it('returns briefing for games', () => {
      const games = loadLessons(GAMES_DIR);
      for (const game of games) {
        const briefing = getBriefing(game);
        expect(briefing).toBeTruthy();
        expect(briefing!.length).toBeGreaterThan(50);
      }
    });

    it('returns null for non-games', () => {
      const lessons = loadLessons(LESSONS_DIR);
      expect(getBriefing(lessons[0])).toBeNull();
    });

    it('returns victory/defeat text', () => {
      const games = loadLessons(GAMES_DIR);
      for (const game of games) {
        expect(getOutcomeText(game, true)).toBeTruthy();
        expect(getOutcomeText(game, false)).toBeTruthy();
      }
    });
  });

  describe('win condition evaluation', () => {
    it('evaluates file_exists conditions', () => {
      const game: GameSpec = {
        win_conditions: [
          { type: 'file_exists', description: 'Recovery file', files: ['RECOVERED.txt'] },
        ],
        scoring: { hint_penalty: false, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };

      // File doesn't exist
      const verdict = evaluateWinConditions(game, makeResult(), '/tmp/nonexistent');
      expect(verdict.won).toBe(false);
      expect(verdict.conditionsMet).toBe(0);
      expect(verdict.conditionsTotal).toBe(1);
    });

    it('evaluates exit_code conditions', () => {
      const game: GameSpec = {
        win_conditions: [
          { type: 'exit_code', description: 'Tests pass', code: 0 },
        ],
        scoring: { hint_penalty: false, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };

      const pass = evaluateWinConditions(game, makeResult({ exitCode: 0 }), '/tmp');
      expect(pass.won).toBe(true);

      const fail = evaluateWinConditions(game, makeResult({ exitCode: 1 }), '/tmp');
      expect(fail.won).toBe(false);
    });

    it('requires ALL conditions to win', () => {
      const game: GameSpec = {
        win_conditions: [
          { type: 'exit_code', description: 'Condition 1', code: 0 },
          { type: 'output_contains', description: 'Condition 2', expect: ['hello'] },
        ],
        scoring: { hint_penalty: false, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };

      // Only first condition met
      const partial = evaluateWinConditions(game, makeResult({ exitCode: 0, stdout: 'world' }), '/tmp');
      expect(partial.won).toBe(false);
      expect(partial.conditionsMet).toBe(1);
      expect(partial.conditionsTotal).toBe(2);

      // Both met
      const full = evaluateWinConditions(game, makeResult({ exitCode: 0, stdout: 'hello' }), '/tmp');
      expect(full.won).toBe(true);
    });
  });

  describe('fail conditions', () => {
    it('detects timeout', () => {
      const state = createGameState();
      state.startTime = Date.now() - 1000000; // Way in the past

      const result = checkFailConditions(
        [{ type: 'timeout', value: 300, message: 'Time up' }],
        state,
      );
      expect(result.failed).toBe(true);
      expect(result.condition!.message).toBe('Time up');
    });

    it('detects max commands', () => {
      const state = createGameState();
      state.commandCount = 150;

      const result = checkFailConditions(
        [{ type: 'max_commands', value: 100, message: 'Too many commands' }],
        state,
      );
      expect(result.failed).toBe(true);
    });

    it('passes when within limits', () => {
      const state = createGameState();
      state.commandCount = 5;

      const result = checkFailConditions(
        [
          { type: 'timeout', value: 300, message: 'Time up' },
          { type: 'max_commands', value: 100, message: 'Too many' },
        ],
        state,
      );
      expect(result.failed).toBe(false);
    });

    it('returns not failed when no conditions', () => {
      expect(checkFailConditions(undefined, createGameState()).failed).toBe(false);
      expect(checkFailConditions([], createGameState()).failed).toBe(false);
    });
  });

  describe('scoring', () => {
    it('computes under_par for fast completion', () => {
      const game: GameSpec = {
        win_conditions: [],
        scoring: { par_time: 300, hint_penalty: true, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };
      const state = createGameState();
      state.startTime = Date.now() - 100000; // 100 seconds

      const score = computeGameScore(game, state);
      expect(score.parRating).toBe('under_par');
      expect(score.elapsed).toBeGreaterThan(0);
    });

    it('computes over_par for slow completion', () => {
      const game: GameSpec = {
        win_conditions: [],
        scoring: { par_time: 60, hint_penalty: true, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };
      const state = createGameState();
      state.startTime = Date.now() - 300000; // 300 seconds

      const score = computeGameScore(game, state);
      expect(score.parRating).toBe('over_par');
    });

    it('computes no_par when par_time not set', () => {
      const game: GameSpec = {
        win_conditions: [],
        scoring: { hint_penalty: false, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };
      const score = computeGameScore(game, createGameState());
      expect(score.parRating).toBe('no_par');
    });

    it('tracks noHints flag', () => {
      const game: GameSpec = {
        win_conditions: [],
        scoring: { hint_penalty: true, reset_penalty: false },
        briefing: 'test',
        victory: 'test',
      };
      const state = createGameState();
      state.hintsUsed = 0;
      expect(computeGameScore(game, state).noHints).toBe(true);

      state.hintsUsed = 3;
      expect(computeGameScore(game, state).noHints).toBe(false);
    });
  });
});
