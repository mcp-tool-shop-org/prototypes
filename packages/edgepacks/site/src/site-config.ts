import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'EdgePacks',
  description: 'Task-dataset foundry for training small models on narrow jobs',
  logoBadge: 'EP',
  brandName: 'EdgePacks',
  repoUrl: 'https://github.com/mcp-tool-shop-org/edgepacks',
  pypiUrl: 'https://pypi.org/project/edgepacks/',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'EdgePacks',
    headlineAccent: 'training data, done right.',
    description: 'A library of narrow, well-structured training packs for fine-tuning small models on specific capabilities. Generate, validate, split, and export — all from one CLI.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install edgepacks' },
      { label: 'Explore', code: 'edgepacks list' },
      { label: 'Build', code: 'edgepacks build tool-routing --count 2000' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to create high-quality fine-tuning datasets.',
      features: [
        { title: 'Curated Packs', desc: 'Pre-built dataset templates for tool routing, structured extraction, and error triage — each with schema, validation, and eval sets.' },
        { title: 'Synthetic Generation', desc: 'Generate thousands of training examples locally via Ollama. No cloud APIs, no cost, fully offline.' },
        { title: 'Quality Pipeline', desc: 'Built-in validation, deduplication, hard-negative generation, balanced splitting, and leakage detection.' },
        { title: 'Multi-Format Export', desc: 'Export to JSONL, HuggingFace datasets, Unsloth, or torchtune — plug directly into your training stack.' },
        { title: 'Structured Errors', desc: 'Every error includes code, message, and hint. No raw tracebacks unless you pass --debug.' },
        { title: 'Fully Tested', desc: '93 tests covering schema, foundry, export, and CLI. Clean CI on Python 3.11 and 3.12.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install', code: 'pip install edgepacks' },
        { title: 'Build a dataset', code: '# Generate + validate + split + export\nedgepacks build tool-routing --count 2000 --model qwen2.5:7b\nedgepacks export tool-routing --format unsloth --output ./data/' },
        { title: 'Inspect packs', code: '# See what is available\nedgepacks list\nedgepacks info tool-routing\nedgepacks preview tool-routing --n 5' },
      ],
    },
  ],
};
