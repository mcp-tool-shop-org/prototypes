import { describe, it, expect, beforeEach, vi } from "vitest";
import { GovernorPlugin } from "../src/modules/governor/governor-plugin.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import { cpuThresholdRule, priorityThrottleRule } from "../src/modules/governor/policy-engine.js";
import type { PluginContext, ConsensusEvent } from "../src/plugins/api.js";

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

describe("GovernorPlugin", () => {
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

  // ── Token Management ────────────────────────────────────────────

  it("requests and issues a token", () => {
    const { token, policy } = plugin.requestToken({ owner: "builder" });
    expect(token).toBeDefined();
    expect(token!.owner).toBe("builder");
    expect(policy.verdict).toBe("allow");
  });

  it("denies tokens when policy denies", () => {
    plugin.policies.addRule(cpuThresholdRule(0.1)); // Very low threshold

    // Issue a token to spike CPU usage
    plugin.requestToken({ owner: "a", cpuMillis: 1000 });

    // Now usage is 25%, above 10% threshold
    const { token, policy } = plugin.requestToken({ owner: "b" });
    expect(policy.verdict).toBe("deny");
    expect(token).toBeUndefined();
  });

  it("revokes a token", () => {
    const { token } = plugin.requestToken({ owner: "a" });
    plugin.revokeToken(token!.id);
    expect(plugin.tokens.validate(token!.id).valid).toBe(false);
  });

  // ── Build Queue ─────────────────────────────────────────────────

  it("submits and processes tasks", async () => {
    plugin.setExecutor(async (task) => ({ result: task.label }));

    const { token } = plugin.requestToken({ owner: "builder" });
    const task = plugin.submitTask({
      label: "compile",
      owner: "builder",
      tokenId: token!.id,
      payload: { target: "main" },
    });

    expect(task.status).toBe("queued");

    const results = await plugin.processTasks();
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("completed");
    expect(results[0].result).toEqual({ result: "compile" });
  });

  it("emits events on task completion", async () => {
    const events: ConsensusEvent[] = [];
    (ctx.events as CoreEventBus).subscribe("governor.*", (e) => { events.push(e); });

    plugin.setExecutor(async () => "done");

    const { token } = plugin.requestToken({ owner: "dev" });
    plugin.submitTask({ label: "build", owner: "dev", tokenId: token!.id, payload: {} });
    await plugin.processTasks();

    const topics = events.map((e) => e.topic);
    expect(topics).toContain("governor.token.issued");
    expect(topics).toContain("governor.task.queued");
    expect(topics).toContain("governor.task.completed");
  });

  // ── Resource Monitoring ─────────────────────────────────────────

  it("reports resource usage", () => {
    plugin.requestToken({ owner: "a", cpuMillis: 1000 });

    const usage = plugin.getUsage();
    expect(usage.cpuMillisUsed).toBe(1000);
    expect(usage.utilization.cpu).toBeCloseTo(0.25);
  });

  it("reports resource limits", () => {
    const limits = plugin.getLimits();
    expect(limits.totalCpuMillis).toBe(4000);
    expect(limits.maxConcurrent).toBe(5);
  });

  // ── Invariants ──────────────────────────────────────────────────

  it("registers governor invariants", () => {
    const invariants = ctx.invariants as CoreInvariantEngine;
    const names = invariants.registered();
    expect(names).toContain("governor.resource-limits");
    expect(names).toContain("governor.queue-depth");
  });

  it("resource-limits invariant passes under limits", async () => {
    const invariants = ctx.invariants as CoreInvariantEngine;
    plugin.requestToken({ owner: "a", cpuMillis: 1000 });

    const verdict = await invariants.check();
    expect(verdict.allowed).toBe(true);
  });

  // ── Lifecycle ───────────────────────────────────────────────────

  it("stop() clears the queue", async () => {
    const { token } = plugin.requestToken({ owner: "a" });
    plugin.submitTask({ label: "t", owner: "a", tokenId: token!.id, payload: {} });
    expect(plugin.queue.depth).toBe(1);

    await plugin.stop();
    expect(plugin.queue.depth).toBe(0);
  });

  it("destroy() clears all state", async () => {
    plugin.requestToken({ owner: "a" });
    await plugin.destroy();
    expect(plugin.audit.size).toBe(0);
  });

  // ── Throttling ──────────────────────────────────────────────────

  it("throttles and reduces resources", () => {
    // Issue tokens to create load
    plugin.requestToken({ owner: "load1", cpuMillis: 1500 });
    plugin.requestToken({ owner: "load2", cpuMillis: 1500 });
    // CPU usage is now 3000/4000 = 75%

    // Add throttle rule: throttle priority < 7 when utilization > 60%
    plugin.policies.addRule(priorityThrottleRule(7, 0.6));

    // Low-priority request should be throttled (resources halved)
    const { token, policy } = plugin.requestToken({
      owner: "low-prio",
      priority: 3,
      cpuMillis: 400,
    });

    expect(policy.verdict).toBe("throttle");
    expect(token).toBeDefined();
    expect(token!.cpuMillis).toBe(200); // Halved from 400
  });
});
