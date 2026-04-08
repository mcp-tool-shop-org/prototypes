/**
 * Verb generation engine — profile-driven.
 * Reads synthesis parameters from a Profile, applies modifiers, generates audio.
 *
 * Architecture: multi-note motifs in A major pentatonic with constrained variation.
 * Each verb has 3 variants. Micro-jitter keeps sounds alive without breaking identity.
 */

import {
  type ToneParams,
  type WhooshParams,
  SAMPLE_RATE,
  generateTone,
  generateWhoosh,
  mixBuffers,
  limitLoudness,
  applyLowPass,
  applyVolume,
} from "./synth.js";
import type {
  Profile,
  MotifVerbConfig,
  WhooshVerbConfig,
  MotifVariant,
  MotifNote,
  WhooshAnchorVariant,
  ChimeConfig,
} from "./profiles.js";
import { SCALE, scaleStepDown } from "./profiles.js";

// --- Types ---

export type Status = "ok" | "err" | "warn";
export type Scope = "local" | "remote";
export type Direction = "up" | "down";

export interface PlayOptions {
  status?: Status;
  scope?: Scope;
  direction?: Direction;
  /** Streak intensity level (1–5). Higher = richer harmonics, momentum feel. */
  intensity?: number;
  /** Error escalation level (1–5). Higher = more urgent, darker tone. */
  escalation?: number;
  /** Override variant selection (0-indexed). For testing determinism. */
  variantIndex?: number;
  /** Mix-layer gain multiplier from density/repetition analysis (0.4–1.0). */
  mixGain?: number;
  /** Mix-layer release multiplier from density/repetition analysis. */
  mixRelease?: number;
}

// --- Verb metadata ---

export type Verb = "intake" | "transform" | "commit" | "navigate" | "execute" | "move" | "sync";

export const VERB_LABELS: Record<Verb, string> = {
  intake: "Intake",
  transform: "Transform",
  commit: "Commit",
  navigate: "Navigate",
  execute: "Execute",
  move: "Move",
  sync: "Sync",
};

export const VERB_DESCRIPTIONS: Record<Verb, string> = {
  intake: "read / open / fetch",
  transform: "edit / format / refactor",
  commit: "write / save / apply",
  navigate: "search / jump / list",
  execute: "run / test / build",
  move: "move / rename / relocate",
  sync: "git push / pull / deploy",
};

export const ALL_VERBS: Verb[] = [
  "intake", "transform", "commit", "navigate", "execute", "move", "sync",
];

// --- Variant selection ---

function pickVariant<T>(variants: T[], override?: number): T {
  if (override !== undefined && override >= 0 && override < variants.length) {
    return variants[override];
  }
  return variants[Math.floor(Math.random() * variants.length)];
}

// --- Micro-jitter (constrained variation) ---

/**
 * Apply micro-jitter to a note to reduce listener fatigue.
 * Constraints: ±5 cents pitch, ±6% duration, ±4ms onset, ±0.8 dB gain.
 * Identity (register, contour, timbre) is preserved.
 */
function jitterNote(note: MotifNote): MotifNote {
  const n = { ...note, envelope: { ...note.envelope } };
  // Pitch drift: ±5 cents (1 cent ≈ 0.058% frequency change)
  const centsDrift = (Math.random() - 0.5) * 10;
  n.frequency *= Math.pow(2, centsDrift / 1200);
  // Duration jitter: ±6%
  n.duration *= 1 + (Math.random() - 0.5) * 0.12;
  // Onset jitter: ±4ms
  n.offsetMs = Math.max(0, n.offsetMs + (Math.random() - 0.5) * 8);
  // Gain drift: ±0.8 dB (≈ ±9.6%)
  n.gain *= 1 + (Math.random() - 0.5) * 0.19;
  return n;
}

// --- Note rendering ---

