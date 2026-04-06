import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Star Freight',
  description: 'Space merchant RPG -- zero-prerequisite npx install. Five civilizations, governed lanes, crew-shaped access.',
  logoBadge: 'SF',
  brandName: 'star-freight',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-star-freight',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/star-freight',
  footerText: 'MIT Licensed -- built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Print-and-play included',
    headline: 'Star Freight',
    headlineAccent: 'Trade. Decide. Survive.',
    description: 'Space merchant RPG in a politically fractured star system. Five civilizations. One economy. Three captain lives. Zero prerequisites.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Run', code: 'npx @mcptoolshop/star-freight' },
      { label: 'Install', code: 'npm i -g @mcptoolshop/star-freight\nstar-freight' },
      { label: 'Cache', code: 'star-freight --print-cache-path\nstar-freight --clear-cache' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'The World',
      subtitle: 'Five civilizations. One star system. No neutral ground.',
      features: [
        { title: 'Crew is binding law', desc: 'Your crew determines where you can dock, what you can trade, and which cultural protocols you can navigate. Lose a crew member, lose access.' },
        { title: 'Lanes under pressure', desc: 'Routes are governed corridors -- inspected, convoy-protected, contested, hazardous, or gray. Each lane identity shapes what you risk and who watches.' },
        { title: 'Three captain lives', desc: 'Relief (legitimacy + convoys), Gray (evasion + timing), Honor (confrontation + reputation). Not classes -- what your choices made you.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Quick start', code: '# Run instantly -- no Python required\nnpx @mcptoolshop/star-freight' },
        { title: 'Global install', code: 'npm i -g @mcptoolshop/star-freight\n\n# Start a new captain\nstar-freight new "Captain Nyx" --type merchant\nstar-freight tui' },
      ],
    },
  ],
};
