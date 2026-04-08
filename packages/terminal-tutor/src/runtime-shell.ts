/**
 * Shell Runtime Adapter — the default, lightest-weight runtime.
 *
 * Creates a temp directory, scaffolds files, runs commands directly
 * on the host shell. This is the v1.0 behavior extracted into the
 * adapter interface.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import type { RuntimeAdapter, RuntimeState, Lesson } from './types.js';

const WORKSPACE_ROOT = 'terminal-tutor-workspace';

export class ShellRuntime implements RuntimeAdapter {
  readonly type = 'shell' as const;

  async isAvailable(): Promise<boolean> {
    // Shell is always available
    return true;
  }

  async setup(lesson: Lesson, workspaceRoot: string): Promise<RuntimeState> {
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

    return {
      type: 'shell',
      workspaceRoot: root,
      lessonId: lesson.id,
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

  getEnv(_state: RuntimeState): Record<string, string> {
    return {};
  }

  wrapCommand(_state: RuntimeState, command: string): string {
    // Shell runs commands directly — no wrapping
    return command;
  }
}