/** Render a single MotifNote into a PCM buffer with optional waveform blending. */
function renderNote(note: MotifNote, masterGain: number): { buffer: Float64Array; offsetSamples: number } {
  const gain = note.gain * masterGain;
  const offsetSamples = Math.max(0, Math.floor((note.offsetMs / 1000) * SAMPLE_RATE));

  const baseParams: ToneParams = {
    waveform: note.waveform,
    frequency: note.frequency,
    duration: note.duration,
    envelope: { ...note.envelope },
    gain,
    fmRatio: note.fmRatio,
    fmDepth: note.fmDepth,
    harmonicGain: note.harmonicGain,
    tremoloRate: note.tremoloRate,
    tremoloDepth: note.tremoloDepth,
    detune: note.detune,
  };

  let buffer: Float64Array;
  if (note.blendWaveform && note.blendAmount && note.blendAmount > 0) {
    const primary = generateTone({ ...baseParams, gain: gain * (1 - note.blendAmount) });
    const blend = generateTone({ ...baseParams, waveform: note.blendWaveform, gain: gain * note.blendAmount });
    buffer = mixBuffers([primary, blend]);
  } else {
    buffer = generateTone(baseParams);
  }

  return { buffer, offsetSamples };
}

/** Render a complete motif variant into a single buffer. */
function renderMotif(variant: MotifVariant, masterGain: number, applyJitter: boolean = true): Float64Array {
  const notes = applyJitter ? variant.notes.map(jitterNote) : variant.notes;
  const rendered = notes.map(n => renderNote(n, masterGain));

  // Calculate total buffer length
  let maxLen = 0;
  for (const { buffer, offsetSamples } of rendered) {
    maxLen = Math.max(maxLen, offsetSamples + buffer.length);
  }

  const output = new Float64Array(maxLen);

  // Mix all notes at their offsets
  for (const { buffer, offsetSamples } of rendered) {
    for (let i = 0; i < buffer.length; i++) {
      if (offsetSamples + i < output.length) {
        output[offsetSamples + i] += buffer[i];
      }
    }
  }

  // Add noise transient if present (e.g., execute verb percussive onset)
  if (variant.noiseTransient) {
    const nt = variant.noiseTransient;
    const noiseBuffer = generateWhoosh({
      duration: nt.duration,
      freqStart: nt.freqStart,
      freqEnd: nt.freqEnd,
      bandwidth: nt.bandwidth,
      envelope: { attack: 0.001, decay: nt.duration * 0.4, sustain: 0.0, release: nt.duration * 0.3 },
      gain: nt.gain * masterGain,
    });
    // Noise at the very start of the buffer
    for (let i = 0; i < noiseBuffer.length && i < output.length; i++) {
      output[i] += noiseBuffer[i];
    }
  }

  return output;
}

/** Render a whoosh anchor variant into a buffer. */
function renderAnchor(anchor: WhooshAnchorVariant, masterGain: number, applyJitter: boolean = true): Float64Array {
  // Reuse motif rendering for the tonal anchor notes
  return renderMotif({ notes: anchor.notes }, masterGain, applyJitter);
}

// --- Musical modifiers (motif-based) ---

/**
 * Apply status modifier to a motif variant.
 * ok: add quiet fifth above strongest tone.
 * warn: gentle tremolo (5.5 Hz / 0.22 depth).
 * err: final note drops one scale degree, detune ±2 Hz, longer release.
 */
function applyMotifStatus(variant: MotifVariant, status: Status): MotifVariant {
  if (status === "ok") {
    const notes = [...variant.notes];
    const lastNote = notes[notes.length - 1];
    // Add a quiet perfect fifth above the last note
    notes.push({
      ...lastNote,
      frequency: lastNote.frequency * 1.5,
      gain: lastNote.gain * 0.35,
      harmonicGain: undefined,
      fmRatio: undefined,
      fmDepth: undefined,
    });
    return { ...variant, notes };
  }

  if (status === "warn") {
    return {
      ...variant,
      notes: variant.notes.map(n => ({
        ...n,
        tremoloRate: 5.5,
        tremoloDepth: 0.22,
      })),
    };
  }

  if (status === "err") {
    const notes = variant.notes.map((n, i) => {
      const isLast = i === variant.notes.length - 1;
      return {
        ...n,
        // Final note drops one scale degree
        frequency: isLast ? scaleStepDown(n.frequency) : n.frequency,
        detune: 2,
        duration: n.duration * 1.15,
        envelope: { ...n.envelope, release: n.envelope.release * 1.25 },
        // Reduce top harmonic by 20%
        harmonicGain: n.harmonicGain ? n.harmonicGain * 0.8 : undefined,
      };
    });
    return { ...variant, notes };
  }

  return variant;
}

/**
 * Apply scope modifier to a motif variant.
 * remote: slightly farther away — longer attack/release, quieter.
 */
