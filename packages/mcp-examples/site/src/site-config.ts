import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'mcp-examples',
  description: 'Example workspaces for MCP Tool Shop — learn the model, not the boilerplate.',
  logoBadge: 'EX',
  brandName: 'mcp-examples',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-examples',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Learn by doing',
    headline: 'Working MCP workspaces,',
    headlineAccent: 'zero boilerplate.',
    description: 'Runnable example workspaces that teach the MCP Tool Shop model — read-only by default, side effects always opt-in.',
    primaryCta: { href: '#examples', label: 'Browse examples' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/mcp-examples' },
      { label: 'Run', code: 'cd hello-tools\npython -m tools.echo.main "Hello, MCP!"' },
      { label: 'Explore', code: 'cd hello-filesystem\n# irreversible side effects, handled safely' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'principles',
      title: 'Principles',
      subtitle: 'Every example is built on the same rules.',
      features: [
        {
          title: 'Least Privilege',
          desc: 'Tools default to no network, no writes, no side effects. Capability is always explicit and opt-in.',
        },
        {
          title: 'Pinned by Tags',
          desc: 'Use tagged versions (v0.1.0, v0.2.0) for stability. main is development only and may break.',
        },
        {
          title: 'Safe Side Effects',
          desc: 'Examples with irreversible actions show you how to handle them correctly — not how to avoid them.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'examples',
      title: 'Examples',
      subtitle: 'Start with hello-tools, then work your way up.',
      columns: ['Example', 'What you learn'],
      rows: [
        ['hello-tools', 'Your first MCP workspace in 2 minutes — echo, add, list'],
        ['hello-filesystem', 'Irreversible side effects (file writes) handled safely with explicit capability'],
      ],
    },
    {
      kind: 'features',
      id: 'ecosystem',
      title: 'How It Fits Together',
      subtitle: 'mcp-examples is one piece of the MCP Tool Shop ecosystem.',
      features: [
        {
          title: 'Registry',
          desc: 'mcp-tool-registry holds metadata for every tool — what exists, what it does, who built it.',
        },
        {
          title: 'CLI',
          desc: 'mcpt is how you discover and run tools from the registry without writing a line of code.',
        },
        {
          title: 'Examples',
          desc: 'This repo — hands-on workspaces that show the model in action before you build on top of it.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'hello-tools',
          code: `git clone https://github.com/mcp-tool-shop-org/mcp-examples
cd mcp-examples/hello-tools
python -m tools.echo.main "Hello, MCP!"`,
        },
        {
          title: 'hello-filesystem',
          code: `cd mcp-examples/hello-filesystem
# Read the README first — this example
# demonstrates safe handling of file writes
python -m tools.writer.main`,
        },
      ],
    },
  ],
};
