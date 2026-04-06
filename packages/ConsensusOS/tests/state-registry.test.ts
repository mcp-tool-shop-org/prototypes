import { describe, it, expect, beforeEach } from "vitest";
import { CoreStateRegistry } from "../src/state/registry.js";

describe("CoreStateRegistry", () => {
  let registry: CoreStateRegistry;

  beforeEach(() => {
    registry = new CoreStateRegistry();
  });

  it("starts empty with version 0", () => {
    expect(registry.version()).toBe(0);
    expect(registry.keys()).toEqual([]);
    expect(registry.transitions()).toEqual([]);
  });

  it("sets and gets values", () => {
    registry.set("node.count", 5, "test-plugin");
    expect(registry.get("node.count")).toBe(5);
    expect(registry.has("node.count")).toBe(true);
    expect(registry.version()).toBe(1);
  });

  it("returns undefined for missing keys", () => {
    expect(registry.get("missing")).toBeUndefined();
    expect(registry.has("missing")).toBe(false);
  });

  it("records transitions with previous values", () => {
    registry.set("count", 1, "plugin-a");
    registry.set("count", 2, "plugin-b");

    const transitions = registry.transitions();
    expect(transitions).toHaveLength(2);
    expect(transitions[0].previousValue).toBeUndefined();
    expect(transitions[0].newValue).toBe(1);
    expect(transitions[1].previousValue).toBe(1);
    expect(transitions[1].newValue).toBe(2);
    expect(transitions[1].updatedBy).toBe("plugin-b");
  });

  it("increments version monotonically", () => {
    registry.set("a", 1, "p");
    registry.set("b", 2, "p");
    registry.set("a", 3, "p");
    expect(registry.version()).toBe(3);
  });

  it("deletes keys and records transition", () => {
    registry.set("temp", "value", "p");
    expect(registry.delete("temp", "p")).toBe(true);
    expect(registry.has("temp")).toBe(false);
    expect(registry.get("temp")).toBeUndefined();
    expect(registry.version()).toBe(2);

    const transitions = registry.transitions();
    expect(transitions).toHaveLength(2);
    expect(transitions[1].previousValue).toBe("value");
  });

  it("returns false when deleting non-existent key", () => {
    expect(registry.delete("nope", "p")).toBe(false);
  });

  it("lists all keys", () => {
    registry.set("alpha", 1, "p");
    registry.set("beta", 2, "p");
    registry.set("gamma", 3, "p");
    expect(registry.keys()).toEqual(["alpha", "beta", "gamma"]);
  });

  it("provides entry metadata", () => {
    registry.set("key", "val", "owner");
    const entry = registry.getEntry("key");
    expect(entry).toBeDefined();
    expect(entry!.key).toBe("key");
    expect(entry!.value).toBe("val");
    expect(entry!.version).toBe(1);
    expect(entry!.updatedBy).toBe("owner");
    expect(entry!.timestamp).toBeTruthy();
  });

  it("takes and restores snapshots", () => {
    registry.set("x", 10, "p");
    registry.set("y", 20, "p");
    const snap = registry.snapshot();

    // Mutate after snapshot
    registry.set("x", 99, "p");
    registry.set("z", 30, "p");

    // Restore
    registry.restore(snap);
    expect(registry.get("x")).toBe(10);
    expect(registry.get("y")).toBe(20);
    expect(registry.has("z")).toBe(false);
    expect(registry.version()).toBe(snap.version);
  });

  it("snapshot is serializable to JSON", () => {
    registry.set("obj", { nested: true }, "p");
    const snap = registry.snapshot();
    const json = JSON.stringify(snap);
    const parsed = JSON.parse(json);
    expect(parsed.entries.obj.value).toEqual({ nested: true });
  });
});
