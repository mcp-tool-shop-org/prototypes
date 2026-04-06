import * as vscode from 'vscode';
import * as path from 'path';
import type { OutputChannelLogger } from '../utils/logger';
import {
    generateTemplate,
    getTemplateDescription,
    type TemplateType,
    type TemplateConfig,
    type GeneratedFile,
} from './templates';

export interface ScaffoldOptions {
    targetFolder: vscode.Uri;
    template: TemplateType;
    config: TemplateConfig;
}

export interface ScaffoldResult {
    success: boolean;
    filesCreated: string[];
    errors: string[];
}

export class Scaffolder {
    private readonly logger: OutputChannelLogger;

    constructor(logger: OutputChannelLogger) {
        this.logger = logger;
    }

    async scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
        const result: ScaffoldResult = {
            success: true,
            filesCreated: [],
            errors: [],
        };

        this.logger.info(`Scaffolding ${options.template} template in ${options.targetFolder.fsPath}`);

        try {
            const files = generateTemplate(options.template, options.config);

            for (const file of files) {
                try {
                    await this.writeFile(options.targetFolder, file);
                    result.filesCreated.push(file.path);
                    this.logger.debug(`Created: ${file.path}`);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    result.errors.push(`Failed to create ${file.path}: ${message}`);
                    result.success = false;
                }
            }

            if (result.success) {
                this.logger.info(`Successfully created ${result.filesCreated.length} files`);
            } else {
                this.logger.error(`Scaffolding completed with ${result.errors.length} errors`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            result.success = false;
            result.errors.push(message);
            this.logger.error('Scaffolding failed', error);
        }

        return result;
    }

    private async writeFile(baseUri: vscode.Uri, file: GeneratedFile): Promise<void> {
        const filePath = vscode.Uri.joinPath(baseUri, file.path);

        // Ensure parent directory exists
        const parentDir = vscode.Uri.joinPath(baseUri, path.dirname(file.path));
        try {
            await vscode.workspace.fs.stat(parentDir);
        } catch {
            await vscode.workspace.fs.createDirectory(parentDir);
        }

        // Write file
        const content = Buffer.from(file.content, 'utf-8');
        await vscode.workspace.fs.writeFile(filePath, content);
    }

    async promptForConfig(): Promise<ScaffoldOptions | undefined> {
        // Step 1: Choose template
        const templateOptions: vscode.QuickPickItem[] = [
            {
                label: 'basic',
                description: getTemplateDescription('basic'),
                detail: 'Recommended for getting started',
            },
            {
                label: 'with-ui',
                description: getTemplateDescription('with-ui'),
                detail: 'Includes MCP Apps UI components',
            },
            {
                label: 'full',
                description: getTemplateDescription('full'),
                detail: 'Complete server with all capabilities',
            },
        ];

        const templateChoice = await vscode.window.showQuickPick(templateOptions, {
            placeHolder: 'Select a template',
            title: 'MCP: New Server',
        });

        if (!templateChoice) {
            return undefined;
        }

        // Step 2: Server name
        const name = await vscode.window.showInputBox({
            prompt: 'Enter server name',
            placeHolder: 'my-mcp-server',
            validateInput: (value) => {
                if (!value) {
                    return 'Name is required';
                }
                if (!/^[a-z][a-z0-9-]*$/.test(value)) {
                    return 'Name must start with lowercase letter and contain only lowercase letters, numbers, and hyphens';
                }
                if (value.length > 64) {
                    return 'Name must be 64 characters or less';
                }
                return null;
            },
        });

        if (!name) {
            return undefined;
        }

        // Step 3: Description
        const description = await vscode.window.showInputBox({
            prompt: 'Enter server description',
            placeHolder: 'A helpful MCP server',
        });

        if (description === undefined) {
            return undefined;
        }

        // Step 4: Target folder
        const folderOptions = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select folder for new server',
            title: 'Choose location',
        });

        if (!folderOptions || folderOptions.length === 0) {
            return undefined;
        }

        const targetFolder = vscode.Uri.joinPath(folderOptions[0], name);

        // Step 5: Transport
        const transportChoice = await vscode.window.showQuickPick(
            [
                { label: 'stdio', description: 'Standard input/output (recommended for CLI)' },
                { label: 'http', description: 'HTTP server (for web deployment)' },
            ],
            {
                placeHolder: 'Select transport type',
                title: 'Transport',
            }
        );

        if (!transportChoice) {
            return undefined;
        }

        return {
            targetFolder,
            template: templateChoice.label as TemplateType,
            config: {
                name,
                description: description || `${name} MCP server`,
                transport: transportChoice.label as 'stdio' | 'http',
                capabilities: {
                    tools: true,
                    resources: templateChoice.label === 'full',
                    prompts: templateChoice.label === 'full',
                },
            },
        };
    }
}
