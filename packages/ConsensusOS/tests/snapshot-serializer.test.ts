import { describe, it, expect, beforeEach } from "vitest";
import { SnapshotSerializer } from "../src/modules/sandbox/snapshot-serializer.js";

describe("SnapshotSerializer", () => {
  let serializer: SnapshotSerializer;

  beforeEach(() => {
    serializer = new SnapshotSerializer();
  });

  it("captures a snapshot with checksum", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "Initial state",
      state: { ledger: 100, peers: 5 },
      events: [],
    });

    expect(snap.id).toBeTruthy();
    expect(snap.sessionId).toBe("s1");
    expect(snap.label).toBe("Initial state");
    expect(snap.state).toEqual({ ledger: 100, peers: 5 });
    expect(snap.checksum).toHaveLength(64); // SHA-256 hex
    expect(snap.createdAt).toBeTruthy();
  });

  it("verifies snapshot integrity", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "test",
      state: { x: 1 },
      events: [],
    });
    expect(serializer.verify(snap)).toBe(true);
  });

  it("detects tampered snapshots", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "test",
      state: { x: 1 },
      events: [],
    });

    // Tamper with the state
    const tampered = { ...snap, state: { x: 999 } };
    expect(serializer.verify(tampered)).toBe(false);
  });

  it("retrieves snapshots by ID", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "my snap",
      state: {},
      events: [],
    });

    expect(serializer.get(snap.id)).toBe(snap);
    expect(serializer.get("nonexistent")).toBeUndefined();
  });

  it("lists snapshots filtered by session", () => {
    serializer.capture({ sessionId: "s1", label: "a", state: {}, events: [] });
    serializer.capture({ sessionId: "s2", label: "b", state: {}, events: [] });
    serializer.capture({ sessionId: "s1", label: "c", state: {}, events: [] });

    expect(serializer.list("s1")).toHaveLength(2);
    expect(serializer.list("s2")).toHaveLength(1);
    expect(serializer.list()).toHaveLength(3);
  });

  it("deletes snapshots", () => {
    const snap = serializer.capture({ sessionId: "s1", label: "x", state: {}, events: [] });
    expect(serializer.delete(snap.id)).toBe(true);
    expect(serializer.get(snap.id)).toBeUndefined();
    expect(serializer.delete(snap.id)).toBe(false);
  });

  it("computes state diffs", () => {
    const diff = serializer.diff(
      { a: 1, b: 2, c: 3 },
      { a: 1, b: 99, d: 4 },
    );

    expect(diff.added).toEqual([{ key: "d", value: 4 }]);
    expect(diff.removed).toEqual([{ key: "c", value: 3 }]);
    expect(diff.changed).toEqual([{ key: "b", oldValue: 2, newValue: 99 }]);
  });

  it("serializes and deserializes snapshots", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "round-trip",
      state: { nested: { deep: true } },
      events: [],
    });

    const json = serializer.serialize(snap);
    serializer.clear();

    const restored = serializer.deserialize(json);
    expect(restored.id).toBe(snap.id);
    expect(restored.state).toEqual({ nested: { deep: true } });
    expect(serializer.get(restored.id)).toBeDefined();
  });

  it("rejects deserialization of tampered JSON", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "test",
      state: { x: 1 },
      events: [],
    });

    const json = serializer.serialize(snap);
    const tampered = json.replace('"x": 1', '"x": 999');

    expect(() => serializer.deserialize(tampered)).toThrow("checksum mismatch");
  });

  it("stores amendment state in snapshots", () => {
    const snap = serializer.capture({
      sessionId: "s1",
      label: "with amendments",
      state: {},
      events: [],
      amendments: [
        { id: "amend-1", name: "FixNFT", status: "enabled", activatedAt: 90000000 },
      ],
    });

    expect(snap.amendments).toHaveLength(1);
    expect(snap.amendments[0].name).toBe("FixNFT");
  });
});
