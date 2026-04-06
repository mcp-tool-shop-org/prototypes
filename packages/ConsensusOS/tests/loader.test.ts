import { describe, it, expect } from "vitest";
import { CoreLoader } from "../src/core/loader.js";
import { EchoPlugin } from "../src/mocks/echo-plugin.js";
import {
  HealthSentinelPlugin,
  type HealthCheckContext,
} from "../src/mocks/health-sentinel-plugin.js";
import { ConfigGuardianPlugin } from "../src/mocks/config-guardian-plugin.js";
import type { Plugin, PluginManifest, PluginContext, LifecycleResult } from "../src/plugins/api.js";

// ─── Helper: minimal plugin ─────────────────────────────────────────

function createMinimalPlugin(id: string, deps?: string[]): Plugin {
  return {
    manifest: {
      id,
      name: id,
      version: "0.1.0",
      capabilities: [],
      ...(deps ? { dependencies: deps } : {}),
    } as PluginManifest,
    async init() {
      return { ok: true };
    },
    async start() {
      return { ok: true };
    },
    async stop() {
      return { ok: true };
    },
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("CoreLoader", () => {
  it("registers and boots plugins", async () => {
    const loader = new CoreLoader();
    loader.register(new EchoPlugin());

    await loader.boot();

    expect(loader.getState("echo")).toBe("started");
  });

  it("rejects duplicate plugin registration", () => {
    const loader = new CoreLoader();
    loader.register(new EchoPlugin());

    expect(() => loader.register(new EchoPlugin())).toThrow(
      /already registered/
    );
  });

  it("resolves dependencies in correct order", async () => {
    const loader = new CoreLoader();

    // config-guardian depends on health-sentinel
    loader.register(new ConfigGuardianPlugin());
    loader.register(new HealthSentinelPlugin());
    loader.register(new EchoPlugin());

    await loader.boot();

    // All should be started
    expect(loader.getState("health-sentinel")).toBe("started");
    expect(loader.getState("config-guardian")).toBe("started");
    expect(loader.getState("echo")).toBe("started");
  });

  it("throws on missing dependency", () => {
    const loader = new CoreLoader();
    loader.register(new ConfigGuardianPlugin()); // depends on health-sentinel

    expect(() => loader.boot()).rejects.toThrow(/not registered/);
  });

  it("throws on circular dependency", () => {
    const loader = new CoreLoader();

    const a = createMinimalPlugin("plugin-a", ["plugin-b"]);
    const b = createMinimalPlugin("plugin-b", ["plugin-a"]);

    loader.register(a);
    loader.register(b);

    expect(() => loader.boot()).rejects.toThrow(/Circular dependency/);
  });

  it("shuts down in reverse order", async () => {
    const order: string[] = [];

    const makeTracked = (id: string, deps?: string[]): Plugin => ({
      manifest: {
        id,
        name: id,
        version: "0.1.0",
        capabilities: [],
        ...(deps ? { dependencies: deps } : {}),
      } as PluginManifest,
      async init() {
        return { ok: true };
      },
      async start() {
        return { ok: true };
      },
      async stop() {
        order.push(id);
        return { ok: true };
      },
    });

    const loader = new CoreLoader();
    loader.register(makeTracked("base"));
    loader.register(makeTracked("middle", ["base"]));
    loader.register(makeTracked("top", ["middle"]));

    await loader.boot();
    await loader.shutdown();

    // Shutdown should be reverse of boot: top → middle → base
    expect(order).toEqual(["top", "middle", "base"]);
  });

  it("accepts plugin factories", async () => {
    const loader = new CoreLoader();
    loader.register(() => new EchoPlugin());

    await loader.boot();
    expect(loader.getState("echo")).toBe("started");
  });

  it("passes config to plugins via context", async () => {
    let receivedConfig: Record<string, unknown> = {};

    const configSpy: Plugin = {
      manifest: {
        id: "spy",
        name: "Config Spy",
        version: "0.1.0",
        capabilities: [],
      },
      async init(ctx: PluginContext) {
        receivedConfig = { ...ctx.config };
        return { ok: true };
      },
      async start() {
        return { ok: true };
      },
      async stop() {
        return { ok: true };
      },
    };

    const loader = new CoreLoader({
      configs: {
        spy: { maxRetries: 3, timeout: 5000 },
      },
    });

    loader.register(configSpy);
    await loader.boot();

    expect(receivedConfig).toEqual({ maxRetries: 3, timeout: 5000 });
  });
});

describe("CoreLoader — Integration: Event Bus + Invariant Engine", () => {
  it("echo plugin captures events from other plugins", async () => {
    const echo = new EchoPlugin();
    const loader = new CoreLoader();

    loader.register(new HealthSentinelPlugin());
    loader.register(echo);

    await loader.boot();

    // Echo captures core.boot.complete (emitted after all plugins start)
    expect(echo.echoed.length).toBeGreaterThanOrEqual(1);
    const topics = echo.echoed.map((e) => e.topic);
    expect(topics).toContain("core.boot.complete");

    // Now publish an event — echo should capture it
    loader.events.publish("health.check", "test", { ok: true });
    expect(echo.echoed.map((e) => e.topic)).toContain("health.check");
  });

  it("invariants registered by plugins are enforceable", async () => {
    const loader = new CoreLoader();
    loader.register(new HealthSentinelPlugin());
    await loader.boot();

    // Check invariants: healthy nodes should pass
    const passing = await loader.invariants.check<HealthCheckContext>({
      nodes: [
        { nodeId: "n1", healthy: true, latencyMs: 100 },
        { nodeId: "n2", healthy: true, latencyMs: 200 },
      ],
    });
    expect(passing.allowed).toBe(true);

    // Unhealthy node should fail
    const failing = await loader.invariants.check<HealthCheckContext>({
      nodes: [
        { nodeId: "n1", healthy: false, latencyMs: 100 },
        { nodeId: "n2", healthy: true, latencyMs: 200 },
      ],
    });
    expect(failing.allowed).toBe(false);
    expect(failing.violations.some((v) => v.name === "health.all-nodes-live")).toBe(true);
  });

  it("high latency triggers invariant failure", async () => {
    const loader = new CoreLoader({
      configs: {
        "health-sentinel": { maxLatencyMs: 1000 },
      },
    });
    loader.register(new HealthSentinelPlugin());
    await loader.boot();

    const verdict = await loader.invariants.check<HealthCheckContext>({
      nodes: [{ nodeId: "slow", healthy: true, latencyMs: 2000 }],
    });

    expect(verdict.allowed).toBe(false);
    expect(
      verdict.violations.some((v) => v.name === "health.latency-threshold")
    ).toBe(true);
  });

  it("full system: three plugins with dependencies, events, and invariants", async () => {
    const echo = new EchoPlugin();
    const loader = new CoreLoader();

    loader.register(new HealthSentinelPlugin());
    loader.register(new ConfigGuardianPlugin()); // depends on health-sentinel
    loader.register(echo);

    await loader.boot();

    // All running
    expect(loader.getState("health-sentinel")).toBe("started");
    expect(loader.getState("config-guardian")).toBe("started");
    expect(loader.getState("echo")).toBe("started");

    // 4 invariants registered total (2 health + 1 config)
    expect(loader.invariants.registered()).toEqual([
      "health.all-nodes-live",
      "health.latency-threshold",
      "config.required-keys-present",
    ]);

    // Check combined invariants
    const verdict = await loader.invariants.check({
      nodes: [{ nodeId: "n1", healthy: true, latencyMs: 50 }],
      config: { dbHost: "localhost" },
      requiredKeys: ["dbHost"],
    });
    expect(verdict.allowed).toBe(true);

    // Missing required key → config invariant fails
    const failing = await loader.invariants.check({
      nodes: [{ nodeId: "n1", healthy: true, latencyMs: 50 }],
      config: {},
      requiredKeys: ["dbHost"],
    });
    expect(failing.allowed).toBe(false);
    expect(
      failing.violations.some((v) => v.name === "config.required-keys-present")
    ).toBe(true);

    // Clean shutdown
    await loader.shutdown();
    expect(loader.getState("echo")).toBe("stopped");
  });
});
