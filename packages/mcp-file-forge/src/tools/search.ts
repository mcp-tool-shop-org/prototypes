/**
 * MCP File Forge - File Search Tools
 *
 * Tools for searching files by pattern and content.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GlobSearchInput, GrepSearchInput, ToolResult } from '../types.js';
import { GlobSearchInputSchema, GrepSearchInputSchema } from '../types.js';

/**
 * Result from a grep search match.
 */
interface GrepMatch {
  file: string;
  line: number;
  column: number;
  match: string;
  context?: {
    before: string[];
    after: string[];
  };
}

/**
 * Search for files matching a glob pattern.
 */
async function globSearchImpl(input: GlobSearchInput): Promise<ToolResult> {
  try {
    const basePath = input.base_path ? path.resolve(input.base_path) : process.cwd();

    // Use glob to find matching files
    const matches = await glob(input.pattern, {
      cwd: basePath,
      nodir: !input.include_dirs,
      absolute: true,
      maxDepth: 20, // Prevent excessive recursion
    });

    // Limit results
    const limitedMatches = matches.slice(0, input.max_results);

    // Get basic info for each match
    const results = await Promise.all(
      limitedMatches.map(async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          return {
            path: filePath,
            name: path.basename(filePath),
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
          };
        } catch {
          return {
            path: filePath,
            name: path.basename(filePath),
            error: 'Could not stat file',
          };
        }
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              count: results.length,
              total_matches: matches.length,
              truncated: matches.length > input.max_results,
              results,
            },
            null,
            2
          ),
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
            message: `Error in glob search: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Search file contents using regex.
 */
async function grepSearchImpl(input: GrepSearchInput): Promise<ToolResult> {
  try {
    const searchPath = input.path ? path.resolve(input.path) : process.cwd();
    const matches: GrepMatch[] = [];

    // Create regex
    const flags = input.case_sensitive ? '' : 'i';
    let regex: RegExp;
    try {
      regex = new RegExp(input.pattern, flags);
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'INVALID_PATH',
              message: `Invalid regex pattern: ${input.pattern}`,
            }),
          },
        ],
      };
    }

    // Determine files to search
    let files: string[];

    const stats = await fs.stat(searchPath);
    if (stats.isFile()) {
      files = [searchPath];
    } else {
      // Use glob to find files in directory
      const globPattern = input.glob ?? '**/*';
      files = await glob(globPattern, {
        cwd: searchPath,
        nodir: true,
        absolute: true,
        maxDepth: 20,
      });
    }

    // Search each file
    for (const file of files) {
      if (matches.length >= input.max_results) break;

      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (matches.length >= input.max_results) break;

          const line = lines[i];
          const match = regex.exec(line);

          if (match) {
            const grepMatch: GrepMatch = {
              file,
              line: i + 1,
              column: match.index + 1,
              match: line.trim(),
            };

            // Add context if requested
            if (input.context_lines > 0) {
              const beforeStart = Math.max(0, i - input.context_lines);
              const afterEnd = Math.min(lines.length, i + input.context_lines + 1);

              grepMatch.context = {
                before: lines.slice(beforeStart, i).map((l) => l.trim()),
                after: lines.slice(i + 1, afterEnd).map((l) => l.trim()),
              };
            }

            matches.push(grepMatch);
          }
        }
      } catch {
        // Skip files that can't be read (binary, permissions, etc.)
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              pattern: input.pattern,
              count: matches.length,
              truncated: matches.length >= input.max_results,
              matches,
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
            message: `Error in grep search: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Find files by content (simpler interface for grep).
 */
async function findByContentImpl(input: {
  text: string;
  path?: string;
  file_pattern?: string;
  max_results?: number;
}): Promise<ToolResult> {
  // Escape special regex characters for literal search
  const escapedText = input.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return await grepSearchImpl({
    pattern: escapedText,
    path: input.path,
    glob: input.file_pattern,
    case_sensitive: true,
    max_results: input.max_results ?? 100,
    context_lines: 0,
  });
}

/**
 * Register file search tools with the MCP server.
 */
export function registerSearchTools(server: McpServer): void {
  // glob_search tool
  server.tool(
    'glob_search',
    'Find files matching a glob pattern',
    {
      pattern: z.string().describe('Glob pattern (e.g., **/*.ts)'),
      base_path: z.string().optional().describe('Base directory for search'),
      max_results: z.number().optional().describe('Maximum results (default: 1000)'),
      include_dirs: z.boolean().optional().describe('Include directories in results'),
    },
    async (args) => {
      const input = GlobSearchInputSchema.parse(args);
      return await globSearchImpl(input);
    }
  );

  // grep_search tool
  server.tool(
    'grep_search',
    'Search file contents with regex',
    {
      pattern: z.string().describe('Regex pattern to search for'),
      path: z.string().optional().describe('File or directory to search'),
      glob: z.string().optional().describe('File pattern filter (e.g., *.ts)'),
      case_sensitive: z.boolean().optional().describe('Case sensitive search'),
      max_results: z.number().optional().describe('Maximum results (default: 100)'),
      context_lines: z.number().optional().describe('Lines of context around matches'),
    },
    async (args) => {
      const input = GrepSearchInputSchema.parse(args);
      return await grepSearchImpl(input);
    }
  );

  // find_by_content tool (simpler interface)
  server.tool(
    'find_by_content',
    'Find files containing specific text',
    {
      text: z.string().describe('Text to search for (literal, not regex)'),
      path: z.string().optional().describe('Directory to search'),
      file_pattern: z.string().optional().describe('File pattern (e.g., *.ts)'),
      max_results: z.number().optional().describe('Maximum results'),
    },
    async (args) => {
      return await findByContentImpl(args);
    }
  );
}
