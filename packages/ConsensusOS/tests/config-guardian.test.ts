import { describe, it, expect, beforeEach } from "vitest";
import { ConfigGuardian } from "../src/modules/config/config-guardian.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import { createLogger } from "../src/core/logger.js";
import type { PluginContext } from "../src/plugins/api.js";

function createCtx(config: Record<string, unknown> = {}): PluginContext {
  return {
    events: new CoreEventBus(),
    invariants: new CoreInvariantEngine(),
    config,
    log: createLogger("config-guardian-test"),
  };
}

describe("ConfigGuardian", () => {
  let guardian: ConfigGuardian;

  beforeEach(() => {
    guardian = new ConfigGuardian();
  });

  it("initializes and registers invariants", async () => {
    const ctx = createCtx({ requiredKeys: ["port", "host"] });
    const result = await guardian.init(ctx);
    expect(result.ok).toBe(true);
    expect(ctx.invariants.registered()).toContain("config.required-keys-present");
    expect(ctx.invariants.registered()).toContain("config.schema-valid");
  });

  it("validates required keys — pass", () => {
    // Need to init first to populate requiredKeys
    const ctx = createCtx({ requiredKeys: ["port"] });
    guardian.init(ctx);

    const result = guardian.validate({ port: 3000 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates required keys — fail", async () => {
    const ctx = createCtx({ requiredKeys: ["port", "host"] });
    await guardian.init(ctx);

    const result = guardian.validate({ port: 3000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe("host");
  });

  it("validates schema types", async () => {
    const ctx = createCtx({
      schema: [
        { key: "port", type: "number", required: true },
        { key: "host", type: "string", required: true },
        { key: "debug", type: "boolean" },
      ],
    });
    await guardian.init(ctx);

    const good = guardian.validate({ port: 3000, host: "localhost", debug: true });
    expect(good.valid).toBe(true);

    const bad = guardian.validate({ port: "not-a-number", host: 123 });
    expect(bad.valid).toBe(false);
    expect(bad.errors).toHaveLength(2);
  });

  it("validates with custom validator", async () => {
    const ctx = createCtx({
      schema: [
        {
          key: "port",
          type: "number",
          required: true,
          validator: (v: unknown) => (v as number) > 0 && (v as number) < 65536,
          description: "Port must be 1-65535",
        },
      ],
    });
    await guardian.init(ctx);

    expect(guardian.validate({ port: 8080 }).valid).toBe(true);
    expect(guardian.validate({ port: 0 }).valid).toBe(false);
    expect(guardian.validate({ port: 70000 }).valid).toBe(false);
  });

  it("computes config diff", async () => {
    const ctx = createCtx({});
    await guardian.init(ctx);

    const diff = guardian.diff(
      { port: 3000, host: "old.example.com", removed: true },
      { port: 8080, host: "old.example.com", added: "new" },
    );

    expect(diff.added).toEqual(["added"]);
    expect(diff.removed).toEqual(["removed"]);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].key).toBe("port");
    expect(diff.changed[0].oldValue).toBe(3000);
    expect(diff.changed[0].newValue).toBe(8080);
    expect(diff.unchanged).toContain("host");
  });

  it("applies migrations in sequence", async () => {
    const ctx = createCtx({
      configVersion: "1.0.0",
      migrations: [
        {
          fromVersion: "1.0.0",
          toVersion: "1.1.0",
          description: "Add debug flag",
          migrate: (cfg: Record<string, unknown>) => ({ ...cfg, debug: false }),
        },
        {
          fromVersion: "1.1.0",
          toVersion: "2.0.0",
          description: "Rename port to listenPort",
          migrate: (cfg: Record<string, unknown>) => {
            const { port, ...rest } = cfg;
            return { ...rest, listenPort: port };
          },
        },
      ],
    });
    await guardian.init(ctx);

    const result = guardian.applyMigrations({ port: 3000 });
    expect(result.config).toEqual({ listenPort: 3000, debug: false });
    expect(result.appliedMigrations).toHaveLength(2);
    expect(guardian.getConfigVersion()).toBe("2.0.0");
  });

  it("tracks config history through migrations", async () => {
    const ctx = createCtx({
      configVersion: "1.0.0",
      migrations: [
        {
          fromVersion: "1.0.0",
          toVersion: "1.1.0",
          description: "Add field",
          migrate: (cfg: Record<string, unknown>) => ({ ...cfg, new: true }),
        },
      ],
    });
    await guardian.init(ctx);
    guardian.applyMigrations({ old: true });

    const history = guardian.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].version).toBe("1.0.0");
  });

  it("validates config on config.updated event", async () => {
    const bus = new CoreEventBus();
    const events: string[] = [];
    bus.subscribe("config.validated", () => events.push("validated"));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: { requiredKeys: ["port"] },
      log: createLogger("test"),
    };

    await guardian.init(ctx);
    await guardian.start();

    bus.publish("config.updated", "external", { config: { port: 3000 } });

    // Give async handler time to fire
    await new Promise((r) => setTimeout(r, 10));
    expect(events).toContain("validated");
  });

  it("enforces invariants via invariant engine", async () => {
    const invariants = new CoreInvariantEngine();
    const ctx: PluginContext = {
      events: new CoreEventBus(),
      invariants,
      config: { requiredKeys: ["host", "port"] },
      log: createLogger("test"),
    };

    await guardian.init(ctx);

    // Config with missing keys should fail
    const verdict = await invariants.check({ port: 3000 });
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations.some((v) => v.name === "config.required-keys-present")).toBe(true);

    // Config with all keys should pass
    const ok = await invariants.check({ host: "localhost", port: 3000 });
    expect(ok.allowed).toBe(true);
  });
});