function applyMotifScope(variant: MotifVariant, scope: Scope): MotifVariant {
  if (scope === "remote") {
    return {
      ...variant,
      notes: variant.notes.map(n => ({
        ...n,
        envelope: {
          ...n.envelope,
          attack: n.envelope.attack * 1.25,
          release: n.envelope.release * 1.5,
        },
        gain: n.gain * 0.92,
      })),
    };
  }
  return variant;
}

/**
 * Apply streak intensity (1–5) to a motif variant.
 * Progression: base → harmonic → brighter interval → FM shimmer → richer tail.
 * Gain change kept within ~+2.5 dB total.
 */
function applyMotifIntensity(variant: MotifVariant, intensity: number): MotifVariant {
  if (intensity <= 1) return variant;

  return {
    ...variant,
    notes: variant.notes.map(n => {
      const note = { ...n, envelope: { ...n.envelope } };

      if (intensity >= 2) {
        // Add quiet harmonic
        note.harmonicGain = Math.max(note.harmonicGain ?? 0, 0.06 + (intensity - 2) * 0.03);
      }
      if (intensity >= 3) {
        // Slightly brighter (lift pitch within scale tolerance)
        note.frequency *= 1 + (intensity - 2) * 0.015;
      }
      if (intensity >= 4) {
        // Add subtle FM shimmer
        note.fmRatio = note.fmRatio ?? 2;
        note.fmDepth = Math.max(note.fmDepth ?? 0, 6 + (intensity - 4) * 5);
      }
      if (intensity >= 5) {
        // Slightly longer tail + tiny gain lift
        note.envelope.release *= 1.2;
        note.gain = Math.min(note.gain * 1.06, 1.0);
      }

      return note;
    }),
  };
}

/**
 * Apply error escalation (1–5) to a motif variant.
 * Progression: base → lower register → detune → tremolo → heavy weight.
 */
function applyMotifEscalation(variant: MotifVariant, escalation: number): MotifVariant {
  if (escalation <= 1) return variant;

  return {
    ...variant,
    notes: variant.notes.map(n => {
      const note = { ...n, envelope: { ...n.envelope } };

      if (escalation >= 2) {
        // Lower register
        note.frequency = scaleStepDown(note.frequency);
      }
      if (escalation >= 3) {
        // Slight detune
        note.detune = (note.detune ?? 0) + 1.5;
      }
      if (escalation >= 4) {
        // Soft tremolo/pulse
        note.tremoloRate = 4.5;
        note.tremoloDepth = 0.30;
        note.envelope.decay *= 1.15;
      }
      if (escalation >= 5) {
        // Longer decay, heavier instability
        note.detune = (note.detune ?? 0) + 1.5;
        note.tremoloDepth = 0.45;
        note.envelope.release *= 1.5;
        note.gain *= 0.95;
      }

      return note;
    }),
  };
}

// --- Musical modifiers (whoosh-based) ---

function applyWhooshStatus(params: WhooshParams, status: Status): WhooshParams {
  const p = { ...params, envelope: { ...params.envelope } };
  switch (status) {
    case "ok":
      p.freqEnd = Math.min(p.freqEnd * 1.15, 5000);
      break;
    case "err":
      p.freqStart = scaleStepDown(p.freqStart);
      p.freqEnd *= 0.7;
      p.duration *= 1.15;
      p.bandwidth = Math.min(p.bandwidth * 1.3, 1.5);
      break;
    case "warn":
      p.duration *= 0.85;
      p.envelope.attack *= 0.5;
      p.envelope.release *= 0.7;
      break;
  }
  return p;
}

function applyWhooshScope(params: WhooshParams, scope: Scope): WhooshParams {
  if (scope === "remote") {
    const p = { ...params, envelope: { ...params.envelope } };
    p.envelope.attack *= 1.25;
    p.envelope.release *= 1.5;
    p.duration *= 1.15;
    p.gain *= 0.92;
    return p;
  }
  return params;
}

function applyWhooshIntensity(params: WhooshParams, intensity: number): WhooshParams {
  if (intensity <= 1) return params;
  const p = { ...params, envelope: { ...params.envelope } };

  if (intensity >= 2) {
    p.freqEnd = Math.min(p.freqEnd * (1 + (intensity - 1) * 0.06), 6000);
  }
  if (intensity >= 3) {
    p.bandwidth = Math.max(p.bandwidth * 0.88, 0.3);
  }
  if (intensity >= 4) {
    p.duration *= 1.04;
  }

  return p;
}

