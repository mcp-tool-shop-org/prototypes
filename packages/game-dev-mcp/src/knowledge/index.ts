import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getIndex, loadArticles } from './loader.js';
import { searchKnowledge } from './search.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerKnowledgeResources(server: McpServer): void {
  // Resource: Knowledge index
  server.resource(
    'knowledge-index',
    'unreal://knowledge/index',
    {
      description: 'Browse all available UE5 tutorials, API references, and patterns',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(getIndex(), null, 2), mimeType: 'application/json' }],
    }),
  );

  // Resource: Individual articles
  const articles = loadArticles();
  for (const article of articles) {
    const resourceUri = `unreal://knowledge/${article.category}/${article.slug}`;
    server.resource(
      `knowledge-${article.category}-${article.slug}`,
      resourceUri,
      {
        description: article.summary || article.title,
        mimeType: 'text/markdown',
      },
      async (uri) => ({
        contents: [{
          uri: uri.href,
          text: `# ${article.title}\n\n${article.content}`,
          mimeType: 'text/markdown',
        }],
      }),
    );
  }

  // Tool: Knowledge search
  server.tool(
    'ue_knowledge_search',
    'Search the built-in UE5 knowledge library for tutorials, API references, and patterns. Use this when you need to understand how something works in Unreal Engine.',
    {
      query: z.string().describe('Search query (e.g., "spawn actor", "material instance", "save level")'),
      category: z.string().optional().describe('Filter by category (e.g., "actors", "assets", "blueprints", "api-reference")'),
      maxResults: z.number().default(5).describe('Maximum results to return'),
    },
    async ({ query, category, maxResults }) => {
      const results = searchKnowledge(query, category, maxResults);
      if (results.length === 0) {
        return errorResult(ErrorCode.UNKNOWN_ERROR, `No knowledge articles found for: "${query}"`);
      }
      return successResult(results);
    },
  );
}
