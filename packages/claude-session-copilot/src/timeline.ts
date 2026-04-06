/** Session timeline — structured event log, populated via hook prompts (prompt-based, not guaranteed). */

import type { Store } from "./store.js";
import type { TimelineEvent, SessionId } from "./types.js";

export class Timeline {
  constructor(private store: Store) {}

  record(input: Omit<TimelineEvent, "id" | "timestamp">): TimelineEvent {
    const event: TimelineEvent = {
      id: this.store.newId(),
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.store.mutate((d) => d.timeline.push(event));
    return event;
  }

  currentSession(): TimelineEvent[] {
    const sid = this.store.get().currentSessionId;
    if (!sid) return [];
    return this.store
      .get()
      .timeline.filter((e) => e.sessionId === sid)
      .reverse();
  }

  forSession(sessionId: SessionId): TimelineEvent[] {
    return this.store.get().timeline.filter((e) => e.sessionId === sessionId);
  }

  recent(count = 50): TimelineEvent[] {
    return this.store.get().timeline.slice(-count).reverse();
  }

  search(keyword: string): TimelineEvent[] {
    const lower = keyword.toLowerCase();
    return this.store.get().timeline.filter(
      (e) =>
        e.summary.toLowerCase().includes(lower) ||
        (e.detail ?? "").toLowerCase().includes(lower) ||
        (e.files ?? []).some((f) => f.toLowerCase().includes(lower)),
    );
  }

  summary(sessionId: SessionId): string {
    const events = this.forSession(sessionId);
    const counts: Record<string, number> = {};
    const files = new Set<string>();
    for (const e of events) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
      for (const f of e.files ?? []) files.add(f);
    }
    const parts = Object.entries(counts).map(([k, v]) => `${v} ${k}`);
    return `${events.length} events (${parts.join(", ")}), ${files.size} files touched`;
  }
}