function applyWhooshEscalation(params: WhooshParams, escalation: number): WhooshParams {
  if (escalation <= 1) return params;
  const p = { ...params, envelope: { ...params.envelope } };

  if (escalation >= 2) {
    p.freqStart *= 0.75;
    p.freqEnd *= 0.75;
  }
  if (escalation >= 3) {
    p.bandwidth = Math.min(p.bandwidth * 1.4, 2);
    p.duration *= 1.15;
  }
  if (escalation >= 4) {
    p.envelope.release *= 1.4;
    p.duration *= 1.1;
  }
  if (escalation >= 5) {
    p.freqStart *= 0.85;
    p.freqEnd *= 0.85;
    p.duration *= 1.08;
  }

  return p;
}

// --- Mix modifiers (density/repetition from Pass B) ---

/** Scale all note release times in a motif (density/repetition ducking). */
function applyMotifMixRelease(variant: MotifVariant, multiplier: number): MotifVariant {
  if (multiplier >= 1) return variant;
  return {
    ...variant,
    notes: variant.notes.map(n => ({
      ...n,
      envelope: { ...n.envelope, release: n.envelope.release * multiplier },
    })),
  };
}

/** Scale whoosh envelope release (density/repetition ducking). */
function applyWhooshMixRelease(params: WhooshParams, multiplier: number): WhooshParams {
  if (multiplier >= 1) return params;
  return {
    ...params,
    envelope: { ...params.envelope, release: params.envelope.release * multiplier },
  };
}

/** Low-pass cutoff for remote scope (Hz). Gentle rolloff mimicking distance. */
const REMOTE_LP_CUTOFF = 2500;

// --- Main generation ---

/** Generate a verb sound using the given profile. */
export function generateVerb(
  profile: Profile,
  verb: Verb,
  options: PlayOptions = {}
): Float64Array {
  const cfg = profile.verbs[verb];
  if (!cfg) {
    throw new Error(`Profile "${profile.name}" has no config for verb "${verb}"`);
  }

  const isRemote = options.scope === "remote";

  // ── Whoosh-based verbs (move, sync) ─────────────────────────
  if (cfg.type === "whoosh") {
    const dir = options.direction ?? "up";
    const freqPair = dir === "down" ? cfg.freqDown : cfg.freqUp;

    let wp: WhooshParams = {
      duration: cfg.duration,
      freqStart: freqPair[0],
      freqEnd: freqPair[1],
      bandwidth: cfg.bandwidth,
      envelope: { ...cfg.envelope },
      gain: cfg.gain,
    };

    if (options.status) wp = applyWhooshStatus(wp, options.status);
    if (options.scope) wp = applyWhooshScope(wp, options.scope);
    if (options.intensity) wp = applyWhooshIntensity(wp, options.intensity);
    if (options.escalation) wp = applyWhooshEscalation(wp, options.escalation);
    if (options.mixRelease && options.mixRelease < 1) wp = applyWhooshMixRelease(wp, options.mixRelease);

    const whooshBuf = generateWhoosh(wp);

    // Tonal anchor variant
    let result: Float64Array;
    if (cfg.anchorVariants && cfg.anchorVariants.length > 0) {
      let anchor = pickVariant(cfg.anchorVariants, options.variantIndex);
      let anchorMotif: MotifVariant = { notes: anchor.notes };
      if (options.status) anchorMotif = applyMotifStatus(anchorMotif, options.status);
      if (options.scope) anchorMotif = applyMotifScope(anchorMotif, options.scope);
      if (options.intensity) anchorMotif = applyMotifIntensity(anchorMotif, options.intensity);
      if (options.escalation) anchorMotif = applyMotifEscalation(anchorMotif, options.escalation);
      if (options.mixRelease && options.mixRelease < 1) anchorMotif = applyMotifMixRelease(anchorMotif, options.mixRelease);

      const anchorBuf = renderMotif(anchorMotif, cfg.gain);

      const maxLen = Math.max(whooshBuf.length, anchorBuf.length);
      const whooshPadded = new Float64Array(maxLen);
      whooshPadded.set(whooshBuf, 0);
      const anchorPadded = new Float64Array(maxLen);
      anchorPadded.set(anchorBuf, 0);

      result = mixBuffers([whooshPadded, anchorPadded]);
    } else {
      result = whooshBuf;
    }

    // Remote low-pass softening
    if (isRemote) result = applyLowPass(result, REMOTE_LP_CUTOFF);
    // Mix gain ducking
    if (options.mixGain && options.mixGain < 1) result = applyVolume(result, options.mixGain);

    return limitLoudness(result);
  }

  // ── Motif-based verbs (intake, transform, commit, navigate, execute) ──
  let variant = pickVariant(cfg.variants, options.variantIndex);

  if (options.status) variant = applyMotifStatus(variant, options.status);
  if (options.scope) variant = applyMotifScope(variant, options.scope);
  if (options.intensity) variant = applyMotifIntensity(variant, options.intensity);
  if (options.escalation) variant = applyMotifEscalation(variant, options.escalation);
  if (options.mixRelease && options.mixRelease < 1) variant = applyMotifMixRelease(variant, options.mixRelease);

  let buffer = renderMotif(variant, cfg.gain);

  // Remote low-pass softening
  if (isRemote) buffer = applyLowPass(buffer, REMOTE_LP_CUTOFF);
  // Mix gain ducking
  if (options.mixGain && options.mixGain < 1) buffer = applyVolume(buffer, options.mixGain);

  return limitLoudness(buffer);
}

