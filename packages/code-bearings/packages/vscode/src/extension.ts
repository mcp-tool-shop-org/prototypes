import * as vscode from "vscode";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  BearingsStore,
  indexProject,
  generateModuleCard,
  generateFunctionCard,
  generateSystemMap,
  generateChangeBrief,
  buildModuleGraphs,
  generateModeContent,
} from "@code-bearings/core";
import type { ReviewMode, ChangeBrief } from "@code-bearings/core";
import { resolveCursorContext } from "@code-bearings/core";
import { ReviewPanel } from "./review-panel.js";
import { ModulesTreeProvider } from "./modules-tree.js";
import { ReviewTreeProvider } from "./review-tree.js";
import { CursorStatusBar } from "./cursor-status.js";
import { CursorHoverProvider } from "./cursor-hover.js";
import { CursorCodeLensProvider } from "./cursor-codelens.js";
import { CursorDecorations } from "./cursor-decorations.js";
import { FreshnessTracker } from "./freshness.js";

// ── Shared extension state ──

interface ExtensionState {
  store: BearingsStore | undefined;
  workspaceRoot: string | undefined;
  brief: ChangeBrief | undefined;
  freshness: FreshnessTracker | undefined;
}

const state: ExtensionState = {
  store: undefined,
  workspaceRoot: undefined,
  brief: undefined,
  freshness: undefined,
};

