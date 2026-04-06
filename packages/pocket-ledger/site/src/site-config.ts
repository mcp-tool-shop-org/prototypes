import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Pocket Ledger',
  description: 'Personal finance and budget tracking app — clean, simple, and private-first.',
  logoBadge: 'PL',
  brandName: 'Pocket Ledger',
  repoUrl: 'https://github.com/mcp-tool-shop-org/pocket-ledger',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'local-first · private · envelope budgeting',
    headline: 'Pocket Ledger',
    headlineAccent: '— your money, your device.',
    description: 'A personal finance app that keeps your financial data on your machine. No cloud sync, no telemetry, no external connections. Envelope budgeting that assigns every dollar a job.',
    primaryCta: { href: '#philosophy', label: 'Philosophy' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Privacy', code: 'Zero telemetry · Zero cloud · Your data stays local' },
      { label: 'Stack', code: '.NET 8 · WinUI 3 · SQLite · Clean Architecture' },
      { label: 'Build', code: 'dotnet build && dotnet test' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'philosophy',
      title: 'Philosophy',
      subtitle: 'What Pocket Ledger believes in.',
      features: [
        { title: 'Local-First', desc: 'Your financial data stays on your device. SQLite database in AppData. No cloud sync required — ever.' },
        { title: 'Privacy by Design', desc: 'Zero telemetry, zero external connections unless you opt-in. No analytics, no tracking, no data harvesting.' },
        { title: 'Envelope Budgeting', desc: 'Proven methodology that assigns every dollar a job. Allocate, spend, and track what remains — per category.' },
      ],
    },
    {
      kind: 'features',
      id: 'features',
      title: 'Planned Features',
      subtitle: 'What\'s coming to Pocket Ledger.',
      features: [
        { title: 'Transaction Tracking', desc: 'Categorized transactions with recurring management. Multi-account support for checking, savings, and credit.' },
        { title: 'Savings Goals', desc: 'Visual progress toward what you\'re saving for. Goal-oriented budgeting that keeps you motivated.' },
        { title: 'Insights & Export', desc: 'Spending reports and visual breakdowns. CSV import/export for portability. Dark and light theme support.' },
      ],
    },
    {
      kind: 'features',
      id: 'architecture',
      title: 'Architecture',
      subtitle: 'Clean Architecture — separation of concerns at every layer.',
      features: [
        { title: 'Domain Layer', desc: 'Core entities (Account, Transaction, Envelope, Goal), value objects, domain events, and business rules. No external dependencies.' },
        { title: 'Application Layer', desc: 'Use cases like CreateTransaction, TransferFunds, AllocateBudget. Service interfaces and DTOs for clean boundaries.' },
        { title: 'Infrastructure + UI', desc: 'SQLite persistence with repository pattern. WinUI 3 presentation with MVVM and CommunityToolkit.Mvvm.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'tech-stack',
      title: 'Tech Stack',
      subtitle: 'Modern, native, and maintainable.',
      columns: ['Component', 'Technology', 'Purpose'],
      rows: [
        ['Runtime', '.NET 8', 'Modern, performant cross-platform runtime'],
        ['UI Framework', 'WinUI 3 / Windows App SDK', 'Native Windows 11 experience'],
        ['Database', 'SQLite', 'Local, portable, zero-config persistence'],
        ['MVVM', 'CommunityToolkit.Mvvm', 'Observable properties, commands, messaging'],
        ['DI', 'Microsoft.Extensions.DependencyInjection', 'Standard .NET service registration'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'development',
      title: 'Development',
      cards: [
        { title: 'Prerequisites', code: `# Requirements
Windows 10/11
Visual Studio 2022 (17.8+) or VS Code + C# Dev Kit
.NET 8 SDK
Windows App SDK` },
        { title: 'Build & Test', code: `# Build the solution
dotnet build

# Run tests
dotnet test

# Domain tests — pure unit tests, no mocking
# Application tests — mock repositories
# Infrastructure tests — in-memory SQLite` },
      ],
    },
  ],
};
