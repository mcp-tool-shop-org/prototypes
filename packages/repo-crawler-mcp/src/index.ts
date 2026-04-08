#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const arg = process.argv[2];

if (arg === '--version' || arg === '-V') {
  console.log(`repo-crawler-mcp ${pkg.version}`);
  process.exit(0);
}

if (arg === '--help' || arg === '-h') {
  console.log(`repo-crawler-mcp v${pkg.version}

MCP server that crawls GitHub repos and extracts structured data for AI agents.

USAGE:
  repo-crawler-mcp              Start the MCP server (stdio transport)
  repo-crawler-mcp --version    Print version and exit
  repo-crawler-mcp --help       Show this help and exit

ENVIRONMENT:
  GITHUB_TOKEN    GitHub personal access token (required)

DOCS: ${pkg.homepage || 'https://github.com/mcp-tool-shop-org/repo-crawler-mcp'}`);
  process.exit(0);
}

import { startServer } from './server.js';

process.on('uncaughtException', (error) => {
  console.error('[repo-crawler-mcp] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[repo-crawler-mcp] Unhandled rejection:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('[repo-crawler-mcp] Fatal error:', error);
  process.exit(1);
});
