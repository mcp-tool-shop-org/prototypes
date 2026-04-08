/**
 * Profile system — configurable sound palettes.
 * Each profile defines synthesis parameters for every verb + session sounds.
 * Profiles are JSON-serializable, so users can create their own.
 *
 * Sound design is rooted in A major pentatonic to ensure musical coherence.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Waveform, Envelope } from "./synth.js";

// --- A Major Pentatonic Scale (home key) ---

export const SCALE = {
  A3: 220.00,
  B3: 246.94,
  Cs4: 277.18,
  E4: 329.63,
  Fs4: 369.99,
  A4: 440.00,
  B4: 493.88,
  Cs5: 554.37,
  E5: 659.25,
  Fs5: 739.99,
  A5: 880.00,
  B5: 987.77,
} as const;

/** Ordered scale degrees for modifier lookups (low to high). */
export const SCALE_DEGREES: number[] = [
  SCALE.A3, SCALE.B3, SCALE.Cs4, SCALE.E4, SCALE.Fs4,
  SCALE.A4, SCALE.B4, SCALE.Cs5, SCALE.E5, SCALE.Fs5,
  SCALE.A5, SCALE.B5,
];

/** Get the next lower scale degree. Returns freq × 0.9 as fallback. */
export function scaleStepDown(freq: number): number {
  for (let i = SCALE_DEGREES.length - 1; i >= 0; i--) {
    if (SCALE_DEGREES[i] < freq - 1) return SCALE_DEGREES[i];
  }
  return freq * 0.9;
}

/** Find the closest scale degree to a target frequency. */
export function findClosestScaleDegree(freq: number): number {
  let closest = SCALE_DEGREES[0];
  let minDist = Math.abs(freq - closest);
  for (const deg of SCALE_DEGREES) {
    const dist = Math.abs(freq - deg);
    if (dist < minDist) {
      minDist = dist;
      closest = deg;
    }
  }
  return closest;
}

// --- Profile schema ---

/** A single note within a motif. */
export interface MotifNote {
  /** Frequency in Hz (should be a scale degree). */
  frequency: number;
  /** Duration in seconds. */
  duration: number;
  /** Offset from motif start in milliseconds. Allows overlapping notes/chords. */
  offsetMs: number;
  /** Primary waveform. */
  waveform: Waveform;
  /** Optional secondary waveform for timbral blending. */
  blendWaveform?: Waveform;
  /** Blend amount 0–1 (proportion of blendWaveform vs primary). */
  blendAmount?: number;
  /** ADSR envelope. */
  envelope: Envelope;
  /** Note gain relative to verb master gain (0–1). */
  gain: number;
  /** FM modulator frequency ratio. */
  fmRatio?: number;
  /** FM modulation depth in Hz. */
  fmDepth?: number;
  /** Octave harmonic gain 0–1. */
  harmonicGain?: number;
  /** Tremolo rate in Hz (for warn modifier). */
  tremoloRate?: number;
  /** Tremolo depth 0–1. */
  tremoloDepth?: number;
  /** Detune in Hz (for err modifier / beating). */
  detune?: number;
}

/** Optional filtered-noise transient (percussive onset for execute verb). */
export interface NoiseTransient {
  /** Bandpass center start frequency. */
  freqStart: number;
  /** Bandpass center end frequency. */
  freqEnd: number;
  /** Filter Q (bandwidth). */
  bandwidth: number;
  /** Duration in seconds. */
  duration: number;
  /** Gain relative to verb master gain. */
  gain: number;
}

/** A variant of a motif-based verb. */
export interface MotifVariant {
  notes: MotifNote[];
  noiseTransient?: NoiseTransient;
}

/** A tonal anchor variant for a whoosh verb. */
export interface WhooshAnchorVariant {
  notes: MotifNote[];
}

// --- Verb configs ---

/** Multi-note motif verb (intake, transform, commit, navigate, execute). */
export interface MotifVerbConfig {
  type: "motif";
  /** 3 variants for constrained variation. */
  variants: MotifVariant[];
  /** Master gain 0–1. */
  gain: number;
}

