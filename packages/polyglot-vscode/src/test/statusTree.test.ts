import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { StatusTreeProvider } from '../statusTree.js';

const mockClient = {
  isAvailable: vi.fn(),
  hasModel: vi.fn(),
  listModels: vi.fn(),
};

vi.mock('@mcptoolshop/polyglot-mcp/ollama', () => ({
  OllamaClient: vi.fn(() => mockClient),
}));

vi.mock('@mcptoolshop/polyglot-mcp/languages', () => ({
  LANGUAGES: [{ code: 'en', name: 'English' }, { code: 'ja', name: 'Japanese' }],
}));

// Prevent real timers from running
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockClient.isAvailable.mockResolvedValue(true);
  mockClient.hasModel.mockResolvedValue(true);
  mockClient.listModels.mockResolvedValue([{ name: 'translategemma:12b' }]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('StatusTreeProvider', () => {
  it('creates initial "Checking" state', () => {
    const provider = new StatusTreeProvider();
    const children = provider.getChildren();
    expect(children).toHaveLength(1);
    expect(children[0].label).toBe('Checking…');
    provider.dispose();
  });

  it('shows connected status when Ollama is available', async () => {
    const provider = new StatusTreeProvider();

    // Wait for the async _checkStatus to resolve
    // Flush the initial async poll without triggering the 30s interval
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    const labels = children.map((c) => c.label);
    expect(labels).toContain('Ollama');
    expect(labels).toContain('Model');
    expect(labels).toContain('Server');
    expect(labels).toContain('Languages');

    const ollamaItem = children.find((c) => c.label === 'Ollama');
    expect(ollamaItem?.description).toBe('Connected');

    provider.dispose();
  });

  it('shows "Not running" when Ollama is unavailable', async () => {
    mockClient.isAvailable.mockResolvedValue(false);

    const provider = new StatusTreeProvider();
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    const ollamaItem = children.find((c) => c.label === 'Ollama');
    expect(ollamaItem?.description).toBe('Not running');
    expect(ollamaItem?.command).toBe('polyglot.checkStatus');

    // Should also show "Start Ollama" action
    const startItem = children.find((c) => c.label === 'Start Ollama');
    expect(startItem).toBeDefined();

    provider.dispose();
  });

  it('shows model as not installed', async () => {
    mockClient.hasModel.mockResolvedValue(false);

    const provider = new StatusTreeProvider();
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    const modelItem = children.find((c) => c.label === 'Model');
    expect(modelItem?.description).toContain('not installed');

    provider.dispose();
  });

  it('shows connection error state', async () => {
    mockClient.isAvailable.mockRejectedValue(new Error('network error'));

    const provider = new StatusTreeProvider();
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    expect(children.some((c) => c.label === 'Connection error')).toBe(true);

    provider.dispose();
  });

  it('getTreeItem returns proper TreeItem with icon', () => {
    const provider = new StatusTreeProvider();
    const statusItem = { label: 'Test', icon: 'check', description: 'OK', command: 'test.cmd' };
    const treeItem = provider.getTreeItem(statusItem);

    expect(treeItem.label).toBe('Test');
    expect(treeItem.description).toBe('OK');
    expect(treeItem.iconPath).toBeInstanceOf(vscode.ThemeIcon);
    expect(treeItem.command).toEqual({ title: 'Test', command: 'test.cmd' });

    provider.dispose();
  });

  it('getTreeItem omits command when not set', () => {
    const provider = new StatusTreeProvider();
    const statusItem = { label: 'Info', icon: 'info' };
    const treeItem = provider.getTreeItem(statusItem);

    expect(treeItem.command).toBeUndefined();

    provider.dispose();
  });

  it('dispose clears the poll timer', () => {
    const provider = new StatusTreeProvider();
    provider.dispose();
    // After dispose, advancing timers should not trigger new checks
    const callCount = mockClient.isAvailable.mock.calls.length;
    vi.advanceTimersByTime(60_000);
    expect(mockClient.isAvailable.mock.calls.length).toBe(callCount);
  });

  it('shows available translation models', async () => {
    mockClient.listModels.mockResolvedValue([
      { name: 'translategemma:12b' },
      { name: 'translategemma:2b' },
      { name: 'llama3:8b' }, // Should be filtered out (no "translate" or "gemma")
    ]);

    const provider = new StatusTreeProvider();
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    const availableItem = children.find((c) => c.label === 'Available');
    expect(availableItem?.description).toContain('translategemma:12b');
    expect(availableItem?.description).toContain('translategemma:2b');

    provider.dispose();
  });

  it('shows 55 supported languages count', async () => {
    const provider = new StatusTreeProvider();
    await vi.advanceTimersByTimeAsync(0);

    const children = provider.getChildren();
    const langItem = children.find((c) => c.label === 'Languages');
    expect(langItem?.description).toBe('55 supported');

    provider.dispose();
  });
});
