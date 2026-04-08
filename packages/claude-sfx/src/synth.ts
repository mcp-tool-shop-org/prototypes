/**
 * Pure PCM synthesis engine. Zero dependencies.
 * Generates audio from math — oscillators, envelopes, FM, and WAV encoding.
 */

const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;
const NUM_CHANNELS = 1; // mono

// --- Oscillators ---

export type Waveform = "sine" | "square" | "sawtooth" | "triangle" | "noise";

/** Returns a sample value in [-1, 1] for a given phase (0–1 cycle). */
function oscillator(waveform: Waveform, phase: number): number {
  const p = phase % 1;
  switch (waveform) {
    case "sine":
      return Math.sin(2 * Math.PI * p);
    case "square":
      return p < 0.5 ? 1 : -1;
    case "sawtooth":
      return 2 * p - 1;
    case "triangle":
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case "noise":
      return Math.random() * 2 - 1;
  }
}

// --- Envelope (ADSR) ---

export interface Envelope {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // level 0–1
  release: number; // seconds
}

/** Returns envelope amplitude (0–1) at a given time within a note of total duration. */
function envelopeAt(env: Envelope, time: number, duration: number): number {
  const { attack, decay, sustain, release } = env;
  const releaseStart = duration - release;

  if (time < 0) return 0;
  if (time < attack) {
    // Attack: ramp from 0 to 1
    return time / attack;
  }
  if (time < attack + decay) {
    // Decay: ramp from 1 to sustain level
    const decayProgress = (time - attack) / decay;
    return 1 - decayProgress * (1 - sustain);
  }
  if (time < releaseStart) {
    // Sustain
    return sustain;
  }
  if (time < duration) {
    // Release: ramp from sustain to 0
    const releaseProgress = (time - releaseStart) / release;
    return sustain * (1 - releaseProgress);
  }
  return 0;
}

// --- Tone Parameters ---

export interface ToneParams {
  /** Base waveform */
  waveform: Waveform;
  /** Starting frequency in Hz */
  frequency: number;
  /** Ending frequency in Hz (for sweeps). If omitted, stays at `frequency`. */
  frequencyEnd?: number;
  /** Duration in seconds */
  duration: number;
  /** Amplitude envelope */
  envelope: Envelope;
  /** Master gain 0–1 */
  gain: number;

  // --- FM synthesis (optional) ---
  /** FM modulator frequency ratio (relative to carrier). e.g., 2 = double the carrier freq */
  fmRatio?: number;
  /** FM modulation depth in Hz */
  fmDepth?: number;

  // --- Tremolo (optional) ---
  /** Tremolo rate in Hz (amplitude modulation) */
  tremoloRate?: number;
  /** Tremolo depth 0–1 (0 = no effect, 1 = full AM) */
  tremoloDepth?: number;

  // --- Harmonics (optional) ---
  /** Add an octave harmonic at this gain level (0–1) */
  harmonicGain?: number;

  // --- Detune (optional) ---
  /** Detune amount in Hz (creates a second oscillator for beating) */
  detune?: number;
}

// --- PCM Generation ---

