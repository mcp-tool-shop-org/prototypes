import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto
vi.mock('crypto', () => ({
    randomBytes: vi.fn(() => ({
        toString: () => 'abc123def456',
    })),
}));

// Mock MCPTestClient
const mockClient = {
    connect: vi.fn().mockResolvedValue({ name: 'test-server', version: '1.0.0', capabilities: { tools: true } }),
    disconnect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue([
        { name: 'hello', description: 'Says hello', parameters: [{ name: 'name', type: 'string', description: 'Name', required: true }] },
        { name: 'add', description: 'Add numbers', parameters: [{ name: 'a', type: 'number', description: 'First', required: true }, { name: 'b', type: 'number', description: 'Second', required: true }] },
    ]),
    callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Hello, World!' }] }),
    isConnected: vi.fn().mockReturnValue(true),
};

vi.mock('../mcp/client', () => ({
    MCPTestClient: vi.fn(() => mockClient),
}));

// Mock vscode
const mockWebview = {
    html: '',
    onDidReceiveMessage: vi.fn((_handler: unknown) => ({ dispose: vi.fn() })),
    postMessage: vi.fn(),
};

const mockPanel = {
    webview: mockWebview,
    reveal: vi.fn(),
    onDidDispose: vi.fn((_handler: unknown) => ({ dispose: vi.fn() })),
    onDidChangeViewState: vi.fn((_handler: unknown) => ({ dispose: vi.fn() })),
    dispose: vi.fn(),
    visible: true,
};

vi.mock('vscode', () => ({
    window: {
        createWebviewPanel: vi.fn(() => mockPanel),
        activeTextEditor: { viewColumn: 1 },
    },
    commands: {
        executeCommand: vi.fn(),
    },
    ViewColumn: { One: 1 },
    Uri: {
        file: (path: string) => ({ fsPath: path, scheme: 'file', path }),
        joinPath: (base: { fsPath: string }, ...segments: string[]) => ({
            fsPath: [base.fsPath, ...segments].join('/'),
            scheme: 'file',
            path: [base.fsPath, ...segments].join('/'),
        }),
    },
}));

import { PlaygroundPanel } from '../webview/PlaygroundPanel';
import * as vscode from 'vscode';

type MessageHandler = (message: { type: string; payload?: Record<string, unknown> }) => Promise<void>;

function getMessageHandler(): MessageHandler {
    return mockWebview.onDidReceiveMessage.mock.calls[0][0] as MessageHandler;
}

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
};

