/**
 * MCP Test Client
 *
 * A client for testing MCP servers during development.
 * Uses the official @modelcontextprotocol/sdk to connect to real servers
 * via stdio or HTTP transport.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type {
    MCPServerConfig,
    MCPToolDefinition,
    MCPToolResult,
    MCPToolParameter,
    MCPResource,
    MCPPrompt,
    MCPTransportConfig,
} from './types';

export interface MCPClientOptions {
    transport: MCPTransportConfig;
    timeout?: number;
    cwd?: string;
}

export interface MCPClientState {
    connected: boolean;
    serverInfo: MCPServerConfig | null;
    lastError: Error | null;
}

export class MCPTestClient {
    private readonly options: MCPClientOptions;
    private client: Client | null = null;
    private transport: StdioClientTransport | SSEClientTransport | null = null;
    private state: MCPClientState = {
        connected: false,
        serverInfo: null,
        lastError: null,
    };

    constructor(options: MCPClientOptions) {
        this.options = {
            timeout: 30000,
            ...options,
        };
    }

    // ========================================================================
    // Connection Management
    // ========================================================================

    async connect(): Promise<MCPServerConfig> {
        const timeout = this.options.timeout ?? 30000;

        try {
            this.transport = this.createTransport();

            this.client = new Client({
                name: 'mcp-app-builder',
                version: '1.1.0',
            });

            await Promise.race([
                this.client.connect(this.transport),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Connection timed out after ${timeout}ms`)),
                        timeout
                    )
                ),
            ]);

            this.state.connected = true;

            const serverVersion = this.client.getServerVersion?.();
            const serverCaps = this.client.getServerCapabilities?.();

            const serverInfo: MCPServerConfig = {
                name: serverVersion?.name ?? 'unknown',
                version: serverVersion?.version ?? '0.0.0',
                capabilities: {
                    tools: !!serverCaps?.tools,
                    resources: !!serverCaps?.resources,
                    prompts: !!serverCaps?.prompts,
                },
            };

            this.state.serverInfo = serverInfo;
            return serverInfo;
        } catch (error) {
            this.state.lastError = error instanceof Error ? error : new Error(String(error));
            await this.disconnect();
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
            }
        } catch {
            // Swallow close errors during cleanup
        } finally {
            this.client = null;
            this.transport = null;
            this.state.connected = false;
            this.state.serverInfo = null;
        }
    }

    isConnected(): boolean {
        return this.state.connected;
    }

    getServerInfo(): MCPServerConfig | null {
        return this.state.serverInfo;
    }

    // ========================================================================
    // Tool Operations
    // ========================================================================

    async listTools(): Promise<MCPToolDefinition[]> {
        this.ensureConnected();
        const result = await this.client!.listTools();
        return result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description ?? '',
            parameters: this.mapInputSchema(tool.inputSchema),
        }));
    }

    async callTool(
        name: string,
        args: Record<string, unknown>
    ): Promise<MCPToolResult> {
        this.ensureConnected();
        const result = await this.client!.callTool({
            name,
            arguments: args,
        });
        return {
            content: (result.content as Array<{ type: string; text?: string }>).map((c) => ({
                type: c.type as 'text',
                text: c.text ?? '',
            })),
            isError: result.isError as boolean | undefined,
        };
    }

    // ========================================================================
    // Resource Operations
    // ========================================================================

    async listResources(): Promise<MCPResource[]> {
        this.ensureConnected();
        const result = await this.client!.listResources();
        return result.resources.map((r) => ({
            uri: r.uri,
            name: r.name,
            mimeType: r.mimeType,
            description: r.description,
        }));
    }

    async readResource(uri: string): Promise<MCPResource & { content: string }> {
        this.ensureConnected();
        const result = await this.client!.readResource({ uri });
        const textContent = result.contents
            .filter((c): c is { uri: string; text: string; mimeType?: string } => 'text' in c)
            .map((c) => c.text)
            .join('');
        return {
            uri,
            name: uri.split('/').pop() || uri,
            content: textContent,
        };
    }

    // ========================================================================
    // Prompt Operations
    // ========================================================================

    async listPrompts(): Promise<MCPPrompt[]> {
        this.ensureConnected();
        const result = await this.client!.listPrompts();
        return result.prompts.map((p) => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments?.map((a) => ({
                name: a.name,
                description: a.description,
                required: a.required,
            })),
        }));
    }

    async getPrompt(
        name: string,
        args?: Record<string, string>
    ): Promise<{ messages: Array<{ role: string; content: string }> }> {
        this.ensureConnected();
        const result = await this.client!.getPrompt({ name, arguments: args });
        return {
            messages: result.messages.map((m) => ({
                role: m.role,
                content:
                    typeof m.content === 'string'
                        ? m.content
                        : m.content.type === 'text'
                          ? m.content.text
                          : JSON.stringify(m.content),
            })),
        };
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private createTransport(): StdioClientTransport | SSEClientTransport {
        const { transport } = this.options;

        switch (transport.type) {
            case 'stdio': {
                const command = transport.command;
                if (!command) {
                    throw new Error(
                        'stdio transport requires "command" in mcp.json transport config. ' +
                            'Example: { "type": "stdio", "command": "node", "args": ["dist/index.js"] }'
                    );
                }
                return new StdioClientTransport({
                    command,
                    args: transport.args,
                    cwd: this.options.cwd,
                });
            }
            case 'http': {
                const port = transport.options?.port ?? 3000;
                const host = transport.options?.host ?? 'localhost';
                const protocol = transport.options?.tls ? 'https' : 'http';
                const path = transport.options?.path ?? '/sse';
                const url = new URL(`${protocol}://${host}:${port}${path}`);
                return new SSEClientTransport(url);
            }
            default:
                throw new Error(`Unsupported transport type: ${transport.type}`);
        }
    }

    private mapInputSchema(schema: unknown): MCPToolParameter[] {
        if (!schema || typeof schema !== 'object') return [];

        const s = schema as {
            properties?: Record<
                string,
                {
                    type?: string;
                    description?: string;
                    enum?: string[];
                    items?: { type?: string };
                    properties?: Record<string, unknown>;
                }
            >;
            required?: string[];
        };

        if (!s.properties) return [];

        const requiredSet = new Set(s.required ?? []);

        return Object.entries(s.properties).map(([name, prop]) => ({
            name,
            type: (prop.type ?? 'string') as MCPToolParameter['type'],
            description: prop.description ?? '',
            required: requiredSet.has(name),
            enum: prop.enum,
        }));
    }

    private ensureConnected(): void {
        if (!this.state.connected || !this.client) {
            throw new Error('Client is not connected. Call connect() first.');
        }
    }
}

/**
 * Factory function to create a test client with stdio transport
 */
export function createStdioTestClient(
    command: string,
    args?: string[],
    cwd?: string
): MCPTestClient {
    return new MCPTestClient({
        transport: { type: 'stdio', command, args },
        cwd,
    });
}

/**
 * Factory function to create a test client with HTTP transport
 */
export function createHttpTestClient(port: number, host = 'localhost'): MCPTestClient {
    return new MCPTestClient({
        transport: {
            type: 'http',
            options: { port, host },
        },
    });
}