/** Noise-sweep verb with tonal anchors (move, sync). */
export interface WhooshVerbConfig {
  type: "whoosh";
  /** Sweep duration in seconds. */
  duration: number;
  /** Noise sweep frequencies for upward direction [start, end]. */
  freqUp: [number, number];
  /** Noise sweep frequencies for downward direction [start, end]. */
  freqDown: [number, number];
  /** Filter bandwidth (Q). */
  bandwidth: number;
  /** Noise sweep envelope. */
  envelope: Envelope;
  /** Master gain 0–1. */
  gain: number;
  /** Tonal anchor variants mixed under the whoosh. */
  anchorVariants: WhooshAnchorVariant[];
}

export type VerbConfig = MotifVerbConfig | WhooshVerbConfig;

/** A session chime (start/end). */
export interface ChimeConfig {
  tone1: {
    waveform: Waveform;
    frequency: number;
    duration: number;
    envelope: Envelope;
    gain: number;
    harmonicGain?: number;
    blendWaveform?: Waveform;
    blendAmount?: number;
  };
  tone2: {
    waveform: Waveform;
    frequency: number;
    duration: number;
    envelope: Envelope;
    gain: number;
    harmonicGain?: number;
    blendWaveform?: Waveform;
    blendAmount?: number;
  };
  /** Offset in seconds before tone2 starts. */
  staggerSeconds: number;
}

/** Long-running ambient drone config. */
export interface AmbientConfig {
  /** Low drone frequency. */
  droneFreq: number;
  droneWaveform: Waveform;
  droneGain: number;
  /** Seconds per loop chunk. */
  chunkDuration: number;
  /** Resolution stinger notes. */
  resolveNote1: number;
  resolveNote2: number;
  resolveWaveform: Waveform;
  resolveDuration: number;
  resolveGain: number;
}

/** Complete profile definition. */
export interface Profile {
  name: string;
  description: string;
  verbs: Record<string, VerbConfig>;
  sessionStart: ChimeConfig;
  sessionEnd: ChimeConfig;
  ambient: AmbientConfig;
}

// --- Shared envelope templates ---

const ENV_INTAKE: Envelope = { attack: 0.006, decay: 0.045, sustain: 0.18, release: 0.04 };
const ENV_TRANSFORM: Envelope = { attack: 0.003, decay: 0.04, sustain: 0.12, release: 0.045 };
const ENV_COMMIT: Envelope = { attack: 0.004, decay: 0.06, sustain: 0.20, release: 0.07 };
const ENV_COMMIT_SPARKLE: Envelope = { attack: 0.003, decay: 0.04, sustain: 0.15, release: 0.06 };
const ENV_NAVIGATE: Envelope = { attack: 0.002, decay: 0.035, sustain: 0.10, release: 0.055 };
const ENV_EXECUTE: Envelope = { attack: 0.001, decay: 0.038, sustain: 0.08, release: 0.035 };

// --- Built-in profiles ---

const S = SCALE; // alias for readability

