import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  createWorkspace,
  resetWorkspace,
  cleanupWorkspace,
  checkCommandSafety,
  resolveWorkspacePath,
} from '../src/workspace.js';
import type { Lesson, SafetySpec } from '../src/types.js';

const TMP = join(tmpdir(), 'terminal-tutor-test-workspace');

const MOCK_LESSON: Lesson = {
  id: 'test-workspace',
  title: 'Test',
  difficulty: 'beginner',
  estimated_minutes: 5,
  goal: 'Test',
  workspace: {
    scaffold: [
      { path: 'hello.txt', content: 'hello world' },
      { path: 'src/app.js', content: 'console.log("hi")' },
      { path: 'nested/deep/file.md', content: '# Deep' },
    ],
  },
  safety: {
    blocked_patterns: ['rm -rf', 'sudo', 'chmod 777'],
    workspace_only: true,
  },
  steps: [],
  reflection: 'Done.',
};

describe('createWorkspace', () => {
  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('creates workspace with scaffold files', () => {
    const ws = createWorkspace(MOCK_LESSON, TMP);
    expect(ws.initialized).toBe(true);
    expect(ws.lessonId).toBe('test-workspace');
    expect(existsSync(join(ws.root, 'hello.txt'))).toBe(true);
    expect(existsSync(join(ws.root, 'src/app.js'))).toBe(true);
    expect(existsSync(join(ws.root, 'nested/deep/file.md'))).toBe(true);
    expect(readFileSync(join(ws.root, 'hello.txt'), 'utf-8')).toBe('hello world');
  });

  it('recreates workspace on second call (clean slate)', () => {
    const ws1 = createWorkspace(MOCK_LESSON, TMP);
    // Add a rogue file
    const { writeFileSync } = require('node:fs');
    writeFileSync(join(ws1.root, 'rogue.txt'), 'intruder');

    const ws2 = createWorkspace(MOCK_LESSON, TMP);
    expect(existsSync(join(ws2.root, 'rogue.txt'))).toBe(false);
    expect(existsSync(join(ws2.root, 'hello.txt'))).toBe(true);
  });
});

describe('resetWorkspace', () => {
  it('restores scaffold state', () => {
    const ws = createWorkspace(MOCK_LESSON, TMP);
    const { writeFileSync } = require('node:fs');
    writeFileSync(join(ws.root, 'extra.txt'), 'extra');
    expect(existsSync(join(ws.root, 'extra.txt'))).toBe(true);

    const ws2 = resetWorkspace(MOCK_LESSON, ws);
    expect(existsSync(join(ws2.root, 'extra.txt'))).toBe(false);
    expect(existsSync(join(ws2.root, 'hello.txt'))).toBe(true);
  });
});

describe('cleanupWorkspace', () => {
  it('removes the workspace directory', () => {
    const ws = createWorkspace(MOCK_LESSON, TMP);
    expect(existsSync(ws.root)).toBe(true);
    cleanupWorkspace(ws);
    expect(existsSync(ws.root)).toBe(false);
  });
});

describe('checkCommandSafety', () => {
  const safety: SafetySpec = {
    blocked_patterns: ['rm -rf', 'sudo', 'chmod 777'],
    workspace_only: true,
  };
  const wsRoot = '/tmp/workspace';

  it('allows safe commands', () => {
    expect(checkCommandSafety('ls -la', safety, wsRoot).allowed).toBe(true);
    expect(checkCommandSafety('grep -r TODO .', safety, wsRoot).allowed).toBe(true);
    expect(checkCommandSafety('cat file.txt', safety, wsRoot).allowed).toBe(true);
  });

  it('blocks matched patterns', () => {
    const r = checkCommandSafety('rm -rf /', safety, wsRoot);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('rm -rf');
  });

  it('blocks sudo', () => {
    expect(checkCommandSafety('sudo apt install vim', safety, wsRoot).allowed).toBe(false);
  });

  it('blocks cd to root', () => {
    expect(checkCommandSafety('cd /', safety, wsRoot).allowed).toBe(false);
  });

  it('blocks cd ..', () => {
    expect(checkCommandSafety('cd ..', safety, wsRoot).allowed).toBe(false);
  });

  it('allows cd to subdirectory', () => {
    expect(checkCommandSafety('cd src', safety, wsRoot).allowed).toBe(true);
  });

  it('respects workspace_only: false', () => {
    const relaxed: SafetySpec = { blocked_patterns: [], workspace_only: false };
    expect(checkCommandSafety('cd /', relaxed, wsRoot).allowed).toBe(true);
    expect(checkCommandSafety('cd ..', relaxed, wsRoot).allowed).toBe(true);
  });
});

describe('resolveWorkspacePath', () => {
  it('resolves paths inside workspace', () => {
    const result = resolveWorkspacePath('/tmp/workspace', 'src/app.js');
    expect(result).toContain('src');
    expect(result).toContain('app.js');
  });

  it('rejects paths that escape workspace', () => {
    expect(resolveWorkspacePath('/tmp/workspace', '../escape.txt')).toBeNull();
    expect(resolveWorkspacePath('/tmp/workspace', '../../etc/passwd')).toBeNull();
  });
});
