/**
 * MCP File Forge - File Writing Tools
 *
 * Tools for writing, copying, moving, and deleting files.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type {
  WriteFileInput,
  CreateDirectoryInput,
  CopyFileInput,
  MoveFileInput,
  DeleteFileInput,
  ToolResult,
} from '../types.js';
import {
  WriteFileInputSchema,
  CreateDirectoryInputSchema,
  CopyFileInputSchema,
  MoveFileInputSchema,
  DeleteFileInputSchema,
} from '../types.js';

/**
 * Write content to a file.
 */
async function writeFileImpl(input: WriteFileInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    // Check if file exists
    let exists = false;
    try {
      await fs.access(absolutePath);
      exists = true;
    } catch {
      // File doesn't exist
    }

    // Handle overwrite logic
    if (exists && !input.overwrite) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'ALREADY_EXISTS',
              message: `File already exists and overwrite is false: ${input.path}`,
            }),
          },
        ],
      };
    }

    // Create backup if requested
    if (exists && input.backup) {
      const backupPath = `${absolutePath}.bak`;
      await fs.copyFile(absolutePath, backupPath);
    }

    // Create parent directories if requested
    if (input.create_dirs) {
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });
    }

    // Write the file
    await fs.writeFile(absolutePath, input.content, {
      encoding: input.encoding as BufferEncoding,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: absolutePath,
            bytes_written: Buffer.byteLength(input.content, input.encoding as BufferEncoding),
          }),
        },
      ],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'EACCES') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'PERMISSION_DENIED',
              message: `Permission denied: ${input.path}`,
            }),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error writing file: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Create a directory.
 */
async function createDirectoryImpl(input: CreateDirectoryInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    await fs.mkdir(absolutePath, { recursive: input.recursive });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: absolutePath,
          }),
        },
      ],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'EEXIST') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: path.resolve(input.path),
              note: 'Directory already exists',
            }),
          },
        ],
      };
    }

    if (err.code === 'EACCES') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'PERMISSION_DENIED',
              message: `Permission denied: ${input.path}`,
            }),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error creating directory: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Copy a file or directory.
 */
async function copyFileImpl(input: CopyFileInput): Promise<ToolResult> {
  try {
    const srcPath = path.resolve(input.source);
    const destPath = path.resolve(input.destination);

    // Check if source exists
    const srcStats = await fs.stat(srcPath);

    // Check if destination exists
    let destExists = false;
    try {
      await fs.access(destPath);
      destExists = true;
    } catch {
      // Destination doesn't exist
    }

    if (destExists && !input.overwrite) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'ALREADY_EXISTS',
              message: `Destination already exists and overwrite is false: ${input.destination}`,
            }),
          },
        ],
      };
    }

    if (srcStats.isDirectory()) {
      if (!input.recursive) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                code: 'INVALID_PATH',
                message: 'Source is a directory but recursive is false',
              }),
            },
          ],
        };
      }

      // Copy directory recursively
      await copyDirRecursive(srcPath, destPath);
    } else {
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Copy file
      await fs.copyFile(srcPath, destPath);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: srcPath,
            destination: destPath,
          }),
        },
      ],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'ENOENT') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `Source not found: ${input.source}`,
            }),
          },
        ],
      };
    }

    if (err.code === 'EACCES') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'PERMISSION_DENIED',
              message: `Permission denied`,
            }),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error copying: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Recursively copy a directory.
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Move or rename a file or directory.
 */
