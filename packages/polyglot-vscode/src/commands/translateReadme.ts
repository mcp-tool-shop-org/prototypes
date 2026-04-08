import * as vscode from 'vscode';
import * as path from 'node:path';
import { resolveLanguage } from '@mcptoolshop/polyglot-mcp/languages';
import { translateReadme as doTranslate } from '../readmeTranslator.js';
import { getConfig, getOutputChannel, pickLanguages, log, friendlyError } from '../util.js';

export async function translateReadme(): Promise<void> {
  // Find README.md in workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage(
      'Open a folder that contains a README.md first.'
    );
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const readmeUri = vscode.Uri.joinPath(rootUri, 'README.md');

  let readmeContent: string;
  try {
    const bytes = await vscode.workspace.fs.readFile(readmeUri);
    readmeContent = Buffer.from(bytes).toString('utf-8');
  } catch {
    vscode.window.showWarningMessage(
      `No README.md found in ${path.basename(rootUri.fsPath)}. ` +
        'Create one first, then run this command again.'
    );
    return;
  }

  const { ollamaUrl, model, defaultLanguages } = getConfig();

  const targetCodes = await pickLanguages(
    'Which languages? (pre-selected from your settings)',
    defaultLanguages
  );
  if (!targetCodes) return;

  const total = targetCodes.length;
  const startTime = Date.now();
  let succeeded = 0;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Translating README',
      cancellable: false,
    },
    async (progress) => {
      for (let i = 0; i < targetCodes.length; i++) {
        const code = targetCodes[i];
        const lang = resolveLanguage(code);
        const name = lang?.name ?? code;

        progress.report({
          message: `${name} (${i + 1}/${total})…`,
          increment: (1 / total) * 100,
        });

        try {
          const translated = await doTranslate(readmeContent, code, {
            ollamaUrl,
            model,
            onProgress: (msg) => log(`[${name}] ${msg}`),
          });

          const outUri = vscode.Uri.joinPath(
            rootUri,
            `README.${code.toLowerCase()}.md`
          );
          await vscode.workspace.fs.writeFile(
            outUri,
            Buffer.from(translated, 'utf-8')
          );

          succeeded++;
          log(`README → ${name}: ${path.basename(outUri.fsPath)}`);
        } catch (err) {
          friendlyError(`Failed translating README to ${name}`, err);
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      if (succeeded === total) {
        vscode.window.showInformationMessage(
          `README translated to ${total} language(s) in ${elapsed}s.`,
          'Show Output'
        ).then((action) => {
          if (action === 'Show Output') getOutputChannel().show();
        });
      } else {
        vscode.window.showWarningMessage(
          `${succeeded}/${total} translations completed. Check the output for errors.`,
          'Show Output'
        ).then((action) => {
          if (action === 'Show Output') getOutputChannel().show();
        });
      }
    }
  );
}
