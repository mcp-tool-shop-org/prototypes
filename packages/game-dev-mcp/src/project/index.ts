import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectStore } from './store.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerProjectTools(server: McpServer): void {
  const store = new ProjectStore();

  server.tool(
    'ue_project_init',
    'Initialize project knowledge for the current directory. Creates a .game-dev-mcp/ folder to store project-specific context.',
    {
      name: z.string().describe('Project name'),
      ueVersion: z.string().optional().describe('Unreal Engine version (e.g., "5.4", "5.7")'),
      description: z.string().optional().describe('Brief project description'),
    },
    async ({ name, ueVersion, description }) => {
      if (store.isInitialized()) {
        return errorResult(ErrorCode.INVALID_PARAMS, 'Project already initialized. Use ue_project_info to view.');
      }
      const config = store.initProject(name, ueVersion, description);
      return successResult({ initialized: true, config });
    },
  );

  server.tool(
    'ue_project_info',
    'Get current project metadata and conventions',
    {},
    async () => {
      const config = store.getConfig();
      if (!config) {
        return errorResult(ErrorCode.INVALID_PARAMS, 'No project initialized. Use ue_project_init first.');
      }
      return successResult(config);
    },
  );

  server.tool(
    'ue_project_add_note',
    'Add a knowledge note to the project. Notes persist across sessions and help maintain context about your project.',
    {
      title: z.string().describe('Note title'),
      content: z.string().describe('Note content (Markdown supported)'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async ({ title, content, tags }) => {
      const note = store.addNote(title, content, tags ?? []);
      return successResult(note);
    },
  );

  server.tool(
    'ue_project_search_notes',
    'Search project notes by keyword',
    {
      query: z.string().describe('Search query'),
    },
    async ({ query }) => {
      const results = store.searchNotes(query);
      return successResult({ count: results.length, notes: results });
    },
  );

  server.tool(
    'ue_project_list_notes',
    'List all project notes, optionally filtered by tag',
    {
      tagFilter: z.string().optional().describe('Filter by tag'),
    },
    async ({ tagFilter }) => {
      const notes = store.listNotes(tagFilter);
      return successResult({ count: notes.length, notes });
    },
  );

  server.tool(
    'ue_project_delete_note',
    'Delete a project note by its ID',
    {
      noteId: z.string().describe('Note ID to delete'),
    },
    async ({ noteId }) => {
      const deleted = store.deleteNote(noteId);
      if (!deleted) {
        return errorResult(ErrorCode.INVALID_PARAMS, `Note not found: ${noteId}`);
      }
      return successResult({ deleted: noteId });
    },
  );

  server.tool(
    'ue_project_set_convention',
    'Add a project convention (naming rule, folder structure, etc.) that the LLM should follow',
    {
      convention: z.string().describe('Convention text (e.g., "All Blueprint names start with BP_", "Materials use M_ prefix")'),
    },
    async ({ convention }) => {
      try {
        const config = store.addConvention(convention);
        return successResult({ conventions: config.conventions });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.INVALID_PARAMS, error.message);
      }
    },
  );
}
