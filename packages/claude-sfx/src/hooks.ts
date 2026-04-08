/**
 * Hook config generator — creates Claude Code hooks entries for .claude/settings.json.
 * Handles merging with existing settings non-destructively.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// --- Types matching Claude Code hooks schema ---

interface HookEntry {
  type: "command";
  command: string;
  timeout: number;
}

interface HookMatcher {
  matcher?: string;
  hooks: HookEntry[];
}

interface HooksConfig {
  [eventName: string]: HookMatcher[];
}

interface SettingsJson {
  hooks?: HooksConfig;
  [key: string]: unknown;
}

// --- Marker to identify our hooks ---

const SFX_MARKER = "claude-sfx";

/** Resolve the path to the claude-sfx CLI (the installed binary or dist/cli.js). */
function resolveSfxBin(): string {
  // Try to find the globally/locally installed binary
  try {
    const which = process.platform === "win32"
      ? execSync("where claude-sfx", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim().split(/\r?\n/)[0].trim()
      : execSync("which claude-sfx", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    if (which) return which;
  } catch {
    // Not installed globally — use node + dist path
  }

  // Fallback: use node with the dist path relative to this package
  const __filename = fileURLToPath(import.meta.url);
  const cliPath = join(dirname(__filename), "cli.js");
  return `node "${cliPath}"`;
}

function makeHookCommand(sfxBin: string, eventName: string): string {
  return `${sfxBin} hook-handler ${eventName}`;
}

/** Generate the full hooks config for claude-sfx. */
export function generateHooksConfig(): HooksConfig {
  const sfxBin = resolveSfxBin();

  return {
    SessionStart: [
      {
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "SessionStart"),
            timeout: 3,
          },
        ],
      },
    ],
    PostToolUse: [
      {
        // Match all tools — the handler does the mapping internally
        matcher: ".*",
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "PostToolUse"),
            timeout: 3,
          },
        ],
      },
    ],
    PostToolUseFailure: [
      {
        matcher: ".*",
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "PostToolUseFailure"),
            timeout: 3,
          },
        ],
      },
    ],
    SubagentStart: [
      {
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "SubagentStart"),
            timeout: 3,
          },
        ],
      },
    ],
    SubagentStop: [
      {
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "SubagentStop"),
            timeout: 3,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: "command",
            command: makeHookCommand(sfxBin, "Stop"),
            timeout: 3,
          },
        ],
      },
    ],
  };
}

/** Check if a hook entry is one of ours. */
function isSfxHook(entry: HookEntry): boolean {
  return entry.command.includes(SFX_MARKER);
}

/** Check if a matcher block contains any of our hooks. */
function containsSfxHook(matcherBlock: HookMatcher): boolean {
  return matcherBlock.hooks.some(isSfxHook);
}

// --- Init / Uninstall ---

function getSettingsPath(cwd: string): string {
  return join(cwd, ".claude", "settings.json");
}

function readSettings(settingsPath: string): SettingsJson {
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return {};
  }
}

function writeSettings(settingsPath: string, settings: SettingsJson): void {
  const dir = dirname(settingsPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

/**
 * Install claude-sfx hooks into .claude/settings.json.
 * Merges non-destructively — preserves existing hooks from other tools.
 */
export function installHooks(cwd: string): { settingsPath: string; eventsAdded: string[] } {
  const settingsPath = getSettingsPath(cwd);
  const settings = readSettings(settingsPath);
  const sfxHooks = generateHooksConfig();

  if (!settings.hooks) {
    settings.hooks = {};
  }

  const eventsAdded: string[] = [];

  for (const [eventName, sfxMatchers] of Object.entries(sfxHooks)) {
    if (!settings.hooks[eventName]) {
      settings.hooks[eventName] = [];
    }

    // Remove any existing SFX hooks (in case of re-init)
    settings.hooks[eventName] = settings.hooks[eventName].filter(
      (m: HookMatcher) => !containsSfxHook(m)
    );

    // Add our hooks
    settings.hooks[eventName].push(...sfxMatchers);
    eventsAdded.push(eventName);
  }

  writeSettings(settingsPath, settings);

  return { settingsPath, eventsAdded };
}

/**
 * Remove all claude-sfx hooks from .claude/settings.json.
 * Preserves hooks from other tools.
 */
export function uninstallHooks(cwd: string): { settingsPath: string; removed: boolean } {
  const settingsPath = getSettingsPath(cwd);
  if (!existsSync(settingsPath)) {
    return { settingsPath, removed: false };
  }

  const settings = readSettings(settingsPath);
  if (!settings.hooks) {
    return { settingsPath, removed: false };
  }

  let removedAny = false;

  for (const eventName of Object.keys(settings.hooks)) {
    const before = settings.hooks[eventName].length;
    settings.hooks[eventName] = settings.hooks[eventName].filter(
      (m: HookMatcher) => !containsSfxHook(m)
    );
    if (settings.hooks[eventName].length < before) {
      removedAny = true;
    }
    // Clean up empty event arrays
    if (settings.hooks[eventName].length === 0) {
      delete settings.hooks[eventName];
    }
  }

  // Clean up empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeSettings(settingsPath, settings);

  return { settingsPath, removed: removedAny };
}
