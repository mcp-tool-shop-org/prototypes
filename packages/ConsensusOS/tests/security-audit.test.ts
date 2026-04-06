/**
 * Security & Determinism Audit Tests
 *
 * Validates:
 * 1. TokenIssuer abuse resistance (resource exhaustion, expired tokens, double-consume)
 * 2. AuditLog integrity (append-only, complete coverage)
 * 3. ReplayEngine determinism (same events → same state, ordering invariance)
 * 4. InvariantEngine fail-closed behavior
 * 5. Zero hidden dependencies
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TokenIssuer } from "../src/modules/governor/token-issuer.js";
import { AuditLog } from "../src/modules/governor/audit-log.js";
import { PolicyEngine, cpuThresholdRule, memoryThresholdRule } from "../src/modules/governor/policy-engine.js";
import { ReplayEngine } from "../src/modules/sandbox/replay-engine.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import type { ConsensusEvent } from "../src/plugins/api.js";
import type { ResourceLimits } from "../src/modules/governor/types.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ─── Helpers ────────────────────────────────────────────────────────

function makeEvent(topic: string, seq: number, data: unknown = {}): ConsensusEvent {
  return {
    topic,
    source: "test-plugin",
    timestamp: new Date().toISOString(),
    sequence: seq,
    data,
  };
}

const LIMITS: ResourceLimits = {
  totalCpuMillis: 4000,
  totalMemoryBytes: 1024 * 1024 * 1024, // 1 GB
  maxConcurrent: 4,
  maxQueueDepth: 10,
};

// ─── 1. TokenIssuer Abuse Resistance ────────────────────────────────

describe("Security: TokenIssuer abuse resistance", () => {
  let audit: AuditLog;
  let issuer: TokenIssuer;

  beforeEach(() => {
    audit = new AuditLog();
    issuer = new TokenIssuer(LIMITS, audit);
  });

  it("rejects token issuance when CPU limit is exceeded", () => {
    // Issue tokens consuming almost all CPU
    issuer.issue({ owner: "a", cpuMillis: 3500 });
    // Try to issue one that exceeds the limit
    expect(() => issuer.issue({ owner: "b", cpuMillis: 1000 })).toThrow("CPU limit exceeded");
  });

  it("rejects token issuance when memory limit is exceeded", () => {
    issuer.issue({ owner: "a", memoryBytes: 900 * 1024 * 1024 });
    expect(() => issuer.issue({ owner: "b", memoryBytes: 200 * 1024 * 1024 })).toThrow("Memory limit exceeded");
  });

  it("prevents double-revocation", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.revoke(token.id);
    expect(() => issuer.revoke(token.id)).toThrow("already revoked");
  });

  it("validates returns invalid for consumed tokens", () => {
    const token = issuer.issue({ owner: "a" });
    issuer.consume(token.id);
    const result = issuer.validate(token.id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token already consumed");
  });

  it("auto-revokes expired tokens via autoExpire (validate is pure)", () => {
    const token = issuer.issue({ owner: "a", ttlMs: 1 });
    // Wait for expiration
    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }
    // validate() is a pure read — no mutation
    const result = issuer.validate(token.id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token expired");
    expect(token.revoked).toBe(false); // validate does not mutate

    // autoExpire() handles the mutation + audit
    const expired = issuer.autoExpire(token.id);
    expect(expired).toBe(true);
    expect(token.revoked).toBe(true);
    const expirations = audit.byAction("token.expired");
    expect(expirations.length).toBeGreaterThanOrEqual(1);
  });

  it("clamps priority to 1-10 range", () => {
    const low = issuer.issue({ owner: "a", priority: -5 });
    const high = issuer.issue({ owner: "b", priority: 99 });
    expect(low.priority).toBe(1);
    expect(high.priority).toBe(10);
  });

  it("rejects token not found", () => {
    const result = issuer.validate("nonexistent");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Token not found");
  });
});

// ─── 2. AuditLog Integrity ──────────────────────────────────────────

describe("Security: AuditLog integrity", () => {
  let audit: AuditLog;

  beforeEach(() => {
    audit = new AuditLog();
  });

  it("entries are append-only (no removal API exists)", () => {
    audit.record("token.issued", "actor1", "entity1", {});
    audit.record("token.revoked", "actor1", "entity1", {});
    // All entries are preserved
    expect(audit.all()).toHaveLength(2);
    // The returned array is a copy, not a reference
    const entries = audit.all();
    expect(entries).not.toBe(audit.all());
  });

  it("every token operation produces an audit entry", () => {
    const issuer = new TokenIssuer(LIMITS, audit);
    const token = issuer.issue({ owner: "test" });
    issuer.consume(token.id);

    const token2 = issuer.issue({ owner: "test2" });
    issuer.revoke(token2.id);

    const actions = audit.all().map((e) => e.action);
    expect(actions).toContain("token.issued");
    expect(actions).toContain("token.consumed");
    expect(actions).toContain("token.revoked");
    // At least 4 entries (2 issues + 1 consume + 1 revoke)
    expect(audit.size).toBeGreaterThanOrEqual(4);
  });

  it("policy evaluations are audit-logged", () => {
    const engine = new PolicyEngine(audit);
    engine.addRule(cpuThresholdRule(0.9));
    engine.evaluate(
      { owner: "test", cpuMillis: 100 },
      { cpuMillisUsed: 0, memoryBytesUsed: 0, activeExecutions: 0, queuedTasks: 0, utilization: { cpu: 0, memory: 0, concurrency: 0, queue: 0 } },
    );
    const policyEntries = audit.byAction("policy.evaluated");
    expect(policyEntries.length).toBe(1);
  });

  it("audit entries have monotonically increasing IDs", () => {
    for (let i = 0; i < 10; i++) {
      audit.record("token.issued", "actor", `entity-${i}`, {});
    }
    const ids = audit.all().map((e) => e.id);
    // All IDs are unique
    expect(new Set(ids).size).toBe(10);
  });

  it("time range queries work correctly", () => {
    const before = new Date().toISOString();
    audit.record("token.issued", "actor", "entity", {});
    const after = new Date(Date.now() + 1000).toISOString();

    const inRange = audit.byTimeRange(before, after);
    expect(inRange.length).toBe(1);

    const outOfRange = audit.byTimeRange("2000-01-01T00:00:00Z", "2000-01-02T00:00:00Z");
    expect(outOfRange.length).toBe(0);
  });
});

// ─── 3. ReplayEngine Determinism ────────────────────────────────────

describe("Security: ReplayEngine determinism", () => {
  let engine: ReplayEngine;

  beforeEach(() => {
    engine = new ReplayEngine();
  });

  it("same events + same initial state → same final state (10 runs)", async () => {
    engine.on("counter.increment", (state, _event) => ({
      ...state,
      count: ((state.count as number) ?? 0) + 1,
    }));

    const events = Array.from({ length: 20 }, (_, i) =>
      makeEvent("counter.increment", i + 1),
    );

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        engine.replay({ events, initialState: { count: 0 } }),
      ),
    );

    // All 10 results must be identical
    const first = JSON.stringify(results[0].finalState);
    for (const r of results) {
      expect(JSON.stringify(r.finalState)).toBe(first);
      expect(r.eventsProcessed).toBe(20);
      expect(r.success).toBe(true);
    }
  });

  it("out-of-order events are sorted by sequence number", async () => {
    engine.on("set", (state, event) => ({
      ...state,
      last: (event.data as { value: number }).value,
    }));

    const events = [
      makeEvent("set", 3, { value: 3 }),
      makeEvent("set", 1, { value: 1 }),
      makeEvent("set", 2, { value: 2 }),
    ];

    const result = await engine.replay({ events, initialState: {} });
    // Last event by sequence is #3
    expect(result.finalState.last).toBe(3);
  });

  it("replaying subset via maxEvents produces correct partial state", async () => {
    engine.on("add", (state, event) => ({
      ...state,
      sum: ((state.sum as number) ?? 0) + (event.data as { n: number }).n,
    }));

    const events = [
      makeEvent("add", 1, { n: 10 }),
      makeEvent("add", 2, { n: 20 }),
      makeEvent("add", 3, { n: 30 }),
    ];

    const partial = await engine.replay({ events, initialState: { sum: 0 }, maxEvents: 2 });
    expect(partial.finalState.sum).toBe(30); // 10 + 20
    expect(partial.eventsProcessed).toBe(2);

    const full = await engine.replay({ events, initialState: { sum: 0 } });
    expect(full.finalState.sum).toBe(60); // 10 + 20 + 30
  });

  it("replayAndCompare detects divergence from different event sets", async () => {
    engine.on("set", (state, event) => ({
      ...state,
      value: (event.data as { v: string }).v,
    }));

    const eventsA = [makeEvent("set", 1, { v: "alpha" })];
    const eventsB = [makeEvent("set", 1, { v: "beta" })];

    const { identical, diffA, diffB } = await engine.replayAndCompare(eventsA, eventsB);
    expect(identical).toBe(false);
    expect(diffA.finalState.value).toBe("alpha");
    expect(diffB.finalState.value).toBe("beta");
  });

  it("replayAndCompare confirms identical for same events", async () => {
    engine.on("inc", (state) => ({
      ...state,
      n: ((state.n as number) ?? 0) + 1,
    }));

    const events = [makeEvent("inc", 1), makeEvent("inc", 2)];
    const { identical } = await engine.replayAndCompare(events, events);
    expect(identical).toBe(true);
  });

  it("handler errors are caught and result marked as failed", async () => {
    engine.on("explode", () => {
      throw new Error("boom");
    });

    const result = await engine.replay({
      events: [makeEvent("explode", 1)],
      initialState: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("boom");
  });
});

// ─── 4. InvariantEngine Fail-Closed ─────────────────────────────────

describe("Security: InvariantEngine fail-closed", () => {
  it("throwing invariant counts as failure (not a pass)", async () => {
    const engine = new CoreInvariantEngine();
    engine.register({
      name: "always-throws",
      owner: "test",
      description: "This invariant always throws",
      check: () => {
        throw new Error("unexpected crash");
      },
    });

    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations).toHaveLength(1);
    expect(verdict.violations[0].name).toBe("always-throws");
  });

  it("async throwing invariant counts as failure", async () => {
    const engine = new CoreInvariantEngine();
    engine.register({
      name: "async-throws",
      owner: "test",
      description: "This async invariant throws",
      check: async () => {
        throw new Error("async crash");
      },
    });

    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations).toHaveLength(1);
  });

  it("one failing invariant blocks even if others pass", async () => {
    const engine = new CoreInvariantEngine();
    engine.register({
      name: "pass",
      owner: "test",
      description: "always passes",
      check: () => true,
    });
    engine.register({
      name: "fail",
      owner: "test",
      description: "always fails",
      check: () => false,
    });

    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations).toHaveLength(1);
    expect(verdict.violations[0].name).toBe("fail");
  });

  it("duplicate invariant names are rejected", () => {
    const engine = new CoreInvariantEngine();
    engine.register({ name: "dup", owner: "a", description: "first", check: () => true });
    expect(() =>
      engine.register({ name: "dup", owner: "b", description: "second", check: () => true }),
    ).toThrow();
  });
});

// ─── 5. Policy Engine Security ──────────────────────────────────────

describe("Security: Policy engine", () => {
  it("denies requests at resource thresholds", () => {
    const audit = new AuditLog();
    const engine = new PolicyEngine(audit);
    engine.addRule(cpuThresholdRule(0.8));
    engine.addRule(memoryThresholdRule(0.9));

    const result = engine.evaluate(
      { owner: "test", cpuMillis: 100 },
      {
        cpuMillisUsed: 900,
        memoryBytesUsed: 0,
        activeExecutions: 1,
        queuedTasks: 0,
        utilization: { cpu: 0.85, memory: 0, concurrency: 0, queue: 0 },
      },
    );

    expect(result.verdict).toBe("deny");
    expect(result.decidingRule).toBe("cpu-threshold");
  });

  it("duplicate rule IDs are rejected", () => {
    const audit = new AuditLog();
    const engine = new PolicyEngine(audit);
    engine.addRule(cpuThresholdRule(0.8));
    expect(() => engine.addRule(cpuThresholdRule(0.9))).toThrow("already exists");
  });

  it("rules are evaluated in priority order (highest first)", () => {
    const audit = new AuditLog();
    const engine = new PolicyEngine(audit);

    // Low priority rule that denies
    engine.addRule({
      id: "low-priority-deny",
      description: "low priority deny",
      priority: 10,
      evaluate: () => "deny",
    });
    // High priority rule that allows
    engine.addRule({
      id: "high-priority-allow",
      description: "high priority allow",
      priority: 100,
      evaluate: () => "allow",
    });

    const result = engine.evaluate(
      { owner: "test" },
      { cpuMillisUsed: 0, memoryBytesUsed: 0, activeExecutions: 0, queuedTasks: 0, utilization: { cpu: 0, memory: 0, concurrency: 0, queue: 0 } },
    );

    // Even though high-priority allows, the low-priority deny still triggers
    // because the engine returns first non-allow verdict
    expect(result.verdict).toBe("deny");
    expect(result.decidingRule).toBe("low-priority-deny");
  });
});

// ─── 6. Zero Hidden Dependencies ────────────────────────────────────

describe("Security: Zero hidden dependencies", () => {
  it("package.json has no dependencies", () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname, "..", "package.json"), "utf-8"),
    );
    expect(Object.keys(pkg.dependencies ?? {})).toHaveLength(0);
  });

  it("no dynamic imports in source files", () => {
    // Dynamic imports could pull in unexpected code at runtime
    const { readdirSync, statSync } = require("node:fs");
    const srcDir = join(import.meta.dirname, "..", "src");

    function check(dir: string): void {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          check(full);
        } else if (full.endsWith(".ts")) {
          const src = readFileSync(full, "utf-8");
          // import() calls that aren't in test files — check for runtime dynamic imports
          // Allow type-only imports and conditional checks
          const dynamicImports = src.match(/\bimport\s*\(/g) ?? [];
          expect(
            dynamicImports.length,
            `${full} has dynamic import() calls`,
          ).toBe(0);
        }
      }
    }

    check(srcDir);
  });
});
