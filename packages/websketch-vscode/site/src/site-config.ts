import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'WebSketch — VS Code Extension',
  description: 'Capture web pages as grammar-based IR for LLMs — 200–800 tokens instead of 50,000+. Works with any text model.',
  logoBadge: 'WS',
  brandName: 'WebSketch',
  repoUrl: 'https://github.com/mcp-tool-shop-org/websketch-vscode',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'VS Code Extension',
    headline: 'Stop feeding LLMs HTML soup.',
    headlineAccent: 'Speak the language of UI.',
    description: 'Capture any web page as a semantic tree of 23 UI primitives. 200–800 tokens instead of 50,000. Works with ChatGPT, Claude, Gemini — any text model.',
    primaryCta: { href: 'https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode', label: 'Install from Marketplace' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'ext install mcp-tool-shop.websketch-vscode' },
      { label: 'Capture', code: 'Ctrl+Shift+P → WebSketch: Capture URL' },
      { label: 'Output', code: 'PAGE\n├─ HEADER {sticky}\n│  ├─ *LINK "Home"\n│  └─ *BUTTON "Sign Up"\n└─ SECTION <main>\n   └─ TEXT <h1> "Welcome"' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'how-it-works',
      title: 'Why WebSketch',
      subtitle: 'Raw HTML drowns LLMs. Screenshots lose structure. WebSketch gives you a clean semantic tree.',
      features: [
        {
          title: '200–800 Tokens',
          desc: 'Raw HTML runs 50,000+ tokens. WebSketch collapses it to a clean tree — same meaning, 99% fewer tokens.',
        },
        {
          title: '23 UI Primitives',
          desc: 'PAGE, HEADER, NAV, CARD, BUTTON, LINK — a fixed vocabulary LLMs learn once and apply to any site.',
        },
        {
          title: '4 Export Views',
          desc: 'LLM tree, ASCII wireframe, collapsible node tree, raw JSON IR. One capture, four ways to use it.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'output',
      title: 'What You Get',
      cards: [
        {
          title: 'Semantic tree (LLM view)',
          code: 'PAGE\n├─ HEADER {sticky}\n│  ├─ *LINK "Home"\n│  ├─ *LINK "Products"\n│  ├─ *LINK "Pricing"\n│  └─ *INPUT <search> "Search..."\n├─ SECTION <main>\n│  ├─ TEXT <h1> "Welcome to Acme"\n│  └─ *BUTTON "Get Started"\n├─ LIST (3 items)\n│  ├─ CARD\n│  ├─ CARD\n│  └─ CARD\n└─ FOOTER\n   └─ NAV\n      ├─ *LINK "Terms"\n      └─ *LINK "Privacy"',
        },
        {
          title: 'Grammar reference',
          code: '├─ *BUTTON <search> {sticky} "Find products"\n│    │       │         │         │\n│    │       │         │         └─ Visible text\n│    │       │         └─ Layout flags\n│    │       └─ Semantic hint\n│    └─ Interactive (*)\n│\n└─ Indentation = parent–child',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      subtitle: 'Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) to access all WebSketch commands.',
      columns: ['Command', 'What it does'],
      rows: [
        ['WebSketch: Capture URL', 'Prompt for URL, capture, display in panel'],
        ['WebSketch: Capture URL from Clipboard', 'Capture whatever URL is on your clipboard'],
        ['WebSketch: Copy LLM Tree to Clipboard', 'One click — paste straight into any LLM'],
        ['WebSketch: Export LLM Tree', 'Save as .md for prompt libraries or docs'],
        ['WebSketch: Export Capture as JSON', 'Full IR with bboxes, hashes, metadata'],
        ['WebSketch: Export ASCII Wireframe', 'Box-drawing spatial layout view'],
      ],
    },
    {
      kind: 'api',
      id: 'settings',
      title: 'Settings',
      subtitle: 'Configure via VS Code settings (websketch.*).',
      apis: [
        {
          signature: 'websketch.chromePath: string',
          description: 'Path to Chrome or Edge executable. Leave empty for auto-detection.',
        },
        {
          signature: 'websketch.viewportWidth: number',
          description: 'Viewport width for captures in pixels (default: 1280).',
        },
        {
          signature: 'websketch.viewportHeight: number',
          description: 'Viewport height for captures in pixels (default: 800).',
        },
        {
          signature: 'websketch.timeout: number',
          description: 'Navigation timeout in milliseconds (default: 30000).',
        },
        {
          signature: 'websketch.waitAfterLoad: number',
          description: 'Extra wait after page load for JS rendering in milliseconds (default: 1000).',
        },
      ],
    },
  ],
};
