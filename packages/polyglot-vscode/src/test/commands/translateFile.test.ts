import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { translateFile } from '../../commands/translateFile.js';

vi.mock('@mcptoolshop/polyglot-mcp/translate', () => ({
  translate: vi.fn(async () => ({
    translation: 'translated content',
    durationMs: 2000,
    chunks: 3,
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

describe('translateFile', () => {
  it('warns when no editor is open', async () => {
    await translateFile();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Open a file')
    );
  });

  it('warns when file is untitled (not saved)', async () => {
    const mockEditor = {
      document: { isUntitled: true },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    await translateFile();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Save the file')
    );
  });

  it('aborts when user cancels language picker', async () => {
    const mockEditor = {
      document: {
        isUntitled: false,
        getText: vi.fn().mockReturnValue('content'),
        fileName: '/project/README.md',
      },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);

    await translateFile();
    expect(vscode.window.withProgress).not.toHaveBeenCalled();
  });

  it('creates translated file with correct naming pattern', async () => {
    const mockEditor = {
      document: {
        isUntitled: false,
        getText: vi.fn().mockReturnValue('Hello world'),
        fileName: '/project/README.md',
      },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    const pick = { label: 'Japanese', description: 'ja', language: { code: 'ja', name: 'Japanese' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(pick as never);

    await translateFile();

    // Should write to README.ja.md
    expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ fsPath: expect.stringContaining('README.ja.md') }),
      expect.any(Buffer),
    );
  });

  it('opens translated file in split view', async () => {
    const mockEditor = {
      document: {
        isUntitled: false,
        getText: vi.fn().mockReturnValue('content'),
        fileName: '/project/notes.txt',
      },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    const pick = { label: 'Spanish', description: 'es', language: { code: 'es', name: 'Spanish' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(pick as never);

    await translateFile();

    expect(vscode.window.showTextDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ viewColumn: vscode.ViewColumn.Beside }),
    );
  });

  it('shows success message with timing', async () => {
    const mockEditor = {
      document: {
        isUntitled: false,
        getText: vi.fn().mockReturnValue('content'),
        fileName: '/project/README.md',
      },
    };
    (vscode.window as Record<string, unknown>).activeTextEditor = mockEditor;

    const pick = { label: 'Japanese', description: 'ja', language: { code: 'ja', name: 'Japanese' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(pick as never);

    await translateFile();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringMatching(/README\.md.*README\.ja\.md/)
    );
  });
});
