/**
 * ConsensusOS Invariant Engine
 *
 * Fail-closed enforcement of system invariants. Plugins register invariants
 * (named boolean predicates) that are checked before state transitions.
 * If ANY invariant fails, the transition is rejected — never partially applied.
 *
 * This is the Registrum integration point: structural governance rules
 * that constrain what the system is allowed to do.
 *
 * Properties:
 * - Fail-closed: unknown state → reject
 * - Deterministic: same inputs → same verdict
 * - Append-only: invariant registrations cannot be removed at runtime
 * - Auditable: every check is logged with full context
 */

import type { PluginId } from "../plugins/api.js";

// ─── Types ──────────────────────────────────────────────────────────

/** An invariant is a named predicate that must hold true */
export interface Invariant<T = unknown> {
  /** Unique invariant name (e.g. "config.schema-valid") */
  readonly name: string;
  /** Plugin that registered this invariant */
  readonly owner: PluginId;
  /** Human-readable description of what this invariant enforces */
  readonly description: string;
  /** The predicate. Returns true if the invariant holds. */
  check(context: T): boolean | Promise<boolean>;
}

/** Result of checking one invariant */
export interface InvariantResult {
  readonly name: string;
  readonly owner: PluginId;
  readonly passed: boolean;
  readonly timestamp: string;
}

/** Result of checking all invariants for a transition */
export interface TransitionVerdict {
  /** True only if ALL invariants passed */
  readonly allowed: boolean;
  /** Individual results */
  readonly results: readonly InvariantResult[];
  /** Invariants that failed (empty if allowed) */
  readonly violations: readonly InvariantResult[];
  /** ISO-8601 timestamp of the verdict */
  readonly timestamp: string;
}

/** Invariant engine interface exposed to plugins */
export interface InvariantEngine {
  /**
   * Register an invariant. Once registered, it is checked on every
   * transition for its lifetime. Cannot be unregistered at runtime.
   */
  register<T = unknown>(invariant: Invariant<T>): void;

  /**
   * Check all registered invariants against the given context.
   * Returns a verdict: allowed (all pass) or rejected (any fail).
   */
  check<T = unknown>(context: T): Promise<TransitionVerdict>;

  /**
   * Get all registered invariant names.
   */
  registered(): readonly string[];

  /**
   * Get the full audit log of past verdicts.
   */
  auditLog(): readonly TransitionVerdict[];
}

// ─── Implementation ─────────────────────────────────────────────────

export class CoreInvariantEngine implements InvariantEngine {
  private readonly invariants: Invariant<unknown>[] = [];
  private readonly verdicts: TransitionVerdict[] = [];

  register<T = unknown>(invariant: Invariant<T>): void {
    // Enforce uniqueness
    if (this.invariants.some((i) => i.name === invariant.name)) {
      throw new Error(
        `Invariant "${invariant.name}" is already registered (owner: ${invariant.owner}). ` +
        `Invariants are append-only and cannot be replaced.`
      );
    }
    this.invariants.push(invariant as Invariant<unknown>);
  }

  async check<T = unknown>(context: T): Promise<TransitionVerdict> {
    const now = new Date().toISOString();
    const results: InvariantResult[] = [];

    for (const inv of this.invariants) {
      let passed: boolean;
      try {
        const result = inv.check(context);
        passed = result instanceof Promise ? await result : result;
      } catch {
        // Fail-closed: if a check throws, the invariant fails
        passed = false;
      }

      results.push({
        name: inv.name,
        owner: inv.owner,
        passed,
        timestamp: now,
      });
    }

    const violations = results.filter((r) => !r.passed);
    const verdict: TransitionVerdict = {
      allowed: violations.length === 0,
      results,
      violations,
      timestamp: now,
    };

    this.verdicts.push(verdict);
    return verdict;
  }

  registered(): readonly string[] {
    return this.invariants.map((i) => i.name);
  }

  auditLog(): readonly TransitionVerdict[] {
    return [...this.verdicts];
  }
}
