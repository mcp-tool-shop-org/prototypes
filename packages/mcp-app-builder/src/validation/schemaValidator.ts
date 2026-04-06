import * as vscode from 'vscode';
import { z } from 'zod';
import type { OutputChannelLogger } from '../utils/logger';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const ParameterValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    pattern: z.string().optional(),
    format: z.enum(['email', 'uri', 'date', 'date-time', 'uuid']).optional(),
});

const ParameterSchema: z.ZodType<unknown> = z.lazy(() =>
    z.object({
        name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
        type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
        description: z.string(),
        required: z.boolean().optional().default(false),
        default: z.unknown().optional(),
        enum: z.array(z.string()).optional(),
        items: z.lazy(() => ParameterSchema).optional(),
        properties: z.record(z.lazy(() => ParameterSchema)).optional(),
        validation: ParameterValidationSchema.optional(),
    })
);

const ExampleSchema = z.object({
    description: z.string().optional(),
    input: z.record(z.unknown()),
    output: z.unknown(),
});

const UIConfigSchema = z.object({
    resultType: z.enum(['text', 'table', 'chart', 'form', 'card', 'custom']).optional(),
    inputForm: z.object({
        layout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
        submitLabel: z.string().optional(),
    }).optional(),
    resultDisplay: z.object({
        title: z.string().optional(),
        refreshable: z.boolean().optional(),
        expandable: z.boolean().optional(),
    }).optional(),
});

const ToolSchema = z.object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/).min(1).max(64),
    description: z.string().min(10).max(1000),
    parameters: z.array(ParameterSchema as z.ZodType<z.infer<typeof ParameterSchema>>),
    returns: z.object({
        type: z.enum(['text', 'json', 'image', 'resource', 'ui']),
        description: z.string(),
    }).optional(),
    examples: z.array(ExampleSchema).optional(),
    ui: UIConfigSchema.optional(),
});

const ToolsFileSchema = z.object({
    $schema: z.string().optional(),
    tools: z.array(ToolSchema),
});

const CapabilitiesSchema = z.object({
    tools: z.boolean().optional().default(true),
    resources: z.boolean().optional().default(false),
    prompts: z.boolean().optional().default(false),
    logging: z.boolean().optional().default(false),
});

const TransportOptionsSchema = z.object({
    port: z.number().int().min(1).max(65535).optional(),
    host: z.string().optional().default('localhost'),
    path: z.string().optional(),
    tls: z.boolean().optional().default(false),
});

const TransportSchema = z.object({
    type: z.enum(['stdio', 'http', 'websocket']).default('stdio'),
    options: TransportOptionsSchema.optional(),
});

const ConfigSchema = z.object({
    name: z.string().regex(/^[a-z][a-z0-9-]*$/).min(1).max(64),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/),
    description: z.string().max(500).optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().url().optional(),
    capabilities: CapabilitiesSchema.optional(),
    transport: TransportSchema.optional(),
    tools: z.string().optional().default('./mcp-tools.json'),
});

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationError {
    path: string;
    message: string;
    line?: number;
    column?: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

// ============================================================================
// Schema Validator Class
// ============================================================================

export class SchemaValidator {
    private readonly logger: OutputChannelLogger;

    constructor(logger: OutputChannelLogger) {
        this.logger = logger;
    }

    validateConfig(content: string): ValidationResult {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: [],
        };

        try {
            const parsed = JSON.parse(content);
            const zodResult = ConfigSchema.safeParse(parsed);

            if (!zodResult.success) {
                result.valid = false;
                for (const issue of zodResult.error.issues) {
                    result.errors.push({
                        path: issue.path.join('.'),
                        message: issue.message,
                    });
                }
            }
        } catch (e) {
            result.valid = false;
            result.errors.push({
                path: '',
                message: e instanceof Error ? e.message : 'Invalid JSON',
            });
        }

        return result;
    }

    validateTools(content: string): ValidationResult {
        const result: ValidationResult = {
            valid: true,
            errors: [],
            warnings: [],
        };

        try {
            const parsed = JSON.parse(content);
            const zodResult = ToolsFileSchema.safeParse(parsed);

            if (!zodResult.success) {
                result.valid = false;
                for (const issue of zodResult.error.issues) {
                    result.errors.push({
                        path: issue.path.join('.'),
                        message: issue.message,
                    });
                }
            } else {
                // Additional semantic validation
                const tools = zodResult.data.tools;
                const toolNames = new Set<string>();

                for (const tool of tools) {
                    if (toolNames.has(tool.name)) {
                        result.valid = false;
                        result.errors.push({
                            path: `tools.${tool.name}`,
                            message: `Duplicate tool name: ${tool.name}`,
                        });
                    }
                    toolNames.add(tool.name);

                    // Check for required parameters without defaults
                    for (const param of tool.parameters) {
                        const p = param as { name: string; required?: boolean; default?: unknown };
                        if (p.required && p.default !== undefined) {
                            result.warnings.push({
                                path: `tools.${tool.name}.parameters.${p.name}`,
                                message: 'Required parameter has a default value',
                            });
                        }
                    }
                }
            }
        } catch (e) {
            result.valid = false;
            result.errors.push({
                path: '',
                message: e instanceof Error ? e.message : 'Invalid JSON',
            });
        }

        return result;
    }

    async validateDocument(document: vscode.TextDocument): Promise<ValidationResult> {
        const fileName = document.fileName;
        const content = document.getText();

        this.logger.debug(`Validating ${fileName}`);

        if (fileName.endsWith('mcp.json')) {
            return this.validateConfig(content);
        } else if (fileName.endsWith('mcp-tools.json')) {
            return this.validateTools(content);
        }

        return { valid: true, errors: [], warnings: [] };
    }

    createDiagnostics(
        document: vscode.TextDocument,
        result: ValidationResult
    ): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        for (const error of result.errors) {
            const range = this.findRangeForPath(document, error.path);
            diagnostics.push(
                new vscode.Diagnostic(
                    range,
                    error.message,
                    vscode.DiagnosticSeverity.Error
                )
            );
        }

        for (const warning of result.warnings) {
            const range = this.findRangeForPath(document, warning.path);
            diagnostics.push(
                new vscode.Diagnostic(
                    range,
                    warning.message,
                    vscode.DiagnosticSeverity.Warning
                )
            );
        }

        return diagnostics;
    }

    private findRangeForPath(document: vscode.TextDocument, path: string): vscode.Range {
        if (!path) {
            return new vscode.Range(0, 0, 0, 0);
        }

        // Simple heuristic: search for the key in the document
        const parts = path.split('.');
        const searchKey = parts[parts.length - 1];
        const text = document.getText();
        const keyPattern = new RegExp(`"${searchKey}"\\s*:`);
        const match = keyPattern.exec(text);

        if (match) {
            const pos = document.positionAt(match.index);
            return new vscode.Range(pos, pos.translate(0, match[0].length));
        }

        return new vscode.Range(0, 0, 0, 0);
    }
}

// Export schemas for use in type generation
export { ConfigSchema, ToolsFileSchema, ToolSchema, ParameterSchema };
