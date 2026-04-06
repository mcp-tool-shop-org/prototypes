import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Zip Meta Map',
  description: 'Turn any ZIP or folder into an LLM-friendly metadata bundle — role-classified files, traversal plans, byte budgets.',
  logoBadge: 'ZM',
  brandName: 'zip-meta-map',
  repoUrl: 'https://github.com/mcp-tool-shop-org/zip-meta-map',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'AI Tooling',
    headline: 'Map any archive',
    headlineAccent: 'for LLM navigation.',
    description: 'Generate a deterministic metadata layer that tells AI agents what\'s inside, what matters first, and how to navigate without drowning in context.',
    primaryCta: { href: '#install', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install zip-meta-map' },
      { label: 'Build', code: 'zip-meta-map build my-project/ -o output/\n# Profile: python_cli  Files: 47' },
      { label: 'Explain', code: 'zip-meta-map explain my-project/\n# Top files to read first:\n#   README.md  [doc]  conf=0.95' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Three questions, answered automatically.',
      features: [
        { title: 'Role classification', desc: 'Every file gets a role (entrypoint, config, doc, test, etc.), a confidence score, and a reason — bounded vocabulary, deterministic heuristics.' },
        { title: 'Traversal plans', desc: 'Auto-generated reading plans with byte budgets: overview, debug, add_feature, security_review, deep_dive — so agents know where to start.' },
        { title: 'Progressive disclosure', desc: 'Chunk maps for large files, module summaries, excerpts, risk flags (exec_shell, secrets_like, network_io), and capability negotiation.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Usage',
      cards: [
        {
          title: 'CLI',
          code: '# Build metadata for a folder or ZIP\nzip-meta-map build path/to/repo -o output/\n\n# Explain what was detected\nzip-meta-map explain path/to/repo\n\n# Compare two indices (CI-friendly)\nzip-meta-map diff old.json new.json --exit-code\n\n# Validate an existing index\nzip-meta-map validate META_ZIP_INDEX.json',
        },
        {
          title: 'GitHub Action',
          code: '- name: Generate metadata map\n  uses: mcp-tool-shop-org/zip-meta-map@v0\n  with:\n    path: .\n\n# Outputs: index-path, front-path,\n#   profile, file-count, warnings-count\n# Set pr-comment: true for PR summaries',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'outputs',
      title: 'What It Generates',
      subtitle: 'Three files, each with a clear purpose.',
      columns: ['File', 'Purpose'],
      rows: [
        ['META_ZIP_FRONT.md', 'Human-readable orientation page'],
        ['META_ZIP_INDEX.json', 'Machine-readable index with roles, confidence, plans, chunks, excerpts, risk flags'],
        ['META_ZIP_REPORT.md', 'Detailed browseable report (with --report md)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'profiles',
      title: 'Profiles',
      subtitle: 'Auto-detected by repo shape.',
      columns: ['Profile', 'Detected By', 'Plans'],
      rows: [
        ['python_cli', 'pyproject.toml, setup.py', 'overview, debug, add_feature, security_review, deep_dive'],
        ['node_ts_tool', 'package.json, tsconfig.json', 'overview, debug, add_feature, security_review, deep_dive'],
        ['monorepo', 'pnpm-workspace.yaml, lerna.json', 'overview, debug, add_feature, security_review, deep_dive'],
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Design',
      subtitle: 'Built for reliability and stability.',
      features: [
        { title: 'Deterministic', desc: 'Same input always produces the same output. Heuristics are rule-based, not probabilistic — diffs are meaningful.' },
        { title: 'Spec-versioned', desc: 'Follows semver: minor bumps add fields, major bumps break consumers. capabilities[] advertises which features are populated.' },
        { title: 'Risk-aware', desc: 'Flags exec_shell, secrets_like, network_io, path_traversal, binary_masquerade, and binary_executable automatically.' },
      ],
    },
  ],
};
