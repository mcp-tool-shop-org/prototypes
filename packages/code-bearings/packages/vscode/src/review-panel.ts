import * as vscode from "vscode";
import path from "node:path";
import {
  renderHtmlReport,
  generateModeContent,
  BearingsStore,
} from "@code-bearings/core";
import type {
  ChangeBrief,
  ReviewMode,
  ModeContent,
  GraphData,
} from "@code-bearings/core";
import type { WebviewToHostMessage } from "./messages.js";

/**
 * The postMessage bridge script injected into the HTML report.
 * Hooks into the report's existing interactive elements and forwards
 * user actions to the extension host via acquireVsCodeApi().
 *
 * This keeps the core renderer pure — it produces standalone HTML.
 * The VS Code surface wires it into the editor.
 */
const BRIDGE_SCRIPT = `
<script>
(function() {
  const vscode = acquireVsCodeApi();

  // ── Source jumps: click evidence locations to open in editor ──
  document.addEventListener('click', function(e) {
    const loc = e.target.closest('.evidence-loc');
    if (loc) {
      e.preventDefault();
      e.stopPropagation();
      const filePath = loc.getAttribute('data-file');
      const line = parseInt(loc.getAttribute('data-line') || '1', 10);
      if (filePath) {
        vscode.postMessage({ type: 'openFile', filePath: filePath, line: line });
      }
      return;
    }
  });

  // ── Mode switching: override the report's switchMode function ──
  if (typeof window.switchMode === 'function') {
    const originalSwitchMode = window.switchMode;
    window.switchMode = function(mode) {
      // Let the report do its CSS toggle for immediate visual feedback
      originalSwitchMode(mode);
      // Tell the host to re-render with the new mode's full content
      vscode.postMessage({ type: 'switchMode', mode: mode });
    };
  }

  // ── Focus mode: track module navigation ──
  const origShowFocusPage = window.showFocusPage;
  if (typeof origShowFocusPage === 'function') {
    window.showFocusPage = function(index) {
      origShowFocusPage(index);
      const page = document.getElementById('focus-page-' + index);
      if (page) {
        const moduleName = page.getAttribute('data-module-name') || '';
        vscode.postMessage({ type: 'focusModule', moduleName: moduleName, index: index });
      }
    };
  }

  // ── Host → Webview messages ──
  window.addEventListener('message', function(event) {
    const msg = event.data;
    if (msg.type === 'focusIndex') {
      // Scroll to and expand the target module
      if (typeof window.showFocusPage === 'function') {
        window.showFocusPage(msg.index);
      } else if (typeof window.toggleModule === 'function') {
        window.toggleModule(msg.index);
        const el = document.getElementById('module-' + msg.index);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (msg.type === 'staleBanner') {
      let banner = document.getElementById('cb-stale-banner');
      if (msg.visible) {
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'cb-stale-banner';
          banner.style.cssText = 'position:sticky;top:0;z-index:1000;background:#d29922;color:#1c1c1c;padding:6px 16px;font-size:13px;text-align:center;cursor:pointer;';
          banner.title = 'Click to refresh review';
          banner.addEventListener('click', function() {
            vscode.postMessage({ type: 'refreshReview' });
          });
          document.body.prepend(banner);
        }
        banner.textContent = msg.reason;
        banner.style.display = 'block';
      } else if (banner) {
        banner.style.display = 'none';
      }
    }
  });

  // Signal ready
  vscode.postMessage({ type: 'ready' });
})();
</script>
`;

/**
 * Webview panel that renders the Change Brief as an interactive HTML report.
 *
 * This is a thin surface over the canonical rendering from core.
 * The extension does not produce its own truth — it wires the report's
 * interactive elements into VS Code editor actions.
 */
export class ReviewPanel {
  public static currentPanel: ReviewPanel | undefined;
  private static readonly viewType = "codeBearings.reviewBrief";

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  // Retained state for re-rendering on mode switch
  private brief: ChangeBrief;
  private moduleGraphs: Map<string, GraphData>;
  private reviewMode: ReviewMode;
  private modeContent: ModeContent;
  private store: BearingsStore;
  private workspaceRoot: string;

