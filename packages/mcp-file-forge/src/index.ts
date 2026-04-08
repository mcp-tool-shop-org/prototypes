#!/usr/bin/env node

/**
 * MCP File Forge - Entry Point
 *
 * A Model Context Protocol server for secure file operations
 * and project scaffolding.
 */

import { startServer } from './server.js';

// Re-export for Smithery scanning
export { createSandboxServer } from './server.js';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[mcp-file-forge] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[mcp-file-forge] Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('[mcp-file-forge] Fatal error:', error);
  process.exit(1);
});
