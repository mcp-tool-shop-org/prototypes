import { describe, it, expect, vi, beforeEach } from "vitest";
import { volumeToGain, resolveProfileName, isValidTimeFormat, setQuietHours, type SfxConfig } from "../src/config.js";
import { SfxError } from "../src/errors.js";

function makeConfig(overrides: Partial<SfxConfig> = {}): SfxConfig {
  return {
    profile: "minimal",
    volume: 80,
    muted: false,
    quietHours: null,
    disabledVerbs: [],
    repoProfiles: {},
    ...overrides,
  };
}

describe("volumeToGain", () => {
  it("0 → 0.0", () => {
    expect(volumeToGain(0)).toBe(0);
  });

  it("100 → 1.0", () => {
    expect(volumeToGain(100)).toBe(1);
  });

  it("50 → 0.5", () => {
    expect(volumeToGain(50)).toBe(0.5);
  });

  it("clamps negative values to 0", () => {
    expect(volumeToGain(-10)).toBe(0);
  });

  it("clamps values above 100 to 1", () => {
    expect(volumeToGain(200)).toBe(1);
  });
});

describe("resolveProfileName", () => {
  it("returns global profile when no cwd", () => {
    const cfg = makeConfig({ profile: "retro" });
    expect(resolveProfileName(cfg)).toBe("retro");
  });

  it("returns global profile when cwd has no override", () => {
    const cfg = makeConfig({ profile: "minimal" });
    expect(resolveProfileName(cfg, "/some/path")).toBe("minimal");
  });

  it("returns repo override when cwd matches", () => {
    const cfg = makeConfig({
      profile: "minimal",
      repoProfiles: { "/my/project": "retro" },
    });
    expect(resolveProfileName(cfg, "/my/project")).toBe("retro");
  });

  it("falls back to global when cwd doesn't match any override", () => {
    const cfg = makeConfig({
      profile: "minimal",
      repoProfiles: { "/other/project": "retro" },
    });
    expect(resolveProfileName(cfg, "/my/project")).toBe("minimal");
  });
});

describe("isValidTimeFormat", () => {
  it("accepts valid 24h times", () => {
    expect(isValidTimeFormat("00:00")).toBe(true);
    expect(isValidTimeFormat("23:59")).toBe(true);
    expect(isValidTimeFormat("9:30")).toBe(true);
    expect(isValidTimeFormat("12:00")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidTimeFormat("")).toBe(false);
    expect(isValidTimeFormat("abc")).toBe(false);
    expect(isValidTimeFormat("12")).toBe(false);
    expect(isValidTimeFormat("12:")).toBe(false);
    expect(isValidTimeFormat(":30")).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(isValidTimeFormat("24:00")).toBe(false);
    expect(isValidTimeFormat("12:60")).toBe(false);
    expect(isValidTimeFormat("25:00")).toBe(false);
    expect(isValidTimeFormat("00:99")).toBe(false);
  });
});

describe("setQuietHours validation", () => {
  it("throws SfxError for invalid start time", () => {
    expect(() => setQuietHours("invalid", "07:00")).toThrow(SfxError);
    try {
      setQuietHours("25:00", "07:00");
    } catch (e) {
      expect(e).toBeInstanceOf(SfxError);
      expect((e as SfxError).code).toBe("CONFIG_INVALID_VALUE");
      expect((e as SfxError).hint).toContain("HH:MM");
    }
  });

  it("throws SfxError for invalid end time", () => {
    expect(() => setQuietHours("22:00", "not-a-time")).toThrow(SfxError);
  });
});

describe("isQuietTime", () => {
  // We import the function but it depends on Date.now() internally.
  // We test the logic via the guard tests since isQuietTime uses `new Date()`.
  // Here we just verify the null case.
  it("returns false when quietHours is null", async () => {
    const { isQuietTime } = await import("../src/config.js");
    const cfg = makeConfig({ quietHours: null });
    expect(isQuietTime(cfg)).toBe(false);
  });
});
