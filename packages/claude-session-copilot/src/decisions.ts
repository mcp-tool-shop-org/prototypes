/** Decision log — records what was decided, why, and what was rejected. */

import type { Store } from "./store.js";
import type { Decision } from "./types.js";

export class DecisionLog {
  constructor(private store: Store) {}

  log(input: Omit<Decision, "id" | "timestamp">): Decision {
    const decision: Decision = {
      id: this.store.newId(),
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.store.mutate((d) => d.decisions.push(decision));
    return decision;
  }

  recent(count = 20): Decision[] {
    return this.store.get().decisions.slice(-count).reverse();
  }

  search(keyword: string): Decision[] {
    const lower = keyword.toLowerCase();
    return this.store.get().decisions.filter(
      (d) =>
        d.what.toLowerCase().includes(lower) ||
        d.why.toLowerCase().includes(lower) ||
        d.tags.some((t) => t.toLowerCase().includes(lower)),
    );
  }

  bySession(sessionId: string): Decision[] {
    return this.store.get().decisions.filter((d) => d.sessionId === sessionId);
  }

  byFile(filePath: string): Decision[] {
    const lower = filePath.toLowerCase();
    return this.store.get().decisions.filter((d) =>
      d.files.some((f) => f.toLowerCase().includes(lower)),
    );
  }
}
