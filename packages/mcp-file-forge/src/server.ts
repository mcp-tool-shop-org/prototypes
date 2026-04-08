/**
 * MCP File Forge - Server Implementation
 *
 * Dual-mode MCP server: STDIO (local) or HTTP (deployed).
 * Set PORT env var to enable HTTP mode for remote deployment.
 */

import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerReadTools } from './tools/read.js';
import { registerWriteTools } from './tools/write.js';
import { registerSearchTools } from './tools/search.js';
import { registerMetadataTools } from './tools/metadata.js';
import { registerScaffoldTools } from './tools/scaffold.js';
import { loadConfig } from './config/index.js';
import { getSandbox, enableReadOnlyMode } from './security/index.js';
import { VERSION, NAME } from './version.js';

// Server metadata
const SERVER_NAME = NAME;
const SERVER_VERSION = VERSION;

/**
 * Create and configure the MCP server instance.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tools
  registerReadTools(server);
  registerWriteTools(server);
  registerSearchTools(server);
  registerMetadataTools(server);
  registerScaffoldTools(server);

  return server;
}

/**
 * Create STDIO transport for local usage.
 */
export function createStdioTransport(): StdioServerTransport {
  return new StdioServerTransport();
}

/**
 * Start the MCP server in STDIO mode (local).
 */
async function startStdioServer(server: McpServer): Promise<void> {
  const transport = createStdioTransport();
  console.error(`[${SERVER_NAME}] Transport: stdio`);
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] Server connected and ready (stdio)`);
}

/**
 * Start the MCP server in HTTP mode (deployed).
 *
 * Uses StreamableHTTPServerTransport with stateful sessions.
 * Each client gets its own transport + server instance per session.
 */
async function startHttpServer(_server: McpServer, port: number): Promise<void> {
  // Dynamic import to keep express optional for stdio-only usage
  const { default: express } = await import('express');

  const app = express();
  app.use(express.json());

  // Health check for Fly.io / load balancers
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION });
  });

  // Session management: map sessionId → transport
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  // Handle MCP protocol requests (POST /mcp)
  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions.has(sessionId)) {
      // Existing session
      transport = sessions.get(sessionId)!;
    } else if (!sessionId) {
      // New session — create transport + connect a fresh server
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
          console.error(`[${SERVER_NAME}] Session created: ${id}`);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) {
          sessions.delete(sid);
          console.error(`[${SERVER_NAME}] Session closed: ${sid}`);
        }
      };

      // Each session gets its own server instance with all tools
      const sessionServer = createServer();
      await sessionServer.connect(transport);
    } else {
      // Invalid session ID
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  // Handle SSE streams (GET /mcp)
  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // Handle session termination (DELETE /mcp)
  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  app.listen(port, '0.0.0.0', () => {
    console.error(`[${SERVER_NAME}] Transport: HTTP (Streamable)`);
    console.error(`[${SERVER_NAME}] Listening on http://0.0.0.0:${port}/mcp`);
    console.error(`[${SERVER_NAME}] Health check: http://0.0.0.0:${port}/health`);
  });
}

/**
 * Create a sandbox server instance for Smithery scanning.
 *
 * This allows Smithery to discover tools/resources without
 * real configuration or credentials. Used during `smithery mcp publish`.
 */
export function createSandboxServer(): McpServer {
  return createServer();
}

/**
 * Start the MCP server.
 *
 * Mode selection:
 * - PORT env var set → HTTP mode (for Fly.io / remote deployment)
 * - No PORT → STDIO mode (for local Claude Desktop / CLI usage)
 */
export async function startServer(): Promise<void> {
  // Load configuration
  const config = await loadConfig();

  // Initialize sandbox with config
  const sandbox = getSandbox(config.sandbox);
  await sandbox.initialize();

  // Enable read-only mode if configured
  if (config.read_only) {
    enableReadOnlyMode();
    console.error(`[${SERVER_NAME}] Running in read-only mode`);
  }

  // Create server
  const server = createServer();

  // Log to stderr (stdout is reserved for MCP protocol in stdio mode)
  console.error(`[${SERVER_NAME}] Starting server v${SERVER_VERSION}...`);
  console.error(`[${SERVER_NAME}] Allowed paths: ${sandbox.getAllowedPaths().join(', ')}`);

  // Select transport based on PORT env var
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

  if (port) {
    await startHttpServer(server, port);
  } else {
    await startStdioServer(server);
  }
}