const MINIMAL_PROFILE: Profile = {
  name: "minimal",
  description: "A-major pentatonic motifs — musical, cohesive, daily-driver",
  verbs: {
    // ── intake: light, inviting, curious ───────────────────────────
    intake: {
      type: "motif",
      gain: 0.55,
      variants: [
        // Variant A: A4 → C#5
        { notes: [
          { frequency: S.A4, duration: 0.055, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
          { frequency: S.Cs5, duration: 0.075, offsetMs: 55, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
        ] },
        // Variant B: E4 → A4
        { notes: [
          { frequency: S.E4, duration: 0.055, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
          { frequency: S.A4, duration: 0.075, offsetMs: 55, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
        ] },
        // Variant C: A4 → B4
        { notes: [
          { frequency: S.A4, duration: 0.055, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
          { frequency: S.B4, duration: 0.075, offsetMs: 55, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: ENV_INTAKE, gain: 1.0 },
        ] },
      ],
    },

    // ── transform: active, clever, articulate ─────────────────────
    transform: {
      type: "motif",
      gain: 0.52,
      variants: [
        // Variant A: C#5 → B4 → E5 (3-note)
        { notes: [
          { frequency: S.Cs5, duration: 0.042, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 12 },
          { frequency: S.B4, duration: 0.036, offsetMs: 42, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 10 },
          { frequency: S.E5, duration: 0.067, offsetMs: 78, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 8 },
        ] },
        // Variant B: B4 → C#5 → E5
        { notes: [
          { frequency: S.B4, duration: 0.042, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 12 },
          { frequency: S.Cs5, duration: 0.036, offsetMs: 42, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 10 },
          { frequency: S.E5, duration: 0.067, offsetMs: 78, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 8 },
        ] },
        // Variant C: C#5 → E5 (2-note)
        { notes: [
          { frequency: S.Cs5, duration: 0.058, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 12 },
          { frequency: S.E5, duration: 0.087, offsetMs: 58, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.24, envelope: ENV_TRANSFORM, gain: 1.0, fmRatio: 2.0, fmDepth: 8 },
        ] },
      ],
    },

    // ── commit: satisfying, settled, rewarding ────────────────────
    commit: {
      type: "motif",
      gain: 0.60,
      variants: [
        // Variant A: E4+A4 dyad → C#5 sparkle
        { notes: [
          { frequency: S.E4, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.A4, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.Cs5, duration: 0.085, offsetMs: 55, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT_SPARKLE, gain: 0.7, harmonicGain: 0.10 },
        ] },
        // Variant B: A4+C#5 → E5 sparkle
        { notes: [
          { frequency: S.A4, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.Cs5, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.E5, duration: 0.085, offsetMs: 55, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT_SPARKLE, gain: 0.7, harmonicGain: 0.10 },
        ] },
        // Variant C: E4+B4 → C#5 sparkle
        { notes: [
          { frequency: S.E4, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.B4, duration: 0.110, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT, gain: 0.9, harmonicGain: 0.10 },
          { frequency: S.Cs5, duration: 0.085, offsetMs: 55, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.39, envelope: ENV_COMMIT_SPARKLE, gain: 0.7, harmonicGain: 0.10 },
        ] },
      ],
    },

    // ── navigate: precise, clean, directional ─────────────────────
    navigate: {
      type: "motif",
      gain: 0.50,
      variants: [
        // Variant A: B4 → E5
        { notes: [
          { frequency: S.B4, duration: 0.045, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
          { frequency: S.E5, duration: 0.095, offsetMs: 39, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
        ] },
        // Variant B: A4 → E5
        { notes: [
          { frequency: S.A4, duration: 0.045, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
          { frequency: S.E5, duration: 0.095, offsetMs: 39, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
        ] },
        // Variant C: B4 → C#5
        { notes: [
          { frequency: S.B4, duration: 0.045, offsetMs: 0, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
          { frequency: S.Cs5, duration: 0.095, offsetMs: 39, waveform: "triangle", blendWaveform: "sine", blendAmount: 0.33, envelope: ENV_NAVIGATE, gain: 1.0, harmonicGain: 0.10 },
        ] },
      ],
    },

    // ── execute: grounded, tactile, percussive ────────────────────
    execute: {
      type: "motif",
      gain: 0.58,
      variants: [
        // Variant A: A3 body + noise click
        {
          notes: [
            { frequency: S.A3, duration: 0.095, offsetMs: 15, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.29, envelope: ENV_EXECUTE, gain: 1.0 },
          ],
          noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.2, duration: 0.015, gain: 0.35 },
        },
        // Variant B: E4 body + noise click
        {
          notes: [
            { frequency: S.E4, duration: 0.095, offsetMs: 15, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.29, envelope: ENV_EXECUTE, gain: 1.0 },
          ],
          noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.2, duration: 0.015, gain: 0.35 },
        },
        // Variant C: A3 → E4 quick rise + noise click
        {
          notes: [
            { frequency: S.A3, duration: 0.045, offsetMs: 15, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.29, envelope: ENV_EXECUTE, gain: 1.0 },
            { frequency: S.E4, duration: 0.050, offsetMs: 60, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.29, envelope: ENV_EXECUTE, gain: 1.0 },
          ],
          noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.2, duration: 0.015, gain: 0.35 },
        },
      ],
    },

    // ── move: airy displacement ───────────────────────────────────
    move: {
      type: "whoosh",
      duration: 0.24,
      freqUp: [700, 2400],
      freqDown: [2400, 700],
      bandwidth: 0.7,
      envelope: { attack: 0.01, decay: 0.11, sustain: 0.10, release: 0.06 },
      gain: 0.52,
      anchorVariants: [
        // Variant A: E4 → A4
        { notes: [
          { frequency: S.E4, duration: 0.18, offsetMs: 20, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.015, decay: 0.08, sustain: 0.12, release: 0.05 }, gain: 0.45 },
          { frequency: S.A4, duration: 0.14, offsetMs: 100, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.06, sustain: 0.10, release: 0.04 }, gain: 0.40 },
        ] },
        // Variant B: A4 → C#5
        { notes: [
          { frequency: S.A4, duration: 0.18, offsetMs: 20, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.015, decay: 0.08, sustain: 0.12, release: 0.05 }, gain: 0.45 },
          { frequency: S.Cs5, duration: 0.14, offsetMs: 100, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.06, sustain: 0.10, release: 0.04 }, gain: 0.40 },
        ] },
        // Variant C: E4 sustained
        { notes: [
          { frequency: S.E4, duration: 0.22, offsetMs: 20, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.015, decay: 0.10, sustain: 0.12, release: 0.06 }, gain: 0.45 },
        ] },
      ],
    },

    // ── sync: broader system motion ───────────────────────────────
    sync: {
      type: "whoosh",
      duration: 0.30,
      freqUp: [500, 2600],
      freqDown: [2600, 500],
      bandwidth: 0.65,
      envelope: { attack: 0.008, decay: 0.12, sustain: 0.16, release: 0.09 },
      gain: 0.58,
      anchorVariants: [
        // Variant A: A3+E4 anchor → C#5 confirmation
        { notes: [
          { frequency: S.A3, duration: 0.16, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.08, sustain: 0.14, release: 0.06 }, gain: 0.50 },
          { frequency: S.E4, duration: 0.16, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.08, sustain: 0.14, release: 0.06 }, gain: 0.45 },
          { frequency: S.Cs5, duration: 0.09, offsetMs: 160, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: { attack: 0.003, decay: 0.04, sustain: 0.10, release: 0.04 }, gain: 0.35 },
        ] },
        // Variant B: E4+A4 anchor → C#5 confirmation
        { notes: [
          { frequency: S.E4, duration: 0.16, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.08, sustain: 0.14, release: 0.06 }, gain: 0.50 },
          { frequency: S.A4, duration: 0.16, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.08, sustain: 0.14, release: 0.06 }, gain: 0.45 },
          { frequency: S.Cs5, duration: 0.09, offsetMs: 160, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.25, envelope: { attack: 0.003, decay: 0.04, sustain: 0.10, release: 0.04 }, gain: 0.35 },
        ] },
        // Variant C: A3+E4 sustained (no confirmation)
        { notes: [
          { frequency: S.A3, duration: 0.20, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.10, sustain: 0.14, release: 0.07 }, gain: 0.50 },
          { frequency: S.E4, duration: 0.20, offsetMs: 0, waveform: "sine", blendWaveform: "triangle", blendAmount: 0.30, envelope: { attack: 0.01, decay: 0.10, sustain: 0.14, release: 0.07 }, gain: 0.45 },
        ] },
      ],
    },
  },

  // ── Session sounds (A major pentatonic grammar) ─────────────────

  sessionStart: {
    tone1: {
      waveform: "sine",
      blendWaveform: "triangle",
      blendAmount: 0.25,
      frequency: S.A4,
      duration: 0.18,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.25, release: 0.06 },
      gain: 0.60,
      harmonicGain: 0.08,
    },
    tone2: {
      waveform: "sine",
      blendWaveform: "triangle",
      blendAmount: 0.25,
      frequency: S.Cs5,
      duration: 0.22,
      envelope: { attack: 0.01, decay: 0.10, sustain: 0.25, release: 0.08 },
      gain: 0.55,
      harmonicGain: 0.08,
    },
    staggerSeconds: 0.065,
  },

  sessionEnd: {
    tone1: {
      waveform: "sine",
      blendWaveform: "triangle",
      blendAmount: 0.25,
      frequency: S.Cs5,
      duration: 0.15,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.18, release: 0.04 },
      gain: 0.55,
    },
    tone2: {
      waveform: "sine",
      blendWaveform: "triangle",
      blendAmount: 0.25,
      frequency: S.A4,
      duration: 0.25,
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.18, release: 0.10 },
      gain: 0.50,
    },
    staggerSeconds: 0.075,
  },

  ambient: {
    droneFreq: S.A3,
    droneWaveform: "sine",
    droneGain: 0.25,
    chunkDuration: 2.0,
    resolveNote1: S.A4,
    resolveNote2: S.E5,
    resolveWaveform: "sine",
    resolveDuration: 0.16,
    resolveGain: 0.55,
  },
};

