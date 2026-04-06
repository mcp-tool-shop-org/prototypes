import type {
  SettingsFile,
  PluginState,
  ResolvedHook,
  Diagnostic,
} from './types.js';

type DiagnosticRule = (ctx: DiagnosticContext) => Diagnostic[];

interface DiagnosticContext {
  files: SettingsFile[];
  plugins: PluginState[];
  hooks: ResolvedHook[];
  disableAllHooks: boolean;
}

// --- Rule: Ghost hooks from disabled plugins ---
// A plugin is disabled but its hooks still fire (known bug #19893)

function ghostHooks(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const disabledPlugins = ctx.plugins.filter((p) => !p.mergedEnabled);

  // Check if any hooks reference patterns that look like plugin hooks
  // Also flag the general known bug pattern
  for (const plugin of disabledPlugins) {
    const id = plugin.pluginId;

    // Check if the plugin appears to be preview-related
    if (id.includes('preview')) {
      diagnostics.push({
        id: 'GHOST_HOOK_PREVIEW',
        severity: 'error',
        title: `Disabled plugin "${id}" may still fire hooks`,
        detail:
          `Plugin is disabled (merged: false) but Claude Code has a known bug ` +
          `where disabled plugins still register hooks. The plugin's Stop hook ` +
          `fires "[Preview Required]" even when explicitly disabled at all scopes. ` +
          `Scopes: ${plugin.scopes.map((s) => `${s.scope}=${s.enabled}`).join(', ')}.`,
        fix:
          `1. Ensure "enabledPlugins" key exists in ~/.claude/settings.json (even as {})\n` +
          `2. Set "${id}": false in ~/.claude/settings.json (not just local)\n` +
          `3. If still firing, add "disableAllHooks": true in project .claude/settings.local.json\n` +
          `4. File a bug at https://github.com/anthropics/claude-code/issues`,
        references: [
          'https://github.com/anthropics/claude-code/issues/19893',
          'https://github.com/anthropics/claude-code/issues/25086',
        ],
      });
    } else {
      diagnostics.push({
        id: 'GHOST_HOOK_GENERIC',
        severity: 'warning',
        title: `Disabled plugin "${id}" may still have active hooks`,
        detail:
          `Plugin is disabled (merged: false) across scopes: ` +
          `${plugin.scopes.map((s) => `${s.scope}=${s.enabled}`).join(', ')}. ` +
          `Due to known bugs, disabled plugins can still register and fire hooks.`,
        fix:
          `Disable in ~/.claude/settings.json (user scope) rather than local/project scope. ` +
          `Ensure the "enabledPlugins" key exists in settings.json for local overrides to take effect.`,
        references: ['https://github.com/anthropics/claude-code/issues/19893'],
      });
    }
  }

  return diagnostics;
}

// --- Rule: Local-only enabledPlugins (bug #25086) ---
// If enabledPlugins appears in local but not in user/project settings.json,
// the local override is silently dropped

function localOnlyPlugins(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const hasPluginsInUser = ctx.files.some(
    (f) => f.scope === 'user' && f.exists && f.raw && 'enabledPlugins' in f.raw,
  );
  const hasPluginsInProject = ctx.files.some(
    (f) => f.scope === 'project' && f.exists && f.raw && 'enabledPlugins' in f.raw,
  );
  const hasPluginsInLocal = ctx.files.some(
    (f) => f.scope === 'local' && f.exists && f.raw && 'enabledPlugins' in f.raw,
  );

  if (hasPluginsInLocal && !hasPluginsInUser && !hasPluginsInProject) {
    diagnostics.push({
      id: 'LOCAL_ONLY_PLUGINS',
      severity: 'error',
      title: 'enabledPlugins in local settings only — overrides silently dropped',
      detail:
        `"enabledPlugins" exists in settings.local.json but not in any settings.json. ` +
        `Claude Code merges local overrides into existing keys. If the key doesn't exist ` +
        `in a broader scope (user or project settings.json), the local value is silently ignored.`,
      fix:
        `Add an "enabledPlugins": {} entry to ~/.claude/settings.json or ` +
        `.claude/settings.json, then the local override will merge correctly.`,
      references: ['https://github.com/anthropics/claude-code/issues/25086'],
    });
  }

  return diagnostics;
}

