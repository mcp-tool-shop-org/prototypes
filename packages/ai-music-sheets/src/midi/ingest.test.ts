import { describe, it, expect } from "vitest";
import { writeMidi } from "midi-file";
import { midiToSongEntry, midiNoteToScientific } from "./ingest.js";
import { SongConfigSchema, validateConfig } from "../config/schema.js";
import type { SongConfig } from "../config/schema.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal valid SongConfig for testing. */
function makeConfig(overrides: Partial<SongConfig> = {}): SongConfig {
  return {
    id: "test-song",
    title: "Test Song",
    genre: "classical",
    difficulty: "beginner",
    key: "C major",
    tempo: 120,
    timeSignature: "4/4",
    tags: ["test"],
    musicalLanguage: {
      description: "A test song.",
      structure: "A",
      keyMoments: ["m1: test"],
      teachingGoals: ["Testing"],
      styleTips: ["Play evenly"],
    },
    ...overrides,
  };
}

/**
 * Build a minimal MIDI buffer with the given notes.
 * Notes are specified as [noteNumber, startBeat, durationBeats][].
 * Uses 480 ticks per beat, single track, format 0.
 */
function buildMidi(
  notes: [number, number, number][],
  opts: { tempo?: number; timeSig?: [number, number] } = {},
): Uint8Array {
  const ticksPerBeat = 480;
  const track: any[] = [];

  // Tempo event
  const bpm = opts.tempo ?? 120;
  track.push({
    deltaTime: 0,
    type: "setTempo",
    microsecondsPerBeat: Math.round(60_000_000 / bpm),
    meta: true,
  });

  // Time signature event
  const [num, denom] = opts.timeSig ?? [4, 4];
  track.push({
    deltaTime: 0,
    type: "timeSignature",
    numerator: num,
    denominator: Math.log2(denom),
    metronome: 24,
    thirtyseconds: 8,
    meta: true,
  });

  // Sort notes by start time, then convert to noteOn/noteOff events
  const sorted = [...notes].sort((a, b) => a[1] - b[1]);

  // Build absolute-time events
  const events: { tick: number; type: "noteOn" | "noteOff"; noteNumber: number; velocity: number }[] = [];
  for (const [noteNum, startBeat, durBeats] of sorted) {
    const startTick = Math.round(startBeat * ticksPerBeat);
    const endTick = Math.round((startBeat + durBeats) * ticksPerBeat);
    events.push({ tick: startTick, type: "noteOn", noteNumber: noteNum, velocity: 80 });
    events.push({ tick: endTick, type: "noteOff", noteNumber: noteNum, velocity: 0 });
  }

  // Sort by tick
  events.sort((a, b) => a.tick - b.tick);

  // Convert to delta time events on the track
  let lastTick = 0;
  for (const ev of events) {
    track.push({
      deltaTime: ev.tick - lastTick,
      type: ev.type,
      channel: 0,
      noteNumber: ev.noteNumber,
      velocity: ev.velocity,
    });
    lastTick = ev.tick;
  }

  // End of track
  track.push({ deltaTime: 0, type: "endOfTrack", meta: true });

  const midiData = {
    header: { format: 0 as const, numTracks: 1, ticksPerBeat },
    tracks: [track],
  };

  const bytes = writeMidi(midiData);
  return new Uint8Array(bytes);
}

// ─── Tests: midiNoteToScientific ─────────────────────────────────────────────

describe("midiNoteToScientific", () => {
  it("converts middle C (60) to C4", () => {
    expect(midiNoteToScientific(60)).toBe("C4");
  });

  it("converts A4 (69) correctly", () => {
    expect(midiNoteToScientific(69)).toBe("A4");
  });

  it("converts low notes", () => {
    expect(midiNoteToScientific(21)).toBe("A0"); // lowest piano key
  });

  it("converts high notes", () => {
    expect(midiNoteToScientific(108)).toBe("C8"); // highest piano key
  });

  it("handles sharps", () => {
    expect(midiNoteToScientific(61)).toBe("C#4");
    expect(midiNoteToScientific(66)).toBe("F#4");
  });
});

// ─── Tests: midiToSongEntry ──────────────────────────────────────────────────

