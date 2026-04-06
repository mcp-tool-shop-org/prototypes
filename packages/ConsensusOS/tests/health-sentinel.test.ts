import { describe, it, expect, beforeEach } from "vitest";
import { HealthSentinel } from "../src/modules/health/health-sentinel.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import { createLogger } from "../src/core/logger.js";
import type { PluginContext, ConsensusEvent } from "../src/plugins/api.js";

function createCtx(config: Record<string, unknown> = {}): PluginContext {
  return {
    events: new CoreEventBus(),
    invariants: new CoreInvariantEngine(),
    config,
    log: createLogger("health-sentinel-test"),
  };
}

/** Fake probe that returns controlled results */
function fakeProbe(results: Record<string, { reachable: boolean; latencyMs: number; error?: string }>) {
  return async (url: string) => results[url] ?? { reachable: false, latencyMs: 0, error: "unknown node" };
}

describe("HealthSentinel", () => {
  let sentinel: HealthSentinel;

  beforeEach(() => {
    sentinel = new HealthSentinel();
  });

  it("initializes and registers invariants", async () => {
    const ctx = createCtx({
      nodes: [{ id: "n1", url: "http://localhost:1" }],
      probe: fakeProbe({ "http://localhost:1": { reachable: true, latencyMs: 10 } }),
    });

    const result = await sentinel.init(ctx);
    expect(result.ok).toBe(true);
    expect(ctx.invariants.registered()).toContain("health.all-nodes-reachable");
    expect(ctx.invariants.registered()).toContain("health.latency-threshold");
  });

  it("runs health check against configured nodes", async () => {
    const ctx = createCtx({
      nodes: [
        { id: "node-a", url: "http://a:80" },
        { id: "node-b", url: "http://b:80" },
      ],
      probe: fakeProbe({
        "http://a:80": { reachable: true, latencyMs: 50 },
        "http://b:80": { reachable: true, latencyMs: 100 },
      }),
    });

    await sentinel.init(ctx);
    await sentinel.start();

    const report = sentinel.getLastReport()!;
    expect(report).toBeDefined();
    expect(report.allHealthy).toBe(true);
    expect(report.nodes).toHaveLength(2);
    expect(report.avgLatencyMs).toBe(75);
    expect(report.maxLatencyMs).toBe(100);
  });

  it("detects unhealthy nodes", async () => {
    const events: ConsensusEvent[] = [];
    const bus = new CoreEventBus();
    bus.subscribe("health.node.down", (e) => events.push(e));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        nodes: [
          { id: "good", url: "http://good:80" },
          { id: "bad", url: "http://bad:80" },
        ],
        probe: fakeProbe({
          "http://good:80": { reachable: true, latencyMs: 20 },
          "http://bad:80": { reachable: false, latencyMs: 0, error: "ECONNREFUSED" },
        }),
      },
      log: createLogger("test"),
    };

    await sentinel.init(ctx);
    await sentinel.start();

    const report = sentinel.getLastReport()!;
    expect(report.allHealthy).toBe(false);
    expect(events).toHaveLength(1);
    expect((events[0].data as { nodeId: string }).nodeId).toBe("bad");
  });

  it("enforces latency invariant", async () => {
    const invariants = new CoreInvariantEngine();
    const ctx: PluginContext = {
      events: new CoreEventBus(),
      invariants,
      config: {
        nodes: [{ id: "slow", url: "http://slow:80" }],
        maxLatencyMs: 100,
        probe: fakeProbe({
          "http://slow:80": { reachable: true, latencyMs: 500 },
        }),
      },
      log: createLogger("test"),
    };

    await sentinel.init(ctx);
    await sentinel.start();

    const verdict = await invariants.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations.some((v) => v.name === "health.latency-threshold")).toBe(true);
  });

  it("emits events during health check", async () => {
    const bus = new CoreEventBus();
    const topics: string[] = [];
    bus.subscribe("*", (e) => topics.push(e.topic));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        nodes: [{ id: "n1", url: "http://n1:80" }],
        probe: fakeProbe({ "http://n1:80": { reachable: true, latencyMs: 5 } }),
      },
      log: createLogger("test"),
    };

    await sentinel.init(ctx);
    await sentinel.start();

    expect(topics).toContain("health.sentinel.ready");
    expect(topics).toContain("health.check.completed");
  });

  it("stops cleanly", async () => {
    const ctx = createCtx({
      probe: fakeProbe({}),
    });
    await sentinel.init(ctx);
    await sentinel.start();
    const result = await sentinel.stop();
    expect(result.ok).toBe(true);
  });

  it("handles no nodes configured", async () => {
    const ctx = createCtx({
      probe: fakeProbe({}),
    });
    await sentinel.init(ctx);
    await sentinel.start();
    expect(sentinel.getLastReport()).toBeNull();
  });
});
