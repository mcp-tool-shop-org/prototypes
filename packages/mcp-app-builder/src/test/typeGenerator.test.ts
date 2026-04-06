import { describe, it, expect } from 'vitest';
import { TypeGenerator } from '../codegen/typeGenerator';
import type { OutputChannelLogger } from '../utils/logger';

const mockLogger: OutputChannelLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    show: () => {},
} as unknown as OutputChannelLogger;

const generator = new TypeGenerator(mockLogger);

const validToolsJson = JSON.stringify({
    tools: [
        {
            name: 'search',
            description: 'Search for items',
            parameters: [
                { name: 'query', type: 'string', description: 'Search query', required: true },
                { name: 'limit', type: 'number', description: 'Max results' },
            ],
        },
    ],
});

describe('TypeGenerator', () => {
    describe('parseToolsFile', () => {
        it('parses valid tools file', () => {
            const result = generator.parseToolsFile(validToolsJson);
            expect(result.tools).toHaveLength(1);
            expect(result.tools[0].name).toBe('search');
        });

        it('rejects missing tools array', () => {
            expect(() => generator.parseToolsFile('{}')).toThrow();
        });

        it('rejects invalid JSON', () => {
            expect(() => generator.parseToolsFile('bad')).toThrow();
        });
    });

    describe('generate', () => {
        it('generates TypeScript content with tool types', () => {
            const toolsFile = generator.parseToolsFile(validToolsJson);
            const result = generator.generate(toolsFile);
            expect(result.toolCount).toBe(1);
            expect(result.content).toContain('SearchInput');
            expect(result.content).toContain('query');
            expect(result.content).toContain('limit');
        });

        it('marks required params correctly', () => {
            const toolsFile = generator.parseToolsFile(validToolsJson);
            const result = generator.generate(toolsFile);
            // Required param should not have ?
            expect(result.content).toMatch(/query:\s*string/);
            // Optional param should have ?
            expect(result.content).toMatch(/limit\?:\s*number/);
        });

        it('handles enum parameters', () => {
            const json = JSON.stringify({
                tools: [
                    {
                        name: 'getColor',
                        description: 'Get a color',
                        parameters: [
                            {
                                name: 'color',
                                type: 'string',
                                description: 'The color',
                                enum: ['red', 'green', 'blue'],
                            },
                        ],
                    },
                ],
            });
            const toolsFile = generator.parseToolsFile(json);
            const result = generator.generate(toolsFile);
            expect(result.content).toContain("'red'");
            expect(result.content).toContain("'green'");
            expect(result.content).toContain("'blue'");
        });

        it('generates union type for tool names', () => {
            const json = JSON.stringify({
                tools: [
                    { name: 'toolA', description: 'Tool A', parameters: [] },
                    { name: 'toolB', description: 'Tool B', parameters: [] },
                ],
            });
            const toolsFile = generator.parseToolsFile(json);
            const result = generator.generate(toolsFile);
            expect(result.content).toContain("'toolA'");
            expect(result.content).toContain("'toolB'");
            expect(result.toolCount).toBe(2);
        });

        it('generates handler interface', () => {
            const toolsFile = generator.parseToolsFile(validToolsJson);
            const result = generator.generate(toolsFile);
            expect(result.content).toContain('ToolHandlers');
            expect(result.content).toContain('createToolCaller');
        });
    });
});
