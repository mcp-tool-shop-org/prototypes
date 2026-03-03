// ─── MIDI Pipeline Types ─────────────────────────────────────────────────────
//
// Shared types used across the MIDI ingest modules:
// measures.ts, hands.ts, ingest.ts
// ─────────────────────────────────────────────────────────────────────────────

/** A resolved note with absolute timing from MIDI. */
export interface ResolvedNote {
  /** MIDI note number 0-127. */
  noteNumber: number;
  /** Start time in ticks from the beginning. */
  startTick: number;
  /** Duration in ticks. */
  durationTicks: number;
  /** Velocity 0-127. */
  velocity: number;
  /** MIDI channel. */
  channel: number;
}

/** A tempo change event with absolute tick position. */
export interface TempoEvent {
  tick: number;
  microsecondsPerBeat: number;
}

/** A time signature event with absolute tick position. */
export interface TimeSigEvent {
  tick: number;
  numerator: number;
  denominator: number;
}
