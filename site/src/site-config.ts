import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Prototypes — MCP Tool Shop',
  description: '67 archived packages from MCP Tool Shop — consolidated into a single monorepo. A seed vault of proven concepts, stepping stones, and experiments.',
  logoBadge: 'PT',
  brandName: 'Prototypes',
  repoUrl: 'https://github.com/mcp-tool-shop-org/prototypes',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Seed Vault',
    headline: 'Prototypes',
    headlineAccent: 'the ideas that built the shop.',
    description: '67 packages from the MCP Tool Shop org — voice engines, developer tools, desktop apps, game prototypes, and more. Preserved during the April 2026 consolidation (175 → 88 repos). Browse the source, steal patterns, revive what works.',
    primaryCta: { href: '#categories', label: 'Browse packages' },
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
      title: 'Not a graveyard — a seed vault',
      subtitle: 'Every package here solved a real problem or proved a concept that shaped the tools we ship today.',
      features: [
        { title: '67 Packages', desc: 'Voice engines, MCP servers, desktop apps, game prototypes, crypto tools, developer utilities — organized into 10 categories for easy browsing.' },
        { title: 'Monorepo', desc: 'pnpm + Turborepo workspace. Each package lives under packages/ with its original source, tests, and docs intact.' },
        { title: 'Revivable', desc: 'See something that should be a product? Pull it out, give it a repo, and ship it. These are starting points, not dead ends.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'categories',
      title: 'Package Categories',
      subtitle: '67 packages across 10 domains.',
      columns: ['Category', 'Count', 'Highlights'],
      rows: [
        ['Developer Tools', '21', 'deltamind, claude-collaborate, code-covered, mcp-bouncer, context-window-manager'],
        ['Voice & Sound', '8', 'voice-soundboard, sonic-core, soundweave, mcp-voice-engine'],
        ['Desktop Apps', '7', 'Attestia-Desktop, InControl-Desktop, ScalarScope-Desktop, studioflow'],
        ['WebSketch', '4', 'CLI, Chrome extension, VS Code extension, MCP server'],
        ['Crypto & Provenance', '4', 'prov-spec, prov-engine-js, receipt-factory, payroll-engine'],
        ['Infrastructure', '4', 'witness, training-studio, llm-sync-drive, zip-meta-map'],
        ['Mouse & Cursor', '3', 'MouseTrainer, CursorAssist, DeterministicMouseTrainingEngine'],
        ['Games & Creative', '3', 'ConsensusOS, Trace, game-dev-mcp'],
        ['Typing & Input', '2', 'linux-dev-typer, meta-content-system'],
        ['Original Archive', '10', 'mcpt, pathway, physics-svg, and 7 more (pre-consolidation)'],
      ],
    },
  ],
};
