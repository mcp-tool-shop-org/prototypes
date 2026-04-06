/**
 * Tool Playground Panel
 *
 * Interactive webview panel for connecting to MCP servers,
 * browsing tools, invoking them with auto-generated forms,
 * and reviewing invocation history.
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import type { OutputChannelLogger } from '../utils/logger';
import { MCPTestClient } from '../mcp/client';
import type { MCPToolDefinition, MCPToolResult, MCPTransportConfig } from '../mcp/types';

export interface HistoryEntry {
    id: number;
    timestamp: string;
    toolName: string;
    args: Record<string, unknown>;
    result: MCPToolResult;
    duration: number;
    isError: boolean;
}

export class PlaygroundPanel {
    public static currentPanel: PlaygroundPanel | undefined;
    private static readonly viewType = 'mcpPlayground';

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly logger: OutputChannelLogger;
    private disposables: vscode.Disposable[] = [];
    private client: MCPTestClient | null = null;
    private tools: MCPToolDefinition[] = [];
    private history: HistoryEntry[] = [];
    private nextId = 1;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        logger: OutputChannelLogger
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.logger = logger;

        this.update();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.onDidChangeViewState(
            () => {
                if (this.panel.visible) {
                    this.update();
                }
            },
            null,
            this.disposables
        );

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

        if (PlaygroundPanel.currentPanel) {
            PlaygroundPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PlaygroundPanel.viewType,
            'Tool Playground',
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

        PlaygroundPanel.currentPanel = new PlaygroundPanel(panel, extensionUri, logger);
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        logger: OutputChannelLogger
    ): void {
        PlaygroundPanel.currentPanel = new PlaygroundPanel(panel, extensionUri, logger);
    }

    public dispose(): void {
        PlaygroundPanel.currentPanel = undefined;

        if (this.client) {
            this.client.disconnect().catch(() => {});
            this.client = null;
        }

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

    private async handleMessage(message: { type: string; payload?: Record<string, unknown> }): Promise<void> {
        this.logger.debug(`Playground message: ${message.type}`);

        switch (message.type) {
            case 'connect':
                await this.handleConnect(message.payload as {
                    transportType: string;
                    command?: string;
                    args?: string;
                    host?: string;
                    port?: number;
                });
                break;

            case 'disconnect':
                await this.handleDisconnect();
                break;

            case 'callTool':
                await this.handleCallTool(message.payload as {
                    name: string;
                    args: Record<string, unknown>;
                });
                break;

            case 'refreshTools':
                await this.handleRefreshTools();
                break;

            default:
                this.logger.warn(`Unknown playground message: ${message.type}`);
        }
    }

    private async handleConnect(payload: {
        transportType: string;
        command?: string;
        args?: string;
        host?: string;
        port?: number;
    }): Promise<void> {
        try {
            this.panel.webview.postMessage({ type: 'connecting' });

            const transport: MCPTransportConfig = payload.transportType === 'stdio'
                ? {
                    type: 'stdio',
                    command: payload.command || 'node',
                    args: payload.args ? payload.args.split(/\s+/).filter(Boolean) : [],
                }
                : {
                    type: 'http',
                    options: {
                        host: payload.host || 'localhost',
                        port: payload.port || 3000,
                    },
                };

            this.client = new MCPTestClient({ transport });
            const serverInfo = await this.client.connect();
            this.tools = await this.client.listTools();

            this.logger.info(`Playground connected to ${serverInfo.name} (${this.tools.length} tools)`);

            this.panel.webview.postMessage({
                type: 'connected',
                payload: { serverInfo, tools: this.tools },
            });
        } catch (error) {
            this.client = null;
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error('Playground connect failed', error);
            this.panel.webview.postMessage({
                type: 'error',
                payload: { message: `Connection failed: ${msg}` },
            });
        }
    }

    private async handleDisconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect().catch(() => {});
            this.client = null;
        }
        this.tools = [];
        this.logger.info('Playground disconnected');
        this.panel.webview.postMessage({ type: 'disconnected' });
    }

    private async handleCallTool(payload: {
        name: string;
        args: Record<string, unknown>;
    }): Promise<void> {
        if (!this.client || !this.client.isConnected()) {
            this.panel.webview.postMessage({
                type: 'error',
                payload: { message: 'Not connected to a server' },
            });
            return;
        }

        const startTime = Date.now();

        try {
            const result = await this.client.callTool(payload.name, payload.args);
            const entry: HistoryEntry = {
                id: this.nextId++,
                timestamp: new Date().toISOString(),
                toolName: payload.name,
                args: payload.args,
                result,
                duration: Date.now() - startTime,
                isError: !!result.isError,
            };
            this.history.unshift(entry);

            this.panel.webview.postMessage({
                type: 'toolResult',
                payload: { result, entry },
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const errorResult: MCPToolResult = {
                content: [{ type: 'text', text: msg }],
                isError: true,
            };
            const entry: HistoryEntry = {
                id: this.nextId++,
                timestamp: new Date().toISOString(),
                toolName: payload.name,
                args: payload.args,
                result: errorResult,
                duration: Date.now() - startTime,
                isError: true,
            };
            this.history.unshift(entry);

            this.panel.webview.postMessage({
                type: 'toolResult',
                payload: { result: errorResult, entry },
            });
        }
    }

    private async handleRefreshTools(): Promise<void> {
        if (!this.client || !this.client.isConnected()) {
            this.panel.webview.postMessage({
                type: 'error',
                payload: { message: 'Not connected to a server' },
            });
            return;
        }

        try {
            this.tools = await this.client.listTools();
            this.panel.webview.postMessage({
                type: 'toolsUpdated',
                payload: { tools: this.tools },
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.panel.webview.postMessage({
                type: 'error',
                payload: { message: `Failed to refresh tools: ${msg}` },
            });
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
    <title>Tool Playground</title>
    <style nonce="${nonce}">
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            line-height: 1.5;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* ── Connection Bar ── */
        .connection-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--vscode-widget-border);
            background: var(--vscode-sideBar-background, var(--vscode-editor-background));
            flex-shrink: 0;
        }

        .connection-bar label { font-size: 12px; font-weight: 600; }

        .connection-bar select,
        .connection-bar input {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, transparent);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
        }

        .connection-bar input { flex: 1; min-width: 120px; }
        .connection-bar input.narrow { flex: 0; width: 80px; }

        .status-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--vscode-descriptionForeground);
            flex-shrink: 0;
        }
        .status-dot.connected { background: var(--vscode-testing-iconPassed, #4caf50); }
        .status-dot.connecting { background: var(--vscode-editorWarning-foreground, #ff9800); }

        /* ── Buttons ── */
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
        button:focus { outline: 2px solid var(--vscode-focusBorder); outline-offset: 1px; }
        button:disabled { opacity: 0.5; cursor: default; }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
        button.danger {
            background: var(--vscode-errorForeground, #f44336);
            color: #fff;
        }

        /* ── Main Layout ── */
        .main {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* ── Tool Sidebar ── */
        .sidebar {
            width: 260px;
            border-right: 1px solid var(--vscode-widget-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .tool-list {
            overflow-y: auto;
            flex: 1;
        }

        .tool-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .tool-item:hover { background: var(--vscode-list-hoverBackground); }
        .tool-item.selected { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }

        .tool-name { font-size: 13px; font-weight: 600; }
        .tool-desc { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tool-item.selected .tool-desc { color: var(--vscode-list-activeSelectionForeground); opacity: 0.8; }

        .empty-state {
            padding: 24px 16px;
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
        }

        /* ── Content Area ── */
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* ── Form Section ── */
        .form-section {
            padding: 16px;
            border-bottom: 1px solid var(--vscode-widget-border);
            flex-shrink: 0;
            max-height: 50%;
            overflow-y: auto;
        }

        .form-title {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .form-field {
            margin-bottom: 12px;
        }

        .form-field label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .form-field label .required { color: var(--vscode-errorForeground, #f44336); }

        .form-field input,
        .form-field select,
        .form-field textarea {
            width: 100%;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, transparent);
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
        }

        .form-field textarea {
            min-height: 60px;
            resize: vertical;
            font-family: var(--vscode-editor-font-family, monospace);
        }

        .form-field .hint {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }

        .form-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .checkbox-wrapper input { width: auto; }

        /* ── Result Section ── */
        .result-section {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .result-header {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }

        .result-content {
            background: var(--vscode-textCodeBlock-background, var(--vscode-editor-background));
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            padding: 12px;
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 13px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .result-content.error {
            border-color: var(--vscode-errorForeground, #f44336);
            color: var(--vscode-errorForeground, #f44336);
        }

        .result-duration {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        /* ── History ── */
        .history-section {
            border-top: 1px solid var(--vscode-widget-border);
            flex-shrink: 0;
            max-height: 200px;
            overflow-y: auto;
        }

        .history-header {
            padding: 6px 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            border-bottom: 1px solid var(--vscode-widget-border);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--vscode-sideBar-background, var(--vscode-editor-background));
            position: sticky;
            top: 0;
        }

        .history-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px 16px;
            font-size: 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
            cursor: pointer;
        }
        .history-row:hover { background: var(--vscode-list-hoverBackground); }
        .history-row .time { color: var(--vscode-descriptionForeground); width: 60px; flex-shrink: 0; }
        .history-row .name { font-weight: 600; width: 120px; flex-shrink: 0; }
        .history-row .args { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-descriptionForeground); }
        .history-row .dur { width: 60px; text-align: right; flex-shrink: 0; color: var(--vscode-descriptionForeground); }
        .history-row .status-ok { color: var(--vscode-testing-iconPassed, #4caf50); }
        .history-row .status-err { color: var(--vscode-errorForeground, #f44336); }
    </style>
</head>
<body>
    <!-- Connection Bar -->
    <div class="connection-bar">
        <span class="status-dot" id="statusDot"></span>
        <label>Transport</label>
        <select id="transportType" onchange="toggleTransportFields()">
            <option value="stdio">stdio</option>
            <option value="http">HTTP/SSE</option>
        </select>
        <span id="stdioFields">
            <input id="command" type="text" placeholder="Command (e.g. node)" value="node">
            <input id="args" type="text" placeholder="Args (e.g. dist/index.js)">
        </span>
        <span id="httpFields" style="display:none">
            <input id="host" type="text" placeholder="Host" value="localhost" class="narrow">
            <input id="port" type="number" placeholder="Port" value="3000" class="narrow">
        </span>
        <button id="connectBtn" onclick="handleConnect()">Connect</button>
        <button id="disconnectBtn" class="danger" onclick="handleDisconnect()" style="display:none">Disconnect</button>
    </div>

    <!-- Main Layout -->
    <div class="main">
        <!-- Tool Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <span>Tools</span>
                <button class="secondary" onclick="refreshTools()" style="padding:2px 6px;font-size:11px" id="refreshBtn" disabled>Refresh</button>
            </div>
            <div class="tool-list" id="toolList">
                <div class="empty-state">Connect to a server to see tools</div>
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="form-section" id="formSection">
                <div class="empty-state">Select a tool from the sidebar</div>
            </div>

            <div class="result-section" id="resultSection">
                <div class="result-header">
                    <span>Result</span>
                    <span class="result-duration" id="resultDuration"></span>
                </div>
                <div class="result-content" id="resultContent">Invoke a tool to see results here</div>
            </div>

            <div class="history-section" id="historySection" style="display:none">
                <div class="history-header" onclick="toggleHistory()">
                    <span>History (<span id="historyCount">0</span>)</span>
                    <span id="historyToggle">&#9660;</span>
                </div>
                <div id="historyBody"></div>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentTools = [];
        let selectedTool = null;
        let historyExpanded = true;

        // ── Transport field toggling ──
        function toggleTransportFields() {
            const type = document.getElementById('transportType').value;
            document.getElementById('stdioFields').style.display = type === 'stdio' ? '' : 'none';
            document.getElementById('httpFields').style.display = type === 'http' ? '' : 'none';
        }

        // ── Connect / Disconnect ──
        function handleConnect() {
            const transportType = document.getElementById('transportType').value;
            const payload = { transportType };
            if (transportType === 'stdio') {
                payload.command = document.getElementById('command').value;
                payload.args = document.getElementById('args').value;
            } else {
                payload.host = document.getElementById('host').value;
                payload.port = parseInt(document.getElementById('port').value, 10) || 3000;
            }
            vscode.postMessage({ type: 'connect', payload });
        }

        function handleDisconnect() {
            vscode.postMessage({ type: 'disconnect' });
        }

        function refreshTools() {
            vscode.postMessage({ type: 'refreshTools' });
        }

        // ── UI state helpers ──
        function setConnected(connected) {
            const dot = document.getElementById('statusDot');
            const connectBtn = document.getElementById('connectBtn');
            const disconnectBtn = document.getElementById('disconnectBtn');
            const refreshBtn = document.getElementById('refreshBtn');
            dot.className = 'status-dot' + (connected ? ' connected' : '');
            connectBtn.style.display = connected ? 'none' : '';
            disconnectBtn.style.display = connected ? '' : 'none';
            refreshBtn.disabled = !connected;
        }

        function setConnecting() {
            document.getElementById('statusDot').className = 'status-dot connecting';
            document.getElementById('connectBtn').disabled = true;
        }

        // ── Render tool list ──
        function renderToolList(tools) {
            currentTools = tools;
            const container = document.getElementById('toolList');
            if (!tools.length) {
                container.innerHTML = '<div class="empty-state">No tools available</div>';
                return;
            }
            container.innerHTML = tools.map((t, i) =>
                '<div class="tool-item' + (selectedTool && selectedTool.name === t.name ? ' selected' : '') +
                '" onclick="selectTool(' + i + ')">' +
                '<div class="tool-name">' + esc(t.name) + '</div>' +
                '<div class="tool-desc">' + esc(t.description) + '</div>' +
                '</div>'
            ).join('');
        }

        // ── Select tool and generate form ──
        function selectTool(index) {
            selectedTool = currentTools[index];
            // Update selection highlight
            renderToolList(currentTools);
            renderForm(selectedTool);
        }

        function renderForm(tool) {
            const section = document.getElementById('formSection');
            const params = tool.parameters || [];

            let html = '<div class="form-title">' + esc(tool.name) + '</div>';
            if (tool.description) {
                html += '<div style="font-size:12px;color:var(--vscode-descriptionForeground);margin-bottom:12px">' + esc(tool.description) + '</div>';
            }

            if (!params.length) {
                html += '<div style="font-size:13px;color:var(--vscode-descriptionForeground)">No parameters</div>';
            }

            for (const p of params) {
                html += renderFormField(p);
            }

            html += '<div class="form-actions">';
            html += '<button onclick="invokeTool()">Invoke</button>';
            html += '<button class="secondary" onclick="clearForm()">Clear</button>';
            html += '</div>';

            section.innerHTML = html;
        }

        function renderFormField(param) {
            const req = param.required ? '<span class="required"> *</span>' : '';
            const id = 'param-' + param.name;
            let html = '<div class="form-field">';
            html += '<label for="' + id + '">' + esc(param.name) + req + '</label>';

            if (param.enum && param.enum.length) {
                html += '<select id="' + id + '" data-param="' + esc(param.name) + '" data-type="' + param.type + '">';
                html += '<option value="">-- select --</option>';
                for (const v of param.enum) {
                    html += '<option value="' + esc(v) + '">' + esc(v) + '</option>';
                }
                html += '</select>';
            } else if (param.type === 'boolean') {
                html += '<div class="checkbox-wrapper"><input type="checkbox" id="' + id + '" data-param="' + esc(param.name) + '" data-type="boolean"><span>' + esc(param.description || '') + '</span></div>';
            } else if (param.type === 'number') {
                html += '<input type="number" id="' + id + '" data-param="' + esc(param.name) + '" data-type="number" placeholder="' + esc(param.description || '') + '">';
            } else if (param.type === 'array' || param.type === 'object') {
                html += '<textarea id="' + id + '" data-param="' + esc(param.name) + '" data-type="' + param.type + '" placeholder="Enter JSON..."></textarea>';
            } else {
                html += '<input type="text" id="' + id + '" data-param="' + esc(param.name) + '" data-type="string" placeholder="' + esc(param.description || '') + '">';
            }

            if (param.description && param.type !== 'boolean') {
                html += '<div class="hint">' + esc(param.description) + '</div>';
            }

            html += '</div>';
            return html;
        }

        // ── Collect form values ──
        function collectFormValues() {
            const args = {};
            const fields = document.querySelectorAll('[data-param]');
            for (const field of fields) {
                const name = field.getAttribute('data-param');
                const type = field.getAttribute('data-type');

                if (type === 'boolean') {
                    args[name] = field.checked;
                } else if (type === 'number') {
                    if (field.value !== '') args[name] = parseFloat(field.value);
                } else if (type === 'array' || type === 'object') {
                    if (field.value.trim()) {
                        try {
                            args[name] = JSON.parse(field.value);
                        } catch (e) {
                            args[name] = field.value;
                        }
                    }
                } else {
                    if (field.value !== '') args[name] = field.value;
                }
            }
            return args;
        }

        function invokeTool() {
            if (!selectedTool) return;
            const args = collectFormValues();
            vscode.postMessage({ type: 'callTool', payload: { name: selectedTool.name, args } });
        }

        function clearForm() {
            const fields = document.querySelectorAll('[data-param]');
            for (const field of fields) {
                if (field.type === 'checkbox') field.checked = false;
                else field.value = '';
            }
        }

        // ── Render result ──
        function renderResult(result, duration) {
            const el = document.getElementById('resultContent');
            const durEl = document.getElementById('resultDuration');

            durEl.textContent = duration !== undefined ? duration + 'ms' : '';

            if (result.isError) {
                el.className = 'result-content error';
            } else {
                el.className = 'result-content';
            }

            const texts = (result.content || []).map(c => {
                if (c.type === 'text') return c.text;
                return JSON.stringify(c, null, 2);
            });

            el.textContent = texts.join('\\n');
        }

        // ── History ──
        function renderHistory(entries) {
            const section = document.getElementById('historySection');
            const body = document.getElementById('historyBody');
            const count = document.getElementById('historyCount');

            if (!entries.length) {
                section.style.display = 'none';
                return;
            }

            section.style.display = '';
            count.textContent = entries.length;

            body.innerHTML = entries.map(e => {
                const time = new Date(e.timestamp).toLocaleTimeString();
                const argsStr = JSON.stringify(e.args);
                const statusClass = e.isError ? 'status-err' : 'status-ok';
                const statusChar = e.isError ? '\\u2717' : '\\u2713';
                return '<div class="history-row" onclick="replayEntry(' + JSON.stringify(e.id) + ')">' +
                    '<span class="time">' + esc(time) + '</span>' +
                    '<span class="' + statusClass + '">' + statusChar + '</span>' +
                    '<span class="name">' + esc(e.toolName) + '</span>' +
                    '<span class="args">' + esc(argsStr) + '</span>' +
                    '<span class="dur">' + e.duration + 'ms</span>' +
                    '</div>';
            }).join('');
        }

        function toggleHistory() {
            const body = document.getElementById('historyBody');
            const toggle = document.getElementById('historyToggle');
            historyExpanded = !historyExpanded;
            body.style.display = historyExpanded ? '' : 'none';
            toggle.innerHTML = historyExpanded ? '&#9660;' : '&#9654;';
        }

        let historyEntries = [];

        function replayEntry(id) {
            const entry = historyEntries.find(e => e.id === id);
            if (!entry) return;
            // Select the tool
            const idx = currentTools.findIndex(t => t.name === entry.toolName);
            if (idx >= 0) {
                selectTool(idx);
                // Fill in the args
                setTimeout(() => {
                    for (const [key, val] of Object.entries(entry.args)) {
                        const field = document.getElementById('param-' + key);
                        if (!field) continue;
                        if (field.type === 'checkbox') field.checked = !!val;
                        else if (typeof val === 'object') field.value = JSON.stringify(val);
                        else field.value = String(val);
                    }
                }, 0);
            }
        }

        // ── Escape HTML ──
        function esc(str) {
            if (!str) return '';
            return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        // ── Message handler ──
        window.addEventListener('message', event => {
            const msg = event.data;
            switch (msg.type) {
                case 'connecting':
                    setConnecting();
                    break;
                case 'connected':
                    setConnected(true);
                    document.getElementById('connectBtn').disabled = false;
                    renderToolList(msg.payload.tools);
                    break;
                case 'disconnected':
                    setConnected(false);
                    document.getElementById('connectBtn').disabled = false;
                    currentTools = [];
                    selectedTool = null;
                    document.getElementById('toolList').innerHTML = '<div class="empty-state">Connect to a server to see tools</div>';
                    document.getElementById('formSection').innerHTML = '<div class="empty-state">Select a tool from the sidebar</div>';
                    break;
                case 'toolResult':
                    renderResult(msg.payload.result, msg.payload.entry.duration);
                    historyEntries.unshift(msg.payload.entry);
                    renderHistory(historyEntries);
                    break;
                case 'toolsUpdated':
                    renderToolList(msg.payload.tools);
                    break;
                case 'error':
                    setConnected(false);
                    document.getElementById('connectBtn').disabled = false;
                    document.getElementById('resultContent').className = 'result-content error';
                    document.getElementById('resultContent').textContent = msg.payload.message;
                    break;
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
