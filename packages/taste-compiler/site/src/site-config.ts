import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Taste Compiler',
  description: 'Compile product taste into enforceable constraints that preserve visual coherence, identity boundaries, and UX safety under AI-generated change.',
  logoBadge: 'TC',
  brandName: 'Taste Compiler',
  repoUrl: 'https://github.com/mcp-tool-shop-org/taste-compiler',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: '7 trials \u2014 all 6 artifact classes live-proven',
    headline: 'Taste Compiler',
    headlineAccent: 'enforces product identity.',
    description: 'Compile product taste into enforceable constraints. 7 paired trials, 245 baseline violations reduced to 0 in constrained runs.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Init', code: 'npx taste-compiler init' },
      { label: 'Compile', code: 'npx taste-compiler compile --dir taste/source --out taste/pack' },
      { label: 'Check', code: 'npx taste-compiler check --pack taste/pack/taste-pack.json --dir src/' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: '6 Artifact Classes',
      subtitle: 'Each class catches a different category of AI-generated drift.',
      features: [
        { title: 'Visual Tokens', desc: 'Raw hex colors, off-scale spacing, unauthorized typography — the highest-volume violation class.' },
        { title: 'Component Grammar', desc: 'Banned components, unknown categories, composition rule violations.' },
        { title: 'Interaction Laws', desc: 'Destructive actions without confirmation, submit without validation, dead-end empty states.' },
        { title: 'Copy Rules', desc: 'Banned phrases, tone drift, unqualified AI claims, persona overreach.' },
        { title: 'Complexity Budgets', desc: 'Too many nav items, actions per screen, modal layers, or interaction modes.' },
        { title: 'Forbidden Patterns', desc: 'Explicitly banned layouts, dashboard creep, competing surfaces.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Initialize', code: '# Create a taste workspace in your project\nnpx taste-compiler init' },
        { title: 'Author', code: '# Edit YAML source files\n# taste/source/principles.yaml\n# taste/source/anti-examples.yaml\n# taste/source/budgets.yaml' },
        { title: 'Compile', code: '# Compile to a Taste Pack\nnpx taste-compiler compile' },
        { title: 'Check', code: '# Check generated code against the pack\nnpx taste-compiler check --dir src/' },
      ],
    },
  ],
};
