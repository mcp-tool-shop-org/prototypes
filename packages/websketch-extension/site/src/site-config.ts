import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'websketch-extension',
  description: 'Chrome extension to capture web pages as WebSketch IR — the open intermediate representation for web layouts.',
  logoBadge: 'WS',
  brandName: 'websketch-extension',
  repoUrl: 'https://github.com/mcp-tool-shop-org/websketch-extension',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Chrome Extension',
    headline: 'Capture any page,',
    headlineAccent: 'as structured IR.',
    description: 'One click captures the full DOM — elements, styles, bounds, and metadata — as WebSketch IR. Zero dependencies. Clipboard-ready output.',
    primaryCta: { href: '#install', label: 'Install from source' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Build & load',
        code: 'git clone https://github.com/mcp-tool-shop-org/websketch-extension.git\ncd websketch-extension\nnpm ci && npm run build\n# Then: chrome://extensions → Load unpacked → select dist/',
      },
      {
        label: 'Capture',
        code: '// Click the WebSketch icon on any page\n// → "Capture Current Page"\n// Output is auto-copied to clipboard as WebSketch IR JSON\n\n// Validate it:\nwebsketch validate capture.json\n\n// Render it:\nwebsketch render capture.json',
      },
      {
        label: 'IR output',
        code: '{\n  "root": {\n    "type": "HTML",\n    "id": "...",\n    "classes": ["..."],\n    "bounds": { "x": 0, "y": 0, "width": 1920, "height": 1080 },\n    "children": [...]\n  },\n  "metadata": {\n    "url": "https://example.com",\n    "title": "Page Title",\n    "viewport": { "width": 1920, "height": 1080 }\n  }\n}',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Everything you need from a page capture',
      subtitle: 'Structured, portable, and ready to pipe into any tool.',
      features: [
        {
          title: 'Full DOM tree with styles',
          desc: 'Captures the complete element tree — types, IDs, classes, computed styles, and bounds — not just a screenshot. Every node is addressable in the output IR.',
        },
        {
          title: 'Clipboard-ready, zero friction',
          desc: 'Click once and the WebSketch IR JSON lands in your clipboard. No file dialogs, no export steps. Pipe it straight into websketch-ir, an LLM, or your own tooling.',
        },
        {
          title: 'Configurable capture limits',
          desc: 'Set maxDepth, maxNodes, and maxStringLength per your needs. Warning banners in the popup tell you when a capture was truncated — no silent data loss.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'settings',
      title: 'Capture settings',
      subtitle: 'Configure via the gear icon in the extension popup.',
      columns: ['Setting', 'Default', 'What it controls'],
      rows: [
        ['maxDepth', '50', 'Maximum DOM tree depth to traverse'],
        ['maxNodes', '10000', 'Maximum number of nodes to capture'],
        ['maxStringLength', '500', 'Maximum length of text content per node'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Install from source',
      cards: [
        {
          title: 'Clone and build',
          code: 'git clone https://github.com/mcp-tool-shop-org/websketch-extension.git\ncd websketch-extension\nnpm ci\nnpm run build',
        },
        {
          title: 'Load in Chrome',
          code: '# 1. Open chrome://extensions/\n# 2. Enable "Developer mode" (top right)\n# 3. Click "Load unpacked"\n# 4. Select the dist/ directory\n\n# For development with auto-rebuild:\nnpm run dev\n# Reload the extension in Chrome after each build.',
        },
        {
          title: 'Validate your capture',
          code: '# Requires websketch-ir CLI\nnpm install -g @mcptoolshop/websketch-ir\n\nwebsketch validate capture.json\nwebsketch render capture.json\n\n# Or paste the JSON into the online demo:\n# https://mcptoolshop.com',
        },
        {
          title: 'Run the test suite',
          code: 'npm run validate        # typecheck + lint + test + build\nnpm run test:run       # tests once\nnpm run test:coverage  # with coverage report',
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Designed to stay out of your way',
      subtitle: 'Minimal surface, maximum composability.',
      features: [
        {
          title: 'Zero runtime dependencies',
          desc: 'The extension ships no third-party libraries. Content script and popup are plain TypeScript compiled to vanilla JS — nothing to audit, nothing to update.',
        },
        {
          title: 'Part of the WebSketch ecosystem',
          desc: 'Output feeds directly into websketch-ir for validation, rendering, and AST manipulation. Use the CLI, the demo, or build your own pipeline on top.',
        },
        {
          title: 'Open and composable',
          desc: 'WebSketch IR is a documented, language-neutral format. Any tool that can read JSON can consume a capture — LLMs, layout engines, accessibility auditors, design tools.',
        },
      ],
    },
  ],
};
