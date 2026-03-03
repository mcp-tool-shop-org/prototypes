/**
 * Unit tests for NameOps build-pr-body.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildPrBody } from "../src/build-pr-body.mjs";

const TMP_DIR = join(import.meta.dirname, ".tmp-pr-body-test");

function setup() {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(join(TMP_DIR, "published", "cool-tool"), { recursive: true });
  mkdirSync(join(TMP_DIR, "published", "taken-name"), { recursive: true });
  mkdirSync(join(TMP_DIR, "batch", "batch"), { recursive: true });
}

function cleanup() {
  rmSync(TMP_DIR, { recursive: true, force: true });
}

describe("buildPrBody", () => {
  before(setup);
  after(cleanup);

  it("generates markdown with summary section", () => {
    // Write minimal fixture data
    const runsIndex = [
      { schemaVersion: "1.0.0", slug: "cool-tool", name: "cool-tool", tier: "green", score: 92, date: "2026-02-16T10:00:00Z" },
      { schemaVersion: "1.0.0", slug: "taken-name", name: "taken-name", tier: "red", score: 25, date: "2026-02-16T10:00:00Z" },
    ];
    writeFileSync(join(TMP_DIR, "published", "runs.json"), JSON.stringify(runsIndex), "utf8");

    const metadata = {
      date: "2026-02-16T10:00:00Z",
      durationHuman: "45s",
      publishDir: join(TMP_DIR, "published"),
    };
    writeFileSync(join(TMP_DIR, "metadata.json"), JSON.stringify(metadata), "utf8");

    // Write batch results
    writeFileSync(join(TMP_DIR, "batch", "batch", "results.json"), "[]", "utf8");

    const body = buildPrBody(TMP_DIR);

    assert.ok(body.includes("## Clearance Run:"), "should have title");
    assert.ok(body.includes("### Summary"), "should have summary section");
    assert.ok(body.includes("GREEN:** 1"), "should count 1 green");
    assert.ok(body.includes("RED:** 1"), "should count 1 red");
    assert.ok(body.includes("### Review Checklist"), "should have review checklist");
  });

  it("includes green candidates table", () => {
    const runsIndex = [
      { schemaVersion: "1.0.0", slug: "cool-tool", name: "cool-tool", tier: "green", score: 92, date: "2026-02-16T10:00:00Z" },
    ];
    writeFileSync(join(TMP_DIR, "published", "runs.json"), JSON.stringify(runsIndex), "utf8");

    const body = buildPrBody(TMP_DIR);

    assert.ok(body.includes("### Top GREEN Candidates"), "should have green table");
    assert.ok(body.includes("cool-tool"), "should list cool-tool");
    assert.ok(body.includes("92/100"), "should show score");
  });

  it("includes risky names table", () => {
    const runsIndex = [
      { schemaVersion: "1.0.0", slug: "taken-name", name: "taken-name", tier: "red", score: 25, date: "2026-02-16T10:00:00Z" },
      { schemaVersion: "1.0.0", slug: "maybe-name", name: "maybe-name", tier: "yellow", score: 55, date: "2026-02-16T10:00:00Z" },
    ];
    writeFileSync(join(TMP_DIR, "published", "runs.json"), JSON.stringify(runsIndex), "utf8");

    const body = buildPrBody(TMP_DIR);

    assert.ok(body.includes("### Risky Names"), "should have risky names section");
    assert.ok(body.includes("taken-name"), "should list taken-name");
    assert.ok(body.includes("RED"), "should show RED tier");
    assert.ok(body.includes("YELLOW"), "should show YELLOW tier");
  });

  it("includes collision cards when present", () => {
    const runsIndex = [
      { schemaVersion: "1.0.0", slug: "taken-name", name: "taken-name", tier: "red", score: 25, date: "2026-02-16T10:00:00Z" },
    ];
    writeFileSync(join(TMP_DIR, "published", "runs.json"), JSON.stringify(runsIndex), "utf8");

    // Write summary.json with collision cards
    const summary = {
      schemaVersion: "1.0.0",
      formatVersion: "1.0.0",
      tier: "red",
      collisionCards: [
        { kind: "variant_taken", title: "\"taken-name\" is taken on npm", whyItMatters: "Package exists.", severity: "critical", evidence: [] },
      ],
    };
    writeFileSync(join(TMP_DIR, "published", "taken-name", "summary.json"), JSON.stringify(summary), "utf8");

    const body = buildPrBody(TMP_DIR);

    assert.ok(body.includes("### Collision Cards"), "should have collision cards section");
    assert.ok(body.includes("taken on npm"), "should include card title");
    assert.ok(body.includes("Package exists."), "should include whyItMatters");
  });

  it("handles empty input gracefully", () => {
    writeFileSync(join(TMP_DIR, "published", "runs.json"), "[]", "utf8");

    const body = buildPrBody(TMP_DIR);

    assert.ok(body.includes("## Clearance Run:"), "should still have title");
    assert.ok(body.includes("Names checked:** 0"), "should show 0 names");
    assert.ok(!body.includes("### Top GREEN"), "should not have green section");
    assert.ok(!body.includes("### Risky Names"), "should not have risky section");
  });

  it("includes runtime in summary", () => {
    const metadata = { date: "2026-02-16T10:00:00Z", durationHuman: "120s", publishDir: join(TMP_DIR, "published") };
    writeFileSync(join(TMP_DIR, "metadata.json"), JSON.stringify(metadata), "utf8");
    writeFileSync(join(TMP_DIR, "published", "runs.json"), "[]", "utf8");

    const body = buildPrBody(TMP_DIR);
    assert.ok(body.includes("120s"), "should include runtime");
  });
});
