/**
 * CodeLens Provider — inline annotations on changed symbols during review.
 *
 * Only appears when a review is active. Only on symbols that cross
 * the interest threshold (risk >= 15 or critical tips). Noise control is law.
 */

import * as vscode from "vscode";
import type { BearingsStore, ChangeBrief, ChangedModule } from "@code-bearings/core";

const MAX_CODELENS_PER_FILE = 8;

export class CursorCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private store: BearingsStore | undefined;
  private brief: ChangeBrief | undefined;

  setStore(store: BearingsStore): void {
    this.store = store;
  }

  setBrief(brief: ChangeBrief | undefined): void {
    this.brief = brief;
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (!this.store || !this.brief) return [];

    const filePath = document.uri.fsPath.replace(/\\/g, "/");
    const file = this.store.getFileByPath(filePath);
    if (!file) return [];

    // Find which module this file belongs to
    const modules = this.store.getAllModules();
    const module = modules.find((m) => m.fileIds.includes(file.id));
    if (!module) return [];

    // Check if this module is in the review
    const changedModule = this.brief.changedModules.find(
      (cm) => cm.moduleName === module.name
    );
    if (!changedModule) return [];

    // Get symbols in this file
    const symbols = this.store.getSymbolsByFile(file.id);
    const lenses: vscode.CodeLens[] = [];

    for (const sym of symbols) {
      if (lenses.length >= MAX_CODELENS_PER_FILE) break;

      // Only annotate symbols that are in the changed set
      if (!changedModule.changedSymbols.includes(sym.name)) continue;

      const explanation = changedModule.symbolExplanations.find(
        (se) => se.symbolName === sym.name
      );

      // Interest threshold: risk >= 15 or has explanation
      if (changedModule.riskScore < 15 && !explanation) continue;

      const range = new vscode.Range(
        Math.max(0, sym.line - 1), 0,
        Math.max(0, sym.line - 1), 0
      );

      const titleParts: string[] = [];

      // Risk indicator
      if (changedModule.riskScore >= 30) {
        titleParts.push(`⚠ Risk ${changedModule.riskScore}`);
      } else if (changedModule.riskScore >= 15) {
        titleParts.push(`Risk ${changedModule.riskScore}`);
      }

      // Change type from explanation
      if (explanation) {
        titleParts.push(explanation.changeType);
      }

      // Downstream impact
      if (changedModule.affectedDownstream.length > 0) {
        titleParts.push(
          `${changedModule.affectedDownstream.length} downstream`
        );
      }

      const title = `$(telescope) ${titleParts.join(" · ")}`;

      lenses.push(
        new vscode.CodeLens(range, {
          title,
          command: "codeBearings.showSymbolDetail",
          tooltip: explanation?.explanation ?? "Code Bearings: click for detail",
        })
      );
    }

    return lenses;
  }
}
