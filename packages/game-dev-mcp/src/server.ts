import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { createRCClient } from './client/rc-client.js';
import { registerAllTools } from './tools/index.js';
import { registerKnowledgeResources } from './knowledge/index.js';
import { registerProjectTools } from './project/index.js';
import { log } from './utils/logger.js';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

const SERVER_NAME = 'game-dev-mcp';
const SERVER_VERSION: string = pkg.version;

export async function startServer(): Promise<void> {
  const config = loadConfig();
  const rc = createRCClient(config);

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register UE5 control tools
  registerAllTools(server, rc);

  // Register knowledge library resources + search tool
  registerKnowledgeResources(server);

  // Register project knowledge tools
  registerProjectTools(server);

  const transport = new StdioServerTransport();

  log.info(`Starting server v${SERVER_VERSION}...`);
  log.info(`UE5 endpoint: ${config.host}:${config.port}`);

  await server.connect(transport);

  log.info('Server connected and ready');
}
