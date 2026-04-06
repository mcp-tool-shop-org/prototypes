import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Guardrails, DEFAULT_CONFIG } from "../src/guardrails.js";

describe("Guardrails", () => {
  it("allows a valid interjection", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "test", priority: "med" });
    assert.ok(result.ok);
  });

  it("rejects empty text", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "", priority: "med" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "INBOX.TEXT.EMPTY");
    }
  });

  it("rejects whitespace-only text", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "   ", priority: "med" });
    assert.equal(result.ok, false);
  });

  it("deduplicates identical interjections", () => {
    const guard = new Guardrails();
    const input = { text: "same thing", priority: "med" as const };
    const first = guard.decidePush(input);
    assert.ok(first.ok);
    const second = guard.decidePush(input);
    assert.equal(second.ok, false);
    if (!second.ok) {
      assert.equal(second.code, "INBOX.DEDUPED");
    }
  });

  it("allows different text (not deduped)", () => {
    const guard = new Guardrails();
    const r1 = guard.decidePush({ text: "first thing", priority: "med" });
    const r2 = guard.decidePush({ text: "different thing", priority: "med" });
    assert.ok(r1.ok);
    assert.ok(r2.ok);
  });

  it("enforces rate limit per priority", () => {
    const guard = new Guardrails();
    // high priority: limit 1/min
    const r1 = guard.decidePush({ text: "urgent 1", priority: "high" });
    assert.ok(r1.ok);
    const r2 = guard.decidePush({ text: "urgent 2", priority: "high" });
    assert.equal(r2.ok, false);
    if (!r2.ok) {
      assert.equal(r2.code, "INBOX.RATELIMIT");
    }
  });

  it("normalizes TTL within max bounds", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "test", priority: "med" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.ok(result.normalized.expiresAt);
      const ttl = Date.parse(result.normalized.expiresAt!) - Date.now();
      // Should be around defaultTtlSeconds (600s = 10 min) ± some ms
      assert.ok(ttl > 500_000 && ttl <= 600_000 + 1000);
    }
  });

  it("caps TTL at maxTtlSeconds", () => {
    const guard = new Guardrails();
    const farFuture = new Date(Date.now() + 999_999_999).toISOString();
    const result = guard.decidePush({ text: "test", priority: "med", expiresAt: farFuture });
    assert.ok(result.ok);
    if (result.ok) {
      const ttl = Date.parse(result.normalized.expiresAt!) - Date.now();
      // Should be capped at maxTtlSeconds (3600s = 1 hour)
      assert.ok(ttl <= 3_600_000 + 1000);
    }
  });

  it("passes through when guardrails disabled", () => {
    const guard = new Guardrails();
    guard.configure({ enabled: false });
    const result = guard.decidePush({ text: "anything", priority: "high" });
    assert.ok(result.ok);
  });

  it("sets notify=true for high priority by default", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "critical", priority: "high" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.notify, true);
    }
  });

  it("sets notify=false for low priority by default", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "minor", priority: "low" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.notify, false);
    }
  });

  it("configure() updates config", () => {
    const guard = new Guardrails();
    guard.configure({ defaultTtlSeconds: 30 });
    assert.equal(guard.getConfig().defaultTtlSeconds, 30);
    // Other values unchanged
    assert.equal(guard.getConfig().enabled, DEFAULT_CONFIG.enabled);
  });

  it("adds dedupeHash to meta", () => {
    const guard = new Guardrails();
    const result = guard.decidePush({ text: "test", priority: "med" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.ok(result.normalized.meta);
      assert.ok((result.normalized.meta as Record<string, unknown>).dedupeHash);
    }
  });
});
