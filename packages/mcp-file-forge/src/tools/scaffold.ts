/**
 * MCP File Forge - Project Scaffolding Tools
 *
 * Tools for creating projects from templates.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ScaffoldProjectInput, ListTemplatesInput, ToolResult } from '../types.js';
import { ScaffoldProjectInputSchema, ListTemplatesInputSchema } from '../types.js';

/**
 * Template metadata from template.json
 */
interface TemplateMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  category?: string;
  variables?: Array<{
    name: string;
    description: string;
    default?: string;
    required?: boolean;
  }>;
}

/**
 * Get the default template paths.
 */
function getTemplatePaths(): string[] {
  return [
    path.join(process.cwd(), 'templates'),
    path.join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.mcp-file-forge', 'templates'),
  ];
}

/**
 * Find a template by name or path.
 */
async function findTemplate(
  nameOrPath: string
): Promise<{ path: string; metadata: TemplateMetadata } | null> {
  // Check if it's an absolute or relative path
  if (path.isAbsolute(nameOrPath) || nameOrPath.startsWith('.')) {
    const templatePath = path.resolve(nameOrPath);
    try {
      const metadataPath = path.join(templatePath, 'template.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent) as TemplateMetadata;
      return { path: templatePath, metadata };
    } catch {
      // Check if it's a valid directory without metadata
      try {
        const stats = await fs.stat(templatePath);
        if (stats.isDirectory()) {
          return {
            path: templatePath,
            metadata: {
              name: path.basename(templatePath),
              description: 'Template directory',
            },
          };
        }
      } catch {
        return null;
      }
    }
  }

  // Search in template paths
  for (const basePath of getTemplatePaths()) {
    const templatePath = path.join(basePath, nameOrPath);
    try {
      const stats = await fs.stat(templatePath);
      if (stats.isDirectory()) {
        const metadataPath = path.join(templatePath, 'template.json');
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent) as TemplateMetadata;
          return { path: templatePath, metadata };
        } catch {
          return {
            path: templatePath,
            metadata: {
              name: nameOrPath,
              description: 'Template directory',
            },
          };
        }
      }
    } catch {
      // Template not found in this path, continue searching
    }
  }

  return null;
}

/**
 * Process template variables in content.
 */
function processTemplateContent(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    // Replace {{variable}} syntax
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    // Replace ${variable} syntax
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }

  return result;
}

/**
 * Process template file name (replace variables in path).
 */
function processTemplatePath(
  filePath: string,
  variables: Record<string, string>
): string {
  let result = filePath;

  for (const [key, value] of Object.entries(variables)) {
    // Replace __variable__ syntax in paths
    result = result.replace(new RegExp(`__${key}__`, 'g'), value);
  }

  return result;
}

/**
 * Copy a directory recursively, processing templates.
 */
async function copyTemplateDir(
  src: string,
  dest: string,
  variables: Record<string, string>,
  overwrite: boolean
): Promise<{ files: string[]; skipped: string[] }> {
  const files: string[] = [];
  const skipped: string[] = [];

  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip template.json
    if (entry.name === 'template.json') continue;

    const srcPath = path.join(src, entry.name);
    const processedName = processTemplatePath(entry.name, variables);
    const destPath = path.join(dest, processedName);

    if (entry.isDirectory()) {
      const result = await copyTemplateDir(srcPath, destPath, variables, overwrite);
      files.push(...result.files);
      skipped.push(...result.skipped);
    } else {
      // Check if destination exists
      let exists = false;
      try {
        await fs.access(destPath);
        exists = true;
      } catch {
        // File doesn't exist
      }

      if (exists && !overwrite) {
        skipped.push(destPath);
        continue;
      }

      // Read and process file
      const content = await fs.readFile(srcPath, 'utf-8');
      const processedContent = processTemplateContent(content, variables);

      // Ensure parent directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Write processed file
      await fs.writeFile(destPath, processedContent, 'utf-8');
      files.push(destPath);
    }
  }

  return { files, skipped };
}