  private constructor(
    panel: vscode.WebviewPanel,
    brief: ChangeBrief,
    moduleGraphs: Map<string, GraphData>,
    reviewMode: ReviewMode,
    modeContent: ModeContent,
    store: BearingsStore,
    workspaceRoot: string
  ) {
    this.panel = panel;
    this.brief = brief;
    this.moduleGraphs = moduleGraphs;
    this.reviewMode = reviewMode;
    this.modeContent = modeContent;
    this.store = store;
    this.workspaceRoot = workspaceRoot;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // ── Message bridge: webview → host ──
    this.panel.webview.onDidReceiveMessage(
      (msg: WebviewToHostMessage) => this.handleMessage(msg),
      null,
      this.disposables
    );

    this.render();
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    brief: ChangeBrief,
    moduleGraphs: Map<string, GraphData>,
    reviewMode: ReviewMode,
    modeContent: ModeContent,
    store: BearingsStore,
    workspaceRoot: string
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel.panel.reveal(column);
      ReviewPanel.currentPanel.brief = brief;
      ReviewPanel.currentPanel.moduleGraphs = moduleGraphs;
      ReviewPanel.currentPanel.reviewMode = reviewMode;
      ReviewPanel.currentPanel.modeContent = modeContent;
      ReviewPanel.currentPanel.store = store;
      ReviewPanel.currentPanel.workspaceRoot = workspaceRoot;
      ReviewPanel.currentPanel.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ReviewPanel.viewType,
      "Code Bearings: Review Brief",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ReviewPanel.currentPanel = new ReviewPanel(
      panel,
      brief,
      moduleGraphs,
      reviewMode,
      modeContent,
      store,
      workspaceRoot
    );
  }

  /**
   * Post a message to the webview (host → webview direction).
   */
  public postMessage(msg: { type: string; [key: string]: unknown }): void {
    this.panel.webview.postMessage(msg);
  }

  /**
   * Show or hide the stale review banner.
   * Uses DOM injection — no scroll loss, no re-render.
   */
  public showStaleBanner(visible: boolean, reason: string): void {
    this.panel.webview.postMessage({
      type: "staleBanner",
      visible,
      reason,
    });
  }

  // ── Message handlers ──

  private async handleMessage(msg: WebviewToHostMessage): Promise<void> {
    switch (msg.type) {
      case "openFile":
        await this.handleOpenFile(msg.filePath, msg.line);
        break;

      case "switchMode":
        this.handleSwitchMode(msg.mode);
        break;

      case "focusModule":
        await this.handleFocusModule(msg.moduleName);
        break;

      case "refreshReview":
        // User clicked the stale banner — trigger refresh via VS Code command
        vscode.commands.executeCommand("codeBearings.refreshAll");
        break;

      case "ready":
        // Webview loaded — no action needed
        break;
    }
  }

  private async handleOpenFile(filePath: string, line: number): Promise<void> {
    const absPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.workspaceRoot, filePath);

    try {
      const doc = await vscode.workspace.openTextDocument(absPath);
      const lineNum = Math.max(0, line - 1); // VS Code lines are 0-based
      const range = new vscode.Range(lineNum, 0, lineNum, 0);
      await vscode.window.showTextDocument(doc, {
        viewColumn: vscode.ViewColumn.One,
        selection: range,
        preserveFocus: false,
      });
    } catch {
      vscode.window.showWarningMessage(`Could not open: ${filePath}`);
    }
  }

  private handleSwitchMode(mode: ReviewMode): void {
    this.reviewMode = mode;
    this.modeContent = generateModeContent(mode, this.brief, this.store);
    this.render();
  }

  private async handleFocusModule(moduleName: string): Promise<void> {
    // Open the first file in the focused module for context
    const mod = this.store.getModule(moduleName);
    if (!mod) return;

    // Get the module's files from the store
    if (mod.fileIds.length > 0) {
      const firstFile = this.store.getFile(mod.fileIds[0]);
      if (firstFile) {
        await this.handleOpenFile(firstFile.path, 1);
      }
    }
  }

  // ── Rendering ──

  private render(): void {
    this.panel.title = `Review: ${this.brief.summary.slice(0, 40)}`;

    // Get the canonical HTML from core
    let html = renderHtmlReport(
      this.brief,
      this.moduleGraphs,
      this.reviewMode,
      this.modeContent
    );

    // Inject the postMessage bridge before </body>
    html = html.replace("</body>", BRIDGE_SCRIPT + "</body>");

    this.panel.webview.html = html;
  }

  private dispose(): void {
    ReviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
