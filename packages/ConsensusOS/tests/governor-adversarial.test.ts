/**
 * Governor Adversarial Test Harness
 *
 * Adversarial, stress, and property tests for the hardened governor
 * token-task execution seam. Tests consume(), validate(), autoExpire(),
 * processNext() state-mismatch handling, audit immutability, and
 * policy validation edge cases.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TokenIssuer } from "../src/modules/governor/token-issuer.js";
import { BuildQueue } from "../src/modules/governor/build-queue.js";
import { AuditLog } from "../src/modules/governor/audit-log.js";
import { PolicyEngine, requestValidationRule } from "../src/modules/governor/policy-engine.js";
import type { ResourceLimits, TokenRequest, ResourceUsage } from "../src/modules/governor/types.js";

/** Helper: sleep for ms */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Default resource limits for tests */
function makeLimits(overrides: Partial<ResourceLimits> = {}): ResourceLimits {
  return {
    totalCpuMillis: 4000,
    totalMemoryBytes: 1024 * 1024 * 1024,
    maxConcurrent: 4,
    maxQueueDepth: 20,
    ...overrides,
  };
}

/** Default empty resource usage */
function emptyUsage(): ResourceUsage {
  return {
    cpuMillisUsed: 0,
    memoryBytesUsed: 0,
    activeExecutions: 0,
    queuedTasks: 0,
    utilization: { cpu: 0, memory: 0, concurrency: 0, queue: 0 },
  };
}

