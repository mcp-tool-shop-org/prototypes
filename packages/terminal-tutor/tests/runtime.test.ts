import { describe, it, expect, afterAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolveRuntime, getAdapter, checkRuntimeAvailable, getRuntimeCapabilities } from '../src/runtime.js';
import { ShellRuntime } from '../src/runtime-shell.js';
import { VenvRuntime } from '../src/runtime-venv.js';
import { DockerRuntime } from '../src/runtime-docker.js';
import type { Lesson, RuntimeSpec } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-runtime');

const SHELL_LESSON: Lesson = {
  id: 'rt-shell-test',
  title: 'Shell Test',
  difficulty: 'beginner',
  estimated_minutes: 1,
  goal: 'Test shell runtime',
  workspace: {
    scaffold: [
      { path: 'hello.txt', content: 'hello from shell' },
      { path: 'src/main.js', content: 'console.log("hi")' },
    ],
  },
  safety: { blocked_patterns: [], workspace_only: true },
  steps: [],
  reflection: 'Done.',
};

const VENV_LESSON: Lesson = {
  ...SHELL_LESSON,
  id: 'rt-venv-test',
  runtime: { type: 'venv', python: '3.12', requirements: [] },
};

const DOCKER_LESSON: Lesson = {
  ...SHELL_LESSON,
  id: 'rt-docker-test',
  runtime: { type: 'docker', image: 'python:3.12-slim' },
};

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ── resolveRuntime ───────────────────────────────────────────────

describe('resolveRuntime', () => {
  it('defaults to shell when spec is undefined', () => {
    const resolved = resolveRuntime(undefined);
    expect(resolved.type).toBe('shell');
    expect(resolved.reset).toBe('per_lesson');
    expect(resolved.network).toBe(false);
    expect(resolved.timeout).toBe(30);
  });

  it('applies defaults for venv', () => {
    const resolved = resolveRuntime({ type: 'venv' });
    expect(resolved.type).toBe('venv');
    expect(resolved.python).toBe('3.12');
    expect(resolved.requirements).toEqual([]);
  });

  it('applies defaults for docker', () => {
    const resolved = resolveRuntime({ type: 'docker' });
    expect(resolved.type).toBe('docker');
    expect(resolved.image).toBe('python:3.12-slim');
    expect(resolved.network).toBe(false);
    expect(resolved.writable_paths).toEqual(['/workspace']);
  });

  it('preserves explicit values', () => {
    const spec: RuntimeSpec = {
      type: 'docker',
      image: 'node:20-alpine',
      requirements: ['express'],
      reset: 'per_step',
      network: true,
      writable_paths: ['/workspace', '/var/log'],
      timeout: 60,
    };
    const resolved = resolveRuntime(spec);
    expect(resolved.image).toBe('node:20-alpine');
    expect(resolved.requirements).toEqual(['express']);
    expect(resolved.reset).toBe('per_step');
    expect(resolved.network).toBe(true);
    expect(resolved.writable_paths).toEqual(['/workspace', '/var/log']);
    expect(resolved.timeout).toBe(60);
  });
});

// ── getAdapter ───────────────────────────────────────────────────

describe('getAdapter', () => {
  it('returns ShellRuntime for shell', () => {
    const adapter = getAdapter('shell');
    expect(adapter.type).toBe('shell');
    expect(adapter).toBeInstanceOf(ShellRuntime);
  });

  it('returns VenvRuntime for venv', () => {
    const adapter = getAdapter('venv');
    expect(adapter.type).toBe('venv');
    expect(adapter).toBeInstanceOf(VenvRuntime);
  });

  it('returns DockerRuntime for docker', () => {
    const adapter = getAdapter('docker');
    expect(adapter.type).toBe('docker');
    expect(adapter).toBeInstanceOf(DockerRuntime);
  });
});

// ── ShellRuntime ─────────────────────────────────────────────────

