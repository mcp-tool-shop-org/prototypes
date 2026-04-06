/**
 * MCP Test Harness
 *
 * Provides a testing environment for MCP servers during development.
 * Connects to real MCP servers and validates tool responses.
 */

import * as vscode from 'vscode';
import type { OutputChannelLogger } from '../utils/logger';
import type {
    MCPToolDefinition,
    MCPToolResult,
    MCPServerConfig,
} from '../mcp/types';
import { MCPTestClient, createStdioTestClient, createHttpTestClient } from '../mcp/client';

// ============================================================================
// Test Case Types
// ============================================================================

export interface TestCase {
    id: string;
    name: string;
    tool: string;
    input: Record<string, unknown>;
    expectedOutput?: {
        type: 'text' | 'json' | 'ui';
        contains?: string;
        matches?: RegExp;
        validator?: (result: MCPToolResult) => boolean;
    };
    timeout?: number;
}

export interface TestResult {
    testId: string;
    passed: boolean;
    duration: number;
    error?: string;
    output?: MCPToolResult;
}

export interface TestSuiteResult {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    results: TestResult[];
}

// ============================================================================
// Test Runner
// ============================================================================

export class TestRunner {
    private readonly logger: OutputChannelLogger;
    private readonly outputChannel: vscode.OutputChannel;

    constructor(logger: OutputChannelLogger, outputChannel: vscode.OutputChannel) {
        this.logger = logger;
        this.outputChannel = outputChannel;
    }

    async runTests(tests: TestCase[], serverConfig: MCPServerConfig): Promise<TestSuiteResult> {
        const startTime = Date.now();
        const results: TestResult[] = [];

        this.outputChannel.show();
        this.outputChannel.appendLine('═'.repeat(60));
        this.outputChannel.appendLine(`MCP Test Runner - ${serverConfig.name}`);
        this.outputChannel.appendLine('═'.repeat(60));
        this.outputChannel.appendLine('');

        // Create and connect client based on server config
        let client: MCPTestClient;
        try {
            client = this.createClient(serverConfig);
            this.outputChannel.appendLine('Connecting to server...');
            const info = await client.connect();
            this.outputChannel.appendLine(
                `Connected to ${info.name} v${info.version}`
            );
            this.outputChannel.appendLine('');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error('Failed to connect to MCP server', error);
            this.outputChannel.appendLine(`Failed to connect: ${message}`);
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('═'.repeat(60));

            return {
                passed: 0,
                failed: tests.length,
                skipped: 0,
                duration: Date.now() - startTime,
                results: tests.map((t) => ({
                    testId: t.id,
                    passed: false,
                    duration: 0,
                    error: `Connection failed: ${message}`,
                })),
            };
        }

        try {
            for (const test of tests) {
                const result = await this.runTest(test, client);
                results.push(result);

                const status = result.passed ? '✓' : '✗';
                const statusColor = result.passed ? '' : '  ERROR: ';
                this.outputChannel.appendLine(
                    `${status} ${test.name} (${result.duration}ms)${statusColor}${result.error || ''}`
                );
            }
        } finally {
            await client.disconnect();
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('Disconnected from server.');
        }

        const suiteResult: TestSuiteResult = {
            passed: results.filter((r) => r.passed).length,
            failed: results.filter((r) => !r.passed).length,
            skipped: 0,
            duration: Date.now() - startTime,
            results,
        };

        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('─'.repeat(60));
        this.outputChannel.appendLine(
            `Results: ${suiteResult.passed} passed, ${suiteResult.failed} failed (${suiteResult.duration}ms)`
        );
        this.outputChannel.appendLine('═'.repeat(60));

        return suiteResult;
    }

