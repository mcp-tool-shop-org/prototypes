import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'InControl Desktop',
  description: 'Privacy-first local LLM chat for Windows — WinUI 3, RTX-accelerated, multi-backend.',
  logoBadge: 'IC',
  brandName: 'InControl',
  repoUrl: 'https://github.com/mcp-tool-shop-org/InControl-Desktop',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'Your AI.',
    headlineAccent: 'Your machine.',
    description: 'A privacy-first, GPU-accelerated chat application that runs large language models entirely on your Windows PC. No cloud required.',
    primaryCta: { href: '#install', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'Download MSIX from Releases → double-click → launch' },
      { label: 'Build', code: 'git clone … && dotnet restore && dotnet build' },
      { label: 'Run', code: 'dotnet run --project src/InControl.App' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Local AI chat that respects your privacy.',
      features: [
        { title: 'Private by default', desc: 'Your conversations never leave your computer. All data stored locally — no cloud, no telemetry.' },
        { title: 'RTX-accelerated', desc: 'Built for NVIDIA GPUs with CUDA acceleration. Targets RTX 3060+ with 8–16GB VRAM.' },
        { title: 'Native Windows', desc: 'WinUI 3 with Fluent Design. Looks and feels like a real Windows app, not an Electron wrapper.' },
        { title: 'Multi-backend', desc: 'Ollama, llama.cpp, or bring your own. Swap backends without changing your workflow.' },
        { title: 'Markdown rendering', desc: 'Rich text, code blocks, and syntax highlighting in every response.' },
        { title: 'NuGet libraries', desc: 'Core and Inference packages available on NuGet for building your own local AI integrations.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Installation',
      cards: [
        {
          title: 'From Release (recommended)',
          code: `# 1. Download latest MSIX from GitHub Releases
# 2. Double-click to install
# 3. Launch from Start Menu

# Prerequisite: Ollama
# https://ollama.ai/download
ollama pull llama3.2
ollama serve`,
        },
        {
          title: 'From Source',
          code: `git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App`,
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'nuget',
      title: 'NuGet Packages',
      cards: [
        {
          title: 'Add packages',
          code: `dotnet add package InControl.Core
dotnet add package InControl.Inference`,
        },
        {
          title: 'Use in your app',
          code: `// Stream chat with a local LLM
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'hardware',
      title: 'Target Hardware',
      columns: ['Component', 'Minimum', 'Recommended'],
      rows: [
        ['GPU', 'RTX 3060 (8GB)', 'RTX 4080/5080 (16GB)'],
        ['RAM', '16GB', '32GB'],
        ['OS', 'Windows 10 1809+', 'Windows 11'],
        ['.NET', '9.0', '9.0'],
      ],
    },
    {
      kind: 'data-table',
      id: 'architecture',
      title: 'Architecture',
      columns: ['Layer', 'Technology'],
      rows: [
        ['UI Framework', 'WinUI 3 (Windows App SDK 1.6)'],
        ['Architecture', 'MVVM with CommunityToolkit.Mvvm'],
        ['LLM Integration', 'OllamaSharp, Microsoft.Extensions.AI'],
        ['DI Container', 'Microsoft.Extensions.DependencyInjection'],
        ['Configuration', 'Microsoft.Extensions.Configuration'],
        ['Logging', 'Microsoft.Extensions.Logging + Serilog'],
      ],
    },
  ],
};
