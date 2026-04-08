import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GitHubAdapter } from './adapters/github.js';
import { registerCrawlRepoTool } from './tools/crawlRepo.js';
import { registerCrawlOrgTool } from './tools/crawlOrg.js';
import { registerRepoSummaryTool } from './tools/repoSummary.js';
import { registerCompareReposTool } from './tools/compareRepos.js';
import { registerExportDataTool } from './tools/exportData.js';
import { registerSearchReposTool } from './tools/searchRepos.js';
import { registerGetFileContentTool } from './tools/getFileContent.js';
import { registerGetCommitDiffTool } from './tools/getCommitDiff.js';
import { registerGetWorkflowRunsTool } from './tools/getWorkflowRuns.js';
import { registerClearCacheTool } from './tools/clearCache.js';
import { log } from './utils/logger.js';

const SERVER_NAME = 'repo-crawler-mcp';
const SERVER_VERSION = (() => {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    return pkg.version as string;
  } catch {
    return '1.0.0';
  }
})();

export function createServer(): McpServer {
  const adapter = new GitHubAdapter();

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  registerCrawlRepoTool(server, adapter);
  registerCrawlOrgTool(server, adapter);
  registerRepoSummaryTool(server, adapter);
  registerCompareReposTool(server, adapter);
  registerExportDataTool(server);
  registerSearchReposTool(server, adapter);
  registerGetFileContentTool(server, adapter);
  registerGetCommitDiffTool(server, adapter);
  registerGetWorkflowRunsTool(server, adapter);
  registerClearCacheTool(server, adapter);

  return server;
}

export async function startServer(): Promise<void> {
  const hasToken = !!process.env.GITHUB_TOKEN;
  log.info(`${SERVER_NAME} v${SERVER_VERSION}`);
  log.info(`Auth: ${hasToken ? 'Token provided (5,000 req/hr)' : 'No token (60 req/hr — set GITHUB_TOKEN for higher limits)'}`);

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info('Server connected and ready');
}
