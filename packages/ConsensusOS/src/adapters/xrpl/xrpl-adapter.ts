/**
 * XRPL Adapter v1
 *
 * Chain adapter for the XRP Ledger. Connects to XRPL nodes via
 * WebSocket JSON-RPC, provides server_info, ledger status, and
 * health reporting through the event bus.
 *
 * Capabilities: adapter
 * Events emitted: xrpl.connected, xrpl.disconnected, xrpl.server-info, xrpl.ledger-closed
 * Invariants: xrpl.node-responsive
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginConfig,
  LifecycleResult,
  Logger,
} from "../../plugins/api.js";
import type { EventBus } from "../../core/event-bus.js";

// ─── Types ──────────────────────────────────────────────────────────

export interface XrplNodeInfo {
  url: string;
  connected: boolean;
  serverState?: string;
  completeLedgers?: string;
  buildVersion?: string;
  networkId?: number;
  validatedLedger?: {
    seq: number;
    hash: string;
    closeTime: number;
  };
  peers?: number;
  loadFactor?: number;
  lastChecked: string;
  error?: string;
}

export interface XrplAdapterConfig {
  /** XRPL node WebSocket URLs */
  nodes?: string[];
  /** Poll interval in ms (0 = manual only, default: 0) */
  pollIntervalMs?: number;
  /** Connection timeout in ms (default: 10000) */
  timeoutMs?: number;
  /** Custom RPC call function (for testing / DI) */
  rpcCall?: (url: string, method: string, params?: Record<string, unknown>) => Promise<unknown>;
}

// ─── Default RPC Implementation ─────────────────────────────────────

/**
 * Sends a JSON-RPC request to an XRPL node over HTTP.
 * In production this would use WebSocket; for v1 we use the HTTP API
 * which all rippled nodes also expose.
 */
async function defaultRpcCall(
  url: string,
  method: string,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const httpUrl = url
    .replace("wss://", "https://")
    .replace("ws://", "http://");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(httpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        params: params ? [params] : [{}],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json() as { result?: Record<string, unknown> };
    return json.result ?? json;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class XrplAdapter implements Plugin {
  readonly manifest: PluginManifest = {
    id: "xrpl-adapter",
    name: "XRPL Adapter",
    version: "1.0.0",
    capabilities: ["adapter"],
    description: "Chain adapter for the XRP Ledger — server_info, ledger status, health reporting",
  };

  private events!: EventBus;
  private log!: Logger;
  private nodeUrls: string[] = [];
  private pollIntervalMs = 0;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private rpcCall!: (url: string, method: string, params?: Record<string, unknown>) => Promise<unknown>;
  private lastNodeInfo = new Map<string, XrplNodeInfo>();

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & XrplAdapterConfig;
    this.nodeUrls = raw.nodes ?? [];
    this.pollIntervalMs = raw.pollIntervalMs ?? 0;
    this.rpcCall = raw.rpcCall ?? defaultRpcCall;

    // Register adapter invariant
    ctx.invariants.register({
      name: "xrpl.node-responsive",
      owner: this.manifest.id,
      description: "At least one XRPL node must be responsive",
      check: () => {
        if (this.lastNodeInfo.size === 0) return true; // No nodes configured = vacuously true
        return [...this.lastNodeInfo.values()].some((n) => n.connected);
      },
    });

    this.log.info("XRPL Adapter initialized", { nodeCount: this.nodeUrls.length });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    // Fetch initial info if nodes are configured
    if (this.nodeUrls.length > 0) {
      await this.refreshAll();

      if (this.pollIntervalMs > 0) {
        this.pollHandle = setInterval(() => {
          this.refreshAll().catch((err) =>
            this.log.error("XRPL poll failed", { error: String(err) })
          );
        }, this.pollIntervalMs);
      }
    }

    this.events.publish("xrpl.adapter.ready", this.manifest.id, {
      nodeCount: this.nodeUrls.length,
    });

    this.log.info("XRPL Adapter started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    this.log.info("XRPL Adapter stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.lastNodeInfo.clear();
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get server_info from a specific node */
  async getServerInfo(url: string): Promise<XrplNodeInfo> {
    const now = new Date().toISOString();
    try {
      const result = await this.rpcCall(url, "server_info") as Record<string, unknown>;
      const info = (result?.info ?? result) as Record<string, unknown>;

      const validated = info.validated_ledger as Record<string, unknown> | undefined;

      const nodeInfo: XrplNodeInfo = {
        url,
        connected: true,
        serverState: info.server_state as string | undefined,
        completeLedgers: info.complete_ledgers as string | undefined,
        buildVersion: info.build_version as string | undefined,
        networkId: info.network_id as number | undefined,
        validatedLedger: validated
          ? {
              seq: validated.seq as number,
              hash: validated.hash as string,
              closeTime: validated.close_time as number,
            }
          : undefined,
        peers: info.peers as number | undefined,
        loadFactor: info.load_factor as number | undefined,
        lastChecked: now,
      };

      this.lastNodeInfo.set(url, nodeInfo);

      this.events.publish("xrpl.server-info", this.manifest.id, nodeInfo);
      return nodeInfo;
    } catch (err) {
      const nodeInfo: XrplNodeInfo = {
        url,
        connected: false,
        lastChecked: now,
        error: err instanceof Error ? err.message : String(err),
      };

      this.lastNodeInfo.set(url, nodeInfo);

      this.events.publish("xrpl.disconnected", this.manifest.id, {
        url,
        error: nodeInfo.error,
      });
      return nodeInfo;
    }
  }

  /** Refresh info for all configured nodes */
  async refreshAll(): Promise<XrplNodeInfo[]> {
    const results: XrplNodeInfo[] = [];
    for (const url of this.nodeUrls) {
      results.push(await this.getServerInfo(url));
    }
    return results;
  }

  /** Get cached info for all nodes */
  getCachedInfo(): Map<string, XrplNodeInfo> {
    return new Map(this.lastNodeInfo);
  }

  /** Get configured node URLs */
  getNodeUrls(): readonly string[] {
    return [...this.nodeUrls];
  }
}

/** Factory export */
export function createXrplAdapter(): Plugin {
  return new XrplAdapter();
}
