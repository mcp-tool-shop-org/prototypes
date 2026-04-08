import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Registrum',
  description: 'Deterministic structural registrar — dual-witness state transitions, fail-closed invariants, replayable history.',
  logoBadge: 'R',
  brandName: 'Registrum',
  repoUrl: 'https://github.com/mcp-tool-shop-org/Registrum',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'Change stays',
    headlineAccent: 'legible.',
    description: 'A governed, dual-witness registrar. 11 structural invariants, fail-closed validation, replayable history, and optional XRPL attestation. 279 tests.',
    primaryCta: { href: '#invariants', label: 'See the invariants' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Register', code: "const result = registrar.register({\n  from: null,\n  to: { id: 'state-1', structure: { version: 1 } }\n});" },
      { label: 'Validate', code: "if (result.kind === 'accepted') {\n  console.log(`Index: ${result.orderIndex}`);\n} else {\n  console.log(result.violations);\n}" },
      { label: 'Replay', code: "const snapshot = registrar.snapshot();\nconst fresh = new StructuralRegistrar();\nfresh.replay(snapshot); // identical results" },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'principles',
      title: 'Core Principles',
      subtitle: 'Entropy is allowed. Illegibility is not.',
      features: [
        { title: 'Deterministic', desc: 'Same inputs produce the same outputs, always. Every transition is replayable with identical results.' },
        { title: 'Fail-closed', desc: 'Invalid input causes hard failure, not partial recovery. Violations are surfaced, never resolved.' },
        { title: 'Non-agentic', desc: 'Never acts, decides, or optimizes. Preserves the conditions under which questions remain answerable.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'invariants',
      title: 'The 11 Invariants',
      subtitle: 'Constitutional constraints on every state transition.',
      columns: ['Class', 'Count', 'Purpose'],
      rows: [
        ['Identity', '3', 'Unique, immutable, content-addressed'],
        ['Lineage', '4', 'Valid parentage, acyclic, traceable'],
        ['Ordering', '4', 'Monotonic, gap-free, deterministic'],
      ],
    },
    {
      kind: 'features',
      id: 'witnesses',
      title: 'Dual Constitutional Witnesses',
      subtitle: 'Two independent invariant engines. Agreement required.',
      features: [
        { title: 'Registry (primary)', desc: 'Compiled DSL (RPEG v1) — the default constitutional engine since Phase H.' },
        { title: 'Legacy (secondary)', desc: 'TypeScript predicates — independent witness that must agree with Registry for any transition.' },
        { title: '274 parity tests', desc: '58 parity tests across all invariant classes, 12 persistence tests, full replay equivalence.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        { title: 'Install', code: 'npm install @mcp-tool-shop/registrum\n\nimport { StructuralRegistrar }\n  from "@mcp-tool-shop/registrum";\n\nconst registrar =\n  new StructuralRegistrar({ mode: "legacy" });' },
        { title: 'Register state', code: 'const result = registrar.register({\n  from: null,\n  to: {\n    id: "state-1",\n    structure: { version: 1 },\n    data: {}\n  }\n});\n// result.kind === "accepted" | "rejected"' },
      ],
    },
  ],
};
