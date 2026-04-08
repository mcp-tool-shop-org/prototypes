import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'codeteam-suite',
  description: 'The authoritative CodeTeam implementation — .NET CLI and library for package verification, approval, and signing.',
  logoBadge: 'CT',
  brandName: 'codeteam-suite',
  repoUrl: 'https://github.com/mcp-tool-shop-org/codeteam-suite',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'v0.2.0 — Cryptographic trust loop complete',
    headline: 'One implementation.',
    headlineAccent: 'All editors delegate to it.',
    description: 'The authoritative .NET CLI and library for package verification, approval, and signing. Extensions render results — they don\'t implement logic.',
    primaryCta: { href: '#cli', label: 'See CLI commands' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'dotnet tool install -g CodeTeam' },
      { label: 'Verify', code: 'codeteam verify <package-path> --json' },
      { label: 'Sign', code: 'codeteam sign <package-path> --key <key-id> --json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Built for correctness, not convenience.',
      features: [
        {
          title: 'Cryptographic Trust',
          desc: 'Ed25519 signature verification and SHA-256 digest computation via NSec.Cryptography. Signatures mean something here.',
        },
        {
          title: 'Schema-Locked Contracts',
          desc: 'JSON schemas are frozen and CI-protected. Additive changes only. Interop smoke tests fail the build on any breaking change.',
        },
        {
          title: 'Quorum Policy',
          desc: 'Approval thresholds are enforced by the library — not by convention. Insufficient approvals fail with FAIL_THRESHOLD, not a silent pass.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'NuGet Packages',
      subtitle: 'Each layer has a single responsibility.',
      columns: ['Package', 'Responsibility'],
      rows: [
        ['CodeTeam', '.NET global tool — install with dotnet tool install -g CodeTeam'],
        ['CodeTeam.Core', 'Domain models, verification logic, canonical JSON, quorum-based policy evaluation'],
        ['CodeTeam.Crypto', 'Ed25519 signature verification and SHA-256 digest computation'],
        ['CodeTeam.Packaging', 'Package reading and verification with path-traversal protection and JSON schema validation'],
      ],
    },
    {
      kind: 'data-table',
      id: 'exit-codes',
      title: 'Exit Codes',
      subtitle: 'Machine-readable, contract-stable, CI-friendly.',
      columns: ['Code', 'Status', 'Meaning'],
      rows: [
        ['0', 'OK_VERIFIED', 'Package verified with valid signature'],
        ['1', 'OK_UNSIGNED', 'Package valid but unsigned'],
        ['2', 'FAIL_INTEGRITY', 'Missing file, size/digest mismatch'],
        ['3', 'FAIL_SCHEMA', 'Schema validation failed'],
        ['4', 'FAIL_SIGNATURE', 'Signature verification failed'],
        ['5', 'FAIL_THRESHOLD', 'Approval threshold not met'],
        ['6', 'FAIL_UNAUTHORIZED', 'Actor not authorized'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'cli',
      title: 'CLI Usage',
      cards: [
        {
          title: 'Install & verify',
          code: `# Install the global tool
dotnet tool install -g CodeTeam

# Verify a package (structured JSON output)
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json`,
        },
        {
          title: 'Sign & build',
          code: `# Sign a package
codeteam sign <package-path> --key <key-id> --json

# Build and test the suite locally
dotnet build
dotnet test`,
        },
      ],
    },
  ],
};
