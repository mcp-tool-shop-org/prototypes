/**
 * Snapshot Serializer
 *
 * Captures and restores full system state. Snapshots are immutable,
 * checksummed, and JSON-serializable. Used by the sandbox engine
 * for rollback, diff computation, and deterministic replay.
 */

import { createHash } from "node:crypto";
import type { ConsensusEvent } from "../../plugins/api.js";
import type { Snapshot, AmendmentState, StateDiff } from "./types.js";

let snapCounter = 0;

export class SnapshotSerializer {
  private readonly snapshots = new Map<string, Snapshot>();

  /**
   * Capture a snapshot of the current state.
   */
  capture(options: {
    sessionId: string;
    label: string;
    state: Record<string, unknown>;
    events: ConsensusEvent[];
    amendments?: AmendmentState[];
  }): Snapshot {
    const id = `snap-${++snapCounter}-${Date.now()}`;
    const serialized = JSON.stringify({
      state: options.state,
      events: options.events,
      amendments: options.amendments ?? [],
    });

    const checksum = createHash("sha256").update(serialized).digest("hex");

    const snapshot: Snapshot = {
      id,
      sessionId: options.sessionId,
      label: options.label,
      state: structuredClone(options.state),
      events: [...options.events],
      amendments: [...(options.amendments ?? [])],
      createdAt: new Date().toISOString(),
      checksum,
    };

    this.snapshots.set(id, snapshot);
    return snapshot;
  }

  /**
   * Retrieve a snapshot by ID.
   */
  get(id: string): Snapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * List all snapshots, optionally filtered by session.
   */
  list(sessionId?: string): Snapshot[] {
    const all = [...this.snapshots.values()];
    if (sessionId) {
      return all.filter((s) => s.sessionId === sessionId);
    }
    return all;
  }

  /**
   * Delete a snapshot.
   */
  delete(id: string): boolean {
    return this.snapshots.delete(id);
  }

  /**
   * Verify a snapshot's integrity by recomputing its checksum.
   */
  verify(snapshot: Snapshot): boolean {
    const serialized = JSON.stringify({
      state: snapshot.state,
      events: snapshot.events,
      amendments: snapshot.amendments,
    });
    const computed = createHash("sha256").update(serialized).digest("hex");
    return computed === snapshot.checksum;
  }

  /**
   * Compute the diff between two state objects.
   */
  diff(before: Record<string, unknown>, after: Record<string, unknown>): StateDiff {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const added: StateDiff["added"] = [];
    const removed: StateDiff["removed"] = [];
    const changed: StateDiff["changed"] = [];

    for (const key of allKeys) {
      const inBefore = key in before;
      const inAfter = key in after;

      if (!inBefore && inAfter) {
        added.push({ key, value: after[key] });
      } else if (inBefore && !inAfter) {
        removed.push({ key, value: before[key] });
      } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changed.push({ key, oldValue: before[key], newValue: after[key] });
      }
    }

    return { added, removed, changed };
  }

  /**
   * Serialize a snapshot to a JSON string.
   */
  serialize(snapshot: Snapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Deserialize a snapshot from a JSON string and store it.
   */
  deserialize(json: string): Snapshot {
    const snapshot = JSON.parse(json) as Snapshot;
    if (!this.verify(snapshot)) {
      throw new Error(`Snapshot ${snapshot.id} failed integrity check — checksum mismatch`);
    }
    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  /**
   * Clear all stored snapshots.
   */
  clear(): void {
    this.snapshots.clear();
    snapCounter = 0;
  }
}
