import * as vscode from 'vscode';
import { createStatusBar } from './statusBar.js';
import { getOutputChannel, log } from './util.js';
import { translateSelection } from './commands/translateSelection.js';
import { translateFile } from './commands/translateFile.js';
import { translateReadme } from './commands/translateReadme.js';
import { checkStatus } from './commands/checkStatus.js';
import { help } from './commands/help.js';
import { PolyglotSidebarProvider } from './sidebar.js';
import { StatusTreeProvider } from './statusTree.js';

const WELCOME_SHOWN_KEY = 'polyglot.welcomeShown';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log('Activating Polyglot extension...');

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('polyglot.translateSelection', translateSelection),
    vscode.commands.registerCommand('polyglot.translateFile', translateFile),
    vscode.commands.registerCommand('polyglot.translateReadme', translateReadme),
    vscode.commands.registerCommand('polyglot.checkStatus', checkStatus),
    vscode.commands.registerCommand('polyglot.help', help),
    getOutputChannel(),
  );

  // Sidebar — action buttons webview
  const sidebarProvider = new PolyglotSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PolyglotSidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Sidebar — status tree
  const statusTree = new StatusTreeProvider();
  context.subscriptions.push(
    statusTree,
    vscode.window.registerTreeDataProvider('polyglot.status', statusTree),
    vscode.commands.registerCommand('polyglot.refreshStatus', () =>
      statusTree.refresh()
    ),
  );

  // Status bar
  createStatusBar(context);

  // First-time welcome (only once, stored in globalState)
  const welcomed = context.globalState.get<boolean>(WELCOME_SHOWN_KEY);
  if (!welcomed) {
    showWelcome(context);
  }

  log('Polyglot activated — 55 languages, local GPU translation.');
}

async function showWelcome(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(WELCOME_SHOWN_KEY, true);

  const action = await vscode.window.showInformationMessage(
    'Polyglot is ready! Translate text, files, and READMEs using your local GPU — 55 languages, zero cloud dependency.',
    'Get Started',
    'Check Status'
  );

  if (action === 'Get Started') {
    vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'mcp-tool-shop.polyglot-vscode#polyglot.welcome'
    );
  } else if (action === 'Check Status') {
    vscode.commands.executeCommand('polyglot.checkStatus');
  }
}

export function deactivate(): void {
  log('Polyglot deactivated.');
}
