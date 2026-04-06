/** Project pulse — aggregated health dashboard. */

import type { Store } from "./store.js";
import type { PatternDetector } from "./patterns.js";

export interface PulseData {
  sessionCount: number;
  currentSession: {
    id: string | null;
    startedAt: string | null;
    eventCount: number;
    snapshotCount: number;
  };
  recentActivity: {
    totalEvents: number;
    filesMostTouched: Array<{ file: string; count: number }>;
    recentDecisions: number;
  };
  openBlockers: string[];
  unacknowledgedPatterns: number;
  lastSnapshot: string | null;
}

export function buildPulse(
  store: Store,
  detector: PatternDetector,
): PulseData {
  const data = store.get();
  const sid = data.currentSessionId;

  // Files most touched (last 200 events)
  const recentEvents = data.timeline.slice(-200);
  const fileTouches = new Map<string, number>();
  for (const e of recentEvents) {
    for (const f of e.files ?? []) {
      fileTouches.set(f, (fileTouches.get(f) ?? 0) + 1);
    }
  }
  const filesMostTouched = Array.from(fileTouches.entries())
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Open blockers from latest snapshot
  const latestSnapshot =
    data.snapshots.length > 0
      ? data.snapshots[data.snapshots.length - 1]!
      : null;

  const sessionEvents = sid
    ? data.timeline.filter((e) => e.sessionId === sid)
    : [];
  const sessionSnapshots = sid
    ? data.snapshots.filter((s) => s.sessionId === sid)
    : [];

  return {
    sessionCount: Object.keys(data.sessions).length,
    currentSession: {
      id: sid,
      startedAt: sid ? (data.sessions[sid]?.startedAt ?? null) : null,
      eventCount: sessionEvents.length,
      snapshotCount: sessionSnapshots.length,
    },
    recentActivity: {
      totalEvents: recentEvents.length,
      filesMostTouched,
      recentDecisions: data.decisions.slice(-50).length,
    },
    openBlockers: latestSnapshot?.blockers ?? [],
    unacknowledgedPatterns: detector.unacknowledged().length,
    lastSnapshot: latestSnapshot?.timestamp ?? null,
  };
}
