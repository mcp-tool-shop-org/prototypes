/**
 * Status Bar — always-visible one-liner showing where you are in the graph.
 *
 * Zero attention cost. The user absorbs module/risk context peripherally.
 */

import * as vscode from "vscode";
import type { BearingsStore, ChangeBrief, CursorContext } from "@code-bearings/core";
import { resolveCursorContext } from "@code-bearings/core";

export class CursorStatusBar {
  private item: vscode.StatusBarItem;
  private store: BearingsStore | undefined;
  private brief: ChangeBrief | undefined;
  private staleIndicator: string = "";
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      50
    );
    this.item.command = "codeBearings.showSymbolDetail";
    this.item.tooltip = "Code Bearings — click for detail";

    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((e) => {
        this.debouncedUpdate(e.textEditor);
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) this.debouncedUpdate(editor);
        else this.item.hide();
      })
    );
  }

  setStore(store: BearingsStore): void {
    this.store = store;
    const editor = vscode.window.activeTextEditor;
    if (editor) this.update(editor);
  }

  setBrief(brief: ChangeBrief | undefined): void {
    this.brief = brief;
    const editor = vscode.window.activeTextEditor;
    if (editor) this.update(editor);
  }

  /** Show or clear a stale indicator prefix on the status bar */
  setStale(isStale: boolean): void {
    this.staleIndicator = isStale ? "$(sync~spin) " : "";
    const editor = vscode.window.activeTextEditor;
    if (editor) this.update(editor);
  }

  private debouncedUpdate(editor: vscode.TextEditor): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.update(editor), 150);
  }

  private update(editor: vscode.TextEditor): void {
    if (!this.store) {
      this.item.hide();
      return;
    }

    const filePath = editor.document.uri.fsPath;
    const line = editor.selection.active.line + 1; // VS Code is 0-based

    const ctx = resolveCursorContext(this.store, filePath, line, this.brief);

    if (!ctx.file) {
      this.item.hide();
      return;
    }

    this.item.text = this.staleIndicator + formatStatusText(ctx);
    this.item.tooltip = this.staleIndicator
      ? "Code Bearings — context may be stale · click for detail"
      : "Code Bearings — click for detail";
    this.item.show();
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.item.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

function formatStatusText(ctx: CursorContext): string {
  const parts: string[] = [];

  if (ctx.symbol) {
    const icon = ctx.symbolChanged ? "$(warning)" : "$(symbol-method)";
    parts.push(`${icon} ${ctx.symbol.name}`);

    if (ctx.module) {
      parts.push(ctx.module.name);
    }

    if (ctx.symbolChanged && ctx.changedModule) {
      parts.push(`CHANGED · risk ${ctx.changedModule.riskScore}`);
    } else {
      const callerCount = ctx.callers.length;
      const testCount = ctx.tests.length;
      const items: string[] = [];
      if (callerCount > 0) items.push(`${callerCount} caller${callerCount === 1 ? "" : "s"}`);
      if (testCount > 0) items.push(`${testCount} test${testCount === 1 ? "" : "s"}`);
      if (items.length > 0) parts.push(items.join(" · "));
    }
  } else if (ctx.file && ctx.module) {
    parts.push(`$(file) ${ctx.module.name}`);
    if (ctx.moduleMetrics) {
      parts.push(`${ctx.moduleMetrics.exportedSymbolCount} exports`);
    }
    if (ctx.inReview && ctx.changedModule) {
      parts.push(`risk ${ctx.changedModule.riskScore}`);
    }
  }

  return parts.join("  ·  ");
}
