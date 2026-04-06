import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../src/store.js";
import { Timeline } from "../src/timeline.js";

function setup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-tl-"));
  const store = new Store(path.join(tmpDir, "store.json"));
  store.ensureSession();
  const timeline = new Timeline(store);
  return { tmpDir, store, timeline };
}

function teardown(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("Timeline", () => {
  it("records an event with auto-generated id/timestamp", () => {
    const { tmpDir, store, timeline } = setup();
    try {
      const event = timeline.record({
        sessionId: store.get().currentSessionId!,
        type: "file_write",
        summary: "Created store.ts",
        files: ["src/store.ts"],
      });

      assert.ok(event.id);
      assert.ok(event.timestamp);
      assert.equal(event.type, "file_write");
      assert.equal(store.get().timeline.length, 1);
    } finally { teardown(tmpDir); }
  });

  it("currentSession() returns events for current session in reverse order", () => {
    const { tmpDir, store, timeline } = setup();
    try {
      const sid = store.get().currentSessionId!;
      timeline.record({ sessionId: sid, type: "file_write", summary: "A" });
      timeline.record({ sessionId: sid, type: "file_edit", summary: "B" });
      timeline.record({ sessionId: "other", type: "bash_success", summary: "C" });

      const events = timeline.currentSession();
      assert.equal(events.length, 2);
      assert.equal(events[0]!.summary, "B");
    } finally { teardown(tmpDir); }
  });

  it("forSession() returns events for specific session", () => {
    const { tmpDir, timeline } = setup();
    try {
      timeline.record({ sessionId: "sx1", type: "file_write", summary: "A" });
      timeline.record({ sessionId: "sx2", type: "file_edit", summary: "B" });

      assert.equal(timeline.forSession("sx1").length, 1);
      assert.equal(timeline.forSession("sx1")[0]!.summary, "A");
    } finally { teardown(tmpDir); }
  });

  it("recent() returns last N events in reverse", () => {
    const { tmpDir, timeline } = setup();
    try {
      for (let i = 0; i < 10; i++) {
        timeline.record({ sessionId: "s1", type: "manual", summary: `Event ${i}` });
      }

      const recent = timeline.recent(3);
      assert.equal(recent.length, 3);
      assert.equal(recent[0]!.summary, "Event 9");
    } finally { teardown(tmpDir); }
  });

  it("search() finds events by keyword in summary/detail/files", () => {
    const { tmpDir, timeline } = setup();
    try {
      timeline.record({ sessionId: "s1", type: "file_write", summary: "Created auth module", files: ["src/auth.ts"] });
      timeline.record({ sessionId: "s1", type: "bash_success", summary: "Tests passed" });

      assert.equal(timeline.search("auth").length, 1);
      assert.equal(timeline.search("auth.ts").length, 1);
      assert.equal(timeline.search("nonexistent").length, 0);
    } finally { teardown(tmpDir); }
  });

  it("summary() produces human-readable session summary", () => {
    const { tmpDir, timeline } = setup();
    try {
      timeline.record({ sessionId: "sum1", type: "file_write", summary: "A", files: ["a.ts"] });
      timeline.record({ sessionId: "sum1", type: "file_write", summary: "B", files: ["b.ts"] });
      timeline.record({ sessionId: "sum1", type: "bash_success", summary: "C" });

      const s = timeline.summary("sum1");
      assert.ok(s.includes("3 events"), `Expected "3 events" in: ${s}`);
      assert.ok(s.includes("2 file_write"));
      assert.ok(s.includes("2 files touched"));
    } finally { teardown(tmpDir); }
  });
});
