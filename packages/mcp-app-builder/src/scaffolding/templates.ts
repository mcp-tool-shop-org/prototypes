/**
 * MCP Server Templates
 *
 * Provides template generation for different MCP server configurations.
 */

export type TemplateType = 'basic' | 'with-ui' | 'full';

export interface TemplateConfig {
    name: string;
    description: string;
    author?: string;
    transport: 'stdio' | 'http';
    capabilities: {
        tools: boolean;
        resources: boolean;
        prompts: boolean;
    };
}

export interface GeneratedFile {
    path: string;
    content: string;
}

/**
 * Sanitizes a server name for safe interpolation into generated source code.
 * Enforces the allowed pattern and escapes characters that could break
 * template strings or JSON.
 */
export function sanitizeName(name: string): string {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        throw new Error(
            `Invalid server name "${name}": must match ^[a-z][a-z0-9-]*$`
        );
    }
    return name.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// ============================================================================
// Template: Basic
// ============================================================================

function generateBasicTemplate(config: TemplateConfig): GeneratedFile[] {
    const safeName = sanitizeName(config.name);
    const files: GeneratedFile[] = [];

    // mcp.json
    files.push({
        path: 'mcp.json',
        content: JSON.stringify(
            {
                name: config.name,
                version: '0.1.0',
                description: config.description,
                author: config.author,
                capabilities: config.capabilities,
                transport: {
                    type: config.transport,
                },
                tools: './mcp-tools.json',
            },
            null,
            2
        ),
    });

    // mcp-tools.json
    files.push({
        path: 'mcp-tools.json',
        content: JSON.stringify(
            {
                $schema: 'https://mcp-tool-shop.dev/schemas/mcp-tools.schema.json',
                tools: [
                    {
                        name: 'hello',
                        description: 'A simple hello world tool that greets the user',
                        parameters: [
                            {
                                name: 'name',
                                type: 'string',
                                description: 'The name to greet',
                                required: true,
                            },
                        ],
                        returns: {
                            type: 'text',
                            description: 'A greeting message',
                        },
                        examples: [
                            {
                                description: 'Greet a user',
                                input: { name: 'World' },
                                output: 'Hello, World!',
                            },
                        ],
                    },
                ],
            },
            null,
            2
        ),
    });

    // src/index.ts
    files.push({
        path: 'src/index.ts',
        content: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
    {
        name: '${safeName}',
        version: '0.1.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'hello',
                description: 'A simple hello world tool that greets the user',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The name to greet',
                        },
                    },
                    required: ['name'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'hello') {
        const userName = (args as { name: string }).name;
        return {
            content: [
                {
                    type: 'text',
                    text: \`Hello, \${userName}!\`,
                },
            ],
        };
    }

    throw new Error(\`Unknown tool: \${name}\`);
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('${safeName} MCP server running on stdio');
}

main().catch(console.error);
`,
    });

    // package.json
    files.push({
        path: 'package.json',
        content: JSON.stringify(
            {
                name: config.name,
                version: '0.1.0',
                description: config.description,
                type: 'module',
                main: 'dist/index.js',
                scripts: {
                    build: 'tsc',
                    start: 'node dist/index.js',
                    dev: 'tsx src/index.ts',
                },
                dependencies: {
                    '@modelcontextprotocol/sdk': '^1.0.0',
                },
                devDependencies: {
                    '@types/node': '^20.11.0',
                    tsx: '^4.7.0',
                    typescript: '^5.3.3',
                },
            },
            null,
            2
        ),
    });

    // tsconfig.json
    files.push({
        path: 'tsconfig.json',
        content: JSON.stringify(
            {
                compilerOptions: {
                    target: 'ES2022',
                    module: 'Node16',
                    moduleResolution: 'Node16',
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    declaration: true,
                },
                include: ['src/**/*'],
            },
            null,
            2
        ),
    });

    return files;
}

// ============================================================================
// Template: With UI
// ============================================================================

function generateWithUITemplate(config: TemplateConfig): GeneratedFile[] {
    const files = generateBasicTemplate(config);

    // Replace mcp-tools.json with UI-enabled version
    const toolsIndex = files.findIndex((f) => f.path === 'mcp-tools.json');
    if (toolsIndex >= 0) {
        files[toolsIndex] = {
            path: 'mcp-tools.json',
            content: JSON.stringify(
                {
                    $schema: 'https://mcp-tool-shop.dev/schemas/mcp-tools.schema.json',
                    tools: [
                        {
                            name: 'searchData',
                            description: 'Search through data and display results in a table',
                            parameters: [
                                {
                                    name: 'query',
                                    type: 'string',
                                    description: 'Search query',
                                    required: true,
                                },
                                {
                                    name: 'limit',
                                    type: 'number',
                                    description: 'Maximum results to return',
                                    default: 10,
                                },
                            ],
                            returns: {
                                type: 'ui',
                                description: 'Search results displayed in a table',
                            },
                            ui: {
                                resultType: 'table',
                                inputForm: {
                                    layout: 'horizontal',
                                    submitLabel: 'Search',
                                },
                                resultDisplay: {
                                    title: 'Search Results',
                                    refreshable: true,
                                },
                            },
                        },
                        {
                            name: 'getStats',
                            description: 'Get statistics and display as a chart',
                            parameters: [
                                {
                                    name: 'period',
                                    type: 'string',
                                    description: 'Time period for stats',
                                    enum: ['day', 'week', 'month', 'year'],
                                    required: true,
                                },
                            ],
                            returns: {
                                type: 'ui',
                                description: 'Statistics displayed as a chart',
                            },
                            ui: {
                                resultType: 'chart',
                                resultDisplay: {
                                    title: 'Statistics',
                                    refreshable: true,
                                    expandable: true,
                                },
                            },
                        },
                    ],
                },
                null,
                2
            ),
        };
    }

    return files;
}

// ============================================================================
// Template: Full
// ============================================================================

function generateFullTemplate(config: TemplateConfig): GeneratedFile[] {
    const files = generateWithUITemplate(config);

    // Add resources handler
    files.push({
        path: 'src/resources.ts',
        content: `import { Resource } from '@modelcontextprotocol/sdk/types.js';

export interface DataResource extends Resource {
    data: unknown;
}

export function listResources(): Resource[] {
    return [
        {
            uri: 'data://example/config',
            name: 'Configuration',
            mimeType: 'application/json',
            description: 'Current server configuration',
        },
    ];
}

export function readResource(uri: string): DataResource {
    if (uri === 'data://example/config') {
        return {
            uri,
            name: 'Configuration',
            mimeType: 'application/json',
            data: {
                version: '0.1.0',
                environment: 'development',
            },
        };
    }

    throw new Error(\`Resource not found: \${uri}\`);
}
`,
    });

    // Add prompts handler
    files.push({
        path: 'src/prompts.ts',
        content: `import { Prompt } from '@modelcontextprotocol/sdk/types.js';

export function listPrompts(): Prompt[] {
    return [
        {
            name: 'summarize',
            description: 'Summarize the provided content',
            arguments: [
                {
                    name: 'content',
                    description: 'Content to summarize',
                    required: true,
                },
                {
                    name: 'style',
                    description: 'Summary style (brief, detailed, bullets)',
                    required: false,
                },
            ],
        },
    ];
}

export function getPrompt(name: string, args: Record<string, string>) {
    if (name === 'summarize') {
        const style = args.style || 'brief';
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: \`Please provide a \${style} summary of the following:\\n\\n\${args.content}\`,
                    },
                },
            ],
        };
    }

    throw new Error(\`Prompt not found: \${name}\`);
}
`,
    });

    return files;
}

// ============================================================================
// Template Generator
// ============================================================================

export function generateTemplate(
    type: TemplateType,
    config: TemplateConfig
): GeneratedFile[] {
    switch (type) {
        case 'basic':
            return generateBasicTemplate(config);
        case 'with-ui':
            return generateWithUITemplate(config);
        case 'full':
            return generateFullTemplate(config);
        default:
            throw new Error(`Unknown template type: ${type}`);
    }
}

export function getTemplateDescription(type: TemplateType): string {
    switch (type) {
        case 'basic':
            return 'Simple MCP server with a hello world tool';
        case 'with-ui':
            return 'MCP server with UI components (tables, charts)';
        case 'full':
            return 'Full MCP server with tools, resources, and prompts';
        default:
            return 'Unknown template';
    }
}
