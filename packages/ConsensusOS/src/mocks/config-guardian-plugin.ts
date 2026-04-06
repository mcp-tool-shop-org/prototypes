/**
 * Mock: Config Guardian Plugin
 *
 * Validates configuration schemas before transitions.
 * Depends on health-sentinel to demonstrate dependency resolution.
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  LifecycleResult,
} from "../plugins/api.js";

export interface ConfigValidationContext {
  config?: Record<string, unknown>;
  requiredKeys?: string[];
}

export class ConfigGuardianPlugin implements Plugin {
  readonly manifest: PluginManifest = {
    id: "config-guardian",
    name: "Config Guardian",
    version: "0.1.0",
    capabilities: ["guardian"],
    dependencies: ["health-sentinel"], // demonstrate dependency ordering
    description: "Validates configuration integrity",
  };

  private ctx!: PluginContext;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.ctx = ctx;

    ctx.invariants.register<ConfigValidationContext>({
      name: "config.required-keys-present",
      owner: this.manifest.id,
      description: "All required config keys must be present",
      check: (context) => {
        if (!context.requiredKeys || !context.config) return true;
        return context.requiredKeys.every((k) => k in context.config!);
      },
    });

    ctx.log.info("Config invariants registered");
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    // Subscribe to config change events
    this.ctx.events.subscribe("config.updated", (event) => {
      this.ctx.log.info("Config update detected", { data: event.data });
    });
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    return { ok: true };
  }
}

export const createConfigGuardian = () => new ConfigGuardianPlugin();