describe('ShellRuntime', () => {
  const runtime = new ShellRuntime();

  it('is always available', async () => {
    expect(await runtime.isAvailable()).toBe(true);
  });

  it('sets up workspace with scaffold', async () => {
    const wsRoot = join(TMP, 'shell-ws', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);

    expect(state.type).toBe('shell');
    expect(state.active).toBe(true);
    expect(existsSync(join(state.workspaceRoot, 'hello.txt'))).toBe(true);
    expect(readFileSync(join(state.workspaceRoot, 'hello.txt'), 'utf-8')).toBe('hello from shell');
    expect(existsSync(join(state.workspaceRoot, 'src/main.js'))).toBe(true);
  });

  it('resets workspace to clean scaffold', async () => {
    const wsRoot = join(TMP, 'shell-reset', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);

    // Add a rogue file
    const { writeFileSync } = require('node:fs');
    writeFileSync(join(state.workspaceRoot, 'rogue.txt'), 'intruder');

    const resetState = await runtime.reset(state, SHELL_LESSON);
    expect(existsSync(join(resetState.workspaceRoot, 'rogue.txt'))).toBe(false);
    expect(existsSync(join(resetState.workspaceRoot, 'hello.txt'))).toBe(true);
  });

  it('tears down workspace', async () => {
    const wsRoot = join(TMP, 'shell-teardown', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);
    expect(existsSync(state.workspaceRoot)).toBe(true);

    await runtime.teardown(state);
    expect(existsSync(state.workspaceRoot)).toBe(false);
    expect(state.active).toBe(false);
  });

  it('returns workspace root as workdir', async () => {
    const wsRoot = join(TMP, 'shell-workdir', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);
    expect(runtime.getWorkdir(state)).toBe(state.workspaceRoot);
    await runtime.teardown(state);
  });

  it('returns empty env', async () => {
    const wsRoot = join(TMP, 'shell-env', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);
    expect(runtime.getEnv(state)).toEqual({});
    await runtime.teardown(state);
  });

  it('passes commands through unchanged', async () => {
    const wsRoot = join(TMP, 'shell-wrap', SHELL_LESSON.id);
    const state = await runtime.setup(SHELL_LESSON, wsRoot);
    expect(runtime.wrapCommand(state, 'ls -la')).toBe('ls -la');
    await runtime.teardown(state);
  });
});

// ── VenvRuntime ──────────────────────────────────────────────────

describe('VenvRuntime', () => {
  const runtime = new VenvRuntime();

  it('reports availability based on Python installation', async () => {
    const available = await runtime.isAvailable();
    // Python is available on this system
    expect(typeof available).toBe('boolean');
  });

  // Conditional tests — only run if Python is available
  it('sets up workspace with venv when Python available', async () => {
    const available = await runtime.isAvailable();
    if (!available) {
      console.log('Skipping venv setup test — Python not available');
      return;
    }

    const wsRoot = join(TMP, 'venv-ws', VENV_LESSON.id);
    const state = await runtime.setup(VENV_LESSON, wsRoot);

    expect(state.type).toBe('venv');
    expect(state.active).toBe(true);
    expect(state.venvPath).toBeTruthy();
    expect(existsSync(state.venvPath!)).toBe(true);
    expect(existsSync(join(state.workspaceRoot, 'hello.txt'))).toBe(true);

    await runtime.teardown(state);
  }, 60000);

  it('wraps commands with venv activation', async () => {
    const available = await runtime.isAvailable();
    if (!available) return;

    const wsRoot = join(TMP, 'venv-wrap', VENV_LESSON.id);
    const state = await runtime.setup(VENV_LESSON, wsRoot);

    const wrapped = runtime.wrapCommand(state, 'pytest -v');
    expect(wrapped).toContain('activate');
    expect(wrapped).toContain('pytest -v');

    await runtime.teardown(state);
  }, 60000);

  it('provides VIRTUAL_ENV in env', async () => {
    const available = await runtime.isAvailable();
    if (!available) return;

    const wsRoot = join(TMP, 'venv-env', VENV_LESSON.id);
    const state = await runtime.setup(VENV_LESSON, wsRoot);

    const env = runtime.getEnv(state);
    expect(env.VIRTUAL_ENV).toBeTruthy();
    expect(env.PATH).toContain(state.venvPath!);

    await runtime.teardown(state);
  }, 60000);
});

// ── DockerRuntime ────────────────────────────────────────────────

describe('DockerRuntime', () => {
  const runtime = new DockerRuntime();

  it('reports availability based on Docker installation', async () => {
    const available = await runtime.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('wraps commands with docker exec', async () => {
    // Test wrapping without needing a real container
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      containerId: 'abc123',
      active: true,
    };

    const wrapped = runtime.wrapCommand(mockState, 'ls -la');
    expect(wrapped).toContain('docker exec');
    expect(wrapped).toContain('abc123');
    expect(wrapped).toContain('ls -la');
  });

  it('throws when wrapping without container ID', () => {
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      active: true,
    };

    expect(() => runtime.wrapCommand(mockState, 'ls')).toThrow('no container ID');
  });

  it('returns /workspace as workdir', () => {
    const mockState = {
      type: 'docker' as const,
      workspaceRoot: '/tmp/test',
      lessonId: 'test',
      active: true,
    };

    expect(runtime.getWorkdir(mockState)).toBe('/workspace');
  });
});

// ── getRuntimeCapabilities ───────────────────────────────────────

describe('getRuntimeCapabilities', () => {
  it('returns boolean for all three runtimes', async () => {
    const caps = await getRuntimeCapabilities();
    expect(typeof caps.shell).toBe('boolean');
    expect(typeof caps.venv).toBe('boolean');
    expect(typeof caps.docker).toBe('boolean');
    expect(caps.shell).toBe(true); // shell is always available
  });
});
