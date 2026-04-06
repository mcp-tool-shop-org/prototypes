import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Escape the Valley',
  description: 'Oregon Trail-style survival game — one command, no Python required',
  logoBadge: 'EV',
  brandName: 'Escape the Valley',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-escape-the-valley',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/escape-the-valley',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Zero prerequisites',
    headline: 'Escape the Valley:',
    headlineAccent: 'one command to play.',
    description: 'Oregon Trail-style survival game with AI narration and optional XRPL ledger backpack. No Python, no pip, no virtual environments — just npx and go.',
    primaryCta: { href: '#quickstart', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Play', code: 'npx @mcptoolshop/escape-the-valley tui --seed 42' },
      { label: 'Resume', code: 'npx @mcptoolshop/escape-the-valley tui --continue' },
      { label: 'Global', code: 'npm i -g @mcptoolshop/escape-the-valley && trail tui' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'A full survival game in your terminal.',
      features: [
        {
          title: 'Zero Setup',
          desc: 'One npx command downloads a platform binary, verifies SHA256, caches locally. No Python, no pip, no virtual environments.',
        },
        {
          title: 'AI Game Master',
          desc: 'Three GM profiles — Chronicler, Fireside, Lantern-Bearer — narrate your journey with distinct voices. Powered by Ollama, runs locally.',
        },
        {
          title: 'Procedural World',
          desc: 'Seeded world generation with deterministic physics. Every run is reproducible. The valley is harsh but fair — skilled players win ~1 in 3.',
        },
        {
          title: 'XRPL Ledger Backpack',
          desc: 'Optional on-chain inventory tracking on XRPL Testnet. Supply tokens, settlement receipts, and parcels. Proof that you survived.',
        },
        {
          title: 'Full-Screen TUI',
          desc: 'Rich terminal interface built with Textual. Camp actions, event choices, route forks, and a trail ledger at journey\'s end.',
        },
        {
          title: 'Cross-Platform',
          desc: 'Pre-built binaries for Linux x64, macOS ARM64, and Windows x64. Cached after first download for instant startup.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'Play instantly',
          code: '# No install needed\nnpx @mcptoolshop/escape-the-valley tui --seed 42\n\n# Resume a saved game\nnpx @mcptoolshop/escape-the-valley tui --continue',
        },
        {
          title: 'Install globally',
          code: '# Install once, run anytime\nnpm install -g @mcptoolshop/escape-the-valley\n\n# Now just use the short command\ntrail tui --seed 42',
        },
        {
          title: 'All commands',
          code: 'trail tui                       # start new game\ntrail tui --seed 42             # seeded world\ntrail tui --continue            # resume save\ntrail tui --gm chronicler       # choose GM voice\ntrail tui --callouts minimal    # fewer warnings\ntrail ledger                    # trail ledger\ntrail --help                    # all commands',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'gm-profiles',
      title: 'GM Profiles',
      subtitle: 'The narrator shapes the tone, not the mechanics.',
      columns: ['Profile', 'Tone', 'Best For'],
      rows: [
        ['Chronicler', 'Dry, factual, historical', 'Players who want facts'],
        ['Fireside', 'Warm, folksy storyteller (default)', 'First playthrough'],
        ['Lantern-Bearer', 'Eerie, atmospheric, foreboding', 'Experienced players'],
      ],
    },
  ],
};
