import * as vscode from 'vscode';
import { OutputChannelLogger } from '../utils/logger';

export interface MCPConfig {
    name: string;
    version: string;
    description?: string;
    tools?: Array<{
        name: string;
        description: string;
    }>;
}

export class MCPConfigProvider {
    private readonly logger: OutputChannelLogger;
    private config: MCPConfig | null = null;
    private configPath: vscode.Uri | null = null;

    private readonly _onDidChangeConfig = new vscode.EventEmitter<MCPConfig | null>();
    public readonly onDidChangeConfig = this._onDidChangeConfig.event;

    constructor(logger: OutputChannelLogger) {
        this.logger = logger;
        void this.refresh();
    }

    async refresh(): Promise<void> {
        this.logger.debug('Refreshing MCP configuration...');

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.config = null;
            this.configPath = null;
            this._onDidChangeConfig.fire(null);
            return;
        }

        // Look for mcp.json in workspace root
        for (const folder of workspaceFolders) {
            const configUri = vscode.Uri.joinPath(folder.uri, 'mcp.json');
            try {
                const content = await vscode.workspace.fs.readFile(configUri);
                const configText = Buffer.from(content).toString('utf-8');
                this.config = JSON.parse(configText) as MCPConfig;
                this.configPath = configUri;
                this.logger.info(`Loaded MCP config from ${configUri.fsPath}`);
                this._onDidChangeConfig.fire(this.config);
                return;
            } catch {
                // File doesn't exist or is invalid, continue searching
            }
        }

        this.config = null;
        this.configPath = null;
        this._onDidChangeConfig.fire(null);
    }

    async hasMCPConfig(): Promise<boolean> {
        await this.refresh();
        return this.config !== null;
    }

    getConfig(): MCPConfig | null {
        return this.config;
    }

    getConfigPath(): vscode.Uri | null {
        return this.configPath;
    }
}
