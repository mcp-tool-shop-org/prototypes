import { describe, it, expect, beforeEach } from "vitest";
import {
  registerSong,
  registerSongs,
  validateSong,
  validateRegistry,
  getSong,
  getAllSongs,
  getSongsByGenre,
  getSongsByDifficulty,
  searchSongs,
  getStats,
  _resetRegistry,
} from "./index.js";
import type { SongEntry } from "../types.js";
import { allSongs } from "../songs/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSong(overrides: Partial<SongEntry> = {}): SongEntry {
  return {
    id: "test-song",
    title: "Test Song",
    genre: "jazz",
    difficulty: "beginner",
    key: "C major",
    tempo: 120,
    timeSignature: "4/4",
    durationSeconds: 30,
    musicalLanguage: {
      description: "A test song for unit tests.",
      structure: "AABA",
      keyMoments: ["Bar 1: the beginning"],
      teachingGoals: ["Testing things"],
      styleTips: ["Play it like a test"],
    },
    measures: [
      { number: 1, rightHand: "C4:q", leftHand: "C3:q" },
      { number: 2, rightHand: "D4:q", leftHand: "D3:q" },
    ],
    tags: ["test"],
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SongRegistry", () => {
  // Note: songs from the barrel import are already registered.
  // We reset and re-register for isolation in mutation tests.

  describe("initial load", () => {
    it("has 10 songs registered from the barrel import", () => {
      const songs = getAllSongs();
      expect(songs.length).toBe(10);
    });

    it("covers all 10 genres", () => {
      const stats = getStats();
      const coveredGenres = Object.entries(stats.byGenre)
        .filter(([, count]) => count > 0)
        .map(([genre]) => genre);
      expect(coveredGenres.length).toBe(10);
    });

    it("validates the full registry without errors", () => {
      expect(() => validateRegistry()).not.toThrow();
    });
  });

  describe("getSong", () => {
    it("finds a song by ID", () => {
      const song = getSong("moonlight-sonata-mvt1");
      expect(song).toBeDefined();
      expect(song!.title).toContain("Moonlight Sonata");
      expect(song!.genre).toBe("classical");
    });

    it("returns undefined for unknown ID", () => {
      expect(getSong("nonexistent-song")).toBeUndefined();
    });
  });

  describe("getSongsByGenre", () => {
    it("returns classical songs", () => {
      const songs = getSongsByGenre("classical");
      expect(songs.length).toBe(1);
      expect(songs[0].id).toBe("moonlight-sonata-mvt1");
    });

    it("returns empty array for genre with no extra songs", () => {
      // All genres have exactly 1 song in the initial load
      for (const genre of ["jazz", "pop", "blues", "rock", "rnb", "latin", "film", "ragtime", "new-age"] as const) {
        expect(getSongsByGenre(genre).length).toBe(1);
      }
    });
  });

  describe("getSongsByDifficulty", () => {
    it("returns beginner songs", () => {
      const beginners = getSongsByDifficulty("beginner");
      expect(beginners.length).toBeGreaterThan(0);
      for (const s of beginners) {
        expect(s.difficulty).toBe("beginner");
      }
    });
  });

  describe("searchSongs", () => {
    it("filters by genre", () => {
      const results = searchSongs({ genre: "blues" });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("basic-12-bar-blues");
    });

    it("filters by difficulty", () => {
      const results = searchSongs({ difficulty: "advanced" });
      expect(results.every((s) => s.difficulty === "advanced")).toBe(true);
    });

    it("searches by query (title)", () => {
      const results = searchSongs({ query: "moonlight" });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("moonlight-sonata-mvt1");
    });

    it("searches by query (composer)", () => {
      const results = searchSongs({ query: "beethoven" });
      expect(results.length).toBe(1);
    });

    it("searches by query (tag)", () => {
      const results = searchSongs({ query: "arpeggios" });
      expect(results.length).toBeGreaterThan(0);
    });

    it("filters by tags", () => {
      const results = searchSongs({ tags: ["swing"] });
      expect(results.length).toBeGreaterThan(0);
      for (const s of results) {
        expect(s.tags.some((t) => t.toLowerCase() === "swing")).toBe(true);
      }
    });

    it("filters by maxDuration", () => {
      const results = searchSongs({ maxDuration: 35 });
      for (const s of results) {
        expect(s.durationSeconds).toBeLessThanOrEqual(35);
      }
    });

    it("combines multiple filters", () => {
      const results = searchSongs({ genre: "jazz", difficulty: "intermediate" });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("autumn-leaves");
    });

    it("returns empty for impossible combination", () => {
      const results = searchSongs({ genre: "jazz", difficulty: "advanced" });
      expect(results.length).toBe(0);
    });
  });

  describe("getStats", () => {
    it("returns correct totals", () => {
      const stats = getStats();
      expect(stats.totalSongs).toBe(10);
      expect(stats.totalMeasures).toBeGreaterThan(0);
    });

    it("genre counts sum to total", () => {
      const stats = getStats();
      const genreSum = Object.values(stats.byGenre).reduce((a, b) => a + b, 0);
      expect(genreSum).toBe(stats.totalSongs);
    });

    it("difficulty counts sum to total", () => {
      const stats = getStats();
      const diffSum = Object.values(stats.byDifficulty).reduce((a, b) => a + b, 0);
      expect(diffSum).toBe(stats.totalSongs);
    });
  });

  describe("validation", () => {
    it("rejects invalid genre", () => {
      const errors = validateSong(makeSong({ genre: "dubstep" as any }));
      expect(errors.some((e) => e.includes("genre"))).toBe(true);
    });

    it("rejects invalid difficulty", () => {
      const errors = validateSong(makeSong({ difficulty: "expert" as any }));
      expect(errors.some((e) => e.includes("difficulty"))).toBe(true);
    });

    it("rejects non-kebab-case ID", () => {
      const errors = validateSong(makeSong({ id: "CamelCase" }));
      expect(errors.some((e) => e.includes("kebab-case"))).toBe(true);
    });

    it("rejects empty measures", () => {
      const errors = validateSong(makeSong({ measures: [] }));
      expect(errors.some((e) => e.includes("measures"))).toBe(true);
    });

    it("rejects out-of-range tempo", () => {
      const errors = validateSong(makeSong({ tempo: 500 }));
      expect(errors.some((e) => e.includes("tempo"))).toBe(true);
    });

    it("rejects bad timeSignature format", () => {
      const errors = validateSong(makeSong({ timeSignature: "four-four" }));
      expect(errors.some((e) => e.includes("timeSignature"))).toBe(true);
    });

    it("rejects misnumbered measures", () => {
      const errors = validateSong(
        makeSong({
          measures: [
            { number: 1, rightHand: "C4:q", leftHand: "C3:q" },
            { number: 5, rightHand: "D4:q", leftHand: "D3:q" },
          ],
        })
      );
      expect(errors.some((e) => e.includes("measure[1]"))).toBe(true);
    });

    it("accepts a fully valid song", () => {
      const errors = validateSong(makeSong());
      expect(errors.length).toBe(0);
    });
  });

  describe("registerSong", () => {
    it("throws on duplicate ID (songs already loaded)", () => {
      expect(() => registerSong(allSongs[0])).toThrow(/Duplicate/);
    });
  });

  describe("song data integrity", () => {
    it("all songs have at least 4 measures", () => {
      for (const song of getAllSongs()) {
        expect(song.measures.length).toBeGreaterThanOrEqual(4);
      }
    });

    it("all songs have teaching goals", () => {
      for (const song of getAllSongs()) {
        expect(song.musicalLanguage.teachingGoals.length).toBeGreaterThan(0);
      }
    });

    it("all songs have key moments", () => {
      for (const song of getAllSongs()) {
        expect(song.musicalLanguage.keyMoments.length).toBeGreaterThan(0);
      }
    });

    it("measure numbers are sequential starting from 1", () => {
      for (const song of getAllSongs()) {
        for (let i = 0; i < song.measures.length; i++) {
          expect(song.measures[i].number).toBe(i + 1);
        }
      }
    });

    it("all songs have at least one tag", () => {
      for (const song of getAllSongs()) {
        expect(song.tags.length).toBeGreaterThan(0);
      }
    });
  });
});