describe('PlaygroundPanel', () => {
    const extensionUri = { fsPath: '/ext' } as vscode.Uri;

    beforeEach(() => {
        vi.clearAllMocks();
        PlaygroundPanel.currentPanel = undefined;
        mockClient.isConnected.mockReturnValue(true);
    });

    // ── Lifecycle ──

    it('creates a new panel when none exists', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
            'mcpPlayground',
            'Tool Playground',
            1,
            expect.objectContaining({
                enableScripts: true,
                retainContextWhenHidden: true,
            })
        );
        expect(PlaygroundPanel.currentPanel).toBeDefined();
    });

    it('reveals existing panel instead of creating new one', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
        expect(mockPanel.reveal).toHaveBeenCalledTimes(1);
    });

    it('dispose clears currentPanel', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(PlaygroundPanel.currentPanel).toBeDefined();
        PlaygroundPanel.currentPanel!.dispose();
        expect(PlaygroundPanel.currentPanel).toBeUndefined();
    });

    it('revive creates panel from existing webview', () => {
        PlaygroundPanel.revive(mockPanel as never, extensionUri, mockLogger as never);
        expect(PlaygroundPanel.currentPanel).toBeDefined();
    });

    // ── HTML Content ──

    it('sets webview HTML content with CSP', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.html).toContain('<!DOCTYPE html>');
        expect(mockWebview.html).toContain('Tool Playground');
        expect(mockWebview.html).toContain('Content-Security-Policy');
        expect(mockWebview.html).toContain('nonce-abc123def456');
    });

    it('contains connection UI elements', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.html).toContain('transportType');
        expect(mockWebview.html).toContain('handleConnect');
        expect(mockWebview.html).toContain('handleDisconnect');
    });

    it('contains tool list and form sections', () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.html).toContain('toolList');
        expect(mockWebview.html).toContain('formSection');
        expect(mockWebview.html).toContain('resultSection');
        expect(mockWebview.html).toContain('historySection');
    });

    // ── Message: connect ──

    it('handles connect message with stdio transport', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'node', args: 'dist/index.js' } as Record<string, unknown>,
        });

        expect(mockWebview.postMessage).toHaveBeenCalledWith({ type: 'connecting' });
        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'connected',
                payload: expect.objectContaining({
                    serverInfo: expect.objectContaining({ name: 'test-server' }),
                    tools: expect.arrayContaining([
                        expect.objectContaining({ name: 'hello' }),
                    ]),
                }),
            })
        );
    });

    it('handles connect message with HTTP transport', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'connect',
            payload: { transportType: 'http', host: 'localhost', port: 4000 } as Record<string, unknown>,
        });

        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'connected' })
        );
    });

    it('posts error on failed connect', async () => {
        mockClient.connect.mockRejectedValueOnce(new Error('Connection refused'));

        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'bad', args: '' } as Record<string, unknown>,
        });

        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                payload: expect.objectContaining({
                    message: expect.stringContaining('Connection refused'),
                }),
            })
        );
    });

    // ── Message: disconnect ──

    it('handles disconnect message', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        // Connect first
        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'node', args: '' } as Record<string, unknown>,
        });

        await handler({ type: 'disconnect' });

        expect(mockClient.disconnect).toHaveBeenCalled();
        expect(mockWebview.postMessage).toHaveBeenCalledWith({ type: 'disconnected' });
    });

    // ── Message: callTool ──

    it('handles callTool message and returns result', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        // Connect first
        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'node', args: '' } as Record<string, unknown>,
        });

        await handler({
            type: 'callTool',
            payload: { name: 'hello', args: { name: 'World' } } as Record<string, unknown>,
        });

        expect(mockClient.callTool).toHaveBeenCalledWith('hello', { name: 'World' });
        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'toolResult',
                payload: expect.objectContaining({
                    result: expect.objectContaining({
                        content: [{ type: 'text', text: 'Hello, World!' }],
                    }),
                    entry: expect.objectContaining({
                        toolName: 'hello',
                        isError: false,
                    }),
                }),
            })
        );
    });

    it('handles callTool error gracefully', async () => {
        mockClient.callTool.mockRejectedValueOnce(new Error('Tool crashed'));

        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'node', args: '' } as Record<string, unknown>,
        });

        await handler({
            type: 'callTool',
            payload: { name: 'hello', args: {} } as Record<string, unknown>,
        });

        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'toolResult',
                payload: expect.objectContaining({
                    entry: expect.objectContaining({
                        isError: true,
                    }),
                }),
            })
        );
    });

    it('posts error when calling tool while disconnected', async () => {
        mockClient.isConnected.mockReturnValue(false);

        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'callTool',
            payload: { name: 'hello', args: {} } as Record<string, unknown>,
        });

        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                payload: expect.objectContaining({
                    message: 'Not connected to a server',
                }),
            })
        );
    });

    // ── Message: refreshTools ──

    it('handles refreshTools message', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();

        await handler({
            type: 'connect',
            payload: { transportType: 'stdio', command: 'node', args: '' } as Record<string, unknown>,
        });

        await handler({ type: 'refreshTools' });

        expect(mockClient.listTools).toHaveBeenCalledTimes(2); // once on connect, once on refresh
        expect(mockWebview.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'toolsUpdated',
                payload: expect.objectContaining({
                    tools: expect.arrayContaining([
                        expect.objectContaining({ name: 'hello' }),
                    ]),
                }),
            })
        );
    });

    // ── Unknown message ──

    it('logs warning for unknown message type', async () => {
        PlaygroundPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        await handler({ type: 'bogus' });
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown playground message'));
    });
});
