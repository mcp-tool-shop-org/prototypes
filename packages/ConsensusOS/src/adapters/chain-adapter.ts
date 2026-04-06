/**
 * Chain Adapter Framework Types
 *
 * Defines the multi-chain adapter abstraction that lets ConsensusOS
 * connect to any blockchain network (XRPL, Ethereum, Cosmos, etc.)
 * through a uniform interface.
 */

// ─── Chain Adapter Interface ────────────────────────────────────────

/** Supported chain families (extensible via string) */
export type ChainFamily = "xrpl" | "ethereum" | "cosmos" | string;

/** Connection status of a chain adapter */
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

/** A node endpoint for a chain adapter */
export interface ChainNode {
  /** Node URL (HTTP/WebSocket) */
  url: string;
  /** Optional label */
  label?: string;
  /** Whether this is the primary node */
  primary?: boolean;
}

/** Chain-specific configuration */
export interface ChainConfig {
  /** Chain family */
  family: ChainFamily;
  /** Chain/network ID (e.g., "mainnet", "testnet") */
  networkId: string;
  /** Nodes to connect to */
  nodes: ChainNode[];
  /** Additional chain-specific options */
  options?: Record<string, unknown>;
}

/** Result of a chain query */
export interface ChainQueryResult<T = unknown> {
  /** Whether the query succeeded */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Latency in ms */
  latencyMs: number;
  /** Which node responded */
  respondingNode?: string;
}

/** Generic chain info response */
export interface ChainInfo {
  /** Chain family */
  family: ChainFamily;
  /** Network ID */
  networkId: string;
  /** Latest block/ledger number */
  latestBlock: number;
  /** Node software version */
  nodeVersion: string;
  /** Additional chain-specific info */
  extra: Record<string, unknown>;
}

/** Chain adapter interface — all chain adapters implement this */
export interface ChainAdapter {
  /** Chain family this adapter supports */
  readonly family: ChainFamily;
  /** Current connection status */
  readonly status: ConnectionStatus;
  /** Connect to the chain network */
  connect(config: ChainConfig): Promise<void>;
  /** Disconnect from the chain network */
  disconnect(): Promise<void>;
  /** Get chain info (latest block, version, etc.) */
  getInfo(): Promise<ChainQueryResult<ChainInfo>>;
  /** Execute a raw chain-specific query */
  query<T = unknown>(method: string, params?: Record<string, unknown>): Promise<ChainQueryResult<T>>;
  /** Get the health/status of the connection */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}

// ─── Adapter Registry ───────────────────────────────────────────────

/** Factory function to create a chain adapter */
export type ChainAdapterFactory = (config: ChainConfig) => ChainAdapter;
