import * as vscode from 'vscode';
import { translate } from '@mcptoolshop/polyglot-mcp/translate';
import { getConfig, pickLanguage, log, friendlyError } from '../util.js';

export async function translateSelection(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage(
      'Open a file and select some text first, then try again.'
    );
    return;
  }

  const selection = editor.selection;
  const text = editor.document.getText(selection);
  if (!text.trim()) {
    vscode.window.showWarningMessage(
      'Select the text you want to translate, then run this command again. ' +
        'Tip: Ctrl+Alt+T (Cmd+Alt+T on Mac) is the shortcut.'
    );
    return;
  }

  const target = await pickLanguage('Translate to…');
  if (!target) return;

  const { ollamaUrl, model, defaultSourceLanguage } = getConfig();
  const charCount = text.length;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Translating ${charCount} characters to ${target.name}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await translate(text, defaultSourceLanguage, target.code, {
          ollamaUrl,
          model,
        });

        await editor.edit((editBuilder) => {
          editBuilder.replace(selection, result.translation);
        });

        const seconds = (result.durationMs / 1000).toFixed(1);
        vscode.window.showInformationMessage(
          `Translated to ${target.name} in ${seconds}s`
        );
        log(
          `Selection → ${target.name}: ${charCount} chars, ${result.chunks} chunk(s), ${seconds}s`
        );
      } catch (err) {
        friendlyError('Translation failed', err);
      }
    }
  );
}
