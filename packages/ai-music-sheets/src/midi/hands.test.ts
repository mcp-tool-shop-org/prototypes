import { describe, it, expect } from "vitest";
import {
  separateHands,
  groupIntoChords,
  isChord,
  midiNoteToScientific,
  ticksToDuration,
  formatNote,
  chordToString,
  formatHand,
} from "./hands.js";
import type { ResolvedNote } from "./types.js";

const TPB = 480; // ticks per beat

function makeNote(
  noteNumber: number,
  startTick: number = 0,
  durationTicks: number = 480,
): ResolvedNote {
  return { noteNumber, startTick, durationTicks, velocity: 80, channel: 0 };
}

// ─── separateHands ───────────────────────────────────────────────────────────

describe("separateHands", () => {
  it("splits at default C4 (60)", () => {
    const notes = [makeNote(72), makeNote(48)];
    const { rightHand, leftHand } = separateHands(notes);
    expect(rightHand).toHaveLength(1);
    expect(rightHand[0].noteNumber).toBe(72);
    expect(leftHand).toHaveLength(1);
    expect(leftHand[0].noteNumber).toBe(48);
  });

  it("puts C4 (60) in right hand", () => {
    const { rightHand } = separateHands([makeNote(60)]);
    expect(rightHand).toHaveLength(1);
  });

  it("puts B3 (59) in left hand", () => {
    const { leftHand } = separateHands([makeNote(59)]);
    expect(leftHand).toHaveLength(1);
  });

  it("respects custom split point", () => {
    const notes = [makeNote(65)]; // F4
    const { rightHand, leftHand } = separateHands(notes, 66);
    expect(rightHand).toHaveLength(0);
    expect(leftHand).toHaveLength(1);
  });

  it("handles empty input", () => {
    const { rightHand, leftHand } = separateHands([]);
    expect(rightHand).toHaveLength(0);
    expect(leftHand).toHaveLength(0);
  });
});

// ─── groupIntoChords ─────────────────────────────────────────────────────────

describe("groupIntoChords", () => {
  it("groups simultaneous notes", () => {
    const notes = [makeNote(60, 0), makeNote(64, 0), makeNote(67, 0)];
    const groups = groupIntoChords(notes);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
  });

  it("separates sequential notes", () => {
    const notes = [makeNote(60, 0), makeNote(64, 480), makeNote(67, 960)];
    const groups = groupIntoChords(notes);
    expect(groups).toHaveLength(3);
  });

  it("uses tolerance window", () => {
    const notes = [makeNote(60, 0), makeNote(64, 5)]; // 5 ticks apart
    const groups = groupIntoChords(notes, 10);
    expect(groups).toHaveLength(1); // treated as chord
  });

  it("splits notes beyond tolerance", () => {
    const notes = [makeNote(60, 0), makeNote(64, 20)];
    const groups = groupIntoChords(notes, 10);
    expect(groups).toHaveLength(2);
  });

  it("returns empty for empty input", () => {
    expect(groupIntoChords([])).toHaveLength(0);
  });
});

// ─── isChord ─────────────────────────────────────────────────────────────────

describe("isChord", () => {
  it("returns true for 2+ notes", () => {
    expect(isChord([makeNote(60), makeNote(64)])).toBe(true);
  });

  it("returns false for single note", () => {
    expect(isChord([makeNote(60)])).toBe(false);
  });
});

// ─── midiNoteToScientific ────────────────────────────────────────────────────

describe("midiNoteToScientific", () => {
  it("C4 = 60", () => expect(midiNoteToScientific(60)).toBe("C4"));
  it("A4 = 69", () => expect(midiNoteToScientific(69)).toBe("A4"));
  it("A0 = 21", () => expect(midiNoteToScientific(21)).toBe("A0"));
  it("C8 = 108", () => expect(midiNoteToScientific(108)).toBe("C8"));
  it("C#4 = 61", () => expect(midiNoteToScientific(61)).toBe("C#4"));
  it("F#4 = 66", () => expect(midiNoteToScientific(66)).toBe("F#4"));
  it("G#3 = 56", () => expect(midiNoteToScientific(56)).toBe("G#3"));
});

// ─── ticksToDuration ─────────────────────────────────────────────────────────

describe("ticksToDuration", () => {
  it("whole note = 4 beats", () => expect(ticksToDuration(1920, TPB)).toBe("w"));
  it("dotted half = 3 beats", () => expect(ticksToDuration(1440, TPB)).toBe("h."));
  it("half note = 2 beats", () => expect(ticksToDuration(960, TPB)).toBe("h"));
  it("dotted quarter = 1.5 beats", () => expect(ticksToDuration(720, TPB)).toBe("q."));
  it("quarter note = 1 beat", () => expect(ticksToDuration(480, TPB)).toBe("q"));
  it("dotted eighth = 0.75 beats", () => expect(ticksToDuration(360, TPB)).toBe("e."));
  it("eighth note = 0.5 beats", () => expect(ticksToDuration(240, TPB)).toBe("e"));
  it("sixteenth = 0.25 beats", () => expect(ticksToDuration(120, TPB)).toBe("s"));

  // Triplets
  it("quarter triplet = 2/3 beat", () => expect(ticksToDuration(320, TPB)).toBe("qt"));
  it("eighth triplet = 1/3 beat", () => expect(ticksToDuration(160, TPB)).toBe("et"));
  it("half triplet = 4/3 beats", () => expect(ticksToDuration(640, TPB)).toBe("ht"));

  // Quantization tolerance
  it("handles slightly off quarter note", () => expect(ticksToDuration(475, TPB)).toBe("q"));
});

// ─── formatNote ──────────────────────────────────────────────────────────────

describe("formatNote", () => {
  it("formats C4 quarter", () => {
    expect(formatNote(makeNote(60, 0, 480), TPB)).toBe("C4:q");
  });

  it("formats A4 half", () => {
    expect(formatNote(makeNote(69, 0, 960), TPB)).toBe("A4:h");
  });
});

// ─── chordToString ───────────────────────────────────────────────────────────

describe("chordToString", () => {
  it("formats single note", () => {
    const chord = [makeNote(60, 0, 480)];
    expect(chordToString(chord, TPB)).toBe("C4:q");
  });

  it("formats chord sorted low to high", () => {
    const chord = [makeNote(67, 0, 480), makeNote(60, 0, 480), makeNote(64, 0, 480)];
    expect(chordToString(chord, TPB)).toBe("C4 E4 G4:q");
  });

  it("uses longest duration for chord", () => {
    const chord = [makeNote(60, 0, 480), makeNote(64, 0, 960)];
    expect(chordToString(chord, TPB)).toBe("C4 E4:h");
  });
});

// ─── formatHand ──────────────────────────────────────────────────────────────

describe("formatHand", () => {
  it("returns rest for empty notes", () => {
    expect(formatHand([], TPB)).toBe("R:w");
  });

  it("formats single note", () => {
    expect(formatHand([makeNote(60, 0, 480)], TPB)).toBe("C4:q");
  });

  it("formats multiple sequential notes", () => {
    const notes = [makeNote(60, 0, 480), makeNote(64, 480, 480)];
    expect(formatHand(notes, TPB)).toBe("C4:q E4:q");
  });

  it("formats chord + sequential note", () => {
    const notes = [makeNote(60, 0, 480), makeNote(64, 0, 480), makeNote(67, 480, 480)];
    expect(formatHand(notes, TPB)).toBe("C4 E4:q G4:q");
  });
});
