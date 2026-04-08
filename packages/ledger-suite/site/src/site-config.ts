import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Ledger Suite',
  description: 'Unified monorepo for cryptographic provenance ledgers — ClaimLedger and CreatorLedger.',
  logoBadge: 'LS',
  brandName: 'Ledger Suite',
  repoUrl: 'https://github.com/mcp-tool-shop-org/ledger-suite',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Open source',
    headline: 'Cryptographic provenance',
    headlineAccent: 'for claims and creators.',
    description: 'Ed25519 signatures, RFC 3161 timestamps, and attestation chains — packaged as two CLI-first .NET libraries with 590 tests.',
    primaryCta: { href: '#ledgers', label: 'See the ledgers' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Claim', code: 'dotnet run --project ClaimLedger.Cli -- assert claim.json' },
      { label: 'Attest', code: 'dotnet run --project CreatorLedger.Cli -- attest asset.png' },
      { label: 'Test', code: 'dotnet test ledger-suite.sln   # 590 tests' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'why',
      title: 'Why Ledger Suite',
      subtitle: 'Portable, offline-first cryptographic proof.',
      features: [
        { title: 'Ed25519 signed', desc: 'Every claim, citation, and attestation carries a cryptographic signature. No blockchain, no third party.' },
        { title: 'RFC 3161 timestamps', desc: 'Non-repudiation via trusted timestamping authorities. Proves when a claim was made.' },
        { title: '590 tests', desc: 'ClaimLedger (371) + CreatorLedger (219). Runs on every push with Windows CI for DPAPI coverage.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'ledgers',
      title: 'The Ledgers',
      subtitle: 'Two ledgers, one shared crypto layer.',
      columns: ['Project', 'Purpose', 'Tests'],
      rows: [
        ['ClaimLedger', 'Scientific claim provenance and verification', '371'],
        ['CreatorLedger', 'Creator attestation proofs for digital assets', '219'],
        ['Shared.Crypto', 'Ed25519 primitives shared across both ledgers', '—'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        { title: 'Build & test', code: 'git clone https://github.com/mcp-tool-shop-org/ledger-suite.git\ncd ledger-suite\n\ndotnet build ledger-suite.sln\ndotnet test ledger-suite.sln' },
        { title: 'ClaimLedger CLI', code: '# Assert a claim with Ed25519 signature\ndotnet run --project src/ClaimLedger/ClaimLedger.Cli -- assert claim.json\n\n# Publish a ClaimPack bundle\ndotnet run --project src/ClaimLedger/ClaimLedger.Cli -- publish' },
      ],
    },
    {
      kind: 'features',
      id: 'claim-features',
      title: 'ClaimLedger',
      subtitle: 'Scientific claim provenance.',
      features: [
        { title: 'Assertions', desc: 'Sign claims with Ed25519 keys. Each assertion is a self-contained cryptographic proof.' },
        { title: 'Citations & attestations', desc: 'Link claims together. Peer review, reproduction, and institutional approval — all signed.' },
        { title: 'ClaimPacks', desc: 'Bundle claims, citations, and attestations into portable packages for offline verification.' },
      ],
    },
    {
      kind: 'features',
      id: 'creator-features',
      title: 'CreatorLedger',
      subtitle: 'Creator attestation proofs.',
      features: [
        { title: 'Content hashing', desc: 'SHA-256 content hashes bind attestations to specific file versions.' },
        { title: 'Multi-party chains', desc: 'Build attestation chains across multiple signers for collaborative provenance.' },
        { title: 'Proof bundles', desc: 'Export portable proof bundles that verify without network access.' },
      ],
    },
  ],
};
