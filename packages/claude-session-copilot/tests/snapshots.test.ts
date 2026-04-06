import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../src/store.js";
import { SnapshotManager } from "../src/snapshots.js";

function setup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-snap-"));
  const store = new Store(path.join(tmpDir, "store.json"));
  store.ensureSession();
  const snapshots = new SnapshotManager(store);
  return { tmpDir, store, snapshots };
}

function teardown(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("SnapshotManager", { concurrency: 1 }, () => {
  it("creates a snapshot with auto-generated id/timestamp", () => {
    const { tmpDir, store, snapshots } = setup();
    try {
      const snap = snapshots.create({
        sessionId: store.get().currentSessionId!,
        workingOn: "Adding tests",
        done: ["Store module", "Decision log"],
        nextSteps: ["Timeline tests", "Pattern tests"],
        blockers: [],
        keyFiles: ["src/store.ts"],
        keyDecisionIds: [],
        notes: "Good progress",
      });

      assert.ok(snap.id);
      assert.ok(snap.timestamp);
      assert.equal(snap.workingOn, "Adding tests");
      assert.equal(store.get().snapshots.length, 1);
    } finally { teardown(tmpDir); }
  });

  it("latest() returns the most recent snapshot", () => {
    const { tmpDir, snapshots } = setup();
    try {
      snapshots.create({
        sessionId: "s1",
        workingOn: "First",
        done: [], nextSteps: [], blockers: [], keyFiles: [], keyDecisionIds: [], notes: "",
      });
      snapshots.create({
        sessionId: "s1",
        workingOn: "Second",
        done: [], nextSteps: [], blockers: [], keyFiles: [], keyDecisionIds: [], notes: "",
      });

      const latest = snapshots.latest();
      assert.ok(latest);
      assert.equal(latest.workingOn, "Second");
    } finally { teardown(tmpDir); }
  });

  it("latest() returns null when no snapshots exist", () => {
    const { tmpDir, snapshots } = setup();
    try {
      assert.equal(snapshots.latest(), null);
    } finally { teardown(tmpDir); }
  });

  it("forSession() filters by session ID", () => {
    const { tmpDir, snapshots } = setup();
    try {
      snapshots.create({
        sessionId: "snap-s1",
        workingOn: "A",
        done: [], nextSteps: [], blockers: [], keyFiles: [], keyDecisionIds: [], notes: "",
      });
      snapshots.create({
        sessionId: "snap-s2",
        workingOn: "B",
        done: [], nextSteps: [], blockers: [], keyFiles: [], keyDecisionIds: [], notes: "",
      });

      assert.equal(snapshots.forSession("snap-s1").length, 1);
      assert.equal(snapshots.forSession("snap-s1")[0]!.workingOn, "A");
    } finally { teardown(tmpDir); }
  });

  it("list() returns last N snapshots in reverse order", () => {
    const { tmpDir, snapshots } = setup();
    try {
      for (let i = 0; i < 5; i++) {
        snapshots.create({
          sessionId: "s1",
          workingOn: `Snap ${i}`,
          done: [], nextSteps: [], blockers: [], keyFiles: [], keyDecisionIds: [], notes: "",
        });
      }

      const listed = snapshots.list(3);
      assert.equal(listed.length, 3);
      assert.equal(listed[0]!.workingOn, "Snap 4");
    } finally { teardown(tmpDir); }
  });
});
