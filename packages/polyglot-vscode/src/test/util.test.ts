import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { getConfig, pickLanguage, pickLanguages, log, friendlyError } from '../util.js';

// Mock polyglot-mcp languages
vi.mock('@mcptoolshop/polyglot-mcp/languages', () => ({
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ja', name: 'Japanese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'zh', name: 'Chinese' },
  ],
}));

beforeEach(() => {
  vi.clearAllMocks();
});

/* ========================================================================
 * getConfig
 * ======================================================================== */
describe('getConfig', () => {
  it('returns default config values', () => {
    const config = getConfig();
    expect(config.ollamaUrl).toBe('http://localhost:11434');
    expect(config.model).toBe('translategemma:12b');
    expect(config.defaultSourceLanguage).toBe('en');
    expect(config.defaultLanguages).toEqual(['ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt-BR']);
  });

  it('reads from VS Code workspace configuration', () => {
    const mockGet = vi.fn((key: string) => {
      if (key === 'ollamaUrl') return 'http://custom:11434';
      if (key === 'model') return 'translategemma:2b';
      return undefined;
    });
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValueOnce({
      get: mockGet,
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('polyglot');
    expect(config.ollamaUrl).toBe('http://custom:11434');
    expect(config.model).toBe('translategemma:2b');
  });
});

/* ========================================================================
 * pickLanguage
 * ======================================================================== */
describe('pickLanguage', () => {
  it('shows quickpick with languages excluding English', async () => {
    const mockPick = { label: 'Japanese', description: 'ja', language: { code: 'ja', name: 'Japanese' } };
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(mockPick as never);

    const result = await pickLanguage('Translate to…');

    expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Japanese', description: 'ja' }),
      ]),
      expect.objectContaining({ placeHolder: 'Translate to…', matchOnDescription: true }),
    );

    // Should NOT contain English
    const items = vi.mocked(vscode.window.showQuickPick).mock.calls[0][0] as Array<{ description: string }>;
    expect(items.every((item) => item.description !== 'en')).toBe(true);

    expect(result).toEqual({ code: 'ja', name: 'Japanese' });
  });

  it('returns undefined when user cancels', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);
    const result = await pickLanguage('Pick one');
    expect(result).toBeUndefined();
  });
});

/* ========================================================================
 * pickLanguages
 * ======================================================================== */
describe('pickLanguages', () => {
  it('shows multi-select quickpick with pre-selected defaults', async () => {
    const picks = [
      { label: 'Japanese', description: 'ja', picked: true, language: { code: 'ja', name: 'Japanese' } },
      { label: 'Spanish', description: 'es', picked: true, language: { code: 'es', name: 'Spanish' } },
    ];
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(picks as never);

    const result = await pickLanguages('Which languages?', ['ja', 'es']);

    expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ canPickMany: true }),
    );
    expect(result).toEqual(['ja', 'es']);
  });

  it('returns undefined when user cancels', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce(undefined as never);
    const result = await pickLanguages('Pick languages', ['ja']);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty selection', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce([] as never);
    const result = await pickLanguages('Pick languages', []);
    expect(result).toBeUndefined();
  });

  it('marks defaults as picked', async () => {
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce([] as never);
    await pickLanguages('Pick', ['ja', 'fr']);

    const items = vi.mocked(vscode.window.showQuickPick).mock.calls[0][0] as Array<{ description: string; picked: boolean }>;
    const jaItem = items.find((i) => i.description === 'ja');
    const frItem = items.find((i) => i.description === 'fr');
    const esItem = items.find((i) => i.description === 'es');

    expect(jaItem?.picked).toBe(true);
    expect(frItem?.picked).toBe(true);
    expect(esItem?.picked).toBe(false);
  });
});

/* ========================================================================
 * log
 * ======================================================================== */
describe('log', () => {
  it('writes timestamped message to output channel', () => {
    log('Test message');
    const channel = vi.mocked(vscode.window.createOutputChannel).mock.results[0]?.value;
    if (channel) {
      expect(channel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] Test message$/)
      );
    }
  });
});

/* ========================================================================
 * friendlyError
 * ======================================================================== */
describe('friendlyError', () => {
  it('shows Ollama-not-running message for fetch errors', () => {
    friendlyError('Translation', new Error('fetch failed'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Ollama doesn't seem to be running"),
      'Check Status',
      'Help',
    );
  });

  it('shows Ollama-not-running message for ECONNREFUSED', () => {
    friendlyError('Translation', new Error('ECONNREFUSED'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Ollama doesn't seem to be running"),
      'Check Status',
      'Help',
    );
  });

  it('shows model-not-found message', () => {
    friendlyError('Translation', new Error('model not found'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("translation model isn't available"),
      'Check Status',
    );
  });

  it('shows unsupported-language message', () => {
    friendlyError('Translation', new Error('Unsupported language: xx'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('55 languages'),
      'Settings',
    );
  });

  it('shows generic fallback for unknown errors', () => {
    friendlyError('Operation', new Error('Something unexpected'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Something unexpected'),
      'Help',
    );
  });

  it('handles non-Error objects', () => {
    friendlyError('Operation', 'string error');
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('string error'),
      'Help',
    );
  });
});