// --- Session sounds ---

/** Render a chime tone with optional waveform blending. */
function renderChimeTone(tone: ChimeConfig["tone1"], extraGain: number = 1.0): Float64Array {
  const gain = tone.gain * extraGain;

  const params: ToneParams = {
    waveform: tone.waveform,
    frequency: tone.frequency,
    duration: tone.duration,
    envelope: { ...tone.envelope },
    gain,
    harmonicGain: tone.harmonicGain,
  };

  if (tone.blendWaveform && tone.blendAmount && tone.blendAmount > 0) {
    const primary = generateTone({ ...params, gain: gain * (1 - tone.blendAmount) });
    const blend = generateTone({ ...params, waveform: tone.blendWaveform, gain: gain * tone.blendAmount });
    return mixBuffers([primary, blend]);
  }

  return generateTone(params);
}

function generateChime(chime: ChimeConfig, gainMul: number = 1.0): Float64Array {
  const tone1 = renderChimeTone(chime.tone1, gainMul);
  const tone2 = renderChimeTone(chime.tone2, gainMul);
  const offset = Math.floor(chime.staggerSeconds * SAMPLE_RATE);
  const total = new Float64Array(Math.max(tone1.length, offset + tone2.length));
  total.set(tone1, 0);
  for (let i = 0; i < tone2.length; i++) {
    if (offset + i < total.length) {
      total[offset + i] += tone2[i];
    }
  }
  return limitLoudness(total);
}

export function generateSessionStart(profile: Profile): Float64Array {
  return generateChime(profile.sessionStart);
}

export function generateSessionEnd(profile: Profile): Float64Array {
  return generateChime(profile.sessionEnd);
}

// --- Outcome-aware session end ---

export interface SessionOutcome {
  /** 0.0 = all errors, 1.0 = all successes. */
  successRatio: number;
  /** Total plays in the session. */
  totalPlays: number;
}

/**
 * Generate an outcome-aware session end sound.
 * Great (ratio >= 0.8, 5+ plays): A4 → C#5 → E5 ascending fanfare.
 * Normal: standard descending chime.
 * Rough (ratio < 0.6): muted, lower, shorter resolution.
 * Empty (< 5 plays): standard chime.
 */
export function generateSessionEndWithOutcome(
  profile: Profile,
  outcome: SessionOutcome
): Float64Array {
  if (outcome.totalPlays < 5) {
    return generateChime(profile.sessionEnd);
  }

  if (outcome.successRatio >= 0.8) {
    return generateFanfare(profile);
  }

  if (outcome.successRatio < 0.6) {
    return generateMutedEnd(profile);
  }

  return generateChime(profile.sessionEnd);
}

