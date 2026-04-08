import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerGetCommitDiffTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'get_commit_diff',
    'Get the diff/patch for a specific commit. Returns changed files with additions, deletions, status, and optional patch content. Useful for code review and understanding what a commit actually changed.',
    {
      owner: z.string().min(1).describe('Repository owner'),
      repo: z.string().min(1).describe('Repository name'),
      ref: z.string().min(1).describe('Commit SHA, branch name, or tag'),
      include_patch: z.boolean().default(true).describe('Include the actual diff/patch text per file (default: true)'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

        const result = await adapter.getCommitDiff(args.owner, args.repo, args.ref, args.include_patch);

        return successResponse(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