describe("Governor Adversarial Tests", () => {
  let audit: AuditLog;
  let limits: ResourceLimits;
  let issuer: TokenIssuer;
  let queue: BuildQueue;

  beforeEach(() => {
    audit = new AuditLog();
    limits = makeLimits();
    issuer = new TokenIssuer(limits, audit);
    queue = new BuildQueue(issuer, audit, limits);
  });

  // ── Test 1: Token expiration race ───────────────────────────────────
  it("cancels task when token expires before dequeue", async () => {
    const token = issuer.issue({ owner: "racer", ttlMs: 1, cpuMillis: 100 });
    const task = queue.submit({
      label: "race-task",
      owner: "racer",
      tokenId: token.id,
      payload: {},
    });

    // Wait for token to expire
    await sleep(20);

    // Auto-expire so processNext sees it as revoked
    issuer.autoExpire(token.id);

    queue.setExecutor(async () => "done");
    const result = await queue.processNext();

    expect(result).toBeDefined();
    expect(result!.status).toBe("cancelled");
    expect(result!.error).toBe("Token no longer valid");
  });

  // ── Test 2: Resource exhaustion boundary ────────────────────────────
  it("rejects token when CPU is exactly at limit with no partial allocation", () => {
    const tightLimits = makeLimits({ totalCpuMillis: 1000 });
    const tightIssuer = new TokenIssuer(tightLimits, audit);

    // Consume exactly all CPU
    tightIssuer.issue({ owner: "full", cpuMillis: 1000 });

    // Attempt +1 millicores
    expect(() => tightIssuer.issue({ owner: "overflow", cpuMillis: 1 })).toThrowError(
      /CPU limit exceeded: requested 1m, available 0m/,
    );

    // Verify no partial allocation — only the first token exists
    const tokens = tightIssuer.list();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].owner).toBe("full");
  });

  // ── Test 3: Priority inversion stress ───────────────────────────────
  it("processes high-priority task before low-priority tasks", async () => {
    queue.setExecutor(async (task) => task.label);

    // Submit 5 low-priority tasks (priority 1)
    for (let i = 0; i < 5; i++) {
      const tok = issuer.issue({ owner: "low", priority: 1, cpuMillis: 10, memoryBytes: 1024 });
      queue.submit({ label: `low-${i}`, owner: "low", tokenId: tok.id, payload: {} });
    }

    // Submit 1 high-priority task (priority 10)
    const highTok = issuer.issue({ owner: "high", priority: 10, cpuMillis: 10, memoryBytes: 1024 });
    queue.submit({ label: "high-0", owner: "high", tokenId: highTok.id, payload: {} });

    // Drain and verify order
    const results = await queue.drain();
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].label).toBe("high-0");
  });

  // ── Test 4: Consume-after-revoke rejection ──────────────────────────
  it("throws revoked error when consuming a revoked token", () => {
    const token = issuer.issue({ owner: "revoker", cpuMillis: 100 });
    issuer.revoke(token.id);

    expect(() => issuer.consume(token.id)).toThrowError(
      `Token "${token.id}" is revoked and cannot be consumed`,
    );
  });

  // ── Test 5: Double-consume rejection ────────────────────────────────
  it("throws already-consumed error on second consume", () => {
    const token = issuer.issue({ owner: "double", cpuMillis: 100 });
    issuer.consume(token.id);

    expect(() => issuer.consume(token.id)).toThrowError(
      `Token "${token.id}" already consumed`,
    );
  });

  // ── Test 6: Validate is pure read ──────────────────────────────────
  it("validate() does not mutate token state even for expired tokens", () => {
    // Issue a token that is already expired (ttlMs=-1 means expiresAt is in the past)
    // We need ttlMs to be a negative value so expiresAt < now
    const token = issuer.issue({ owner: "pure-read", cpuMillis: 100, ttlMs: -1 });

    // Validate twice — should report invalid but NOT mutate
    const v1 = issuer.validate(token.id);
    const v2 = issuer.validate(token.id);

    expect(v1.valid).toBe(false);
    expect(v1.reason).toBe("Token expired");
    expect(v2.valid).toBe(false);
    expect(v2.reason).toBe("Token expired");

    // Token should NOT be revoked — validate is a pure read
    const t = issuer.get(token.id)!;
    expect(t.revoked).toBe(false);

    // Now autoExpire should mutate
    const expired = issuer.autoExpire(token.id);
    expect(expired).toBe(true);
    expect(issuer.get(token.id)!.revoked).toBe(true);
  });

  // ── Test 7: AutoExpire idempotence ─────────────────────────────────
  it("autoExpire() returns true on first call, false on second for same token", () => {
    const token = issuer.issue({ owner: "idempotent", cpuMillis: 100, ttlMs: -1 });

    const first = issuer.autoExpire(token.id);
    const second = issuer.autoExpire(token.id);

    expect(first).toBe(true);
    expect(second).toBe(false);

    // Only one token.expired audit entry
    const expired = audit.byAction("token.expired");
    const forThis = expired.filter((e) => e.entityId === token.id);
    expect(forThis).toHaveLength(1);
  });

  // ── Test 8: Token state mismatch during execution ──────────────────
  it("logs token.state_mismatch when token expires during task execution", async () => {
    // Issue token with very short TTL — it will expire during execution
    const token = issuer.issue({ owner: "mismatch", cpuMillis: 100, ttlMs: 10 });

    const task = queue.submit({
      label: "slow-task",
      owner: "mismatch",
      tokenId: token.id,
      payload: {},
    });

    // Executor takes long enough for token to expire
    queue.setExecutor(async () => {
      await sleep(50);
      // Auto-expire the token mid-execution to simulate race
      issuer.autoExpire(token.id);
      return "completed-despite-expiry";
    });

    const result = await queue.processNext();

    expect(result).toBeDefined();
    expect(result!.status).toBe("completed");
    expect(result!.result).toBe("completed-despite-expiry");

    // Verify token.state_mismatch was audit-logged
    const mismatches = audit.byAction("token.state_mismatch");
    expect(mismatches.length).toBeGreaterThanOrEqual(1);
    const match = mismatches.find(
      (e) => e.entityId === task.id || (e.details as Record<string, unknown>).tokenId === token.id,
    );
    expect(match).toBeDefined();
  });

  // ── Test 9: Audit completeness for full lifecycle ──────────────────
  it("verifyCompleteness() confirms complete token and task lifecycles", async () => {
    const token = issuer.issue({ owner: "lifecycle", cpuMillis: 100 });

    queue.setExecutor(async () => "result");

    const task = queue.submit({
      label: "lifecycle-task",
      owner: "lifecycle",
      tokenId: token.id,
      payload: {},
    });

    const result = await queue.processNext();
    expect(result).toBeDefined();
    expect(result!.status).toBe("completed");

    // Token completeness: issued + consumed (terminal)
    const tokenComplete = audit.verifyCompleteness(token.id);
    expect(tokenComplete.complete).toBe(true);
    expect(tokenComplete.missing).toHaveLength(0);

    // Task completeness: queued + started + completed (terminal)
    const taskComplete = audit.verifyCompleteness(task.id);
    expect(taskComplete.complete).toBe(true);
    expect(taskComplete.missing).toHaveLength(0);
  });

  // ── Test 10: Audit completeness for incomplete lifecycle ───────────
  it("verifyCompleteness() detects missing terminal action for unconsumed token", () => {
    const token = issuer.issue({ owner: "incomplete", cpuMillis: 100 });

    // Don't consume, revoke, or expire — just leave it
    const result = audit.verifyCompleteness(token.id);

    expect(result.complete).toBe(false);
    expect(result.missing.length).toBeGreaterThanOrEqual(1);
    expect(result.missing.some((m) => m.includes("terminal"))).toBe(true);
  });

  // ── Test 11: Audit immutability under stress ───────────────────────
  it("audit entries are immutable even after external mutation of returned data", () => {
    // Record 100 entries
    for (let i = 0; i < 100; i++) {
      audit.record("token.issued", `actor-${i}`, `entity-${i}`, { index: i });
    }

    // Retrieve all and mutate every returned entry
    const first = audit.all();
    expect(first).toHaveLength(100);

    for (const entry of first) {
      // Attempt to mutate (cast away readonly for adversarial test)
      (entry as { action: string }).action = "CORRUPTED" as never;
      (entry.details as Record<string, unknown>).index = -999;
      (entry as { actor: string }).actor = "EVIL";
    }

    // Retrieve again — originals must be intact
    const second = audit.all();
    expect(second).toHaveLength(100);

    for (let i = 0; i < 100; i++) {
      expect(second[i].action).toBe("token.issued");
      expect(second[i].actor).toBe(`actor-${i}`);
      expect(second[i].entityId).toBe(`entity-${i}`);
      expect((second[i].details as Record<string, unknown>).index).toBe(i);
    }
  });

  // ── Test 12: Request validation rule edge cases ────────────────────
  describe("requestValidationRule edge cases", () => {
    let engine: PolicyEngine;
    const usage = emptyUsage();

    beforeEach(() => {
      engine = new PolicyEngine(audit);
      engine.addRule(requestValidationRule());
    });

    it("denies cpuMillis=0", () => {
      const result = engine.evaluate({ owner: "test", cpuMillis: 0 }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies cpuMillis=-1", () => {
      const result = engine.evaluate({ owner: "test", cpuMillis: -1 }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies memoryBytes=0", () => {
      const result = engine.evaluate({ owner: "test", memoryBytes: 0 }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies timeoutMs=-1", () => {
      const result = engine.evaluate({ owner: "test", timeoutMs: -1 }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies priority=NaN", () => {
      const result = engine.evaluate({ owner: "test", priority: NaN }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies priority=Infinity", () => {
      const result = engine.evaluate({ owner: "test", priority: Infinity }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("denies owner=empty string", () => {
      const result = engine.evaluate({ owner: "" }, usage);
      expect(result.verdict).toBe("deny");
    });

    it("allows request with all-undefined optionals", () => {
      const result = engine.evaluate({ owner: "valid-owner" }, usage);
      expect(result.verdict).toBe("allow");
    });
  });
});
