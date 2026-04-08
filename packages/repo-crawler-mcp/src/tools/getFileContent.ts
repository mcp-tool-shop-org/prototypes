import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerGetFileContentTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'get_file_content',
    'Fetch the content of a specific file from a GitHub repository. Returns the decoded text content, size, and download URL. Useful for reading READMEs, configs, source files, etc.',
    {
      owner: z.string().min(1).describe('Repository owner'),
      repo: z.string().min(1).describe('Repository name'),
      path: z.string().min(1).describe('File path within the repo (e.g. "src/index.ts", "package.json")'),
      ref: z.string().optional().describe('Branch, tag, or commit SHA (default: repo default branch)'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

        const result = await adapter.getFileContent(args.owner, args.repo, args.path, args.ref);

        return successResponse(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
