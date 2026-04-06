import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'XRPL Lab',
  description: 'Hands-on XRPL training workbook — 12 modules, 3 tracks, learn by doing, prove by artifact.',
  logoBadge: 'XL',
  brandName: 'XRPL Lab',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-xrpl-lab',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/xrpl-lab',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'npm / CLI',
    headline: 'XRPL Lab,',
    headlineAccent: 'learn by doing, prove by artifact.',
    description: '12 hands-on modules across Beginner, Intermediate, and Advanced tracks. Each module produces a verifiable artifact — transaction IDs, audit packs, and proof packs with SHA-256 integrity. No Python required.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Run', code: 'npx @mcptoolshop/xrpl-lab start' },
      { label: 'List', code: 'npx @mcptoolshop/xrpl-lab list' },
      { label: 'Audit', code: 'npx @mcptoolshop/xrpl-lab audit' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why XRPL Lab?',
      subtitle: 'A training workbook that treats the ledger as your classroom.',
      features: [
        { title: 'No Python Required', desc: 'Runs as a single binary via npm. No pip, no virtual environments, no dependencies to manage.' },
        { title: '12 Modules, 3 Tracks', desc: 'Beginner through Advanced. Each module teaches one skill and produces one verifiable artifact.' },
        { title: 'Verifiable Artifacts', desc: 'Every module outputs transaction IDs, audit packs, or proof packs with SHA-256 integrity checks.' },
        { title: 'Offline Mode', desc: 'Dry-run mode with simulated transactions. Learn the workflow without touching testnet.' },
        { title: 'Binary Integrity', desc: 'SHA-256 checksum verification on every download. No telemetry. No network beyond initial fetch.' },
        { title: 'Cross-Platform', desc: 'Linux x64, macOS ARM64, and Windows x64. First run downloads ~25 MB, then launches instantly from cache.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Run your first module',
          code: '# Launch the guided workbook\nnpx @mcptoolshop/xrpl-lab start\n\n# Or run offline (recommended for AMM modules)\nnpx @mcptoolshop/xrpl-lab start --dry-run\n\n# List all 12 modules\nnpx @mcptoolshop/xrpl-lab list',
        },
        {
          title: 'Verify your work',
          code: '# Check your progress across all tracks\nnpx @mcptoolshop/xrpl-lab status\n\n# Batch verify all transactions\nnpx @mcptoolshop/xrpl-lab audit\n\n# Show last run details\nnpx @mcptoolshop/xrpl-lab last-run',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'modules',
      title: 'Modules',
      subtitle: '12 modules across three progressive tracks.',
      columns: ['Track', 'Module', 'Skill'],
      rows: [
        ['Beginner', 'Receipt Literacy', 'Read and interpret transaction receipts'],
        ['Beginner', 'Failure Literacy', 'Understand why transactions fail'],
        ['Beginner', 'Trust Lines 101', 'Create and manage trust lines'],
        ['Beginner', 'Debugging Trust Lines', 'Diagnose trust line issues'],
        ['Intermediate', 'DEX Literacy', 'Navigate the decentralized exchange'],
        ['Intermediate', 'Reserves 101', 'Understand account reserves'],
        ['Intermediate', 'Account Hygiene', 'Clean up and secure accounts'],
        ['Intermediate', 'Receipt Audit', 'Batch verify transaction history'],
        ['Advanced', 'AMM Liquidity 101', 'Automated market maker basics'],
        ['Advanced', 'DEX Market Making 101', 'Place and manage DEX offers'],
        ['Advanced', 'Inventory Guardrails', 'Protect against inventory risk'],
        ['Advanced', 'DEX vs AMM Risk Literacy', 'Compare trading venue risks'],
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      columns: ['Command', 'Description'],
      rows: [
        ['npx @mcptoolshop/xrpl-lab start', 'Guided module launcher'],
        ['npx @mcptoolshop/xrpl-lab list', 'Show all 12 modules'],
        ['npx @mcptoolshop/xrpl-lab run <module>', 'Run a specific module'],
        ['npx @mcptoolshop/xrpl-lab status', 'Check progress across tracks'],
        ['npx @mcptoolshop/xrpl-lab doctor', 'Diagnose environment issues'],
        ['npx @mcptoolshop/xrpl-lab audit', 'Batch verify all transactions'],
        ['npx @mcptoolshop/xrpl-lab last-run', 'Show last run + audit command'],
        ['npx @mcptoolshop/xrpl-lab --help', 'See all available commands'],
      ],
    },
    {
      kind: 'data-table',
      id: 'troubleshooting',
      title: 'Troubleshooting',
      columns: ['Command', 'When to use'],
      rows: [
        ['npx @mcptoolshop/xrpl-lab self-check', 'Diagnose your environment'],
        ['npx @mcptoolshop/xrpl-lab feedback', 'Generate issue-ready markdown'],
        ['npx @mcptoolshop/xrpl-lab --print-cache-path', 'Find cached binary location'],
        ['npx @mcptoolshop/xrpl-lab --clear-cache', 'Force fresh re-download'],
        ['npx @mcptoolshop/xrpl-lab@1.0.0 start', 'Pin to a specific version'],
      ],
    },
  ],
};
