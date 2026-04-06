import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock vscode before importing the module under test
vi.mock('vscode', () => {
    return {
        window: {
            createOutputChannel: vi.fn(() => ({
                appendLine: vi.fn(),
                append: vi.fn(),
                show: vi.fn(),
                dispose: vi.fn(),
                clear: vi.fn(),
            })),
            createStatusBarItem: vi.fn(() => ({
                text: '',
                tooltip: '',
                command: '',
                show: vi.fn(),
                hide: vi.fn(),
                dispose: vi.fn(),
            })),
            activeTextEditor: undefined,
        },
        workspace: {
            workspaceFolders: [],
            onDidChangeWorkspaceFolders: vi.fn(() => ({ dispose: vi.fn() })),
            onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
            createFileSystemWatcher: vi.fn(() => ({
                onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
                onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
                onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
                dispose: vi.fn(),
            })),
            getConfiguration: vi.fn(() => ({
                get: vi.fn(() => true),
            })),
            fs: {
                readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
            },
        },
        commands: {
            registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
        },
        languages: {
            createDiagnosticCollection: vi.fn(() => ({
                set: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
                dispose: vi.fn(),
            })),
        },
        Uri: {
            file: (path: string) => ({ fsPath: path, scheme: 'file', path }),
            joinPath: (base: { fsPath: string }, ...segments: string[]) => ({
                fsPath: [base.fsPath, ...segments].join('/'),
                scheme: 'file',
                path: [base.fsPath, ...segments].join('/'),
            }),
        },
        StatusBarAlignment: { Left: 1, Right: 2 },
        EventEmitter: class {
            event = () => ({ dispose: () => {} });
            fire() {}
            dispose() {}
        },
        DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
        Range: class {
            constructor(
                public startLine: number,
                public startChar: number,
                public endLine: number,
                public endChar: number,
            ) {}
        },
        Diagnostic: class {
            constructor(
                public range: unknown,
                public message: string,
                public severity: number,
            ) {}
        },
        ProgressLocation: { Notification: 15 },
        ViewColumn: { One: 1 },
    };
});

// Mock the MCP SDK to prevent import errors
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: class {
        connect = vi.fn();
        close = vi.fn();
        getServerVersion = vi.fn();
        getServerCapabilities = vi.fn();
    },
}));
vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: class {},
}));
vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: class {},
}));

import * as vscode from 'vscode';

describe('Extension', () => {
    let context: { subscriptions: Array<{ dispose: () => void }>; extensionUri: { fsPath: string } };

    beforeEach(() => {
        vi.clearAllMocks();
        context = {
            subscriptions: [],
            extensionUri: { fsPath: '/ext' },
        };
    });

    it('activates without error', async () => {
        const { activate } = await import('../extension.js');
        await expect(activate(context as never)).resolves.not.toThrow();
    });

    it('creates output channel on activation', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('MCP App Builder');
    });

    it('registers 6 commands', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(6);
    });

    it('registers expected command IDs', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        const registeredCommands = vi.mocked(vscode.commands.registerCommand).mock.calls.map(
            (c) => c[0]
        );
        expect(registeredCommands).toContain('mcp-app-builder.newServer');
        expect(registeredCommands).toContain('mcp-app-builder.validateSchema');
        expect(registeredCommands).toContain('mcp-app-builder.generateTypes');
        expect(registeredCommands).toContain('mcp-app-builder.testServer');
        expect(registeredCommands).toContain('mcp-app-builder.openDashboard');
        expect(registeredCommands).toContain('mcp-app-builder.openPlayground');
    });

    it('creates file system watcher for mcp.json', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/mcp.json');
    });

    it('creates status bar item', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
            vscode.StatusBarAlignment.Right,
            100
        );
    });

    it('pushes disposables to context.subscriptions', async () => {
        const { activate } = await import('../extension.js');
        await activate(context as never);
        // Should have: diagnosticCollection, testOutputChannel, 5 commands,
        // workspace change listener, 3 file watcher events + watcher, save listener,
        // statusBarItem, outputChannel
        expect(context.subscriptions.length).toBeGreaterThan(5);
    });

    it('deactivate runs without error', async () => {
        const { activate, deactivate } = await import('../extension.js');
        await activate(context as never);
        expect(() => deactivate()).not.toThrow();
    });

    it('getLogger returns logger after activation', async () => {
        const { activate, getLogger } = await import('../extension.js');
        await activate(context as never);
        const logger = getLogger();
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });
});