/** Generate a Float64 audio buffer from tone parameters. */
export function generateTone(params: ToneParams): Float64Array {
  const numSamples = Math.floor(params.duration * SAMPLE_RATE);
  const buffer = new Float64Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE; // time in seconds

    // Frequency sweep (linear interpolation)
    const freqEnd = params.frequencyEnd ?? params.frequency;
    const progress = i / numSamples;
    const freq = params.frequency + (freqEnd - params.frequency) * progress;

    // FM synthesis: modulate the carrier phase
    let fmOffset = 0;
    if (params.fmRatio && params.fmDepth) {
      const modFreq = freq * params.fmRatio;
      fmOffset =
        (params.fmDepth / (2 * Math.PI * freq)) *
        Math.sin(2 * Math.PI * modFreq * t);
    }

    // Carrier phase
    const phase = freq * t + fmOffset;
    let sample = oscillator(params.waveform, phase);

    // Octave harmonic
    if (params.harmonicGain && params.harmonicGain > 0) {
      sample += params.harmonicGain * oscillator(params.waveform, phase * 2);
      // Normalize to prevent clipping
      sample /= 1 + params.harmonicGain;
    }

    // Detune (second oscillator for beating effect)
    if (params.detune && params.detune !== 0) {
      const detunePhase = (freq + params.detune) * t + fmOffset;
      const detuneSample = oscillator(params.waveform, detunePhase);
      sample = (sample + detuneSample) / 2;
    }

    // Envelope
    sample *= envelopeAt(params.envelope, t, params.duration);

    // Tremolo (amplitude modulation)
    if (params.tremoloRate && params.tremoloDepth) {
      const tremoloMod =
        1 - params.tremoloDepth * 0.5 * (1 + Math.sin(2 * Math.PI * params.tremoloRate * t));
      sample *= tremoloMod;
    }

    // Master gain
    sample *= params.gain;

    buffer[i] = sample;
  }

  return buffer;
}

// --- Mixing ---

/** Mix multiple tone buffers into one (summed and normalized). */
export function mixBuffers(buffers: Float64Array[]): Float64Array {
  const maxLen = Math.max(...buffers.map((b) => b.length));
  const mixed = new Float64Array(maxLen);

  for (const buf of buffers) {
    for (let i = 0; i < buf.length; i++) {
      mixed[i] += buf[i];
    }
  }

  // Find peak for normalization
  let peak = 0;
  for (let i = 0; i < mixed.length; i++) {
    const abs = Math.abs(mixed[i]);
    if (abs > peak) peak = abs;
  }

  // Normalize if clipping
  if (peak > 1) {
    for (let i = 0; i < mixed.length; i++) {
      mixed[i] /= peak;
    }
  }

  return mixed;
}

/** Concatenate buffers sequentially with an optional gap (in seconds). */
export function concatBuffers(
  buffers: Float64Array[],
  gapSeconds: number = 0
): Float64Array {
  const gapSamples = Math.floor(gapSeconds * SAMPLE_RATE);
  const totalLength = buffers.reduce(
    (sum, b) => sum + b.length + gapSamples,
    -gapSamples // no gap after last buffer
  );
  const result = new Float64Array(Math.max(0, totalLength));

  let offset = 0;
  for (let bi = 0; bi < buffers.length; bi++) {
    const buf = buffers[bi];
    result.set(buf, offset);
    offset += buf.length;
    if (bi < buffers.length - 1) {
      offset += gapSamples;
    }
  }

  return result;
}

// --- WAV Encoding ---

/** Encode a Float64 audio buffer as a WAV file (PCM 16-bit mono). */
export function encodeWav(buffer: Float64Array): Buffer {
  const numSamples = buffer.length;
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BIT_DEPTH / 8);
  const blockAlign = NUM_CHANNELS * (BIT_DEPTH / 8);
  const dataSize = numSamples * NUM_CHANNELS * (BIT_DEPTH / 8);
  const fileSize = 44 + dataSize; // 44-byte header + data

  const wav = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  wav.write("RIFF", offset);
  offset += 4;
  wav.writeUInt32LE(fileSize - 8, offset);
  offset += 4;
  wav.write("WAVE", offset);
  offset += 4;

  // fmt sub-chunk
  wav.write("fmt ", offset);
  offset += 4;
  wav.writeUInt32LE(16, offset); // sub-chunk size (PCM = 16)
  offset += 4;
  wav.writeUInt16LE(1, offset); // audio format (PCM = 1)
  offset += 2;
  wav.writeUInt16LE(NUM_CHANNELS, offset);
  offset += 2;
  wav.writeUInt32LE(SAMPLE_RATE, offset);
  offset += 4;
  wav.writeUInt32LE(byteRate, offset);
  offset += 4;
  wav.writeUInt16LE(blockAlign, offset);
  offset += 2;
  wav.writeUInt16LE(BIT_DEPTH, offset);
  offset += 2;

  // data sub-chunk
  wav.write("data", offset);
  offset += 4;
  wav.writeUInt32LE(dataSize, offset);
  offset += 4;

  // PCM samples (float → 16-bit signed int)
  for (let i = 0; i < numSamples; i++) {
    let sample = buffer[i];
    // Hard clip
    sample = Math.max(-1, Math.min(1, sample));
    // Convert to 16-bit signed integer
    const int16 = Math.round(sample * 32767);
    wav.writeInt16LE(int16, offset);
    offset += 2;
  }

  return wav;
}

