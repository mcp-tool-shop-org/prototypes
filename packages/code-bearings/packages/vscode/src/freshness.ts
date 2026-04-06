/**
 * Freshness Tracker — keeps context trustworthy without making the UI jumpy.
 *
 * Tracks staleness across two tiers:
 * - Index stale: source files changed since last indexProject()
 * - Brief stale: git state changed since last generateChangeBrief()
 *
 * Three event sources:
 * 1. File save (debounced 2s) — marks index + brief stale
 * 2. Git branch/commit poll (10s) — detects branch switch or new commits
 * 3. Manual refresh — always available via command
 *
 * Product law: never let live responsiveness make the UI feel unstable.
 * Updates land atomically. Stale indicators show before refresh, not during.
 */

import * as vscode from "vscode";
import { execSync } from "node:child_process";

export interface FreshnessState {
  /** Timestamp of last successful indexProject() */
  indexedAt: number;
  /** Timestamp of last successful generateChangeBrief() */
  briefGeneratedAt: number;
  /** Git branch at time of last brief */
  briefBranch: string;
  /** Git commit hash at time of last brief */
  briefCommitHash: string;
  /** Current branch (from last poll) */
  currentBranch: string;
  /** Current HEAD commit (from last poll) */
  currentCommitHash: string;
  /** Files saved since last index */
  dirtyFiles: Set<string>;
  /** Whether the brief is stale */
  briefStale: boolean;
  /** Whether the index is stale */
  indexStale: boolean;
}

export type FreshnessChangeListener = (state: FreshnessState) => void;

export class FreshnessTracker {
  private state: FreshnessState;
  private workspaceRoot: string;
  private listeners: FreshnessChangeListener[] = [];
  private disposables: vscode.Disposable[] = [];
  private saveDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  private gitPollTimer: ReturnType<typeof setInterval> | undefined;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    const { branch, commit } = this.readGitState();

    this.state = {
      indexedAt: 0,
      briefGeneratedAt: 0,
      briefBranch: "",
      briefCommitHash: "",
      currentBranch: branch,
      currentCommitHash: commit,
      dirtyFiles: new Set(),
      briefStale: false,
      indexStale: false,
    };

    // ── File save listener (2s debounce) ──
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.handleFileSave(doc);
      })
    );

    // ── Git state poll (every 10s) ──
    this.gitPollTimer = setInterval(() => this.pollGitState(), 10_000);
  }

  /** Register a listener for freshness state changes */
  onChange(listener: FreshnessChangeListener): void {
    this.listeners.push(listener);
  }

  /** Get current freshness state (read-only snapshot) */
  getState(): Readonly<FreshnessState> {
    return this.state;
  }

  /** Mark index as fresh (call after successful indexProject) */
  markIndexFresh(): void {
    this.state.indexedAt = Date.now();
    this.state.dirtyFiles.clear();
    this.state.indexStale = false;
    this.notify();
  }

  /** Mark brief as fresh (call after successful generateChangeBrief) */
  markBriefFresh(): void {
    const { branch, commit } = this.readGitState();
    this.state.briefGeneratedAt = Date.now();
    this.state.briefBranch = branch;
    this.state.briefCommitHash = commit;
    this.state.currentBranch = branch;
    this.state.currentCommitHash = commit;
    this.state.briefStale = false;
    this.notify();
  }

  /** Force-check staleness (e.g. on manual refresh) */
  checkNow(): void {
    this.pollGitState();
  }

  // ── Private ──

  private handleFileSave(doc: vscode.TextDocument): void {
    // Only track workspace files (not output, settings, etc.)
    if (doc.uri.scheme !== "file") return;

    const filePath = doc.uri.fsPath;
    this.state.dirtyFiles.add(filePath);

    // Debounce: wait 2s after last save before declaring stale
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      const wasIndexStale = this.state.indexStale;
      const wasBriefStale = this.state.briefStale;

      this.state.indexStale = true;
      // Brief is stale if files changed (diff would be different)
      if (this.state.briefGeneratedAt > 0) {
        this.state.briefStale = true;
      }

      if (!wasIndexStale || !wasBriefStale) {
        this.notify();
      }
    }, 2_000);
  }

  private pollGitState(): void {
    const { branch, commit } = this.readGitState();

    const branchChanged = branch !== this.state.currentBranch;
    const commitChanged = commit !== this.state.currentCommitHash;

    this.state.currentBranch = branch;
    this.state.currentCommitHash = commit;

    if (branchChanged || commitChanged) {
      // Branch switch or new commit — brief is definitely stale
      if (this.state.briefGeneratedAt > 0) {
        const briefBranchDrifted = branch !== this.state.briefBranch;
        const briefCommitDrifted = commit !== this.state.briefCommitHash;

        if (briefBranchDrifted || briefCommitDrifted) {
          this.state.briefStale = true;
        }
      }

      // New commits may also make the index stale
      if (commitChanged && this.state.indexedAt > 0) {
        this.state.indexStale = true;
      }

      this.notify();
    }
  }

  private readGitState(): { branch: string; commit: string } {
    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: this.workspaceRoot,
        encoding: "utf-8",
        timeout: 3_000,
      }).trim();

      const commit = execSync("git rev-parse --short HEAD", {
        cwd: this.workspaceRoot,
        encoding: "utf-8",
        timeout: 3_000,
      }).trim();

      return { branch, commit };
    } catch {
      return { branch: "unknown", commit: "unknown" };
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  dispose(): void {
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    if (this.gitPollTimer) clearInterval(this.gitPollTimer);
    for (const d of this.disposables) d.dispose();
  }
}
