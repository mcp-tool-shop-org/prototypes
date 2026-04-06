import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../src/store.js";
import { DecisionLog } from "../src/decisions.js";

function setup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-dec-"));
  const store = new Store(path.join(tmpDir, "store.json"));
  store.ensureSession();
  const log = new DecisionLog(store);
  return { tmpDir, store, log };
}

function teardown(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("DecisionLog", () => {
  it("logs a decision and assigns id/timestamp", () => {
    const { tmpDir, store, log } = setup();
    try {
      const decision = log.log({
        sessionId: store.get().currentSessionId!,
        what: "Use vitest for testing",
        why: "Fast and TypeScript native",
        alternativesRejected: ["jest", "mocha"],
        confidence: "high",
        tags: ["testing"],
        files: ["package.json"],
      });

      assert.ok(decision.id);
      assert.ok(decision.timestamp);
      assert.equal(decision.what, "Use vitest for testing");
      assert.equal(store.get().decisions.length, 1);
    } finally { teardown(tmpDir); }
  });

  it("recent() returns decisions in reverse order", () => {
    const { tmpDir, log } = setup();
    try {
      for (let i = 0; i < 5; i++) {
        log.log({
          sessionId: "s1",
          what: `Decision ${i}`,
          why: "reason",
          alternativesRejected: [],
          confidence: "medium",
          tags: [],
          files: [],
        });
      }

      const recent = log.recent(3);
      assert.equal(recent.length, 3);
      assert.equal(recent[0]!.what, "Decision 4");
      assert.equal(recent[2]!.what, "Decision 2");
    } finally { teardown(tmpDir); }
  });

  it("search() finds decisions by keyword in what/why/tags", () => {
    const { tmpDir, log } = setup();
    try {
      log.log({
        sessionId: "s1",
        what: "Use PostgreSQL",
        why: "Better for relational data",
        alternativesRejected: ["MongoDB"],
        confidence: "high",
        tags: ["database"],
        files: [],
      });
      log.log({
        sessionId: "s1",
        what: "Use Redis for caching",
        why: "Fast",
        alternativesRejected: [],
        confidence: "medium",
        tags: ["cache"],
        files: [],
      });

      assert.equal(log.search("postgresql").length, 1);
      assert.equal(log.search("database").length, 1);
      assert.equal(log.search("relational").length, 1);
      assert.equal(log.search("nonexistent").length, 0);
    } finally { teardown(tmpDir); }
  });

  it("bySession() filters by session ID", () => {
    const { tmpDir, log } = setup();
    try {
      log.log({
        sessionId: "sx1",
        what: "Decision A",
        why: "R",
        alternativesRejected: [],
        confidence: "high",
        tags: [],
        files: [],
      });
      log.log({
        sessionId: "sx2",
        what: "Decision B",
        why: "R",
        alternativesRejected: [],
        confidence: "high",
        tags: [],
        files: [],
      });

      assert.equal(log.bySession("sx1").length, 1);
      assert.equal(log.bySession("sx1")[0]!.what, "Decision A");
    } finally { teardown(tmpDir); }
  });

  it("byFile() filters by file path (case insensitive)", () => {
    const { tmpDir, log } = setup();
    try {
      log.log({
        sessionId: "s1",
        what: "Modify store",
        why: "R",
        alternativesRejected: [],
        confidence: "high",
        tags: [],
        files: ["src/store.ts", "src/types.ts"],
      });

      assert.equal(log.byFile("store.ts").length, 1);
      assert.equal(log.byFile("STORE.TS").length, 1);
      assert.equal(log.byFile("unknown.ts").length, 0);
    } finally { teardown(tmpDir); }
  });
});
