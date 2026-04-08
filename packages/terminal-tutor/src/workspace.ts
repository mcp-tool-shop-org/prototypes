/**
 * Workspace Engine — isolated practice directories with reset support.
 *
 * Workspace Law:
 * 1. Every lesson gets its own temp directory under a workspace root.
 * 2. Scaffold files are created from the lesson spec.
 * 3. Commands are validated to operate inside the workspace before execution.
 * 4. Reset recreates the workspace from the lesson scaffold.
 * 5. Cleanup removes the workspace entirely.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import type { Lesson, WorkspaceState, SafetySpec } from './types.js';

const WORKSPACE_ROOT_NAME = 'terminal-tutor-workspace';

/** Get the workspace root for a given base (or use temp dir) */
export function getWorkspaceRoot(baseDir?: string): string {
  const base = baseDir || tmpdir();
  return join(base, WORKSPACE_ROOT_NAME);
}

/** Create an isolated workspace for a lesson */
export function createWorkspace(lesson: Lesson, baseDir?: string): WorkspaceState {
  const root = join(getWorkspaceRoot(baseDir), lesson.id);

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
    root,
    lessonId: lesson.id,
    initialized: true,
  };
}

/** Reset a workspace to its original scaffold state */
export function resetWorkspace(lesson: Lesson, workspace: WorkspaceState): WorkspaceState {
  return createWorkspace(lesson, dirname(dirname(workspace.root)));
}

/** Remove a workspace entirely */
export function cleanupWorkspace(workspace: WorkspaceState): void {
  if (existsSync(workspace.root)) {
    rmSync(workspace.root, { recursive: true, force: true });
  }
}

// ── Safety: Command Boundary Checking ────────────────────────────

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether a command is safe to execute within the workspace.
 *
 * This is defense-in-depth — the tutor runner also sets cwd to the
 * workspace root, but this catches commands that reference paths
 * outside the boundary.
 */
export function checkCommandSafety(
  command: string,
  safety: SafetySpec,
  workspaceRoot: string,
): SafetyCheckResult {
  // Check blocked patterns
  for (const pattern of safety.blocked_patterns) {
    if (command.includes(pattern)) {
      return {
        allowed: false,
        reason: `Blocked: command contains "${pattern}". This command is restricted for safety.`,
      };
    }
  }

  // Workspace-only enforcement
  if (safety.workspace_only) {
    // Check for absolute paths that leave the workspace
    const absPathMatch = command.match(/(?:^|\s)(\/[^\s]+|[A-Z]:\\[^\s]+)/g);
    if (absPathMatch) {
      for (const match of absPathMatch) {
        const path = match.trim();
        const resolved = resolve(workspaceRoot, path);
        const rel = relative(workspaceRoot, resolved);
        if (rel.startsWith('..') || resolve(resolved) !== resolve(join(workspaceRoot, rel))) {
          return {
            allowed: false,
            reason: `Blocked: path "${path}" is outside the lesson workspace. Stay inside the practice directory.`,
          };
        }
      }
    }

    // Check for cd commands that escape
    const cdMatch = command.match(/cd\s+([^\s;&|]+)/);
    if (cdMatch) {
      const target = cdMatch[1];
      if (target === '/' || target.startsWith('..') || target.match(/^[A-Z]:\\/i)) {
        // Allow "cd .." only if it stays within workspace (can't know for sure, so block)
        if (target.startsWith('..')) {
          return {
            allowed: false,
            reason: 'Blocked: "cd .." might leave the workspace. Use absolute paths within the practice directory.',
          };
        }
        return {
          allowed: false,
          reason: `Blocked: "cd ${target}" would leave the lesson workspace.`,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Resolve a file path relative to the workspace root.
 * Returns null if the path escapes the workspace.
 */
export function resolveWorkspacePath(workspaceRoot: string, filePath: string): string | null {
  const resolved = resolve(workspaceRoot, filePath);
  const rel = relative(workspaceRoot, resolved);
  if (rel.startsWith('..') || rel.startsWith('/') || /^[A-Z]:\\/i.test(rel)) {
    return null;
  }
  return resolved;
}
