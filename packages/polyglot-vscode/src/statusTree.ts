import * as vscode from 'vscode';
import { OllamaClient } from '@mcptoolshop/polyglot-mcp/ollama';
import { getConfig } from './util.js';

interface StatusItem {
  label: string;
  description?: string;
  icon: string;
  command?: string;
}

export class StatusTreeProvider implements vscode.TreeDataProvider<StatusItem>, vscode.Disposable {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _items: StatusItem[] = [
    { label: 'Checking…', icon: 'sync~spin' },
  ];

  private _pollTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.refresh();
    // Auto-refresh every 30s
    this._pollTimer = setInterval(() => this.refresh(), 30_000);
  }

  dispose(): void {
    clearInterval(this._pollTimer);
    this._onDidChangeTreeData.dispose();
  }

  refresh(): void {
    this._checkStatus().then((items) => {
      this._items = items;
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: StatusItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label);
    item.description = element.description;
    item.iconPath = new vscode.ThemeIcon(element.icon);
    item.contextValue = 'statusItem';
    if (element.command) {
      item.command = {
        title: element.label,
        command: element.command,
      };
    }
    return item;
  }

  getChildren(): StatusItem[] {
    return this._items;
  }

  private async _checkStatus(): Promise<StatusItem[]> {
    const { ollamaUrl, model } = getConfig();
    const client = new OllamaClient(ollamaUrl);
    const items: StatusItem[] = [];

    try {
      const available = await client.isAvailable();
      if (!available) {
        items.push({
          label: 'Ollama',
          description: 'Not running',
          icon: 'error',
          command: 'polyglot.checkStatus',
        });
        items.push({
          label: 'Start Ollama',
          icon: 'play',
          command: 'polyglot.checkStatus',
        });
        return items;
      }

      items.push({
        label: 'Ollama',
        description: 'Connected',
        icon: 'check',
      });

      const hasModel = await client.hasModel(model);
      if (hasModel) {
        items.push({
          label: 'Model',
          description: model,
          icon: 'check',
        });
      } else {
        items.push({
          label: 'Model',
          description: `${model} — not installed`,
          icon: 'warning',
          command: 'polyglot.checkStatus',
        });
      }

      // Show model list
      const models = await client.listModels();
      const translationModels = models.filter(
        (m) => m.name.includes('translate') || m.name.includes('gemma')
      );
      if (translationModels.length > 0) {
        items.push({
          label: 'Available',
          description: translationModels.map((m) => m.name).join(', '),
          icon: 'library',
        });
      }

      items.push({
        label: 'Server',
        description: ollamaUrl,
        icon: 'server',
      });

      items.push({
        label: 'Languages',
        description: '55 supported',
        icon: 'globe',
      });
    } catch {
      items.push({
        label: 'Connection error',
        description: ollamaUrl,
        icon: 'error',
        command: 'polyglot.checkStatus',
      });
    }

    return items;
  }
}
