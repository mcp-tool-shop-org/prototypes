import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPConfigProvider } from '../providers/configProvider';
import type { OutputChannelLogger } from '../utils/logger';

// We need to mock vscode at module level
vi.mock('vscode', () => {
    const EventEmitter = class {
        private listeners: Array<(data: unknown) => void> = [];
        event = (listener: (data: unknown) => void) => {
            this.listeners.push(listener);
            return { dispose: () => {} };
        };
        fire(data: unknown) {
            this.listeners.forEach((l) => l(data));
        }
        dispose() {
            this.listeners = [];
        }
    };

    return {
        EventEmitter,
        Uri: {
            file: (path: string) => ({ fsPath: path, scheme: 'file', path }),
            joinPath: (base: { fsPath: string }, ...segments: string[]) => ({
                fsPath: [base.fsPath, ...segments].join('/'),
                scheme: 'file',
                path: [base.fsPath, ...segments].join('/'),
            }),
        },
        workspace: {
            workspaceFolders: undefined as unknown[] | undefined,
            fs: {
                readFile: vi.fn(),
            },
        },
    };
});

import * as vscode from 'vscode';

const mockLogger: OutputChannelLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
} as unknown as OutputChannelLogger;

describe('MCPConfigProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = undefined;
    });

    it('starts with null config when no workspace', async () => {
        const provider = new MCPConfigProvider(mockLogger);
        await provider.refresh();
        expect(provider.getConfig()).toBeNull();
        expect(provider.getConfigPath()).toBeNull();
    });

    it('starts with null config when workspace has no mcp.json', async () => {
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [
            { uri: { fsPath: '/test', scheme: 'file', path: '/test' } },
        ];
        vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error('ENOENT'));

        const provider = new MCPConfigProvider(mockLogger);
        await provider.refresh();
        expect(provider.getConfig()).toBeNull();
    });

    it('loads config when mcp.json exists', async () => {
        const config = { name: 'test-server', version: '1.0.0' };
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [
            { uri: { fsPath: '/project', scheme: 'file', path: '/project' } },
        ];
        vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
            Buffer.from(JSON.stringify(config))
        );

        const provider = new MCPConfigProvider(mockLogger);
        await provider.refresh();
        expect(provider.getConfig()).toEqual(config);
        expect(provider.getConfigPath()).toBeDefined();
    });

    it('hasMCPConfig returns true when config exists', async () => {
        const config = { name: 'test', version: '0.1.0' };
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [
            { uri: { fsPath: '/project', scheme: 'file', path: '/project' } },
        ];
        vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
            Buffer.from(JSON.stringify(config))
        );

        const provider = new MCPConfigProvider(mockLogger);
        const result = await provider.hasMCPConfig();
        expect(result).toBe(true);
    });

    it('hasMCPConfig returns false when no config', async () => {
        const provider = new MCPConfigProvider(mockLogger);
        const result = await provider.hasMCPConfig();
        expect(result).toBe(false);
    });

    it('fires onDidChangeConfig event on refresh', async () => {
        const config = { name: 'test', version: '0.1.0' };
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [
            { uri: { fsPath: '/project', scheme: 'file', path: '/project' } },
        ];
        vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
            Buffer.from(JSON.stringify(config))
        );

        const provider = new MCPConfigProvider(mockLogger);
        const handler = vi.fn();
        provider.onDidChangeConfig(handler);

        await provider.refresh();
        expect(handler).toHaveBeenCalledWith(config);
    });

    it('fires null on change when no config found', async () => {
        const provider = new MCPConfigProvider(mockLogger);
        const handler = vi.fn();
        provider.onDidChangeConfig(handler);

        await provider.refresh();
        expect(handler).toHaveBeenCalledWith(null);
    });

    it('searches multiple workspace folders', async () => {
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [
            { uri: { fsPath: '/first', scheme: 'file', path: '/first' } },
            { uri: { fsPath: '/second', scheme: 'file', path: '/second' } },
        ];
        const config = { name: 'found', version: '1.0.0' };
        vi.mocked(vscode.workspace.fs.readFile)
            .mockRejectedValueOnce(new Error('ENOENT')) // first folder fails
            .mockResolvedValueOnce(Buffer.from(JSON.stringify(config))); // second succeeds

        const provider = new MCPConfigProvider(mockLogger);
        await provider.refresh();
        expect(provider.getConfig()).toEqual(config);
    });

    it('returns empty workspace folders case', async () => {
        (vscode.workspace as { workspaceFolders: unknown }).workspaceFolders = [];

        const provider = new MCPConfigProvider(mockLogger);
        await provider.refresh();
        expect(provider.getConfig()).toBeNull();
    });
});
