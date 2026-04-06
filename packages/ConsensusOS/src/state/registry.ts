/**
 * ConsensusOS State Registry
 *
 * Structured state persistence layer. Every state mutation is recorded
 * as an immutable entry with a monotonic version number, enabling
 * deterministic replay and audit.
 *
 * Properties:
 * - Append-only transition log
 * - Versioned key-value store
 * - JSON-serializable snapshots
 * - Deterministic: same transitions → same final state
 */

import type { PluginId } from "../plugins/api.js";

// ─── Types ──────────────────────────────────────────────────────────

/** A single state entry */
export interface StateEntry<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly version: number;
  readonly updatedBy: PluginId;
  readonly timestamp: string;
}

/** A recorded state transition */
export interface StateTransition<T = unknown> {
  readonly key: string;
  readonly previousValue: T | undefined;
  readonly newValue: T;
  readonly version: number;
  readonly updatedBy: PluginId;
  readonly timestamp: string;
}

/** Serializable snapshot of all state */
export interface StateSnapshot {
  readonly entries: Record<string, StateEntry>;
  readonly version: number;
  readonly timestamp: string;
}

/** State registry interface */
export interface StateRegistry {
  /** Get a value by key */
  get<T = unknown>(key: string): T | undefined;

  /** Get full entry metadata */
  getEntry(key: string): StateEntry | undefined;

  /** Set a value, recording the transition */
  set<T>(key: string, value: T, updatedBy: PluginId): StateTransition<T>;

  /** Delete a key, recording the transition */
  delete(key: string, updatedBy: PluginId): boolean;

  /** Check if a key exists */
  has(key: string): boolean;

  /** Get all keys */
  keys(): readonly string[];

  /** Get the full transition log */
  transitions(): readonly StateTransition[];

  /** Take a point-in-time snapshot */
  snapshot(): StateSnapshot;

  /** Restore from a snapshot */
  restore(snapshot: StateSnapshot): void;

  /** Current global version number */
  version(): number;
}

// ─── Implementation ─────────────────────────────────────────────────

export class CoreStateRegistry implements StateRegistry {
  private readonly store = new Map<string, StateEntry>();
  private readonly log: StateTransition[] = [];
  private currentVersion = 0;

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key)?.value as T | undefined;
  }

  getEntry(key: string): StateEntry | undefined {
    return this.store.get(key);
  }

  set<T>(key: string, value: T, updatedBy: PluginId): StateTransition<T> {
    const prev = this.store.get(key);
    const version = ++this.currentVersion;
    const now = new Date().toISOString();

    const entry: StateEntry<T> = {
      key,
      value,
      version,
      updatedBy,
      timestamp: now,
    };

    const transition: StateTransition<T> = {
      key,
      previousValue: prev?.value as T | undefined,
      newValue: value,
      version,
      updatedBy,
      timestamp: now,
    };

    this.store.set(key, entry as StateEntry);
    this.log.push(transition as StateTransition);
    return transition;
  }

  delete(key: string, updatedBy: PluginId): boolean {
    const prev = this.store.get(key);
    if (!prev) return false;

    const version = ++this.currentVersion;
    const transition: StateTransition = {
      key,
      previousValue: prev.value,
      newValue: undefined as unknown,
      version,
      updatedBy,
      timestamp: new Date().toISOString(),
    };

    this.store.delete(key);
    this.log.push(transition);
    return true;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  keys(): readonly string[] {
    return [...this.store.keys()];
  }

  transitions(): readonly StateTransition[] {
    return [...this.log];
  }

  snapshot(): StateSnapshot {
    const entries: Record<string, StateEntry> = {};
    for (const [key, entry] of this.store) {
      entries[key] = entry;
    }
    return {
      entries,
      version: this.currentVersion,
      timestamp: new Date().toISOString(),
    };
  }

  restore(snapshot: StateSnapshot): void {
    this.store.clear();
    this.currentVersion = snapshot.version;
    for (const [key, entry] of Object.entries(snapshot.entries)) {
      this.store.set(key, entry);
    }
  }

  version(): number {
    return this.currentVersion;
  }
}
