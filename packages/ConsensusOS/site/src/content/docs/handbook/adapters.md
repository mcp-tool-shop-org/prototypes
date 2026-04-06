---
title: Adapters
description: Multi-chain adapters for XRPL, Ethereum, and Cosmos.
sidebar:
  order: 4
---

ConsensusOS ships with adapters for three blockchain networks. Each adapter is a standard plugin that communicates through the event bus and respects the frozen Plugin API v1 contract.

## Available adapters

| Factory | Chain | Status |
|---------|-------|--------|
| `createXrplAdapter()` | XRPL | Implemented |
| `createEthereumAdapter()` | Ethereum | Implemented |
| `createCosmosAdapter()` | Cosmos | Implemented |

## Using an adapter

Register an adapter like any other plugin:

```ts
import {
  CoreLoader,
  createXrplAdapter,
  createEthereumAdapter,
} from "@mcptoolshop/consensus-os";

const loader = new CoreLoader();
loader.register(createXrplAdapter());
loader.register(createEthereumAdapter());
await loader.boot();
```

## CLI commands

```bash
npx consensusos adapters   # List and query chain adapters
```

## ChainAdapter interface

Every adapter implements the `ChainAdapter` interface, which provides a uniform abstraction across blockchain networks:

| Method | Description |
|--------|-------------|
| `connect(config)` | Connect to a chain network using `ChainConfig` (family, networkId, nodes) |
| `disconnect()` | Disconnect from the chain network |
| `getInfo()` | Get chain info (latest block, node version, chain-specific extras) |
| `query(method, params)` | Execute a raw chain-specific query |
| `healthCheck()` | Check connection health and latency |

Connection states: `disconnected` → `connecting` → `connected` (or `error`).

## AdapterRegistry

The `AdapterRegistry` manages adapter instances by chain family. Use it to register, look up, and iterate adapters when building multi-chain systems.

## Writing a custom adapter

Chain adapters follow the same plugin pattern as all other modules. Extend `BasePlugin`, declare the `adapter` capability, and implement the `ChainAdapter` interface in your lifecycle hooks.

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MySolanaAdapter extends BasePlugin {
  readonly manifest = ManifestBuilder.create("solana-adapter")
    .name("Solana Adapter")
    .version("1.0.0")
    .capability("adapter")
    .build();

  protected async onStart() {
    this.emit("solana-adapter.ready", { status: "connected" });
  }
}
```

See the [ADAPTER_GUIDE.md](https://github.com/mcp-tool-shop-org/ConsensusOS/blob/main/ADAPTER_GUIDE.md) for a complete walkthrough.
