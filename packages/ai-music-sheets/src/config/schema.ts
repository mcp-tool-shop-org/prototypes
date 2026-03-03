// ─── Song Config Schema ──────────────────────────────────────────────────────
//
// Human-authored config that accompanies each .mid file.
// Contains everything MIDI doesn't carry: metadata, musical language,
// teaching notes, fingering, and per-measure overrides.
//
// The MIDI ingest pipeline merges this config with extracted note data
// to produce a complete SongEntry.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { GENRES, DIFFICULTIES } from "../types.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const MeasureOverrideSchema = z.object({
  /** 1-based measure number this override applies to. */
  measure: z.number().int().min(1),
  /** Suggested fingering, e.g. "RH: 1-3-5, LH: 5-3-1". */
  fingering: z.string().optional(),
  /** Per-measure teaching note the LLM can read aloud. */
  teachingNote: z.string().optional(),
  /** Dynamics marking: "pp", "p", "mp", "mf", "f", "ff", "crescendo", "decrescendo". */
  dynamics: z.string().optional(),
  /** Tempo override for rubato/ritardando. */
  tempoOverride: z.number().min(10).max(400).optional(),
});

export const MusicalLanguageSchema = z.object({
  /** 1–3 sentence overview of the piece. */
  description: z.string().min(1),
  /** Musical structure: "ABA", "Verse-Chorus-Verse", etc. */
  structure: z.string().min(1),
  /** Notable moments an LLM can reference when teaching. */
  keyMoments: z.array(z.string()),
  /** Pedagogical notes: what the student will learn. */
  teachingGoals: z.array(z.string()),
  /** Style/feel hints for performance. */
  styleTips: z.array(z.string()),
});

export const SongConfigSchema = z.object({
  /** Unique slug: kebab-case. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case"),
  /** Human-readable title. */
  title: z.string().min(1),
  /** Genre — must be one of the 10 canonical genres. */
  genre: z.enum(GENRES),
  /** Composer or artist. */
  composer: z.string().optional(),
  /** Arranger (if simplified/adapted). */
  arranger: z.string().optional(),
  /** Difficulty level. */
  difficulty: z.enum(DIFFICULTIES),
  /** Key signature, e.g. "C major", "A minor". */
  key: z.string().min(1),
  /** Default tempo in BPM (overrides MIDI tempo if set). */
  tempo: z.number().min(10).max(400).optional(),
  /** Time signature, e.g. "4/4", "3/4". */
  timeSignature: z.string().optional(),
  /** Freeform tags for search/filtering. */
  tags: z.array(z.string()),
  /** Source/attribution for the arrangement. */
  source: z.string().optional(),
  /** The LLM-readable musical language layer. */
  musicalLanguage: MusicalLanguageSchema,
  /** Per-measure overrides (fingering, teaching notes, dynamics). */
  measureOverrides: z.array(MeasureOverrideSchema).optional(),
  /**
   * MIDI split point (MIDI note number).
   * Notes >= this go to rightHand, notes < this go to leftHand.
   * Default: 60 (Middle C / C4).
   */
  splitPoint: z.number().int().min(0).max(127).optional(),
});

// ─── Derived Types ───────────────────────────────────────────────────────────

export type SongConfig = z.infer<typeof SongConfigSchema>;
export type MeasureOverride = z.infer<typeof MeasureOverrideSchema>;

// ─── Validation ──────────────────────────────────────────────────────────────

/** Validation error from config checking. */
export interface ConfigError {
  field: string;
  message: string;
}

/**
 * Validate a SongConfig object using the zod schema.
 * Returns an empty array if valid.
 */
export function validateConfig(config: unknown): ConfigError[] {
  const result = SongConfigSchema.safeParse(config);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}
