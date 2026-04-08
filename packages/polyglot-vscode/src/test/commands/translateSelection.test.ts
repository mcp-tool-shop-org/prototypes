import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { translateSelection } from '../../commands/translateSelection.js';

// Mock dependencies
vi.mock('@mcptoolshop/polyglot-mcp/translate', () => ({
  translate: vi.fn(async (text: string) => ({
    translation: `translated: ${text}`,
    durationMs: 1500,
    chunks: 1,
  })),
}));

vi.mock('@mcptoolshop/polyglot-mcp/languages', () => ({
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ja', name: 'Japanese' },
    { code: 'es', name: 'Spanish' },
  ],
}));

beforeEach(() => {
  vi.clearAllMocks();
  (vscode.window as Record<string, unknown>).activeTextEditor = undefined;
});

describe('translateSelection', () => {
  it('warns when no editor is open', async () => {
    (vscode.window as Record<string, unknown>).activeTextEditor = undefined;
    await translateSelection();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Open a file')
    );
  });

  it('warns when no text is selected', async () => {
    const mockEditor = {
      selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      document: { getText: vi.fn().mockReturnValue('') },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    await translateSelection();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Select the text')
    );
  });

  it('aborts when user cancels language picker', async () => {
    const mockEditor = {
      selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
      document: { getText: vi.fn().mockReturnValue('Hello') },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);

    await translateSelection();
    // Should not show progress or any error
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  it('translates selected text and replaces it', async () => {
    const editBuilder = { replace: vi.fn() };
    const mockEditor = {
      selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
      document: { getText: vi.fn().mockReturnValue('Hello') },
      edit: vi.fn(async (callback: (eb: typeof editBuilder) => void) => {
        callback(editBuilder);
        return true;
      }),
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    // User picks Japanese
    const pick = { label: 'Japanese', description: 'ja', language: { code: 'ja', name: 'Japanese' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(pick as never);

    await translateSelection();

    // Should have called withProgress
    expect(vscode.window.withProgress).toHaveBeenCalled();
    // Should have replaced selection content
    expect(editBuilder.replace).toHaveBeenCalledWith(
      mockEditor.selection,
      'translated: Hello',
    );
    // Should show success toast
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Japanese')
    );
  });

  it('shows friendly error when translation fails', async () => {
    const { translate } = await import('@mcptoolshop/polyglot-mcp/translate');
    vi.mocked(translate).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const mockEditor = {
      selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
      document: { getText: vi.fn().mockReturnValue('Hello') },
      edit: vi.fn(),
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    const pick = { label: 'Japanese', description: 'ja', language: { code: 'ja', name: 'Japanese' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(pick as never);

    await translateSelection();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Ollama doesn't seem to be running"),
      expect.any(String),
      expect.any(String),
    );
  });
});
