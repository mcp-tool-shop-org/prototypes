/**
 * MCP File Forge - File Metadata Tools
 *
 * Tools for getting file statistics and checking existence.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { FileStatInput, FileExistsInput, FileStat, ToolResult } from '../types.js';
import { FileStatInputSchema, FileExistsInputSchema } from '../types.js';

/**
 * Format bytes into human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file or directory statistics.
 */
async function fileStatImpl(input: FileStatInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    const stats = await fs.stat(absolutePath);
    const lstat = await fs.lstat(absolutePath);

    const result: FileStat = {
      path: absolutePath,
      name: path.basename(absolutePath),
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymlink: lstat.isSymbolicLink(),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
    };

    // Add formatted size for convenience
    const formattedResult = {
      ...result,
      sizeFormatted: formatBytes(stats.size),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedResult, null, 2),
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
            message: `Error getting stats: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Check if a file or directory exists.
 */
async function fileExistsImpl(input: FileExistsInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    try {
      const stats = await fs.stat(absolutePath);

      // Check type if specified
      if (input.type === 'file' && !stats.isFile()) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                exists: false,
                path: absolutePath,
                reason: 'Path exists but is not a file',
                actualType: stats.isDirectory() ? 'directory' : 'other',
              }),
            },
          ],
        };
      }

      if (input.type === 'directory' && !stats.isDirectory()) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                exists: false,
                path: absolutePath,
                reason: 'Path exists but is not a directory',
                actualType: stats.isFile() ? 'file' : 'other',
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              exists: true,
              path: absolutePath,
              isFile: stats.isFile(),
              isDirectory: stats.isDirectory(),
            }),
          },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              exists: false,
              path: absolutePath,
            }),
          },
        ],
      };
    }
  } catch (error) {
    const err = error as Error;

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error checking existence: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Get disk usage for a directory.
 */
async function getDiskUsageImpl(input: { path: string; max_depth?: number }): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);
    const maxDepth = input.max_depth ?? 1;

    const stats = await fs.stat(absolutePath);

    if (!stats.isDirectory()) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              path: absolutePath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              isFile: true,
            }),
          },
        ],
      };
    }

    // Calculate directory size
    const usage = await calculateDirSize(absolutePath, 0, maxDepth);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              path: absolutePath,
              totalSize: usage.totalSize,
              totalSizeFormatted: formatBytes(usage.totalSize),
              fileCount: usage.fileCount,
              directoryCount: usage.directoryCount,
              breakdown: usage.breakdown,
            },
            null,
            2
          ),
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
              message: `Path not found: ${input.path}`,
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
            message: `Error calculating disk usage: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Recursively calculate directory size.
 */
async function calculateDirSize(
  dirPath: string,
  currentDepth: number,
  maxDepth: number
): Promise<{
  totalSize: number;
  fileCount: number;
  directoryCount: number;
  breakdown: Array<{ name: string; size: number; sizeFormatted: string }>;
}> {
  let totalSize = 0;
  let fileCount = 0;
  let directoryCount = 0;
  const breakdown: Array<{ name: string; size: number; sizeFormatted: string }> = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      try {
        if (entry.isFile()) {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
          fileCount++;

          if (currentDepth < maxDepth) {
            breakdown.push({
              name: entry.name,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
            });
          }
        } else if (entry.isDirectory()) {
          directoryCount++;

          const subResult = await calculateDirSize(entryPath, currentDepth + 1, maxDepth);
          totalSize += subResult.totalSize;
          fileCount += subResult.fileCount;
          directoryCount += subResult.directoryCount;

          if (currentDepth < maxDepth) {
            breakdown.push({
              name: entry.name + '/',
              size: subResult.totalSize,
              sizeFormatted: formatBytes(subResult.totalSize),
            });
          }
        }
      } catch {
        // Skip entries we can't access
      }
    }
  } catch {
    // Ignore permission errors on directories
  }

  // Sort breakdown by size descending
  breakdown.sort((a, b) => b.size - a.size);

  return { totalSize, fileCount, directoryCount, breakdown };
}

/**
 * Compare two files or directories.
 */
async function compareFilesImpl(input: {
  path1: string;
  path2: string;
}): Promise<ToolResult> {
  try {
    const path1 = path.resolve(input.path1);
    const path2 = path.resolve(input.path2);

    const [stats1, stats2] = await Promise.all([
      fs.stat(path1).catch(() => null),
      fs.stat(path2).catch(() => null),
    ]);

    if (!stats1) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `First path not found: ${input.path1}`,
            }),
          },
        ],
      };
    }

    if (!stats2) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `Second path not found: ${input.path2}`,
            }),
          },
        ],
      };
    }

    const comparison = {
      path1,
      path2,
      sameType: stats1.isFile() === stats2.isFile(),
      sameSize: stats1.size === stats2.size,
      file1: {
        isFile: stats1.isFile(),
        size: stats1.size,
        sizeFormatted: formatBytes(stats1.size),
        modified: stats1.mtime.toISOString(),
      },
      file2: {
        isFile: stats2.isFile(),
        size: stats2.size,
        sizeFormatted: formatBytes(stats2.size),
        modified: stats2.mtime.toISOString(),
      },
      newerFile: stats1.mtime > stats2.mtime ? 'path1' : 'path2',
      sizeDifference: stats1.size - stats2.size,
      sizeDifferenceFormatted: formatBytes(Math.abs(stats1.size - stats2.size)),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  } catch (error) {
    const err = error as Error;

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: 'UNKNOWN_ERROR',
            message: `Error comparing files: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Register file metadata tools with the MCP server.
 */
export function registerMetadataTools(server: McpServer): void {
  // file_stat tool
  server.tool(
    'file_stat',
    'Get file or directory statistics',
    {
      path: z.string().describe('Path to file or directory'),
    },
    async (args) => {
      const input = FileStatInputSchema.parse(args);
      return await fileStatImpl(input);
    }
  );

  // file_exists tool
  server.tool(
    'file_exists',
    'Check if a file or directory exists',
    {
      path: z.string().describe('Path to check'),
      type: z.enum(['file', 'directory', 'any']).optional().describe('Type to check for'),
    },
    async (args) => {
      const input = FileExistsInputSchema.parse(args);
      return await fileExistsImpl(input);
    }
  );

  // get_disk_usage tool
  server.tool(
    'get_disk_usage',
    'Get disk usage for a directory',
    {
      path: z.string().describe('Path to directory'),
      max_depth: z.number().optional().describe('Max depth for breakdown'),
    },
    async (args) => {
      return await getDiskUsageImpl(args);
    }
  );

  // compare_files tool
  server.tool(
    'compare_files',
    'Compare two files or directories',
    {
      path1: z.string().describe('First path'),
      path2: z.string().describe('Second path'),
    },
    async (args) => {
      return await compareFilesImpl(args);
    }
  );
}
