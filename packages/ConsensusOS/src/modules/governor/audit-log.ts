/**
 * Execution Audit Log
 *
 * Immutable, append-only audit log for all governor actions.
 * Every token issuance, revocation, task execution, and policy
 * evaluation is recorded for forensic analysis and compliance.
 */

import type { AuditAction, AuditEntry } from "./types.js";

let auditCounter = 0;

export class AuditLog {
  private readonly entries: AuditEntry[] = [];

  /** Record an audit entry */
  record(action: AuditAction, actor: string, entityId: string, details: Record<string, unknown> = {}): AuditEntry {
    const entry: AuditEntry = {
      id: `audit-${++auditCounter}-${Date.now()}`,
      action,
      actor,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  /** Deep-clone an array of audit entries to prevent external mutation */
  private deepCopy(entries: AuditEntry[]): AuditEntry[] {
    return entries.map((e) => structuredClone(e));
  }

  /** Get all entries */
  all(): readonly AuditEntry[] {
    return this.deepCopy(this.entries);
  }

  /** Filter entries by action */
  byAction(action: AuditAction): readonly AuditEntry[] {
    return this.deepCopy(this.entries.filter((e) => e.action === action));
  }

  /** Filter entries by actor */
  byActor(actor: string): readonly AuditEntry[] {
    return this.deepCopy(this.entries.filter((e) => e.actor === actor));
  }

  /** Filter entries by entity */
  byEntity(entityId: string): readonly AuditEntry[] {
    return this.deepCopy(this.entries.filter((e) => e.entityId === entityId));
  }

  /** Filter entries within a time range (ISO-8601 strings) */
  byTimeRange(start: string, end: string): readonly AuditEntry[] {
    return this.deepCopy(this.entries.filter((e) => e.timestamp >= start && e.timestamp <= end));
  }

  /** Get the most recent N entries */
  recent(count: number): readonly AuditEntry[] {
    return this.deepCopy(this.entries.slice(-count));
  }

  /**
   * Verify audit completeness for an entity's lifecycle.
   * Tokens (entity IDs starting with "token-") expect: token.issued + a terminal action.
   * Tasks (entity IDs starting with "task-") expect: task.queued, task.started + a terminal action.
   * Unknown prefixes return complete (no expectations to violate).
   */
  verifyCompleteness(entityId: string): { complete: boolean; missing: string[] } {
    const entityEntries = this.entries.filter((e) => e.entityId === entityId);
    const actions = new Set(entityEntries.map((e) => e.action));
    const missing: string[] = [];

    if (entityId.startsWith("token-")) {
      if (!actions.has("token.issued")) missing.push("token.issued");
      const terminalActions = ["token.revoked", "token.consumed", "token.expired"];
      if (!terminalActions.some((a) => actions.has(a as AuditAction))) {
        missing.push("terminal(token.revoked|token.consumed|token.expired)");
      }
    } else if (entityId.startsWith("task-")) {
      if (!actions.has("task.queued")) missing.push("task.queued");
      if (!actions.has("task.started")) missing.push("task.started");
      const terminalActions = ["task.completed", "task.failed", "task.cancelled"];
      if (!terminalActions.some((a) => actions.has(a as AuditAction))) {
        missing.push("terminal(task.completed|task.failed|task.cancelled)");
      }
    }

    return { complete: missing.length === 0, missing };
  }

  /** Total number of entries */
  get size(): number {
    return this.entries.length;
  }

  /** Clear all entries (for testing only) */
  clear(): void {
    this.entries.length = 0;
  }
}
