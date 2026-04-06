#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-V')) {
  console.log(`game-dev-mcp ${pkg.version}`);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`game-dev-mcp ${pkg.version} — MCP server for game engine control

Usage:
  game-dev-mcp              Start the MCP server (stdio transport)
  game-dev-mcp --version    Print version and exit
  game-dev-mcp --diagnose   Run environment diagnostics
  game-dev-mcp --help       Show this help

Environment variables:
  GAMEDEV_MCP_HOST       UE5 Remote Control API host (default: 127.0.0.1)
  GAMEDEV_MCP_PORT       UE5 Remote Control API port (default: 30010)
  GAMEDEV_MCP_TIMEOUT    Request timeout in ms (default: 10000)
  GAMEDEV_MCP_LOG_LEVEL  Log level: error|warn|info|debug (default: info)`);
  process.exit(0);
}

if (args.includes('--diagnose')) {
  runDiagnose().then((ok) => process.exit(ok ? 0 : 1));
} else {
  const { startServer } = await import('./server.js');

  process.on('uncaughtException', (error) => {
    console.error('[game-dev-mcp] Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[game-dev-mcp] Unhandled rejection:', reason);
    process.exit(1);
  });

  startServer().catch((error) => {
    console.error('[game-dev-mcp] Fatal error:', error);
    process.exit(1);
  });
}

interface DiagnoseCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

async function runDiagnose(): Promise<boolean> {
  const checks: DiagnoseCheck[] = [];
  const json = args.includes('--json');

  // 1. Runtime
  checks.push({
    name: 'node_version',
    status: parseInt(process.versions.node) >= 18 ? 'ok' : 'fail',
    detail: `Node.js ${process.version}`,
  });

  // 2. Package version
  checks.push({
    name: 'package_version',
    status: 'ok',
    detail: `game-dev-mcp ${pkg.version}`,
  });

  // 3. Config
  const { loadConfig } = await import('./config.js');
  const config = loadConfig();
  checks.push({
    name: 'config',
    status: 'ok',
    detail: `${config.host}:${config.port} (timeout ${config.timeout}ms, log ${config.logLevel})`,
  });

  // 4. UE5 Remote Control API ping
  const { createRCClient } = await import('./client/rc-client.js');
  const rc = createRCClient(config);
  try {
    const reachable = await rc.ping();
    if (reachable) {
      const info = await rc.getInfo();
      checks.push({
        name: 'ue5_connection',
        status: 'ok',
        detail: `Connected — ${JSON.stringify(info)}`,
      });
    } else {
      checks.push({
        name: 'ue5_connection',
        status: 'warn',
        detail: `Not reachable at ${config.host}:${config.port} — is UE5 editor running with Remote Control API enabled?`,
      });
    }
  } catch {
    checks.push({
      name: 'ue5_connection',
      status: 'warn',
      detail: `Not reachable at ${config.host}:${config.port} — is UE5 editor running with Remote Control API enabled?`,
    });
  }

  // 5. Knowledge library
  const knowledgeDir = resolve(__dirname, '..', 'knowledge');
  try {
    const { readdirSync } = await import('node:fs');
    const dirs = readdirSync(knowledgeDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    const total = dirs.reduce((sum, d) => {
      const files = readdirSync(resolve(knowledgeDir, d.name)).filter((f) => f.endsWith('.md'));
      return sum + files.length;
    }, 0);
    checks.push({
      name: 'knowledge_library',
      status: total > 0 ? 'ok' : 'warn',
      detail: `${total} articles in ${dirs.length} categories`,
    });
  } catch {
    checks.push({
      name: 'knowledge_library',
      status: 'warn',
      detail: 'Knowledge directory not found',
    });
  }

  if (json) {
    const healthy = checks.every((c) => c.status !== 'fail');
    console.log(JSON.stringify({ healthy, checks }, null, 2));
    return healthy;
  }

  // Human-readable output
  let healthy = true;
  for (const check of checks) {
    const icon = check.status === 'ok' ? 'PASS' : check.status === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${icon}] ${check.name}: ${check.detail}`);
    if (check.status === 'fail') healthy = false;
  }
  return healthy;
}
