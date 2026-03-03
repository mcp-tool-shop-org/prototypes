import { describe, it, expect } from "vitest";
import {
  ticksPerMeasure,
  computeTotalMeasures,
  sliceIntoMeasures,
  parseTimeSignature,
  resolveTimeSignature,
} from "./measures.js";
import type { ResolvedNote, TimeSigEvent } from "./types.js";

function makeNote(startTick: number, durationTicks: number = 480, noteNumber: number = 60): ResolvedNote {
  return { noteNumber, startTick, durationTicks, velocity: 80, channel: 0 };
}

describe("ticksPerMeasure", () => {
  it("computes 4/4 at 480 tpb = 1920", () => {
    expect(ticksPerMeasure(480, 4, 4)).toBe(1920);
  });

  it("computes 3/4 at 480 tpb = 1440", () => {
    expect(ticksPerMeasure(480, 3, 4)).toBe(1440);
  });

  it("computes 6/8 at 480 tpb = 1440", () => {
    expect(ticksPerMeasure(480, 6, 8)).toBe(1440);
  });

  it("computes 2/4 at 480 tpb = 960", () => {
    expect(ticksPerMeasure(480, 2, 4)).toBe(960);
  });
});

describe("computeTotalMeasures", () => {
  it("returns 1 for empty notes", () => {
    expect(computeTotalMeasures([], 1920)).toBe(1);
  });

  it("returns 1 for notes within first measure", () => {
    expect(computeTotalMeasures([makeNote(0, 480)], 1920)).toBe(1);
  });

  it("returns 2 when note extends past first measure", () => {
    expect(computeTotalMeasures([makeNote(0, 2400)], 1920)).toBe(2);
  });

  it("counts by note end position, not just start", () => {
    // Note starts at tick 1800 (within measure 1) but extends to 2280 (measure 2)
    expect(computeTotalMeasures([makeNote(1800, 480)], 1920)).toBe(2);
  });
});

describe("sliceIntoMeasures", () => {
  it("puts notes into correct measure buckets", () => {
    const notes = [
      makeNote(0),          // measure 1
      makeNote(480),        // measure 1
      makeNote(1920),       // measure 2
      makeNote(3840),       // measure 3
    ];
    const buckets = sliceIntoMeasures(notes, 3, 1920);

    expect(buckets).toHaveLength(3);
    expect(buckets[0].notes).toHaveLength(2);
    expect(buckets[1].notes).toHaveLength(1);
    expect(buckets[2].notes).toHaveLength(1);
    expect(buckets[0].number).toBe(1);
    expect(buckets[1].number).toBe(2);
    expect(buckets[2].number).toBe(3);
  });

  it("creates empty buckets for silent measures", () => {
    const notes = [makeNote(3840)]; // measure 3 only
    const buckets = sliceIntoMeasures(notes, 3, 1920);

    expect(buckets[0].notes).toHaveLength(0);
    expect(buckets[1].notes).toHaveLength(0);
    expect(buckets[2].notes).toHaveLength(1);
  });

  it("sets correct startTick and endTick", () => {
    const buckets = sliceIntoMeasures([], 2, 1920);
    expect(buckets[0].startTick).toBe(0);
    expect(buckets[0].endTick).toBe(1920);
    expect(buckets[1].startTick).toBe(1920);
    expect(buckets[1].endTick).toBe(3840);
  });
});

describe("parseTimeSignature", () => {
  it("parses 4/4", () => {
    expect(parseTimeSignature("4/4")).toEqual({ numerator: 4, denominator: 4 });
  });

  it("parses 3/4", () => {
    expect(parseTimeSignature("3/4")).toEqual({ numerator: 3, denominator: 4 });
  });

  it("parses 6/8", () => {
    expect(parseTimeSignature("6/8")).toEqual({ numerator: 6, denominator: 8 });
  });

  it("defaults to 4/4 for undefined", () => {
    expect(parseTimeSignature(undefined)).toEqual({ numerator: 4, denominator: 4 });
  });

  it("defaults to 4/4 for garbage", () => {
    expect(parseTimeSignature("nope")).toEqual({ numerator: 4, denominator: 4 });
  });
});

describe("resolveTimeSignature", () => {
  it("prefers config over MIDI events", () => {
    const events: TimeSigEvent[] = [{ tick: 0, numerator: 3, denominator: 4 }];
    expect(resolveTimeSignature(events, "6/8")).toEqual({ numerator: 6, denominator: 8 });
  });

  it("falls back to MIDI events when no config", () => {
    const events: TimeSigEvent[] = [{ tick: 0, numerator: 3, denominator: 4 }];
    expect(resolveTimeSignature(events)).toEqual({ numerator: 3, denominator: 4 });
  });

  it("defaults to 4/4 when nothing available", () => {
    expect(resolveTimeSignature([])).toEqual({ numerator: 4, denominator: 4 });
  });
});
