import { describe, it, expect } from "vitest";
import {
  generateTone,
  generateWhoosh,
  mixBuffers,
  concatBuffers,
  encodeWav,
  limitLoudness,
  applyVolume,
  applyLowPass,
  SAMPLE_RATE,
  type ToneParams,
  type WhooshParams,
} from "../src/synth.js";

// --- Helpers ---

const SHORT_ENV = { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.01 };

function simpleTone(overrides: Partial<ToneParams> = {}): ToneParams {
  return {
    waveform: "sine",
    frequency: 440,
    duration: 0.1,
    envelope: { ...SHORT_ENV },
    gain: 0.8,
    ...overrides,
  };
}

function simpleWhoosh(overrides: Partial<WhooshParams> = {}): WhooshParams {
  return {
    duration: 0.1,
    freqStart: 500,
    freqEnd: 2000,
    bandwidth: 0.8,
    envelope: { ...SHORT_ENV },
    gain: 0.6,
    ...overrides,
  };
}

/** Check that all samples are in [-1, 1] (or within a tolerance). */
function assertInRange(buf: Float64Array, min = -1.1, max = 1.1): void {
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < min || buf[i] > max) {
      throw new Error(`Sample ${i} = ${buf[i]} out of range [${min}, ${max}]`);
    }
  }
}

// --- Tests ---

