import { describe, it, expect } from 'vitest';
import { runDiagnostics } from '../src/diagnostics.js';
import type { SettingsFile, PluginState, ResolvedHook } from '../src/types.js';

function makeContext(overrides?: {
  files?: SettingsFile[];
  plugins?: PluginState[];
  hooks?: ResolvedHook[];
  disableAllHooks?: boolean;
}) {
  return {
    files: overrides?.files ?? [],
    plugins: overrides?.plugins ?? [],
    hooks: overrides?.hooks ?? [],
    disableAllHooks: overrides?.disableAllHooks ?? false,
  };
}

describe('diagnostics', () => {
  it('returns no diagnostics for clean state', () => {
    const result = runDiagnostics(makeContext());
    expect(result).toEqual([]);
  });

  it('detects ghost hooks from disabled preview plugin', () => {
    const result = runDiagnostics(
      makeContext({
        plugins: [
          {
            pluginId: 'claude-preview@claude-code-marketplace',
            scopes: [
              { scope: 'user', enabled: false },
              { scope: 'local', enabled: false },
            ],
            mergedEnabled: false,
          },
        ],
      }),
    );
    const ghost = result.find((d) => d.id === 'GHOST_HOOK_PREVIEW');
    expect(ghost).toBeTruthy();
    expect(ghost!.severity).toBe('error');
    expect(ghost!.references).toContain(
      'https://github.com/anthropics/claude-code/issues/19893',
    );
  });

  it('detects ghost hooks from other disabled plugins', () => {
    const result = runDiagnostics(
      makeContext({
        plugins: [
          {
            pluginId: 'some-other-plugin@marketplace',
            scopes: [{ scope: 'user', enabled: false }],
            mergedEnabled: false,
          },
        ],
      }),
    );
    const ghost = result.find((d) => d.id === 'GHOST_HOOK_GENERIC');
    expect(ghost).toBeTruthy();
    expect(ghost!.severity).toBe('warning');
  });

  it('does NOT flag enabled plugins as ghost hooks', () => {
    const result = runDiagnostics(
      makeContext({
        plugins: [
          {
            pluginId: 'claude-preview@marketplace',
            scopes: [{ scope: 'user', enabled: true }],
            mergedEnabled: true,
          },
        ],
      }),
    );
    const ghost = result.find((d) => d.id.startsWith('GHOST_HOOK'));
    expect(ghost).toBeUndefined();
  });

  it('detects local-only enabledPlugins (bug #25086)', () => {
    const result = runDiagnostics(
      makeContext({
        files: [
          { scope: 'managed', path: '/m.json', exists: false },
          { scope: 'user', path: '/u.json', exists: true, raw: {} },
          { scope: 'project', path: '/p.json', exists: false },
          {
            scope: 'local',
            path: '/l.json',
            exists: true,
            raw: { enabledPlugins: { foo: false } },
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'LOCAL_ONLY_PLUGINS');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('error');
  });

  it('does NOT flag local plugins when user settings also has key', () => {
    const result = runDiagnostics(
      makeContext({
        files: [
          { scope: 'managed', path: '/m.json', exists: false },
          {
            scope: 'user',
            path: '/u.json',
            exists: true,
            raw: { enabledPlugins: {} },
          },
          { scope: 'project', path: '/p.json', exists: false },
          {
            scope: 'local',
            path: '/l.json',
            exists: true,
            raw: { enabledPlugins: { foo: false } },
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'LOCAL_ONLY_PLUGINS');
    expect(diag).toBeUndefined();
  });

  it('detects disableAllHooks active', () => {
    const result = runDiagnostics(
      makeContext({ disableAllHooks: true }),
    );
    const diag = result.find((d) => d.id === 'DISABLE_ALL_HOOKS_ACTIVE');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('warning');
  });

  it('escalates disableAllHooks to error when managed settings exist', () => {
    const result = runDiagnostics(
      makeContext({
        files: [
          {
            scope: 'managed',
            path: '/m.json',
            exists: true,
            raw: { hooks: {} },
          },
        ],
        disableAllHooks: true,
      }),
    );
    const diag = result.find((d) => d.id === 'DISABLE_ALL_HOOKS_ACTIVE');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('error');
  });

  it('detects Stop hook with continue:true (infinite loop)', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'Stop',
            hook: {
              type: 'command',
              command: 'echo \'{"continue": true}\'',
            },
            source: 'local',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'STOP_CONTINUE_LOOP');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('error');
    expect(diag!.references).toContain(
      'https://github.com/anthropics/claude-code/issues/1288',
    );
  });

  it('does NOT flag Stop hooks without continue:true', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'Stop',
            hook: { type: 'command', command: 'echo done' },
            source: 'user',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'STOP_CONTINUE_LOOP');
    expect(diag).toBeUndefined();
  });

  it('detects broken settings JSON', () => {
    const result = runDiagnostics(
      makeContext({
        files: [
          {
            scope: 'user',
            path: '/u.json',
            exists: true,
            error: 'Unexpected token }',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'BROKEN_SETTINGS_JSON');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('error');
  });

  it('detects scope conflicts on plugin state', () => {
    const result = runDiagnostics(
      makeContext({
        plugins: [
          {
            pluginId: 'conflicted-plugin',
            scopes: [
              { scope: 'user', enabled: true },
              { scope: 'local', enabled: false },
            ],
            mergedEnabled: false,
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'SCOPE_CONFLICT');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('warning');
  });

  it('detects large settings files', () => {
    const bigObj: Record<string, unknown> = {};
    // Create a >100KB object
    for (let i = 0; i < 2000; i++) {
      bigObj[`key_${i}`] = 'x'.repeat(60);
    }
    const result = runDiagnostics(
      makeContext({
        files: [
          { scope: 'local', path: '/l.json', exists: true, raw: bigObj },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'LARGE_SETTINGS_FILE');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('warning');
  });

  it('detects invisible plugin hooks when hooks empty but plugins enabled', () => {
    const result = runDiagnostics(
      makeContext({
        plugins: [
          {
            pluginId: 'some-plugin',
            scopes: [{ scope: 'user', enabled: true }],
            mergedEnabled: true,
          },
        ],
        hooks: [],
      }),
    );
    const diag = result.find((d) => d.id === 'PLUGIN_HOOKS_INVISIBLE');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('info');
  });

  it('detects command hooks without explicit timeout', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'PreToolUse',
            hook: { type: 'command', command: 'echo hello' },
            source: 'user',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'HOOK_NO_TIMEOUT');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('warning');
    expect(diag!.detail).toContain('command hangs');
  });

  it('detects http hooks without explicit timeout', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'PostToolUse',
            hook: { type: 'http', url: 'https://example.com/hook' },
            source: 'project',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'HOOK_NO_TIMEOUT');
    expect(diag).toBeTruthy();
    expect(diag!.detail).toContain('HTTP endpoint');
  });

  it('does NOT flag hooks that have explicit timeout', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'PreToolUse',
            hook: { type: 'command', command: 'echo hello', timeout: 10000 },
            source: 'user',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'HOOK_NO_TIMEOUT');
    expect(diag).toBeUndefined();
  });

  it('does NOT flag prompt hooks without timeout', () => {
    const result = runDiagnostics(
      makeContext({
        hooks: [
          {
            event: 'Stop',
            hook: { type: 'prompt', prompt: 'Check something' },
            source: 'user',
          },
        ],
      }),
    );
    const diag = result.find((d) => d.id === 'HOOK_NO_TIMEOUT');
    expect(diag).toBeUndefined();
  });

  it('sorts diagnostics by severity (error > warning > info)', () => {
    const result = runDiagnostics(
      makeContext({
        files: [
          {
            scope: 'user',
            path: '/u.json',
            exists: true,
            error: 'bad json',
          },
        ],
        plugins: [
          {
            pluginId: 'some-plugin',
            scopes: [{ scope: 'user', enabled: true }],
            mergedEnabled: true,
          },
        ],
        hooks: [],
      }),
    );
    // Should have error(s) before info(s)
    const severities = result.map((d) => d.severity);
    const errorIdx = severities.indexOf('error');
    const infoIdx = severities.indexOf('info');
    if (errorIdx >= 0 && infoIdx >= 0) {
      expect(errorIdx).toBeLessThan(infoIdx);
    }
  });
});
