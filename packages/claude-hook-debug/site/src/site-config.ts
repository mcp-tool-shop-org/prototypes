import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/claude-hook-debug',
  description: 'Diagnostic CLI for Claude Code hook issues — detects ghost hooks, scope conflicts, and plugin lifecycle bugs',
  logoBadge: 'CH',
  brandName: 'claude-hook-debug',
  repoUrl: 'https://github.com/mcp-tool-shop-org/claude-hook-debug',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'claude-hook-debug',
    headlineAccent: 'Hook diagnostics for Claude Code.',
    description: 'Scans all settings scopes, detects ghost hooks from disabled plugins, scope conflicts, and known Claude Code bugs. Read-only, zero dependencies.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Run', code: 'npx @mcptoolshop/claude-hook-debug' },
      { label: 'Scan project', code: 'claude-hook-debug /path/to/project' },
      { label: 'JSON', code: 'claude-hook-debug --json | jq .diagnostics' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'What it detects.',
      features: [
        { title: 'Ghost Hook Detection', desc: 'Finds disabled plugins that still fire hooks at runtime — the #1 Claude Code hook bug.' },
        { title: '4-Scope Analysis', desc: 'Reads managed, user, project, and local settings. Cross-references plugin state across all scopes.' },
        { title: '9 Diagnostic Rules', desc: 'Detects ghost hooks, scope conflicts, infinite loops, broken JSON, large files, and invisible plugin hooks.' },
        { title: 'Read-Only & Safe', desc: 'Never modifies settings. No network, no secrets, no telemetry. Zero production dependencies.' },
        { title: 'CLI + Library', desc: 'Run from the command line or import the debug() function for programmatic use.' },
        { title: '24 Tests', desc: 'Full test coverage for scanner, plugin extraction, hook extraction, and all diagnostic rules.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install', code: 'npm install -g @mcptoolshop/claude-hook-debug' },
        { title: 'Run diagnostics', code: 'claude-hook-debug\n# or scan a specific project:\nclaude-hook-debug /path/to/project' },
        { title: 'Library API', code: "import { debug } from '@mcptoolshop/claude-hook-debug';\n\nconst report = debug({ projectRoot: '.' });\nconsole.log(report.diagnostics);" },
      ],
    },
  ],
};
