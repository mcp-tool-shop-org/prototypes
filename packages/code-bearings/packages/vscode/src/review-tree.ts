import * as vscode from "vscode";
import type { ChangeBrief, ChangedModule } from "@code-bearings/core";
import { ReviewPanel } from "./review-panel.js";

/**
 * Tree data provider for the Review Brief activity bar view.
 *
 * Shows the current review state: summary, changed modules (risk-ordered),
 * contract shifts, and unknowns. Clicking a module focuses the review panel.
 */

type TreeItem = SummaryItem | SectionItem | ModuleItem | DetailItem;

class SummaryItem extends vscode.TreeItem {
  constructor(summary: string, confidence: string) {
    super(summary, vscode.TreeItemCollapsibleState.None);
    this.description = confidence;
    this.iconPath = new vscode.ThemeIcon("info");
    this.contextValue = "summary";
  }
}

class SectionItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly sectionType: string,
    public readonly children: TreeItem[],
    icon: string
  ) {
    super(
      label,
      children.length > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );
    this.iconPath = new vscode.ThemeIcon(icon);
    this.contextValue = "section";
  }
}

class ModuleItem extends vscode.TreeItem {
  constructor(
    public readonly cm: ChangedModule,
    public readonly moduleIndex: number
  ) {
    super(cm.moduleName, vscode.TreeItemCollapsibleState.None);
    this.description = riskLabel(cm.riskScore);
    this.tooltip = `Risk: ${cm.riskScore} · ${cm.riskReason}\n${cm.changeKinds.join(", ")}`;
    this.iconPath = new vscode.ThemeIcon(
      cm.riskScore >= 30 ? "warning" : cm.riskScore >= 15 ? "info" : "check"
    );
    this.contextValue = "changedModule";
    this.command = {
      command: "codeBearings.focusModule",
      title: "Focus Module",
      arguments: [moduleIndex],
    };
  }
}

class DetailItem extends vscode.TreeItem {
  constructor(text: string, icon: string) {
    super(text, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(icon);
    this.contextValue = "detail";
  }
}

function riskLabel(score: number): string {
  if (score >= 30) return `⚠ risk ${score}`;
  if (score >= 15) return `risk ${score}`;
  return `low ${score}`;
}

export class ReviewTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private brief: ChangeBrief | undefined;
  private staleReason: string | undefined;

  setBrief(brief: ChangeBrief): void {
    this.brief = brief;
    this.staleReason = undefined;
    this.refresh();
  }

  setStale(reason: string | undefined): void {
    this.staleReason = reason;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): TreeItem[] {
    if (!this.brief) return [];

    // Root level
    if (!element) {
      const items: TreeItem[] = [];

      // Stale warning (top of tree, non-intrusive)
      if (this.staleReason) {
        items.push(new DetailItem(
          `⟳ ${this.staleReason}`,
          "warning"
        ));
      }

      // Summary
      items.push(new SummaryItem(this.brief.summary, this.brief.confidence));

      // Changed modules — sorted by risk descending
      const sorted = [...this.brief.changedModules]
        .map((cm, i) => ({ cm, originalIndex: i }))
        .sort((a, b) => b.cm.riskScore - a.cm.riskScore);

      const moduleItems = sorted.map(
        ({ cm, originalIndex }) => new ModuleItem(cm, originalIndex)
      );
      items.push(
        new SectionItem(
          `Changed Modules (${moduleItems.length})`,
          "modules",
          moduleItems,
          "symbol-module"
        )
      );

      // Contract shifts
      if (this.brief.contractShifts.length > 0) {
        const shiftItems = this.brief.contractShifts.map(
          (s) => new DetailItem(s, "arrow-swap")
        );
        items.push(
          new SectionItem(
            `Contract Shifts (${shiftItems.length})`,
            "shifts",
            shiftItems,
            "arrow-swap"
          )
        );
      }

      // Unknowns
      if (this.brief.unknowns.length > 0) {
        const unknownItems = this.brief.unknowns.map(
          (u) => new DetailItem(`${u.category}: ${u.description}`, "question")
        );
        items.push(
          new SectionItem(
            `Unknowns (${unknownItems.length})`,
            "unknowns",
            unknownItems,
            "question"
          )
        );
      }

      return items;
    }

    // Section children
    if (element instanceof SectionItem) {
      return element.children;
    }

    return [];
  }
}
