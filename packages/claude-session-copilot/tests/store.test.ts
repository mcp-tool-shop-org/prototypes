import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../src/store.js";

function setup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-store-"));
  const storePath = path.join(tmpDir, "store.json");
  return { tmpDir, storePath };
}

function teardown(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("Store", () => {
  it("initializes with empty data when no file exists", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      const data = store.get();
      assert.equal(data.version, 1);
      assert.deepEqual(data.decisions, []);
      assert.deepEqual(data.timeline, []);
      assert.deepEqual(data.snapshots, []);
      assert.deepEqual(data.patterns, []);
      assert.equal(data.currentSessionId, null);
    } finally { teardown(tmpDir); }
  });

  it("persists data to disk on mutate", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      store.mutate((d) => {
        d.decisions.push({
          id: "test-1",
          sessionId: "s1",
          timestamp: "2026-01-01T00:00:00Z",
          what: "test decision",
          why: "for testing",
          alternativesRejected: [],
          confidence: "high",
          tags: ["test"],
          files: [],
        });
      });

      const raw = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      assert.equal(raw.decisions.length, 1);
      assert.equal(raw.decisions[0].what, "test decision");
    } finally { teardown(tmpDir); }
  });

  it("loads existing data from file", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store1 = new Store(storePath);
      store1.mutate((d) => {
        d.currentSessionId = "session-abc";
      });

      const store2 = new Store(storePath);
      assert.equal(store2.get().currentSessionId, "session-abc");
    } finally { teardown(tmpDir); }
  });

  it("generates unique IDs", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      const id1 = store.newId();
      const id2 = store.newId();
      assert.notEqual(id1, id2);
      assert.equal(id1.length, 8);
    } finally { teardown(tmpDir); }
  });

  it("ensureSession creates a new session if none exists", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      assert.equal(store.get().currentSessionId, null);

      const sid = store.ensureSession();
      assert.ok(sid);
      assert.equal(store.get().currentSessionId, sid);
      assert.ok(store.get().sessions[sid]);
    } finally { teardown(tmpDir); }
  });

  it("ensureSession returns existing session if one exists", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      const sid1 = store.ensureSession();
      const sid2 = store.ensureSession();
      assert.equal(sid1, sid2);
    } finally { teardown(tmpDir); }
  });

  it("returns the file path", () => {
    const { tmpDir, storePath } = setup();
    try {
      const store = new Store(storePath);
      assert.equal(store.getPath(), storePath);
    } finally { teardown(tmpDir); }
  });
});
