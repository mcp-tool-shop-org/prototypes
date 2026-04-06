/** Context snapshots — handoff notes for session continuity. */

import type { Store } from "./store.js";
import type { Snapshot } from "./types.js";

export class SnapshotManager {
  constructor(private store: Store) {}

  create(input: Omit<Snapshot, "id" | "timestamp">): Snapshot {
    const snapshot: Snapshot = {
      id: this.store.newId(),
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.store.mutate((d) => d.snapshots.push(snapshot));
    return snapshot;
  }

  latest(): Snapshot | null {
    const snaps = this.store.get().snapshots;
    return snaps.length > 0 ? snaps[snaps.length - 1]! : null;
  }

  forSession(sessionId: string): Snapshot[] {
    return this.store.get().snapshots.filter((s) => s.sessionId === sessionId);
  }

  list(count = 10): Snapshot[] {
    return this.store.get().snapshots.slice(-count).reverse();
  }
}
