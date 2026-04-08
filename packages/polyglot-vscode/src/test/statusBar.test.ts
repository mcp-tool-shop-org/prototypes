import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { createStatusBar } from '../statusBar.js';

const mockClient = {
  isAvailable: vi.fn(),
  hasModel: vi.fn(),
};

vi.mock('@mcptoolshop/polyglot-mcp/ollama', () => ({
  OllamaClient: vi.fn(() => mockClient),
}));

vi.mock('@mcptoolshop/polyglot-mcp/languages', () => ({
  LANGUAGES: [{ code: 'en', name: 'English' }],
}));

let mockStatusBarItem: {
  text: string;
  tooltip: unknown;
  command: string;
  backgroundColor: unknown;
  color: unknown;
  show: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  mockStatusBarItem = {
    text: '',
    tooltip: '',
    command: '',
    backgroundColor: undefined,
    color: undefined,
    show: vi.fn(),
    dispose: vi.fn(),
  };
  vi.mocked(vscode.window.createStatusBarItem).mockReturnValue(mockStatusBarItem as never);

  mockClient.isAvailable.mockResolvedValue(true);
  mockClient.hasModel.mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

function createMockContext() {
  const subscriptions: Array<{ dispose: () => void }> = [];
  return {
    subscriptions,
    globalState: { get: vi.fn(), update: vi.fn() },
    extensionUri: vscode.Uri.file('/ext'),
    extensionPath: '/ext',
  } as unknown as vscode.ExtensionContext;
}

describe('createStatusBar', () => {
  it('creates a right-aligned status bar item', () => {
    const ctx = createMockContext();
    createStatusBar(ctx);

    expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
      vscode.StatusBarAlignment.Right,
      50,
    );
  });

  it('sets checkStatus as click command', () => {
    const ctx = createMockContext();
    createStatusBar(ctx);
    expect(mockStatusBarItem.command).toBe('polyglot.checkStatus');
  });

  it('shows the status bar item immediately', () => {
    const ctx = createMockContext();
    createStatusBar(ctx);
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it('shows initial "checking" spinner state', () => {
    const ctx = createMockContext();
    createStatusBar(ctx);
    expect(mockStatusBarItem.text).toBe('$(sync~spin) Polyglot');
  });

  it('registers disposables in extension context', () => {
    const ctx = createMockContext();
    createStatusBar(ctx);
    // Should register the status bar item + poll timer disposable
    expect(ctx.subscriptions.length).toBeGreaterThanOrEqual(2);
  });

  it('shows ready state when Ollama is available with model', async () => {
    const ctx = createMockContext();
    createStatusBar(ctx);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockStatusBarItem.text).toBe('$(globe) Polyglot');
    expect(mockStatusBarItem.backgroundColor).toBeUndefined();
  });

  it('shows warning when Ollama is not running', async () => {
    mockClient.isAvailable.mockResolvedValue(false);

    const ctx = createMockContext();
    createStatusBar(ctx);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockStatusBarItem.text).toBe('$(warning) Polyglot');
  });

  it('shows warning when model is not installed', async () => {
    mockClient.isAvailable.mockResolvedValue(true);
    mockClient.hasModel.mockResolvedValue(false);

    const ctx = createMockContext();
    createStatusBar(ctx);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockStatusBarItem.text).toBe('$(cloud-download) Polyglot');
  });

  it('shows error state on connection failure', async () => {
    mockClient.isAvailable.mockRejectedValue(new Error('network error'));

    const ctx = createMockContext();
    createStatusBar(ctx);
    await vi.advanceTimersByTimeAsync(0);

    expect(mockStatusBarItem.text).toBe('$(error) Polyglot');
  });
});
