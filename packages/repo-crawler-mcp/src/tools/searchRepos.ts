import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerSearchReposTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'search_repos',
    'Search GitHub repositories by query, language, stars, topic, or any combination. Returns structured metadata for each match with pagination. Great for discovery and research.',
    {
      query: z.string().min(1).describe('Search query (same syntax as GitHub search bar)'),
      language: z.string().optional().describe('Filter by primary language (e.g. "typescript", "python")'),
      topic: z.string().optional().describe('Filter by topic (e.g. "mcp", "machine-learning")'),
      min_stars: z.number().min(0).optional().describe('Minimum star count'),
      max_stars: z.number().min(0).optional().describe('Maximum star count'),
      sort: z.enum(['stars', 'forks', 'updated', 'best-match']).default('best-match').describe('Sort order'),
      order: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),
      limit: z.number().min(1).max(100).default(30).describe('Results per page'),
      page: z.number().min(1).default(1).describe('Page number (1-based)'),
    },
    async (args) => {
      try {
        const results = await adapter.searchRepos({
          query: args.query,
          language: args.language,
          topic: args.topic,
          minStars: args.min_stars,
          maxStars: args.max_stars,
          sort: args.sort === 'best-match' ? undefined : args.sort,
          order: args.order,
          limit: args.limit,
          page: args.page,
        });

        return successResponse({
          query: args.query,
          totalResults: results.totalCount,
          page: results.page,
          perPage: results.perPage,
          hasMore: results.hasMore,
          returned: results.items.length,
          items: results.items,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
