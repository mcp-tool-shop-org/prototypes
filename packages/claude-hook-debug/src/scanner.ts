import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type {
  SettingsFile,
  SettingsScope,
  PluginState,
  ResolvedHook,
  HooksConfig,
  HookEvent,
  HookGroup,
} from './types.js';

// --- Path resolution ---

function userSettingsDir(): string {
  return join(homedir(), '.claude');
}

export interface ScanOptions {
  /** Project root to scan (defaults to cwd) */
  projectRoot?: string;
  /** Override paths for testing */
  overridePaths?: Partial<Record<SettingsScope, string>>;
}

export function resolveSettingsPaths(opts?: ScanOptions): Record<SettingsScope, string> {
  const root = opts?.projectRoot ?? process.cwd();
  const userDir = userSettingsDir();

  return {
    managed: opts?.overridePaths?.managed ?? join(userDir, 'managed-settings.json'),
    user: opts?.overridePaths?.user ?? join(userDir, 'settings.json'),
    project: opts?.overridePaths?.project ?? join(root, '.claude', 'settings.json'),
    local: opts?.overridePaths?.local ?? join(root, '.claude', 'settings.local.json'),
  };
}

// --- File reading ---

export function readSettingsFile(scope: SettingsScope, path: string): SettingsFile {
  if (!existsSync(path)) {
    return { scope, path, exists: false };
  }
  try {
    const content = readFileSync(path, 'utf-8');
    const raw = JSON.parse(content) as Record<string, unknown>;
    return { scope, path, exists: true, raw };
  } catch (err) {
    return {
      scope,
      path,
      exists: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function scanAllSettings(opts?: ScanOptions): SettingsFile[] {
  const paths = resolveSettingsPaths(opts);
  const scopes: SettingsScope[] = ['managed', 'user', 'project', 'local'];
  return scopes.map((scope) => readSettingsFile(scope, paths[scope]));
}

// --- Plugin extraction ---

function getPlugins(file: SettingsFile): Record<string, boolean> {
  if (!file.exists || !file.raw) return {};
  const ep = file.raw.enabledPlugins;
  if (!ep || typeof ep !== 'object') return {};
  const result: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(ep as Record<string, unknown>)) {
    result[key] = val === true || (Array.isArray(val) && val.length > 0);
  }
  return result;
}

export function extractPlugins(files: SettingsFile[]): PluginState[] {
  // Collect all plugin IDs across all scopes
  const allIds = new Set<string>();
  for (const f of files) {
    for (const id of Object.keys(getPlugins(f))) {
      allIds.add(id);
    }
  }

  const states: PluginState[] = [];
  for (const pluginId of allIds) {
    const scopes: PluginState['scopes'] = [];
    let mergedEnabled = false;

    for (const f of files) {
      const plugins = getPlugins(f);
      if (pluginId in plugins) {
        scopes.push({ scope: f.scope, enabled: plugins[pluginId] });
        mergedEnabled = plugins[pluginId]; // last scope wins
      }
    }

    states.push({ pluginId, scopes, mergedEnabled });
  }

  return states;
}

// --- Hook extraction ---

function getHooks(file: SettingsFile): HooksConfig {
  if (!file.exists || !file.raw) return {};
  const h = file.raw.hooks;
  if (!h || typeof h !== 'object') return {};
  return h as HooksConfig;
}

export function extractHooks(files: SettingsFile[]): ResolvedHook[] {
  const resolved: ResolvedHook[] = [];

  for (const f of files) {
    const hooks = getHooks(f);
    for (const [event, groups] of Object.entries(hooks)) {
      if (!Array.isArray(groups)) continue;
      for (const group of groups as HookGroup[]) {
        if (!Array.isArray(group.hooks)) continue;
        for (const hook of group.hooks) {
          resolved.push({
            event: event as HookEvent,
            matcher: group.matcher,
            hook,
            source: f.scope,
          });
        }
      }
    }
  }

  return resolved;
}

// --- Merged state ---

export function getDisableAllHooks(files: SettingsFile[]): boolean {
  for (const f of files) {
    if (f.exists && f.raw && f.raw.disableAllHooks === true) {
      return true;
    }
  }
  return false;
}
