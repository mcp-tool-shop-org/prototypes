import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerClearCacheTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'clear_cache',
    'Clear the in-memory response cache and return cache statistics. Useful when you need fresh data after known repo changes.',
    {},
    async () => {
      try {
        const statsBefore = adapter.getCacheStats();
        const cleared = adapter.clearCache();
        return successResponse({
          cleared,
          statsBefore,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
