import { describe, it, expect } from "vitest";
import {
  generateVerb,
  generateSessionStart,
  generateSessionEnd,
  generateSessionEndWithOutcome,
  generateAmbientChunk,
  generateAmbientResolve,
  ALL_VERBS,
  VERB_LABELS,
  VERB_DESCRIPTIONS,
  type Verb,
  type PlayOptions,
} from "../src/verbs.js";
import { getBuiltinProfile } from "../src/profiles.js";
import { SAMPLE_RATE } from "../src/synth.js";

const minimal = getBuiltinProfile("minimal")!;
const retro = getBuiltinProfile("retro")!;

// Pin variant for deterministic tests
const DET: PlayOptions = { variantIndex: 0 };

function assertNonSilent(buf: Float64Array): void {
  const peak = Math.max(...Array.from(buf).map(Math.abs));
  expect(peak).toBeGreaterThan(0);
}

describe("verb metadata", () => {
  it("ALL_VERBS has exactly 7 entries", () => {
    expect(ALL_VERBS).toHaveLength(7);
  });

  it("every verb has a label", () => {
    for (const v of ALL_VERBS) {
      expect(VERB_LABELS[v]).toBeDefined();
      expect(VERB_LABELS[v].length).toBeGreaterThan(0);
    }
  });

  it("every verb has a description", () => {
    for (const v of ALL_VERBS) {
      expect(VERB_DESCRIPTIONS[v]).toBeDefined();
      expect(VERB_DESCRIPTIONS[v].length).toBeGreaterThan(0);
    }
  });
});

describe("generateVerb — minimal profile", () => {
  it("generates non-empty audio for all 7 verbs", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(minimal, verb, DET);
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });

  it("different verbs produce different buffer lengths", () => {
    const lengths = new Set(ALL_VERBS.map((v) => generateVerb(minimal, v, DET).length));
    // Not all verbs should have the same duration
    expect(lengths.size).toBeGreaterThan(1);
  });
});

describe("generateVerb — retro profile", () => {
  it("generates non-empty audio for all 7 verbs", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(retro, verb, DET);
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });
});

