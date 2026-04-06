import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'WebSketch CLI',
  description: 'CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.',
  logoBadge: 'WS',
  brandName: 'WebSketch CLI',
  repoUrl: 'https://github.com/mcp-tool-shop-org/websketch-cli',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/websketch',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'v0.4.1 — npm package',
    headline: 'See what users see.',
    headlineAccent: 'In plain text.',
    description: 'Render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see. ASCII art, structural hashes, semantic diffs — all from one CLI.',
    primaryCta: { href: '#commands', label: 'See commands' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pnpm add -g @mcptoolshop/websketch' },
      { label: 'Render', code: 'websketch render-ascii capture.json' },
      { label: 'Diff', code: 'websketch diff before.json after.json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to capture, compare, and communicate UI.',
      features: [
        { title: 'ASCII Rendering', desc: 'Turn any WebSketch capture into a box-drawing layout that fits in a terminal or LLM context window.' },
        { title: 'Structural Fingerprinting', desc: 'Hash a page layout to detect changes without pixel diffing. Layout-only mode ignores text changes.' },
        { title: 'Semantic Diff', desc: 'Compare two captures and get a ranked change report — added, moved, resized, text changed.' },
        { title: 'Bundle Packaging', desc: 'Combine captures and optional diffs into a single shareable .ws.json file.' },
        { title: 'Pipeline-First', desc: 'Every command supports --json output and deterministic exit codes for CI scripting.' },
        { title: 'LLM-Optimized', desc: 'The --llm flag produces metadata-rich output designed for agent consumption with legends and context.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'commands',
      title: 'Commands',
      cards: [
        {
          title: 'Render to ASCII',
          code: `# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json`,
        },
        {
          title: 'Diff & Fingerprint',
          code: `# Structural fingerprint
websketch fingerprint capture.json
# Output: e33442b6

# Semantic diff between captures
websketch diff before.json after.json --json

# Bundle into shareable file
websketch bundle before.json after.json -o bundle.ws.json`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'exit-codes',
      title: 'Exit Codes',
      subtitle: 'Deterministic codes for CI integration.',
      columns: ['Code', 'Meaning'],
      rows: [
        ['0', 'Success'],
        ['1', 'Validation / data error (bad JSON, invalid capture, unknown command)'],
        ['2', 'Filesystem error (file not found, permission denied, I/O error)'],
      ],
    },
    {
      kind: 'features',
      id: 'ecosystem',
      title: 'Ecosystem',
      subtitle: 'WebSketch CLI works with the broader WebSketch toolchain.',
      features: [
        { title: 'Chrome Extension', desc: 'websketch-extension — one-click page capture from any browser tab.' },
        { title: 'IR Library', desc: '@mcptoolshop/websketch-ir — build captures programmatically in TypeScript.' },
        { title: 'Pipeline Integration', desc: 'Add --json to any command for machine-readable output in CI/CD workflows.' },
      ],
    },
  ],
};
