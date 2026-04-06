/**
 * Ethereum Adapter (Prototype)
 *
 * Mock Ethereum adapter implementing the ChainAdapter interface.
 * In production this would use ethers.js/viem for JSON-RPC.
 * Here we simulate responses for testing and validation.
 */

import type {
  ChainAdapter,
  ChainConfig,
  ChainInfo,
  ChainQueryResult,
  ConnectionStatus,
} from "../chain-adapter.js";

export class EthereumAdapter implements ChainAdapter {
  readonly family = "ethereum" as const;
  private _status: ConnectionStatus = "disconnected";
  private config: ChainConfig | undefined;
  private blockNumber = 19_000_000;

  get status(): ConnectionStatus {
    return this._status;
  }

  async connect(config: ChainConfig): Promise<void> {
    this._status = "connecting";
    this.config = config;
    // Simulate connection delay
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
        family: "ethereum",
        networkId: this.config?.networkId ?? "mainnet",
        latestBlock: this.blockNumber++,
        nodeVersion: "Geth/v1.13.0-mock",
        extra: {
          chainId: 1,
          gasPrice: "30000000000",
          peerCount: 42,
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

    // Simulate common Ethereum JSON-RPC methods
    const responses: Record<string, unknown> = {
      eth_blockNumber: `0x${this.blockNumber.toString(16)}`,
      eth_chainId: "0x1",
      eth_gasPrice: "0x6FC23AC00",
      net_version: "1",
      web3_clientVersion: "Geth/v1.13.0-mock",
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
export function createEthereumAdapter(): EthereumAdapter {
  return new EthereumAdapter();
}
