import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'XRPL Camp',
  description: 'Learn the XRP Ledger in one sitting — wallet, payment, verification, certificate in 10 minutes',
  logoBadge: 'XC',
  brandName: 'XRPL Camp',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-xrpl-camp',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/xrpl-camp',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'XRPL Camp',
    headlineAccent: 'learn the ledger in 10 minutes.',
    description: 'Guided training that walks you from wallet creation to on-ledger payment to certificate — no Python, no prerequisites, just npx.',
    primaryCta: { href: '#install', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Run', code: 'npx @mcptoolshop/xrpl-camp start' },
      { label: 'Status', code: 'npx @mcptoolshop/xrpl-camp status' },
      { label: 'Help', code: 'npx @mcptoolshop/xrpl-camp --help' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to learn the XRP Ledger, nothing you don\'t.',
      features: [
        { title: 'Zero Prerequisites', desc: 'No Python, no pip, no virtual environments. A single npx command downloads a platform-specific binary and launches the training.' },
        { title: 'SHA256 Verified', desc: 'Every binary is checked against its SHA256 checksum before execution. No telemetry, no network access beyond the initial download.' },
        { title: 'Cross-Platform', desc: 'Prebuilt binaries for Linux x64, macOS ARM64, macOS x64, and Windows x64. Cached locally after first run for instant startup.' },
        { title: 'Real Ledger Skills', desc: 'Wallet creation, XRP payments, transaction verification, and certificate generation — all on the XRPL Testnet.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Install & Run',
      cards: [
        { title: 'Start Training', code: 'npx @mcptoolshop/xrpl-camp start' },
        { title: 'Check Progress', code: 'npx @mcptoolshop/xrpl-camp status' },
        { title: 'Troubleshoot', code: '# Diagnose your environment\nnpx @mcptoolshop/xrpl-camp self-check\n\n# Force fresh download\nnpx @mcptoolshop/xrpl-camp --clear-cache' },
      ],
    },
    {
      kind: 'data-table',
      id: 'platforms',
      title: 'Supported Platforms',
      subtitle: 'Prebuilt binaries for all major platforms.',
      columns: ['Platform', 'Architecture', 'Status'],
      rows: [
        ['Linux', 'x64', 'Supported'],
        ['macOS', 'ARM64 (Apple Silicon)', 'Supported'],
        ['macOS', 'x64 (Intel)', 'Supported'],
        ['Windows', 'x64', 'Supported'],
      ],
    },
    {
      kind: 'features',
      id: 'how-it-works',
      title: 'How It Works',
      subtitle: 'From npx to certificate in four steps.',
      features: [
        { title: '1. Download', desc: 'First run fetches a platform-specific binary (~20 MB) from GitHub Releases and caches it locally.' },
        { title: '2. Verify', desc: 'SHA256 checksum is validated before the binary executes. Any mismatch aborts the launch.' },
        { title: '3. Train', desc: 'Interactive modules walk you through wallet creation, payments, and transaction verification on the XRPL Testnet.' },
        { title: '4. Certify', desc: 'Complete all modules to receive a verifiable certificate anchored to the XRP Ledger.' },
      ],
    },
  ],
};
