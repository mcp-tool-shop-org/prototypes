/**
 * ConsensusOS Core Loader
 *
 * Discovers, validates, dependency-sorts, and orchestrates the lifecycle
 * of all plugins. The loader is the only component that touches plugins
 * directly — everything else goes through the event bus.
 *
 * Lifecycle:
 *   register → resolve → init (dependency order) → start → (running) → stop → destroy
 *
 * Properties:
 * - Topological sort for dependency resolution
 * - Cycle detection (hard fail)
 * - Fail-closed: if any mandatory plugin fails init, the entire system halts
 */

import type {
  Plugin,
  PluginConfig,
  PluginContext,
  PluginFactory,
  PluginId,
} from "../plugins/api.js";
import { CoreEventBus, type EventBus } from "./event-bus.js";
import { CoreInvariantEngine, type InvariantEngine } from "./invariant-engine.js";
import { createLogger } from "./logger.js";

// ─── Types ──────────────────────────────────────────────────────────

export type PluginState =
  | "registered"
  | "initialized"
  | "started"
  | "stopped"
  | "error";

interface ManagedPlugin {
  plugin: Plugin;
  state: PluginState;
  config: PluginConfig;
}

export interface LoaderOptions {
  /** Plugin-specific config keyed by plugin ID */
  configs?: Record<PluginId, PluginConfig>;
}

// ─── Core Loader ────────────────────────────────────────────────────

export class CoreLoader {
  private readonly plugins = new Map<PluginId, ManagedPlugin>();
  private readonly eventBus: CoreEventBus;
  private readonly invariantEngine: CoreInvariantEngine;
  private bootOrder: PluginId[] = [];
  private readonly log = createLogger("core");

  constructor(options?: LoaderOptions) {
    this.eventBus = new CoreEventBus();
    this.invariantEngine = new CoreInvariantEngine();
    this.configs = options?.configs ?? {};
  }

  private readonly configs: Record<PluginId, PluginConfig>;

  // ── Public API ──────────────────────────────────────────────────

  /** Access the shared event bus */
  get events(): EventBus {
    return this.eventBus;
  }

  /** Access the invariant engine */
  get invariants(): InvariantEngine {
    return this.invariantEngine;
  }

  /**
   * Register a plugin instance (or factory). Does NOT init yet.
   */
  register(pluginOrFactory: Plugin | PluginFactory): void {
    const plugin =
      typeof pluginOrFactory === "function" ? pluginOrFactory() : pluginOrFactory;

    const id = plugin.manifest.id;

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered.`);
    }

    this.plugins.set(id, {
      plugin,
      state: "registered",
      config: this.configs[id] ?? {},
    });

    this.log.info(`Registered plugin: ${id} v${plugin.manifest.version}`);
  }

  /**
   * Resolve dependency order, init all plugins, then start them.
   * This is the main boot sequence.
   */
  async boot(): Promise<void> {
    this.log.info(`Booting ConsensusOS with ${this.plugins.size} plugin(s)…`);

    // 1. Resolve dependency order
    this.bootOrder = this.resolveDependencies();
    this.log.info(`Boot order: ${this.bootOrder.join(" → ")}`);

    // 2. Init in dependency order
    for (const id of this.bootOrder) {
      await this.initPlugin(id);
    }

    // 3. Start in dependency order
    for (const id of this.bootOrder) {
      await this.startPlugin(id);
    }

    this.eventBus.publish("core.boot.complete", "core", {
      plugins: this.bootOrder,
    });

    this.log.info("Boot complete.");
  }

  /**
   * Graceful shutdown — stop and destroy in reverse boot order.
   */
  async shutdown(): Promise<void> {
    this.log.info("Shutting down…");

    const reversed = [...this.bootOrder].reverse();

    for (const id of reversed) {
      await this.stopPlugin(id);
    }

    for (const id of reversed) {
      const managed = this.plugins.get(id)!;
      if (managed.plugin.destroy) {
        await managed.plugin.destroy();
      }
    }

    this.eventBus.publish("core.shutdown.complete", "core", {});
    this.log.info("Shutdown complete.");
  }

  /** Get the state of a specific plugin */
  getState(id: PluginId): PluginState | undefined {
    return this.plugins.get(id)?.state;
  }

  /** Get all registered plugin IDs */
  pluginIds(): readonly PluginId[] {
    return [...this.plugins.keys()];
  }

  /** Get a plugin instance by ID */
  getPlugin(id: PluginId): Plugin | undefined {
    return this.plugins.get(id)?.plugin;
  }

  // ── Internal Lifecycle ──────────────────────────────────────────

  private async initPlugin(id: PluginId): Promise<void> {
    const managed = this.plugins.get(id)!;

    const ctx: PluginContext = {
      events: this.eventBus,
      invariants: this.invariantEngine,
      config: managed.config,
      log: createLogger(id),
    };

    const result = await managed.plugin.init(ctx);
    if (!result.ok) {
      managed.state = "error";
      throw new Error(
        `Plugin "${id}" failed to initialize: ${result.message ?? "unknown error"}`
      );
    }

    managed.state = "initialized";
    this.log.debug(`Initialized: ${id}`);
  }

  private async startPlugin(id: PluginId): Promise<void> {
    const managed = this.plugins.get(id)!;

    if (managed.state !== "initialized") {
      throw new Error(
        `Cannot start plugin "${id}" in state "${managed.state}"`
      );
    }

    const result = await managed.plugin.start();
    if (!result.ok) {
      managed.state = "error";
      throw new Error(
        `Plugin "${id}" failed to start: ${result.message ?? "unknown error"}`
      );
    }

    managed.state = "started";
    this.log.debug(`Started: ${id}`);
  }

  private async stopPlugin(id: PluginId): Promise<void> {
    const managed = this.plugins.get(id)!;

    if (managed.state !== "started") return; // already stopped or errored

    try {
      const result = await managed.plugin.stop();
      managed.state = "stopped";
      if (!result.ok) {
        this.log.warn(`Plugin "${id}" stop returned not-ok: ${result.message}`);
      }
    } catch (err) {
      managed.state = "error";
      this.log.error(`Plugin "${id}" threw during stop`, {
        error: String(err),
      });
    }
  }

  // ── Dependency Resolution ───────────────────────────────────────

  /**
   * Topological sort with cycle detection (Kahn's algorithm).
   */
  private resolveDependencies(): PluginId[] {
    const ids = [...this.plugins.keys()];

    // Build adjacency: dep → dependents (edges point from dependency to dependent)
    const inDegree = new Map<PluginId, number>();
    const graph = new Map<PluginId, PluginId[]>();

    for (const id of ids) {
      inDegree.set(id, 0);
      graph.set(id, []);
    }

    for (const id of ids) {
      const deps = this.plugins.get(id)!.plugin.manifest.dependencies ?? [];
      for (const dep of deps) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${id}" depends on "${dep}", which is not registered.`
          );
        }
        graph.get(dep)!.push(id);
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: PluginId[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: PluginId[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const dependent of graph.get(current) ?? []) {
        const newDeg = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDeg);
        if (newDeg === 0) queue.push(dependent);
      }
    }

    if (sorted.length !== ids.length) {
      const missing = ids.filter((id) => !sorted.includes(id));
      throw new Error(
        `Circular dependency detected involving: ${missing.join(", ")}`
      );
    }

    return sorted;
  }
}
