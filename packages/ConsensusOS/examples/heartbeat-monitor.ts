/**
 * Example Plugin — Heartbeat Monitor
 *
 * A complete, working ConsensusOS plugin that demonstrates:
 * - Plugin interface implementation
 * - Event subscription and publication
 * - Invariant registration
 * - Configuration via PluginContext
 * - Factory pattern export
 *
 * Usage:
 *   import { createHeartbeatMonitor } from "./examples/heartbeat-monitor.js";
 *   loader.register(createHeartbeatMonitor());
 */

import type {
  Plugin,
  PluginContext,
  LifecycleResult,
} from "../src/plugins/api.js";

export class HeartbeatMonitor implements Plugin {
  readonly manifest = {
    id: "heartbeat-monitor",
    name: "Heartbeat Monitor",
    version: "1.0.0",
    capabilities: ["monitoring", "sentinel"] as const,
    dependencies: [] as const,
  };

  private ctx!: PluginContext;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private beatCount = 0;
  private readonly maxMissedBeats: number;

  constructor(maxMissedBeats = 3) {
    this.maxMissedBeats = maxMissedBeats;
  }

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.ctx = ctx;

    // Subscribe to heartbeat responses
    ctx.events.subscribe("heartbeat.pong", (event) => {
      const data = event.data as { nodeId: string };
      ctx.log.info(`Heartbeat received from ${data.nodeId}`);
      this.beatCount++;
    });

    // Register a liveness invariant
    ctx.invariants.register({
      name: "heartbeat.liveness",
      owner: this.manifest.id,
      description: `System is alive if beats received > 0`,
      check: () => this.beatCount > 0,
    });

    ctx.log.info("Heartbeat monitor initialized");
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.ctx.log.info("Starting heartbeat monitor");

    // Emit heartbeat ping every 5 seconds
    this.intervalId = setInterval(() => {
      this.ctx.events.publish("heartbeat.ping", this.manifest.id, {
        timestamp: new Date().toISOString(),
      });
    }, 5000);

    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.ctx.log.info(`Heartbeat monitor stopped. Total beats: ${this.beatCount}`);
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.beatCount = 0;
  }

  /** Get the current beat count */
  getBeatCount(): number {
    return this.beatCount;
  }
}

/** Factory function (recommended export pattern) */
export const createHeartbeatMonitor = (maxMissedBeats?: number) =>
  new HeartbeatMonitor(maxMissedBeats);