function getDbPath(workspaceRoot: string): string {
  const config = vscode.workspace.getConfiguration("codeBearings");
  const relPath = config.get<string>("dbPath", ".code-bearings/bearings.db");
  return path.resolve(workspaceRoot, relPath);
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function ensureStore(workspaceRoot: string): BearingsStore {
  const dbPath = getDbPath(workspaceRoot);
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `No bearings database found at ${dbPath}. Run "Code Bearings: Analyze Project" first.`
    );
  }
  if (state.store) {
    state.store.close();
  }
  state.store = new BearingsStore(dbPath);
  state.workspaceRoot = workspaceRoot;
  return state.store;
}

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = getWorkspaceRoot();

  // ── Tree providers (registered immediately, even before store exists) ──
  const modulesTree = new ModulesTreeProvider(workspaceRoot ?? "");
  const reviewTree = new ReviewTreeProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("codeBearings.modules", modulesTree),
    vscode.window.registerTreeDataProvider("codeBearings.reviewBrief", reviewTree)
  );

  // ── Cursor context providers (registered immediately) ──
  const cursorStatus = new CursorStatusBar();
  const cursorHover = new CursorHoverProvider();
  const cursorCodeLens = new CursorCodeLensProvider();
  const cursorDecorations = new CursorDecorations();

  context.subscriptions.push(
    cursorStatus,
    vscode.languages.registerHoverProvider({ scheme: "file" }, cursorHover),
    vscode.languages.registerCodeLensProvider({ scheme: "file" }, cursorCodeLens),
    cursorDecorations
  );

  /** Push store + brief to all cursor providers */
  function updateCursorProviders(): void {
    if (state.store) {
      cursorStatus.setStore(state.store);
      cursorHover.setStore(state.store);
      cursorCodeLens.setStore(state.store);
      cursorDecorations.setStore(state.store);
    }
    cursorStatus.setBrief(state.brief);
    cursorHover.setBrief(state.brief);
    cursorCodeLens.setBrief(state.brief);
    cursorDecorations.setBrief(state.brief);
  }

  // ── Freshness tracker ──
  if (workspaceRoot) {
    state.freshness = new FreshnessTracker(workspaceRoot);
    context.subscriptions.push(state.freshness);

    state.freshness.onChange((freshnessState) => {
      const anyStale = freshnessState.indexStale || freshnessState.briefStale;

      // Status bar: stale indicator
      cursorStatus.setStale(anyStale);

      // Tree views: stale warning items
      if (freshnessState.indexStale) {
        modulesTree.setStale("Index may be stale — files changed since last analysis");
      } else {
        modulesTree.setStale(undefined);
      }

      if (freshnessState.briefStale) {
        const reason = freshnessState.currentBranch !== freshnessState.briefBranch
          ? `Review may be stale — branch changed (${freshnessState.briefBranch} → ${freshnessState.currentBranch})`
          : freshnessState.currentCommitHash !== freshnessState.briefCommitHash
            ? "Review may be stale — new commits since last review"
            : "Review may be stale — files changed since last review";
        reviewTree.setStale(reason);

        // Review panel: stale banner (DOM injection, no re-render)
        if (ReviewPanel.currentPanel) {
          ReviewPanel.currentPanel.showStaleBanner(true, reason);
        }
      } else {
        reviewTree.setStale(undefined);
        if (ReviewPanel.currentPanel) {
          ReviewPanel.currentPanel.showStaleBanner(false, "");
        }
      }

      // Auto-analyze on save (if enabled + index stale)
      if (freshnessState.indexStale) {
        const config = vscode.workspace.getConfiguration("codeBearings");
        if (config.get<boolean>("autoAnalyze", false)) {
          vscode.commands.executeCommand("codeBearings.refreshAll");
        }
      }
    });
  }

  // If a database already exists, pre-populate the modules tree and cursor providers
  if (workspaceRoot) {
    const dbPath = getDbPath(workspaceRoot);
    if (fs.existsSync(dbPath)) {
      try {
        state.store = new BearingsStore(dbPath);
        state.workspaceRoot = workspaceRoot;
        modulesTree.setStore(state.store);
        updateCursorProviders();
        // Mark index as fresh since we just loaded
        state.freshness?.markIndexFresh();
      } catch {
        // Silently ignore — user can re-analyze
      }
    }
  }

  // ── Analyze ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.analyze", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const dbPath = getDbPath(root);
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Code Bearings: Analyzing project...",
          cancellable: false,
        },
        async () => {
          const store = new BearingsStore(dbPath);
          store.clear();
          indexProject(store, { projectRoot: root });

          const fileCount = store.getMeta("fileCount") ?? "0";
          const modules = store.getAllModules();

          // Update shared state
          if (state.store && state.store !== store) {
            state.store.close();
          }
          state.store = store;
          state.workspaceRoot = root;

          // Refresh modules tree + cursor providers
          modulesTree.setStore(store);
          updateCursorProviders();
          state.freshness?.markIndexFresh();

          vscode.window.showInformationMessage(
            `Code Bearings: Indexed ${fileCount} files, ${modules.length} modules.`
          );
        }
      );
    })
  );

  // ── Review (staged + unstaged) ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.review", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      try {
        const store = ensureStore(root);
        const gitOpts = {
          cwd: root,
          encoding: "utf-8" as const,
          maxBuffer: 10 * 1024 * 1024,
        };

        let diffText: string;
        try {
          diffText = execSync("git diff HEAD -M", gitOpts);
        } catch {
          diffText = execSync("git diff --cached -M", gitOpts);
        }

        if (!diffText.trim()) {
          vscode.window.showInformationMessage("No changes detected.");
          return;
        }

        const brief = generateChangeBrief(store, diffText);
        const moduleGraphs = buildModuleGraphs(store, brief);
        const config = vscode.workspace.getConfiguration("codeBearings");
        const reviewMode = config.get<ReviewMode>("reviewMode", "general");
        const modeContent = generateModeContent(reviewMode, brief, store);

        // Update review tree + cursor providers
        state.brief = brief;
        reviewTree.setBrief(brief);
        updateCursorProviders();
        state.freshness?.markBriefFresh();

        // Show review panel
        ReviewPanel.createOrShow(
          context.extensionUri,
          brief,
          moduleGraphs,
          reviewMode,
          modeContent,
          store,
          root
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `Code Bearings: ${(err as Error).message}`
        );
      }
    })
  );

  // ── Review Branch ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.reviewBranch", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const base = await vscode.window.showInputBox({
        prompt: "Base branch or commit",
        value: "main",
      });
      if (!base) return;

      try {
        const store = ensureStore(root);
        const gitOpts = {
          cwd: root,
          encoding: "utf-8" as const,
          maxBuffer: 10 * 1024 * 1024,
        };

        let diffText: string;
        try {
          diffText = execSync(`git diff -M ${base}...HEAD`, gitOpts);
        } catch {
          diffText = execSync(`git diff -M ${base}..HEAD`, gitOpts);
        }

        if (!diffText.trim()) {
          vscode.window.showInformationMessage(
            `No differences between ${base} and HEAD.`
          );
          return;
        }

        const brief = generateChangeBrief(store, diffText);
        const moduleGraphs = buildModuleGraphs(store, brief);
        const config = vscode.workspace.getConfiguration("codeBearings");
        const reviewMode = config.get<ReviewMode>("reviewMode", "general");
        const modeContent = generateModeContent(reviewMode, brief, store);

        // Update review tree + cursor providers
        state.brief = brief;
        reviewTree.setBrief(brief);
        updateCursorProviders();
        state.freshness?.markBriefFresh();

        ReviewPanel.createOrShow(
          context.extensionUri,
          brief,
          moduleGraphs,
          reviewMode,
          modeContent,
          store,
          root
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `Code Bearings: ${(err as Error).message}`
        );
      }
    })
  );

  // ── Module Card ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.moduleCard", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      try {
        const store = ensureStore(root);
        const modules = store.getAllModules();

        const picked = await vscode.window.showQuickPick(
          modules.map((m) => ({
            label: m.name,
            description: m.boundaryKind,
            detail: `${store.getModuleMetrics(m.id).symbolCount} symbols`,
          })),
          { placeHolder: "Select a module" }
        );
        if (!picked) return;

        const card = generateModuleCard(store, picked.label);
        if (!card) {
          vscode.window.showErrorMessage(
            `Module "${picked.label}" not found.`
          );
          return;
        }

        const doc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(card, null, 2),
          language: "json",
        });
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        vscode.window.showErrorMessage(
          `Code Bearings: ${(err as Error).message}`
        );
      }
    })
  );

  // ── Function Card ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.functionCard", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: "Function name",
        placeHolder: "e.g. generateChangeBrief",
      });
      if (!name) return;

      try {
        const store = ensureStore(root);
        const card = generateFunctionCard(store, name);

        if (!card) {
          vscode.window.showErrorMessage(`Function "${name}" not found.`);
          return;
        }

        const doc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(card, null, 2),
          language: "json",
        });
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        vscode.window.showErrorMessage(
          `Code Bearings: ${(err as Error).message}`
        );
      }
    })
  );

  // ── System Overview ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.overview", async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      try {
        const store = ensureStore(root);
        const systemMap = generateSystemMap(store);

        const doc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(systemMap, null, 2),
          language: "json",
        });
        await vscode.window.showTextDocument(doc);
      } catch (err) {
        vscode.window.showErrorMessage(
          `Code Bearings: ${(err as Error).message}`
        );
      }
    })
  );

  // ── Focus Module (from review tree click) ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.focusModule", (index: number) => {
      if (ReviewPanel.currentPanel) {
        ReviewPanel.currentPanel.postMessage({ type: "focusIndex", index });
      }
    })
  );

  // ── Show Symbol Detail (from status bar click or CodeLens) ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.showSymbolDetail", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !state.store) return;

      const filePath = editor.document.uri.fsPath;
      const line = editor.selection.active.line + 1;

      const ctx = resolveCursorContext(state.store, filePath, line, state.brief);

      if (ctx.symbol) {
        // Show function card for the symbol
        const card = generateFunctionCard(state.store, ctx.symbol.name);
        if (card) {
          const doc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(card, null, 2),
            language: "json",
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
          return;
        }
      }

      if (ctx.module) {
        // Fall back to module card
        const card = generateModuleCard(state.store, ctx.module.name);
        if (card) {
          const doc = await vscode.workspace.openTextDocument({
            content: JSON.stringify(card, null, 2),
            language: "json",
          });
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
          return;
        }
      }

      vscode.window.showInformationMessage("No Code Bearings data for this position.");
    })
  );

  // ── Refresh Trees ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.refreshModules", () => {
      modulesTree.refresh();
    }),
    vscode.commands.registerCommand("codeBearings.refreshReview", () => {
      reviewTree.refresh();
    })
  );

  // ── Refresh All (freshness-driven) ──
  context.subscriptions.push(
    vscode.commands.registerCommand("codeBearings.refreshAll", async () => {
      const root = getWorkspaceRoot();
      if (!root) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Code Bearings: Refreshing...",
          cancellable: false,
        },
        async () => {
          try {
            const freshnessState = state.freshness?.getState();
            const needsReindex = freshnessState?.indexStale ?? false;
            const needsRebrief = freshnessState?.briefStale ?? false;

            // Tier 2: Re-index if stale (expensive)
            if (needsReindex) {
              const dbPath = getDbPath(root);
              const dbDir = path.dirname(dbPath);
              if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
              }

              const store = new BearingsStore(dbPath);
              store.clear();
              indexProject(store, { projectRoot: root });

              if (state.store && state.store !== store) {
                state.store.close();
              }
              state.store = store;
              state.workspaceRoot = root;

              modulesTree.setStore(store);
              updateCursorProviders();
              state.freshness?.markIndexFresh();
            }

            // Tier 1: Re-brief if stale (cheap, ~200ms)
            if (needsRebrief && state.store) {
              const gitOpts = {
                cwd: root,
                encoding: "utf-8" as const,
                maxBuffer: 10 * 1024 * 1024,
              };

              let diffText: string;
              try {
                diffText = execSync("git diff HEAD -M", gitOpts);
              } catch {
                diffText = execSync("git diff --cached -M", gitOpts);
              }

              if (diffText.trim()) {
                const brief = generateChangeBrief(state.store, diffText);
                state.brief = brief;
                reviewTree.setBrief(brief);
                updateCursorProviders();
                state.freshness?.markBriefFresh();

                // Update review panel if open (atomic re-render)
                if (ReviewPanel.currentPanel) {
                  const moduleGraphs = buildModuleGraphs(state.store, brief);
                  const config = vscode.workspace.getConfiguration("codeBearings");
                  const reviewMode = config.get<ReviewMode>("reviewMode", "general");
                  const modeContent = generateModeContent(reviewMode, brief, state.store);

                  ReviewPanel.createOrShow(
                    context.extensionUri,
                    brief,
                    moduleGraphs,
                    reviewMode,
                    modeContent,
                    state.store,
                    root
                  );
                }
              } else {
                // No changes — clear the brief
                state.brief = undefined;
                updateCursorProviders();
                state.freshness?.markBriefFresh();
              }
            }

            vscode.window.showInformationMessage(
              `Code Bearings: Refreshed${needsReindex ? " (re-indexed)" : ""}${needsRebrief ? " (re-reviewed)" : ""}.`
            );
          } catch (err) {
            vscode.window.showErrorMessage(
              `Code Bearings: ${(err as Error).message}`
            );
          }
        }
      );
    })
  );
}

export function deactivate(): void {
  if (state.store) {
    state.store.close();
    state.store = undefined;
  }
}
