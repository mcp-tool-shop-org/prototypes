import { describe, it, expect } from 'vitest';
import { generateTemplate, getTemplateDescription, sanitizeName } from '../scaffolding/templates';
import type { TemplateConfig } from '../scaffolding/templates';

const baseConfig: TemplateConfig = {
    name: 'test-server',
    description: 'A test MCP server',
    author: 'test',
    transport: 'stdio',
    capabilities: { tools: true, resources: false, prompts: false },
};

describe('sanitizeName', () => {
    it('accepts valid lowercase names', () => {
        expect(sanitizeName('hello')).toBe('hello');
        expect(sanitizeName('my-server')).toBe('my-server');
        expect(sanitizeName('a123')).toBe('a123');
    });

    it('rejects names starting with a number', () => {
        expect(() => sanitizeName('1bad')).toThrow('Invalid server name');
    });

    it('rejects names with uppercase letters', () => {
        expect(() => sanitizeName('MyServer')).toThrow('Invalid server name');
    });

    it('rejects names with spaces', () => {
        expect(() => sanitizeName('my server')).toThrow('Invalid server name');
    });

    it('rejects empty string', () => {
        expect(() => sanitizeName('')).toThrow('Invalid server name');
    });

    it('rejects names with special characters', () => {
        expect(() => sanitizeName('my_server')).toThrow('Invalid server name');
        expect(() => sanitizeName('my.server')).toThrow('Invalid server name');
    });
});

describe('generateTemplate', () => {
    describe('basic template', () => {
        it('generates expected file list', () => {
            const files = generateTemplate('basic', baseConfig);
            const paths = files.map((f) => f.path);
            expect(paths).toContain('mcp.json');
            expect(paths).toContain('mcp-tools.json');
            expect(paths).toContain('src/index.ts');
            expect(paths).toContain('package.json');
            expect(paths).toContain('tsconfig.json');
            expect(files).toHaveLength(5);
        });

        it('generates valid mcp.json', () => {
            const files = generateTemplate('basic', baseConfig);
            const mcpJson = files.find((f) => f.path === 'mcp.json')!;
            const parsed = JSON.parse(mcpJson.content);
            expect(parsed.name).toBe('test-server');
            expect(parsed.version).toBe('0.1.0');
            expect(parsed.capabilities.tools).toBe(true);
        });

        it('generates valid package.json', () => {
            const files = generateTemplate('basic', baseConfig);
            const pkgJson = files.find((f) => f.path === 'package.json')!;
            const parsed = JSON.parse(pkgJson.content);
            expect(parsed.name).toBe('test-server');
            expect(parsed.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
        });

        it('uses sanitized name in src/index.ts', () => {
            const files = generateTemplate('basic', baseConfig);
            const indexTs = files.find((f) => f.path === 'src/index.ts')!;
            expect(indexTs.content).toContain("name: 'test-server'");
            expect(indexTs.content).toContain('test-server MCP server running on stdio');
        });
    });

    describe('with-ui template', () => {
        it('generates tools with UI config', () => {
            const files = generateTemplate('with-ui', baseConfig);
            const toolsJson = files.find((f) => f.path === 'mcp-tools.json')!;
            const parsed = JSON.parse(toolsJson.content);
            const toolNames = parsed.tools.map((t: { name: string }) => t.name);
            expect(toolNames).toContain('searchData');
            expect(toolNames).toContain('getStats');
        });
    });

    describe('full template', () => {
        const fullConfig: TemplateConfig = {
            ...baseConfig,
            capabilities: { tools: true, resources: true, prompts: true },
        };

        it('includes resources and prompts files', () => {
            const files = generateTemplate('full', fullConfig);
            const paths = files.map((f) => f.path);
            expect(paths).toContain('src/resources.ts');
            expect(paths).toContain('src/prompts.ts');
        });
    });
});

describe('getTemplateDescription', () => {
    it('returns descriptions for all template types', () => {
        expect(getTemplateDescription('basic')).toBeTruthy();
        expect(getTemplateDescription('with-ui')).toBeTruthy();
        expect(getTemplateDescription('full')).toBeTruthy();
    });
});
