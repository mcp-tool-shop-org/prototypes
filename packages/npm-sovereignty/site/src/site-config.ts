import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Sovereignty',
  description: 'A strategy game about governance, trust, and trade — zero-install npm binary with SHA256 verification.',
  logoBadge: 'SV',
  brandName: 'Sovereignty',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-sovereignty',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/sovereignty',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Strategy Game',
    headline: 'Sovereignty.',
    headlineAccent: 'Governance, trust, and trade.',
    description: 'A strategy game with offline tabletop play and XRPL online verification. No Python required — one command downloads a verified binary and runs it locally.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Play', code: 'npx @mcptoolshop/sovereignty tutorial' },
      { label: 'New game', code: 'npx @mcptoolshop/sovereignty new' },
      { label: 'Check status', code: 'npx @mcptoolshop/sovereignty status' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'How it works',
      subtitle: 'One command. No Python. No setup.',
      features: [
        {
          title: 'Zero Install',
          desc: 'Run with npx — no Python, no pip, no virtual environments. The binary downloads once and launches instantly from cache.',
        },
        {
          title: 'SHA256 Verified',
          desc: 'Every binary is checked against its SHA256 checksum before execution. No telemetry, no network access beyond the initial download.',
        },
        {
          title: 'Cross-Platform',
          desc: 'Prebuilt binaries for Linux x64, macOS ARM64, macOS x64, and Windows x64. Works everywhere Node.js runs.',
        },
        {
          title: 'Offline Tabletop',
          desc: 'Play the core strategy game offline — governance, trust, and trade mechanics that work without any network connection.',
        },
        {
          title: 'XRPL Verification',
          desc: 'Optional online verification via the XRP Ledger for provable game state and trade receipts.',
        },
        {
          title: 'Self-Diagnostics',
          desc: 'Built-in self-check, support bundles, cache management, and version pinning for easy troubleshooting.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Learn the rules',
          code: `# Run the tutorial
npx @mcptoolshop/sovereignty tutorial`,
        },
        {
          title: 'Start playing',
          code: `# Start a new game
npx @mcptoolshop/sovereignty new

# Check game state
npx @mcptoolshop/sovereignty status`,
        },
        {
          title: 'Troubleshoot',
          code: `# Diagnose your environment
npx @mcptoolshop/sovereignty self-check

# Force fresh download
npx @mcptoolshop/sovereignty --clear-cache`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      columns: ['Command', 'Description'],
      rows: [
        ['`tutorial`', 'Learn the rules interactively'],
        ['`new`', 'Start a new game session'],
        ['`status`', 'Check current game state'],
        ['`self-check`', 'Diagnose your environment'],
        ['`support-bundle`', 'Write a zip for bug reports'],
        ['`--clear-cache`', 'Force a fresh binary download'],
        ['`--print-cache-path`', 'Show cached binary location'],
        ['`--help`', 'See all available commands'],
      ],
    },
    {
      kind: 'data-table',
      id: 'platforms',
      title: 'Platforms',
      columns: ['Platform', 'Architecture'],
      rows: [
        ['Linux', 'x64'],
        ['macOS', 'ARM64 (Apple Silicon)'],
        ['macOS', 'x64 (Intel)'],
        ['Windows', 'x64'],
      ],
    },
  ],
};
