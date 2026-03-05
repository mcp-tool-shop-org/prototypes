import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Prototypes Archive',
  description: 'Archived prototypes from MCP Tool Shop — 10 deprecated packages preserved for reference in a single monorepo.',
  logoBadge: 'PT',
  brandName: 'Prototypes',
  repoUrl: 'https://github.com/mcp-tool-shop-org/prototypes',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Archived',
    headline: 'Prototypes',
    headlineAccent: 'the retired workshop.',
    description: '10 deprecated @mcptoolshop packages consolidated into a single monorepo. These prototypes are no longer maintained — kept here for reference, learning, and historical context.',
    primaryCta: { href: '#packages', label: 'Browse packages' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/prototypes.git' },
      { label: 'Install', code: 'pnpm install' },
      { label: 'Build', code: 'pnpm build' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'about',
      title: 'What is this?',
      subtitle: 'A consolidated archive of early experiments and deprecated tools.',
      features: [
        { title: 'Archived', desc: 'All 10 packages have been deprecated on npm. They served their purpose during development and are no longer actively maintained.' },
        { title: 'Monorepo', desc: 'Consolidated into a single pnpm + Turborepo workspace for easy exploration. Each package lives under packages/ with its original source intact.' },
        { title: 'Reference', desc: 'Preserved for historical context, code reuse, and learning. Browse the source to understand how ideas evolved into current products.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'Archived Packages',
      subtitle: '10 deprecated @mcptoolshop packages.',
      columns: ['Package', 'npm name', 'Description'],
      rows: [
        ['mcpt', '@mcptoolshop/mcpt', 'CLI for discovering and running MCP Tool Shop tools'],
        ['pathway', '@mcptoolshop/pathway', 'Append-only journey engine where undo never erases learning'],
        ['physics-svg', '@mcptoolshop/physics-svg', 'Deterministic 2D physics engine with SVG rendering'],
        ['ai-music-sheets', '@mcptoolshop/ai-music-sheets', 'Piano sheet music in hybrid JSON + musical-language format'],
        ['websketch-demo', '@mcptoolshop/websketch-demo', 'Interactive demo site for WebSketch IR'],
        ['clearance-opinion-engine', '@mcptoolshop/clearance-opinion-engine', 'Deterministic name-availability and clearance-opinion engine'],
        ['nameops', '@mcptoolshop/nameops', 'Name clearance orchestrator with batch runs and PR automation'],
        ['mcpt-link-fresh', '@mcptoolshop/mcpt-link-fresh', 'Evergreen link sync and drift fixer'],
        ['vector-caliper', '@mcptoolshop/vector-caliper', 'Scientific instrument for faithful model-state visualization'],
        ['mcpt-publishing-assets', '@mcptoolshop/mcpt-publishing-assets', 'Logo, icon, and image asset generation for mcpt-publishing'],
      ],
    },
  ],
};
