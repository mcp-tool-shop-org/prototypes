import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Attestia Desktop',
  description: 'Financial intent verification for Windows — WinUI 3 app and .NET SDK for blockchain attestation and reconciliation',
  logoBadge: 'AD',
  brandName: 'Attestia Desktop',
  repoUrl: 'https://github.com/mcp-tool-shop-org/Attestia-Desktop',
  npmUrl: 'https://www.nuget.org/packages/Attestia.Core',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'WinUI 3 / .NET 9',
    headline: 'Attestia Desktop,',
    headlineAccent: 'verify intent before it hits the chain.',
    description: 'Typed financial intents, cryptographic Merkle proofs, three-way reconciliation, and compliance mapping — all in a native Windows desktop app with a .NET SDK you can use anywhere.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Declare', code: 'await client.Intents.DeclareAsync(request);' },
      { label: 'Verify', code: 'await client.Intents.VerifyAsync(id, matched: true);' },
      { label: 'Reconcile', code: 'var report = await client.Reconciliation.ReconcileAsync(req);' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Attestia?',
      subtitle: 'Verify intent before it hits the chain.',
      features: [
        { title: 'Typed Financial Intents', desc: 'Declare, approve, execute, and verify transactions with structured records instead of raw payloads.' },
        { title: 'Cryptographic Proofs', desc: 'Merkle-tree inclusion proofs and attestation packages provide tamper-evident audit trails.' },
        { title: 'Three-Way Reconciliation', desc: 'Intent vs. ledger vs. chain matching catches discrepancies before they compound.' },
        { title: 'Compliance Mapping', desc: 'Map attestation controls to regulatory frameworks and generate scored compliance reports.' },
        { title: 'Event Sourcing', desc: 'Every state change is an immutable, hash-chained domain event with full causation tracking.' },
        { title: 'Desktop-First UX', desc: 'Native WinUI 3 app with real-time dashboard, intent management, proof explorer, and reconciliation views.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Declare & verify',
          code: 'using Attestia.Client;\n\nvar client = new AttestiaClient(http);\n\n// Declare a financial intent\nvar intent = await client.Intents.DeclareAsync(new DeclareIntentRequest\n{\n    Kind = "transfer",\n    Description = "Send 1,000 USDC to treasury",\n});\n\n// Approve, execute, verify\nawait client.Intents.ApproveAsync(intent.Id);\nawait client.Intents.VerifyAsync(intent.Id, matched: true);',
        },
        {
          title: 'Reconcile',
          code: 'var report = await client.Reconciliation\n    .ReconcileAsync(new ReconcileRequest\n{\n    Intents = intents,\n    LedgerEntries = ledgerEntries,\n    ChainEvents = chainEvents,\n});\n\nConsole.WriteLine(report.Summary.AllReconciled\n    ? "All matched"\n    : $"{report.Summary.MismatchCount} mismatches");',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'NuGet Packages',
      subtitle: 'Use the SDK without the desktop app.',
      columns: ['Package', 'Purpose'],
      rows: [
        ['Attestia.Core', 'Domain models, enums, shared types \u2014 Intent, MerkleProof, Money, ComplianceFramework, DomainEvent'],
        ['Attestia.Client', 'HTTP client SDK with typed sub-clients for Intents, Proofs, Reconciliation, Compliance, Events'],
        ['Attestia.Sidecar', 'Node.js process manager \u2014 port discovery, health polling, auto-restart, clean teardown'],
      ],
    },
    {
      kind: 'data-table',
      id: 'desktop',
      title: 'Desktop Views',
      subtitle: 'Native WinUI 3 dashboard.',
      columns: ['View', 'What It Shows'],
      rows: [
        ['Dashboard', 'Real-time overview of active intents, recent attestations, and system health'],
        ['Intents', 'Full lifecycle management \u2014 declare, approve, reject, execute, verify'],
        ['Proofs', 'Merkle inclusion proof explorer with one-click verification'],
        ['Reconciliation', 'Three-way matching results with mismatch drill-down'],
        ['Compliance', 'Framework mapping and scored compliance reports'],
        ['Events', 'Immutable event stream with causation tracking'],
      ],
    },
    {
      kind: 'data-table',
      id: 'tech',
      title: 'Tech Stack',
      columns: ['Layer', 'Technology'],
      rows: [
        ['UI Framework', 'WinUI 3 (Windows App SDK)'],
        ['Runtime', '.NET 9.0'],
        ['MVVM', 'CommunityToolkit.Mvvm'],
        ['Backend', 'Node.js sidecar (managed by Attestia.Sidecar)'],
        ['Crypto', 'Merkle trees, hash-chained event sourcing'],
        ['Platform', 'Windows 10 (1809+)'],
      ],
    },
  ],
};
