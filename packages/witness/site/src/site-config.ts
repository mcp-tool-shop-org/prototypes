import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Witness',
  description: 'Local-first, append-only event journal for human-AI work. Cryptographically verifiable.',
  logoBadge: 'W',
  brandName: 'Witness',
  repoUrl: 'https://github.com/mcp-tool-shop-org/witness',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Cryptographic proof',
    headline: 'Witness',
    headlineAccent: 'proof trails for AI work.',
    description: 'A local-first, append-only, cryptographically verifiable event journal. Record what happened. Verify it later. Let humans decide what it means.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Record', code: 'witness record --action "deploy" --intent "Ship v2"' },
      { label: 'Testify', code: 'witness testify --format json --emit-artifact ./out' },
      { label: 'Verify', code: 'witness verify' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Witness',
      subtitle: 'Portable proof trails for human-AI collaboration.',
      features: [
        { title: 'Deterministic', desc: 'Same inputs produce the same output bytes. Use --generated-at for fully reproducible testimony.' },
        { title: 'Cryptographic', desc: 'Ed25519 signatures + SHA-256 digests over canonical JSON. Every event is independently verifiable.' },
        { title: 'Portable', desc: 'Email it, attach it to tickets, check it into a repo. Third parties validate without Witness installed.' },
        { title: 'Append-Only', desc: 'SQLite-backed store where events are never modified or deleted. The journal only grows.' },
        { title: 'Exact Replay', desc: '--include-events embeds byte-for-byte store content for deep audits and full reconstruction.' },
        { title: 'Local-First', desc: 'Everything runs on your machine. No cloud, no accounts, no telemetry. Your proof stays yours.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install & initialize',
          code: 'pip install cryptography\n\nwitness init\nwitness record --action "example.action" \\\n  --intent "Demonstrate recording"',
        },
        {
          title: 'Testify & verify',
          code: '# Generate testimony\nwitness testify --format md\nwitness testify --format json --emit-artifact ./out\n\n# Verify all events\nwitness verify\n\n# Deep audit with full event data\nwitness testify --format json --include-events',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'trust',
      title: 'Trust Model',
      subtitle: 'Canonical JSON, SHA-256 digests, Ed25519 signatures.',
      columns: ['Layer', 'Mechanism'],
      rows: [
        ['Serialization', 'Canonical JSON — deterministic byte ordering'],
        ['Integrity', 'SHA-256 digest over canonical bytes'],
        ['Authentication', 'Ed25519 signatures per event'],
        ['Verification', 'Exit 0 = clean, 2 = flags, 3 = crypto failure'],
      ],
    },
    {
      kind: 'data-table',
      id: 'guarantees',
      title: 'Stable Guarantees',
      subtitle: 'Contracts that will not break.',
      columns: ['Artifact', 'Location', 'Contract'],
      rows: [
        ['Event schema', 'tests/fixtures/golden/*.json', 'Golden fixtures'],
        ['Testimony schema', 'schemas/testimony.schema.v0.1.json', 'JSON output structure'],
        ['Exit codes', 'VERIFICATION.md', '0/2/3 semantics'],
        ['Flags', 'IMPLEMENTATION_NOTES.md', '4 flag types, informational only'],
      ],
    },
    {
      kind: 'data-table',
      id: 'docs',
      title: 'Documentation',
      columns: ['Document', 'Purpose'],
      rows: [
        ['CONTRACT.md', 'What is law vs example — start here'],
        ['IMPLEMENTATION_NOTES.md', 'Locked invariants'],
        ['VERIFICATION.md', 'Crypto rules + worked examples'],
        ['docs/', 'Full documentation index'],
      ],
    },
  ],
};
