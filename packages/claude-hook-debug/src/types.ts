// --- Settings scopes (load order: managed > user > project > local) ---

export type SettingsScope = 'managed' | 'user' | 'project' | 'local';

export interface SettingsFile {
  scope: SettingsScope;
  path: string;
  exists: boolean;
  raw?: Record<string, unknown>;
  error?: string;
}

// --- Hook structures (mirrors Claude Code schema) ---

export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'Notification'
  | 'UserPromptSubmit'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Stop'
  | 'StopFailure'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'PreCompact'
  | 'PostCompact'
  | 'PermissionRequest'
  | 'Setup'
  | 'TeammateIdle'
  | 'TaskCompleted'
  | 'Elicitation'
  | 'ElicitationResult'
  | 'ConfigChange'
  | 'WorktreeCreate'
  | 'WorktreeRemove'
  | 'InstructionsLoaded';

export interface HookCommand {
  type: 'command' | 'prompt' | 'agent' | 'http';
  command?: string;
  prompt?: string;
  url?: string;
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
  async?: boolean;
}

export interface HookGroup {
  matcher?: string;
  hooks: HookCommand[];
}

export type HooksConfig = Partial<Record<HookEvent, HookGroup[]>>;

// --- Plugin state ---

export interface PluginState {
  pluginId: string;
  scopes: { scope: SettingsScope; enabled: boolean }[];
  mergedEnabled: boolean;
}

// --- Resolved hook with provenance ---

export interface ResolvedHook {
  event: HookEvent;
  matcher?: string;
  hook: HookCommand;
  source: SettingsScope | 'plugin';
  pluginId?: string;
}

// --- Diagnostics ---

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  fix?: string;
  references?: string[];
}

// --- Full report ---

export interface DebugReport {
  timestamp: string;
  platform: string;
  settingsFiles: SettingsFile[];
  plugins: PluginState[];
  hooks: ResolvedHook[];
  diagnostics: Diagnostic[];
  disableAllHooks: boolean;
}
