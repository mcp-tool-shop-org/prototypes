import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import {
  getAllTracks,
  getTrack,
  computeMastery,
  getTrackProgress,
  getAllTrackProgress,
  suggestNext,
} from '../src/tracks.js';
import {
  loadLedger,
  saveLedger,
  startLesson,
  recordAttempt,
  advanceHint,
  completeLesson,
} from '../src/ledger.js';
import { loadLessons } from '../src/parser.js';

const LEDGER_DIR = join(homedir(), '.terminal-tutor');
const LEDGER_PATH = join(LEDGER_DIR, 'progress.json');
const LESSONS_DIR = join(__dirname, '..', 'lessons');
const GAMES_DIR = join(__dirname, '..', 'games');

function loadAll() {
  const lessons = loadLessons(LESSONS_DIR);
  try { return [...lessons, ...loadLessons(GAMES_DIR)]; } catch { return lessons; }
}

let originalLedger: string | null = null;

function freshLedger() {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, JSON.stringify({ learner: 'default', lessons: {} }), 'utf-8');
}

describe('tracks', () => {
  beforeAll(() => {
    if (existsSync(LEDGER_PATH)) {
      originalLedger = readFileSync(LEDGER_PATH, 'utf-8');
    }
  });

  beforeEach(freshLedger);

  afterAll(() => {
    if (originalLedger !== null) {
      writeFileSync(LEDGER_PATH, originalLedger, 'utf-8');
    }
  });

  describe('catalog', () => {
    it('has tracks', () => {
      const tracks = getAllTracks();
      expect(tracks.length).toBeGreaterThanOrEqual(4);
    });

    it('every track references real lessons', () => {
      const all = loadAll();
      const ids = new Set(all.map((l) => l.id));

      for (const track of getAllTracks()) {
        for (const lessonId of track.lessons) {
          expect(ids.has(lessonId)).toBe(true);
        }
      }
    });

    it('every lesson appears in at least one track', () => {
      const lessons = loadAll();
      const tracks = getAllTracks();
      const trackedLessonIds = new Set(tracks.flatMap((t) => t.lessons));

      for (const lesson of lessons) {
        expect(trackedLessonIds.has(lesson.id)).toBe(true);
      }
    });

    it('getTrack returns specific track', () => {
      const track = getTrack('shell-fundamentals');
      expect(track).toBeDefined();
      expect(track!.name).toBe('Shell Fundamentals');
    });

    it('getTrack returns undefined for unknown track', () => {
      expect(getTrack('nonexistent')).toBeUndefined();
    });
  });

  describe('mastery', () => {
    it('returns null for incomplete lesson', () => {
      expect(computeMastery('files-and-navigation')).toBeNull();
    });

    it('returns clean fluency for first-try no-hint completion', () => {
      const ledger = loadLedger();
      startLesson(ledger, 'test-clean', 'step-1');
      recordAttempt(ledger, 'test-clean', 'step-1');
      recordAttempt(ledger, 'test-clean', 'step-2');
      completeLesson(ledger, 'test-clean');

      const mastery = computeMastery('test-clean');
      expect(mastery).not.toBeNull();
      expect(mastery!.fluency).toBe('clean');
      expect(mastery!.noHints).toBe(true);
      expect(mastery!.firstTry).toBe(true);
      expect(mastery!.struggleSteps).toEqual([]);
    });

    it('returns guided fluency for heavy-hint completion', () => {
      const ledger = loadLedger();
      startLesson(ledger, 'test-guided', 'step-1');
      // 5 attempts on step-1
      for (let i = 0; i < 5; i++) {
        recordAttempt(ledger, 'test-guided', 'step-1');
        advanceHint(ledger, 'test-guided', 'step-1', 3);
      }
      recordAttempt(ledger, 'test-guided', 'step-2');
      completeLesson(ledger, 'test-guided');

      const mastery = computeMastery('test-guided');
      expect(mastery!.fluency).toBe('guided');
      expect(mastery!.noHints).toBe(false);
      expect(mastery!.struggleSteps).toContain('step-1');
    });

    it('returns solid fluency for moderate performance', () => {
      const ledger = loadLedger();
      startLesson(ledger, 'test-solid', 'step-1');
      recordAttempt(ledger, 'test-solid', 'step-1');
      recordAttempt(ledger, 'test-solid', 'step-1'); // 2 attempts
      advanceHint(ledger, 'test-solid', 'step-1', 3); // 1 hint
      recordAttempt(ledger, 'test-solid', 'step-2');
      completeLesson(ledger, 'test-solid');

      const mastery = computeMastery('test-solid', ledger);
      expect(mastery).not.toBeNull();
      expect(mastery!.fluency).toBe('solid');
    });
  });

  describe('track progress', () => {
    it('shows not_started for fresh track', () => {
      const tp = getTrackProgress('shell-fundamentals');
      expect(tp).not.toBeNull();
      expect(tp!.lessonsCompleted).toBe(0);
      expect(tp!.overallFluency).toBe('not_started');
    });

    it('shows partial progress', () => {
      const ledger = loadLedger();
      startLesson(ledger, 'files-and-navigation', 'step-1');
      recordAttempt(ledger, 'files-and-navigation', 'step-1');
      completeLesson(ledger, 'files-and-navigation');

      const tp = getTrackProgress('shell-fundamentals');
      expect(tp!.lessonsCompleted).toBeGreaterThanOrEqual(1);
      expect(tp!.lessonsTotal).toBeGreaterThanOrEqual(2);
    });

    it('returns null for unknown track', () => {
      expect(getTrackProgress('nonexistent')).toBeNull();
    });
  });

  describe('suggestNext', () => {
    it('suggests first lesson of first track when fresh', () => {
      const suggestion = suggestNext();
      expect(suggestion).not.toBeNull();
      expect(suggestion!.trackId).toBe('shell-fundamentals');
      expect(suggestion!.lessonId).toBe('files-and-navigation');
    });

    it('skips completed lessons', () => {
      const ledger = loadLedger();
      startLesson(ledger, 'files-and-navigation', 'step-1');
      completeLesson(ledger, 'files-and-navigation');

      const suggestion = suggestNext();
      expect(suggestion!.lessonId).toBe('pipes-and-search');
    });

    it('returns null when all lessons complete', () => {
      const ledger = loadLedger();
      const tracks = getAllTracks();
      for (const track of tracks) {
        for (const lessonId of track.lessons) {
          startLesson(ledger, lessonId, 'step-1');
          completeLesson(ledger, lessonId);
        }
      }

      expect(suggestNext()).toBeNull();
    });
  });
});
