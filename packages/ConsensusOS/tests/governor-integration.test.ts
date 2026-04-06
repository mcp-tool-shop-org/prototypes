import { describe, it, expect, beforeEach, vi } from "vitest";
import { GovernorPlugin } from "../src/modules/governor/governor-plugin.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import type { PluginContext } from "../src/plugins/api.js";

function makeCtx(overrides: Partial<PluginContext> = {}): PluginContext {
  const events = new CoreEventBus();
  const invariants = new CoreInvariantEngine(events);
  return {
    events,
    invariants,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    config: {},
    ...overrides,
  } as unknown as PluginContext;
}

describe("GovernorPlugin — Integration", () => {
  let plugin: GovernorPlugin;
  let ctx: PluginContext;

  beforeEach(async () => {
    plugin = new GovernorPlugin();
    ctx = makeCtx({
      config: {
        totalCpuMillis: 4000,
        totalMemoryBytes: 1024 * 1024 * 1024,
        maxConcurrent: 5,
        maxQueueDepth: 10,
      } as any,
    });
    await plugin.init(ctx);
    await plugin.start();
  });

  // ── Full Lifecycle ─────────────────────────────────────────────

  it("full lifecycle: request → submit → execute → verify audit + invariants", async () => {
    plugin.setExecutor(async (task) => ({ built: task.label }));

    // Request token
    const { token, policy } = plugin.requestToken({ owner: "builder" });
    expect(token).toBeDefined();
    expect(policy.verdict).toBe("allow");

    // Submit task
    const task = plugin.submitTask({
      label: "compile-main",
      owner: "builder",
      tokenId: token!.id,
      payload: { target: "main" },
    });
    expect(task.status).toBe("queued");

    // Process tasks
    const results = await plugin.processTasks();
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("completed");
    expect(results[0].result).toEqual({ built: "compile-main" });

    // Token should be consumed
    const consumed = plugin.tokens.get(token!.id);
    expect(consumed!.consumed).toBe(true);

    // Verify audit completeness for the token
    const tokenAudit = plugin.audit.verifyCompleteness(token!.id);
    expect(tokenAudit.complete).toBe(true);
    expect(tokenAudit.missing).toHaveLength(0);

    // Verify audit completeness for the task
    const taskAudit = plugin.audit.verifyCompleteness(results[0].id);
    expect(taskAudit.complete).toBe(true);
    expect(taskAudit.missing).toHaveLength(0);

    // All invariants should pass
    const invariants = ctx.invariants as CoreInvariantEngine;
    const verdict = await invariants.check();
    expect(verdict.allowed).toBe(true);
  });

  // ── Token Expiration During Execution ──────────────────────────

  it("token expiration during execution produces state_mismatch audit entry", async () => {
    // Issue a token with a long enough TTL to pass submit validation
    const { token } = plugin.requestToken({ owner: "slow-dev", ttlMs: 5000 });
    expect(token).toBeDefined();

    // Submit task while token is still valid
    plugin.submitTask({
      label: "slow-build",
      owner: "slow-dev",
      tokenId: token!.id,
      payload: {},
    });

    // Set executor that expires the token mid-execution (simulating TTL expiry)
    plugin.setExecutor(async () => {
      // Simulate the token expiring during execution by revoking it via autoExpire
      // We manually set expiresAt to the past to make autoExpire work
      (token as any).expiresAt = new Date(Date.now() - 1000).toISOString();
      plugin.tokens.autoExpire(token!.id);
      return "done";
    });

    // Process — the task should still complete, but consume() will fail gracefully
    const results = await plugin.processTasks();
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("completed");

    // Check for token.state_mismatch audit entry
    const mismatchEntries = plugin.audit.byAction("token.state_mismatch");
    expect(mismatchEntries.length).toBeGreaterThanOrEqual(1);

    // The token-state-consistency invariant should still pass
    // because the token is only revoked (by expiration), NOT both consumed and revoked
    const invariants = ctx.invariants as CoreInvariantEngine;
    const verdict = await invariants.check();
    const consistencyResult = verdict.results.find(
      (r) => r.name === "governor.token-state-consistency",
    );
    expect(consistencyResult).toBeDefined();
    expect(consistencyResult!.passed).toBe(true);
  });

  // ── Request Validation Blocks Malformed Requests ───────────────

  it("request validation blocks negative cpuMillis", () => {
    const { token, policy } = plugin.requestToken({
      owner: "bad-actor",
      cpuMillis: -1,
    });
    expect(policy.verdict).toBe("deny");
    expect(policy.decidingRule).toBe("request-validation");
    expect(token).toBeUndefined();
  });

  it("request validation blocks empty owner", () => {
    const { token, policy } = plugin.requestToken({
      owner: "",
    });
    expect(policy.verdict).toBe("deny");
    expect(policy.decidingRule).toBe("request-validation");
    expect(token).toBeUndefined();
  });

  it("request validation blocks negative memoryBytes", () => {
    const { token, policy } = plugin.requestToken({
      owner: "bad-actor",
      memoryBytes: -100,
    });
    expect(policy.verdict).toBe("deny");
    expect(token).toBeUndefined();
  });

  // ── Token State Consistency Invariant ──────────────────────────

  it("token-state-consistency invariant catches both consumed and revoked", async () => {
    const { token } = plugin.requestToken({ owner: "test" });
    expect(token).toBeDefined();

    // Manually corrupt the token: set both consumed and revoked
    token!.consumed = true;
    token!.revoked = true;

    const invariants = ctx.invariants as CoreInvariantEngine;
    const verdict = await invariants.check();

    const consistencyResult = verdict.results.find(
      (r) => r.name === "governor.token-state-consistency",
    );
    expect(consistencyResult).toBeDefined();
    expect(consistencyResult!.passed).toBe(false);

    // The overall verdict should be rejected
    expect(verdict.allowed).toBe(false);
  });

  // ── ExpireTokens Batch Operation ───────────────────────────────

  it("expireTokens batch: expires all tokens past TTL", () => {
    // Issue 3 tokens with ttlMs=-1 (already expired)
    const t1 = plugin.requestToken({ owner: "a", ttlMs: -1 });
    const t2 = plugin.requestToken({ owner: "b", ttlMs: -1 });
    const t3 = plugin.requestToken({ owner: "c", ttlMs: -1 });
    expect(t1.token).toBeDefined();
    expect(t2.token).toBeDefined();
    expect(t3.token).toBeDefined();

    const expiredCount = plugin.expireTokens();
    expect(expiredCount).toBe(3);

    // All tokens should be revoked
    expect(plugin.tokens.get(t1.token!.id)!.revoked).toBe(true);
    expect(plugin.tokens.get(t2.token!.id)!.revoked).toBe(true);
    expect(plugin.tokens.get(t3.token!.id)!.revoked).toBe(true);

    // All should have token.expired audit entries
    const expiredEntries = plugin.audit.byAction("token.expired");
    expect(expiredEntries.length).toBeGreaterThanOrEqual(3);
  });

  it("expireTokens does not expire tokens without TTL", () => {
    plugin.requestToken({ owner: "permanent" }); // No ttlMs
    const expiredCount = plugin.expireTokens();
    expect(expiredCount).toBe(0);
  });

  // ── Destroy Cleans Up ──────────────────────────────────────────

  it("destroy clears all internal state", async () => {
    // Issue tokens and submit tasks
    plugin.setExecutor(async () => "ok");
    const { token } = plugin.requestToken({ owner: "cleanup-test" });
    plugin.submitTask({
      label: "task-to-destroy",
      owner: "cleanup-test",
      tokenId: token!.id,
      payload: {},
    });

    // Verify state exists
    expect(plugin.tokens.list().length).toBeGreaterThan(0);
    expect(plugin.queue.depth).toBeGreaterThan(0);
    expect(plugin.audit.size).toBeGreaterThan(0);

    // Destroy
    await plugin.destroy();

    // All state cleared
    expect(plugin.tokens.list()).toHaveLength(0);
    expect(plugin.queue.depth).toBe(0);
    expect(plugin.audit.size).toBe(0);
    expect(plugin.policies.listRules()).toHaveLength(0);
  });

  // ── Invariant Registration ─────────────────────────────────────

  it("registers all three governor invariants", () => {
    const invariants = ctx.invariants as CoreInvariantEngine;
    const names = invariants.registered();
    expect(names).toContain("governor.resource-limits");
    expect(names).toContain("governor.queue-depth");
    expect(names).toContain("governor.token-state-consistency");
  });

  it("registers requestValidationRule as default policy", () => {
    const rules = plugin.policies.listRules();
    const validationRule = rules.find((r) => r.id === "request-validation");
    expect(validationRule).toBeDefined();
    expect(validationRule!.description).toContain("invalid");
  });
});
