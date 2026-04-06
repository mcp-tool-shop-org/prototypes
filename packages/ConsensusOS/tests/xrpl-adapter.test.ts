import { describe, it, expect, beforeEach } from "vitest";
import { XrplAdapter } from "../src/adapters/xrpl/xrpl-adapter.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import { createLogger } from "../src/core/logger.js";
import type { PluginContext, ConsensusEvent } from "../src/plugins/api.js";

/** Fake RPC responder */
function fakeRpc(responses: Record<string, Record<string, unknown>>) {
  return async (url: string, method: string) => {
    const key = `${url}:${method}`;
    const data = responses[key];
    if (!data) throw new Error(`No fake response for ${key}`);
    return data;
  };
}

function createCtx(config: Record<string, unknown> = {}): PluginContext {
  return {
    events: new CoreEventBus(),
    invariants: new CoreInvariantEngine(),
    config,
    log: createLogger("xrpl-adapter-test"),
  };
}

describe("XrplAdapter", () => {
  let adapter: XrplAdapter;

  beforeEach(() => {
    adapter = new XrplAdapter();
  });

  it("initializes and registers invariant", async () => {
    const ctx = createCtx({
      rpcCall: fakeRpc({}),
    });
    const result = await adapter.init(ctx);
    expect(result.ok).toBe(true);
    expect(ctx.invariants.registered()).toContain("xrpl.node-responsive");
  });

  it("fetches server_info from a node", async () => {
    const ctx = createCtx({
      nodes: ["wss://xrpl.example.com"],
      rpcCall: fakeRpc({
        "wss://xrpl.example.com:server_info": {
          info: {
            server_state: "full",
            complete_ledgers: "32570-90000000",
            build_version: "2.3.0",
            network_id: 0,
            peers: 42,
            load_factor: 1,
            validated_ledger: {
              seq: 90000000,
              hash: "ABC123",
              close_time: 1700000000,
            },
          },
        },
      }),
    });

    await adapter.init(ctx);
    await adapter.start();

    const cached = adapter.getCachedInfo();
    expect(cached.size).toBe(1);

    const info = cached.get("wss://xrpl.example.com")!;
    expect(info.connected).toBe(true);
    expect(info.serverState).toBe("full");
    expect(info.buildVersion).toBe("2.3.0");
    expect(info.peers).toBe(42);
    expect(info.validatedLedger?.seq).toBe(90000000);
  });

  it("handles connection failure gracefully", async () => {
    const events: ConsensusEvent[] = [];
    const bus = new CoreEventBus();
    bus.subscribe("xrpl.disconnected", (e) => events.push(e));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        nodes: ["wss://dead.node"],
        rpcCall: async () => { throw new Error("ECONNREFUSED"); },
      },
      log: createLogger("test"),
    };

    await adapter.init(ctx);
    await adapter.start();

    const cached = adapter.getCachedInfo();
    const info = cached.get("wss://dead.node")!;
    expect(info.connected).toBe(false);
    expect(info.error).toBe("ECONNREFUSED");
    expect(events).toHaveLength(1);
  });

  it("enforces xrpl.node-responsive invariant", async () => {
    const invariants = new CoreInvariantEngine();
    const ctx: PluginContext = {
      events: new CoreEventBus(),
      invariants,
      config: {
        nodes: ["wss://dead.node"],
        rpcCall: async () => { throw new Error("timeout"); },
      },
      log: createLogger("test"),
    };

    await adapter.init(ctx);
    await adapter.start();

    const verdict = await invariants.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations.some((v) => v.name === "xrpl.node-responsive")).toBe(true);
  });

  it("passes invariant when at least one node is up", async () => {
    const invariants = new CoreInvariantEngine();
    const ctx: PluginContext = {
      events: new CoreEventBus(),
      invariants,
      config: {
        nodes: ["wss://good.node", "wss://bad.node"],
        rpcCall: async (url: string) => {
          if (url === "wss://bad.node") throw new Error("down");
          return { info: { server_state: "full" } };
        },
      },
      log: createLogger("test"),
    };

    await adapter.init(ctx);
    await adapter.start();

    const verdict = await invariants.check({});
    expect(verdict.allowed).toBe(true);
  });

  it("emits xrpl.server-info events", async () => {
    const bus = new CoreEventBus();
    const topics: string[] = [];
    bus.subscribe("*", (e) => topics.push(e.topic));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        nodes: ["wss://node.example.com"],
        rpcCall: async () => ({ info: { server_state: "full" } }),
      },
      log: createLogger("test"),
    };

    await adapter.init(ctx);
    await adapter.start();

    expect(topics).toContain("xrpl.server-info");
    expect(topics).toContain("xrpl.adapter.ready");
  });

  it("works with no nodes configured", async () => {
    const ctx = createCtx({ rpcCall: fakeRpc({}) });
    await adapter.init(ctx);
    await adapter.start();
    expect(adapter.getCachedInfo().size).toBe(0);
    expect(adapter.getNodeUrls()).toEqual([]);
  });

  it("stops cleanly", async () => {
    const ctx = createCtx({ rpcCall: fakeRpc({}) });
    await adapter.init(ctx);
    await adapter.start();
    const result = await adapter.stop();
    expect(result.ok).toBe(true);
  });
});