describe("status modifiers", () => {
  const statuses: PlayOptions["status"][] = ["ok", "err", "warn"];

  it("all motif verbs accept all statuses", () => {
    const motifVerbs: Verb[] = ["intake", "transform", "commit", "navigate", "execute"];
    for (const verb of motifVerbs) {
      for (const status of statuses) {
        const buf = generateVerb(minimal, verb, { ...DET, status });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });

  it("err status produces longer duration than default for motif verbs", () => {
    const verb: Verb = "navigate";
    const normal = generateVerb(minimal, verb, DET);
    const err = generateVerb(minimal, verb, { ...DET, status: "err" });
    expect(err.length).toBeGreaterThan(normal.length);
  });

  it("err status changes the sound for motif verbs", () => {
    const verb: Verb = "intake";
    const normal = generateVerb(minimal, verb, DET);
    const err = generateVerb(minimal, verb, { ...DET, status: "err" });
    // Should differ significantly
    let diffCount = 0;
    const minLen = Math.min(normal.length, err.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(normal[i] - err[i]) > 0.01) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.1);
  });

  it("whoosh verbs accept all statuses", () => {
    const whooshVerbs: Verb[] = ["move", "sync"];
    for (const verb of whooshVerbs) {
      for (const status of statuses) {
        const buf = generateVerb(minimal, verb, { ...DET, status });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("scope modifier", () => {
  it("remote scope changes the sound for motif verbs", () => {
    const verb: Verb = "intake";
    const local = generateVerb(minimal, verb, { ...DET, scope: "local" });
    const remote = generateVerb(minimal, verb, { ...DET, scope: "remote" });
    // Remote applies attack×1.25, release×1.5, gain×0.92 — buffers should differ
    let diffCount = 0;
    const minLen = Math.min(local.length, remote.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(local[i] - remote[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.1);
  });

  it("remote scope extends duration for whoosh verbs", () => {
    const verb: Verb = "move";
    const local = generateVerb(minimal, verb, { ...DET, scope: "local" });
    const remote = generateVerb(minimal, verb, { ...DET, scope: "remote" });
    expect(remote.length).toBeGreaterThan(local.length);
  });
});

describe("direction modifier", () => {
  it("up and down produce different buffers for move", () => {
    const up = generateVerb(minimal, "move", { ...DET, direction: "up" });
    const down = generateVerb(minimal, "move", { ...DET, direction: "down" });
    let diffCount = 0;
    const minLen = Math.min(up.length, down.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(up[i] - down[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.1);
  });

  it("up and down produce different buffers for sync", () => {
    const up = generateVerb(minimal, "sync", { ...DET, direction: "up" });
    const down = generateVerb(minimal, "sync", { ...DET, direction: "down" });
    let diffCount = 0;
    const minLen = Math.min(up.length, down.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(up[i] - down[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});

describe("session sounds", () => {
  it("session start produces non-empty audio", () => {
    const buf = generateSessionStart(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("session end produces non-empty audio", () => {
    const buf = generateSessionEnd(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("session start is different from session end", () => {
    const start = generateSessionStart(minimal);
    const end = generateSessionEnd(minimal);
    if (start.length === end.length) {
      let diffCount = 0;
      for (let i = 0; i < start.length; i++) {
        if (Math.abs(start[i] - end[i]) > 0.001) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    } else {
      expect(start.length).not.toBe(end.length);
    }
  });
});

describe("ambient sounds", () => {
  it("ambient chunk produces audio", () => {
    const buf = generateAmbientChunk(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("ambient chunk matches configured chunk duration", () => {
    const buf = generateAmbientChunk(minimal);
    const expectedSamples = Math.floor(minimal.ambient.chunkDuration * SAMPLE_RATE);
    expect(buf.length).toBe(expectedSamples);
  });

  it("ambient resolve produces audio", () => {
    const buf = generateAmbientResolve(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });
});

describe("intensity modifier (streak awareness)", () => {
  it("intensity 1 produces similar length to no intensity", () => {
    // Jitter means exact match is unlikely, but they should be close
    const normal = generateVerb(minimal, "commit", DET);
    const i1 = generateVerb(minimal, "commit", { ...DET, intensity: 1 });
    // Within 15% due to jitter
    expect(Math.abs(i1.length - normal.length)).toBeLessThan(normal.length * 0.15);
  });

  it("intensity 2+ adds harmonics — buffer differs from base", () => {
    const base = generateVerb(minimal, "commit", DET);
    const i2 = generateVerb(minimal, "commit", { ...DET, intensity: 2 });
    let diffCount = 0;
    const minLen = Math.min(base.length, i2.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(base[i] - i2[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it("high intensity produces non-trivially different sound", () => {
    const i1 = generateVerb(minimal, "commit", { ...DET, intensity: 1 });
    const i5 = generateVerb(minimal, "commit", { ...DET, intensity: 5 });
    // At intensity 5, release is extended + gain boosted — should be different
    let diffCount = 0;
    const minLen = Math.min(i1.length, i5.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(i1[i] - i5[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.1);
  });

  it("all verbs accept all intensity levels without error", () => {
    for (const verb of ALL_VERBS) {
      for (let i = 1; i <= 5; i++) {
        const buf = generateVerb(minimal, verb, { ...DET, intensity: i });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });

  it("whoosh verbs also respond to intensity", () => {
    const base = generateVerb(minimal, "move", DET);
    const i4 = generateVerb(minimal, "move", { ...DET, intensity: 4 });
    // Higher intensity widens sweep — but jitter may cause slight length variations
    // Verify non-trivially different content
    let diffCount = 0;
    const minLen = Math.min(base.length, i4.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(base[i] - i4[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});

describe("escalation modifier (error escalation)", () => {
  it("escalation 1 produces similar length to base error", () => {
    const baseErr = generateVerb(minimal, "execute", { ...DET, status: "err" });
    const e1 = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 1 });
    expect(Math.abs(e1.length - baseErr.length)).toBeLessThan(baseErr.length * 0.15);
  });

  it("higher escalation changes the error sound", () => {
    const e1 = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 1 });
    const e5 = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 5 });
    let diffCount = 0;
    const minLen = Math.min(e1.length, e5.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(e1[i] - e5[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.1);
  });

  it("escalation 5 sounds darker than escalation 1", () => {
    // Escalation darkens via lower register + detune + tremolo
    // Verify both produce non-silent audio with different characteristics
    const e1 = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 1 });
    const e5 = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 5 });
    assertNonSilent(e1);
    assertNonSilent(e5);
    // At escalation 5, there are more duration multipliers applied
    // so the buffer should generally be at least as long
    expect(e5.length + e5.length * 0.2).toBeGreaterThanOrEqual(e1.length);
  });

  it("all verbs accept escalation without error", () => {
    for (const verb of ALL_VERBS) {
      for (let i = 1; i <= 5; i++) {
        const buf = generateVerb(minimal, verb, { ...DET, status: "err", escalation: i });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });

  it("whoosh verbs respond to escalation", () => {
    const e1 = generateVerb(minimal, "sync", { ...DET, status: "err", escalation: 1 });
    const e5 = generateVerb(minimal, "sync", { ...DET, status: "err", escalation: 5 });
    expect(e5.length).toBeGreaterThan(e1.length);
  });
});

describe("completion fanfare (outcome-aware session end)", () => {
  it("great session (ratio >= 0.8, 5+ plays) produces fanfare", () => {
    const fanfare = generateSessionEndWithOutcome(minimal, { successRatio: 0.95, totalPlays: 20 });
    const normal = generateSessionEnd(minimal);
    expect(fanfare.length).not.toBe(normal.length);
    assertNonSilent(fanfare);
  });

  it("normal session (ratio 0.6-0.8) produces standard chime", () => {
    const result = generateSessionEndWithOutcome(minimal, { successRatio: 0.7, totalPlays: 20 });
    const normal = generateSessionEnd(minimal);
    expect(result.length).toBe(normal.length);
  });

  it("rough session (ratio < 0.6) produces muted end", () => {
    const muted = generateSessionEndWithOutcome(minimal, { successRatio: 0.3, totalPlays: 20 });
    const normal = generateSessionEnd(minimal);
    assertNonSilent(muted);
    if (muted.length === normal.length) {
      let diffCount = 0;
      for (let i = 0; i < muted.length; i++) {
        if (Math.abs(muted[i] - normal[i]) > 0.001) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    }
  });

  it("short session (< 5 plays) uses standard chime regardless of ratio", () => {
    const result = generateSessionEndWithOutcome(minimal, { successRatio: 0.1, totalPlays: 3 });
    const normal = generateSessionEnd(minimal);
    expect(result.length).toBe(normal.length);
  });

  it("fanfare produces non-silent audio", () => {
    const buf = generateSessionEndWithOutcome(minimal, { successRatio: 1, totalPlays: 50 });
    assertNonSilent(buf);
  });

  it("muted end produces non-silent audio", () => {
    const buf = generateSessionEndWithOutcome(minimal, { successRatio: 0.2, totalPlays: 50 });
    assertNonSilent(buf);
  });
});

describe("variant selection", () => {
  it("different variantIndex values produce different sounds", () => {
    const v0 = generateVerb(minimal, "intake", { variantIndex: 0 });
    const v1 = generateVerb(minimal, "intake", { variantIndex: 1 });
    const v2 = generateVerb(minimal, "intake", { variantIndex: 2 });

    // At least two should differ in length or content
    const lengths = new Set([v0.length, v1.length, v2.length]);
    if (lengths.size === 1) {
      // Same length — check content differs
      let diffCount01 = 0;
      for (let i = 0; i < v0.length; i++) {
        if (Math.abs(v0[i] - v1[i]) > 0.001) diffCount01++;
      }
      expect(diffCount01).toBeGreaterThan(0);
    }
  });

  it("random selection without variantIndex still produces valid audio", () => {
    for (let trial = 0; trial < 5; trial++) {
      const buf = generateVerb(minimal, "transform");
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });
});

describe("mix release modifier", () => {
  it("mixRelease < 1.0 changes the sound", () => {
    const normal = generateVerb(minimal, "intake", DET);
    const ducked = generateVerb(minimal, "intake", { ...DET, mixRelease: 0.70 });
    // Both produce audio; ducked should differ in content (shorter releases)
    assertNonSilent(ducked);
    let diffCount = 0;
    const minLen = Math.min(normal.length, ducked.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(normal[i] - ducked[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it("mixRelease = 1.0 is a no-op", () => {
    const normal = generateVerb(minimal, "commit", DET);
    const same = generateVerb(minimal, "commit", { ...DET, mixRelease: 1.0 });
    // Jitter means not exactly equal, but within tolerance
    expect(Math.abs(same.length - normal.length)).toBeLessThan(normal.length * 0.15);
  });

  it("all verbs accept mixRelease without error", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(minimal, verb, { ...DET, mixRelease: 0.70 });
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });

  it("mixRelease composes with escalation", () => {
    const escOnly = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 3 });
    const escAndMix = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 3, mixRelease: 0.70 });
    // Both produce audio, mix version should be shorter or same
    assertNonSilent(escOnly);
    assertNonSilent(escAndMix);
  });
});

describe("mix gain modifier", () => {
  it("mixGain < 1.0 reduces peak amplitude", () => {
    const normal = generateVerb(minimal, "commit", DET);
    const ducked = generateVerb(minimal, "commit", { ...DET, mixGain: 0.5 });
    const peakNormal = Math.max(...Array.from(normal).map(Math.abs));
    const peakDucked = Math.max(...Array.from(ducked).map(Math.abs));
    expect(peakDucked).toBeLessThan(peakNormal);
  });

  it("mixGain = 1.0 is a no-op (same peak)", () => {
    const normal = generateVerb(minimal, "intake", DET);
    const same = generateVerb(minimal, "intake", { ...DET, mixGain: 1.0 });
    const peakNormal = Math.max(...Array.from(normal).map(Math.abs));
    const peakSame = Math.max(...Array.from(same).map(Math.abs));
    // Jitter means not exactly equal, but close
    expect(Math.abs(peakNormal - peakSame)).toBeLessThan(0.1);
  });

  it("all verbs accept mixGain without error", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(minimal, verb, { ...DET, mixGain: 0.6 });
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });

  it("mixGain composes with intensity", () => {
    const buf = generateVerb(minimal, "commit", { ...DET, intensity: 4, mixGain: 0.7 });
    assertNonSilent(buf);
  });
});

describe("remote low-pass softening", () => {
  it("remote scope attenuates high-frequency content vs local", () => {
    const local = generateVerb(minimal, "intake", { ...DET, scope: "local" });
    const remote = generateVerb(minimal, "intake", { ...DET, scope: "remote" });

    // Measure high-frequency energy via sample-to-sample differences
    // (approximates derivative / high-frequency content)
    function highFreqEnergy(buf: Float64Array): number {
      let energy = 0;
      for (let i = 1; i < buf.length; i++) {
        const diff = buf[i] - buf[i - 1];
        energy += diff * diff;
      }
      return energy / buf.length;
    }

    const localHF = highFreqEnergy(local);
    const remoteHF = highFreqEnergy(remote);
    // Remote should have less high-frequency energy
    expect(remoteHF).toBeLessThan(localHF);
  });

  it("remote still produces non-silent audio", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(minimal, verb, { ...DET, scope: "remote" });
      assertNonSilent(buf);
    }
  });

  it("whoosh verbs also get LP when remote", () => {
    const local = generateVerb(minimal, "move", { ...DET, scope: "local" });
    const remote = generateVerb(minimal, "move", { ...DET, scope: "remote" });

    function highFreqEnergy(buf: Float64Array): number {
      let energy = 0;
      for (let i = 1; i < buf.length; i++) {
        const diff = buf[i] - buf[i - 1];
        energy += diff * diff;
      }
      return energy / buf.length;
    }

    expect(highFreqEnergy(remote)).toBeLessThan(highFreqEnergy(local));
  });
});

describe("modifier interaction law", () => {
  it("density ducking + status:ok compose cleanly", () => {
    const buf = generateVerb(minimal, "intake", { ...DET, status: "ok", mixGain: 0.75, mixRelease: 0.85 });
    assertNonSilent(buf);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("status:warn tremolo stays subtle under ducking", () => {
    const buf = generateVerb(minimal, "navigate", { ...DET, status: "warn", mixGain: 0.65 });
    assertNonSilent(buf);
  });

  it("status:err remains musical after ducking + softening", () => {
    const buf = generateVerb(minimal, "execute", { ...DET, status: "err", scope: "remote", mixGain: 0.70, mixRelease: 0.80 });
    assertNonSilent(buf);
  });

  it("intensity and escalation still feel distinct after mix modifiers", () => {
    const intense = generateVerb(minimal, "commit", { ...DET, intensity: 5, mixGain: 0.80 });
    const escalated = generateVerb(minimal, "execute", { ...DET, status: "err", escalation: 5, mixGain: 0.80 });
    // Both should be non-silent and different
    assertNonSilent(intense);
    assertNonSilent(escalated);
    // Different verbs + different modifiers should produce different content
    if (intense.length === escalated.length) {
      let diffCount = 0;
      for (let i = 0; i < intense.length; i++) {
        if (Math.abs(intense[i] - escalated[i]) > 0.001) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    }
  });
});

describe("profile differences", () => {
  it("minimal and retro produce different audio for same verb", () => {
    for (const verb of ALL_VERBS) {
      const m = generateVerb(minimal, verb, DET);
      const r = generateVerb(retro, verb, DET);
      if (m.length === r.length) {
        let diffCount = 0;
        for (let i = 0; i < m.length; i++) {
          if (Math.abs(m[i] - r[i]) > 0.001) diffCount++;
        }
        expect(diffCount).toBeGreaterThan(0);
      }
    }
  });
});
