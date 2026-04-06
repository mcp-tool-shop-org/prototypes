import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  scanAllSettings,
  extractPlugins,
  extractHooks,
  getDisableAllHooks,
} from '../src/scanner.js';

function makeTmpDir(): string {
  const dir = join(tmpdir(), `chd-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
}

describe('scanAllSettings', () => {
  it('returns not-found for missing files', () => {
    const tmp = makeTmpDir();
    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: join(tmp, 'user.json'),
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });
    expect(files).toHaveLength(4);
    expect(files.every((f) => !f.exists)).toBe(true);
    rmSync(tmp, { recursive: true });
  });

  it('reads valid settings files', () => {
    const tmp = makeTmpDir();
    const userPath = join(tmp, 'user.json');
    writeJson(userPath, { enabledPlugins: { 'test-plugin': true } });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: userPath,
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });

    const userFile = files.find((f) => f.scope === 'user');
    expect(userFile?.exists).toBe(true);
    expect(userFile?.raw?.enabledPlugins).toEqual({ 'test-plugin': true });
    rmSync(tmp, { recursive: true });
  });

  it('handles broken JSON gracefully', () => {
    const tmp = makeTmpDir();
    const brokenPath = join(tmp, 'broken.json');
    writeFileSync(brokenPath, '{ invalid json }}}');

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: brokenPath,
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });

    const userFile = files.find((f) => f.scope === 'user');
    expect(userFile?.exists).toBe(true);
    expect(userFile?.error).toBeTruthy();
    expect(userFile?.raw).toBeUndefined();
    rmSync(tmp, { recursive: true });
  });
});

describe('extractPlugins', () => {
  it('extracts plugin states across scopes', () => {
    const tmp = makeTmpDir();
    const userPath = join(tmp, 'user.json');
    const localPath = join(tmp, 'local.json');
    writeJson(userPath, { enabledPlugins: { 'my-plugin': true } });
    writeJson(localPath, { enabledPlugins: { 'my-plugin': false } });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: userPath,
        project: join(tmp, 'project.json'),
        local: localPath,
      },
    });

    const plugins = extractPlugins(files);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].pluginId).toBe('my-plugin');
    expect(plugins[0].scopes).toHaveLength(2);
    // local wins (last scope)
    expect(plugins[0].mergedEnabled).toBe(false);
    rmSync(tmp, { recursive: true });
  });

  it('handles missing enabledPlugins gracefully', () => {
    const tmp = makeTmpDir();
    const userPath = join(tmp, 'user.json');
    writeJson(userPath, { hooks: {} });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: userPath,
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });

    const plugins = extractPlugins(files);
    expect(plugins).toHaveLength(0);
    rmSync(tmp, { recursive: true });
  });
});

describe('extractHooks', () => {
  it('extracts hooks from settings', () => {
    const tmp = makeTmpDir();
    const userPath = join(tmp, 'user.json');
    writeJson(userPath, {
      hooks: {
        Stop: [
          {
            hooks: [
              { type: 'command', command: 'echo hello' },
            ],
          },
        ],
      },
    });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: userPath,
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });

    const hooks = extractHooks(files);
    expect(hooks).toHaveLength(1);
    expect(hooks[0].event).toBe('Stop');
    expect(hooks[0].hook.command).toBe('echo hello');
    expect(hooks[0].source).toBe('user');
    rmSync(tmp, { recursive: true });
  });

  it('extracts hooks with matchers', () => {
    const tmp = makeTmpDir();
    const projPath = join(tmp, 'project.json');
    writeJson(projPath, {
      hooks: {
        PostToolUse: [
          {
            matcher: 'Write|Edit',
            hooks: [
              { type: 'command', command: 'prettier --write $FILE' },
            ],
          },
        ],
      },
    });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: join(tmp, 'user.json'),
        project: projPath,
        local: join(tmp, 'local.json'),
      },
    });

    const hooks = extractHooks(files);
    expect(hooks).toHaveLength(1);
    expect(hooks[0].matcher).toBe('Write|Edit');
    rmSync(tmp, { recursive: true });
  });
});

describe('getDisableAllHooks', () => {
  it('returns false when not set', () => {
    const tmp = makeTmpDir();
    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: join(tmp, 'user.json'),
        project: join(tmp, 'project.json'),
        local: join(tmp, 'local.json'),
      },
    });
    expect(getDisableAllHooks(files)).toBe(false);
    rmSync(tmp, { recursive: true });
  });

  it('returns true when set in any scope', () => {
    const tmp = makeTmpDir();
    const localPath = join(tmp, 'local.json');
    writeJson(localPath, { disableAllHooks: true });

    const files = scanAllSettings({
      overridePaths: {
        managed: join(tmp, 'managed.json'),
        user: join(tmp, 'user.json'),
        project: join(tmp, 'project.json'),
        local: localPath,
      },
    });
    expect(getDisableAllHooks(files)).toBe(true);
    rmSync(tmp, { recursive: true });
  });
});
