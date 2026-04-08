import { describe, it, expect } from "vitest";
import {
  classifyDensity,
  countRecentRepeats,
  getDuckingPriority,
  getMixAdvice,
  type MixAdvice,
} from "../src/mix.js";
import type { LedgerEntry } from "../src/guard.js";

// Helper: create ledger entries at specific offsets from `now`
function entries(
  specs: Array<{ verb: string; agoMs: number }>,
  now: number = 10000
): LedgerEntry[] {
  return specs.map((s) => ({ verb: s.verb, timestamp: now - s.agoMs }));
}

const NOW = 10000;

describe("classifyDensity", () => {
  it("empty entries = sparse", () => {
    expect(classifyDensity([], NOW)).toBe("sparse");
  });

  it("1 event in window = sparse", () => {
    expect(classifyDensity(entries([{ verb: "intake", agoMs: 500 }]), NOW)).toBe("sparse");
  });

  it("2 events in window = sparse", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "navigate", agoMs: 1000 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("sparse");
  });

  it("3 events in window = medium", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "navigate", agoMs: 1000 },
      { verb: "execute", agoMs: 1500 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("medium");
  });

  it("5 events in window = medium", () => {
    const e = entries([
      { verb: "intake", agoMs: 200 },
      { verb: "intake", agoMs: 600 },
      { verb: "intake", agoMs: 1000 },
      { verb: "intake", agoMs: 1400 },
      { verb: "intake", agoMs: 1800 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("medium");
  });

  it("6 events in window = bursty", () => {
    const e = entries([
      { verb: "navigate", agoMs: 100 },
      { verb: "navigate", agoMs: 300 },
      { verb: "navigate", agoMs: 600 },
      { verb: "navigate", agoMs: 900 },
      { verb: "navigate", agoMs: 1200 },
      { verb: "navigate", agoMs: 1500 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("bursty");
  });

  it("old entries outside 3s window are ignored", () => {
    const e = entries([
      { verb: "intake", agoMs: 4000 },
      { verb: "intake", agoMs: 5000 },
      { verb: "intake", agoMs: 6000 },
      { verb: "intake", agoMs: 7000 },
      { verb: "intake", agoMs: 500 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("sparse");
  });

  it("mix of old and new entries", () => {
    const e = entries([
      { verb: "intake", agoMs: 5000 },
      { verb: "intake", agoMs: 200 },
      { verb: "navigate", agoMs: 800 },
      { verb: "execute", agoMs: 1500 },
    ], NOW);
    expect(classifyDensity(e, NOW)).toBe("medium");
  });
});

describe("countRecentRepeats", () => {
  it("no entries = 0 repeats", () => {
    expect(countRecentRepeats([], "intake", NOW)).toBe(0);
  });

  it("one occurrence of same verb = 1", () => {
    const e = entries([{ verb: "intake", agoMs: 500 }], NOW);
    expect(countRecentRepeats(e, "intake", NOW)).toBe(1);
  });

  it("multiple occurrences counted", () => {
    const e = entries([
      { verb: "intake", agoMs: 200 },
      { verb: "intake", agoMs: 600 },
      { verb: "intake", agoMs: 1000 },
    ], NOW);
    expect(countRecentRepeats(e, "intake", NOW)).toBe(3);
  });

  it("different verbs are excluded", () => {
    const e = entries([
      { verb: "intake", agoMs: 200 },
      { verb: "navigate", agoMs: 400 },
      { verb: "execute", agoMs: 600 },
      { verb: "intake", agoMs: 800 },
    ], NOW);
    expect(countRecentRepeats(e, "intake", NOW)).toBe(2);
  });

  it("entries outside window are excluded", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "intake", agoMs: 4000 },
    ], NOW);
    expect(countRecentRepeats(e, "intake", NOW)).toBe(1);
  });

  it("custom window size works", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "intake", agoMs: 1500 },
      { verb: "intake", agoMs: 2500 },
    ], NOW);
    expect(countRecentRepeats(e, "intake", NOW, 2000)).toBe(2);
  });
});

describe("getDuckingPriority", () => {
  it("commit = high", () => {
    expect(getDuckingPriority("commit")).toBe("high");
  });

  it("sync = high", () => {
    expect(getDuckingPriority("sync")).toBe("high");
  });

  it("navigate = low", () => {
    expect(getDuckingPriority("navigate")).toBe("low");
  });

  it("intake = normal", () => {
    expect(getDuckingPriority("intake")).toBe("normal");
  });

  it("transform = normal", () => {
    expect(getDuckingPriority("transform")).toBe("normal");
  });

  it("execute = normal", () => {
    expect(getDuckingPriority("execute")).toBe("normal");
  });

  it("move = normal", () => {
    expect(getDuckingPriority("move")).toBe("normal");
  });
});

