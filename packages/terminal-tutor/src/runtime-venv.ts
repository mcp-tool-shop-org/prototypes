/**
 * Venv Runtime Adapter — Python virtual environment isolation.
 *
 * For lessons that need real pip, pytest, or Python package behavior
 * without the weight of a full container. Creates a venv inside the
 * workspace, installs requirements, and activates it for commands.
 *
 * The venv adapter:
 * - Creates a Python venv at <workspace>/.venv
 * - Installs lesson requirements via pip
 * - Wraps commands to activate the venv first
 * - Resets by destroying and recreating the venv
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import type { RuntimeAdapter, RuntimeState, Lesson, ResolvedRuntime } from './types.js';

const WORKSPACE_ROOT = 'terminal-tutor-workspace';
const VENV_DIR = '.venv';

export class VenvRuntime implements RuntimeAdapter {
  readonly type = 'venv' as const;

  async isAvailable(): Promise<boolean> {
    try {
      execSync('python3 --version', { stdio: 'pipe' });
      return true;
    } catch {
      try {
        execSync('python --version', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
  }

  async setup(lesson: Lesson, workspaceRoot: string): Promise<RuntimeState> {
    const spec = lesson.runtime;
    const resolved = {
      python: spec?.python ?? '3.12',
      requirements: spec?.requirements ?? [],
    };
    const root = workspaceRoot || join(tmpdir(), WORKSPACE_ROOT, lesson.id);

    // Clean slate
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
    mkdirSync(root, { recursive: true });

    // Scaffold files
    for (const file of lesson.workspace.scaffold) {
      const filePath = join(root, file.path);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, file.content, 'utf-8');
    }

    // Create venv
    const venvPath = join(root, VENV_DIR);
    const pythonCmd = this.findPython(resolved.python);
    execSync(`${pythonCmd} -m venv "${venvPath}"`, {
      cwd: root,
      stdio: 'pipe',
      timeout: 30000,
    });

    // Install requirements
    if (resolved.requirements.length > 0) {
      const pipPath = this.getPipPath(venvPath);
      const reqs = resolved.requirements.join(' ');
      execSync(`"${pipPath}" install ${reqs}`, {
        cwd: root,
        stdio: 'pipe',
        timeout: 120000,
      });
    }

    return {
      type: 'venv',
      workspaceRoot: root,
      lessonId: lesson.id,
      venvPath,
      active: true,
    };
  }

  async reset(state: RuntimeState, lesson: Lesson): Promise<RuntimeState> {
    return this.setup(lesson, state.workspaceRoot);
  }

  async teardown(state: RuntimeState): Promise<void> {
    if (existsSync(state.workspaceRoot)) {
      rmSync(state.workspaceRoot, { recursive: true, force: true });
    }
    state.active = false;
  }

  getWorkdir(state: RuntimeState): string {
    return state.workspaceRoot;
  }

  getEnv(state: RuntimeState): Record<string, string> {
    if (!state.venvPath) return {};
    const binDir = process.platform === 'win32'
      ? join(state.venvPath, 'Scripts')
      : join(state.venvPath, 'bin');
    return {
      VIRTUAL_ENV: state.venvPath,
      PATH: `${binDir}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}`,
    };
  }

  wrapCommand(state: RuntimeState, command: string): string {
    if (!state.venvPath) return command;

    // On Windows, activate via Scripts; on Unix, via bin
    if (process.platform === 'win32') {
      const activate = join(state.venvPath, 'Scripts', 'activate.bat');
      return `"${activate}" && ${command}`;
    }
    const activate = join(state.venvPath, 'bin', 'activate');
    return `source "${activate}" && ${command}`;
  }

  /** Find the best Python executable matching the requested version */
  private findPython(requestedVersion: string): string {
    // Try version-specific first
    const candidates = [
      `python${requestedVersion}`,
      'python3',
      'python',
    ];

    for (const cmd of candidates) {
      try {
        const version = execSync(`${cmd} --version`, { stdio: 'pipe', encoding: 'utf-8' });
        if (version.includes(requestedVersion) || !requestedVersion) {
          return cmd;
        }
      } catch {
        // Try next
      }
    }

    // Fall back to whatever python3 is available
    return 'python3';
  }

  /** Get the pip executable path inside the venv */
  private getPipPath(venvPath: string): string {
    return process.platform === 'win32'
      ? join(venvPath, 'Scripts', 'pip.exe')
      : join(venvPath, 'bin', 'pip');
  }
}
