import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto
vi.mock('crypto', () => ({
    randomBytes: vi.fn(() => ({
        toString: () => 'abc123def456',
    })),
}));

// Mock vscode
const mockWebview = {
    html: '',
    onDidReceiveMessage: vi.fn((_handler: unknown) => ({ dispose: vi.fn() })),
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

import { DashboardPanel } from '../webview/DashboardPanel';
import * as vscode from 'vscode';

type MessageHandler = (message: { type: string; payload?: unknown }) => void;

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

describe('DashboardPanel', () => {
    const extensionUri = { fsPath: '/ext' } as vscode.Uri;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton
        DashboardPanel.currentPanel = undefined;
    });

    it('creates a new panel when none exists', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
            'mcpDashboard',
            'MCP Dashboard',
            1,
            expect.objectContaining({
                enableScripts: true,
                retainContextWhenHidden: true,
            })
        );
        expect(DashboardPanel.currentPanel).toBeDefined();
    });

    it('reveals existing panel instead of creating new one', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        // Should only create once
        expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
        expect(mockPanel.reveal).toHaveBeenCalledTimes(1);
    });

    it('sets webview HTML content', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.html).toContain('<!DOCTYPE html>');
        expect(mockWebview.html).toContain('MCP App Builder');
        expect(mockWebview.html).toContain('Content-Security-Policy');
    });

    it('includes nonce in CSP', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.html).toContain('nonce-abc123def456');
    });

    it('registers message handler', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        expect(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
    });

    it('handles newServer message', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        // Get the message handler
        const handler = getMessageHandler();
        handler({ type: 'newServer' });
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('mcp-app-builder.newServer');
    });

    it('handles validateSchema message', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        handler({ type: 'validateSchema' });
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('mcp-app-builder.validateSchema');
    });

    it('handles generateTypes message', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        handler({ type: 'generateTypes' });
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('mcp-app-builder.generateTypes');
    });

    it('handles testServer message', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        handler({ type: 'testServer' });
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('mcp-app-builder.testServer');
    });

    it('logs warning for unknown message type', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        handler({ type: 'unknown-type' });
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown message type'));
    });

    it('handles refresh message by updating HTML', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        const handler = getMessageHandler();
        mockWebview.html = ''; // clear
        handler({ type: 'refresh' });
        expect(mockWebview.html).toContain('<!DOCTYPE html>');
    });

    it('dispose clears currentPanel', () => {
        DashboardPanel.createOrShow(extensionUri, mockLogger as never);
        expect(DashboardPanel.currentPanel).toBeDefined();
        DashboardPanel.currentPanel!.dispose();
        expect(DashboardPanel.currentPanel).toBeUndefined();
    });

    it('revive creates panel from existing webview', () => {
        DashboardPanel.revive(mockPanel as never, extensionUri, mockLogger as never);
        expect(DashboardPanel.currentPanel).toBeDefined();
    });
});
