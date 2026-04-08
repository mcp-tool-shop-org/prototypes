import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Dev-Op-Typer',
  description: 'Developer-focused typing practice for Windows — type real code across 6 languages, with adaptive difficulty and live stats.',
  logoBadge: 'DT',
  brandName: 'Dev-Op-Typer',
  repoUrl: 'https://github.com/mcp-tool-shop-org/dev-op-typer',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'WinUI 3 · .NET 10',
    headline: 'Type real code,',
    headlineAccent: 'get faster.',
    description: 'Adaptive typing practice built for developers. Type actual Python, JavaScript, C#, Java, SQL, and Bash — not lorem ipsum. Per-language Elo ratings, weakness heatmaps, mechanical keyboard sounds. Fully offline, no account required.',
    primaryCta: { href: '#get-started', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Build & run',
        code: 'git clone https://github.com/mcp-tool-shop-org/dev-op-typer\ncd dev-op-typer\n\n# Requires .NET 10 SDK + Windows App SDK workload\ndotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64\n\n# Run:\nDevOpTyper\\bin\\x64\\Release\\net10.0-windows10.0.19041.0\\DevOpTyper.exe',
      },
      {
        label: 'Snippet pack',
        code: '// Drop a JSON file into:\n// %LocalAppData%\\DevOpTyper\\UserSnippets\\\n\n{\n  "language": "python",\n  "snippets": [\n    {\n      "id": "list_comp",\n      "title": "List comprehension",\n      "difficulty": 3,\n      "topics": ["lists"],\n      "code": "squares = [x**2 for x in range(10)]\\n"\n    }\n  ]\n}',
      },
      {
        label: 'Add your code',
        code: '# Three ways to practice your own code:\n#\n# 1. Paste Code (quickest)\n#    Settings → Paste Code → Add\n#    Language is auto-detected\n#\n# 2. Import File / Folder\n#    Settings → Import → select .py / .js / .cs / .java / .sql / .sh\n#    Deduplication by SHA-256 content hash\n#\n# 3. Share as .ldtpack bundle\n#    Settings → Export Bundle → share with others',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Practice that actually teaches',
      subtitle: 'Every session adapts to you — harder when you\'re comfortable, easier when you\'re struggling.',
      features: [
        {
          title: 'Real code, six languages',
          desc: '168+ built-in calibration snippets across Python, JavaScript, C#, Java, SQL, and Bash. Character-by-character accuracy tracking — symbols, indentation, and newlines all count. No hand-waving.',
        },
        {
          title: 'Adaptive difficulty engine',
          desc: 'Per-language Elo-like rating system selects snippets at the right challenge level. Session planner balances Target (50%), Review (30%), and Stretch (20%). Guided Mode adds weakness-biased micro-drills.',
        },
        {
          title: 'Live stats and weakness tracking',
          desc: 'Real-time WPM, accuracy, and error count. Rolling trend charts per language. Per-character mistake heatmap with trajectory analysis. Fatigue detection with break prompts.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'content',
      title: 'Your code, your way',
      subtitle: 'Four ways to bring your own practice content into the app.',
      columns: ['Method', 'How', 'Best For'],
      rows: [
        ['Paste Code', 'Settings → Paste Code → Add', 'Quick one-off snippets from clipboard'],
        ['Import File', 'Settings → Import File', 'Single source file, auto-detected language'],
        ['Import Folder', 'Settings → Import Folder', 'Index an entire project at once'],
        ['Snippet Pack (.json)', 'Drop in UserSnippets folder', 'Curated sets, shareable with teammates'],
        ['.ldtpack Bundle', 'Settings → Export / Import Bundle', 'Portable packs for sharing content'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'get-started',
      title: 'Get started',
      cards: [
        {
          title: 'Build from source',
          code: 'git clone https://github.com/mcp-tool-shop-org/dev-op-typer\ncd dev-op-typer\n\n# Requires Windows 10 1809+, .NET 10 SDK\n# Visual Studio 2022 with Windows App SDK workload\ndotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64',
        },
        {
          title: 'Add your own code',
          code: '# Option 1 — Paste any code\n#   Settings → Paste Code → Add\n\n# Option 2 — Import a file or folder\n#   Settings → Import → pick .py/.js/.cs/.java/.sql/.sh\n\n# Option 3 — Drop a JSON snippet pack\n#   %LocalAppData%\\DevOpTyper\\UserSnippets\\',
        },
        {
          title: 'Keyboard shortcuts',
          code: '# During a typing session:\n#\n# Enter       →  Start new test\n# Escape      →  Reset current test\n# Tab         →  Navigate controls\n# Shift+Tab   →  Navigate backwards\n#\n# Settings:\n# ⚙ in title bar → open settings panel',
        },
        {
          title: 'Customize audio',
          code: '# Mechanical keyboard themes:\n#   Cherry MX Blue / Brown / Red\n#   Topre / Buckling spring\n#   8 sound variations each\n#\n# Ambient soundscapes:\n#   Rain / Deep focus / Café / White noise\n#\n# Per-channel volume: Settings → Audio',
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Built on honest principles',
      subtitle: 'Fully offline. No telemetry. No lock-in.',
      features: [
        {
          title: 'Completely private',
          desc: 'Dev-Op-Typer is fully offline. No data is collected, transmitted, or shared. Your typing history, ratings, and profile never leave your machine. See PRIVACY.md.',
        },
        {
          title: 'Windows-native WinUI 3',
          desc: 'Built with WinUI 3 and .NET 10 for a modern, fluent Windows experience. Respects system theme, DPI, and accessibility settings — not a web app wrapped in Electron.',
        },
        {
          title: 'Open content system',
          desc: 'Snippet packs are plain JSON you can read, write, and share. No proprietary format, no vendor lock-in. Export bundles as .ldtpack files — share with your team.',
        },
      ],
    },
  ],
};
