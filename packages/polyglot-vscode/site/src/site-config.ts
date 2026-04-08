import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Polyglot VS Code',
  description: 'Translate text, files, and READMEs directly in VS Code — powered by your local GPU',
  logoBadge: '🌐',
  brandName: 'Polyglot',
  repoUrl: 'https://github.com/mcp-tool-shop-org/polyglot-vscode',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'v0.1.3 — VS Code Extension',
    headline: 'Local GPU Translation',
    headlineAccent: 'inside VS Code.',
    description: '55 languages. Zero cloud dependency. All translation happens on your machine via TranslateGemma 12B + Ollama.',
    primaryCta: { href: '#commands', label: 'See commands' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'ext install mcp-tool-shop.polyglot-vscode' },
      { label: 'Shortcut', code: 'Select text → Ctrl+Alt+T → Pick language → Done' },
      { label: 'README', code: 'Polyglot: Translate README → 7 languages in one click' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need for in-editor translation.',
      features: [
        { title: 'Local & Private', desc: 'Runs TranslateGemma 12B on your GPU via Ollama. No API keys, no cloud, no data leaves your machine.' },
        { title: '55 Languages', desc: 'From Arabic to Welsh — covers all major languages plus dozens more. Full list in the README.' },
        { title: 'README-Aware', desc: 'Smart segmentation preserves code blocks, HTML badges, URLs, and table structure while translating content.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      columns: ['Command', 'Shortcut', 'Description'],
      rows: [
        ['**Translate Selection**', '`Ctrl+Alt+T`', 'Translate selected text in-place'],
        ['**Translate File**', '—', 'Translate current file to a new file'],
        ['**Translate README**', '—', 'Batch-translate README.md to multiple languages'],
        ['**Check Status**', '—', 'Verify Ollama connection and model availability'],
        ['**Help**', '—', 'Quick access to settings, walkthrough, and links'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'getting-started',
      title: 'Getting Started',
      cards: [
        {
          title: '1. Install Ollama',
          code: '# Download from https://ollama.com\n# Or on macOS:\nbrew install ollama\n\n# Start it:\nollama serve',
        },
        {
          title: '2. Use Polyglot',
          code: '# The model downloads automatically on first use\n# Select text in any file, then:\n#   Ctrl+Alt+T (Cmd+Alt+T on Mac)\n#   Right-click → Translate Selection\n#   Globe icon in editor title bar\n#   Sidebar panel → Translate Selection button',
        },
      ],
    },
    {
      kind: 'features',
      id: 'access',
      title: 'Access Points',
      subtitle: 'Translate from anywhere in VS Code.',
      features: [
        { title: 'Sidebar Panel', desc: 'Globe icon in the activity bar with styled action buttons, live Ollama status, and keyboard shortcut tips.' },
        { title: 'Editor Title Bar', desc: 'Globe icon appears in the editor title bar when text is selected. Translate File and README in the overflow menu.' },
        { title: 'Context Menu & Shortcuts', desc: 'Right-click selected text for "Translate Selection". Ctrl+Alt+T for instant translation. Command Palette for everything.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'settings',
      title: 'Settings',
      columns: ['Setting', 'Default', 'Description'],
      rows: [
        ['`polyglot.ollamaUrl`', '`http://localhost:11434`', 'Ollama server URL'],
        ['`polyglot.model`', '`translategemma:12b`', 'Translation model (try `2b` for less VRAM)'],
        ['`polyglot.defaultSourceLanguage`', '`en`', 'Source language for translations'],
        ['`polyglot.defaultLanguages`', '7 languages', 'Target languages for README translation'],
      ],
    },
    {
      kind: 'features',
      id: 'roadmap',
      title: 'Roadmap',
      subtitle: 'What\'s next for Polyglot.',
      features: [
        { title: 'Auto-detect Language', desc: 'Automatically detect the source language instead of defaulting to English.' },
        { title: 'Translation History', desc: 'Keep a log of recent translations with undo/redo support.' },
        { title: 'Custom Glossaries', desc: 'Define project-specific term translations for consistent technical writing.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'scorecard',
      title: 'Quality scorecard',
      subtitle: 'Ship Gate audit — 46/50.',
      columns: ['Category', 'Score', 'Notes'],
      rows: [
        ['A. Security', '10/10', 'SECURITY.md, local-only, no telemetry, no cloud'],
        ['B. Error Handling', '8/10', 'Status bar feedback, Ollama auto-recovery, error messages'],
        ['C. Operator Docs', '9/10', 'README, CHANGELOG, walkthrough, settings docs'],
        ['D. Shipping Hygiene', '9/10', 'CI + tests (88), VS Code Marketplace, VSIX packaging'],
        ['E. Identity', '10/10', 'Logo, translations, landing page, marketplace listing'],
      ],
    },
  ],
};
