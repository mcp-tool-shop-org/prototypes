/**
 * Mix intelligence — density-aware ducking and repetition guard.
 * Pure functions that read the guard ledger and return adjustment advice.
 * No side effects, no writes — the guard module owns the ledger.
 */

import type { LedgerEntry } from "./guard.js";

// --- Constants ---

/** Window for density classification and repeat counting. */
const DENSITY_WINDOW_MS = 3000;

/** Minimum gain multiplier — prevents sounds from disappearing entirely. */
const GAIN_FLOOR = 0.40;

// --- Types ---

export type DensityLevel = "sparse" | "medium" | "bursty";

export type DuckingPriority = "high" | "normal" | "low";

export interface MixAdvice {
  /** Gain multiplier (0.4–1.0), applied on top of existing gain. */
  gainMultiplier: number;
  /** Release multiplier (< 1.0 shortens tails under density). */
  releaseMultiplier: number;
  /** If set, force this variant index (for repetition rotation). */
  forcedVariantIndex?: number;
  /** Current density level (for diagnostics/testing). */
  density: DensityLevel;
  /** How many times the same verb repeated recently. */
  recentRepeatCount: number;
}

// --- Density classification ---

/**
 * Classify event density based on recent entries in the window.
 * 0–2 events = sparse, 3–5 = medium, 6+ = bursty.
 */
export function classifyDensity(
  entries: LedgerEntry[],
  now: number = Date.now()
): DensityLevel {
  const cutoff = now - DENSITY_WINDOW_MS;
  const recent = entries.filter((e) => e.timestamp > cutoff);
  if (recent.length <= 2) return "sparse";
  if (recent.length <= 5) return "medium";
  return "bursty";
}

// --- Repetition counting ---

/**
 * Count how many times the same verb fired in the recent window.
 * Returns the count of prior occurrences (0 = first time).
 */
export function countRecentRepeats(
  entries: LedgerEntry[],
  verb: string,
  now: number = Date.now(),
  windowMs: number = DENSITY_WINDOW_MS
): number {
  const cutoff = now - windowMs;
  return entries.filter((e) => e.timestamp > cutoff && e.verb === verb).length;
}

// --- Priority tiers ---

/**
 * Get the ducking priority for a verb.
 * High = important culmination events (less ducking).
 * Low = frequent scan events (more ducking during bursts).
 * Normal = everything else.
 */
export function getDuckingPriority(verb: string): DuckingPriority {
  switch (verb) {
    case "commit":
    case "sync":
      return "high";
    case "navigate":
      return "low";
    default:
      return "normal";
  }
}

// --- Density ducking tables ---

const DENSITY_GAIN: Record<DensityLevel, Record<DuckingPriority, number>> = {
  sparse: { high: 1.0, normal: 1.0, low: 1.0 },
  medium: { high: 0.95, normal: 0.88, low: 0.82 },
  bursty: { high: 0.90, normal: 0.75, low: 0.65 },
};

const DENSITY_RELEASE: Record<DensityLevel, number> = {
  sparse: 1.0,
  medium: 0.85,
  bursty: 0.70,
};

// --- Repetition ducking ---

function getRepetitionGain(repeatCount: number): number {
  if (repeatCount <= 1) return 1.0;
  if (repeatCount === 2) return 0.95;
  if (repeatCount === 3) return 0.90;
  return 0.85; // 4+
}

function getRepetitionRelease(repeatCount: number): number {
  if (repeatCount <= 1) return 1.0;
  if (repeatCount === 2) return 1.0;
  if (repeatCount === 3) return 0.85;
  return 0.80; // 4+
}

/**
 * Determine variant rotation for repeated verbs.
 * After 2+ repeats, force rotation to the next variant.
 */
function getRepetitionVariant(
  entries: LedgerEntry[],
  verb: string,
  now: number,
  repeatCount: number
): number | undefined {
  if (repeatCount < 2) return undefined;
  // Rotate based on repeat count (simple modular rotation across 3 variants)
  return repeatCount % 3;
}

// --- Main entry point ---

/**
 * Compute mix advice for a verb given the current ledger state.
 * Returns gain/release multipliers, optional forced variant, and diagnostics.
 */
export function getMixAdvice(
  verb: string,
  entries: LedgerEntry[],
  now: number = Date.now()
): MixAdvice {
  const density = classifyDensity(entries, now);
  const priority = getDuckingPriority(verb);
  const repeatCount = countRecentRepeats(entries, verb, now);

  // Density ducking
  const densityGain = DENSITY_GAIN[density][priority];
  const densityRelease = DENSITY_RELEASE[density];

  // Repetition ducking (composes multiplicatively)
  const repGain = getRepetitionGain(repeatCount);
  const repRelease = getRepetitionRelease(repeatCount);

  // Compose
  const gainMultiplier = Math.max(densityGain * repGain, GAIN_FLOOR);
  const releaseMultiplier = Math.max(densityRelease * repRelease, 0.50);

  // Variant rotation
  const forcedVariantIndex = getRepetitionVariant(entries, verb, now, repeatCount);

  return {
    gainMultiplier,
    releaseMultiplier,
    forcedVariantIndex,
    density,
    recentRepeatCount: repeatCount,
  };
}