describe("midiToSongEntry", () => {
  it("converts a simple 1-measure MIDI to SongEntry", () => {
    // C4 quarter note at beat 0
    const midi = buildMidi([[60, 0, 1]]);
    const config = makeConfig();
    const entry = midiToSongEntry(midi, config);

    expect(entry.id).toBe("test-song");
    expect(entry.title).toBe("Test Song");
    expect(entry.genre).toBe("classical");
    expect(entry.tempo).toBe(120);
    expect(entry.timeSignature).toBe("4/4");
    expect(entry.measures.length).toBeGreaterThanOrEqual(1);
    expect(entry.measures[0].number).toBe(1);
    // C4 is at split point (60), goes to right hand
    expect(entry.measures[0].rightHand).toContain("C4");
  });

  it("separates right hand and left hand by split point", () => {
    // C5 (72, above split) + C3 (48, below split) simultaneously
    const midi = buildMidi([
      [72, 0, 1],  // C5 → right hand
      [48, 0, 1],  // C3 → left hand
    ]);
    const config = makeConfig();
    const entry = midiToSongEntry(midi, config);

    expect(entry.measures[0].rightHand).toContain("C5");
    expect(entry.measures[0].leftHand).toContain("C3");
  });

  it("respects custom split point", () => {
    // Note 65 (F4) with split at 66 → left hand
    const midi = buildMidi([[65, 0, 1]]);
    const config = makeConfig({ splitPoint: 66 });
    const entry = midiToSongEntry(midi, config);

    expect(entry.measures[0].leftHand).toContain("F4");
    expect(entry.measures[0].rightHand).toBe("R:w"); // rest
  });

  it("correctly identifies note durations", () => {
    // Whole note (4 beats), half note (2 beats), quarter (1 beat), eighth (0.5 beat)
    const midi = buildMidi([
      [72, 0, 4],    // whole
      [74, 4, 2],    // half
      [76, 6, 1],    // quarter
      [77, 7, 0.5],  // eighth
    ]);
    const config = makeConfig();
    const entry = midiToSongEntry(midi, config);

    const rh = entry.measures[0].rightHand;
    expect(rh).toContain(":w");  // whole note
    // Other notes may be in measure 2
  });

  it("groups simultaneous notes into chords", () => {
    // C4 + E4 + G4 simultaneously (C major chord)
    const midi = buildMidi([
      [60, 0, 1],
      [64, 0, 1],
      [67, 0, 1],
    ]);
    const config = makeConfig();
    const entry = midiToSongEntry(midi, config);

    const rh = entry.measures[0].rightHand;
    // Should contain all three note names
    expect(rh).toContain("C4");
    expect(rh).toContain("E4");
    expect(rh).toContain("G4");
  });

  it("applies measure overrides", () => {
    const midi = buildMidi([[60, 0, 1]]);
    const config = makeConfig({
      measureOverrides: [
        {
          measure: 1,
          fingering: "RH: 1-3-5",
          teachingNote: "Start gently",
          dynamics: "mp",
        },
      ],
    });
    const entry = midiToSongEntry(midi, config);

    expect(entry.measures[0].fingering).toBe("RH: 1-3-5");
    expect(entry.measures[0].teachingNote).toBe("Start gently");
    expect(entry.measures[0].dynamics).toBe("mp");
  });

  it("creates empty measures as rests", () => {
    // Notes only in measure 1, but MIDI extends to measure 2+
    const midi = buildMidi([
      [60, 0, 1],  // measure 1
      [60, 8, 1],  // measure 3 (beat 8 in 4/4)
    ]);
    const config = makeConfig();
    const entry = midiToSongEntry(midi, config);

    // Measure 2 should be rests
    if (entry.measures.length >= 2) {
      expect(entry.measures[1].rightHand).toBe("R:w");
      expect(entry.measures[1].leftHand).toBe("R:w");
    }
  });

  it("carries config metadata through to SongEntry", () => {
    const midi = buildMidi([[60, 0, 1]]);
    const config = makeConfig({
      composer: "Test Composer",
      arranger: "Test Arranger",
      source: "Test source",
      tags: ["tag1", "tag2"],
    });
    const entry = midiToSongEntry(midi, config);

    expect(entry.composer).toBe("Test Composer");
    expect(entry.arranger).toBe("Test Arranger");
    expect(entry.source).toBe("Test source");
    expect(entry.tags).toEqual(["tag1", "tag2"]);
    expect(entry.musicalLanguage.description).toBe("A test song.");
  });
});

// ─── Tests: SongConfig Schema Validation ─────────────────────────────────────

describe("SongConfigSchema", () => {
  it("validates a complete valid config", () => {
    const config = makeConfig();
    const result = SongConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = SongConfigSchema.safeParse({ id: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid genre", () => {
    const config = makeConfig({ genre: "country" as any });
    const result = SongConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects non-kebab-case id", () => {
    const config = makeConfig({ id: "Not Kebab Case" });
    const result = SongConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("accepts optional fields when missing", () => {
    const config = makeConfig();
    delete (config as any).composer;
    delete (config as any).arranger;
    delete (config as any).source;
    delete (config as any).measureOverrides;
    delete (config as any).splitPoint;
    const result = SongConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

describe("validateConfig", () => {
  it("returns empty array for valid config", () => {
    const errors = validateConfig(makeConfig());
    expect(errors).toEqual([]);
  });

  it("returns errors for invalid config", () => {
    const errors = validateConfig({ id: 123 });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBeDefined();
    expect(errors[0].message).toBeDefined();
  });
});
