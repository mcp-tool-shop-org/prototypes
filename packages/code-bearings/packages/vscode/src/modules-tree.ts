import * as vscode from "vscode";
import path from "node:path";
import type { BearingsStore } from "@code-bearings/core";

/**
 * Tree data provider for the Modules activity bar view.
 *
 * Shows indexed modules with their files and exported symbols.
 * Clicking a module opens its files; clicking a symbol jumps to definition.
 */

type TreeItem = ModuleItem | FileItem | SymbolItem;

class ModuleItem extends vscode.TreeItem {
  constructor(
    public readonly moduleName: string,
    public readonly moduleId: number,
    public readonly boundaryKind: string,
    public readonly symbolCount: number,
    public readonly fanIn: number
  ) {
    super(moduleName, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = boundaryKind;
    this.tooltip = `${symbolCount} symbols · fan-in: ${fanIn}`;
    this.iconPath = new vscode.ThemeIcon("symbol-module");
    this.contextValue = "module";
  }
}

class FileItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly fileId: number,
    workspaceRoot: string
  ) {
    const relPath = path.relative(workspaceRoot, filePath);
    super(relPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon("file-code");
    this.tooltip = filePath;
    this.contextValue = "file";
    this.command = {
      command: "vscode.open",
      title: "Open File",
      arguments: [vscode.Uri.file(filePath)],
    };
  }
}

class SymbolItem extends vscode.TreeItem {
  constructor(
    public readonly symbolName: string,
    public readonly kind: string,
    public readonly filePath: string,
    public readonly line: number
  ) {
    super(symbolName, vscode.TreeItemCollapsibleState.None);
    this.description = kind;
    this.iconPath = new vscode.ThemeIcon(kindToIcon(kind));
    this.contextValue = "symbol";
    this.command = {
      command: "vscode.open",
      title: "Go to Symbol",
      arguments: [
        vscode.Uri.file(filePath),
        {
          selection: new vscode.Range(
            Math.max(0, line - 1), 0,
            Math.max(0, line - 1), 0
          ),
        },
      ],
    };
  }
}

function kindToIcon(kind: string): string {
  switch (kind) {
    case "function": return "symbol-function";
    case "class": return "symbol-class";
    case "interface": return "symbol-interface";
    case "type": return "symbol-type-parameter";
    case "variable": return "symbol-variable";
    case "enum": return "symbol-enum";
    default: return "symbol-misc";
  }
}

class StaleItem extends vscode.TreeItem {
  constructor(reason: string) {
    super(`⟳ ${reason}`, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon("warning");
    this.contextValue = "stale";
  }
}

export class ModulesTreeProvider implements vscode.TreeDataProvider<TreeItem | StaleItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | StaleItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private store: BearingsStore | undefined;
  private workspaceRoot: string;
  private staleReason: string | undefined;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  setStore(store: BearingsStore): void {
    this.store = store;
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

  getTreeItem(element: TreeItem | StaleItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem | StaleItem): (TreeItem | StaleItem)[] {
    if (!this.store) return [];

    // Root level: all modules
    if (!element) {
      const items: (TreeItem | StaleItem)[] = [];

      if (this.staleReason) {
        items.push(new StaleItem(this.staleReason));
      }

      const modules = this.store.getAllModules();
      for (const m of modules) {
        const metrics = this.store!.getModuleMetrics(m.id);
        items.push(new ModuleItem(
          m.name,
          m.id,
          m.boundaryKind,
          metrics.symbolCount,
          metrics.fanIn
        ));
      }
      return items;
    }

    // Module children: files
    if (element instanceof ModuleItem) {
      const mod = this.store.getModule(element.moduleName);
      if (!mod) return [];
      return mod.fileIds.map((fileId) => {
        const fileRecord = this.store!.getFile(fileId);
        if (!fileRecord) return null;
        const absPath = path.isAbsolute(fileRecord.path)
          ? fileRecord.path
          : path.resolve(this.workspaceRoot, fileRecord.path);
        return new FileItem(absPath, fileId, this.workspaceRoot);
      }).filter((f): f is FileItem => f !== null);
    }

    // File children: exported symbols
    if (element instanceof FileItem) {
      const symbols = this.store.getExportedSymbolsByFile(element.fileId);
      return symbols.map((s) => {
        return new SymbolItem(
          s.name,
          s.kind,
          element.filePath,
          s.line
        );
      });
    }

    return [];
  }
}
