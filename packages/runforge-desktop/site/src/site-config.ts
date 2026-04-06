import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'RunForge Desktop',
  description: 'Windows-native ML experiment tracker — create, monitor, and inspect training runs locally.',
  logoBadge: 'RF',
  brandName: 'RunForge Desktop',
  repoUrl: 'https://github.com/mcp-tool-shop-org/runforge-desktop',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'Train local.',
    headlineAccent: 'See everything.',
    description: 'A Windows-native desktop application for creating, monitoring, and inspecting ML training runs. No cloud. No telemetry. No accounts.',
    primaryCta: { href: '#install', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'Download MSIX from Releases → double-click → launch' },
      { label: 'Build', code: 'dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj' },
      { label: 'NuGet', code: 'dotnet add package RunForgeDesktop.Core' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'A visual control plane for local ML experiments.',
      features: [
        { title: 'Create runs', desc: 'Configure training runs with epoch presets, GPU/CPU selection, batch size, learning rate, and optimizer.' },
        { title: 'Live monitoring', desc: 'Real-time loss charts, live log streaming, progress tracking, and the ability to cancel at any time.' },
        { title: 'Hyperparameter sweeps', desc: 'Run multiple experiments with grid search across learning rates, batch sizes, and optimizers.' },
        { title: 'Run inspection', desc: 'Browse completed runs with full metrics, logs, and artifact inspection. Filter by status.' },
        { title: 'Local-first', desc: 'Everything runs on your machine. All artifacts saved to disk for inspection and reproducibility.' },
        { title: 'Reliability gauntlets', desc: 'Repeatable test suite for queueing, pause/resume, cancellation, crash recovery, and fair scheduling.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Installation',
      cards: [
        {
          title: 'From Release (recommended)',
          code: `# 1. Download latest .msix from GitHub Releases
# 2. Double-click to install
# 3. Launch from Start Menu

# Then: select a workspace folder
# and start training`,
        },
        {
          title: 'From Source',
          code: `git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj

# Run tests
dotnet test`,
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'nuget',
      title: 'NuGet Package',
      cards: [
        {
          title: 'Install',
          code: 'dotnet add package RunForgeDesktop.Core',
        },
        {
          title: 'What it includes',
          code: `// Core domain models and services for ML training:
// - Run lifecycle management
// - Hyperparameter sweeps
// - Live monitoring models
// - Artifact inspection types`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'requirements',
      title: 'System Requirements',
      columns: ['Requirement', 'Value'],
      rows: [
        ['OS', 'Windows 10 (1809+) or Windows 11'],
        ['Architecture', 'x64'],
        ['Runtime', '.NET 10 (bundled in MSIX)'],
        ['Python', '3.10+ (for training)'],
        ['GPU', 'Optional (CUDA for GPU training)'],
        ['Disk Space', '~100 MB'],
      ],
    },
    {
      kind: 'data-table',
      id: 'gauntlets',
      title: 'Reliability Gauntlets',
      columns: ['Gauntlet', 'Focus'],
      rows: [
        ['G1', 'max_parallel enforcement'],
        ['G2', 'Pause / Resume'],
        ['G3', 'Cancel determinism'],
        ['G4', 'Crash recovery'],
        ['G5', 'Fair scheduling'],
        ['G6', 'Disk drift resilience'],
        ['G7', 'Desktop reconnect'],
        ['G8–G10', 'GPU support'],
      ],
    },
  ],
};
