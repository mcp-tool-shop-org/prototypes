import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'prov-engine-js',
  description: 'Zero-dependency Node.js provenance engine implementing prov-spec',
  logoBadge: 'PE',
  brandName: 'prov-engine-js',
  repoUrl: 'https://github.com/mcp-tool-shop-org/prov-engine-js',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/prov-engine-js',
  footerText: 'MIT Licensed \u2014 built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Node.js / Zero-Dep',
    headline: 'prov-engine-js,',
    headlineAccent: 'provenance you can verify.',
    description: 'A single-file, zero-dependency provenance engine for Node.js. Canonical JSON, SHA-256 digests, MCP envelope wrapping, and prov-spec L1 conformance \u2014 CLI and programmatic.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pnpm add @mcptoolshop/prov-engine-js' },
      { label: 'Digest', code: 'npx @mcptoolshop/prov-engine-js digest input.json' },
      { label: 'Verify', code: 'npx @mcptoolshop/prov-engine-js verify-digest artifact.json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why prov-engine-js?',
      subtitle: 'Provenance without the baggage.',
      features: [
        { title: 'Zero Dependencies', desc: 'Uses only Node.js built-ins: node:fs, node:crypto, node:process. Nothing to audit, nothing to break.' },
        { title: 'Single File', desc: 'The entire engine lives in prov-engine.js. Read the whole thing in one sitting.' },
        { title: 'CLI + Programmatic', desc: 'Run from the command line or import into your own code. Five commands cover the full workflow.' },
        { title: 'prov-spec L1 Conformant', desc: 'Passes all Level 1 (Integrity) test vectors. Zero known deviations.' },
        { title: 'JCS-Subset Canonicalization', desc: 'Deterministic JSON serialization per prov-spec Section 6. Sorted keys, no whitespace, normalized numbers.' },
        { title: 'Envelope Wrapping', desc: 'Wraps payloads in MCP envelopes with double-wrap protection. Already-wrapped envelopes pass through unchanged.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install & digest',
          code: 'pnpm add @mcptoolshop/prov-engine-js\n\n# Compute canonical form + SHA-256 digest\necho \'{"b":2,"a":1}\' > input.json\nnpx @mcptoolshop/prov-engine-js digest input.json\n# { "canonical_form": "{\\"a\\":1,\\"b\\":2}", "digest": { "alg": "sha256", "value": "abd8..." } }',
        },
        {
          title: 'Verify & wrap',
          code: '# Verify a digest claim\nnpx @mcptoolshop/prov-engine-js verify-digest artifact.json\n# Exit code 0 = valid, 1 = mismatch\n\n# Wrap payload in MCP envelope\nnpx @mcptoolshop/prov-engine-js wrap payload.json\n# { "schema_version": "mcp.envelope.v0.1", "result": ... }',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'CLI Commands',
      subtitle: 'All output is JSON written to stdout.',
      columns: ['Command', 'What It Does'],
      rows: [
        ['describe', 'Print the capability manifest (engine name, version, conformance level)'],
        ['digest <file>', 'Canonicalize JSON and compute SHA-256 digest'],
        ['wrap <file>', 'Wrap payload in an MCP envelope (double-wrap protected)'],
        ['verify-digest <file>', 'Verify a digest claim against recomputed hash'],
        ['check-vector <dir>', 'Run a prov-spec test vector (auto-detects type)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'methods',
      title: 'Implemented Methods',
      columns: ['Method', 'Description'],
      rows: [
        ['integrity.digest.sha256', 'Canonicalize JSON per prov-spec Section 6, then SHA-256 over UTF-8 bytes'],
        ['adapter.wrap.envelope_v0_1', 'Wrap any JSON payload in mcp.envelope.v0.1 (pass-through if already wrapped)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'canonicalization',
      title: 'Canonicalization Rules',
      subtitle: 'Deterministic JSON serialization per prov-spec Section 6.',
      columns: ['Rule', 'Detail'],
      rows: [
        ['Sorted keys', 'Object keys sorted lexicographically by Unicode code point'],
        ['No whitespace', 'No spaces or newlines between tokens'],
        ['Number normalization', 'No leading zeros, no trailing zeros after decimal, -0 becomes 0'],
        ['Minimal string escaping', 'Only required escape sequences emitted'],
        ['UTF-8 encoding', 'Canonical string encoded as UTF-8 before hashing'],
      ],
    },
  ],
};
