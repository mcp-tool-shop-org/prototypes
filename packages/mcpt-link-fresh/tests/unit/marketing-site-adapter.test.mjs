import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadMarketingData,
  loadPreviousPresskit,
  savePresskit,
  loadHistory,
  saveHistory,
} from "../../src/adapters/marketing-site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_BASE = path.join(__dirname, "..", "fixtures", "marketing-site-mock");

describe("loadMarketingData", () => {
  it("loads tool definition for existing slug", () => {
    const data = loadMarketingData(MOCK_BASE, "test-tool");
    assert.ok(data.tool, "tool should be loaded");
    assert.equal(data.tool.id, "tool.test-tool");
    assert.equal(data.tool.positioning.oneLiner, "A test tool for unit testing drift detection");
  });

  it("returns null tool for missing slug", () => {
    const data = loadMarketingData(MOCK_BASE, "nonexistent-tool");
    assert.equal(data.tool, null);
  });

  it("loads audiences referenced by tool", () => {
    const data = loadMarketingData(MOCK_BASE, "test-tool");
    assert.equal(data.audiences.length, 2);
    assert.equal(data.audiences[0].id, "aud.ci-maintainers");
    assert.equal(data.audiences[1].id, "aud.llm-toolchain-devs");
  });

  it("loads targets data", () => {
    const data = loadMarketingData(MOCK_BASE, "test-tool");
    assert.ok(data.targetsData, "targets should be loaded");
    assert.equal(data.targetsData.candidateCount, 5);
    assert.equal(data.targetsData.candidates.length, 5);
  });

  it("returns null targets for slug with no targets", () => {
    const data = loadMarketingData(MOCK_BASE, "nonexistent-tool");
    assert.equal(data.targetsData, null);
  });

  it("lists outreach template files", () => {
    const data = loadMarketingData(MOCK_BASE, "test-tool");
    assert.ok(data.outreachFiles.length >= 2, "should find at least 2 outreach files");
    assert.ok(data.outreachFiles.includes("email-integrator.md"));
    assert.ok(data.outreachFiles.includes("dm-short.md"));
  });

  it("loads links data", () => {
    const data = loadMarketingData(MOCK_BASE, "test-tool");
    assert.ok(Array.isArray(data.linksData), "links should be an array");
    assert.ok(data.linksData.length >= 2);
    assert.equal(data.linksData[0].id, "tt-npm");
  });

  it("handles completely missing marketing site path gracefully", () => {
    const data = loadMarketingData("/nonexistent/path", "test-tool");
    assert.equal(data.tool, null);
    assert.deepEqual(data.audiences, []);
    assert.equal(data.targetsData, null);
    assert.deepEqual(data.outreachFiles, []);
    assert.equal(data.linksData, null);
  });
});

describe("presskit snapshots", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, ".tmp-adapter-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when no snapshot exists", () => {
    const result = loadPreviousPresskit(tmpDir, "test-tool");
    assert.equal(result, null);
  });

  it("round-trips presskit save/load", () => {
    const presskit = { slug: "test-tool", tagline: "A test tool" };
    savePresskit(tmpDir, "test-tool", presskit);
    const loaded = loadPreviousPresskit(tmpDir, "test-tool");
    assert.deepEqual(loaded, presskit);
  });
});

describe("outreach history", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(__dirname, ".tmp-history-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty entries when no history exists", () => {
    const history = loadHistory(tmpDir);
    assert.deepEqual(history, { entries: [] });
  });

  it("saves and loads history entries", () => {
    const items = [
      { id: "q.test.1", slug: "test-tool", triggerCategory: "claim-change", targets: [{ owner: "org", repo: "repo" }] },
    ];
    const history = { entries: [] };
    saveHistory(items, history, tmpDir);

    const loaded = loadHistory(tmpDir);
    assert.equal(loaded.entries.length, 1);
    assert.equal(loaded.entries[0].id, "q.test.1");
    assert.equal(loaded.entries[0].slug, "test-tool");
    assert.deepEqual(loaded.entries[0].targetFullNames, ["org/repo"]);
  });

  it("prunes entries older than retention window", () => {
    const oldDate = new Date(Date.now() - 100 * 86400000).toISOString();
    const history = {
      entries: [
        { id: "q.old.1", slug: "test-tool", triggerCategory: "claim-change", targetFullNames: [], queuedAt: oldDate },
      ],
    };
    saveHistory([], history, tmpDir, 90);

    const loaded = loadHistory(tmpDir);
    assert.equal(loaded.entries.length, 0, "old entry should be pruned");
  });
});
