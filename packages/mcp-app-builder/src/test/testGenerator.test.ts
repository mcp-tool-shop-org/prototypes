import { describe, it, expect } from 'vitest';
import { TestGenerator } from '../testing/testHarness';
import type { MCPToolDefinition } from '../mcp/types';

const generator = new TestGenerator();

const sampleTool: MCPToolDefinition = {
    name: 'search',
    description: 'Search for items',
    parameters: [
        { name: 'query', type: 'string', description: 'Search query', required: true },
        { name: 'limit', type: 'number', description: 'Max results', default: 10 },
    ],
    examples: [
        { input: { query: 'test' }, output: 'results', description: 'Basic search' },
    ],
};

const simpleTool: MCPToolDefinition = {
    name: 'ping',
    description: 'Ping the server',
    parameters: [],
};

describe('TestGenerator', () => {
    describe('generateFromTools', () => {
        it('generates basic invocation test for each tool', () => {
            const tests = generator.generateFromTools([sampleTool, simpleTool]);
            const basicTests = tests.filter((t) => t.id.endsWith('-basic'));
            expect(basicTests).toHaveLength(2);
            expect(basicTests[0].tool).toBe('search');
            expect(basicTests[1].tool).toBe('ping');
        });

        it('generates required params test when tool has required params', () => {
            const tests = generator.generateFromTools([sampleTool]);
            const requiredTest = tests.find((t) => t.id === 'search-required-params');
            expect(requiredTest).toBeDefined();
            expect(requiredTest!.input).toHaveProperty('query');
            expect(requiredTest!.input).not.toHaveProperty('limit');
        });

        it('does not generate required params test when no required params', () => {
            const tests = generator.generateFromTools([simpleTool]);
            const requiredTest = tests.find((t) => t.id === 'ping-required-params');
            expect(requiredTest).toBeUndefined();
        });

        it('generates example-based tests when tool has examples', () => {
            const tests = generator.generateFromTools([sampleTool]);
            const exampleTest = tests.find((t) => t.id === 'search-example-0');
            expect(exampleTest).toBeDefined();
            expect(exampleTest!.input).toEqual({ query: 'test' });
            expect(exampleTest!.name).toContain('Basic search');
        });

        it('returns empty array for empty tools list', () => {
            const tests = generator.generateFromTools([]);
            expect(tests).toEqual([]);
        });
    });

    describe('sample input generation', () => {
        it('uses default values when present', () => {
            const tests = generator.generateFromTools([sampleTool]);
            const basicTest = tests.find((t) => t.id === 'search-basic')!;
            expect(basicTest.input.limit).toBe(10);
        });

        it('generates sample values by type', () => {
            const tool: MCPToolDefinition = {
                name: 'test',
                description: 'Test all types',
                parameters: [
                    { name: 'str', type: 'string', description: 'A string' },
                    { name: 'num', type: 'number', description: 'A number' },
                    { name: 'bool', type: 'boolean', description: 'A boolean' },
                    { name: 'arr', type: 'array', description: 'An array' },
                    { name: 'obj', type: 'object', description: 'An object' },
                ],
            };
            const tests = generator.generateFromTools([tool]);
            const input = tests[0].input;
            expect(input.str).toBe('sample_str');
            expect(input.num).toBe(42);
            expect(input.bool).toBe(true);
            expect(input.arr).toEqual([]);
            expect(input.obj).toEqual({});
        });

        it('uses first enum value when present', () => {
            const tool: MCPToolDefinition = {
                name: 'test',
                description: 'Test enum',
                parameters: [
                    { name: 'color', type: 'string', description: 'Color', enum: ['red', 'blue'] },
                ],
            };
            const tests = generator.generateFromTools([tool]);
            expect(tests[0].input.color).toBe('red');
        });
    });
});