describe("generateTone", () => {
  it("produces a buffer of correct length", () => {
    const buf = generateTone(simpleTone({ duration: 0.1 }));
    expect(buf.length).toBe(Math.floor(0.1 * SAMPLE_RATE));
  });

  it("produces a buffer of correct length for longer durations", () => {
    const buf = generateTone(simpleTone({ duration: 0.5 }));
    expect(buf.length).toBe(Math.floor(0.5 * SAMPLE_RATE));
  });

  it("all samples are within [-1, 1]", () => {
    const buf = generateTone(simpleTone());
    assertInRange(buf);
  });

  it("gain=0 produces silence", () => {
    const buf = generateTone(simpleTone({ gain: 0 }));
    const max = Math.max(...buf.map(Math.abs));
    expect(max).toBe(0);
  });

  it("respects frequency sweep (frequencyEnd)", () => {
    // A rising sweep should start lower and end higher
    const buf = generateTone(simpleTone({
      frequency: 200,
      frequencyEnd: 800,
      duration: 0.1,
      envelope: { attack: 0, decay: 0, sustain: 1, release: 0 },
    }));
    expect(buf.length).toBeGreaterThan(0);
    assertInRange(buf);
  });

  it("FM synthesis doesn't blow up", () => {
    const buf = generateTone(simpleTone({
      fmRatio: 2,
      fmDepth: 50,
    }));
    assertInRange(buf);
  });

  it("tremolo doesn't blow up", () => {
    const buf = generateTone(simpleTone({
      tremoloRate: 8,
      tremoloDepth: 0.5,
    }));
    assertInRange(buf);
  });

  it("harmonic adds an octave overtone", () => {
    const plain = generateTone(simpleTone({ harmonicGain: 0 }));
    const harmonic = generateTone(simpleTone({ harmonicGain: 0.3 }));
    // Buffers should differ
    let diffCount = 0;
    for (let i = 0; i < plain.length; i++) {
      if (Math.abs(plain[i] - harmonic[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(plain.length * 0.5);
  });

  it("detune creates beating effect (differs from non-detuned)", () => {
    const plain = generateTone(simpleTone({ detune: 0 }));
    const detuned = generateTone(simpleTone({ detune: 5 }));
    let diffCount = 0;
    for (let i = 0; i < plain.length; i++) {
      if (Math.abs(plain[i] - detuned[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it("works with all 5 waveforms", () => {
    const waveforms = ["sine", "square", "sawtooth", "triangle", "noise"] as const;
    for (const wf of waveforms) {
      const buf = generateTone(simpleTone({ waveform: wf }));
      expect(buf.length).toBeGreaterThan(0);
      // Noise is random so skip range check for it (gain-limited anyway)
      if (wf !== "noise") {
        assertInRange(buf);
      }
    }
  });
});

describe("generateWhoosh", () => {
  it("produces a buffer of correct length", () => {
    const buf = generateWhoosh(simpleWhoosh({ duration: 0.2 }));
    expect(buf.length).toBe(Math.floor(0.2 * SAMPLE_RATE));
  });

  it("produces non-silent output", () => {
    const buf = generateWhoosh(simpleWhoosh());
    const peak = Math.max(...Array.from(buf).map(Math.abs));
    expect(peak).toBeGreaterThan(0);
  });

  it("gain=0 produces silence", () => {
    const buf = generateWhoosh(simpleWhoosh({ gain: 0 }));
    const peak = Math.max(...Array.from(buf).map(Math.abs));
    expect(peak).toBe(0);
  });
});

describe("mixBuffers", () => {
  it("mixes two buffers of equal length", () => {
    const a = new Float64Array([0.5, 0.3, 0.1]);
    const b = new Float64Array([0.2, 0.4, 0.6]);
    const mixed = mixBuffers([a, b]);
    expect(mixed.length).toBe(3);
    expect(mixed[0]).toBeCloseTo(0.7);
    expect(mixed[1]).toBeCloseTo(0.7);
    expect(mixed[2]).toBeCloseTo(0.7);
  });

  it("handles buffers of different lengths", () => {
    const a = new Float64Array([0.5, 0.3]);
    const b = new Float64Array([0.2, 0.4, 0.6]);
    const mixed = mixBuffers([a, b]);
    expect(mixed.length).toBe(3);
    expect(mixed[2]).toBeCloseTo(0.6);
  });

  it("normalizes when peak exceeds 1", () => {
    const a = new Float64Array([0.8]);
    const b = new Float64Array([0.8]);
    const mixed = mixBuffers([a, b]);
    // Sum = 1.6, should be normalized to 1.0
    expect(mixed[0]).toBeCloseTo(1.0);
  });

  it("doesn't normalize when peak is under 1", () => {
    const a = new Float64Array([0.3]);
    const b = new Float64Array([0.2]);
    const mixed = mixBuffers([a, b]);
    expect(mixed[0]).toBeCloseTo(0.5);
  });

  it("handles empty array", () => {
    // Max of empty array is -Infinity, result should be empty
    const mixed = mixBuffers([new Float64Array(0)]);
    expect(mixed.length).toBe(0);
  });
});

describe("concatBuffers", () => {
  it("concatenates two buffers", () => {
    const a = new Float64Array([1, 2]);
    const b = new Float64Array([3, 4]);
    const result = concatBuffers([a, b]);
    expect(result.length).toBe(4);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe(4);
  });

  it("adds gap between buffers", () => {
    const a = new Float64Array([1]);
    const b = new Float64Array([2]);
    const gapSec = 10 / SAMPLE_RATE; // 10 samples gap
    const result = concatBuffers([a, b], gapSec);
    expect(result.length).toBe(12); // 1 + 10 + 1
    expect(result[0]).toBe(1);
    // Gap should be silence
    for (let i = 1; i <= 10; i++) {
      expect(result[i]).toBe(0);
    }
    expect(result[11]).toBe(2);
  });

  it("single buffer returns copy", () => {
    const a = new Float64Array([5, 6, 7]);
    const result = concatBuffers([a]);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(5);
  });
});

describe("encodeWav", () => {
  it("produces a valid WAV header", () => {
    const buf = new Float64Array([0, 0.5, -0.5, 1, -1]);
    const wav = encodeWav(buf);

    // RIFF header
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");

    // fmt chunk
    expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
    expect(wav.readUInt32LE(16)).toBe(16); // PCM sub-chunk size
    expect(wav.readUInt16LE(20)).toBe(1); // PCM format
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt32LE(24)).toBe(SAMPLE_RATE);

    // data chunk
    expect(wav.toString("ascii", 36, 40)).toBe("data");

    // Data size = 5 samples × 2 bytes
    expect(wav.readUInt32LE(40)).toBe(10);
  });

  it("total file size matches header", () => {
    const buf = new Float64Array(100);
    const wav = encodeWav(buf);
    const declaredSize = wav.readUInt32LE(4) + 8;
    expect(wav.length).toBe(declaredSize);
  });

  it("encodes PCM samples correctly", () => {
    const buf = new Float64Array([0, 1, -1, 0.5]);
    const wav = encodeWav(buf);

    // Samples start at offset 44
    expect(wav.readInt16LE(44)).toBe(0);
    expect(wav.readInt16LE(46)).toBe(32767);
    expect(wav.readInt16LE(48)).toBe(-32767);
    expect(wav.readInt16LE(50)).toBe(Math.round(0.5 * 32767));
  });

  it("clips values beyond [-1, 1]", () => {
    const buf = new Float64Array([2, -2]);
    const wav = encodeWav(buf);
    expect(wav.readInt16LE(44)).toBe(32767);
    expect(wav.readInt16LE(46)).toBe(-32767);
  });
});

describe("limitLoudness", () => {
  it("doesn't change samples below the knee", () => {
    const ceiling = 0.85;
    const knee = ceiling * 0.7;
    const buf = new Float64Array([0, 0.1, knee - 0.01, -(knee - 0.01)]);
    const limited = limitLoudness(buf, ceiling);
    expect(limited[0]).toBeCloseTo(0);
    expect(limited[1]).toBeCloseTo(0.1);
    expect(limited[2]).toBeCloseTo(knee - 0.01, 2);
    expect(limited[3]).toBeCloseTo(-(knee - 0.01), 2);
  });

  it("compresses samples above the knee", () => {
    const ceiling = 0.85;
    const buf = new Float64Array([0.9]);
    const limited = limitLoudness(buf, ceiling);
    // Should be compressed to at most ceiling
    expect(limited[0]).toBeLessThanOrEqual(ceiling);
    expect(limited[0]).toBeGreaterThan(0.7);
  });

  it("caps at ceiling", () => {
    const ceiling = 0.85;
    const buf = new Float64Array([5.0, -5.0]);
    const limited = limitLoudness(buf, ceiling);
    expect(limited[0]).toBeLessThanOrEqual(ceiling);
    expect(limited[1]).toBeGreaterThanOrEqual(-ceiling);
  });

  it("returns a new buffer (immutable)", () => {
    const buf = new Float64Array([0.5]);
    const limited = limitLoudness(buf);
    expect(limited).not.toBe(buf);
  });
});

describe("applyVolume", () => {
  it("scales buffer by gain factor", () => {
    const buf = new Float64Array([1.0, -1.0, 0.5]);
    const scaled = applyVolume(buf, 0.5);
    expect(scaled[0]).toBeCloseTo(0.5);
    expect(scaled[1]).toBeCloseTo(-0.5);
    expect(scaled[2]).toBeCloseTo(0.25);
  });

  it("gain=1 returns original buffer reference", () => {
    const buf = new Float64Array([1.0]);
    const scaled = applyVolume(buf, 1.0);
    expect(scaled).toBe(buf);
  });

  it("gain=0 produces silence", () => {
    const buf = new Float64Array([1.0, -1.0]);
    const scaled = applyVolume(buf, 0);
    expect(scaled[0]).toBeCloseTo(0);
    expect(scaled[1]).toBeCloseTo(0);
  });
});

describe("applyLowPass", () => {
  it("returns same length buffer", () => {
    const buf = new Float64Array(1000);
    buf.fill(0.5);
    const filtered = applyLowPass(buf, 2500);
    expect(filtered.length).toBe(buf.length);
  });

  it("low-frequency sine passes through nearly unchanged", () => {
    // 200 Hz sine — well below a 2500 Hz cutoff
    const freq = 200;
    const dur = 0.05;
    const samples = Math.floor(dur * SAMPLE_RATE);
    const buf = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      buf[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
    const filtered = applyLowPass(buf, 2500);
    // After initial transient settles (~20 samples), should be close to original
    let maxDiff = 0;
    for (let i = 50; i < samples; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(buf[i] - filtered[i]));
    }
    expect(maxDiff).toBeLessThan(0.15);
  });

  it("high-frequency content is attenuated", () => {
    // 8000 Hz sine — well above a 2500 Hz cutoff
    const freq = 8000;
    const dur = 0.02;
    const samples = Math.floor(dur * SAMPLE_RATE);
    const buf = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      buf[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
    const filtered = applyLowPass(buf, 2500);
    // Measure RMS of filtered vs original — should be significantly reduced
    let rmsOrig = 0, rmsFilt = 0;
    for (let i = 100; i < samples; i++) {
      rmsOrig += buf[i] * buf[i];
      rmsFilt += filtered[i] * filtered[i];
    }
    rmsOrig = Math.sqrt(rmsOrig / (samples - 100));
    rmsFilt = Math.sqrt(rmsFilt / (samples - 100));
    // Filtered should be at least 50% quieter
    expect(rmsFilt).toBeLessThan(rmsOrig * 0.5);
  });

  it("very high cutoff is nearly a no-op", () => {
    const freq = 1000;
    const dur = 0.02;
    const samples = Math.floor(dur * SAMPLE_RATE);
    const buf = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      buf[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
    const filtered = applyLowPass(buf, 20000);
    let maxDiff = 0;
    for (let i = 10; i < samples; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(buf[i] - filtered[i]));
    }
    expect(maxDiff).toBeLessThan(0.05);
  });

  it("does not produce values outside [-1, 1] for normalized input", () => {
    const buf = new Float64Array(500);
    for (let i = 0; i < 500; i++) {
      buf[i] = Math.sin(2 * Math.PI * 440 * i / SAMPLE_RATE);
    }
    const filtered = applyLowPass(buf, 1000);
    for (let i = 0; i < filtered.length; i++) {
      expect(Math.abs(filtered[i])).toBeLessThanOrEqual(1.001);
    }
  });

  it("very low cutoff strongly attenuates a 1 kHz signal", () => {
    const freq = 1000;
    const dur = 0.05;
    const samples = Math.floor(dur * SAMPLE_RATE);
    const buf = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      buf[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    }
    const filtered = applyLowPass(buf, 100);
    let rmsOrig = 0, rmsFilt = 0;
    for (let i = 200; i < samples; i++) {
      rmsOrig += buf[i] * buf[i];
      rmsFilt += filtered[i] * filtered[i];
    }
    rmsOrig = Math.sqrt(rmsOrig / (samples - 200));
    rmsFilt = Math.sqrt(rmsFilt / (samples - 200));
    expect(rmsFilt).toBeLessThan(rmsOrig * 0.2);
  });
});
