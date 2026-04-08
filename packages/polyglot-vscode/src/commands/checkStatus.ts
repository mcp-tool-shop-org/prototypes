import * as vscode from 'vscode';
import { OllamaClient } from '@mcptoolshop/polyglot-mcp/ollama';
import { getConfig, log } from '../util.js';

export async function checkStatus(): Promise<void> {
  const { ollamaUrl, model } = getConfig();
  const client = new OllamaClient(ollamaUrl);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Checking Ollama…',
      cancellable: false,
    },
    async () => {
      try {
        // Step 1: Is Ollama running?
        const available = await client.isAvailable();
        if (!available) {
          const action = await vscode.window.showWarningMessage(
            'Ollama is not running. Polyglot needs Ollama to translate text using your local GPU.',
            'Start Ollama',
            'Install Ollama',
            'Help'
          );
          if (action === 'Start Ollama') {
            await startOllama(client);
          } else if (action === 'Install Ollama') {
            vscode.env.openExternal(vscode.Uri.parse('https://ollama.com'));
          } else if (action === 'Help') {
            vscode.commands.executeCommand('polyglot.help');
          }
          return;
        }

        // Step 2: Is the model available?
        const hasModel = await client.hasModel(model);
        if (!hasModel) {
          const action = await vscode.window.showWarningMessage(
            `Ollama is running, but the translation model "${model}" isn't installed yet. ` +
              'This is a one-time download (~8GB for 12b, ~1.5GB for 2b).',
            'Download Model',
            'Settings'
          );
          if (action === 'Download Model') {
            await pullModel(client, model);
          } else if (action === 'Settings') {
            vscode.commands.executeCommand(
              'workbench.action.openSettings',
              'polyglot.model'
            );
          }
          return;
        }

        // Step 3: All good!
        const models = await client.listModels();
        const modelList = models
          .map((m) => m.name)
          .filter((n) => n.includes('translate') || n.includes('gemma'))
          .join(', ');

        vscode.window.showInformationMessage(
          `Polyglot is ready! Model: ${model}` +
            (modelList ? ` | Available: ${modelList}` : ''),
          'Translate Selection',
          'Settings'
        ).then((action) => {
          if (action === 'Translate Selection') {
            vscode.commands.executeCommand('polyglot.translateSelection');
          } else if (action === 'Settings') {
            vscode.commands.executeCommand(
              'workbench.action.openSettings',
              'polyglot'
            );
          }
        });

        log(`Status: OK — ${model} ready at ${ollamaUrl}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
          vscode.window.showErrorMessage(
            `Can't reach Ollama at ${ollamaUrl}. Is it running?`,
            'Start Ollama',
            'Settings'
          ).then((action) => {
            if (action === 'Start Ollama') startOllama(client);
            else if (action === 'Settings') {
              vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'polyglot.ollamaUrl'
              );
            }
          });
        } else {
          vscode.window.showErrorMessage(
            `Something went wrong checking Ollama: ${msg}`,
            'Help'
          ).then((action) => {
            if (action === 'Help') vscode.commands.executeCommand('polyglot.help');
          });
        }

        log(`Status check error: ${msg}`);
      }
    }
  );
}

async function startOllama(client: OllamaClient): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Starting Ollama…',
      cancellable: false,
    },
    async () => {
      log('Attempting to start Ollama…');
      const started = await client.ensureRunning();
      if (started) {
        vscode.window.showInformationMessage(
          'Ollama started! You can now translate.',
          'Check Status'
        ).then((action) => {
          if (action === 'Check Status') {
            vscode.commands.executeCommand('polyglot.checkStatus');
          }
        });
        log('Ollama started successfully.');
      } else {
        vscode.window.showErrorMessage(
          'Could not start Ollama automatically. ' +
            'Try starting it manually: open a terminal and run "ollama serve".',
          'Install Ollama'
        ).then((action) => {
          if (action === 'Install Ollama') {
            vscode.env.openExternal(vscode.Uri.parse('https://ollama.com'));
          }
        });
      }
    }
  );
}

async function pullModel(client: OllamaClient, model: string): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Downloading ${model}… (this may take a few minutes)`,
      cancellable: false,
    },
    async () => {
      log(`Pulling model ${model}…`);
      const pulled = await client.ensureModel(model);
      if (pulled) {
        vscode.window.showInformationMessage(
          `Model "${model}" is ready! You can now translate.`,
          'Translate Selection'
        ).then((action) => {
          if (action === 'Translate Selection') {
            vscode.commands.executeCommand('polyglot.translateSelection');
          }
        });
        log(`Model ${model} pulled successfully.`);
      } else {
        vscode.window.showErrorMessage(
          `Failed to download "${model}". Try manually: ollama pull ${model}`,
          'Help'
        ).then((action) => {
          if (action === 'Help') vscode.commands.executeCommand('polyglot.help');
        });
      }
    }
  );
}
