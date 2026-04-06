/**
 * Health Sentinel Module
 *
 * Real node diagnostics plugin. Monitors endpoints, tracks latency,
 * reports node health via events, and enforces health invariants.
 *
 * Capabilities: sentinel
 * Events emitted: health.sentinel.ready, health.check.completed, health.node.down
 * Invariants: health.all-nodes-reachable, health.latency-threshold
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
import type { InvariantEngine } from "../../core/invariant-engine.js";

// ─── Types ──────────────────────────────────────────────────────────

export interface NodeEndpoint {
  /** Unique identifier for the node */
  id: string;
  /** URL or host:port to probe */
  url: string;
  /** Optional label */
  label?: string;
}

export interface NodeHealthResult {
  nodeId: string;
  url: string;
  reachable: boolean;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

export interface HealthCheckReport {
  nodes: NodeHealthResult[];
  allHealthy: boolean;
  avgLatencyMs: number;
  maxLatencyMs: number;
  checkedAt: string;
}

export interface HealthSentinelConfig {
  /** Node endpoints to monitor */
  nodes?: NodeEndpoint[];
  /** Maximum acceptable latency in ms (default: 5000) */
  maxLatencyMs?: number;
  /** Probe interval in ms for automatic checks (0 = manual only) */
  intervalMs?: number;
  /** Custom probe function (for testing / DI) */
  probe?: (url: string) => Promise<{ reachable: boolean; latencyMs: number; error?: string }>;
}

// ─── Default HTTP Probe ─────────────────────────────────────────────

async function defaultProbe(url: string): Promise<{ reachable: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, { signal: controller.signal, method: "GET" });
    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);
    return { reachable: res.ok || res.status < 500, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      reachable: false,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class HealthSentinel implements Plugin {
  readonly manifest: PluginManifest = {
    id: "health-sentinel",
    name: "Health Sentinel",
    version: "1.0.0",
    capabilities: ["sentinel"],
    description: "Node diagnostics — monitors endpoints, tracks latency, enforces health invariants",
  };

  private events!: EventBus;
  private log!: Logger;
  private config!: HealthSentinelConfig;
  private probe!: (url: string) => Promise<{ reachable: boolean; latencyMs: number; error?: string }>;
  private nodes: NodeEndpoint[] = [];
  private maxLatencyMs = 5000;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private lastReport: HealthCheckReport | null = null;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & HealthSentinelConfig;
    this.config = raw;
    this.nodes = raw.nodes ?? [];
    this.maxLatencyMs = raw.maxLatencyMs ?? 5000;
    this.probe = raw.probe ?? defaultProbe;

    // Register health invariants
    ctx.invariants.register({
      name: "health.all-nodes-reachable",
      owner: this.manifest.id,
      description: "All monitored nodes must be reachable",
      check: () => this.lastReport?.allHealthy ?? true,
    });

    ctx.invariants.register({
      name: "health.latency-threshold",
      owner: this.manifest.id,
      description: `Max latency must stay below ${this.maxLatencyMs}ms`,
      check: () => (this.lastReport?.maxLatencyMs ?? 0) <= this.maxLatencyMs,
    });

    this.log.info("Health Sentinel initialized", { nodeCount: this.nodes.length });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.events.publish("health.sentinel.ready", this.manifest.id, {
      nodeCount: this.nodes.length,
    });

    // Run initial check if nodes are configured
    if (this.nodes.length > 0) {
      await this.runCheck();

      // Set up interval if configured
      const intervalMs = this.config.intervalMs ?? 0;
      if (intervalMs > 0) {
        this.intervalHandle = setInterval(() => {
          this.runCheck().catch((err) =>
            this.log.error("Health check failed", { error: String(err) })
          );
        }, intervalMs);
      }
    }

    this.log.info("Health Sentinel started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.log.info("Health Sentinel stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.lastReport = null;
  }

  // ── Public API (accessible via plugin reference) ────────────────

  /** Run a health check against all configured nodes */
  async runCheck(): Promise<HealthCheckReport> {
    const results: NodeHealthResult[] = [];

    for (const node of this.nodes) {
      const probeResult = await this.probe(node.url);
      results.push({
        nodeId: node.id,
        url: node.url,
        reachable: probeResult.reachable,
        latencyMs: probeResult.latencyMs,
        checkedAt: new Date().toISOString(),
        error: probeResult.error,
      });
    }

    const allHealthy = results.every((r) => r.reachable);
    const latencies = results.map((r) => r.latencyMs);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : 0;

    const report: HealthCheckReport = {
      nodes: results,
      allHealthy,
      avgLatencyMs,
      maxLatencyMs,
      checkedAt: new Date().toISOString(),
    };

    this.lastReport = report;

    this.events.publish("health.check.completed", this.manifest.id, report);

    // Emit per-node down events
    for (const r of results) {
      if (!r.reachable) {
        this.events.publish("health.node.down", this.manifest.id, {
          nodeId: r.nodeId,
          url: r.url,
          error: r.error,
        });
      }
    }

    return report;
  }

  /** Get the last health check report */
  getLastReport(): HealthCheckReport | null {
    return this.lastReport;
  }
}

/** Factory export */
export function createHealthSentinel(): Plugin {
  return new HealthSentinel();
}
