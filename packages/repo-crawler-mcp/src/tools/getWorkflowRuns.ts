import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerGetWorkflowRunsTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'get_workflow_runs',
    'Get recent CI/CD workflow run results for a repository. Returns status, conclusion (success/failure), duration, branch, and event trigger for each run. Supports pagination for browsing history.',
    {
      owner: z.string().min(1).describe('Repository owner'),
      repo: z.string().min(1).describe('Repository name'),
      limit: z.number().min(1).max(100).default(10).describe('Max runs per page'),
      page: z.number().min(1).default(1).describe('Page number (1-based)'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

        const result = await adapter.getWorkflowRuns(args.owner, args.repo, args.limit, args.page);

        return successResponse({
          owner: args.owner,
          repo: args.repo,
          totalCount: result.totalCount,
          page: result.page,
          perPage: args.limit,
          hasMore: result.hasMore,
          runs: result.runs,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
