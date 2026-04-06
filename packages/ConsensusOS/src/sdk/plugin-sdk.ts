/**
 * Plugin SDK
 *
 * Public SDK for building ConsensusOS plugins. Provides base classes,
 * helper utilities, and type-safe builders that simplify plugin
 * development. External developers use this SDK to create plugins
 * without depending on internal core modules.
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  LifecycleResult,
  Logger,
  ConsensusEvent,
  Capability,
} from "../plugins/api.js";
import type { EventBus } from "../core/event-bus.js";
import type { InvariantEngine, Invariant } from "../core/invariant-engine.js";

// ─── Base Plugin ────────────────────────────────────────────────────

/**
 * Abstract base class for plugins. Provides sensible defaults
 * for lifecycle methods and convenient accessors.
 */
export abstract class BasePlugin implements Plugin {
  abstract readonly manifest: PluginManifest;

  protected events!: EventBus;
  protected log!: Logger;
  protected invariants!: InvariantEngine;
  protected config: Record<string, unknown> = {};

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;
    this.invariants = ctx.invariants;
    this.config = (ctx.config ?? {}) as Record<string, unknown>;

    await this.onInit(ctx);
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    await this.onStart();
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    await this.onStop();
    return { ok: true };
  }

  async destroy(): Promise<void> {
    await this.onDestroy();
  }

  // Override these in subclasses
  protected async onInit(_ctx: PluginContext): Promise<void> {}
  protected async onStart(): Promise<void> {}
  protected async onStop(): Promise<void> {}
  protected async onDestroy(): Promise<void> {}

  // ── Convenience Methods ─────────────────────────────────────────

  /** Publish an event through the event bus */
  protected emit(topic: string, data: Record<string, unknown> = {}): void {
    this.events.publish(topic, this.manifest.id, data);
  }

  /** Subscribe to an event topic */
  protected on(topic: string, handler: (event: ConsensusEvent) => void): void {
    this.events.subscribe(topic, handler);
  }

  /** Register an invariant */
  protected registerInvariant(
    name: string,
    description: string,
    check: () => boolean | Promise<boolean>,
  ): void {
    this.invariants.register({
      name,
      owner: this.manifest.id,
      description,
      check,
    });
  }
}

// ─── Manifest Builder ───────────────────────────────────────────────

/**
 * Fluent builder for plugin manifests.
 *
 * @example
 * ```ts
 * const manifest = ManifestBuilder.create("my-plugin")
 *   .name("My Plugin")
 *   .version("1.0.0")
 *   .capability("monitoring")
 *   .dependency("health-sentinel")
 *   .build();
 * ```
 */
export class ManifestBuilder {
  private _id: string;
  private _name = "";
  private _version = "1.0.0";
  private _description = "";
  private _capabilities: Capability[] = [];
  private _dependencies: string[] = [];

  private constructor(id: string) {
    this._id = id;
    this._name = id;
  }

  static create(id: string): ManifestBuilder {
    return new ManifestBuilder(id);
  }

  name(name: string): this {
    this._name = name;
    return this;
  }

  version(version: string): this {
    this._version = version;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  capability(cap: Capability): this {
    this._capabilities.push(cap);
    return this;
  }

  dependency(dep: string): this {
    this._dependencies.push(dep);
    return this;
  }

  build(): PluginManifest {
    return {
      id: this._id,
      name: this._name,
      version: this._version,
      capabilities: this._capabilities,
      description: this._description,
      dependencies: this._dependencies.length > 0 ? this._dependencies : undefined,
    };
  }
}

// ─── Plugin Validator ───────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate a plugin before registration */
export function validatePlugin(plugin: Plugin): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check manifest
  if (!plugin.manifest) {
    errors.push("Plugin must have a manifest");
    return { valid: false, errors, warnings };
  }

  const m = plugin.manifest;
  if (!m.id || typeof m.id !== "string") {
    errors.push("Manifest must have a non-empty string 'id'");
  }
  if (m.id && !/^[a-z][a-z0-9-]*$/.test(m.id)) {
    errors.push("Manifest 'id' must be lowercase alphanumeric with hyphens (e.g., 'my-plugin')");
  }
  if (!m.name) {
    warnings.push("Manifest should have a 'name'");
  }
  if (!m.version) {
    errors.push("Manifest must have a 'version'");
  }
  if (m.version && !/^\d+\.\d+\.\d+/.test(m.version)) {
    warnings.push("Manifest 'version' should follow semver (e.g., '1.0.0')");
  }
  if (!m.capabilities || m.capabilities.length === 0) {
    warnings.push("Manifest should declare at least one capability");
  }

  // Check lifecycle methods
  if (typeof plugin.init !== "function") {
    errors.push("Plugin must implement init()");
  }
  if (typeof plugin.start !== "function") {
    errors.push("Plugin must implement start()");
  }
  if (typeof plugin.stop !== "function") {
    errors.push("Plugin must implement stop()");
  }

  return { valid: errors.length === 0, errors, warnings };
}
