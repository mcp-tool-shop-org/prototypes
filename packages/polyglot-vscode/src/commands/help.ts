import * as vscode from 'vscode';

export async function help(): Promise<void> {
  const pick = await vscode.window.showQuickPick(
    [
      {
        label: '$(pulse) Check Status',
        description: 'Verify Ollama is running and the model is ready',
        action: 'status',
      },
      {
        label: '$(gear) Open Settings',
        description: 'Configure model, Ollama URL, and default languages',
        action: 'settings',
      },
      {
        label: '$(mortar-board) Open Walkthrough',
        description: 'Step-by-step guide to get started',
        action: 'walkthrough',
      },
      {
        label: '$(link-external) Ollama Website',
        description: 'Download and install Ollama',
        action: 'ollama',
      },
      {
        label: '$(github) GitHub Repository',
        description: 'Report issues, contribute, or star the project',
        action: 'github',
      },
      {
        label: '$(info) About',
        description: 'Polyglot v1.0.3 — TranslateGemma 12B via Ollama, 55 languages',
        action: 'about',
      },
    ],
    { placeHolder: 'How can Polyglot help?' }
  );

  if (!pick) return;

  switch (pick.action) {
    case 'status':
      vscode.commands.executeCommand('polyglot.checkStatus');
      break;
    case 'settings':
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'polyglot'
      );
      break;
    case 'walkthrough':
      vscode.commands.executeCommand(
        'workbench.action.openWalkthrough',
        'mcp-tool-shop.polyglot-vscode#polyglot.welcome'
      );
      break;
    case 'ollama':
      vscode.env.openExternal(vscode.Uri.parse('https://ollama.com'));
      break;
    case 'github':
      vscode.env.openExternal(
        vscode.Uri.parse('https://github.com/mcp-tool-shop-org/polyglot-vscode')
      );
      break;
    case 'about':
      vscode.window.showInformationMessage(
        'Polyglot v1.0.3 — Local GPU translation powered by TranslateGemma 12B via Ollama. ' +
          '55 languages, zero cloud dependency. All translation happens on your machine.',
        'GitHub',
        'Ollama'
      ).then((action) => {
        if (action === 'GitHub') {
          vscode.env.openExternal(
            vscode.Uri.parse('https://github.com/mcp-tool-shop-org/polyglot-vscode')
          );
        } else if (action === 'Ollama') {
          vscode.env.openExternal(vscode.Uri.parse('https://ollama.com'));
        }
      });
      break;
  }
}