// --- Rule: disableAllHooks bypasses managed hooks ---

function disableAllHooksWarning(ctx: DiagnosticContext): Diagnostic[] {
  if (!ctx.disableAllHooks) return [];

  const managedFile = ctx.files.find((f) => f.scope === 'managed');
  const hasManaged = managedFile?.exists && managedFile.raw;

  return [
    {
      id: 'DISABLE_ALL_HOOKS_ACTIVE',
      severity: hasManaged ? 'error' : 'warning',
      title: 'disableAllHooks is active — all hooks suppressed',
      detail:
        `"disableAllHooks": true is set. This disables ALL hooks including managed/organization hooks. ` +
        (hasManaged
          ? `A managed settings file exists — this overrides organization-enforced hooks, ` +
            `which is a known security bug.`
          : `No managed settings file detected, so this is likely safe.`),
      fix: hasManaged
        ? `Remove "disableAllHooks": true — it bypasses managed hooks. ` +
          `Instead, disable specific plugins via "enabledPlugins".`
        : `This is a broad hammer. Consider disabling specific plugins instead.`,
      references: [],
    },
  ];
}

// --- Rule: Stop hook with continue:true (infinite loop) ---

function stopContinueLoop(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const h of ctx.hooks) {
    if (h.event !== 'Stop') continue;
    if (h.hook.type !== 'command') continue;

    const cmd = h.hook.command ?? '';
    // Detect commands that output {"continue": true} or {"continue":true}
    if (cmd.includes('"continue"') && cmd.includes('true') && !cmd.includes('false')) {
      diagnostics.push({
        id: 'STOP_CONTINUE_LOOP',
        severity: 'error',
        title: `Stop hook outputs continue:true — causes infinite loop`,
        detail:
          `A Stop hook in ${h.source} scope outputs {"continue": true}. ` +
          `In Claude Code, continue:true on a Stop hook means "don't stop yet", ` +
          `which re-invokes stop hooks in an infinite loop. ` +
          `Command: ${cmd}`,
        fix:
          `Remove the hook. To allow stopping, either output nothing, ` +
          `output {"continue": false}, or omit the "decision" field entirely.`,
        references: ['https://github.com/anthropics/claude-code/issues/1288'],
      });
    }
  }

  return diagnostics;
}

// --- Rule: Broken JSON in settings ---

function brokenSettings(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const f of ctx.files) {
    if (f.exists && f.error) {
      diagnostics.push({
        id: 'BROKEN_SETTINGS_JSON',
        severity: 'error',
        title: `Invalid JSON in ${f.scope} settings`,
        detail:
          `File ${f.path} exists but failed to parse: ${f.error}. ` +
          `A broken settings.json silently disables ALL settings from that file.`,
        fix: `Fix the JSON syntax in ${f.path}. Common causes: trailing commas, missing quotes.`,
        references: [],
      });
    }
  }

  return diagnostics;
}

// --- Rule: Empty hooks object (not really empty) ---

function emptyHooksButPluginActive(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const userDefinedHookCount = ctx.hooks.filter((h) => h.source !== 'plugin').length;
  const hasEnabledPlugins = ctx.plugins.some((p) => p.mergedEnabled);

  if (userDefinedHookCount === 0 && hasEnabledPlugins) {
    diagnostics.push({
      id: 'PLUGIN_HOOKS_INVISIBLE',
      severity: 'info',
      title: 'No user-defined hooks, but plugins may inject hooks at runtime',
      detail:
        `The hooks config across all settings files is empty, but ` +
        `${ctx.plugins.filter((p) => p.mergedEnabled).length} plugin(s) are enabled. ` +
        `Plugins register hooks from their manifests at load time — these ` +
        `don't appear in your settings.json hooks object.`,
      fix: `Plugin hooks are invisible to settings inspection. To debug, run "claude --debug" and look for hook events in the log.`,
      references: [],
    });
  }

  return diagnostics;
}

