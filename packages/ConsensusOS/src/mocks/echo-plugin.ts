/**
 * Mock: Echo Plugin
 *
 * Minimal plugin that subscribes to all events and re-emits them
 * with an "echo." prefix. Used to verify the event bus wiring.
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  LifecycleResult,
  ConsensusEvent,
} from "../plugins/api.js";
import type { Unsubscribe } from "../core/event-bus.js";

export class EchoPlugin implements Plugin {
  readonly manifest: PluginManifest = {
    id: "echo",
    name: "Echo Plugin",
    version: "0.1.0",
    capabilities: ["sentinel"],
    description: "Echoes all events for debugging",
  };

  private ctx!: PluginContext;
  private unsub: Unsubscribe | null = null;
  public readonly echoed: ConsensusEvent[] = [];

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.ctx = ctx;
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.unsub = this.ctx.events.subscribe("*", (event) => {
      // Don't echo our own echoes (infinite loop prevention)
      if (event.topic.startsWith("echo.")) return;
      this.echoed.push(event);
      this.ctx.log.debug(`Echo: ${event.topic}`, { seq: event.sequence });
    });
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    this.unsub?.();
    this.unsub = null;
    return { ok: true };
  }
}

export const createEchoPlugin = () => new EchoPlugin();
