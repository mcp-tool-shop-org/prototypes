import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type SfxConfig } from "../src/config.js";

// Mock the filesystem so guard tests don't write to real temp files
vi.mock("node:fs", async () => {
  let ledgerData = '{"entries":[]}';
  return {
    readFileSync: vi.fn(() => ledgerData),
    writeFileSync: vi.fn((path: string, data: string) => {
      if (String(path).includes("ledger")) {
        ledgerData = data;
      }
    }),
    existsSync: vi.fn(() => true),
  };
});

// Mock isQuietTime to be controllable
vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return {
    ...actual,
    isQuietTime: vi.fn(() => false),
  };
});

import { guardPlay, resetLedger } from "../src/guard.js";
import { isQuietTime } from "../src/config.js";

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

beforeEach(() => {
  resetLedger();
  vi.mocked(isQuietTime).mockReturnValue(false);
});

describe("guardPlay — basic checks", () => {
  it("allows a sound with default config", () => {
    const result = guardPlay("intake", makeConfig());
    expect(result.allowed).toBe(true);
  });

  it("blocks when muted", () => {
    const result = guardPlay("intake", makeConfig({ muted: true }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("muted");
  });

  it("blocks when volume is 0", () => {
    const result = guardPlay("intake", makeConfig({ volume: 0 }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("volume is 0");
  });

  it("blocks disabled verb", () => {
    const result = guardPlay("navigate", makeConfig({ disabledVerbs: ["navigate"] }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("disabled");
  });

  it("allows non-disabled verb", () => {
    const result = guardPlay("intake", makeConfig({ disabledVerbs: ["navigate"] }));
    expect(result.allowed).toBe(true);
  });

  it("blocks during quiet hours", () => {
    vi.mocked(isQuietTime).mockReturnValue(true);
    const result = guardPlay("intake", makeConfig());
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("quiet hours");
  });
});

describe("guardPlay — debounce", () => {
  it("allows first play", () => {
    const result = guardPlay("intake", makeConfig());
    expect(result.allowed).toBe(true);
  });

  it("blocks same verb within debounce window", () => {
    // First play
    guardPlay("intake", makeConfig());
    // Immediate second play — should debounce
    const result = guardPlay("intake", makeConfig());
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("debounced");
  });

  it("allows different verb immediately", () => {
    guardPlay("intake", makeConfig());
    const result = guardPlay("navigate", makeConfig());
    expect(result.allowed).toBe(true);
  });
});

describe("guardPlay — rate limiting", () => {
  it("allows up to 8 sounds with unique verb names", () => {
    const cfg = makeConfig();
    // Use 8 unique names to avoid debounce (guard doesn't validate verb names)
    for (let i = 0; i < 8; i++) {
      const result = guardPlay(`verb-${i}`, cfg);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 9th sound within the window", () => {
    const cfg = makeConfig();
    // Fill up with 8 unique verbs
    for (let i = 0; i < 8; i++) {
      guardPlay(`verb-${i}`, cfg);
    }

    // 9th should be blocked
    const result = guardPlay("verb-extra", cfg);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("rate limited");
  });
});

describe("resetLedger", () => {
  it("clears the ledger so plays are allowed again", () => {
    const cfg = makeConfig();
    // Fill up the rate limit
    const verbs = ["intake", "transform", "commit", "navigate", "execute", "move", "sync", "intake"];
    for (let i = 0; i < 8; i++) {
      guardPlay(verbs[i], cfg);
    }

    // Verify blocked
    expect(guardPlay("commit", cfg).allowed).toBe(false);

    // Reset
    resetLedger();

    // Should be allowed again
    expect(guardPlay("commit", cfg).allowed).toBe(true);
  });
});
