import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { MCPConfigProvider } from './providers/configProvider';
import { SchemaValidator } from './validation';
import { OutputChannelLogger } from './utils/logger';

let outputChannel: vscode.OutputChannel;
let logger: OutputChannelLogger;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const startTime = Date.now();

    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('MCP App Builder');
    logger = new OutputChannelLogger(outputChannel);

    logger.info('Activating MCP App Builder extension...');

    try {
        // Create shared resources (single instances, disposed on deactivation)
        const diagnosticCollection = vscode.languages.createDiagnosticCollection('mcp');
        const testOutputChannel = vscode.window.createOutputChannel('MCP Test Results');
        context.subscriptions.push(diagnosticCollection, testOutputChannel);

        // Register all commands with shared resources
        registerCommands(context, logger, diagnosticCollection, testOutputChannel);

        // Register configuration provider for workspace detection
        const configProvider = new MCPConfigProvider(logger);
        context.subscriptions.push(
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                configProvider.refresh();
            })
        );

        // Watch for mcp.json file changes
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/mcp.json');
        context.subscriptions.push(
            fileWatcher.onDidChange(() => configProvider.refresh()),
            fileWatcher.onDidCreate(() => configProvider.refresh()),
            fileWatcher.onDidDelete(() => configProvider.refresh()),
            fileWatcher
        );

        // Auto-validate on save
        const schemaValidator = new SchemaValidator(logger);
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((document) => {
                const config = vscode.workspace.getConfiguration('mcp-app-builder');
                if (!config.get<boolean>('autoValidate', true)) {
                    return;
                }

                const fileName = document.fileName;
                if (!fileName.endsWith('mcp.json') && !fileName.endsWith('mcp-tools.json')) {
                    return;
                }

                const result = fileName.endsWith('mcp-tools.json')
                    ? schemaValidator.validateTools(document.getText())
                    : schemaValidator.validateConfig(document.getText());

                const diagnostics = schemaValidator.createDiagnostics(document, result);
                diagnosticCollection.set(document.uri, diagnostics);

                if (!result.valid) {
                    logger.info(`[AutoValidate] ${fileName}: ${result.errors.length} error(s)`);
                }
            })
        );

        // Register status bar item
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        statusBarItem.text = '$(plug) MCP';
        statusBarItem.tooltip = 'MCP App Builder - Click to open dashboard';
        statusBarItem.command = 'mcp-app-builder.openDashboard';

        // Only show status bar when in an MCP project
        if (await configProvider.hasMCPConfig()) {
            statusBarItem.show();
        }

        context.subscriptions.push(statusBarItem);

        // Add output channel to subscriptions for cleanup
        context.subscriptions.push(outputChannel);

        const activationTime = Date.now() - startTime;
        logger.info(`MCP App Builder activated in ${activationTime}ms`);

        // Warn if activation is slow
        if (activationTime > 500) {
            logger.warn(`Activation took ${activationTime}ms, which exceeds the 500ms target`);
        }

    } catch (error) {
        logger.error('Failed to activate extension', error);
        throw error;
    }
}

export function deactivate(): void {
    if (logger) {
        logger.info('MCP App Builder deactivated');
    }
}

export function getLogger(): OutputChannelLogger {
    return logger;
}
