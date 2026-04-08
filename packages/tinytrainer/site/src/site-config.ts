import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'TinyTrainer',
  description: 'Desktop training foundry + mobile personalization export pipeline',
  logoBadge: 'TT',
  brandName: 'TinyTrainer',
  repoUrl: 'https://github.com/mcp-tool-shop-org/tinytrainer',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'Train on desktop.',
    headlineAccent: 'Personalize on device.',
    description: 'Train tiny classifier heads on frozen sentence embeddings, then export to Core ML and ONNX for mobile deployment. The phone personalizes; the desktop trains.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install tinytrainer' },
      { label: 'Train', code: 'tinytrainer train --pack error-triage --output ./model/' },
      { label: 'Export', code: 'tinytrainer export ./model/ --format onnx' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Desktop training that deploys to mobile.',
      features: [
        { title: 'Frozen backbone', desc: 'Uses sentence-transformers (MiniLM-L6-v2, 384-dim). Embeddings computed once — training is instant.' },
        { title: 'Tiny exports', desc: 'Head-only export to ONNX and Core ML. Classifier heads are 5KB-50KB — transfers instantly.' },
        { title: 'Updatable on device', desc: 'Core ML exports marked updatable for on-device personalization via MLUpdateTask.' },
        { title: 'Training kits', desc: '.kit.zip bundles contain model + recipe + tokenizer ref + eval scores. One artifact, everything needed.' },
        { title: 'Pack-native', desc: 'Consumes edgepacks task packs directly. Any classification pack becomes training data.' },
        { title: 'Tested', desc: '46 tests covering schema, training, export, kit packaging, and CLI commands.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Train from a pack', code: 'tinytrainer train --pack error-triage \\\n  --output ./model/ --epochs 20' },
        { title: 'Train from JSONL', code: 'tinytrainer train --data my_labels.jsonl \\\n  --output ./model/' },
        { title: 'Export to ONNX', code: 'tinytrainer export ./model/ \\\n  --format onnx --output ./export/' },
        { title: 'Package a kit', code: 'tinytrainer kit ./model/ \\\n  --output classifier.kit.zip' },
      ],
    },
  ],
};
