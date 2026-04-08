/**
 * MCP File Forge - Sandbox Security Layer
 *
 * Path validation and access control for file operations.
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { minimatch } from 'minimatch';
import type { SandboxConfig, FileForgeError } from '../types.js';

/**
 * Sandbox manager for validating and controlling file access.
 */
export class Sandbox {
  private config: SandboxConfig;
  private resolvedAllowedPaths: string[] = [];
  private initialized = false;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = {
      allowed_paths: config.allowed_paths ?? ['.'],
      denied_paths: config.denied_paths,
      follow_symlinks: config.follow_symlinks ?? false,
      max_file_size: config.max_file_size ?? 104857600, // 100MB
      max_depth: config.max_depth ?? 20,
    };
  }

  /**
   * Initialize the sandbox by resolving all allowed paths to absolute paths.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.resolvedAllowedPaths = await Promise.all(
      this.config.allowed_paths.map(async (p) => {
        const resolved = path.resolve(p);
        // Verify the path exists
        try {
          await fs.access(resolved);
          return resolved;
        } catch {
          // Path doesn't exist yet, but we'll still allow it
          return resolved;
        }
      })
    );

    this.initialized = true;
  }

  /**
   * Check if a path is within the allowed sandbox paths.
   */
  isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    const normalized = path.normalize(resolved);

    // Check if path is within any allowed path
    const isWithinAllowed = this.resolvedAllowedPaths.some((allowedPath) => {
      const normalizedAllowed = path.normalize(allowedPath);
      return (
        normalized === normalizedAllowed ||
        normalized.startsWith(normalizedAllowed + path.sep)
      );
    });

    if (!isWithinAllowed) {
      return false;
    }

    // Check if path matches any denied pattern
    if (this.config.denied_paths) {
      for (const pattern of this.config.denied_paths) {
        if (minimatch(normalized, pattern, { dot: true, nocase: true })) {
          return false;
        }
        // Also check relative path
        const relativePath = path.relative(process.cwd(), normalized);
        if (minimatch(relativePath, pattern, { dot: true, nocase: true })) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate a path and return error if not allowed.
   */
  async validatePath(targetPath: string): Promise<FileForgeError | null> {
    await this.initialize();

    const resolved = path.resolve(targetPath);

    // Check path traversal attempts
    if (this.hasPathTraversal(targetPath)) {
      return {
        code: 'PATH_OUTSIDE_SANDBOX',
        message: 'Path traversal detected',
        details: {
          path: targetPath,
        },
      };
    }

    // Check if path is allowed
    if (!this.isPathAllowed(resolved)) {
      return {
        code: 'PATH_OUTSIDE_SANDBOX',
        message: `Path is outside allowed directories`,
        details: {
          path: resolved,
          allowed_paths: this.resolvedAllowedPaths,
        },
      };
    }

    // Check symlinks if not allowed
    if (!this.config.follow_symlinks) {
      try {
        const lstat = await fs.lstat(resolved);
        if (lstat.isSymbolicLink()) {
          const realPath = await fs.realpath(resolved);
          if (!this.isPathAllowed(realPath)) {
            return {
              code: 'PATH_OUTSIDE_SANDBOX',
              message: 'Symlink points outside allowed directories',
              details: {
                symlink: resolved,
                target: realPath,
              },
            };
          }
        }
      } catch {
        // File doesn't exist yet, which is OK for write operations
      }
    }

    return null;
  }

  /**
   * Check if a path contains traversal attempts.
   */
  private hasPathTraversal(targetPath: string): boolean {
    const normalized = path.normalize(targetPath);
    const parts = normalized.split(path.sep);

    // Check for .. that would escape
    let depth = 0;
    for (const part of parts) {
      if (part === '..') {
        depth--;
        if (depth < 0) return true;
      } else if (part && part !== '.') {
        depth++;
      }
    }

    return false;
  }

  /**
   * Validate file size against limits.
   */
  validateFileSize(size: number): FileForgeError | null {
    if (size > this.config.max_file_size) {
      return {
        code: 'FILE_TOO_LARGE',
        message: `File size ${size} bytes exceeds limit of ${this.config.max_file_size} bytes`,
        details: {
          size,
          limit: this.config.max_file_size,
        },
      };
    }
    return null;
  }

  /**
   * Validate recursion depth.
   */
  validateDepth(depth: number): FileForgeError | null {
    if (depth > this.config.max_depth) {
      return {
        code: 'DEPTH_EXCEEDED',
        message: `Recursion depth ${depth} exceeds limit of ${this.config.max_depth}`,
        details: {
          depth,
          limit: this.config.max_depth,
        },
      };
    }
    return null;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  /**
   * Get resolved allowed paths.
   */
  getAllowedPaths(): string[] {
    return [...this.resolvedAllowedPaths];
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(config: Partial<SandboxConfig>): void {
    if (config.allowed_paths) {
      this.config.allowed_paths = config.allowed_paths;
      this.initialized = false; // Force re-initialization
    }
    if (config.denied_paths !== undefined) {
      this.config.denied_paths = config.denied_paths;
    }
    if (config.follow_symlinks !== undefined) {
      this.config.follow_symlinks = config.follow_symlinks;
    }
    if (config.max_file_size !== undefined) {
      this.config.max_file_size = config.max_file_size;
    }
    if (config.max_depth !== undefined) {
      this.config.max_depth = config.max_depth;
    }
  }
}

/**
 * Global sandbox instance.
 */
let globalSandbox: Sandbox | null = null;

/**
 * Get or create the global sandbox instance.
 */
export function getSandbox(config?: Partial<SandboxConfig>): Sandbox {
  if (!globalSandbox) {
    globalSandbox = new Sandbox(config);
  }
  return globalSandbox;
}

/**
 * Reset the global sandbox (useful for testing).
 */
export function resetSandbox(): void {
  globalSandbox = null;
}
