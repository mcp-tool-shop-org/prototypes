/**
 * Gutter Decorations — ambient review heat on changed symbol lines.
 *
 * Red dot: risk >= 30 (high danger)
 * Yellow dot: risk 15-29 (moderate)
 * Blue dot: changed, low risk
 *
 * Only visible during active review. Disappears when review is cleared.
 */

import * as vscode from "vscode";
import type { BearingsStore, ChangeBrief } from "@code-bearings/core";

export class CursorDecorations {
  private store: BearingsStore | undefined;
  private brief: ChangeBrief | undefined;
  private disposables: vscode.Disposable[] = [];

  private readonly highRisk = vscode.window.createTextEditorDecorationType({
    gutterIconPath: undefined, // Will use overviewRulerColor instead
    overviewRulerColor: "#f85149",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    before: {
      contentText: "●",
      color: "#f85149",
      margin: "0 4px 0 0",
      fontWeight: "bold",
    },
  });

  private readonly mediumRisk = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: "#d29922",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    before: {
      contentText: "●",
      color: "#d29922",
      margin: "0 4px 0 0",
    },
  });

  private readonly lowRisk = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: "#58a6ff",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    before: {
      contentText: "·",
      color: "#58a6ff",
      margin: "0 4px 0 0",
    },
  });

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) this.updateDecorations(editor);
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === e.document) {
          this.updateDecorations(editor);
        }
      })
    );
  }

  setStore(store: BearingsStore): void {
    this.store = store;
  }

  setBrief(brief: ChangeBrief | undefined): void {
    this.brief = brief;
    // Refresh all visible editors
    for (const editor of vscode.window.visibleTextEditors) {
      this.updateDecorations(editor);
    }
  }

  private updateDecorations(editor: vscode.TextEditor): void {
    if (!this.store || !this.brief) {
      this.clearDecorations(editor);
      return;
    }

    const filePath = editor.document.uri.fsPath.replace(/\\/g, "/");
    const file = this.store.getFileByPath(filePath);
    if (!file) {
      this.clearDecorations(editor);
      return;
    }

    // Find module and check if it's in the review
    const modules = this.store.getAllModules();
    const module = modules.find((m) => m.fileIds.includes(file.id));
    if (!module) {
      this.clearDecorations(editor);
      return;
    }

    const changedModule = this.brief.changedModules.find(
      (cm) => cm.moduleName === module.name
    );
    if (!changedModule) {
      this.clearDecorations(editor);
      return;
    }

    // Get symbols in this file that are changed
    const symbols = this.store.getSymbolsByFile(file.id);
    const highRanges: vscode.Range[] = [];
    const mediumRanges: vscode.Range[] = [];
    const lowRanges: vscode.Range[] = [];

    for (const sym of symbols) {
      if (!changedModule.changedSymbols.includes(sym.name)) continue;

      const range = new vscode.Range(
        Math.max(0, sym.line - 1), 0,
        Math.max(0, sym.line - 1), 0
      );

      if (changedModule.riskScore >= 30) {
        highRanges.push(range);
      } else if (changedModule.riskScore >= 15) {
        mediumRanges.push(range);
      } else {
        lowRanges.push(range);
      }
    }

    editor.setDecorations(this.highRisk, highRanges);
    editor.setDecorations(this.mediumRisk, mediumRanges);
    editor.setDecorations(this.lowRisk, lowRanges);
  }

  private clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.highRisk, []);
    editor.setDecorations(this.mediumRisk, []);
    editor.setDecorations(this.lowRisk, []);
  }

  dispose(): void {
    this.highRisk.dispose();
    this.mediumRisk.dispose();
    this.lowRisk.dispose();
    for (const d of this.disposables) d.dispose();
  }
}
