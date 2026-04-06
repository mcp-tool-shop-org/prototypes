/**
 * Mock: Health Sentinel Plugin
 *
 * Simulates node health monitoring. Registers an invariant that
 * checks whether nodes are healthy before allowing transitions.
 * Emits periodic health events.
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  LifecycleResult,
} from "../plugins/api.js";

export interface NodeHealth {
  nodeId: string;
  healthy: boolean;
  latencyMs: number;
}

export interface HealthCheckContext {
  nodes: NodeHealth[];
}

export class HealthSentinelPlugin implements Plugin {
  readonly manifest: PluginManifest = {
    id: "health-sentinel",
    name: "Health Sentinel",
    version: "0.1.0",
    capabilities: ["sentinel"],
    description: "Monitors node health and enforces liveness invariants",
  };

  private ctx!: PluginContext;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.ctx = ctx;

    // Register invariant: all nodes must be healthy for a transition
    ctx.invariants.register<HealthCheckContext>({
      name: "health.all-nodes-live",
      owner: this.manifest.id,
      description: "All nodes must report healthy status",
      check: (context) => {
        if (!context.nodes || context.nodes.length === 0) return true;
        return context.nodes.every((n) => n.healthy);
      },
    });

    // Register invariant: max latency threshold
    const maxLatency = (ctx.config.maxLatencyMs as number) ?? 5000;
    ctx.invariants.register<HealthCheckContext>({
      name: "health.latency-threshold",
      owner: this.manifest.id,
      description: `No node may exceed ${maxLatency}ms latency`,
      check: (context) => {
        if (!context.nodes || context.nodes.length === 0) return true;
        return context.nodes.every((n) => n.latencyMs <= maxLatency);
      },
    });

    ctx.log.info("Health invariants registered");
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.ctx.events.publish("health.sentinel.ready", this.manifest.id, {
      invariants: ["health.all-nodes-live", "health.latency-threshold"],
    });
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    return { ok: true };
  }
}

export const createHealthSentinel = () => new HealthSentinelPlugin();
