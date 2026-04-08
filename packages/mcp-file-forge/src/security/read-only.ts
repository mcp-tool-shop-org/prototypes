/**
 * MCP File Forge - Read-Only Mode
 *
 * Controls whether write operations are allowed.
 */

import type { FileForgeError } from '../types.js';

/**
 * Global read-only state.
 */
let readOnlyMode = false;

/**
 * Enable read-only mode (disables all write operations).
 */
export function enableReadOnlyMode(): void {
  readOnlyMode = true;
}

/**
 * Disable read-only mode (allows write operations).
 */
export function disableReadOnlyMode(): void {
  readOnlyMode = false;
}

/**
 * Check if read-only mode is enabled.
 */
export function isReadOnlyMode(): boolean {
  return readOnlyMode;
}

/**
 * Validate that a write operation is allowed.
 * Returns an error if in read-only mode.
 */
export function validateWriteAllowed(): FileForgeError | null {
  if (readOnlyMode) {
    return {
      code: 'WRITE_DISABLED',
      message: 'Write operations are disabled in read-only mode',
      details: {
        mode: 'read-only',
        hint: 'Set MCP_FILE_FORGE_READ_ONLY=false to enable write operations',
      },
    };
  }
  return null;
}

/**
 * List of tool names that require write access.
 */
export const WRITE_TOOLS = [
  'write_file',
  'create_directory',
  'copy_file',
  'move_file',
  'delete_file',
  'scaffold_project',
] as const;

/**
 * Check if a tool requires write access.
 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.includes(toolName as (typeof WRITE_TOOLS)[number]);
}