// --- Retro profile: same motifs, square waveform, snappier envelopes ---

const ENV_RETRO_SHORT: Envelope = { attack: 0.002, decay: 0.03, sustain: 0.15, release: 0.02 };
const ENV_RETRO_MED: Envelope = { attack: 0.003, decay: 0.035, sustain: 0.12, release: 0.025 };
const ENV_RETRO_LONG: Envelope = { attack: 0.004, decay: 0.04, sustain: 0.18, release: 0.04 };

function sqNote(freq: number, duration: number, offsetMs: number, env: Envelope, gain: number = 1.0, opts: Partial<MotifNote> = {}): MotifNote {
  return { frequency: freq, duration, offsetMs, waveform: "square", envelope: env, gain, ...opts };
}

const RETRO_PROFILE: Profile = {
  name: "retro",
  description: "8-bit pentatonic chirps — fun, crisp, controlled",
  verbs: {
    intake: {
      type: "motif",
      gain: 0.14,
      variants: [
        { notes: [sqNote(S.A4, 0.045, 0, ENV_RETRO_SHORT), sqNote(S.Cs5, 0.060, 45, ENV_RETRO_SHORT)] },
        { notes: [sqNote(S.E4, 0.045, 0, ENV_RETRO_SHORT), sqNote(S.A4, 0.060, 45, ENV_RETRO_SHORT)] },
        { notes: [sqNote(S.A4, 0.045, 0, ENV_RETRO_SHORT), sqNote(S.B4, 0.060, 45, ENV_RETRO_SHORT)] },
      ],
    },
    transform: {
      type: "motif",
      gain: 0.13,
      variants: [
        { notes: [
          sqNote(S.Cs5, 0.035, 0, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 18 }),
          sqNote(S.B4, 0.030, 35, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 15 }),
          sqNote(S.E5, 0.055, 65, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 12 }),
        ] },
        { notes: [
          sqNote(S.B4, 0.035, 0, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 18 }),
          sqNote(S.Cs5, 0.030, 35, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 15 }),
          sqNote(S.E5, 0.055, 65, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 12 }),
        ] },
        { notes: [
          sqNote(S.Cs5, 0.048, 0, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 18 }),
          sqNote(S.E5, 0.072, 48, ENV_RETRO_SHORT, 1.0, { fmRatio: 2.0, fmDepth: 12 }),
        ] },
      ],
    },
    commit: {
      type: "motif",
      gain: 0.16,
      variants: [
        { notes: [
          sqNote(S.E4, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.A4, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.Cs5, 0.070, 45, ENV_RETRO_MED, 0.65, { harmonicGain: 0.08 }),
        ] },
        { notes: [
          sqNote(S.A4, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.Cs5, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.E5, 0.070, 45, ENV_RETRO_MED, 0.65, { harmonicGain: 0.08 }),
        ] },
        { notes: [
          sqNote(S.E4, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.B4, 0.090, 0, ENV_RETRO_LONG, 0.85, { harmonicGain: 0.08 }),
          sqNote(S.Cs5, 0.070, 45, ENV_RETRO_MED, 0.65, { harmonicGain: 0.08 }),
        ] },
      ],
    },
    navigate: {
      type: "motif",
      gain: 0.12,
      variants: [
        { notes: [sqNote(S.B4, 0.038, 0, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 }), sqNote(S.E5, 0.078, 32, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 })] },
        { notes: [sqNote(S.A4, 0.038, 0, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 }), sqNote(S.E5, 0.078, 32, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 })] },
        { notes: [sqNote(S.B4, 0.038, 0, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 }), sqNote(S.Cs5, 0.078, 32, ENV_RETRO_SHORT, 1.0, { harmonicGain: 0.08 })] },
      ],
    },
    execute: {
      type: "motif",
      gain: 0.15,
      variants: [
        { notes: [sqNote(S.A3, 0.078, 12, ENV_RETRO_SHORT)], noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.0, duration: 0.012, gain: 0.40 } },
        { notes: [sqNote(S.E4, 0.078, 12, ENV_RETRO_SHORT)], noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.0, duration: 0.012, gain: 0.40 } },
        { notes: [sqNote(S.A3, 0.038, 12, ENV_RETRO_SHORT), sqNote(S.E4, 0.042, 50, ENV_RETRO_SHORT)], noiseTransient: { freqStart: 1200, freqEnd: 1800, bandwidth: 1.0, duration: 0.012, gain: 0.40 } },
      ],
    },
    move: {
      type: "whoosh",
      duration: 0.19,
      freqUp: [800, 2800],
      freqDown: [2800, 800],
      bandwidth: 0.9,
      envelope: { attack: 0.008, decay: 0.08, sustain: 0.08, release: 0.04 },
      gain: 0.14,
      anchorVariants: [
        { notes: [sqNote(S.E4, 0.15, 16, { attack: 0.01, decay: 0.06, sustain: 0.10, release: 0.04 }, 0.40), sqNote(S.A4, 0.11, 80, { attack: 0.008, decay: 0.05, sustain: 0.08, release: 0.03 }, 0.35)] },
        { notes: [sqNote(S.A4, 0.15, 16, { attack: 0.01, decay: 0.06, sustain: 0.10, release: 0.04 }, 0.40), sqNote(S.Cs5, 0.11, 80, { attack: 0.008, decay: 0.05, sustain: 0.08, release: 0.03 }, 0.35)] },
        { notes: [sqNote(S.E4, 0.18, 16, { attack: 0.01, decay: 0.08, sustain: 0.10, release: 0.04 }, 0.40)] },
      ],
    },
    sync: {
      type: "whoosh",
      duration: 0.24,
      freqUp: [600, 3000],
      freqDown: [3000, 600],
      bandwidth: 0.75,
      envelope: { attack: 0.006, decay: 0.09, sustain: 0.12, release: 0.06 },
      gain: 0.15,
      anchorVariants: [
        { notes: [
          sqNote(S.A3, 0.13, 0, { attack: 0.008, decay: 0.06, sustain: 0.12, release: 0.04 }, 0.45),
          sqNote(S.E4, 0.13, 0, { attack: 0.008, decay: 0.06, sustain: 0.12, release: 0.04 }, 0.40),
          sqNote(S.Cs5, 0.07, 130, { attack: 0.002, decay: 0.03, sustain: 0.08, release: 0.03 }, 0.30),
        ] },
        { notes: [
          sqNote(S.E4, 0.13, 0, { attack: 0.008, decay: 0.06, sustain: 0.12, release: 0.04 }, 0.45),
          sqNote(S.A4, 0.13, 0, { attack: 0.008, decay: 0.06, sustain: 0.12, release: 0.04 }, 0.40),
          sqNote(S.Cs5, 0.07, 130, { attack: 0.002, decay: 0.03, sustain: 0.08, release: 0.03 }, 0.30),
        ] },
        { notes: [
          sqNote(S.A3, 0.16, 0, { attack: 0.008, decay: 0.08, sustain: 0.12, release: 0.05 }, 0.45),
          sqNote(S.E4, 0.16, 0, { attack: 0.008, decay: 0.08, sustain: 0.12, release: 0.05 }, 0.40),
        ] },
      ],
    },
  },

  sessionStart: {
    tone1: { waveform: "square", frequency: S.A4, duration: 0.10, envelope: { attack: 0.003, decay: 0.04, sustain: 0.18, release: 0.02 }, gain: 0.15 },
    tone2: { waveform: "square", frequency: S.Cs5, duration: 0.12, envelope: { attack: 0.003, decay: 0.05, sustain: 0.18, release: 0.03 }, gain: 0.14 },
    staggerSeconds: 0.055,
  },
  sessionEnd: {
    tone1: { waveform: "square", frequency: S.Cs5, duration: 0.08, envelope: { attack: 0.003, decay: 0.04, sustain: 0.12, release: 0.02 }, gain: 0.14 },
    tone2: { waveform: "square", frequency: S.A4, duration: 0.14, envelope: { attack: 0.003, decay: 0.06, sustain: 0.12, release: 0.04 }, gain: 0.12 },
    staggerSeconds: 0.055,
  },
  ambient: {
    droneFreq: S.A3,
    droneWaveform: "square",
    droneGain: 0.06,
    chunkDuration: 2.0,
    resolveNote1: S.A4,
    resolveNote2: S.E5,
    resolveWaveform: "square",
    resolveDuration: 0.10,
    resolveGain: 0.14,
  },
};

