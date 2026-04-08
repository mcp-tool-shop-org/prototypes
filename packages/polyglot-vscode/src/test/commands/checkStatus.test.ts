import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { checkStatus } from '../../commands/checkStatus.js';

const mockClient = {
  isAvailable: vi.fn(),
  hasModel: vi.fn(),
  listModels: vi.fn(),
  ensureRunning: vi.fn(),
  ensureModel: vi.fn(),
};

vi.mock('@mcptoolshop/polyglot-mcp/ollama', () => ({
  OllamaClient: vi.fn(() => mockClient),
}));

vi.mock('@mcptoolshop/polyglot-mcp/languages', () => ({
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ja', name: 'Japanese' },
  ],
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.isAvailable.mockResolvedValue(true);
  mockClient.hasModel.mockResolvedValue(true);
  mockClient.listModels.mockResolvedValue([
    { name: 'translategemma:12b' },
    { name: 'translategemma:2b' },
  ]);
});

describe('checkStatus', () => {
  it('shows warning when Ollama is not running', async () => {
    mockClient.isAvailable.mockResolvedValue(false);

    await checkStatus();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Ollama is not running'),
      'Start Ollama',
      'Install Ollama',
      'Help',
    );
  });

  it('shows warning when model is not installed', async () => {
    mockClient.isAvailable.mockResolvedValue(true);
    mockClient.hasModel.mockResolvedValue(false);

    await checkStatus();

    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('isn\'t installed'),
      'Download Model',
      'Settings',
    );
  });

  it('shows success when everything is ready', async () => {
    await checkStatus();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Polyglot is ready'),
      'Translate Selection',
      'Settings',
    );
  });

  it('lists available translation models in success message', async () => {
    await checkStatus();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('translategemma'),
      expect.any(String),
      expect.any(String),
    );
  });

  it('shows connection error for fetch failures', async () => {
    mockClient.isAvailable.mockRejectedValue(new Error('fetch failed'));

    await checkStatus();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Can't reach Ollama"),
      'Start Ollama',
      'Settings',
    );
  });

  it('shows generic error for unexpected failures', async () => {
    mockClient.isAvailable.mockRejectedValue(new Error('unexpected error'));

    await checkStatus();

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Something went wrong'),
      'Help',
    );
  });
});
