import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Guardrails } from "../src/guardrails.js";

describe("Guardrails stats", () => {
  let guard: Guardrails;

  beforeEach(() => {
    guard = new Guardrails();
  });

  it("starts with all-zero stats", () => {
    const stats = guard.getStats();
    assert.equal(stats.accepted, 0);
    assert.equal(stats.rejected, 0);
    assert.equal(stats.deduped, 0);
    assert.equal(stats.rateLimited, 0);
    assert.equal(stats.emptyText, 0);
  });

  it("increments accepted on successful push", () => {
    guard.decidePush({ text: "hello", priority: "low" });
    const stats = guard.getStats();
    assert.equal(stats.accepted, 1);
    assert.equal(stats.rejected, 0);
  });

  it("increments emptyText and rejected on empty text", () => {
    guard.decidePush({ text: "", priority: "low" });
    const stats = guard.getStats();
    assert.equal(stats.emptyText, 1);
    assert.equal(stats.rejected, 1);
    assert.equal(stats.accepted, 0);
  });

  it("increments deduped and rejected on duplicate", () => {
    guard.decidePush({ text: "same", priority: "med" });
    guard.decidePush({ text: "same", priority: "med" });
    const stats = guard.getStats();
    assert.equal(stats.accepted, 1);
    assert.equal(stats.deduped, 1);
    assert.equal(stats.rejected, 1);
  });

  it("increments rateLimited and rejected when rate exceeded", () => {
    // high priority allows 1/min by default
    guard.decidePush({ text: "first", priority: "high" });
    guard.decidePush({ text: "second", priority: "high" });
    const stats = guard.getStats();
    assert.equal(stats.accepted, 1);
    assert.equal(stats.rateLimited, 1);
    assert.equal(stats.rejected, 1);
  });

  it("returns a copy (not a reference)", () => {
    const s1 = guard.getStats();
    guard.decidePush({ text: "test", priority: "low" });
    const s2 = guard.getStats();
    assert.equal(s1.accepted, 0);
    assert.equal(s2.accepted, 1);
  });
});
