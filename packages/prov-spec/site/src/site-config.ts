import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'prov-spec',
  description: 'A formal, language-neutral specification for verifiable provenance',
  logoBadge: 'PS',
  brandName: 'prov-spec',
  repoUrl: 'https://github.com/mcp-tool-shop-org/prov-spec',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Spec v0.1.0',
    headline: 'Verifiable provenance,',
    headlineAccent: 'any language.',
    description: 'A formal, language-neutral specification for verifiable provenance — stable method IDs, JSON schemas, conformance levels, and test vectors.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Handbook' },
    previews: [
      {
        label: 'Verify',
        code: 'python tools/python/prov_validator.py check-vector integrity.digest.sha256\n# → INFO: Test vector integrity.digest.sha256 passed',
      },
      {
        label: 'Declare',
        code: '// prov-capabilities.json\n{\n  "schema": "prov-capabilities@v0.1",\n  "implements": ["adapter.wrap.envelope_v0_1", "integrity.digest.sha256"],\n  "conformance_level": "L2-engine"\n}',
      },
      {
        label: 'Validate',
        code: 'python -m prov_validator validate-manifest prov-capabilities.json\npython -m prov_validator conformance-report prov-capabilities.json -o report.json',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'What prov-spec defines',
      subtitle: 'A minimal, stable surface any engine can implement.',
      features: [
        {
          title: 'Stable Method IDs',
          desc: 'Namespaced identifiers (adapter.*, engine.*, integrity.*, lineage.*) with a hard guarantee: stable IDs are append-only and will never change semantics within a major version.',
        },
        {
          title: 'JSON Schemas',
          desc: 'Strict schemas for provenance records, artifacts, evidence, and MCP envelopes — additionalProperties: false, forward-compatible within patch.',
        },
        {
          title: 'Test Vectors',
          desc: 'Canonical inputs/outputs for each method. Run them in any language to verify your implementation before shipping.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'conformance',
      title: 'Conformance levels',
      subtitle: 'Incremental tiers — each builds on the previous. Claim only what you implement.',
      columns: ['Level', 'Name', 'Required methods'],
      rows: [
        ['L1', 'Integrity', 'integrity.digest.sha256 (or sha512 / blake3)'],
        ['L2', 'Engine', 'L1 + adapter.wrap.envelope_v0_1 · adapter.provenance.attach_record_v0_1 · engine.prov.artifact.register_output'],
        ['L3', 'Lineage', 'L2 + lineage.parent.link'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        {
          title: 'Run a test vector',
          code: 'git clone https://github.com/mcp-tool-shop-org/prov-spec\ncd prov-spec\npython tools/python/prov_validator.py check-vector integrity.digest.sha256',
        },
        {
          title: 'List all stable methods',
          code: 'python tools/python/prov_validator.py list-methods\n# 19 stable methods across 4 namespaces',
        },
        {
          title: 'Validate a provenance record',
          code: 'python -m prov_validator validate-methods record.json --strict',
        },
        {
          title: 'Generate a conformance report',
          code: 'python -m prov_validator conformance-report prov-capabilities.json -o report.json',
        },
      ],
    },
    {
      kind: 'features',
      id: 'who',
      title: 'Who is this for?',
      subtitle: 'Language-neutral. Not a framework. Not MCP-specific.',
      features: [
        {
          title: 'Engine authors',
          desc: 'Implement provenance in any language against a stable, versioned spec. Ship a prov-capabilities.json to declare what you support.',
        },
        {
          title: 'Tool integrators',
          desc: 'Wrap existing tools with provenance records. Use the adapter.* methods to handle envelopes, errors, and pass-through cases correctly.',
        },
        {
          title: 'Auditors & builders',
          desc: 'Verify provenance claims against test vectors. Build provenance-aware infrastructure with confidence in forward compatibility.',
        },
      ],
    },
  ],
};