// --- Rule: Large settings file ---

function largeSettingsFile(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const f of ctx.files) {
    if (f.exists && f.raw) {
      const size = JSON.stringify(f.raw).length;
      if (size > 100_000) {
        diagnostics.push({
          id: 'LARGE_SETTINGS_FILE',
          severity: 'warning',
          title: `${f.scope} settings file is unusually large (${(size / 1024).toFixed(0)}KB)`,
          detail:
            `File ${f.path} is ${(size / 1024).toFixed(0)}KB. Large settings files can ` +
            `cause slow startup and may indicate accumulated cruft (e.g. large permission arrays).`,
          fix: `Review ${f.path} for unnecessary entries. Permissions arrays tend to grow over time.`,
          references: [],
        });
      }
    }
  }

  return diagnostics;
}

// --- Rule: Scope conflict (plugin enabled in one scope, disabled in another) ---

function scopeConflicts(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const plugin of ctx.plugins) {
    if (plugin.scopes.length < 2) continue;

    const values = plugin.scopes.map((s) => s.enabled);
    const hasConflict = values.some((v) => v !== values[0]);

    if (hasConflict) {
      const scopeStr = plugin.scopes
        .map((s) => `${s.scope}=${s.enabled}`)
        .join(', ');
      diagnostics.push({
        id: 'SCOPE_CONFLICT',
        severity: 'warning',
        title: `Plugin "${plugin.pluginId}" has conflicting enable/disable across scopes`,
        detail:
          `Plugin state differs across scopes: ${scopeStr}. ` +
          `The last scope in load order wins (local > project > user > managed). ` +
          `Final merged state: ${plugin.mergedEnabled ? 'enabled' : 'disabled'}.`,
        fix:
          `Align the plugin state across scopes. If you want it disabled, ` +
          `set false in ~/.claude/settings.json (user scope) for reliable behavior.`,
        references: ['https://github.com/anthropics/claude-code/issues/25086'],
      });
    }
  }

  return diagnostics;
}

// --- Rule: Hook without explicit timeout ---

function hookNoTimeout(ctx: DiagnosticContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const h of ctx.hooks) {
    if (h.hook.type !== 'command' && h.hook.type !== 'http') continue;
    if (h.hook.timeout != null) continue;

    diagnostics.push({
      id: 'HOOK_NO_TIMEOUT',
      severity: 'warning',
      title: `${h.event} hook has no timeout — may hang session`,
      detail:
        `A ${h.hook.type} hook on ${h.event} in ${h.source} scope has no explicit timeout. ` +
        `If the ${h.hook.type === 'command' ? 'command hangs or blocks on input' : 'HTTP endpoint is slow or unreachable'}, ` +
        `the entire Claude Code session will freeze. ` +
        `${h.hook.type === 'command' ? `Command: ${h.hook.command ?? '(empty)'}` : `URL: ${h.hook.url ?? '(no url)'}`}`,
      fix:
        `Add a "timeout" field (milliseconds) to the hook definition. ` +
        `Recommended: 10000 (10s) for fast commands, 30000 (30s) for network calls.`,
      references: [],
    });
  }

  return diagnostics;
}

// --- Rule registry ---

const ALL_RULES: DiagnosticRule[] = [
  brokenSettings,
  localOnlyPlugins,
  ghostHooks,
  scopeConflicts,
  emptyHooksButPluginActive,
  stopContinueLoop,
  disableAllHooksWarning,
  largeSettingsFile,
  hookNoTimeout,
];

export function runDiagnostics(ctx: DiagnosticContext): Diagnostic[] {
  const results: Diagnostic[] = [];
  for (const rule of ALL_RULES) {
    results.push(...rule(ctx));
  }
  // Sort: error first, then warning, then info
  const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
  results.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  return results;
}
