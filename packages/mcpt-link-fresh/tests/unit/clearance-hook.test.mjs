import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readClearanceSummaries } from "../../src/analyzers/clearance-hook.mjs";

function makeTempDir(label) {
  const dir = join(tmpdir(), `clearance-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("readClearanceSummaries", () => {
  let artifactDir;

  beforeEach(() => {
    artifactDir = makeTempDir("artifacts");
  });

  afterEach(() => {
    try { rmSync(artifactDir, { recursive: true, force: true }); } catch {}
  });

  it("reads valid summaries for target slugs", () => {
    const slugDir = join(artifactDir, "zip-meta-map");
    mkdirSync(slugDir, { recursive: true });
    writeFileSync(join(slugDir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "GREEN",
      score: 85,
      date: "2026-02-16",
    }));

    const result = readClearanceSummaries(artifactDir, ["zip-meta-map"]);

    assert.ok(result);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].slug, "zip-meta-map");
    assert.equal(result.entries[0].tier, "GREEN");
    assert.equal(result.entries[0].score, 85);
    assert.equal(result.entries[0].date, "2026-02-16");
    assert.equal(result.blocked, false);
    assert.equal(result.blockedReason, null);
  });

  it("reads multiple slugs", () => {
    for (const [slug, tier, score] of [["alpha", "GREEN", 90], ["beta", "YELLOW", 45]]) {
      const dir = join(artifactDir, slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "summary.json"), JSON.stringify({
        schemaVersion: "1.0.0",
        tier,
        score,
        date: "2026-02-16",
      }));
    }

    const result = readClearanceSummaries(artifactDir, ["alpha", "beta"]);

    assert.ok(result);
    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].slug, "alpha");
    assert.equal(result.entries[1].slug, "beta");
  });

  it("skips slugs without summary.json", () => {
    const dir = join(artifactDir, "exists");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "GREEN",
      score: 80,
    }));

    const result = readClearanceSummaries(artifactDir, ["exists", "missing"]);

    assert.ok(result);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].slug, "exists");
  });

  it("skips summaries with wrong schema version", () => {
    const dir = join(artifactDir, "old");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "0.5.0",
      tier: "GREEN",
      score: 80,
    }));

    const result = readClearanceSummaries(artifactDir, ["old"]);

    assert.equal(result, null);
  });

  it("skips summaries without tier", () => {
    const dir = join(artifactDir, "no-tier");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      score: 80,
    }));

    const result = readClearanceSummaries(artifactDir, ["no-tier"]);

    assert.equal(result, null);
  });

  it("skips invalid JSON files", () => {
    const dir = join(artifactDir, "broken");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), "not json {{{");

    const result = readClearanceSummaries(artifactDir, ["broken"]);

    assert.equal(result, null);
  });

  it("returns null when path does not exist", () => {
    const result = readClearanceSummaries("/nonexistent/path", ["foo"]);

    assert.equal(result, null);
  });

  it("returns null when path is empty string", () => {
    const result = readClearanceSummaries("", ["foo"]);

    assert.equal(result, null);
  });

  it("returns null when no slugs match", () => {
    const result = readClearanceSummaries(artifactDir, ["no-match"]);

    assert.equal(result, null);
  });

  it("blocks in strict mode when RED tier found", () => {
    const dir = join(artifactDir, "risky");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "RED",
      score: 15,
      date: "2026-02-16",
    }));

    const result = readClearanceSummaries(artifactDir, ["risky"], { strict: true });

    assert.ok(result);
    assert.equal(result.blocked, true);
    assert.ok(result.blockedReason.includes("risky"));
    assert.ok(result.blockedReason.includes("RED"));
  });

  it("does not block in strict mode when no RED tier", () => {
    const dir = join(artifactDir, "safe");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "YELLOW",
      score: 40,
    }));

    const result = readClearanceSummaries(artifactDir, ["safe"], { strict: true });

    assert.ok(result);
    assert.equal(result.blocked, false);
    assert.equal(result.blockedReason, null);
  });

  it("does not block in non-strict mode even with RED tier", () => {
    const dir = join(artifactDir, "danger");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "RED",
      score: 10,
    }));

    const result = readClearanceSummaries(artifactDir, ["danger"], { strict: false });

    assert.ok(result);
    assert.equal(result.blocked, false);
  });

  it("handles null score and date gracefully", () => {
    const dir = join(artifactDir, "minimal");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify({
      schemaVersion: "1.0.0",
      tier: "GREEN",
    }));

    const result = readClearanceSummaries(artifactDir, ["minimal"]);

    assert.ok(result);
    assert.equal(result.entries[0].score, null);
    assert.equal(result.entries[0].date, null);
  });
});
