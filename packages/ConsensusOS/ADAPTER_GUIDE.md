# Adapter Development Guide

Chain adapters integrate external blockchain networks into ConsensusOS.

## ChainAdapter Interface

Every adapter implements:

```typescript
interface ChainAdapter {
  readonly chainId: string;      // e.g., "xrpl-mainnet", "ethereum-mainnet"
  readonly chainType: string;    // e.g., "xrpl", "ethereum", "cosmos"

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  getBlockHeight(): Promise<number>;
  getTransaction(hash: string): Promise<unknown>;
  submitTransaction(payload: unknown): Promise<string>;

  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}
```

## Creating an Adapter

### 1. Create the directory

```
src/adapters/solana/solana-adapter.ts
```

### 2. Implement the interface

```typescript
import type { ChainAdapter } from "../chain-adapter.js";

export class SolanaAdapter implements ChainAdapter {
  readonly chainId = "solana-mainnet";
  readonly chainType = "solana";

  private connected = false;

  async connect(): Promise<void> {
    // Connect to Solana RPC
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getBlockHeight(): Promise<number> {
    if (!this.connected) throw new Error("Not connected");
    // Call Solana RPC
    return 0;
  }

  async getTransaction(hash: string): Promise<unknown> {
    if (!this.connected) throw new Error("Not connected");
    return { hash, status: "confirmed" };
  }

  async submitTransaction(payload: unknown): Promise<string> {
    if (!this.connected) throw new Error("Not connected");
    return "solana-tx-hash-xxx";
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = performance.now();
    try {
      await this.getBlockHeight();
      return { healthy: true, latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { healthy: false, latencyMs: Math.round(performance.now() - start) };
    }
  }
}
```

### 3. Register with AdapterRegistry

```typescript
import { AdapterRegistry } from "./src/adapters/adapter-registry.js";
import { SolanaAdapter } from "./src/adapters/solana/solana-adapter.js";

const registry = new AdapterRegistry();
registry.register(new SolanaAdapter());

// Connect
await registry.connectAll();

// Use
const solana = registry.get("solana-mainnet");
const height = await solana.getBlockHeight();
```

### 4. Export from index.ts

```typescript
export { SolanaAdapter } from "./adapters/solana/solana-adapter.js";
```

### 5. Write tests

```typescript
// tests/solana-adapter.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { SolanaAdapter } from "../src/adapters/solana/solana-adapter.js";

describe("SolanaAdapter", () => {
  let adapter: SolanaAdapter;

  beforeEach(() => {
    adapter = new SolanaAdapter();
  });

  it("has correct chain metadata", () => {
    expect(adapter.chainId).toBe("solana-mainnet");
    expect(adapter.chainType).toBe("solana");
  });

  it("lifecycle: connect → use → disconnect", async () => {
    expect(adapter.isConnected()).toBe(false);
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);

    const height = await adapter.getBlockHeight();
    expect(typeof height).toBe("number");

    await adapter.disconnect();
    expect(adapter.isConnected()).toBe(false);
  });

  // ... more tests
});
```

## Existing Adapters

| Adapter | Chain ID | File |
|---------|----------|------|
| XRPL | `xrpl-mainnet` | `src/adapters/xrpl/xrpl-adapter.ts` |
| Ethereum | `ethereum-mainnet` | `src/adapters/ethereum/ethereum-adapter.ts` |
| Cosmos | `cosmos-mainnet` | `src/adapters/cosmos/cosmos-adapter.ts` |

## Rules

1. **Implement the full `ChainAdapter` interface** — all methods are required
2. **No module imports** — adapters are independent; only import from `chain-adapter.ts` and `core/`
3. **Handle disconnected state** — throw clear errors if called while disconnected
4. **Health checks** — must return latency information
5. **Idempotent connect/disconnect** — calling twice should not error
