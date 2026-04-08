/**
 * MCP File Forge - Type Definitions
 *
 * Core types used throughout the server.
 */

import { z } from 'zod';

// ============================================================================
// Tool Result Types
// ============================================================================

/**
 * Standard success result from a tool.
 */
export interface ToolSuccess {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * Standard error result from a tool.
 */
export interface ToolError {
  [key: string]: unknown;
  isError: true;
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export type ToolResult = ToolSuccess | ToolError;

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCode = {
  PATH_OUTSIDE_SANDBOX: 'PATH_OUTSIDE_SANDBOX',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  DEPTH_EXCEEDED: 'DEPTH_EXCEEDED',
  INVALID_ENCODING: 'INVALID_ENCODING',
  WRITE_DISABLED: 'WRITE_DISABLED',
  DIRECTORY_NOT_EMPTY: 'DIRECTORY_NOT_EMPTY',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_PATH: 'INVALID_PATH',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Structured error information.
 */
export interface FileForgeError {
  code: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// File Metadata
// ============================================================================

/**
 * File or directory statistics.
 */
export interface FileStat {
  path: string;
  name: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  created: string; // ISO 8601
  modified: string; // ISO 8601
  accessed: string; // ISO 8601
  permissions?: string; // Unix-style permissions string
}

/**
 * Directory entry (lighter than full FileStat).
 */
export interface DirectoryEntry {
  name: string;
  path: string;
  isFile: boolean;
  isDirectory: boolean;
  size?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Sandbox configuration.
 */
export const SandboxConfigSchema = z.object({
  allowed_paths: z.array(z.string()).default(['.']),
  denied_paths: z.array(z.string()).optional(),
  follow_symlinks: z.boolean().default(false),
  max_file_size: z.number().default(104857600), // 100MB
  max_depth: z.number().default(20),
});

export type SandboxConfig = z.infer<typeof SandboxConfigSchema>;

/**
 * Template configuration.
 */
export const TemplateConfigSchema = z.object({
  paths: z.array(z.string()).default(['./templates']),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

/**
 * Logging configuration.
 */
export const LogConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  file: z.string().optional(),
});

export type LogConfig = z.infer<typeof LogConfigSchema>;

/**
 * Full server configuration.
 */
export const ServerConfigSchema = z.object({
  sandbox: SandboxConfigSchema.default({}),
  templates: TemplateConfigSchema.default({}),
  logging: LogConfigSchema.default({}),
  read_only: z.boolean().default(false),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// ============================================================================
// Tool Input Schemas
// ============================================================================

// Read file input
export const ReadFileInputSchema = z.object({
  path: z.string().describe('Absolute or relative path to the file'),
  encoding: z.string().default('utf-8').describe('File encoding'),
  start_line: z.number().optional().describe('Start line (1-indexed)'),
  end_line: z.number().optional().describe('End line (inclusive)'),
  max_size_kb: z.number().default(10240).describe('Max size in KB'),
});

export type ReadFileInput = z.infer<typeof ReadFileInputSchema>;

// Read directory input
export const ReadDirectoryInputSchema = z.object({
  path: z.string().describe('Path to directory'),
  recursive: z.boolean().default(false).describe('Include subdirectories'),
  max_depth: z.number().default(5).describe('Max recursion depth'),
  include_hidden: z.boolean().default(false).describe('Include hidden files'),
  pattern: z.string().optional().describe('Glob pattern filter'),
});

export type ReadDirectoryInput = z.infer<typeof ReadDirectoryInputSchema>;

// Write file input
export const WriteFileInputSchema = z.object({
  path: z.string().describe('Path to write to'),
  content: z.string().describe('Content to write'),
  encoding: z.string().default('utf-8').describe('File encoding'),
  create_dirs: z.boolean().default(true).describe('Create parent directories'),
  overwrite: z.boolean().default(true).describe('Overwrite if exists'),
  backup: z.boolean().default(false).describe('Create backup before overwrite'),
});

export type WriteFileInput = z.infer<typeof WriteFileInputSchema>;

// Create directory input
export const CreateDirectoryInputSchema = z.object({
  path: z.string().describe('Path to create'),
  recursive: z.boolean().default(true).describe('Create parent directories'),
});

export type CreateDirectoryInput = z.infer<typeof CreateDirectoryInputSchema>;

// Copy file input
export const CopyFileInputSchema = z.object({
  source: z.string().describe('Source path'),
  destination: z.string().describe('Destination path'),
  overwrite: z.boolean().default(false).describe('Overwrite if exists'),
  recursive: z.boolean().default(true).describe('Copy directories recursively'),
});

export type CopyFileInput = z.infer<typeof CopyFileInputSchema>;

// Move file input
export const MoveFileInputSchema = z.object({
  source: z.string().describe('Source path'),
  destination: z.string().describe('Destination path'),
  overwrite: z.boolean().default(false).describe('Overwrite if exists'),
});

export type MoveFileInput = z.infer<typeof MoveFileInputSchema>;

// Delete file input
export const DeleteFileInputSchema = z.object({
  path: z.string().describe('Path to delete'),
  recursive: z.boolean().default(false).describe('Delete directories recursively'),
  force: z.boolean().default(false).describe('Ignore errors'),
});

export type DeleteFileInput = z.infer<typeof DeleteFileInputSchema>;

// Glob search input
export const GlobSearchInputSchema = z.object({
  pattern: z.string().describe('Glob pattern'),
  base_path: z.string().optional().describe('Base directory'),
  max_results: z.number().default(1000).describe('Maximum results'),
  include_dirs: z.boolean().default(false).describe('Include directories'),
});

export type GlobSearchInput = z.infer<typeof GlobSearchInputSchema>;

// Grep search input
export const GrepSearchInputSchema = z.object({
  pattern: z.string().describe('Regex pattern'),
  path: z.string().optional().describe('File or directory to search'),
  glob: z.string().optional().describe('File pattern filter'),
  case_sensitive: z.boolean().default(true).describe('Case sensitive'),
  max_results: z.number().default(100).describe('Maximum results'),
  context_lines: z.number().default(0).describe('Context lines'),
});

export type GrepSearchInput = z.infer<typeof GrepSearchInputSchema>;

// File stat input
export const FileStatInputSchema = z.object({
  path: z.string().describe('Path to file or directory'),
});

export type FileStatInput = z.infer<typeof FileStatInputSchema>;

// File exists input
export const FileExistsInputSchema = z.object({
  path: z.string().describe('Path to check'),
  type: z.enum(['file', 'directory', 'any']).default('any').describe('Type to check for'),
});

export type FileExistsInput = z.infer<typeof FileExistsInputSchema>;

// Scaffold project input
export const ScaffoldProjectInputSchema = z.object({
  template: z.string().describe('Template name or path'),
  destination: z.string().describe('Destination directory'),
  variables: z.record(z.string()).optional().describe('Template variables'),
  overwrite: z.boolean().default(false).describe('Overwrite existing'),
});

export type ScaffoldProjectInput = z.infer<typeof ScaffoldProjectInputSchema>;

// List templates input
export const ListTemplatesInputSchema = z.object({
  category: z.string().optional().describe('Filter by category'),
});

export type ListTemplatesInput = z.infer<typeof ListTemplatesInputSchema>;