/** A4 → C#5 → E5 ascending fanfare — the big win. */
function generateFanfare(profile: Profile): Float64Array {
  const waveform = profile.sessionEnd.tone1.waveform;
  const blendWave = profile.sessionEnd.tone1.blendWaveform;
  const blendAmt = profile.sessionEnd.tone1.blendAmount ?? 0;

  // A major triad ascending: A4 → C#5 → E5
  const notes = [SCALE.A4, SCALE.Cs5, SCALE.E5];
  const buffers: Float64Array[] = [];

  for (let i = 0; i < notes.length; i++) {
    const isLast = i === notes.length - 1;
    const params: ToneParams = {
      waveform,
      frequency: notes[i],
      duration: isLast ? 0.30 : 0.15,
      envelope: {
        attack: 0.008,
        decay: isLast ? 0.10 : 0.05,
        sustain: isLast ? 0.30 : 0.20,
        release: isLast ? 0.10 : 0.04,
      },
      gain: isLast ? 0.22 : 0.18,
      harmonicGain: isLast ? 0.12 : 0.06,
    };

    if (blendWave && blendAmt > 0) {
      const primary = generateTone({ ...params, gain: params.gain * (1 - blendAmt) });
      const blend = generateTone({ ...params, waveform: blendWave, gain: params.gain * blendAmt });
      buffers.push(mixBuffers([primary, blend]));
    } else {
      buffers.push(generateTone(params));
    }
  }

  // Stagger: each note starts 70ms after the previous
  const stagger = Math.floor(0.07 * SAMPLE_RATE);
  const totalLen = stagger * (buffers.length - 1) + buffers[buffers.length - 1].length;
  const total = new Float64Array(totalLen);

  for (let ni = 0; ni < buffers.length; ni++) {
    const buf = buffers[ni];
    const offset = ni * stagger;
    for (let i = 0; i < buf.length; i++) {
      if (offset + i < total.length) {
        total[offset + i] += buf[i];
      }
    }
  }

  return limitLoudness(total);
}

/** Muted session end — same contour, octave lower, quieter. */
function generateMutedEnd(profile: Profile): Float64Array {
  const cfg = profile.sessionEnd;
  // One octave lower, 60% gain
  const mutedChime: ChimeConfig = {
    tone1: { ...cfg.tone1, frequency: cfg.tone1.frequency * 0.5, gain: cfg.tone1.gain * 0.6 },
    tone2: { ...cfg.tone2, frequency: cfg.tone2.frequency * 0.5, gain: cfg.tone2.gain * 0.6 },
    staggerSeconds: cfg.staggerSeconds,
  };
  return generateChime(mutedChime);
}

// --- Ambient (long-running thinking) ---

/** Generate a single chunk of the ambient thinking drone. */
export function generateAmbientChunk(profile: Profile): Float64Array {
  const cfg = profile.ambient;
  return generateTone({
    waveform: cfg.droneWaveform,
    frequency: cfg.droneFreq,
    duration: cfg.chunkDuration,
    envelope: {
      attack: 0.3,
      decay: 0.2,
      sustain: 1.0,
      release: 0.3,
    },
    gain: cfg.droneGain,
    tremoloRate: 0.5,
    tremoloDepth: 0.15,
  });
}

/** Generate the resolution stinger (two ascending notes, A major). */
export function generateAmbientResolve(profile: Profile): Float64Array {
  const cfg = profile.ambient;
  const note1 = generateTone({
    waveform: cfg.resolveWaveform,
    frequency: cfg.resolveNote1,
    duration: cfg.resolveDuration,
    envelope: { attack: 0.006, decay: 0.05, sustain: 0.20, release: 0.04 },
    gain: cfg.resolveGain,
    harmonicGain: 0.08,
  });
  const note2 = generateTone({
    waveform: cfg.resolveWaveform,
    frequency: cfg.resolveNote2,
    duration: cfg.resolveDuration * 1.3,
    envelope: { attack: 0.006, decay: 0.07, sustain: 0.20, release: 0.05 },
    gain: cfg.resolveGain * 0.9,
    harmonicGain: 0.08,
  });
  const offset = Math.floor(cfg.resolveDuration * 0.6 * SAMPLE_RATE);
  const total = new Float64Array(offset + note2.length);
  total.set(note1, 0);
  for (let i = 0; i < note2.length; i++) {
    if (offset + i < total.length) {
      total[offset + i] += note2[i];
    }
  }
  return limitLoudness(total);
}
