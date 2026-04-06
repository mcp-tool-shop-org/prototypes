/**
 * Config Guardian Module
 *
 * Configuration migration, diffing, and schema validation plugin.
 * Tracks config changes over time, validates against schemas,
 * and provides rollback capability.
 *
 * Capabilities: guardian
 * Events emitted: config.guardian.ready, config.validated, config.migration.applied, config.diff.computed
 * Invariants: config.required-keys-present, config.schema-valid
 * Dependencies: health-sentinel (for gated config deployment)
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

/** A config schema rule — validates a key's value */
export interface SchemaRule {
  key: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  validator?: (value: unknown) => boolean;
  description?: string;
}

/** A config migration — transforms config from one version to another */
export interface ConfigMigration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (config: Record<string, unknown>) => Record<string, unknown>;
}

/** Result of a config diff */
export interface ConfigDiff {
  added: string[];
  removed: string[];
  changed: Array<{ key: string; oldValue: unknown; newValue: unknown }>;
  unchanged: string[];
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ key: string; message: string }>;
  checkedAt: string;
}

export interface ConfigGuardianConfig {
  /** Required config keys */
  requiredKeys?: string[];
  /** Schema rules */
  schema?: SchemaRule[];
  /** Registered migrations */
  migrations?: ConfigMigration[];
  /** Current config version */
  configVersion?: string;
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class ConfigGuardian implements Plugin {
  readonly manifest: PluginManifest = {
    id: "config-guardian",
    name: "Config Guardian",
    version: "1.0.0",
    capabilities: ["guardian"],
    dependencies: ["health-sentinel"],
    description: "Configuration migration, diffing, and schema validation",
  };

  private events!: EventBus;
  private log!: Logger;
  private requiredKeys: string[] = [];
  private schema: SchemaRule[] = [];
  private migrations: ConfigMigration[] = [];
  private configVersion = "0.0.0";
  private configHistory: Array<{ config: Record<string, unknown>; version: string; timestamp: string }> = [];

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & ConfigGuardianConfig;
    this.requiredKeys = raw.requiredKeys ?? [];
    this.schema = raw.schema ?? [];
    this.migrations = raw.migrations ?? [];
    this.configVersion = raw.configVersion ?? "0.0.0";

    // Register invariants
    ctx.invariants.register({
      name: "config.required-keys-present",
      owner: this.manifest.id,
      description: "All required configuration keys must be present",
      check: (context: unknown) => {
        if (!context || typeof context !== "object") return true;
        const cfg = context as Record<string, unknown>;
        return this.requiredKeys.every((k) => k in cfg);
      },
    });

    ctx.invariants.register({
      name: "config.schema-valid",
      owner: this.manifest.id,
      description: "Configuration must conform to declared schema",
      check: (context: unknown) => {
        if (!context || typeof context !== "object") return true;
        const result = this.validate(context as Record<string, unknown>);
        return result.valid;
      },
    });

    this.log.info("Config Guardian initialized", {
      requiredKeys: this.requiredKeys.length,
      schemaRules: this.schema.length,
      migrations: this.migrations.length,
    });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.events.publish("config.guardian.ready", this.manifest.id, {
      configVersion: this.configVersion,
    });

    // Listen for config updates
    this.events.subscribe("config.updated", (event) => {
      const data = event.data as { config: Record<string, unknown> };
      if (data?.config) {
        const result = this.validate(data.config);
        this.events.publish("config.validated", this.manifest.id, result);
      }
    });

    this.log.info("Config Guardian started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    this.log.info("Config Guardian stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.configHistory = [];
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Validate a config object against the schema */
  validate(config: Record<string, unknown>): ValidationResult {
    const errors: Array<{ key: string; message: string }> = [];

    // Check required keys
    for (const key of this.requiredKeys) {
      if (!(key in config)) {
        errors.push({ key, message: `Required key "${key}" is missing` });
      }
    }

    // Check schema rules
    for (const rule of this.schema) {
      const value = config[rule.key];

      if (value === undefined) {
        if (rule.required) {
          errors.push({ key: rule.key, message: `Required key "${rule.key}" is missing` });
        }
        continue;
      }

      // Type check
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== rule.type) {
        errors.push({
          key: rule.key,
          message: `Expected type "${rule.type}" but got "${actualType}"`,
        });
        continue;
      }

      // Custom validator
      if (rule.validator && !rule.validator(value)) {
        errors.push({
          key: rule.key,
          message: rule.description ?? `Custom validation failed for "${rule.key}"`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      checkedAt: new Date().toISOString(),
    };
  }

  /** Compute diff between two config objects */
  diff(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): ConfigDiff {
    const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];
    const unchanged: string[] = [];

    for (const key of allKeys) {
      const inOld = key in oldConfig;
      const inNew = key in newConfig;

      if (!inOld && inNew) {
        added.push(key);
      } else if (inOld && !inNew) {
        removed.push(key);
      } else if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
        changed.push({ key, oldValue: oldConfig[key], newValue: newConfig[key] });
      } else {
        unchanged.push(key);
      }
    }

    return { added, removed, changed, unchanged };
  }

  /** Apply migrations from current version to target version */
  applyMigrations(
    config: Record<string, unknown>,
    fromVersion?: string,
    toVersion?: string,
  ): { config: Record<string, unknown>; appliedMigrations: string[] } {
    const from = fromVersion ?? this.configVersion;
    let current = { ...config };
    const applied: string[] = [];

    // Sort migrations and apply in sequence
    const applicable = this.migrations
      .filter((m) => m.fromVersion >= from && (!toVersion || m.toVersion <= toVersion))
      .sort((a, b) => a.fromVersion.localeCompare(b.fromVersion));

    for (const migration of applicable) {
      const before = { ...current };
      current = migration.migrate(current);
      applied.push(`${migration.fromVersion} → ${migration.toVersion}: ${migration.description}`);

      this.configHistory.push({
        config: before,
        version: migration.fromVersion,
        timestamp: new Date().toISOString(),
      });

      this.events.publish("config.migration.applied", this.manifest.id, {
        from: migration.fromVersion,
        to: migration.toVersion,
        description: migration.description,
      });
    }

    if (applicable.length > 0) {
      this.configVersion = applicable[applicable.length - 1].toVersion;
    }

    return { config: current, appliedMigrations: applied };
  }

  /** Get config version history */
  getHistory(): ReadonlyArray<{ config: Record<string, unknown>; version: string; timestamp: string }> {
    return [...this.configHistory];
  }

  /** Get current config version */
  getConfigVersion(): string {
    return this.configVersion;
  }
}

/** Factory export */
export function createConfigGuardian(): Plugin {
  return new ConfigGuardian();
}
