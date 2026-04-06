/**
 * Type Generator
 *
 * Generates TypeScript types from MCP tool definitions.
 * Creates strongly-typed interfaces for tool inputs and outputs.
 */

import type { OutputChannelLogger } from '../utils/logger';

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
    enum?: string[];
    items?: ToolParameter;
    properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: ToolParameter[];
    returns?: {
        type: string;
        description: string;
    };
}

export interface ToolsFile {
    tools: ToolDefinition[];
}

export interface GeneratedTypes {
    content: string;
    toolCount: number;
}

export class TypeGenerator {
    private readonly logger: OutputChannelLogger;

    constructor(logger: OutputChannelLogger) {
        this.logger = logger;
    }

    generate(toolsFile: ToolsFile): GeneratedTypes {
        this.logger.debug(`Generating types for ${toolsFile.tools.length} tools`);

        const lines: string[] = [
            '/**',
            ' * Auto-generated types from MCP tool definitions',
            ' * Do not edit manually - regenerate using "MCP: Generate Types"',
            ' */',
            '',
            "import type { MCPToolResult } from '@mcp-app-builder/types';",
            '',
        ];

        // Generate input types for each tool
        for (const tool of toolsFile.tools) {
            lines.push(...this.generateToolTypes(tool));
            lines.push('');
        }

        // Generate union types
        lines.push(...this.generateUnionTypes(toolsFile.tools));

        // Generate handler interface
        lines.push(...this.generateHandlerInterface(toolsFile.tools));

        return {
            content: lines.join('\n'),
            toolCount: toolsFile.tools.length,
        };
    }

    private generateToolTypes(tool: ToolDefinition): string[] {
        const lines: string[] = [];
        const typeName = this.toPascalCase(tool.name);

        // JSDoc
        lines.push('/**');
        lines.push(` * ${tool.description}`);
        lines.push(' */');

        // Input interface
        lines.push(`export interface ${typeName}Input {`);
        for (const param of tool.parameters) {
            const optional = param.required ? '' : '?';
            const tsType = this.paramToTsType(param);
            lines.push(`    /** ${param.description} */`);
            lines.push(`    ${param.name}${optional}: ${tsType};`);
        }
        lines.push('}');

        // Output type (if specified)
        if (tool.returns) {
            lines.push('');
            lines.push(`export type ${typeName}Output = MCPToolResult;`);
        }

        return lines;
    }

    private generateUnionTypes(tools: ToolDefinition[]): string[] {
        const lines: string[] = [];

        // Tool name union
        lines.push('/** All available tool names */');
        lines.push(
            `export type ToolName = ${tools.map((t) => `'${t.name}'`).join(' | ')};`
        );
        lines.push('');

        // Tool input map
        lines.push('/** Map of tool names to their input types */');
        lines.push('export interface ToolInputMap {');
        for (const tool of tools) {
            const typeName = this.toPascalCase(tool.name);
            lines.push(`    '${tool.name}': ${typeName}Input;`);
        }
        lines.push('}');
        lines.push('');

        return lines;
    }

    private generateHandlerInterface(tools: ToolDefinition[]): string[] {
        const lines: string[] = [];

        lines.push('/** Interface for implementing tool handlers */');
        lines.push('export interface ToolHandlers {');
        for (const tool of tools) {
            const typeName = this.toPascalCase(tool.name);
            lines.push(`    /** ${tool.description} */`);
            lines.push(`    ${tool.name}(input: ${typeName}Input): Promise<MCPToolResult>;`);
        }
        lines.push('}');
        lines.push('');

        // Type-safe call function
        lines.push('/** Type-safe tool call function */');
        lines.push('export function createToolCaller(handlers: ToolHandlers) {');
        lines.push('    return async function callTool<T extends ToolName>(');
        lines.push('        name: T,');
        lines.push('        input: ToolInputMap[T]');
        lines.push('    ): Promise<MCPToolResult> {');
        lines.push('        const handler = handlers[name] as (input: ToolInputMap[T]) => Promise<MCPToolResult>;');
        lines.push('        return handler(input);');
        lines.push('    };');
        lines.push('}');

        return lines;
    }

    private paramToTsType(param: ToolParameter): string {
        if (param.enum && param.enum.length > 0) {
            return param.enum.map((e) => `'${e}'`).join(' | ');
        }

        switch (param.type) {
            case 'string':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                if (param.items) {
                    return `Array<${this.paramToTsType(param.items)}>`;
                }
                return 'unknown[]';
            case 'object':
                if (param.properties) {
                    const props = Object.entries(param.properties)
                        .map(([key, value]) => `${key}: ${this.paramToTsType(value)}`)
                        .join('; ');
                    return `{ ${props} }`;
                }
                return 'Record<string, unknown>';
            default:
                return 'unknown';
        }
    }

    private toPascalCase(str: string): string {
        return str
            .split(/[-_]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    parseToolsFile(content: string): ToolsFile {
        const parsed = JSON.parse(content);

        if (!parsed.tools || !Array.isArray(parsed.tools)) {
            throw new Error('Invalid tools file: missing "tools" array');
        }

        return parsed as ToolsFile;
    }
}
