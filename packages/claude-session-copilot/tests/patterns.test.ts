import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../src/store.js";
import { Timeline } from "../src/timeline.js";
import { PatternDetector } from "../src/patterns.js";

function setup() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-pat-"));
  const store = new Store(path.join(tmpDir, "store.json"));
  store.ensureSession();
  const timeline = new Timeline(store);
  const detector = new PatternDetector(store);
  return { tmpDir, store, timeline, detector };
}

function teardown(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe("PatternDetector", { concurrency: 1 }, () => {
  it("returns empty when no patterns detected", () => {
    const { tmpDir, detector } = setup();
    try {
      const alerts = detector.detect();
      assert.equal(alerts.length, 0);
    } finally { teardown(tmpDir); }
  });

  it("detects repeated failures (3+ same command prefix)", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 3; i++) {
        timeline.record({
          sessionId: sid,
          type: "bash_failure",
          summary: "npm run build failed with exit code 1",
        });
      }

      const alerts = detector.detect();
      assert.equal(alerts.length, 1);
      assert.equal(alerts[0]!.type, "repeated_failure");
      assert.ok(alerts[0]!.message.includes("3 times"));
    } finally { teardown(tmpDir); }
  });

  it("does not alert for < 3 failures", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 2; i++) {
        timeline.record({
          sessionId: sid,
          type: "bash_failure",
          summary: "npm run build failed",
        });
      }

      const alerts = detector.detect();
      assert.equal(alerts.length, 0);
    } finally { teardown(tmpDir); }
  });

  it("detects file churn (5+ edits to same file)", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 5; i++) {
        timeline.record({
          sessionId: sid,
          type: "file_edit",
          summary: `Edit ${i}`,
          files: ["src/store.ts"],
        });
      }

      const alerts = detector.detect();
      assert.equal(alerts.length, 1);
      assert.equal(alerts[0]!.type, "file_churn");
      assert.ok(alerts[0]!.message.includes("src/store.ts"));
    } finally { teardown(tmpDir); }
  });

  it("detects long session without snapshot (100+ events)", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 100; i++) {
        timeline.record({
          sessionId: sid,
          type: "manual",
          summary: `Event ${i}`,
        });
      }

      const alerts = detector.detect();
      const longSession = alerts.find((a) => a.type === "long_session");
      assert.ok(longSession);
      assert.ok(longSession!.message.includes("100 events"));
    } finally { teardown(tmpDir); }
  });

  it("deduplicates alerts (same message not repeated)", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 3; i++) {
        timeline.record({
          sessionId: sid,
          type: "bash_failure",
          summary: "npm test failed",
        });
      }

      const alerts1 = detector.detect();
      assert.equal(alerts1.length, 1);

      const alerts2 = detector.detect();
      assert.equal(alerts2.length, 0);
    } finally { teardown(tmpDir); }
  });

  it("acknowledge() marks an alert as acknowledged", () => {
    const { tmpDir, store, timeline, detector } = setup();
    try {
      const sid = store.get().currentSessionId!;
      for (let i = 0; i < 3; i++) {
        timeline.record({
          sessionId: sid,
          type: "test_fail",
          summary: "Test suite failed",
        });
      }

      const alerts = detector.detect();
      assert.equal(detector.unacknowledged().length, 1);

      detector.acknowledge(alerts[0]!.id);
      assert.equal(detector.unacknowledged().length, 0);
    } finally { teardown(tmpDir); }
  });
});
