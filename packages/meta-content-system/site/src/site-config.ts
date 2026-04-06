import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Meta Content System',
  description: 'Portable content ingestion, normalization, and indexing for typing-practice apps. Zero external dependencies.',
  logoBadge: 'MC',
  brandName: 'Meta Content System',
  repoUrl: 'https://github.com/mcp-tool-shop-org/meta-content-system',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'One pipeline.',
    headlineAccent: 'Every platform.',
    description: 'Portable content ingestion, normalization, and indexing. Deterministic language detection, difficulty metrics, and library generation — zero external dependencies.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'dotnet add package DevOpTyper.Content' },
      { label: 'Build', code: 'dotnet run -- build --source ./code --out library.index.json' },
      { label: 'Query', code: 'library.Query(new ContentQuery { Language = "python" })' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to turn source code into typed content.',
      features: [
        { title: 'Cross-platform determinism', desc: 'Same input files produce the same library.index.json on Windows, Linux, and macOS. No platform drift.' },
        { title: 'Zero dependencies', desc: 'Pure .NET 8 library built entirely on the BCL. Nothing to install, nothing to conflict.' },
        { title: 'Interface-driven', desc: 'Every pipeline stage is behind an abstraction — IContentSource, IExtractor, IMetricCalculator, IContentLibrary.' },
        { title: 'Language detection', desc: 'Rule-based identification from file extensions and content heuristics. Supports 20+ languages out of the box.' },
        { title: 'Content deduplication', desc: 'SHA-256 content-addressed IDs prevent duplicates across imports. Import the same file twice, get one entry.' },
        { title: 'Difficulty metrics', desc: 'Symbol density, indent depth, line count, and character distribution power adaptive difficulty in consuming apps.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'As a library',
          code: `// Create the pipeline
IExtractor extractor = new DefaultExtractor();
IMetricCalculator metrics = new MetricCalculator();
var builder = new LibraryIndexBuilder(extractor, metrics);

// Build an index from a content source
IContentSource source = new MyFolderSource("./samples");
LibraryIndex index = await builder.BuildAsync(source);

// Query the library
var library = new InMemoryContentLibrary(index.Items);
var snippets = library.Query(new ContentQuery {
    Language = "python",
    MinLines = 5,
    MaxSymbolDensity = 0.4f
});`,
        },
        {
          title: 'Using the CLI',
          code: `# Build an index from source files
dotnet run --project src/DevOpTyper.Content.Cli \\
  -- build --source ./my-code --out library.index.json

# Paste a single snippet
dotnet run --project src/DevOpTyper.Content.Cli \\
  -- paste --lang csharp --title "Hello" \\
  --text "Console.WriteLine(\\"Hello\\");"`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'metrics',
      title: 'Metrics Computed',
      columns: ['Metric', 'Type', 'Description'],
      rows: [
        ['Lines', 'int', 'Total line count'],
        ['Characters', 'int', 'Total character count including whitespace'],
        ['SymbolDensity', 'float', 'Ratio of symbol characters to non-whitespace (0.0–1.0)'],
        ['MaxIndentDepth', 'int', 'Deepest indentation level (4-space tabs)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'design',
      title: 'Design Goals',
      columns: ['Goal', 'How'],
      rows: [
        ['Platform-stable output', 'LF normalization, deterministic sort, content-addressed IDs'],
        ['Zero external dependencies', 'Pure .NET 8 BCL — no third-party NuGet packages'],
        ['Interface-driven', 'Every pipeline stage is behind an abstraction'],
        ['Testable', 'xUnit test suite with golden-parity checks'],
        ['Extensible', 'Implement IContentSource or IExtractor for custom behavior'],
      ],
    },
    {
      kind: 'data-table',
      id: 'consumers',
      title: 'Consuming Apps',
      columns: ['App', 'Platform', 'Repository'],
      rows: [
        ['Dev-Op-Typer', 'Windows (WinUI 3)', 'mcp-tool-shop-org/dev-op-typer'],
        ['linux-dev-typer', 'Cross-platform (.NET)', 'mcp-tool-shop-org/linux-dev-typer'],
      ],
    },
  ],
};
