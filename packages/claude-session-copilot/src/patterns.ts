/** Pattern detection — surfaces repeated failures, file churn, long sessions. */

import type { Store } from "./store.js";
import type { PatternAlert, TimelineEvent } from "./types.js";

export class PatternDetector {
  constructor(private store: Store) {}

  /** Scan current session for patterns. Returns only newly detected alerts. */
  detect(): PatternAlert[] {
    const newAlerts: PatternAlert[] = [];
    const data = this.store.get();
    const sid = data.currentSessionId;
    if (!sid) return [];

    const sessionEvents = data.timeline.filter((e) => e.sessionId === sid);

    // Rule 1: Repeated failures — same command prefix fails 3+ times
    const failures = sessionEvents.filter(
      (e) =>
        e.type === "bash_failure" ||
        e.type === "test_fail" ||
        e.type === "build_failure",
    );
    const failCounts = new Map<string, TimelineEvent[]>();
    for (const f of failures) {
      const key = f.summary.slice(0, 60);
      const group = failCounts.get(key) ?? [];
      group.push(f);
      failCounts.set(key, group);
    }
    for (const [key, events] of failCounts) {
      if (events.length >= 3) {
        newAlerts.push(
          this.makeAlert(
            "repeated_failure",
            `Command has failed ${events.length} times: "${key}"`,
            events.map((e) => e.id),
          ),
        );
      }
    }

    // Rule 2: File churn — same file edited 5+ times in session
    const editEvents = sessionEvents.filter(
      (e) => e.type === "file_write" || e.type === "file_edit",
    );
    const fileCounts = new Map<string, string[]>();
    for (const e of editEvents) {
      for (const f of e.files ?? []) {
        const ids = fileCounts.get(f) ?? [];
        ids.push(e.id);
        fileCounts.set(f, ids);
      }
    }
    for (const [file, ids] of fileCounts) {
      if (ids.length >= 5) {
        newAlerts.push(
          this.makeAlert(
            "file_churn",
            `File edited ${ids.length} times this session: ${file}`,
            ids,
          ),
        );
      }
    }

    // Rule 3: Long session without snapshot — 100+ events, no snapshots
    const sessionSnapshots = data.snapshots.filter((s) => s.sessionId === sid);
    if (sessionEvents.length >= 100 && sessionSnapshots.length === 0) {
      newAlerts.push(
        this.makeAlert(
          "long_session",
          `${sessionEvents.length} events without a snapshot. Consider saving one.`,
          [],
        ),
      );
    }

    // Deduplicate: only add alerts not already present (by message)
    const existingMessages = new Set(data.patterns.map((p) => p.message));
    const fresh = newAlerts.filter((a) => !existingMessages.has(a.message));

    if (fresh.length > 0) {
      this.store.mutate((d) => d.patterns.push(...fresh));
    }

    return fresh;
  }

  private makeAlert(
    type: PatternAlert["type"],
    message: string,
    evidence: string[],
  ): PatternAlert {
    return {
      id: this.store.newId(),
      detectedAt: new Date().toISOString(),
      type,
      message,
      evidence,
      acknowledged: false,
    };
  }

  unacknowledged(): PatternAlert[] {
    return this.store.get().patterns.filter((p) => !p.acknowledged);
  }

  acknowledge(alertId: string): void {
    this.store.mutate((d) => {
      const alert = d.patterns.find((p) => p.id === alertId);
      if (alert) alert.acknowledged = true;
    });
  }
}
