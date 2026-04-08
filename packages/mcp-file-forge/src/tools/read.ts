/**
 * MCP File Forge - File Reading Tools
 *
 * Tools for reading files and directories.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type {
  ReadFileInput,
  ReadDirectoryInput,
  DirectoryEntry,
  ToolResult,
} from '../types.js';
import { ReadFileInputSchema, ReadDirectoryInputSchema } from '../types.js';

/**
 * Read a file and return its contents.
 */
async function readFileImpl(input: ReadFileInput): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    // Check if file exists
    const stats = await fs.stat(absolutePath);

    if (!stats.isFile()) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'INVALID_PATH',
              message: `Path is not a file: ${input.path}`,
            }),
          },
        ],
      };
    }

    // Check file size
    const maxBytes = input.max_size_kb * 1024;
    if (stats.size > maxBytes) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_TOO_LARGE',
              message: `File size ${stats.size} bytes exceeds limit of ${maxBytes} bytes`,
              details: {
                file_size: stats.size,
                limit: maxBytes,
              },
            }),
          },
        ],
      };
    }

    // Read file content
    const content = await fs.readFile(absolutePath, {
      encoding: input.encoding as BufferEncoding,
    });

    // Handle line ranges if specified
    let result = content;
    if (input.start_line !== undefined || input.end_line !== undefined) {
      const lines = content.split('\n');
      const startIdx = (input.start_line ?? 1) - 1;
      const endIdx = input.end_line ?? lines.length;
      result = lines.slice(startIdx, endIdx).join('\n');
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
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
              message: `File not found: ${input.path}`,
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
            message: `Error reading file: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Read directory contents.
 */
async function readDirectoryImpl(
  input: ReadDirectoryInput,
  currentDepth = 0
): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(input.path);

    // Check if directory exists
    const stats = await fs.stat(absolutePath);

    if (!stats.isDirectory()) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'INVALID_PATH',
              message: `Path is not a directory: ${input.path}`,
            }),
          },
        ],
      };
    }

    // Check depth limit
    if (input.recursive && currentDepth >= input.max_depth) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'DEPTH_EXCEEDED',
              message: `Maximum recursion depth ${input.max_depth} exceeded`,
            }),
          },
        ],
      };
    }

    // Read directory entries
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const results: DirectoryEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files if not requested
      if (!input.include_hidden && entry.name.startsWith('.')) {
        continue;
      }

      // Apply glob pattern filter if specified
      if (input.pattern) {
        // Simple glob matching (basic implementation)
        const regex = globToRegex(input.pattern);
        if (!regex.test(entry.name)) {
          continue;
        }
      }

      const entryPath = path.join(absolutePath, entry.name);
      const isFile = entry.isFile();
      const isDirectory = entry.isDirectory();

      const dirEntry: DirectoryEntry = {
        name: entry.name,
        path: entryPath,
        isFile,
        isDirectory,
      };

      // Get size for files
      if (isFile) {
        try {
          const entryStats = await fs.stat(entryPath);
          dirEntry.size = entryStats.size;
        } catch {
          // Ignore stat errors for individual files
        }
      }

      results.push(dirEntry);

      // Recurse into subdirectories if requested
      if (input.recursive && isDirectory) {
        const subResult = await readDirectoryImpl(
          { ...input, path: entryPath },
          currentDepth + 1
        );

        if (!('isError' in subResult)) {
          const subEntries = JSON.parse(subResult.content[0].text) as DirectoryEntry[];
          results.push(...subEntries);
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
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
              message: `Directory not found: ${input.path}`,
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
            message: `Error reading directory: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Read multiple files at once.
 */
async function readMultipleImpl(input: {
  paths: string[];
  encoding?: string;
  fail_on_error?: boolean;
}): Promise<ToolResult> {
  const results: Array<{
    path: string;
    success: boolean;
    content?: string;
    error?: string;
  }> = [];

  for (const filePath of input.paths) {
    const result = await readFileImpl({
      path: filePath,
      encoding: input.encoding ?? 'utf-8',
      max_size_kb: 10240,
    });

    if ('isError' in result && result.isError) {
      if (input.fail_on_error) {
        return result;
      }
      results.push({
        path: filePath,
        success: false,
        error: result.content[0].text,
      });
    } else {
      results.push({
        path: filePath,
        success: true,
        content: result.content[0].text,
      });
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2),
      },
    ],
  };
}

/**
 * Convert a simple glob pattern to a regex.
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Register file reading tools with the MCP server.
 */
export function registerReadTools(server: McpServer): void {
  // read_file tool
  server.tool(
    'read_file',
    'Read the contents of a file',
    {
      path: z.string().describe('Path to the file'),
      encoding: z.string().optional().describe('File encoding (default: utf-8)'),
      start_line: z.number().optional().describe('Start line (1-indexed)'),
      end_line: z.number().optional().describe('End line (inclusive)'),
      max_size_kb: z.number().optional().describe('Max file size in KB (default: 10240)'),
    },
    async (args) => {
      const input = ReadFileInputSchema.parse(args);
      return await readFileImpl(input);
    }
  );

  // read_directory tool
  server.tool(
    'read_directory',
    'List contents of a directory',
    {
      path: z.string().describe('Path to the directory'),
      recursive: z.boolean().optional().describe('Include subdirectories'),
      max_depth: z.number().optional().describe('Max recursion depth'),
      include_hidden: z.boolean().optional().describe('Include hidden files'),
      pattern: z.string().optional().describe('Glob pattern filter'),
    },
    async (args) => {
      const input = ReadDirectoryInputSchema.parse(args);
      return await readDirectoryImpl(input);
    }
  );

  // read_multiple tool
  server.tool(
    'read_multiple',
    'Read multiple files at once',
    {
      paths: z.array(z.string()).describe('Array of file paths'),
      encoding: z.string().optional().describe('File encoding'),
      fail_on_error: z.boolean().optional().describe('Fail if any file errors'),
    },
    async (args) => {
      return await readMultipleImpl(args);
    }
  );
}
