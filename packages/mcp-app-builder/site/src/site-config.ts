import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'MCP App Builder',
  description: 'Build MCP servers with interactive UI components — from VS Code.',
  logoBadge: 'MA',
  brandName: 'MCP App Builder',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-app-builder',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'v1.1.0 — VS Code Extension',
    headline: 'Build MCP servers',
    headlineAccent: 'from VS Code.',
    description: 'Scaffold, validate, test, and deploy MCP servers with interactive UI components — all from your editor.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Create', code: 'Cmd+Shift+P → "MCP: New Server"' },
      { label: 'Validate', code: 'Cmd+Shift+P → "MCP: Validate Schema"' },
      { label: 'Test', code: 'Cmd+Shift+P → "MCP: Test Server"' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to build MCP servers, without leaving VS Code.',
      features: [
        { title: 'New Server Wizard', desc: 'Guided setup with three templates: basic, with-ui, and full — generates TypeScript, MCP SDK, and project structure.' },
        { title: 'Schema Validation', desc: 'Real-time validation of mcp.json and mcp-tools.json on save, with IntelliSense and JSON Schema support.' },
        { title: 'Test Harness', desc: 'Auto-generated tests from tool definitions. Run against your MCP tools with formatted pass/fail output.' },
      ],
    },
    {
      kind: 'features',
      id: 'more-features',
      title: 'Developer Experience',
      features: [
        { title: 'Type Generation', desc: 'Generate TypeScript types directly from tool definitions — no manual interface writing.' },
        { title: 'Tool Playground', desc: 'Connect to MCP servers, browse tools, invoke them with auto-generated forms, and review session history.' },
        { title: 'Dashboard', desc: 'Visual webview interface with workspace integration. Detects MCP projects automatically.' },
        { title: 'MCP Apps UI', desc: 'Build interactive UI components (tables, charts, forms, cards) that render directly in AI conversations.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        { title: 'Install & create', code: '# Install from VS Code Marketplace\n# Then create a new server:\nCmd+Shift+P → "MCP: New Server"\n\n# Choose a template:\n#   basic   — Simple hello world\n#   with-ui — Tables and charts\n#   full    — Tools, resources, prompts' },
        { title: 'UI components', code: 'import { table, chart } from\n  \'@mcp-app-builder/ui-components\';\n\nconst results = table(\n  [\n    { key: \'name\', header: \'Name\',\n      sortable: true },\n    { key: \'status\', header: \'Status\' },\n  ],\n  data,\n  { pageSize: 10 }\n);' },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      subtitle: 'All available VS Code commands.',
      columns: ['Command', 'Description'],
      rows: [
        ['MCP: New Server', 'Create a new MCP server project'],
        ['MCP: Validate Schema', 'Validate mcp.json or mcp-tools.json'],
        ['MCP: Generate Types', 'Generate TypeScript types from tool definitions'],
        ['MCP: Test Server', 'Run tests against your MCP tools'],
        ['MCP: Open Dashboard', 'Open the visual dashboard'],
        ['MCP: Tool Playground', 'Interactive tool testing and invocation'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'structure',
      title: 'Generated Project',
      cards: [
        { title: 'File structure', code: 'my-mcp-server/\n├── mcp.json          # Server config\n├── mcp-tools.json    # Tool definitions\n├── package.json      # Dependencies\n├── tsconfig.json     # TypeScript config\n└── src/\n    ├── index.ts      # Entry point\n    ├── resources.ts  # Resource handlers\n    └── prompts.ts    # Prompt handlers' },
        { title: 'Keyboard shortcuts', code: '# Create new server\nCtrl+Alt+N  (Cmd+Alt+N on Mac)\n\n# Validate schema\nCtrl+Alt+V  (Cmd+Alt+V on Mac)' },
      ],
    },
    {
      kind: 'data-table',
      id: 'roadmap',
      title: 'Roadmap',
      columns: ['Phase', 'Status'],
      rows: [
        ['Scaffolding + schema validation + test harness', 'Complete'],
        ['AI-assisted tool generation', 'Planned'],
        ['One-click publishing to MCP registries', 'Planned'],
        ['Drag-and-drop visual builder', 'Future'],
      ],
    },
  ],
};
