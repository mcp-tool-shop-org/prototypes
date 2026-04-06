import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Code Bearings',
  description: 'Source-grounded review, learning, and control for modern codebases.',
  logoBadge: 'CB',
  brandName: 'Code Bearings',
  repoUrl: 'https://github.com/mcp-tool-shop-org/code-bearings',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'Get your bearings back',
    headlineAccent: 'in your code.',
    description: 'Source-grounded review, learning, and control for modern codebases. Truth stays canonical. AI helps explain. The human stays in charge.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install -g @code-bearings/cli' },
      { label: 'Index', code: 'code-bearings analyze' },
      { label: 'Review', code: 'code-bearings review' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Every surface shows the same canonical truth.',
      features: [
        {
          title: 'Source-Grounded',
          desc: 'Indexes your TypeScript project into a graph of files, symbols, modules, and dependencies. Every claim has evidence.',
        },
        {
          title: 'Review Intelligence',
          desc: 'Generates risk-scored change briefs from any git diff — with symbol explanations, reviewer tips, and contract shift detection.',
        },
        {
          title: 'Five Purpose Modes',
          desc: 'General review tells the truth. Bug Hunter, Learning, Architecture, and Exploration modes help humans think with that truth.',
        },
        {
          title: 'VS Code Extension',
          desc: 'Hover tooltips, CodeLens, gutter decorations, status bar, and interactive review panels — all fed from the same canonical graph.',
        },
        {
          title: 'CI Ready',
          desc: 'Generate review artifacts (Markdown, JSON, HTML) in CI. Optionally fail builds on risk thresholds.',
        },
        {
          title: '173 Tests',
          desc: 'Dogfooded against 5 real repos. Module boundary detection, change briefs, evidence chains — all verified.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Install',
          code: 'npm install -g @code-bearings/cli',
        },
        {
          title: 'Index your project',
          code: 'code-bearings analyze',
        },
        {
          title: 'Review changes',
          code: 'code-bearings review\n\n# Or compare branches\ncode-bearings compare main feature-branch\n\n# Or generate CI artifacts\ncode-bearings ci --fail-on-risk high',
        },
        {
          title: 'Explore the graph',
          code: 'code-bearings modules\ncode-bearings module auth\ncode-bearings function generateChangeBrief\ncode-bearings overview',
        },
      ],
    },
  ],
};
