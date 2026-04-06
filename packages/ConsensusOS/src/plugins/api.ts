/**
 * ConsensusOS Plugin API v1
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  FROZEN — Plugin API v1 is stable.                             ║
 * ║  No breaking changes permitted without a major version bump.   ║
 * ║  Additions must be backward-compatible (new optional fields).  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Every module in ConsensusOS is a plugin. Plugins declare their identity,
 * capabilities, and lifecycle hooks. The core loader discovers, validates,
 * and orchestrates plugin lifecycles. Plugins never call each other directly —
 * all inter-module communication flows through the event bus.
 */

/** Architecture version — bump only on structural changes */
export const ARCHITECTURE_VERSION = "1.0" as const;

/** Plugin API version — frozen at v1 */
export const PLUGIN_API_VERSION = "1.0" as const;

// ─── Plugin Identity ────────────────────────────────────────────────

/** Semantic version string (e.g. "1.0.0") */
export type SemVer = string;

/** Unique plugin identifier (e.g. "health-sentinel", "xrpl-adapter") */
export type PluginId = string;

/** Plugin capability tags used for dependency resolution */
export type Capability =
  | "adapter"         // chain adapter (XRPL, Ethereum, Cosmos…)
  | "sentinel"        // monitoring / diagnostics
  | "verifier"        // validation / attestation
  | "guardian"        // config / migration management
  | "sandbox"         // simulation / replay
  | "governor"        // resource / build control
  | string;           // extensible

/** Metadata every plugin must declare */
export interface PluginManifest {
  /** Unique identifier */
  readonly id: PluginId;
  /** Human-readable name */
  readonly name: string;
  /** Semantic version */
  readonly version: SemVer;
  /** Capability tags */
  readonly capabilities: readonly Capability[];
  /** IDs of plugins this plugin depends on (loaded first) */
  readonly dependencies?: readonly PluginId[];
  /** Short description */
  readonly description?: string;
}

// ─── Plugin Lifecycle ───────────────────────────────────────────────

/** Result of a lifecycle operation */
export interface LifecycleResult {
  readonly ok: boolean;
  readonly message?: string;
}

/**
 * The core plugin interface. Every module implements this.
 *
 * Lifecycle order: manifest → init → start → (running) → stop → destroy
 */
export interface Plugin {
  /** Static metadata — must be available before init */
  readonly manifest: PluginManifest;

  /**
   * Initialize the plugin. Receives the core context for accessing
   * the event bus, invariant engine, and configuration.
   * Called once after all dependencies are resolved.
   */
  init(ctx: PluginContext): Promise<LifecycleResult>;

  /**
   * Start the plugin. Called after all plugins have been initialized.
   * The plugin should begin its work (subscriptions, polling, etc.).
   */
  start(): Promise<LifecycleResult>;

  /**
   * Stop the plugin gracefully. Called during shutdown in reverse order.
   */
  stop(): Promise<LifecycleResult>;

  /**
   * Release all resources. Called after stop.
   * Optional — defaults to no-op if not implemented.
   */
  destroy?(): Promise<void>;
}

// ─── Plugin Context (injected by core) ──────────────────────────────

import type { EventBus } from "../core/event-bus.js";
import type { InvariantEngine } from "../core/invariant-engine.js";

/** Read-only configuration map */
export type PluginConfig = Readonly<Record<string, unknown>>;

/**
 * Context injected into every plugin during init.
 * This is the plugin's window into the core — no other access is permitted.
 */
export interface PluginContext {
  /** The event bus for publishing and subscribing to events */
  readonly events: EventBus;
  /** The invariant engine for registering and checking invariants */
  readonly invariants: InvariantEngine;
  /** Plugin-specific configuration (from config file or defaults) */
  readonly config: PluginConfig;
  /** Structured logger scoped to this plugin */
  readonly log: Logger;
}

// ─── Logger ─────────────────────────────────────────────────────────

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ─── Events ─────────────────────────────────────────────────────────

/** Base event envelope — every event on the bus has this shape */
export interface ConsensusEvent<T = unknown> {
  /** Dot-delimited topic (e.g. "health.check.completed") */
  readonly topic: string;
  /** ID of the plugin that emitted this event */
  readonly source: PluginId;
  /** ISO-8601 timestamp */
  readonly timestamp: string;
  /** Monotonic sequence number assigned by the event bus */
  readonly sequence: number;
  /** Event-specific payload */
  readonly data: T;
}

// ─── Plugin Factory ─────────────────────────────────────────────────

/**
 * A plugin module's default export must be a factory function.
 * This allows the core to control instantiation timing.
 */
export type PluginFactory = () => Plugin;