// --- Profile registry ---

const BUILTIN_PROFILES: Record<string, Profile> = {
  minimal: MINIMAL_PROFILE,
  retro: RETRO_PROFILE,
};

// --- Profile loading ---

/** Get a built-in profile by name. */
export function getBuiltinProfile(name: string): Profile | undefined {
  return BUILTIN_PROFILES[name];
}

/** List all built-in profile names. */
export function listBuiltinProfiles(): string[] {
  return Object.keys(BUILTIN_PROFILES);
}

/** Load a profile from a JSON file path. */
export function loadProfileFromFile(filePath: string): Profile {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Profile;
  if (!parsed.name || !parsed.verbs || !parsed.sessionStart || !parsed.sessionEnd) {
    throw new Error(`Invalid profile: missing required fields in ${filePath}`);
  }
  return parsed;
}

/**
 * Resolve a profile by name.
 * 1. Check built-in profiles
 * 2. Check profiles/ directory next to the package
 * 3. Treat as absolute/relative file path
 */
export function resolveProfile(nameOrPath: string): Profile {
  const builtin = getBuiltinProfile(nameOrPath);
  if (builtin) return builtin;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const profilesDir = join(__dirname, "..", "profiles");
  const inProfilesDir = join(profilesDir, `${nameOrPath}.json`);
  if (existsSync(inProfilesDir)) {
    return loadProfileFromFile(inProfilesDir);
  }

  if (existsSync(nameOrPath)) {
    return loadProfileFromFile(nameOrPath);
  }

  throw new Error(
    `Unknown profile "${nameOrPath}". Built-in: ${listBuiltinProfiles().join(", ")}`
  );
}

export const DEFAULT_PROFILE_NAME = "minimal";
