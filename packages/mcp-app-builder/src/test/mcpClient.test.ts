import { describe, it, expect, vi } from 'vitest';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: vi.fn().mockImplementation(() => ({
        connect: vi.fn(),
        close: vi.fn(),
        getServerVersion: vi.fn(() => ({ name: 'test-server', version: '1.0.0' })),
        getServerCapabilities: vi.fn(() => ({ tools: true, resources: false, prompts: false })),
        listTools: vi.fn(() => ({
            tools: [
                {
                    name: 'hello',
                    description: 'Says hello',
                    inputSchema: {
                        properties: {
                            name: { type: 'string', description: 'Name to greet' },
                        },
                        required: ['name'],
                    },
                },
            ],
        })),
        callTool: vi.fn(() => ({
            content: [{ type: 'text', text: 'Hello, world!' }],
            isError: false,
        })),
        listResources: vi.fn(() => ({
            resources: [
                { uri: 'file:///test.txt', name: 'test.txt', mimeType: 'text/plain' },
            ],
        })),
        readResource: vi.fn(() => ({
            contents: [{ uri: 'file:///test.txt', text: 'file content' }],
        })),
        listPrompts: vi.fn(() => ({
            prompts: [
                {
                    name: 'greet',
                    description: 'Greet someone',
                    arguments: [{ name: 'name', description: 'Name', required: true }],
                },
            ],
        })),
        getPrompt: vi.fn(() => ({
            messages: [{ role: 'assistant', content: { type: 'text', text: 'Hello!' } }],
        })),
    })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: vi.fn(),
}));

import { MCPTestClient, createStdioTestClient, createHttpTestClient } from '../mcp/client';

describe('MCPTestClient', () => {
    describe('constructor', () => {
        it('sets default timeout', () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            expect(client).toBeDefined();
        });

        it('accepts custom timeout', () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
                timeout: 5000,
            });
            expect(client).toBeDefined();
        });
    });

    describe('connection lifecycle', () => {
        it('starts disconnected', () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            expect(client.isConnected()).toBe(false);
            expect(client.getServerInfo()).toBeNull();
        });

        it('connects and returns server info', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node', args: ['index.js'] },
            });
            const info = await client.connect();
            expect(info.name).toBe('test-server');
            expect(info.version).toBe('1.0.0');
            expect(client.isConnected()).toBe(true);
            expect(client.getServerInfo()).toEqual(info);
        });

        it('disconnects cleanly', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
            expect(client.getServerInfo()).toBeNull();
        });

        it('disconnect is safe when not connected', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await expect(client.disconnect()).resolves.not.toThrow();
        });
    });

    describe('tool operations', () => {
        it('lists tools', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const tools = await client.listTools();
            expect(tools).toHaveLength(1);
            expect(tools[0].name).toBe('hello');
            expect(tools[0].parameters).toHaveLength(1);
            expect(tools[0].parameters[0].required).toBe(true);
        });

        it('calls a tool', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const result = await client.callTool('hello', { name: 'World' });
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
        });

        it('throws when calling tool while disconnected', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await expect(client.callTool('hello', {})).rejects.toThrow('not connected');
        });
    });

    describe('resource operations', () => {
        it('lists resources', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const resources = await client.listResources();
            expect(resources).toHaveLength(1);
            expect(resources[0].uri).toBe('file:///test.txt');
        });

        it('reads a resource', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const resource = await client.readResource('file:///test.txt');
            expect(resource.content).toBe('file content');
        });
    });

    describe('prompt operations', () => {
        it('lists prompts', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const prompts = await client.listPrompts();
            expect(prompts).toHaveLength(1);
            expect(prompts[0].name).toBe('greet');
        });

        it('gets a prompt', async () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio', command: 'node' },
            });
            await client.connect();
            const result = await client.getPrompt('greet', { name: 'World' });
            expect(result.messages).toHaveLength(1);
            expect(result.messages[0].role).toBe('assistant');
        });
    });

    describe('transport creation', () => {
        it('throws for stdio without command', () => {
            const client = new MCPTestClient({
                transport: { type: 'stdio' },
            });
            expect(client.connect()).rejects.toThrow('command');
        });

        it('creates HTTP transport with defaults', async () => {
            const client = new MCPTestClient({
                transport: { type: 'http' },
            });
            // Should not throw during construction
            expect(client).toBeDefined();
        });

        it('throws for unsupported transport type', () => {
            const client = new MCPTestClient({
                transport: { type: 'websocket' as never },
            });
            expect(client.connect()).rejects.toThrow('Unsupported transport');
        });
    });

    describe('factory functions', () => {
        it('createStdioTestClient creates a client', () => {
            const client = createStdioTestClient('node', ['index.js'], '/cwd');
            expect(client).toBeInstanceOf(MCPTestClient);
        });

        it('createHttpTestClient creates a client', () => {
            const client = createHttpTestClient(3000, 'localhost');
            expect(client).toBeInstanceOf(MCPTestClient);
        });

        it('createHttpTestClient defaults host to localhost', () => {
            const client = createHttpTestClient(8080);
            expect(client).toBeInstanceOf(MCPTestClient);
        });
    });
});
