import * as vscode from 'vscode';
import { OllamaClient } from '@mcptoolshop/polyglot-mcp/ollama';
import { getConfig, log } from './util.js';

let statusBarItem: vscode.StatusBarItem;
let pollTimer: ReturnType<typeof setInterval> | undefined;

export function createStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    50
  );
  statusBarItem.command = 'polyglot.checkStatus';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Show "checking" state immediately
  statusBarItem.text = '$(sync~spin) Polyglot';
  statusBarItem.tooltip = 'Checking Ollama connection…';

  // Initial check
  pollOllama();

  // Poll every 30 seconds
  pollTimer = setInterval(pollOllama, 30_000);
  context.subscriptions.push({ dispose: () => clearInterval(pollTimer!) });
}

async function pollOllama(): Promise<void> {
  const { ollamaUrl, model } = getConfig();
  const client = new OllamaClient(ollamaUrl);

  try {
    const available = await client.isAvailable();
    if (!available) {
      statusBarItem.text = '$(warning) Polyglot';
      statusBarItem.tooltip = new vscode.MarkdownString(
        '$(warning) **Ollama is not running**\n\nClick to start Ollama or check your setup.'
      );
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
      statusBarItem.color = undefined;
      return;
    }

    const hasModel = await client.hasModel(model);
    if (!hasModel) {
      statusBarItem.text = '$(cloud-download) Polyglot';
      statusBarItem.tooltip = new vscode.MarkdownString(
        `$(cloud-download) **Model not installed**\n\n\`${model}\` needs to be downloaded (~8GB). Click to set up.`
      );
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
      statusBarItem.color = undefined;
      return;
    }

    statusBarItem.text = '$(globe) Polyglot';
    statusBarItem.tooltip = new vscode.MarkdownString(
      `$(globe) **Polyglot ready**\n\nModel: \`${model}\`\nServer: \`${ollamaUrl}\`\n55 languages available\n\n_Click for status details_`
    );
    statusBarItem.backgroundColor = undefined;
    statusBarItem.color = undefined;
  } catch {
    statusBarItem.text = '$(error) Polyglot';
    statusBarItem.tooltip = new vscode.MarkdownString(
      '$(error) **Connection error**\n\nCould not reach Ollama. Click to troubleshoot.'
    );
    statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.errorBackground'
    );
    statusBarItem.color = undefined;
  }
}
