import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Linux Dev Typer',
  description: 'Code-typing practice for developers — Avalonia UI, adaptive difficulty, trend tracking, fatigue detection.',
  logoBadge: 'LT',
  brandName: 'Linux Dev Typer',
  repoUrl: 'https://github.com/mcp-tool-shop-org/linux-dev-typer',
  npmUrl: 'https://www.nuget.org/packages/LinuxDevTyper.Core',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'Linux Dev Typer',
    headlineAccent: 'Practice real code, not prose.',
    description: 'Code-typing practice for developers with adaptive difficulty, weakness-aware snippet selection, trend tracking, and fatigue detection. Cross-platform via Avalonia UI.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git' },
      { label: 'Build', code: 'dotnet build -c Release' },
      { label: 'Run', code: 'dotnet run --project src/LinuxDevTyper.App/' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Core Features',
      subtitle: 'Fully offline. No telemetry, no accounts, no network calls.',
      features: [
        { title: 'Real Code Snippets', desc: 'Every snippet is a real-world pattern from Python, Rust, JavaScript, C#, or Java. 168 calibration snippets across 5 languages.' },
        { title: 'Adaptive Difficulty', desc: 'Elo-inspired per-language rating with anti-yo-yo protection, comfort-zone detection, and automatic difficulty aging.' },
        { title: 'Weakness Tracking', desc: 'Per-character mistake heatmaps and confusion pairs guide snippet selection so you practice what you struggle with.' },
        { title: 'Fatigue Detection', desc: 'The engine detects declining performance and suggests breaks before bad habits set in.' },
        { title: 'Cross-Platform', desc: 'Built on Avalonia UI — runs on Linux, macOS, and Windows from a single codebase.' },
        { title: 'Extensible Engine', desc: 'Core engine ships as a standalone NuGet package (LinuxDevTyper.Core) with zero UI dependencies.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Build & run',
          code: 'git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git\ncd linux-dev-typer\ndotnet restore\ndotnet build -c Release\ndotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj',
        },
        {
          title: 'Add your own code',
          code: '# Option 1: Paste Code (sidebar → Paste Code)\n# Option 2: Import File or Folder (sidebar → Import)\n# Option 3: Create a snippet pack JSON:\n# ~/.config/linux-dev-typer/packs/python.json\n{\n  "language": "python",\n  "snippets": [\n    { "id": "my_list", "title": "List comp",\n      "difficulty": 3, "code": "[x**2 for x in range(10)]\\n" }\n  ]\n}',
        },
      ],
    },
    {
      kind: 'features',
      id: 'learning',
      title: 'Adaptive Learning',
      subtitle: 'The engine learns your weaknesses and adapts every session.',
      features: [
        { title: 'Session Planner', desc: 'Target (50%) / Review (30%) / Stretch (20%) mix with selection transparency — "Why this snippet" explains every pick.' },
        { title: 'Guided Mode', desc: 'Opt-in toggle that lets weakness signals influence selection. WeaknessBias: +0 to +3, never changes difficulty band.' },
        { title: 'Micro-Drills', desc: '5-item focused practice sessions targeting your top weakness category.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'content',
      title: 'Content System',
      columns: ['Feature', 'Description'],
      rows: [
        ['User snippet packs', 'Drop JSON into ~/.config/linux-dev-typer/packs/'],
        ['Practice profiles', 'Named parameter sets that tune engine behavior'],
        ['.ldtpack bundles', 'Import/export portable content bundles for sharing'],
        ['Paste Code / Import', 'Quick import with auto-detected language'],
        ['Content-addressed IDs', 'SHA-256 deduplication — same code never added twice'],
        ['Canonical pipeline', 'All content enters as CodeItem with metrics-based difficulty (D1–D7)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'structure',
      title: 'Project Structure',
      columns: ['Path', 'Purpose'],
      rows: [
        ['LinuxDevTyper.Core', 'Portable engine — typing, rating, trends, difficulty, weakness, guided mode'],
        ['LinuxDevTyper.Core.Tests', 'xUnit tests (817 tests)'],
        ['LinuxDevTyper.App', 'Avalonia desktop shell — UI, platform services, import/export'],
        ['assets/snippets', 'Built-in JSON snippet packs'],
        ['assets/sounds', 'WAV files (ambient + keyboard SFX)'],
      ],
    },
  ],
};
