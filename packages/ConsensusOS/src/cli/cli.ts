/**
 * ConsensusOS CLI Entrypoint
 *
 * Command dispatcher that routes CLI commands to the appropriate modules.
 * All commands go through the core loader — the CLI never touches
 * plugins directly.
 *
 * Commands:
 *   consensusos doctor    — run health checks
 *   consensusos verify    — verify release artifacts
 *   consensusos config    — config validation/diff/migration
 *   consensusos status    — system status overview
 *   consensusos plugins   — list/inspect plugins
 *   consensusos adapters  — list/query chain adapters
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CoreLoader } from "../core/loader.js";
import { createHealthSentinel, type HealthSentinel } from "../modules/health/health-sentinel.js";
import { createReleaseVerifier, type ReleaseVerifier } from "../modules/verifier/release-verifier.js";
import { createConfigGuardian, type ConfigGuardian } from "../modules/config/config-guardian.js";
import { createXrplAdapter, type XrplAdapter } from "../adapters/xrpl/xrpl-adapter.js";

// ─── Types ──────────────────────────────────────────────────────────

export interface CliContext {
  loader: CoreLoader;
  args: string[];
  stdout: (msg: string) => void;
  stderr: (msg: string) => void;
}

export interface CommandResult {
  exitCode: number;
  output?: string;
}

export type CommandHandler = (ctx: CliContext, subArgs: string[]) => Promise<CommandResult>;

// ─── Command Registry ───────────────────────────────────────────────

const commands = new Map<string, CommandHandler>();

/** Register a CLI command */
export function registerCommand(name: string, handler: CommandHandler): void {
  commands.set(name, handler);
}

// ─── Built-in Commands ──────────────────────────────────────────────

registerCommand("doctor", async (ctx) => {
  ctx.stdout("ConsensusOS Doctor — Health Check\n");

  const loader = ctx.loader;
  const healthPlugin = findPlugin<HealthSentinel>(loader, "health-sentinel");

  if (!healthPlugin) {
    ctx.stdout("  No Health Sentinel plugin loaded.\n");
    return { exitCode: 0, output: "No health sentinel" };
  }

  const report = await healthPlugin.runCheck();
  ctx.stdout(`  Nodes checked: ${report.nodes.length}\n`);
  ctx.stdout(`  All healthy:   ${report.allHealthy ? "YES" : "NO"}\n`);
  ctx.stdout(`  Avg latency:   ${report.avgLatencyMs}ms\n`);
  ctx.stdout(`  Max latency:   ${report.maxLatencyMs}ms\n`);

  for (const node of report.nodes) {
    const status = node.reachable ? "UP" : "DOWN";
    ctx.stdout(`  [${status}] ${node.nodeId} (${node.url}) — ${node.latencyMs}ms\n`);
    if (node.error) ctx.stdout(`        Error: ${node.error}\n`);
  }

  return { exitCode: report.allHealthy ? 0 : 1 };
});

registerCommand("verify", async (ctx) => {
  ctx.stdout("ConsensusOS Verify — Release Artifact Verification\n");

  const verifier = findPlugin<ReleaseVerifier>(ctx.loader, "release-verifier");

  if (!verifier) {
    ctx.stdout("  No Release Verifier plugin loaded.\n");
    return { exitCode: 0, output: "No release verifier" };
  }

  const report = await verifier.verifyAll();
  ctx.stdout(`  Artifacts checked: ${report.results.length}\n`);
  ctx.stdout(`  All passed:        ${report.allPassed ? "YES" : "NO"}\n`);

  for (const r of report.results) {
    const status = r.hashMatch ? "PASS" : "FAIL";
    ctx.stdout(`  [${status}] ${r.artifact} (${r.algorithm})\n`);
    if (!r.hashMatch) {
      ctx.stdout(`        Expected: ${r.expectedHash}\n`);
      ctx.stdout(`        Actual:   ${r.actualHash}\n`);
    }
    if (r.error) ctx.stdout(`        Error: ${r.error}\n`);
  }

  return { exitCode: report.allPassed ? 0 : 1 };
});

registerCommand("config", async (ctx, subArgs) => {
  const subcommand = subArgs[0] ?? "validate";
  ctx.stdout(`ConsensusOS Config — ${subcommand}\n`);

  const guardian = findPlugin<ConfigGuardian>(ctx.loader, "config-guardian");

  if (!guardian) {
    ctx.stdout("  No Config Guardian plugin loaded.\n");
    return { exitCode: 0, output: "No config guardian" };
  }

  switch (subcommand) {
    case "validate": {
      // Read config from stdin or use empty
      const result = guardian.validate({});
      ctx.stdout(`  Valid: ${result.valid ? "YES" : "NO"}\n`);
      for (const err of result.errors) {
        ctx.stdout(`  ERROR: [${err.key}] ${err.message}\n`);
      }
      return { exitCode: result.valid ? 0 : 1 };
    }
    case "version": {
      ctx.stdout(`  Config version: ${guardian.getConfigVersion()}\n`);
      return { exitCode: 0 };
    }
    case "history": {
      const history = guardian.getHistory();
      ctx.stdout(`  History entries: ${history.length}\n`);
      for (const entry of history) {
        ctx.stdout(`  [${entry.version}] ${entry.timestamp}\n`);
      }
      return { exitCode: 0 };
    }
    default:
      ctx.stderr(`  Unknown config subcommand: ${subcommand}\n`);
      return { exitCode: 1 };
  }
});

