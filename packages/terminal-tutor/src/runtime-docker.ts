/**
 * Docker Runtime Adapter — strongest isolation tier.
 *
 * For lessons that need:
 * - Full filesystem reset guarantees
 * - Service/port scenarios
 * - Destructive command practice (safe because it's a container)
 * - Network isolation
 * - Deterministic, reproducible environments
 *
 * The docker adapter:
 * - Pulls the lesson image if needed
 * - Creates a container with the workspace mounted at /workspace
 * - Optionally disables network (--network none)
 * - Wraps all commands as `docker exec`
 * - Resets by stopping + removing + recreating the container
 * - Teardown removes the container and workspace
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import type { RuntimeAdapter, RuntimeState, Lesson } from './types.js';

const WORKSPACE_ROOT = 'terminal-tutor-workspace';
const CONTAINER_WORKDIR = '/workspace';

export class DockerRuntime implements RuntimeAdapter {
  readonly type = 'docker' as const;

  async isAvailable(): Promise<boolean> {
    try {
      execSync('docker info', { stdio: 'pipe', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async setup(lesson: Lesson, workspaceRoot: string): Promise<RuntimeState> {
    const spec = lesson.runtime;
    const resolved = {
      image: spec?.image ?? 'python:3.12-slim',
      requirements: spec?.requirements ?? [],
      network: spec?.network ?? false,
      writable_paths: spec?.writable_paths ?? ['/workspace'],
    };
    const root = workspaceRoot || join(tmpdir(), WORKSPACE_ROOT, lesson.id);

    // Clean slate on host
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
    }
    mkdirSync(root, { recursive: true });

    // Scaffold files on host (will be mounted into container)
    for (const file of lesson.workspace.scaffold) {
      const filePath = join(root, file.path);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, file.content, 'utf-8');
    }

    // Pull image if needed
    try {
      execSync(`docker image inspect ${resolved.image}`, { stdio: 'pipe' });
    } catch {
      execSync(`docker pull ${resolved.image}`, { stdio: 'pipe', timeout: 300000 });
    }

    // Build docker run command
    const containerName = `tt-${lesson.id}-${Date.now()}`;
    const args: string[] = [
      'docker', 'run', '-d',
      '--name', containerName,
      '-w', CONTAINER_WORKDIR,
      '-v', `${root.replace(/\\/g, '/')}:${CONTAINER_WORKDIR}`,
    ];

    // Network isolation
    if (!resolved.network) {
      args.push('--network', 'none');
    }

    // Writable paths (set as tmpfs for paths outside workspace)
    for (const wp of resolved.writable_paths) {
      if (wp !== CONTAINER_WORKDIR && wp !== '/workspace') {
        args.push('--tmpfs', `${wp}:rw`);
      }
    }

    // Image + keep-alive command
    args.push(resolved.image, 'tail', '-f', '/dev/null');

    const containerId = execSync(args.join(' '), {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000,
    }).trim();

    // Install requirements inside container
    if (resolved.requirements.length > 0) {
      const reqs = resolved.requirements.join(' ');
      execSync(
        `docker exec ${containerId} pip install ${reqs}`,
        { stdio: 'pipe', timeout: 120000 },
      );
    }

    return {
      type: 'docker',
      workspaceRoot: root,
      lessonId: lesson.id,
      containerId,
      active: true,
    };
  }

  async reset(state: RuntimeState, lesson: Lesson): Promise<RuntimeState> {
    // Stop and remove existing container
    await this.teardown(state);
    // Recreate from scratch
    return this.setup(lesson, state.workspaceRoot);
  }

  async teardown(state: RuntimeState): Promise<void> {
    if (state.containerId) {
      try {
        execSync(`docker rm -f ${state.containerId}`, { stdio: 'pipe', timeout: 15000 });
      } catch {
        // Container might already be gone
      }
    }
    if (existsSync(state.workspaceRoot)) {
      rmSync(state.workspaceRoot, { recursive: true, force: true });
    }
    state.active = false;
  }

  getWorkdir(_state: RuntimeState): string {
    // Commands run inside the container at /workspace
    return CONTAINER_WORKDIR;
  }

  getEnv(_state: RuntimeState): Record<string, string> {
    // Environment is managed by the container
    return {};
  }

  wrapCommand(state: RuntimeState, command: string): string {
    if (!state.containerId) {
      throw new Error('Docker runtime: no container ID — was setup() called?');
    }
    // Escape single quotes in command for shell pass-through
    const escaped = command.replace(/'/g, "'\\''");
    return `docker exec -w ${CONTAINER_WORKDIR} ${state.containerId} sh -c '${escaped}'`;
  }
}
