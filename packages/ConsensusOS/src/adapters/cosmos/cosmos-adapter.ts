/**
 * Cosmos Adapter (Prototype)
 *
 * Mock Cosmos SDK adapter implementing the ChainAdapter interface.
 * In production this would use @cosmjs for Tendermint RPC.
 * Here we simulate responses for testing and validation.
 */

import type {
  ChainAdapter,
  ChainConfig,
  ChainInfo,
  ChainQueryResult,
  ConnectionStatus,
} from "../chain-adapter.js";

export class CosmosAdapter implements ChainAdapter {
  readonly family = "cosmos" as const;
  private _status: ConnectionStatus = "disconnected";
  private config: ChainConfig | undefined;
  private blockHeight = 18_500_000;

  get status(): ConnectionStatus {
    return this._status;
  }

  async connect(config: ChainConfig): Promise<void> {
    this._status = "connecting";
    this.config = config;
    await new Promise((r) => setTimeout(r, 1));
    this._status = "connected";
  }

  async disconnect(): Promise<void> {
    this._status = "disconnected";
    this.config = undefined;
  }

  async getInfo(): Promise<ChainQueryResult<ChainInfo>> {
    if (this._status !== "connected") {
      return { success: false, error: "Not connected", latencyMs: 0 };
    }

    const start = performance.now();
    return {
      success: true,
      data: {
        family: "cosmos",
        networkId: this.config?.networkId ?? "cosmoshub-4",
        latestBlock: this.blockHeight++,
        nodeVersion: "CometBFT/v0.38.0-mock",
        extra: {
          chainId: this.config?.networkId ?? "cosmoshub-4",
          votingPower: "150000000",
          validators: 180,
          bondedTokens: "300000000uatom",
        },
      },
      latencyMs: Math.round(performance.now() - start),
      respondingNode: this.config?.nodes[0]?.url,
    };
  }

  async query<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<ChainQueryResult<T>> {
    if (this._status !== "connected") {
      return { success: false, error: "Not connected", latencyMs: 0 };
    }

    const start = performance.now();

    // Simulate common Cosmos/Tendermint RPC methods
    const responses: Record<string, unknown> = {
      status: {
        node_info: { network: this.config?.networkId, version: "0.38.0" },
        sync_info: { latest_block_height: String(this.blockHeight), catching_up: false },
      },
      abci_info: {
        response: { version: "1.0.0", app_version: "1", last_block_height: String(this.blockHeight) },
      },
      net_info: { listening: true, n_peers: "45" },
      validators: { block_height: String(this.blockHeight), validators: [], count: "180", total: "180" },
    };

    const data = responses[method];
    if (data === undefined) {
      return {
        success: false,
        error: `Unknown method: ${method}`,
        latencyMs: Math.round(performance.now() - start),
      };
    }

    return {
      success: true,
      data: data as T,
      latencyMs: Math.round(performance.now() - start),
      respondingNode: this.config?.nodes[0]?.url,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = performance.now();
    if (this._status !== "connected") {
      return { healthy: false, latencyMs: 0 };
    }
    return { healthy: true, latencyMs: Math.round(performance.now() - start) };
  }
}

/** Factory function */
export function createCosmosAdapter(): CosmosAdapter {
  return new CosmosAdapter();
}
