// ─── ai-music-sheets ────────────────────────────────────────────────────────
//
// Piano sheet music in hybrid JSON + musical-language format,
// built for LLMs to read, reason about, and teach from.
//
// Usage:
//   import { getAllSongs, searchSongs, getSong, getStats } from "ai-music-sheets";
//
//   const blues = searchSongs({ genre: "blues" });
//   const moonlight = getSong("moonlight-sonata-mvt1");
//   const stats = getStats();
// ─────────────────────────────────────────────────────────────────────────────

// Load all songs into the registry (side-effect import)
import "./songs/index.js";

// Re-export types
export type {
  SongEntry,
  Measure,
  MusicalLanguage,
  Genre,
  Difficulty,
  NoteFormat,
  RegistryStats,
  SearchOptions,
} from "./types.js";

export { GENRES, DIFFICULTIES } from "./types.js";

// Re-export registry API
export {
  getSong,
  getAllSongs,
  getSongsByGenre,
  getSongsByDifficulty,
  searchSongs,
  getStats,
  validateRegistry,
  registerSong,
  registerSongs,
  validateSong,
} from "./registry/index.js";

// Re-export MIDI ingest pipeline
export { midiToSongEntry, midiNoteToScientific } from "./midi/ingest.js";

// Re-export MIDI modules
export {
  separateHands,
  groupIntoChords,
  isChord,
  formatNote,
  formatHand,
  chordToString,
  ticksToDuration,
} from "./midi/hands.js";
export type { HandSplit } from "./midi/hands.js";

export {
  ticksPerMeasure,
  computeTotalMeasures,
  sliceIntoMeasures,
  parseTimeSignature,
  resolveTimeSignature,
} from "./midi/measures.js";
export type { MeasureBucket } from "./midi/measures.js";

export type { ResolvedNote, TempoEvent, TimeSigEvent } from "./midi/types.js";

// Re-export config schema + validation
export {
  SongConfigSchema,
  MusicalLanguageSchema,
  MeasureOverrideSchema,
  validateConfig,
} from "./config/schema.js";
export type { SongConfig, MeasureOverride, ConfigError } from "./config/schema.js";
