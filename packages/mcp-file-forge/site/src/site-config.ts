import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'MCP File Forge',
  description: 'MCP server for file operations and project scaffolding — Windows-first, secure, sandboxed',
  logoBadge: 'FF',
  brandName: 'File Forge',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-file-forge',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/file-forge',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'MCP Server',
    headline: 'File Forge',
    headlineAccent: 'Sandboxed file ops for AI agents.',
    description: 'Give your AI agents safe, policy-controlled access to the local file system. 17 tools across reading, writing, search, metadata, and scaffolding — all sandboxed.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'npx', code: 'npx @mcptoolshop/file-forge' },
      { label: 'Install', code: 'npm install -g @mcptoolshop/file-forge' },
      { label: 'Read', code: 'read_file({ path: "src/index.ts" })' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Secure file operations designed for AI workflows.',
      features: [
        { title: 'Sandboxed', desc: 'All file I/O is restricted to explicitly allowed directories. Path traversal, symlink escapes, and null-byte injection are blocked.' },
        { title: 'Windows-first', desc: 'Built for Windows paths and conventions from day one. Works equally well on macOS and Linux.' },
        { title: '17 Tools', desc: 'Read, write, search, compare, scaffold — a complete file operations toolkit accessible through the Model Context Protocol.' },
        { title: 'Read-only Mode', desc: 'Flip one env var to disable all write operations. Perfect for auditing, exploration, or untrusted agents.' },
        { title: 'Template Engine', desc: 'Scaffold projects with {{var}} substitution and __var__ path renaming. Ship starter templates your agents can use.' },
        { title: 'Zero Config', desc: 'Works out of the box with sensible defaults. Configure via env vars, config file, or both.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Claude Desktop',
          code: `{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}`,
        },
        {
          title: 'Environment Variables',
          code: `MCP_FILE_FORGE_ALLOWED_PATHS=C:/Projects,~/Documents
MCP_FILE_FORGE_READ_ONLY=false
MCP_FILE_FORGE_FOLLOW_SYMLINKS=false
MCP_FILE_FORGE_MAX_FILE_SIZE=104857600`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'Tool Reference',
      subtitle: '17 tools across five categories.',
      columns: ['Tool', 'Category', 'Description'],
      rows: [
        ['read_file', 'Reading', 'Read file contents with optional line range'],
        ['read_directory', 'Reading', 'List directory entries with recursive depth control'],
        ['read_multiple', 'Reading', 'Batch-read multiple files in one call'],
        ['write_file', 'Writing', 'Write or overwrite with optional backup'],
        ['create_directory', 'Writing', 'Create directories recursively'],
        ['copy_file', 'Writing', 'Copy files or directories'],
        ['move_file', 'Writing', 'Move or rename files'],
        ['delete_file', 'Writing', 'Delete files or directories safely'],
        ['glob_search', 'Search', 'Find files by glob pattern'],
        ['grep_search', 'Search', 'Search contents with regex'],
        ['find_by_content', 'Search', 'Literal text search across files'],
        ['file_stat', 'Metadata', 'File size, timestamps, permissions'],
        ['file_exists', 'Metadata', 'Check existence and type'],
        ['get_disk_usage', 'Metadata', 'Directory size breakdown'],
        ['compare_files', 'Metadata', 'Diff two files or directories'],
        ['scaffold_project', 'Scaffolding', 'Create projects from templates'],
        ['list_templates', 'Scaffolding', 'List available project templates'],
      ],
    },
  ],
};