// --- Low-Pass Filter ---

/**
 * One-pole RC low-pass filter.
 * Gentle 6dB/octave rolloff — mimics distance (air absorbs highs).
 */
export function applyLowPass(buffer: Float64Array, cutoffHz: number): Float64Array {
  const a = Math.exp(-2 * Math.PI * cutoffHz / SAMPLE_RATE);
  const result = new Float64Array(buffer.length);
  let prev = 0;
  for (let i = 0; i < buffer.length; i++) {
    prev = (1 - a) * buffer[i] + a * prev;
    result[i] = prev;
  }
  return result;
}

// --- Loudness Limiter ---

/** Apply a hard loudness cap with gentle compression to a buffer. */
export function limitLoudness(
  buffer: Float64Array,
  ceiling: number = 0.85
): Float64Array {
  const result = new Float64Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    let s = buffer[i];
    // Soft knee compression above 70% of ceiling
    const knee = ceiling * 0.7;
    const abs = Math.abs(s);
    if (abs > knee) {
      const over = abs - knee;
      const range = ceiling - knee;
      // Compress the overshoot with a sqrt curve
      const compressed = knee + range * Math.sqrt(over / range);
      s = s > 0 ? Math.min(compressed, ceiling) : Math.max(-compressed, -ceiling);
    }
    result[i] = s;
  }
  return result;
}

// --- Volume scaling ---

/** Apply a volume gain (0.0–1.0) to a buffer. */
export function applyVolume(buffer: Float64Array, gain: number): Float64Array {
  if (gain >= 1) return buffer;
  const result = new Float64Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] * gain;
  }
  return result;
}

// --- Bandpass-Filtered Noise (for whooshes) ---

export interface WhooshParams {
  /** Duration in seconds */
  duration: number;
  /** Starting center frequency of the bandpass in Hz */
  freqStart: number;
  /** Ending center frequency of the bandpass in Hz */
  freqEnd: number;
  /** Bandwidth (Q) — lower = wider/breathier, higher = narrower/whistly */
  bandwidth: number;
  /** Amplitude envelope */
  envelope: Envelope;
  /** Master gain 0–1 */
  gain: number;
}

/**
 * Generate a whoosh: bandpass-filtered noise with a sweeping center frequency.
 * Uses a state-variable filter (SVF) for stable real-time coefficient changes.
 */
export function generateWhoosh(params: WhooshParams): Float64Array {
  const numSamples = Math.floor(params.duration * SAMPLE_RATE);
  const buffer = new Float64Array(numSamples);

  // SVF state
  let low = 0;
  let band = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;

    // Sweep the center frequency
    const centerFreq =
      params.freqStart + (params.freqEnd - params.freqStart) * progress;

    // SVF coefficients
    const f = 2 * Math.sin((Math.PI * centerFreq) / SAMPLE_RATE);
    const q = params.bandwidth;

    // White noise input
    const input = Math.random() * 2 - 1;

    // State-variable filter iteration (bandpass output)
    low += f * band;
    const high = input - low - q * band;
    band += f * high;

    let sample = band; // bandpass output

    // Envelope
    sample *= envelopeAt(params.envelope, t, params.duration);

    // Gain
    sample *= params.gain;

    buffer[i] = sample;
  }

  return buffer;
}

export { SAMPLE_RATE, BIT_DEPTH, NUM_CHANNELS };
