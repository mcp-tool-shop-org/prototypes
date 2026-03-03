/**
 * Unit tests for NameOps run.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { loadProfile, profileToFlags } from "../src/run.mjs";

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");

describe("loadProfile", () => {
  it("loads a valid profile", () => {
    const profile = loadProfile(resolve("data/profile.json"));
    assert.equal(profile.channels, "all");
    assert.equal(profile.org, "mcp-tool-shop-org");
    assert.equal(profile.risk, "conservative");
    assert.equal(typeof profile.concurrency, "number");
    assert.equal(typeof profile.maxAgeHours, "number");
  });

  it("has all expected fields", () => {
    const profile = loadProfile(resolve("data/profile.json"));
    const expected = [
      "version", "channels", "org", "dockerNamespace", "hfOwner",
      "risk", "radar", "suggest", "concurrency", "maxAgeHours",
      "variantBudget", "fuzzyQueryMode", "cacheDir", "maxRuntimeMinutes",
    ];
    for (const field of expected) {
      assert.ok(field in profile, `profile missing field: ${field}`);
    }
  });
});

describe("profileToFlags", () => {
  it("maps all profile fields to CLI flags", () => {
    const profile = {
      channels: "all",
      org: "mcp-tool-shop-org",
      risk: "conservative",
      concurrency: 3,
      maxAgeHours: 168,
      dockerNamespace: "mcptoolshop",
      hfOwner: "mcptoolshop",
      variantBudget: 12,
      fuzzyQueryMode: "registries",
      cacheDir: ".coe-cache",
      radar: true,
      suggest: false,
    };

    const flags = profileToFlags(profile);

    assert.ok(flags.includes("--channels"), "should include --channels");
    assert.ok(flags.includes("all"), "channels value should be all");
    assert.ok(flags.includes("--org"), "should include --org");
    assert.ok(flags.includes("--risk"), "should include --risk");
    assert.ok(flags.includes("--concurrency"), "should include --concurrency");
    assert.ok(flags.includes("--max-age-hours"), "should include --max-age-hours");
    assert.ok(flags.includes("--dockerNamespace"), "should include --dockerNamespace");
    assert.ok(flags.includes("--hfOwner"), "should include --hfOwner");
    assert.ok(flags.includes("--variantBudget"), "should include --variantBudget");
    assert.ok(flags.includes("--fuzzyQueryMode"), "should include --fuzzyQueryMode");
    assert.ok(flags.includes("--cache-dir"), "should include --cache-dir");
    assert.ok(flags.includes("--radar"), "should include --radar");
    assert.ok(!flags.includes("--suggest"), "should NOT include --suggest when false");
  });

  it("omits optional flags when not set", () => {
    const profile = {
      channels: "core",
      org: "myorg",
      risk: "balanced",
      concurrency: 4,
      maxAgeHours: 24,
    };

    const flags = profileToFlags(profile);

    assert.ok(!flags.includes("--dockerNamespace"), "should omit dockerNamespace");
    assert.ok(!flags.includes("--hfOwner"), "should omit hfOwner");
    assert.ok(!flags.includes("--radar"), "should omit radar");
    assert.ok(!flags.includes("--suggest"), "should omit suggest");
    assert.ok(!flags.includes("--cache-dir"), "should omit cache-dir");
  });
});

describe("data/names.txt", () => {
  it("exists and has at least one name", () => {
    const content = readFileSync(resolve("data/names.txt"), "utf8");
    const names = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    assert.ok(names.length > 0, "names.txt should have at least one name");
    assert.ok(names.length <= 500, "names.txt should not exceed 500 names");
  });
});

describe("data/profile.json", () => {
  it("is valid JSON with version field", () => {
    const raw = readFileSync(resolve("data/profile.json"), "utf8");
    const profile = JSON.parse(raw);
    assert.equal(profile.version, "1.0.0");
  });
});
