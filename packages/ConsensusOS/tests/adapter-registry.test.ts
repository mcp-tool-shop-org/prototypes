import { describe, it, expect, beforeEach } from "vitest";
import { AdapterRegistry } from "../src/adapters/adapter-registry.js";
import { EthereumAdapter } from "../src/adapters/ethereum/ethereum-adapter.js";
import { CosmosAdapter } from "../src/adapters/cosmos/cosmos-adapter.js";
import type { ChainConfig } from "../src/adapters/chain-adapter.js";

const ethConfig: ChainConfig = {
  family: "ethereum",
  networkId: "mainnet",
  nodes: [{ url: "https://eth.example.com", primary: true }],
};

const cosmosConfig: ChainConfig = {
  family: "cosmos",
  networkId: "cosmoshub-4",
  nodes: [{ url: "https://cosmos.example.com", primary: true }],
};

describe("AdapterRegistry", () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.registerFactory("ethereum", () => new EthereumAdapter());
    registry.registerFactory("cosmos", () => new CosmosAdapter());
  });

  it("registers adapter factories", () => {
    expect(registry.registeredFamilies()).toContain("ethereum");
    expect(registry.registeredFamilies()).toContain("cosmos");
  });

  it("prevents duplicate factory registration", () => {
    expect(() => registry.registerFactory("ethereum", () => new EthereumAdapter())).toThrow(
      "already registered",
    );
  });

  it("creates and connects an adapter", async () => {
    const adapter = await registry.create(ethConfig);
    expect(adapter.family).toBe("ethereum");
    expect(adapter.status).toBe("connected");
  });

  it("gets an existing adapter", async () => {
    await registry.create(ethConfig);
    const adapter = registry.get("ethereum", "mainnet");
    expect(adapter).toBeDefined();
    expect(adapter!.status).toBe("connected");
  });

  it("throws on unknown chain family", async () => {
    await expect(
      registry.create({ family: "solana", networkId: "mainnet", nodes: [] }),
    ).rejects.toThrow("No adapter factory");
  });

  it("prevents duplicate adapter instances", async () => {
    await registry.create(ethConfig);
    await expect(registry.create(ethConfig)).rejects.toThrow("already exists");
  });

  it("disconnects an adapter", async () => {
    await registry.create(ethConfig);
    await registry.disconnect("ethereum", "mainnet");
    expect(registry.get("ethereum", "mainnet")).toBeUndefined();
  });

  it("disconnects all adapters", async () => {
    await registry.create(ethConfig);
    await registry.create(cosmosConfig);
    expect(registry.activeAdapters()).toHaveLength(2);

    await registry.disconnectAll();
    expect(registry.activeAdapters()).toHaveLength(0);
  });

  it("lists active adapters", async () => {
    await registry.create(ethConfig);
    await registry.create(cosmosConfig);

    const active = registry.activeAdapters();
    expect(active).toHaveLength(2);
    expect(active.map((a) => a.family).sort()).toEqual(["cosmos", "ethereum"]);
  });

  it("health checks all adapters", async () => {
    await registry.create(ethConfig);
    await registry.create(cosmosConfig);

    const results = await registry.healthCheckAll();
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.healthy)).toBe(true);
  });
});

describe("EthereumAdapter", () => {
  let adapter: EthereumAdapter;

  beforeEach(async () => {
    adapter = new EthereumAdapter();
    await adapter.connect(ethConfig);
  });

  it("connects and reports status", () => {
    expect(adapter.status).toBe("connected");
    expect(adapter.family).toBe("ethereum");
  });

  it("returns chain info", async () => {
    const result = await adapter.getInfo();
    expect(result.success).toBe(true);
    expect(result.data!.family).toBe("ethereum");
    expect(result.data!.latestBlock).toBeGreaterThan(0);
    expect(result.data!.extra.chainId).toBe(1);
  });

  it("handles Ethereum JSON-RPC queries", async () => {
    const result = await adapter.query("eth_blockNumber");
    expect(result.success).toBe(true);
    expect(typeof result.data).toBe("string");
  });

  it("returns error for unknown methods", async () => {
    const result = await adapter.query("unknown_method");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown method");
  });

  it("fails queries when disconnected", async () => {
    await adapter.disconnect();
    const result = await adapter.getInfo();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not connected");
  });

  it("reports health", async () => {
    const health = await adapter.healthCheck();
    expect(health.healthy).toBe(true);
  });
});

describe("CosmosAdapter", () => {
  let adapter: CosmosAdapter;

  beforeEach(async () => {
    adapter = new CosmosAdapter();
    await adapter.connect(cosmosConfig);
  });

  it("connects and reports status", () => {
    expect(adapter.status).toBe("connected");
    expect(adapter.family).toBe("cosmos");
  });

  it("returns chain info", async () => {
    const result = await adapter.getInfo();
    expect(result.success).toBe(true);
    expect(result.data!.family).toBe("cosmos");
    expect(result.data!.latestBlock).toBeGreaterThan(0);
    expect(result.data!.extra.validators).toBe(180);
  });

  it("handles Cosmos/Tendermint RPC queries", async () => {
    const result = await adapter.query("status");
    expect(result.success).toBe(true);
  });

  it("returns error for unknown methods", async () => {
    const result = await adapter.query("unknown_rpc");
    expect(result.success).toBe(false);
  });

  it("fails queries when disconnected", async () => {
    await adapter.disconnect();
    const result = await adapter.query("status");
    expect(result.success).toBe(false);
  });
});
