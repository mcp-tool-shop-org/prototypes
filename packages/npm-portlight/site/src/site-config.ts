import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/portlight',
  description: 'Trade-first maritime strategy CLI — zero-prerequisite npx install. No Python needed.',
  logoBadge: 'P',
  brandName: 'portlight',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-portlight',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/portlight',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Zero prerequisites',
    headline: 'Portlight',
    headlineAccent: 'Trade · Sail · Prosper.',
    description: 'A maritime strategy CLI where prices react to your trades, voyages carry real risk, and your commercial career emerges from the decisions you make. One command to play — no Python required.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Play', code: 'npx @mcptoolshop/portlight new "Captain Hawk" --type merchant' },
      { label: 'Trade', code: 'npx @mcptoolshop/portlight buy grain 10 && npx @mcptoolshop/portlight sail al_manar' },
      { label: 'Prosper', code: 'npx @mcptoolshop/portlight milestones' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'A Living Economy',
      subtitle: 'Trade as a commercial discipline, not a number that goes up.',
      features: [
        { title: 'Reactive Markets', desc: 'Prices shift with every trade you make. Dump grain at a port and the price crashes. 20 ports, 18 goods, 43 routes across 5 regions.' },
        { title: 'Real Voyages', desc: 'Storms, pirates, inspections. Your provisions, hull, and crew matter. Every sailing is a calculated risk.' },
        { title: 'Contracts & Proof', desc: 'Deliver the right goods to the right port with tracked provenance. Six contract families gated by trust and standing.' },
        { title: 'Infrastructure', desc: 'Warehouses stage cargo. Brokers improve contracts. Licenses unlock premium access. Build the trade house you want.' },
        { title: 'Finance & Credit', desc: 'Three credit tiers with interest, deadlines, and real consequences. Leverage lets you move faster — default closes doors.' },
        { title: 'Four Victory Paths', desc: 'Lawful Trade House, Shadow Network, Oceanic Reach, or Commercial Empire. The game reads what you actually built.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Run instantly', code: 'npx @mcptoolshop/portlight new "Captain Hawk" --type merchant' },
        { title: 'Install globally', code: 'npm install -g @mcptoolshop/portlight\nportlight market\nportlight buy grain 10\nportlight sail al_manar' },
      ],
    },
  ],
};
