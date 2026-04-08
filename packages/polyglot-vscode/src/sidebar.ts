import * as vscode from 'vscode';

/**
 * Sidebar webview with action buttons for quick translation access.
 */
export class PolyglotSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'polyglot.actions';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'translateSelection':
          vscode.commands.executeCommand('polyglot.translateSelection');
          break;
        case 'translateFile':
          vscode.commands.executeCommand('polyglot.translateFile');
          break;
        case 'translateReadme':
          vscode.commands.executeCommand('polyglot.translateReadme');
          break;
        case 'checkStatus':
          vscode.commands.executeCommand('polyglot.checkStatus');
          break;
        case 'help':
          vscode.commands.executeCommand('polyglot.help');
          break;
        case 'settings':
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'polyglot'
          );
          break;
      }
    });
  }

  private _getHtml(): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body {
      padding: 12px 16px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 4px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: var(--vscode-font-family);
      font-size: 13px;
      text-align: left;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      transition: background 0.1s;
    }
    .btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    .btn-label {
      flex: 1;
    }
    .btn-hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
    }
    .divider {
      border: none;
      border-top: 1px solid var(--vscode-widget-border);
      margin: 16px 0;
    }
    .tip {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
      margin-top: 8px;
    }
    .tip kbd {
      background: var(--vscode-keybindingLabel-background);
      border: 1px solid var(--vscode-keybindingLabel-border);
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 11px;
      font-family: var(--vscode-editor-font-family);
    }
  </style>
</head>
<body>
  <div class="section">
    <div class="section-title">Quick Actions</div>
    <button class="btn btn-primary" onclick="send('translateSelection')">
      <span class="btn-icon">&#127760;</span>
      <span class="btn-label">Translate Selection</span>
      <span class="btn-hint">Ctrl+Alt+T</span>
    </button>
    <button class="btn" onclick="send('translateFile')">
      <span class="btn-icon">&#128196;</span>
      <span class="btn-label">Translate File</span>
    </button>
    <button class="btn" onclick="send('translateReadme')">
      <span class="btn-icon">&#128214;</span>
      <span class="btn-label">Translate README</span>
      <span class="btn-hint">7 langs</span>
    </button>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-title">Tools</div>
    <button class="btn" onclick="send('checkStatus')">
      <span class="btn-icon">&#128994;</span>
      <span class="btn-label">Check Status</span>
    </button>
    <button class="btn" onclick="send('settings')">
      <span class="btn-icon">&#9881;</span>
      <span class="btn-label">Settings</span>
    </button>
    <button class="btn" onclick="send('help')">
      <span class="btn-icon">&#10067;</span>
      <span class="btn-label">Help</span>
    </button>
  </div>

  <hr class="divider">

  <div class="tip">
    <strong>Tip:</strong> Select text and press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>T</kbd> to translate instantly. You can also right-click selected text.
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function send(cmd) { vscode.postMessage({ command: cmd }); }
  </script>
</body>
</html>`;
  }
}
