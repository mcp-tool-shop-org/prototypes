/** MCP server — registers 7 tools and 4 resources. */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Store } from "./store.js";
import { DecisionLog } from "./decisions.js";
import { Timeline } from "./timeline.js";
import { SnapshotManager } from "./snapshots.js";
import { PatternDetector } from "./patterns.js";
import { buildPulse } from "./pulse.js";
import { VERSION } from "./version.js";

const SERVER_NAME = "session-copilot";
const SERVER_VERSION = VERSION;

export function createServer(storePath?: string) {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {}, resources: {} } },
  );

  const store = new Store(storePath);
  const decisions = new DecisionLog(store);
  const timeline = new Timeline(store);
  const snapshots = new SnapshotManager(store);
  const detector = new PatternDetector(store);

  // ── Notification helpers ──

  async function notifyResource(uri: string): Promise<void> {
    try {
      await server.server.sendResourceUpdated({ uri });
    } catch {
      // Notifications are best-effort; transport may not support them
    }
  }

  async function log(
    level: "debug" | "info" | "warning" | "error",
    data: unknown,
  ): Promise<void> {
    try {
      await server.server.sendLoggingMessage({ level, logger: "copilot", data });
    } catch {
      // Best-effort
    }
  }

  // ── Tool 1: copilot.decision ──

  server.tool(
    "copilot.decision",
    "Log a decision made during this session. Records what was decided, why, and what alternatives were rejected. Queryable across sessions.",
    {
      what: z.string().min(1).describe("What was decided"),
      why: z.string().min(1).describe("Why this approach was chosen"),
      alternativesRejected: z
        .array(z.string())
        .default([])
        .describe("Approaches considered but rejected"),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
      tags: z
        .array(z.string())
        .default([])
        .describe("Tags: architecture, testing, perf, etc."),
      files: z.array(z.string()).default([]).describe("Related file paths"),
    },
    async (input) => {
      const sessionId = store.ensureSession();
      const decision = decisions.log({ sessionId, ...input });
      timeline.record({
        sessionId,
        type: "decision",
        summary: `Decision: ${input.what}`,
        detail: input.why,
        files: input.files,
      });
      await notifyResource("copilot://decisions");
      await notifyResource("copilot://timeline");
      await log("info", { event: "decision-logged", id: decision.id });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ ok: true, decision }, null, 2) },
        ],
      };
    },
  );

  // ── Tool 2: copilot.snapshot ──

  server.tool(
    "copilot.snapshot",
    "Save a structured snapshot of current session state. Use before /compact or at natural breakpoints. This is the handoff note for the next session.",
    {
      workingOn: z.string().min(1).describe("What we are currently working on"),
      done: z.array(z.string()).default([]).describe("What has been completed"),
      nextSteps: z
        .array(z.string())
        .default([])
        .describe("What should happen next, in priority order"),
      blockers: z
        .array(z.string())
        .default([])
        .describe("Unresolved issues or questions"),
      keyFiles: z
        .array(z.string())
        .default([])
        .describe("Files most relevant to current work"),
      notes: z
        .string()
        .default("")
        .describe("Any additional context the next session needs"),
    },
    async (input) => {
      const sessionId = store.ensureSession();
      const recentDecisionIds = decisions
        .bySession(sessionId)
        .slice(-5)
        .map((d) => d.id);
      const snapshot = snapshots.create({
        sessionId,
        ...input,
        keyDecisionIds: recentDecisionIds,
      });
      timeline.record({
        sessionId,
        type: "snapshot",
        summary: `Snapshot saved: ${input.workingOn}`,
        files: input.keyFiles,
      });
      await notifyResource("copilot://snapshot/latest");
      await notifyResource("copilot://timeline");
      await log("info", { event: "snapshot-saved", id: snapshot.id });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ ok: true, snapshot }, null, 2) },
        ],
      };
    },
  );

  // ── Tool 3: copilot.resume ──

  server.tool(
    "copilot.resume",
    "Resume from where the last session left off. Loads the latest snapshot, recent decisions, and timeline summary. Call this at the start of a new session.",
    {},
    async () => {
      // Start a fresh session
      const sessionId = store.ensureSession();

      const latestSnap = snapshots.latest();
      const recentDecs = decisions.recent(10);
      const data = store.get();

      // Previous session's timeline summary
      const sessionIds = Object.keys(data.sessions).sort();
      const prevSessionId =
        sessionIds.length >= 2
          ? sessionIds[sessionIds.length - 2]!
          : sessionIds[0] ?? null;
      const timelineSummary = prevSessionId
        ? timeline.summary(prevSessionId)
        : "No previous session found.";

      const alerts = detector.unacknowledged();

      // Staleness signaling — snapshot age must be visible
      let snapshotAge: string | null = null;
      let snapshotStale = false;
      const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
      if (latestSnap) {
        const ageMs = Date.now() - new Date(latestSnap.timestamp).getTime();
        snapshotStale = ageMs > STALE_THRESHOLD_MS;
        if (ageMs < 60_000) snapshotAge = "less than 1 minute ago";
        else if (ageMs < 3_600_000) snapshotAge = `${Math.floor(ageMs / 60_000)} minutes ago`;
        else if (ageMs < 86_400_000) snapshotAge = `${Math.floor(ageMs / 3_600_000)} hours ago`;
        else snapshotAge = `${Math.floor(ageMs / 86_400_000)} days ago`;
      }

      const resumePacket = {
        currentSessionId: sessionId,
        snapshot: latestSnap,
        snapshotAge,
        snapshotStale,
        recentDecisions: recentDecs,
        previousSessionSummary: timelineSummary,
        patternAlerts: alerts,
        message: latestSnap
          ? `Last stored snapshot from ${snapshotAge}${snapshotStale ? " (STALE)" : ""}: working on "${latestSnap.workingOn}". ${latestSnap.nextSteps.length} next steps, ${latestSnap.blockers.length} blockers.`
          : "No previous snapshot found. This appears to be a fresh start.",
        bindingNote: "Session ID is a stored identifier, not bound to the active Claude Code session. Stored data may be from a previous session.",
      };

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(resumePacket, null, 2) },
        ],
      };
    },
  );

  // ── Tool 4: copilot.timeline_event ──

  server.tool(
    "copilot.timeline_event",
    "Record a timeline event. Hook prompts request recording for Bash/Write/Edit/TodoWrite (prompt-based, not guaranteed). Use this directly for events hooks cannot detect (manual testing, external actions, etc.).",
    {
      type: z
        .enum([
          "file_write",
          "file_edit",
          "bash_success",
          "bash_failure",
          "test_pass",
          "test_fail",
          "build_success",
          "build_failure",
          "decision",
          "snapshot",
          "manual",
          "todo_update",
        ])
        .default("manual"),
      summary: z.string().min(1).describe("Brief description of what happened"),
      detail: z
        .string()
        .optional()
        .describe("Extended detail (error output, etc.)"),
      files: z.array(z.string()).optional().describe("Related files"),
    },
    async (input) => {
      const sessionId = store.ensureSession();
      const event = timeline.record({ sessionId, ...input });
      await notifyResource("copilot://timeline");

      // Run pattern detection after every event
      const newPatterns = detector.detect();
      if (newPatterns.length > 0) {
        await notifyResource("copilot://pulse");
        await log("warning", {
          event: "pattern-detected",
          patterns: newPatterns.map((p) => p.message),
        });
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify({ ok: true, event }, null, 2) },
        ],
      };
    },
  );

  // ── Tool 5: copilot.query ──

  server.tool(
    "copilot.query",
    "Search decisions, timeline events, and snapshots by keyword, file path, or session ID.",
    {
      keyword: z.string().optional().describe("Search keyword across all content"),
      file: z.string().optional().describe("Filter by file path (partial match)"),
      sessionId: z.string().optional().describe("Filter to a specific session"),
      type: z
        .enum(["decisions", "timeline", "snapshots", "all"])
        .default("all"),
      limit: z.number().int().positive().default(20),
    },
    async (input) => {
      const results: Record<string, unknown[]> = {};

      if (input.type === "all" || input.type === "decisions") {
        const decs = input.keyword
          ? decisions.search(input.keyword)
          : input.file
            ? decisions.byFile(input.file)
            : input.sessionId
              ? decisions.bySession(input.sessionId)
              : decisions.recent(input.limit);
        results.decisions = decs.slice(0, input.limit);
      }

      if (input.type === "all" || input.type === "timeline") {
        const events = input.keyword
          ? timeline.search(input.keyword)
          : input.sessionId
            ? timeline.forSession(input.sessionId)
            : timeline.recent(input.limit);
        results.timeline = events.slice(0, input.limit);
      }

      if (input.type === "all" || input.type === "snapshots") {
        const snaps = input.sessionId
          ? snapshots.forSession(input.sessionId)
          : snapshots.list(input.limit);
        results.snapshots = snaps.slice(0, input.limit);
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    },
  );

  // ── Tool 6: copilot.pulse ──

  server.tool(
    "copilot.pulse",
    "Get project health summary: recent sessions, most-touched files, decisions, blockers, pattern alerts.",
    {},
    async () => {
      const pulse = buildPulse(store, detector);
      // Also run detection
      const newPatterns = detector.detect();
      if (newPatterns.length > 0) {
        pulse.unacknowledgedPatterns += newPatterns.length;
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(pulse, null, 2) },
        ],
      };
    },
  );

  // ── Tool 7: copilot.forget ──

  server.tool(
    "copilot.forget",
    "Prune old data by age (days) or by session ID. Keeps the store lean.",
    {
      olderThanDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Delete data older than N days"),
      sessionId: z
        .string()
        .optional()
        .describe("Delete all data for a specific session"),
      acknowledged: z
        .boolean()
        .optional()
        .default(false)
        .describe("Also delete acknowledged pattern alerts"),
    },
    async (input) => {
      let removedCount = 0;
      const cutoff = input.olderThanDays
        ? new Date(
            Date.now() - input.olderThanDays * 86_400_000,
          ).toISOString()
        : null;

      store.mutate((d) => {
        if (input.sessionId) {
          const before =
            d.decisions.length + d.timeline.length + d.snapshots.length;
          d.decisions = d.decisions.filter(
            (x) => x.sessionId !== input.sessionId,
          );
          d.timeline = d.timeline.filter(
            (x) => x.sessionId !== input.sessionId,
          );
          d.snapshots = d.snapshots.filter(
            (x) => x.sessionId !== input.sessionId,
          );
          delete d.sessions[input.sessionId!];
          removedCount =
            before -
            (d.decisions.length + d.timeline.length + d.snapshots.length);
        }
        if (cutoff) {
          const before =
            d.decisions.length + d.timeline.length + d.snapshots.length;
          d.decisions = d.decisions.filter((x) => x.timestamp >= cutoff);
          d.timeline = d.timeline.filter((x) => x.timestamp >= cutoff);
          d.snapshots = d.snapshots.filter((x) => x.timestamp >= cutoff);
          removedCount +=
            before -
            (d.decisions.length + d.timeline.length + d.snapshots.length);
        }
        if (input.acknowledged) {
          const before = d.patterns.length;
          d.patterns = d.patterns.filter((p) => !p.acknowledged);
          removedCount += before - d.patterns.length;
        }
      });

      await notifyResource("copilot://pulse");
      await log("info", { event: "data-pruned", removedCount });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ok: true, removedCount }, null, 2),
          },
        ],
      };
    },
  );

  // ── Resource 1: copilot://pulse ──

  server.resource("copilot://pulse", "copilot://pulse", async () => ({
    contents: [
      {
        uri: "copilot://pulse",
        mimeType: "application/json",
        text: JSON.stringify(buildPulse(store, detector), null, 2),
      },
    ],
  }));

  // ── Resource 2: copilot://timeline ──

  server.resource("copilot://timeline", "copilot://timeline", async () => ({
    contents: [
      {
        uri: "copilot://timeline",
        mimeType: "application/json",
        text: JSON.stringify({ events: timeline.currentSession() }, null, 2),
      },
    ],
  }));

  // ── Resource 3: copilot://decisions ──

  server.resource(
    "copilot://decisions",
    "copilot://decisions",
    async () => ({
      contents: [
        {
          uri: "copilot://decisions",
          mimeType: "application/json",
          text: JSON.stringify({ decisions: decisions.recent(20) }, null, 2),
        },
      ],
    }),
  );

  // ── Resource 4: copilot://snapshot/latest ──

  server.resource(
    "copilot://snapshot/latest",
    "copilot://snapshot/latest",
    async () => ({
      contents: [
        {
          uri: "copilot://snapshot/latest",
          mimeType: "application/json",
          text: JSON.stringify(snapshots.latest(), null, 2),
        },
      ],
    }),
  );

  // ── Connect transport ──

  const transport = new StdioServerTransport();

  return { server, transport, store };
}