describe("getMixAdvice", () => {
  it("sparse stream, no repeats: all multipliers at 1.0", () => {
    const advice = getMixAdvice("intake", [], NOW);
    expect(advice.gainMultiplier).toBe(1.0);
    expect(advice.releaseMultiplier).toBe(1.0);
    expect(advice.density).toBe("sparse");
    expect(advice.recentRepeatCount).toBe(0);
    expect(advice.forcedVariantIndex).toBeUndefined();
  });

  it("medium density, normal verb: gain ducked", () => {
    const e = entries([
      { verb: "intake", agoMs: 200 },
      { verb: "navigate", agoMs: 600 },
      { verb: "execute", agoMs: 1000 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.density).toBe("medium");
    expect(advice.gainMultiplier).toBeLessThan(1.0);
    expect(advice.gainMultiplier).toBeGreaterThan(0.8);
    expect(advice.releaseMultiplier).toBeLessThan(1.0);
  });

  it("bursty density, normal verb: stronger ducking", () => {
    const e = entries([
      { verb: "intake", agoMs: 100 },
      { verb: "navigate", agoMs: 300 },
      { verb: "execute", agoMs: 600 },
      { verb: "transform", agoMs: 900 },
      { verb: "commit", agoMs: 1200 },
      { verb: "intake", agoMs: 1500 },
    ], NOW);
    const advice = getMixAdvice("transform", e, NOW);
    expect(advice.density).toBe("bursty");
    expect(advice.gainMultiplier).toBeLessThan(0.8);
  });

  it("bursty density, high-priority verb (commit): less ducking", () => {
    const e = entries([
      { verb: "navigate", agoMs: 100 },
      { verb: "navigate", agoMs: 300 },
      { verb: "navigate", agoMs: 600 },
      { verb: "navigate", agoMs: 900 },
      { verb: "navigate", agoMs: 1200 },
      { verb: "navigate", agoMs: 1500 },
    ], NOW);
    const normalAdvice = getMixAdvice("intake", e, NOW);
    const highAdvice = getMixAdvice("commit", e, NOW);
    expect(highAdvice.gainMultiplier).toBeGreaterThan(normalAdvice.gainMultiplier);
  });

  it("bursty density, low-priority verb (navigate): most ducking", () => {
    const e = entries([
      { verb: "navigate", agoMs: 100 },
      { verb: "navigate", agoMs: 300 },
      { verb: "navigate", agoMs: 600 },
      { verb: "navigate", agoMs: 900 },
      { verb: "navigate", agoMs: 1200 },
      { verb: "navigate", agoMs: 1500 },
    ], NOW);
    const normalAdvice = getMixAdvice("intake", e, NOW);
    const lowAdvice = getMixAdvice("navigate", e, NOW);
    expect(lowAdvice.gainMultiplier).toBeLessThan(normalAdvice.gainMultiplier);
  });

  it("2nd repeat: forces variant rotation", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "intake", agoMs: 1000 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.forcedVariantIndex).toBeDefined();
    expect(advice.recentRepeatCount).toBe(2);
  });

  it("1st occurrence: no forced variant", () => {
    const e = entries([
      { verb: "intake", agoMs: 500 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.forcedVariantIndex).toBeUndefined();
    expect(advice.recentRepeatCount).toBe(1);
  });

  it("3rd repeat: stronger gain + release reduction", () => {
    const e = entries([
      { verb: "intake", agoMs: 200 },
      { verb: "intake", agoMs: 600 },
      { verb: "intake", agoMs: 1000 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.gainMultiplier).toBeLessThan(0.95);
    expect(advice.releaseMultiplier).toBeLessThan(0.90);
    expect(advice.recentRepeatCount).toBe(3);
  });

  it("4+ repeats: max repetition reduction", () => {
    const e = entries([
      { verb: "intake", agoMs: 100 },
      { verb: "intake", agoMs: 400 },
      { verb: "intake", agoMs: 700 },
      { verb: "intake", agoMs: 1000 },
      { verb: "intake", agoMs: 1300 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.gainMultiplier).toBeLessThan(0.80);
    expect(advice.recentRepeatCount).toBe(5);
  });

  it("density + repetition compose multiplicatively", () => {
    // Sparse + 3 repeats
    const sparseRepeats = entries([
      { verb: "intake", agoMs: 500 },
      { verb: "intake", agoMs: 1500 },
      { verb: "intake", agoMs: 2500 },
    ], NOW);
    const sparseAdvice = getMixAdvice("intake", sparseRepeats, NOW);

    // Bursty + 3 repeats (same verb + other verbs to make bursty)
    const burstyRepeats = entries([
      { verb: "intake", agoMs: 100 },
      { verb: "intake", agoMs: 400 },
      { verb: "intake", agoMs: 700 },
      { verb: "navigate", agoMs: 200 },
      { verb: "execute", agoMs: 500 },
      { verb: "transform", agoMs: 800 },
    ], NOW);
    const burstyAdvice = getMixAdvice("intake", burstyRepeats, NOW);

    // Bursty + repeats should be more ducked than sparse + repeats
    expect(burstyAdvice.gainMultiplier).toBeLessThan(sparseAdvice.gainMultiplier);
  });

  it("gain never falls below floor (0.40)", () => {
    // Extreme: bursty + many repeats + low priority
    const e = entries([
      { verb: "navigate", agoMs: 50 },
      { verb: "navigate", agoMs: 150 },
      { verb: "navigate", agoMs: 300 },
      { verb: "navigate", agoMs: 500 },
      { verb: "navigate", agoMs: 700 },
      { verb: "navigate", agoMs: 900 },
      { verb: "navigate", agoMs: 1100 },
    ], NOW);
    const advice = getMixAdvice("navigate", e, NOW);
    expect(advice.gainMultiplier).toBeGreaterThanOrEqual(0.40);
  });

  it("release multiplier has a floor of 0.50", () => {
    const e = entries([
      { verb: "navigate", agoMs: 50 },
      { verb: "navigate", agoMs: 150 },
      { verb: "navigate", agoMs: 300 },
      { verb: "navigate", agoMs: 500 },
      { verb: "navigate", agoMs: 700 },
      { verb: "navigate", agoMs: 900 },
      { verb: "navigate", agoMs: 1100 },
    ], NOW);
    const advice = getMixAdvice("navigate", e, NOW);
    expect(advice.releaseMultiplier).toBeGreaterThanOrEqual(0.50);
  });
});

describe("scenario tests", () => {
  it("grep spam: 8 navigate events, strong ducking + rotation", () => {
    const e = entries(
      Array.from({ length: 8 }, (_, i) => ({ verb: "navigate", agoMs: (i + 1) * 300 })),
      NOW
    );
    const advice = getMixAdvice("navigate", e, NOW);
    expect(advice.density).toBe("bursty");
    expect(advice.recentRepeatCount).toBeGreaterThanOrEqual(8);
    expect(advice.gainMultiplier).toBeLessThan(0.65);
    expect(advice.forcedVariantIndex).toBeDefined();
  });

  it("search-then-commit: busy navigates then a commit gets protected", () => {
    const e = entries([
      { verb: "navigate", agoMs: 200 },
      { verb: "navigate", agoMs: 400 },
      { verb: "navigate", agoMs: 600 },
      { verb: "navigate", agoMs: 800 },
      { verb: "navigate", agoMs: 1000 },
      { verb: "navigate", agoMs: 1200 },
    ], NOW);
    const navAdvice = getMixAdvice("navigate", e, NOW);
    const commitAdvice = getMixAdvice("commit", e, NOW);
    // Commit should be ducked less than navigate
    expect(commitAdvice.gainMultiplier).toBeGreaterThan(navAdvice.gainMultiplier);
    // Commit should have no repetition (0 repeats)
    expect(commitAdvice.recentRepeatCount).toBe(0);
  });

  it("repeated reads: 4 intake events get variant rotation", () => {
    const e = entries([
      { verb: "intake", agoMs: 300 },
      { verb: "intake", agoMs: 700 },
      { verb: "intake", agoMs: 1100 },
      { verb: "intake", agoMs: 1500 },
    ], NOW);
    const advice = getMixAdvice("intake", e, NOW);
    expect(advice.recentRepeatCount).toBe(4);
    expect(advice.forcedVariantIndex).toBeDefined();
  });

  it("rapid writes: 3 commits in 2s get mild ducking (high priority)", () => {
    const e = entries([
      { verb: "commit", agoMs: 300 },
      { verb: "commit", agoMs: 900 },
      { verb: "commit", agoMs: 1500 },
    ], NOW);
    const advice = getMixAdvice("commit", e, NOW);
    // High priority + medium density (3 events) = mild ducking
    expect(advice.gainMultiplier).toBeGreaterThan(0.80);
  });

  it("isolated event after quiet period: no ducking", () => {
    const e = entries([
      { verb: "intake", agoMs: 5000 },
      { verb: "navigate", agoMs: 8000 },
    ], NOW);
    const advice = getMixAdvice("execute", e, NOW);
    expect(advice.gainMultiplier).toBe(1.0);
    expect(advice.releaseMultiplier).toBe(1.0);
    expect(advice.density).toBe("sparse");
  });
});
