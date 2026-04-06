import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: "@mcptoolshop/saints-mile",
  description: "A frontier JRPG for the adults who loved those games first — zero-prerequisite npx install.",
  logoBadge: 'SM',
  brandName: 'saints-mile',
  repoUrl: 'https://github.com/mcp-tool-shop-org/npm-saints-mile',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/saints-mile',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Zero prerequisites',
    headline: "Saint's Mile",
    headlineAccent: 'A frontier JRPG for grown-ups.',
    description: "A weathered frontier road story with sharp banter, real consequences, and just enough mystery to make the horizon feel haunted. One command to play. No Rust toolchain required.",
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Play', code: 'npx @mcptoolshop/saints-mile' },
      { label: 'Install', code: 'npm install -g @mcptoolshop/saints-mile && saints-mile' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why This Game',
      subtitle: 'A JRPG that respects your intelligence and your time.',
      features: [
        { title: 'Terminal-Native', desc: 'Beautiful TUI built on Ratatui. No browser, no GUI framework, no Electron. Runs anywhere you have a terminal.' },
        { title: '16 Chapters', desc: 'A complete frontier story spanning youth through old age. Every chapter has one emotional law that defines what it must make you feel.' },
        { title: 'Party Combat', desc: '4-slot party from a roster of 6. Standoff openers, nerve as a second health bar, ammo management, wounds that linger, duo techniques.' },
        { title: 'The Party', desc: 'Six frontier specialists — gunhand, grifter, sawbones, ranch hand, preacher, dynamiter. Each mechanically distinct with three skill lines.' },
        { title: 'Adult Themes', desc: 'Regret, duty, compromise, aging, loyalty, starting over. Written for grown-ups who loved JRPGs as kids.' },
        { title: 'Zero Install Friction', desc: 'npx downloads the native binary for your platform. SHA256 verified. Cached locally. No Rust needed.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'party',
      title: 'The Party',
      subtitle: 'Six characters, six roles, six frontier truths.',
      columns: ['Character', 'Role', 'Battle Identity'],
      rows: [
        ['Galen Rook', 'Gunhand', 'Precision, called shots, field command. Evolves by age.'],
        ['Eli Winter', 'Grifter', 'Nerve attacks, disruption, cheap tricks. Loyalty unlocks late.'],
        ['Dr. Ada Mercer', 'Sawbones', 'Healing, wound management, weakness revelation.'],
        ['Rosa Varela', 'Ranch Hand', 'Lasso crowd control, front-line tanking, positional pressure.'],
        ['Rev. Miriam Slate', 'Preacher', 'Channeled buffs, nerve support, crowd management.'],
        ['Lucien "Fuse" Marr', 'Dynamiter', 'Delayed AOE, environmental destruction, terrain reshaping.'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Run instantly', code: 'npx @mcptoolshop/saints-mile' },
        { title: 'Install globally', code: 'npm install -g @mcptoolshop/saints-mile\nsaints-mile' },
        { title: 'Via cargo', code: 'cargo install saints-mile' },
      ],
    },
  ],
};
