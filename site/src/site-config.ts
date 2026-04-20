import type { SiteConfig } from '@mcptoolshop/site-theme';
import seedsData from './data/seeds.json';
import taxonomyData from './data/taxonomy.json';

// Build-time data consumed from the generated seeds.json + taxonomy.json
// (produced by `pnpm seed:index`). Any counts or category highlights shown on
// the landing page come from here — do not hand-edit. Re-run `pnpm seed:index`
// after backfill/review changes.
type Seed = {
  name: string;
  taxonomy?: { category?: string };
  lifecycle?: { state?: string };
  health?: { hasTests?: boolean | null };
};
const seeds = ((seedsData as any).seeds ?? []) as Seed[];
const categories = ((taxonomyData as any).categories ?? []) as { id: string; label: string }[];
const total = seeds.length;

const categoryCounts = categories
  .map((c) => {
    const members = seeds
      .filter((s) => s.taxonomy?.category === c.id)
      .map((s) => s.name)
      .sort();
    return {
      id: c.id,
      label: c.label,
      count: members.length,
      highlights: members.slice(0, 4).join(', ') + (members.length > 4 ? `, +${members.length - 4} more` : ''),
    };
  })
  .filter((c) => c.count > 0)
  .sort((a, b) => b.count - a.count);

const testedCount = seeds.filter((s) => s.health?.hasTests === true).length;

export const config: SiteConfig = {
  title: 'Prototypes — MCP Tool Shop',
  description: `${total} archived packages from MCP Tool Shop — consolidated into a single monorepo. A seed vault of proven concepts, stepping stones, and experiments.`,
  logoBadge: 'PT',
  brandName: 'Prototypes',
  repoUrl: 'https://github.com/mcp-tool-shop-org/prototypes',
  footerText:
    'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Seed Vault',
    headline: 'Prototypes',
    headlineAccent: 'the ideas that built the shop.',
    description: `${total} packages from the MCP Tool Shop org — voice engines, developer tools, desktop apps, game prototypes, and more. Preserved during the April 2026 consolidation. Every seed carries a structured passport (CodeMeta + RO-Crate + MCPD lifecycle + patterns + agent capsule). Browse the source, steal patterns, revive what works.`,
    primaryCta: { href: 'seeds/', label: `Browse ${total} seeds` },
    secondaryCta: { href: 'handbook/seed-vault/', label: 'Read the handbook' },
    previews: [
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/prototypes.git' },
      { label: 'Browse', code: 'https://mcp-tool-shop-org.github.io/prototypes/seeds/' },
      { label: 'Machine-readable', code: 'curl https://raw.githubusercontent.com/mcp-tool-shop-org/prototypes/main/llms.txt' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'about',
      title: 'Not a graveyard — a seed vault',
      subtitle:
        'Every package here solved a real problem or proved a concept that shaped the tools we ship today.',
      features: [
        {
          title: `${total} packages`,
          desc: `Across ${categoryCounts.length} categories. ${testedCount} ship with tests. Every seed has a passport: identity, lifecycle, taxonomy, structured patterns, and (soon) lessons-learned.`,
        },
        {
          title: 'Machine-readable',
          desc: 'Every seed has passport.json composing CodeMeta 3.0 core, RO-Crate 1.1 profile, MCPD-style lifecycle facets, SWHID slot, and novel patterns[]/failureModes[]/agentCapsule fields. AJV-validated. llms.txt at repo root.',
        },
        {
          title: 'Revivable',
          desc: 'See something that should be a product? Pull it out, give it a repo, and ship it. Passports are starting points, not dead ends — lifecycle.state flows sapling → active → graduated.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'categories',
      title: 'Packages by category',
      subtitle: `${total} packages across ${categoryCounts.length} domains — generated from passport metadata.`,
      columns: ['Category', 'Count', 'Highlights'],
      rows: categoryCounts.map((c) => [c.label, String(c.count), c.highlights]),
    },
  ],
};