async function moveFileImpl(input: MoveFileInput): Promise<ToolResult> {
  try {
    const srcPath = path.resolve(input.source);
    const destPath = path.resolve(input.destination);

    // Check if source exists
    await fs.stat(srcPath);

    // Check if destination exists
    let destExists = false;
    try {
      await fs.access(destPath);
      destExists = true;
    } catch {
      // Destination doesn't exist
    }

    if (destExists && !input.overwrite) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'ALREADY_EXISTS',
              message: `Destination already exists and overwrite is false: ${input.destination}`,
            }),
          },
        ],
      };
    }

    // Ensure parent directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    // Move/rename
    await fs.rename(srcPath, destPath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: srcPath,
            destination: destPath,
          }),
        },
      ],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'ENOENT') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `Source not found: ${input.source}`,
            }),
          },
        ],
      };
    }

    if (err.code === 'EACCES') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'PERMISSION_DENIED',
              message: `Permission denied`,
            }),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error moving: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Delete a file or directory.
 */
async function deleteFileImpl(input: DeleteFileInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    // Check what type of path this is
    const stats = await fs.stat(absolutePath);

    if (stats.isDirectory()) {
      if (!input.recursive) {
        // Check if directory is empty
        const entries = await fs.readdir(absolutePath);
        if (entries.length > 0) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  code: 'DIRECTORY_NOT_EMPTY',
                  message: `Directory is not empty and recursive is false: ${input.path}`,
                }),
              },
            ],
          };
        }
      }

      await fs.rm(absolutePath, { recursive: input.recursive, force: input.force });
    } else {
      await fs.unlink(absolutePath);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            path: absolutePath,
          }),
        },
      ],
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (input.force) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: path.resolve(input.path),
              note: 'Force mode - errors ignored',
            }),
          },
        ],
      };
    }

    if (err.code === 'ENOENT') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `Path not found: ${input.path}`,
            }),
          },
        ],
      };
    }

    if (err.code === 'EACCES') {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'PERMISSION_DENIED',
              message: `Permission denied: ${input.path}`,
            }),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error deleting: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Register file writing tools with the MCP server.
 */
export function registerWriteTools(server: McpServer): void {
  // write_file tool
  server.tool(
    'write_file',
    'Write content to a file',
    {
      path: z.string().describe('Path to write to'),
      content: z.string().describe('Content to write'),
      encoding: z.string().optional().describe('File encoding (default: utf-8)'),
      create_dirs: z.boolean().optional().describe('Create parent directories'),
      overwrite: z.boolean().optional().describe('Overwrite if exists'),
      backup: z.boolean().optional().describe('Create backup before overwrite'),
    },
    async (args) => {
      const input = WriteFileInputSchema.parse(args);
      return await writeFileImpl(input);
    }
  );

  // create_directory tool
  server.tool(
    'create_directory',
    'Create a directory',
    {
      path: z.string().describe('Path to create'),
      recursive: z.boolean().optional().describe('Create parent directories'),
    },
    async (args) => {
      const input = CreateDirectoryInputSchema.parse(args);
      return await createDirectoryImpl(input);
    }
  );

  // copy_file tool
  server.tool(
    'copy_file',
    'Copy a file or directory',
    {
      source: z.string().describe('Source path'),
      destination: z.string().describe('Destination path'),
      overwrite: z.boolean().optional().describe('Overwrite if exists'),
      recursive: z.boolean().optional().describe('Copy directories recursively'),
    },
    async (args) => {
      const input = CopyFileInputSchema.parse(args);
      return await copyFileImpl(input);
    }
  );

  // move_file tool
  server.tool(
    'move_file',
    'Move or rename a file or directory',
    {
      source: z.string().describe('Source path'),
      destination: z.string().describe('Destination path'),
      overwrite: z.boolean().optional().describe('Overwrite if exists'),
    },
    async (args) => {
      const input = MoveFileInputSchema.parse(args);
      return await moveFileImpl(input);
    }
  );

  // delete_file tool
  server.tool(
    'delete_file',
    'Delete a file or directory',
    {
      path: z.string().describe('Path to delete'),
      recursive: z.boolean().optional().describe('Delete directories recursively'),
      force: z.boolean().optional().describe('Ignore errors'),
    },
    async (args) => {
      const input = DeleteFileInputSchema.parse(args);
      return await deleteFileImpl(input);
    }
  );
}
