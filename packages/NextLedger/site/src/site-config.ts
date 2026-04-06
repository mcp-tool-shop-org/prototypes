import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'NextLedger',
  description: 'Personal budgeting app with envelope-style budgeting — offline-first, Windows-native, your data stays local.',
  logoBadge: 'NL',
  brandName: 'NextLedger',
  repoUrl: 'https://github.com/mcp-tool-shop-org/NextLedger',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'WinUI 3 · Windows',
    headline: 'Give every dollar',
    headlineAccent: 'a job.',
    description: 'Offline-first envelope budgeting for Windows. Allocate every dollar to a purpose, track spending across accounts, import from CSV, and reconcile — all on your machine. No cloud, no subscription, no account required.',
    primaryCta: { href: '#download', label: 'Download' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Download',
        code: '# Latest release:\n# github.com/mcp-tool-shop-org/NextLedger/releases/latest\n\n# Download the ZIP, extract, run:\nNextLedger.App.exe\n\n# No installation required.',
      },
      {
        label: 'Envelope budgeting',
        code: '# How it works:\n#\n# 1. Add income  →  $3,200 available to allocate\n# 2. Fill envelopes:\n#      Rent        →  $1,200\n#      Groceries   →    $400\n#      Transport   →    $200\n#      Savings     →    $500\n#      Fun money   →    $200\n#      ...\n# 3. Spend from envelopes only\n# 4. Envelope hits zero → stop spending',
      },
      {
        label: 'Build',
        code: '# Prerequisites: Windows 10 1809+, .NET 9, WinUI 3\ndotnet workload install microsoft-net-sdk-maui-windows\n\ngit clone https://github.com/mcp-tool-shop-org/NextLedger\ncd NextLedger\ndotnet build NextLedger.sln\ndotnet test',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Budgeting that actually keeps score',
      subtitle: 'Every dollar allocated. Every transaction categorized. No surprises.',
      features: [
        {
          title: 'Envelope budgeting',
          desc: 'Allocate every dollar of income to a named envelope — Rent, Groceries, Fun Money. You can only spend what\'s in each envelope, making overspending structurally impossible.',
        },
        {
          title: 'Offline-first, always yours',
          desc: 'All data lives in a local SQLite database on your machine. No cloud sync, no account, no subscription. Your financial history is yours — export or back it up however you want.',
        },
        {
          title: 'Multiple accounts, one view',
          desc: 'Track checking, savings, credit cards, and cash in one place. Import transactions from bank CSV exports, reconcile against statements, and analyze spending by envelope.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'roadmap',
      title: 'Future Ledger roadmap',
      subtitle: 'NextLedger is evolving toward a future ledger — an authoritative system of financial truth.',
      columns: ['Layer', 'Status', 'Description'],
      rows: [
        ['Observation', '✅ Complete', 'Local balances, transactions, and accounts'],
        ['Interpretation', '✅ Complete', 'Envelope budgeting and spending analysis'],
        ['Intent Declaration', '🔜 Planned', 'Budget goals and allocation rules'],
        ['Constraint Enforcement', '🔜 Planned', 'Budget limits and overspend protection'],
        ['User-Approved Execution', '🔮 Future', 'Web3 integration (non-custodial)'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'download',
      title: 'Get started',
      cards: [
        {
          title: 'Download (no install required)',
          code: '# Go to:\n# github.com/mcp-tool-shop-org/NextLedger/releases/latest\n#\n# 1. Download the ZIP\n# 2. Extract anywhere\n# 3. Run NextLedger.App.exe\n#\n# Requires Windows 10 (1809+) or Windows 11',
        },
        {
          title: 'First budget in 5 minutes',
          code: '# 1. Add your accounts (checking, savings, credit card)\n# 2. Enter starting balances\n# 3. Create envelopes (Rent, Groceries, Gas, Fun...)\n# 4. Allocate this month\'s income across envelopes\n# 5. Log transactions as you spend\n# 6. Import CSV from your bank to catch anything you missed',
        },
        {
          title: 'Import from your bank',
          code: '# Most banks export CSV from their website\n#\n# In NextLedger:\n# File → Import CSV →  select your export\n#\n# Supported formats:\n# - Standard bank CSV (date, description, amount)\n# - YNAB export format\n# - Custom column mapping for any format',
        },
        {
          title: 'Build from source',
          code: 'git clone https://github.com/mcp-tool-shop-org/NextLedger\ncd NextLedger\n\n# Install .NET 9 + WinUI 3\ndotnet workload install microsoft-net-sdk-maui-windows\n\n# Build and test\ndotnet build NextLedger.sln\ndotnet test',
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Built on honest principles',
      subtitle: 'No dark patterns. No lock-in. No surprises.',
      features: [
        {
          title: 'Windows-native WinUI 3',
          desc: 'Built with WinUI 3 and Windows App SDK for a modern, fluent Windows experience — not a web app wrapped in Electron. Respects system theme, DPI, and accessibility settings.',
        },
        {
          title: 'Privacy first',
          desc: 'Zero telemetry. Zero analytics. No network calls. NextLedger never phones home. Your financial data — transactions, balances, budgets — never leaves your machine.',
        },
        {
          title: 'Clean Architecture',
          desc: 'Built with Clean Architecture and MVVM. The budget engine is fully unit-tested and separated from the UI. SQLite for durability, C# for type safety, .NET 9 for performance.',
        },
      ],
    },
  ],
};
