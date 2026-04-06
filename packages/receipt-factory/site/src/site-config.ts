import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'receipt-factory',
  description: 'Signed, timestamped, reproducible records of what happened — tamper-evident receipts for CI, releases, audits, and supply chain.',
  logoBadge: 'RF',
  brandName: 'receipt-factory',
  repoUrl: 'https://github.com/mcp-tool-shop-org/receipt-factory',
  npmUrl: 'https://www.npmjs.com/package/@receipt-factory/cli',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'Prove work happened.',
    headlineAccent: 'Without trusting vibes.',
    description: 'receipt-factory creates signed, timestamped, reproducible records of CI runs, releases, audits, and supply chain operations. Every receipt is content-addressed, tamper-evident, and verifiable in under 2 minutes.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install -g @receipt-factory/cli' },
      { label: 'Create', code: 'rf make ci --from github --run 12345678' },
      { label: 'Verify', code: 'rf verify receipts/ci/2026-03-03/12345678.json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why receipts?',
      subtitle: 'Receipts answer five questions about every operation.',
      features: [
        { title: 'Content-addressed', desc: 'Every receipt is SHA-256 hashed. Change one byte and the hash breaks. Tamper-evident by default.' },
        { title: 'Policy-governed', desc: 'Portable policy packs define what "good" means. Lint rules travel with your org, not your repo.' },
        { title: 'Self-verifying bundles', desc: 'Bundle receipts into zip capsules with hash manifests and detached cosign signatures. Portable proof.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'Packages',
      subtitle: '10 composable packages — use one or all.',
      columns: ['Package', 'Purpose'],
      rows: [
        ['rf-core', 'Schema, canonicalization, SHA-256 hashing, fluent builder API'],
        ['rf-render', 'Markdown + standalone HTML renderers'],
        ['rf-verify', 'Schema validation, hash integrity, link verification, policy enforcement'],
        ['rf-sign', 'Cosign-based signing — receipts, policies, bundles'],
        ['rf-evidence', 'Portable, content-addressed evidence bundles'],
        ['rf-index', 'Scan, search, and filter receipt directories'],
        ['rf-policy', 'Portable, versioned lint configuration packs'],
        ['rf-bundle', 'Self-verifying truth capsules (zip)'],
        ['rf-adapter-github', 'GitHub Actions data fetching via gh CLI'],
        ['rf-cli', 'The rf command — create, collect, render, verify, sign'],
      ],
    },
    {
      kind: 'data-table',
      id: 'pipelines',
      title: 'Pipelines',
      subtitle: 'Five receipt kinds — each proves a different operation.',
      columns: ['Pipeline', 'Kind', 'What it proves'],
      rows: [
        ['ci-receipts', 'ci_run', 'A CI build/test happened with specific inputs and results'],
        ['release-receipts', 'release', 'A release was published with specific assets and commits'],
        ['registry-sync', 'registry_sync', 'Drift between published packages and repo state'],
        ['security-audit', 'audit', 'What was scanned, with what tool, what was found'],
        ['sbom', 'sbom', 'Software bill of materials generated and attested'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick start',
      cards: [
        { title: 'Create a receipt', code: '# From a GitHub Actions run\nrf make ci --from github --run 12345678\n\n# From an evidence pack\nrf make audit --from evidence --pack evidence/audit/' },
        { title: 'Verify + bundle', code: '# Verify with policy enforcement\nrf verify receipt.json --strict --policy policy.json\n\n# Bundle into a portable capsule\nrf bundle create receipt.json --follow --policy policy.json' },
      ],
    },
    {
      kind: 'features',
      id: 'trust-layers',
      title: 'Four trust layers',
      subtitle: 'Stack them. Each layer adds a guarantee.',
      features: [
        { title: '1. Receipt integrity', desc: 'SHA-256 content-addressed receipts detect any tampering automatically.' },
        { title: '2. Governance integrity', desc: 'Policy-based lint rules with signed policy files enforce org-wide standards.' },
        { title: '3. Bundle integrity', desc: 'Self-verifying zip bundles with hash manifests prove nothing was added or removed.' },
      ],
    },
    {
      kind: 'api',
      id: 'cli-reference',
      title: 'CLI reference',
      subtitle: 'The rf command covers the full lifecycle.',
      apis: [
        { signature: 'rf make <kind> --from <source>', description: 'Create a receipt from a data source (github, evidence pack)' },
        { signature: 'rf collect <kind> --run <id>', description: 'Collect raw data into an evidence pack for offline receipt creation' },
        { signature: 'rf render <file> --format <md|html>', description: 'Render a receipt as Markdown or standalone HTML' },
        { signature: 'rf verify <file> [--strict] [--policy <file>]', description: 'Validate schema, hash integrity, links, and policy compliance' },
        { signature: 'rf bundle create <file> [--follow] [--policy <file>]', description: 'Package receipts + evidence into a self-verifying zip capsule' },
        { signature: 'rf bundle sign <file> --keyless', description: 'Sign a bundle with cosign (detached sidecar)' },
        { signature: 'rf search <dir> --kind <kind> [--subject <query>]', description: 'Search receipt directories by kind, subject, or date range' },
        { signature: 'rf graph <dir>', description: 'Emit a JSON graph of receipt-to-receipt references' },
      ],
    },
  ],
};
