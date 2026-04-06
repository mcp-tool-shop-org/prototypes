import * as vscode from 'vscode';
import { OutputChannelLogger } from '../utils/logger';
import { AppBuilderError } from '../utils/errors';
import { Scaffolder } from '../scaffolding';
import { TypeGenerator } from '../codegen';
import { SchemaValidator } from '../validation';
import { TestRunner, TestGenerator } from '../testing';
import { DashboardPanel, PlaygroundPanel } from '../webview';
import type { MCPServerConfig } from '../mcp/types';

export function registerCommands(
    context: vscode.ExtensionContext,
    logger: OutputChannelLogger,
    diagnosticCollection: vscode.DiagnosticCollection,
    testOutputChannel: vscode.OutputChannel
): void {
    const scaffolder = new Scaffolder(logger);
    const typeGenerator = new TypeGenerator(logger);
    const schemaValidator = new SchemaValidator(logger);
    const testRunner = new TestRunner(logger, testOutputChannel);
    const testGenerator = new TestGenerator();

    const commands: Array<{ id: string; handler: () => Promise<void> }> = [
        {
            id: 'mcp-app-builder.newServer',
            handler: async () => {
                logger.info('Command: New Server');

                const options = await scaffolder.promptForConfig();
                if (!options) {
                    logger.info('New Server cancelled by user');
                    return;
                }

                const result = await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Creating MCP Server',
                        cancellable: false,
                    },
                    async (progress) => {
                        progress.report({ message: 'Generating files...' });
                        return await scaffolder.scaffold(options);
                    }
                );

                if (result.success) {
                    const openFolder = await vscode.window.showInformationMessage(
                        `Created MCP server with ${result.filesCreated.length} files`,
                        'Open Folder',
                        'Open in New Window'
                    );

                    if (openFolder === 'Open Folder') {
                        await vscode.commands.executeCommand(
                            'vscode.openFolder',
                            options.targetFolder
                        );
                    } else if (openFolder === 'Open in New Window') {
                        await vscode.commands.executeCommand(
                            'vscode.openFolder',
                            options.targetFolder,
                            true
                        );
                    }
                } else {
                    vscode.window.showErrorMessage(
                        `Failed to create server: ${result.errors.join(', ')}`
                    );
                }
            },
        },
        {
            id: 'mcp-app-builder.validateSchema',
            handler: async () => {
                logger.info('Command: Validate Schema');

                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor');
                    return;
                }

                const document = editor.document;
                const result = await schemaValidator.validateDocument(document);

                if (result.valid) {
                    diagnosticCollection.delete(document.uri);
                    vscode.window.showInformationMessage('Schema is valid');
                } else {
                    const diagnostics = schemaValidator.createDiagnostics(document, result);
                    diagnosticCollection.set(document.uri, diagnostics);
                    vscode.window.showErrorMessage(
                        `Schema has ${result.errors.length} error(s)`
                    );
                }
            },
        },
        {
            id: 'mcp-app-builder.generateTypes',
            handler: async () => {
                logger.info('Command: Generate Types');

                // Find mcp-tools.json in workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showWarningMessage('No workspace folder open');
                    return;
                }

                const toolsFiles = await vscode.workspace.findFiles(
                    '**/mcp-tools.json',
                    '**/node_modules/**'
                );

                if (toolsFiles.length === 0) {
                    vscode.window.showWarningMessage('No mcp-tools.json found in workspace');
                    return;
                }

                let toolsUri = toolsFiles[0];
                if (toolsFiles.length > 1) {
                    const items = toolsFiles.map((uri) => ({
                        label: vscode.workspace.asRelativePath(uri),
                        uri,
                    }));
                    const selected = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select tools file to generate types from',
                    });
                    if (!selected) {
                        return;
                    }
                    toolsUri = selected.uri;
                }

                try {
                    const content = await vscode.workspace.fs.readFile(toolsUri);
                    const toolsFile = typeGenerator.parseToolsFile(
                        Buffer.from(content).toString('utf-8')
                    );
                    const generated = typeGenerator.generate(toolsFile);

                    // Write to src/types/tools.generated.ts
                    const outputDir = vscode.Uri.joinPath(
                        vscode.Uri.file(toolsUri.fsPath.replace(/mcp-tools\.json$/, '')),
                        'src',
                        'types'
                    );

                    try {
                        await vscode.workspace.fs.stat(outputDir);
                    } catch {
                        await vscode.workspace.fs.createDirectory(outputDir);
                    }

                    const outputUri = vscode.Uri.joinPath(outputDir, 'tools.generated.ts');
                    await vscode.workspace.fs.writeFile(
                        outputUri,
                        Buffer.from(generated.content, 'utf-8')
                    );

                    vscode.window.showInformationMessage(
                        `Generated types for ${generated.toolCount} tools`
                    );

                    // Open the generated file
                    const doc = await vscode.workspace.openTextDocument(outputUri);
                    await vscode.window.showTextDocument(doc);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Failed to generate types: ${message}`);
                }
            },
        },
        {
            id: 'mcp-app-builder.testServer',
            handler: async () => {
                logger.info('Command: Test Server');

                // Find mcp-tools.json and mcp.json
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showWarningMessage('No workspace folder open');
                    return;
                }

                const toolsFiles = await vscode.workspace.findFiles(
                    '**/mcp-tools.json',
                    '**/node_modules/**'
                );

                const configFiles = await vscode.workspace.findFiles(
                    '**/mcp.json',
                    '**/node_modules/**'
                );

                if (toolsFiles.length === 0) {
                    vscode.window.showWarningMessage('No mcp-tools.json found');
                    return;
                }

                try {
                    // Load tools
                    const toolsContent = await vscode.workspace.fs.readFile(toolsFiles[0]);
                    const toolsData = JSON.parse(Buffer.from(toolsContent).toString('utf-8'));

                    // Load config (optional)
                    let configData: MCPServerConfig = { name: 'mcp-server', version: '0.1.0' };
                    if (configFiles.length > 0) {
                        const configContent = await vscode.workspace.fs.readFile(configFiles[0]);
                        configData = JSON.parse(Buffer.from(configContent).toString('utf-8')) as MCPServerConfig;
                    }

                    // Generate tests from tool definitions
                    const tests = testGenerator.generateFromTools(toolsData.tools || []);

                    if (tests.length === 0) {
                        vscode.window.showWarningMessage('No tools found to test');
                        return;
                    }

                    // Run tests
                    const result = await vscode.window.withProgress(
                        {
                            location: vscode.ProgressLocation.Notification,
                            title: 'Running MCP Tests',
                            cancellable: false,
                        },
                        async () => {
                            return await testRunner.runTests(tests, configData);
                        }
                    );

                    if (result.failed === 0) {
                        vscode.window.showInformationMessage(
                            `All ${result.passed} tests passed`
                        );
                    } else {
                        vscode.window.showWarningMessage(
                            `${result.passed} passed, ${result.failed} failed`
                        );
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Test failed: ${message}`);
                }
            },
        },
        {
            id: 'mcp-app-builder.openDashboard',
            handler: async () => {
                logger.info('Command: Open Dashboard');
                DashboardPanel.createOrShow(context.extensionUri, logger);
            },
        },
        {
            id: 'mcp-app-builder.openPlayground',
            handler: async () => {
                logger.info('Command: Open Playground');
                PlaygroundPanel.createOrShow(context.extensionUri, logger);
            },
        },
    ];

    for (const { id, handler } of commands) {
        const disposable = vscode.commands.registerCommand(id, async () => {
            try {
                await handler();
            } catch (error) {
                if (error instanceof AppBuilderError) {
                    logger.error(`Command ${id} failed [${error.code}]`, error);
                    const msg = error.hint
                        ? `MCP App Builder [${error.code}]: ${error.message} — ${error.hint}`
                        : `MCP App Builder [${error.code}]: ${error.message}`;
                    vscode.window.showErrorMessage(msg);
                } else {
                    logger.error(`Command ${id} failed`, error);
                    vscode.window.showErrorMessage(
                        `MCP App Builder: Command failed. See output for details.`
                    );
                }
            }
        });
        context.subscriptions.push(disposable);
        logger.debug(`Registered command: ${id}`);
    }
}
