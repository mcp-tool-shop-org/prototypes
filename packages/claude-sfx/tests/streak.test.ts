import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the filesystem so streak tests don't write to real temp files
vi.mock("node:fs", async () => {
  let streakData = "";
  return {
    readFileSync: vi.fn(() => streakData),
    writeFileSync: vi.fn((_path: string, data: string) => {
      streakData = data;
    }),
    existsSync: vi.fn(() => streakData !== ""),
    unlinkSync: vi.fn(() => {
      streakData = "";
    }),
  };
});

import {
  readStreak,
  writeStreak,
  recordSuccess,
  recordError,
  getSessionOutcome,
  resetStreak,
  streakToIntensity,
  errorRunToEscalation,
  MAX_INTENSITY,
  MAX_ESCALATION,
} from "../src/streak.js";

beforeEach(() => {
  resetStreak();
});

describe("streakToIntensity", () => {
  it("returns 1 for streak 0", () => {
    expect(streakToIntensity(0)).toBe(1);
  });

  it("returns 2 for streak 1 (first threshold)", () => {
    expect(streakToIntensity(1)).toBe(2);
  });

  it("returns 3 for streak 3", () => {
    expect(streakToIntensity(3)).toBe(3);
  });

  it("returns 4 for streak 6", () => {
    expect(streakToIntensity(6)).toBe(4);
  });

  it("returns 5 for streak 10", () => {
    expect(streakToIntensity(10)).toBe(5);
  });

  it("caps at MAX_INTENSITY for very high streaks", () => {
    expect(streakToIntensity(100)).toBe(MAX_INTENSITY);
  });
});

describe("errorRunToEscalation", () => {
  it("returns 1 for first error", () => {
    expect(errorRunToEscalation(1)).toBe(1);
  });

  it("returns 3 for third consecutive error", () => {
    expect(errorRunToEscalation(3)).toBe(3);
  });

  it("caps at MAX_ESCALATION", () => {
    expect(errorRunToEscalation(20)).toBe(MAX_ESCALATION);
  });

  it("never returns below 1", () => {
    expect(errorRunToEscalation(0)).toBe(1);
  });
});

describe("recordSuccess", () => {
  it("increments streak and returns intensity", () => {
    const r1 = recordSuccess("commit");
    expect(r1.state.streak).toBe(1);
    expect(r1.intensity).toBeGreaterThanOrEqual(1);

    const r2 = recordSuccess("commit");
    expect(r2.state.streak).toBe(2);
  });

  it("resets error run on success", () => {
    recordError();
    recordError();
    const state = recordError().state;
    expect(state.errorRun).toBe(3);

    const r = recordSuccess("commit");
    expect(r.state.errorRun).toBe(0);
  });

  it("tracks session successes", () => {
    recordSuccess("commit");
    recordSuccess("transform");
    recordSuccess("intake");
    const r = recordSuccess("commit");
    expect(r.state.sessionSuccesses).toBe(4);
  });

  it("intensity increases with streak", () => {
    // Build up a streak
    let lastIntensity = 0;
    for (let i = 0; i < 15; i++) {
      const r = recordSuccess(`verb-${i}`);
      expect(r.intensity).toBeGreaterThanOrEqual(lastIntensity);
      lastIntensity = r.intensity;
    }
    expect(lastIntensity).toBe(MAX_INTENSITY);
  });
});

describe("recordError", () => {
  it("increments error run and returns escalation", () => {
    const r1 = recordError();
    expect(r1.state.errorRun).toBe(1);
    expect(r1.escalation).toBe(1);

    const r2 = recordError();
    expect(r2.state.errorRun).toBe(2);
    expect(r2.escalation).toBe(2);
  });

  it("resets streak on error", () => {
    recordSuccess("commit");
    recordSuccess("commit");
    const r = recordError();
    expect(r.state.streak).toBe(0);
  });

  it("tracks session errors", () => {
    recordError();
    recordError();
    const r = recordError();
    expect(r.state.sessionErrors).toBe(3);
  });

  it("escalation caps at MAX_ESCALATION", () => {
    for (let i = 0; i < 10; i++) {
      recordError();
    }
    const r = recordError();
    expect(r.escalation).toBe(MAX_ESCALATION);
  });
});

describe("getSessionOutcome", () => {
  it("returns ratio 1.0 for all successes", () => {
    recordSuccess("commit");
    recordSuccess("transform");
    recordSuccess("intake");
    const outcome = getSessionOutcome();
    expect(outcome.successRatio).toBe(1);
    expect(outcome.totalPlays).toBe(3);
    expect(outcome.successes).toBe(3);
    expect(outcome.errors).toBe(0);
  });

  it("returns ratio 0.0 for all errors", () => {
    recordError();
    recordError();
    const outcome = getSessionOutcome();
    expect(outcome.successRatio).toBe(0);
    expect(outcome.errors).toBe(2);
  });

  it("returns correct ratio for mixed session", () => {
    recordSuccess("commit");
    recordSuccess("transform");
    recordError();
    recordSuccess("intake");
    const outcome = getSessionOutcome();
    expect(outcome.successRatio).toBe(0.75);
    expect(outcome.totalPlays).toBe(4);
  });

  it("returns ratio 1.0 for empty session", () => {
    const outcome = getSessionOutcome();
    expect(outcome.successRatio).toBe(1);
    expect(outcome.totalPlays).toBe(0);
  });
});

describe("resetStreak", () => {
  it("clears all state", () => {
    recordSuccess("commit");
    recordError();
    resetStreak();
    const state = readStreak();
    expect(state.streak).toBe(0);
    expect(state.errorRun).toBe(0);
    expect(state.sessionSuccesses).toBe(0);
    expect(state.sessionErrors).toBe(0);
  });
});

describe("idle timeout", () => {
  it("resets streak after idle period", () => {
    recordSuccess("commit");
    recordSuccess("commit");

    // Manually set lastPlayAt to 31 seconds ago
    const state = readStreak();
    state.lastPlayAt = Date.now() - 31_000;
    writeStreak(state);

    // Next success should reset the streak count
    const r = recordSuccess("commit");
    expect(r.state.streak).toBe(1); // reset then incremented
  });
});
