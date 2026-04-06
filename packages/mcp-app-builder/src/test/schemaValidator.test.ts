import { describe, it, expect } from 'vitest';
import { SchemaValidator } from '../validation/schemaValidator';
import type { OutputChannelLogger } from '../utils/logger';

// Create validator with a no-op logger
const mockLogger: OutputChannelLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    show: () => {},
} as unknown as OutputChannelLogger;

const validator = new SchemaValidator(mockLogger);

describe('SchemaValidator', () => {
    describe('validateConfig', () => {
        it('accepts valid config', () => {
            const config = JSON.stringify({
                name: 'test-server',
                version: '0.1.0',
                description: 'A test server',
                capabilities: { tools: true },
                transport: { type: 'stdio' },
            });
            const result = validator.validateConfig(config);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects missing name', () => {
            const config = JSON.stringify({
                version: '0.1.0',
            });
            const result = validator.validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.path.includes('name'))).toBe(true);
        });

        it('rejects missing version', () => {
            const config = JSON.stringify({
                name: 'test',
            });
            const result = validator.validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.path.includes('version'))).toBe(true);
        });

        it('rejects invalid JSON', () => {
            const result = validator.validateConfig('{bad json}');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateTools', () => {
        it('accepts valid tools file', () => {
            const tools = JSON.stringify({
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
                    },
                ],
            });
            const result = validator.validateTools(tools);
            expect(result.valid).toBe(true);
        });

        it('rejects tool with invalid name pattern', () => {
            const tools = JSON.stringify({
                tools: [
                    {
                        name: 'Bad-Name',
                        description: 'This tool name has uppercase letters and is invalid',
                        parameters: [],
                    },
                ],
            });
            const result = validator.validateTools(tools);
            expect(result.valid).toBe(false);
        });

        it('rejects tool with short description', () => {
            const tools = JSON.stringify({
                tools: [
                    {
                        name: 'test',
                        description: 'Short',
                        parameters: [],
                    },
                ],
            });
            const result = validator.validateTools(tools);
            expect(result.valid).toBe(false);
        });

        it('detects duplicate tool names', () => {
            const tools = JSON.stringify({
                tools: [
                    {
                        name: 'hello',
                        description: 'A simple hello world tool that greets the user',
                        parameters: [],
                    },
                    {
                        name: 'hello',
                        description: 'A duplicate hello world tool that greets the user',
                        parameters: [],
                    },
                ],
            });
            const result = validator.validateTools(tools);
            // Duplicate names should produce an error
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
        });

        it('warns about required param with default', () => {
            const tools = JSON.stringify({
                tools: [
                    {
                        name: 'test',
                        description: 'A tool to test required parameters with defaults',
                        parameters: [
                            {
                                name: 'query',
                                type: 'string',
                                description: 'The search query',
                                required: true,
                                default: 'hello',
                            },
                        ],
                    },
                ],
            });
            const result = validator.validateTools(tools);
            expect(result.warnings.some((w) => w.message.includes('default'))).toBe(true);
        });

        it('rejects invalid JSON', () => {
            const result = validator.validateTools('not json');
            expect(result.valid).toBe(false);
        });
    });
});