    private async runTest(test: TestCase, client: MCPTestClient): Promise<TestResult> {
        const startTime = Date.now();
        const timeout = test.timeout ?? 30000;

        try {
            const result = await Promise.race([
                client.callTool(test.tool, test.input),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error(`Test timed out after ${timeout}ms`)),
                        timeout
                    )
                ),
            ]);

            let passed = true;
            let error: string | undefined;

            if (test.expectedOutput) {
                const validation = this.validateOutput(result, test.expectedOutput);
                passed = validation.passed;
                error = validation.error;
            }

            return {
                testId: test.id,
                passed,
                duration: Date.now() - startTime,
                error,
                output: result,
            };
        } catch (e) {
            return {
                testId: test.id,
                passed: false,
                duration: Date.now() - startTime,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }

    private createClient(serverConfig: MCPServerConfig): MCPTestClient {
        const transport = serverConfig.transport ?? { type: 'stdio' as const };

        if (transport.type === 'stdio') {
            const command = transport.command;
            if (!command) {
                throw new Error(
                    'stdio transport requires "command" in mcp.json transport config. ' +
                        'Example: { "type": "stdio", "command": "node", "args": ["dist/index.js"] }'
                );
            }
            return createStdioTestClient(command, transport.args);
        } else if (transport.type === 'http') {
            const port = transport.options?.port ?? 3000;
            const host = transport.options?.host ?? 'localhost';
            return createHttpTestClient(port, host);
        }

        throw new Error(`Unsupported transport type: ${transport.type}`);
    }

    private validateOutput(
        result: MCPToolResult,
        expected: TestCase['expectedOutput']
    ): { passed: boolean; error?: string } {
        if (!expected) {
            return { passed: true };
        }

        // Check content type
        if (expected.type) {
            const hasType = result.content.some((c) => c.type === expected.type);
            if (!hasType) {
                return {
                    passed: false,
                    error: `Expected content type "${expected.type}" not found`,
                };
            }
        }

        // Check contains
        if (expected.contains) {
            const textContent = result.content
                .filter((c) => c.type === 'text')
                .map((c) => (c as { type: 'text'; text: string }).text)
                .join('\n');

            if (!textContent.includes(expected.contains)) {
                return {
                    passed: false,
                    error: `Output does not contain "${expected.contains}"`,
                };
            }
        }

        // Check regex match
        if (expected.matches) {
            const textContent = result.content
                .filter((c) => c.type === 'text')
                .map((c) => (c as { type: 'text'; text: string }).text)
                .join('\n');

            if (!expected.matches.test(textContent)) {
                return {
                    passed: false,
                    error: `Output does not match pattern ${expected.matches}`,
                };
            }
        }

        // Custom validator
        if (expected.validator) {
            if (!expected.validator(result)) {
                return {
                    passed: false,
                    error: 'Custom validator returned false',
                };
            }
        }

        return { passed: true };
    }
}

// ============================================================================
// Test Generator
// ============================================================================

export class TestGenerator {
    generateFromTools(tools: MCPToolDefinition[]): TestCase[] {
        const tests: TestCase[] = [];

        for (const tool of tools) {
            // Generate basic invocation test
            tests.push({
                id: `${tool.name}-basic`,
                name: `${tool.name}: Basic invocation`,
                tool: tool.name,
                input: this.generateSampleInput(tool.parameters),
                expectedOutput: {
                    type: 'text',
                },
            });

            // Generate required params test
            const requiredParams = tool.parameters.filter((p) => p.required);
            if (requiredParams.length > 0) {
                tests.push({
                    id: `${tool.name}-required-params`,
                    name: `${tool.name}: Required parameters`,
                    tool: tool.name,
                    input: this.generateRequiredOnlyInput(tool.parameters),
                    expectedOutput: {
                        type: 'text',
                    },
                });
            }

            // Generate from examples
            if (tool.examples) {
                for (let i = 0; i < tool.examples.length; i++) {
                    const example = tool.examples[i];
                    tests.push({
                        id: `${tool.name}-example-${i}`,
                        name: `${tool.name}: Example ${i + 1}${example.description ? ` - ${example.description}` : ''}`,
                        tool: tool.name,
                        input: example.input,
                    });
                }
            }
        }

        return tests;
    }

    private generateSampleInput(params: MCPToolDefinition['parameters']): Record<string, unknown> {
        const input: Record<string, unknown> = {};

        for (const param of params) {
            input[param.name] = this.generateSampleValue(param);
        }

        return input;
    }

    private generateRequiredOnlyInput(
        params: MCPToolDefinition['parameters']
    ): Record<string, unknown> {
        const input: Record<string, unknown> = {};

        for (const param of params) {
            if (param.required) {
                input[param.name] = this.generateSampleValue(param);
            }
        }

        return input;
    }

    private generateSampleValue(param: MCPToolDefinition['parameters'][0]): unknown {
        if (param.default !== undefined) {
            return param.default;
        }

        if (param.enum && param.enum.length > 0) {
            return param.enum[0];
        }

        switch (param.type) {
            case 'string':
                return `sample_${param.name}`;
            case 'number':
                return 42;
            case 'boolean':
                return true;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
}