registerCommand("status", async (ctx) => {
  ctx.stdout("ConsensusOS Status\n");

  const loader = ctx.loader;
  const plugins = loader.pluginIds();

  ctx.stdout(`  Plugins loaded: ${plugins.length}\n`);
  for (const id of plugins) {
    const state = loader.getState(id);
    ctx.stdout(`  [${state}] ${id}\n`);
  }

  ctx.stdout(`  Event history:  ${loader.events.history().length} events\n`);
  ctx.stdout(`  Invariants:     ${loader.invariants.registered().length} registered\n`);

  return { exitCode: 0 };
});

registerCommand("plugins", async (ctx, subArgs) => {
  const subcommand = subArgs[0] ?? "list";
  ctx.stdout(`ConsensusOS Plugins — ${subcommand}\n`);

  if (subcommand === "list") {
    const plugins = ctx.loader.pluginIds();
    if (plugins.length === 0) {
      ctx.stdout("  No plugins loaded.\n");
    }
    for (const id of plugins) {
      ctx.stdout(`  • ${id} [${ctx.loader.getState(id)}]\n`);
    }
    return { exitCode: 0 };
  }

  ctx.stderr(`  Unknown plugins subcommand: ${subcommand}\n`);
  return { exitCode: 1 };
});

registerCommand("adapters", async (ctx, subArgs) => {
  const subcommand = subArgs[0] ?? "list";
  ctx.stdout(`ConsensusOS Adapters — ${subcommand}\n`);

  const xrpl = findPlugin<XrplAdapter>(ctx.loader, "xrpl-adapter");

  if (subcommand === "list") {
    const adapters: string[] = [];
    if (xrpl) adapters.push("xrpl-adapter");

    if (adapters.length === 0) {
      ctx.stdout("  No adapters loaded.\n");
    }
    for (const id of adapters) {
      ctx.stdout(`  • ${id} [${ctx.loader.getState(id)}]\n`);
    }
    return { exitCode: 0 };
  }

  if (subcommand === "info" && xrpl) {
    const cached = xrpl.getCachedInfo();
    for (const [url, info] of cached) {
      ctx.stdout(`  [${info.connected ? "UP" : "DOWN"}] ${url}\n`);
      if (info.serverState) ctx.stdout(`    State:   ${info.serverState}\n`);
      if (info.buildVersion) ctx.stdout(`    Version: ${info.buildVersion}\n`);
      if (info.validatedLedger) ctx.stdout(`    Ledger:  ${info.validatedLedger.seq}\n`);
      if (info.peers !== undefined) ctx.stdout(`    Peers:   ${info.peers}\n`);
    }
    return { exitCode: 0 };
  }

  ctx.stderr(`  Unknown adapters subcommand: ${subcommand}\n`);
  return { exitCode: 1 };
});

registerCommand("help", async (ctx) => {
  ctx.stdout(`ConsensusOS v${getVersion()} — Modular Control Plane\n\n`);
  ctx.stdout("Commands:\n");
  ctx.stdout("  doctor     Run health checks on monitored nodes\n");
  ctx.stdout("  verify     Verify release artifact integrity\n");
  ctx.stdout("  config     Config validation, diff, migration\n");
  ctx.stdout("  status     System status overview\n");
  ctx.stdout("  plugins    List and inspect loaded plugins\n");
  ctx.stdout("  adapters   List and query chain adapters\n");
  ctx.stdout("  help       Show this help message\n");
  ctx.stdout("\nFlags:\n");
  ctx.stdout("  --version, -V   Show version\n");
  ctx.stdout("  --help          Show this help message\n");
  return { exitCode: 0 };
});

// ─── Dispatcher ─────────────────────────────────────────────────────

/** Dispatch a CLI command by name */
export async function dispatch(ctx: CliContext): Promise<CommandResult> {
  const [command, ...subArgs] = ctx.args;

  if (command === "--version" || command === "-V") {
    ctx.stdout(`consensusos ${getVersion()}\n`);
    return { exitCode: 0 };
  }

  if (!command || command === "help" || command === "--help") {
    return commands.get("help")!(ctx, []);
  }

  const handler = commands.get(command);
  if (!handler) {
    ctx.stderr(`Unknown command: ${command}\nRun "consensusos help" for usage.\n`);
    return { exitCode: 1 };
  }

  return handler(ctx, subArgs);
}

/** Get all registered command names */
export function registeredCommands(): readonly string[] {
  return [...commands.keys()];
}

// ─── Utilities ──────────────────────────────────────────────────────

/** Read version from package.json */
export function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"),
    );
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Find a plugin instance by ID from the loader.
 * Returns the plugin cast to the expected type, or undefined.
 */
function findPlugin<T>(loader: CoreLoader, id: string): T | undefined {
  return loader.getPlugin(id) as T | undefined;
}

// ─── Main Entry Point ───────────────────────────────────────────────

export async function main(argv?: string[]): Promise<number> {
  const args = argv ?? process.argv.slice(2);

  const loader = new CoreLoader();

  // Register all built-in plugins
  loader.register(createHealthSentinel());
  loader.register(createReleaseVerifier());
  loader.register(createConfigGuardian());
  loader.register(createXrplAdapter());

  await loader.boot();

  const ctx: CliContext = {
    loader,
    args,
    stdout: (msg) => process.stdout.write(msg),
    stderr: (msg) => process.stderr.write(msg),
  };

  const result = await dispatch(ctx);
  await loader.shutdown();
  return result.exitCode;
}
