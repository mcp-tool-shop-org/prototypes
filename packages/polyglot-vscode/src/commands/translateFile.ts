import * as vscode from 'vscode';
import * as path from 'node:path';
import { translate } from '@mcptoolshop/polyglot-mcp/translate';
import { getConfig, pickLanguage, log, friendlyError } from '../util.js';

export async function translateFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Open a file first, then run this command.');
    return;
  }

  const doc = editor.document;
  if (doc.isUntitled) {
    vscode.window.showWarningMessage(
      'Save the file first — Polyglot needs a file path to write the translation alongside it.'
    );
    return;
  }

  const targetLang = await pickLanguage('Translate this file to…');
  if (!targetLang) return;

  const text = doc.getText();
  const { ollamaUrl, model, defaultSourceLanguage } = getConfig();
  const fileName = path.basename(doc.fileName);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Translating ${fileName} → ${targetLang.name}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await translate(text, defaultSourceLanguage, targetLang.code, {
          ollamaUrl,
          model,
        });

        // Build output filename: file.txt → file.ja.txt
        const parsed = path.parse(doc.fileName);
        const outName = `${parsed.name}.${targetLang.code}${parsed.ext}`;
        const outPath = path.join(parsed.dir, outName);
        const outUri = vscode.Uri.file(outPath);

        await vscode.workspace.fs.writeFile(
          outUri,
          Buffer.from(result.translation, 'utf-8')
        );

        // Open the translated file
        const openDoc = await vscode.workspace.openTextDocument(outUri);
        await vscode.window.showTextDocument(openDoc, {
          preview: false,
          viewColumn: vscode.ViewColumn.Beside,
        });

        const seconds = (result.durationMs / 1000).toFixed(1);
        vscode.window.showInformationMessage(
          `${fileName} → ${outName} (${seconds}s)`
        );
        log(`File translated: ${fileName} → ${outName}, ${seconds}s`);
      } catch (err) {
        friendlyError(`Failed to translate ${fileName}`, err);
      }
    }
  );
}
