/**
 * Dashboard Panel
 *
 * VS Code webview panel for the MCP App Builder dashboard.
 * Provides a visual interface for managing MCP servers.
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import type { OutputChannelLogger } from '../utils/logger';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private static readonly viewType = 'mcpDashboard';

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly logger: OutputChannelLogger;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        logger: OutputChannelLogger
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.logger = logger;

        // Set up the webview content
        this.update();

        // Handle panel disposal
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle view state changes
        this.panel.onDidChangeViewState(
            () => {
                if (this.panel.visible) {
                    this.update();
                }
            },
            null,
            this.disposables
        );

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message),
            null,
            this.disposables
        );
    }

    public static createOrShow(
        extensionUri: vscode.Uri,
        logger: OutputChannelLogger
    ): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If panel exists, show it
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.panel.reveal(column);
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            DashboardPanel.viewType,
            'MCP Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview'),
                    vscode.Uri.joinPath(extensionUri, 'out'),
                ],
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, logger);
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        logger: OutputChannelLogger
    ): void {
        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, logger);
    }

    public dispose(): void {
        DashboardPanel.currentPanel = undefined;

        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private update(): void {
        this.panel.webview.html = this.getHtmlContent();
    }

    private handleMessage(message: { type: string; payload?: unknown }): void {
        this.logger.debug(`Webview message: ${message.type}`);

        switch (message.type) {
            case 'newServer':
                vscode.commands.executeCommand('mcp-app-builder.newServer');
                break;
            case 'validateSchema':
                vscode.commands.executeCommand('mcp-app-builder.validateSchema');
                break;
            case 'generateTypes':
                vscode.commands.executeCommand('mcp-app-builder.generateTypes');
                break;
            case 'testServer':
                vscode.commands.executeCommand('mcp-app-builder.testServer');
                break;
            case 'refresh':
                this.update();
                break;
            default:
                this.logger.warn(`Unknown message type: ${message.type}`);
        }
    }

    private getHtmlContent(): string {
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <title>MCP Dashboard</title>
    <style nonce="${nonce}">
        :root {
            --vscode-font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            --container-padding: 20px;
            --card-padding: 16px;
            --card-radius: 8px;
        }

        body {
            font-family: var(--vscode-font-family);
            padding: var(--container-padding);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.6;
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        .subtitle {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 24px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .card {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: var(--card-radius);
            padding: var(--card-padding);
            transition: border-color 0.2s;
        }

        .card:hover {
            border-color: var(--vscode-focusBorder);
        }

        .card h2 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card p {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin: 0 0 12px 0;
        }

        .icon {
            font-size: 18px;
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:focus {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        .secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
        }

        .quick-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 12px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .status-badge.success {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }

        .keyboard-hint {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        kbd {
            background-color: var(--vscode-keybindingLabel-background);
            border: 1px solid var(--vscode-keybindingLabel-border);
            border-radius: 3px;
            padding: 1px 4px;
            font-family: monospace;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <h1>MCP App Builder</h1>
    <p class="subtitle">Build MCP servers with interactive UI components</p>

    <div class="section">
        <div class="section-title">Quick Actions</div>
        <div class="quick-actions">
            <button onclick="sendMessage('newServer')">New Server</button>
            <button class="secondary" onclick="sendMessage('validateSchema')">Validate Schema</button>
            <button class="secondary" onclick="sendMessage('generateTypes')">Generate Types</button>
            <button class="secondary" onclick="sendMessage('testServer')">Run Tests</button>
        </div>
        <p class="keyboard-hint">Tip: Use <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and type "MCP" for commands</p>
    </div>

    <div class="grid">
        <div class="card">
            <h2><span class="icon">📦</span> Templates</h2>
            <p>Start with a pre-configured template for your MCP server.</p>
            <button onclick="sendMessage('newServer')">Create New Server</button>
        </div>

        <div class="card">
            <h2><span class="icon">✅</span> Validation</h2>
            <p>Validate your mcp.json and mcp-tools.json schemas.</p>
            <button class="secondary" onclick="sendMessage('validateSchema')">Validate</button>
        </div>

        <div class="card">
            <h2><span class="icon">🔧</span> Type Generation</h2>
            <p>Generate TypeScript types from your tool definitions.</p>
            <button class="secondary" onclick="sendMessage('generateTypes')">Generate</button>
        </div>

        <div class="card">
            <h2><span class="icon">🧪</span> Testing</h2>
            <p>Run tests against your MCP server tools.</p>
            <button class="secondary" onclick="sendMessage('testServer')">Run Tests</button>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Resources</div>
        <div class="grid">
            <div class="card">
                <h2>Documentation</h2>
                <p>Learn about MCP and the extension features.</p>
            </div>
            <div class="card">
                <h2>MCP Specification</h2>
                <p>View the official Model Context Protocol spec.</p>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        function sendMessage(type, payload) {
            vscode.postMessage({ type, payload });
        }

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                sendMessage('refresh');
            }
        });
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        return crypto.randomBytes(16).toString('hex');
    }
}