/**
 * Scaffold a project from a template.
 */
async function scaffoldProjectImpl(input: ScaffoldProjectInput): Promise<ToolResult> {
  try {
    // Find the template
    const template = await findTemplate(input.template);

    if (!template) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code: 'FILE_NOT_FOUND',
              message: `Template not found: ${input.template}`,
              details: {
                searched_paths: getTemplatePaths(),
              },
            }),
          },
        ],
      };
    }

    // Check destination
    const destPath = path.resolve(input.destination);
    let destExists = false;
    try {
      await fs.access(destPath);
      destExists = true;
    } catch {
      // Destination doesn't exist
    }

    if (destExists && !input.overwrite) {
      // Check if directory is empty
      const entries = await fs.readdir(destPath);
      if (entries.length > 0) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                code: 'ALREADY_EXISTS',
                message: `Destination directory is not empty: ${input.destination}`,
              }),
            },
          ],
        };
      }
    }

    // Merge default variables with provided variables
    const variables: Record<string, string> = {
      PROJECT_NAME: path.basename(destPath),
      CURRENT_YEAR: new Date().getFullYear().toString(),
      CURRENT_DATE: new Date().toISOString().split('T')[0],
      ...input.variables,
    };

    // Copy template to destination
    const result = await copyTemplateDir(
      template.path,
      destPath,
      variables,
      input.overwrite
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              template: {
                name: template.metadata.name,
                path: template.path,
              },
              destination: destPath,
              files_created: result.files.length,
              files_skipped: result.skipped.length,
              variables_used: variables,
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
            message: `Error scaffolding project: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * List available project templates.
 */
async function listTemplatesImpl(input: ListTemplatesInput): Promise<ToolResult> {
  try {
    const templates: Array<{
      name: string;
      path: string;
      description: string;
      category?: string;
      variables?: Array<{ name: string; description: string }>;
    }> = [];

    for (const basePath of getTemplatePaths()) {
      try {
        const entries = await fs.readdir(basePath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          const templatePath = path.join(basePath, entry.name);
          const metadataPath = path.join(templatePath, 'template.json');

          let metadata: TemplateMetadata = {
            name: entry.name,
            description: 'Template directory',
          };

          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent) as TemplateMetadata;
          } catch {
            // No metadata file, use defaults
          }

          // Filter by category if specified
          if (input.category && metadata.category !== input.category) {
            continue;
          }

          templates.push({
            name: metadata.name,
            path: templatePath,
            description: metadata.description,
            category: metadata.category,
            variables: metadata.variables?.map((v) => ({
              name: v.name,
              description: v.description,
            })),
          });
        }
      } catch {
        // Template path doesn't exist, skip
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              template_paths: getTemplatePaths(),
              count: templates.length,
              templates,
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
            message: `Error listing templates: ${err.message}`,
          }),
        },
      ],
    };
  }
}

/**
 * Register project scaffolding tools with the MCP server.
 */
export function registerScaffoldTools(server: McpServer): void {
  // scaffold_project tool
  server.tool(
    'scaffold_project',
    'Create a project from a template',
    {
      template: z.string().describe('Template name or path'),
      destination: z.string().describe('Destination directory'),
      variables: z
        .record(z.string())
        .optional()
        .describe('Template variables'),
      overwrite: z.boolean().optional().describe('Overwrite existing files'),
    },
    async (args) => {
      const input = ScaffoldProjectInputSchema.parse(args);
      return await scaffoldProjectImpl(input);
    }
  );

  // list_templates tool
  server.tool(
    'list_templates',
    'List available project templates',
    {
      category: z.string().optional().describe('Filter by category'),
    },
    async (args) => {
      const input = ListTemplatesInputSchema.parse(args);
      return await listTemplatesImpl(input);
    }
  );
}
