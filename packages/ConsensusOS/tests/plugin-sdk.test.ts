import { describe, it, expect, vi } from "vitest";
import { BasePlugin, ManifestBuilder, validatePlugin } from "../src/sdk/plugin-sdk.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import type { PluginManifest, PluginContext, ConsensusEvent } from "../src/plugins/api.js";

function makeCtx(): PluginContext {
  const events = new CoreEventBus();
  const invariants = new CoreInvariantEngine(events);
  return {
    events,
    invariants,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    config: {},
  } as unknown as PluginContext;
}

// ─── BasePlugin ─────────────────────────────────────────────────────

class TestPlugin extends BasePlugin {
  readonly manifest: PluginManifest = ManifestBuilder.create("test-plugin")
    .name("Test Plugin")
    .version("1.0.0")
    .capability("testing")
    .build();

  readonly initCalled: string[] = [];

  protected async onInit(): Promise<void> {
    this.initCalled.push("init");
    this.registerInvariant("test.always-true", "Always passes", () => true);
  }

  protected async onStart(): Promise<void> {
    this.initCalled.push("start");
    this.emit("test.started", { hello: "world" });
  }

  protected async onStop(): Promise<void> {
    this.initCalled.push("stop");
  }

  protected async onDestroy(): Promise<void> {
    this.initCalled.push("destroy");
  }
}

describe("BasePlugin", () => {
  it("provides lifecycle with defaults", async () => {
    const plugin = new TestPlugin();
    const ctx = makeCtx();

    const initResult = await plugin.init(ctx);
    expect(initResult.ok).toBe(true);

    const startResult = await plugin.start();
    expect(startResult.ok).toBe(true);

    const stopResult = await plugin.stop();
    expect(stopResult.ok).toBe(true);

    await plugin.destroy();

    expect(plugin.initCalled).toEqual(["init", "start", "stop", "destroy"]);
  });

  it("emits events through the event bus", async () => {
    const plugin = new TestPlugin();
    const ctx = makeCtx();
    const events: ConsensusEvent[] = [];
    (ctx.events as CoreEventBus).subscribe("test.*", (e) => { events.push(e); });

    await plugin.init(ctx);
    await plugin.start();

    expect(events.some((e) => e.topic === "test.started")).toBe(true);
  });

  it("registers invariants", async () => {
    const plugin = new TestPlugin();
    const ctx = makeCtx();
    await plugin.init(ctx);

    const invariants = ctx.invariants as CoreInvariantEngine;
    expect(invariants.registered()).toContain("test.always-true");
  });
});

// ─── ManifestBuilder ────────────────────────────────────────────────

describe("ManifestBuilder", () => {
  it("builds a complete manifest", () => {
    const manifest = ManifestBuilder.create("my-plugin")
      .name("My Plugin")
      .version("2.0.0")
      .description("A test plugin")
      .capability("monitoring")
      .capability("alerts")
      .dependency("health-sentinel")
      .build();

    expect(manifest.id).toBe("my-plugin");
    expect(manifest.name).toBe("My Plugin");
    expect(manifest.version).toBe("2.0.0");
    expect(manifest.description).toBe("A test plugin");
    expect(manifest.capabilities).toEqual(["monitoring", "alerts"]);
    expect(manifest.dependencies).toEqual(["health-sentinel"]);
  });

  it("builds a minimal manifest", () => {
    const manifest = ManifestBuilder.create("minimal").build();
    expect(manifest.id).toBe("minimal");
    expect(manifest.name).toBe("minimal");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.dependencies).toBeUndefined();
  });
});

// ─── Plugin Validator ───────────────────────────────────────────────

describe("validatePlugin", () => {
  it("validates a correct plugin", () => {
    const plugin = new TestPlugin();
    const result = validatePlugin(plugin);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("catches missing version", () => {
    const plugin = {
      manifest: { id: "bad", name: "Bad", version: "", capabilities: ["x"] },
      init: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const result = validatePlugin(plugin as any);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("catches invalid id format", () => {
    const plugin = {
      manifest: { id: "BadId", name: "Bad", version: "1.0.0", capabilities: [] },
      init: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const result = validatePlugin(plugin as any);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("warns about missing capabilities", () => {
    const plugin = {
      manifest: { id: "test", name: "Test", version: "1.0.0", capabilities: [] },
      init: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const result = validatePlugin(plugin as any);
    expect(result.warnings.some((w) => w.includes("capability"))).toBe(true);
  });
});
