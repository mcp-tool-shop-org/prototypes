/** Shared type definitions for claude-session-copilot. */

export type SessionId = string;

export interface SessionInfo {
  startedAt: string;
  endedAt?: string;
  label?: string;
}

export interface Decision {
  id: string;
  sessionId: SessionId;
  timestamp: string;
  what: string;
  why: string;
  alternativesRejected: string[];
  confidence: "high" | "medium" | "low";
  tags: string[];
  files: string[];
}

export interface TimelineEvent {
  id: string;
  sessionId: SessionId;
  timestamp: string;
  type:
    | "file_write"
    | "file_edit"
    | "bash_success"
    | "bash_failure"
    | "test_pass"
    | "test_fail"
    | "build_success"
    | "build_failure"
    | "decision"
    | "snapshot"
    | "manual"
    | "todo_update";
  summary: string;
  detail?: string;
  files?: string[];
  durationMs?: number;
}

export interface Snapshot {
  id: string;
  sessionId: SessionId;
  timestamp: string;
  workingOn: string;
  done: string[];
  nextSteps: string[];
  blockers: string[];
  keyFiles: string[];
  keyDecisionIds: string[];
  notes: string;
}

export interface PatternAlert {
  id: string;
  detectedAt: string;
  type: "repeated_failure" | "file_churn" | "long_session" | "circular_edits";
  message: string;
  evidence: string[];
  acknowledged: boolean;
}

export interface CopilotStore {
  version: 1;
  projectPath: string;
  sessions: Record<SessionId, SessionInfo>;
  currentSessionId: SessionId | null;
  decisions: Decision[];
  timeline: TimelineEvent[];
  snapshots: Snapshot[];
  patterns: PatternAlert[];
}
