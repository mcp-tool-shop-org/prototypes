import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'ConsensusOS',
  description: 'Modular, zero-dependency control plane for multi-chain consensus governance.',
  logoBadge: 'CO',
  brandName: 'consensus-os',
  repoUrl: 'https://github.com/mcp-tool-shop-org/ConsensusOS',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/consensus-os',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'npm · Zero deps',
    headline: 'Consensus control plane,',
    headlineAccent: 'plugin-first.',
    description: 'Modular, zero-dependency control plane for multi-chain consensus governance. Every state transition is fail-closed, every event is replayable, every plugin has a frozen API.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Install',
        code: 'npm install @mcptoolshop/consensus-os\n# Node.js 18+ required. Zero runtime dependencies.',
      },
      {
        label: 'Boot',
        code: "import { CoreLoader, createHealthSentinel, createReleaseVerifier } from '@mcptoolshop/consensus-os';\n\nconst loader = new CoreLoader({ configs: { 'health-sentinel': { intervalMs: 10_000 } } });\nloader.register(createHealthSentinel());\nloader.register(createReleaseVerifier());\nawait loader.boot();",
      },
      {
        label: 'Invariants',
        code: "// Subscribe to events\nloader.events.subscribe('health.*', (event) => {\n  console.log(`[${event.topic}]`, event.data);\n});\n\n// Gate a state transition\nconst verdict = await loader.invariants.check({ action: 'deploy' });\nconsole.log('Allowed:', verdict.allowed);",
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why ConsensusOS?',
      subtitle: 'Multi-chain infrastructure without the hope-and-scripts approach.',
      features: [
        {
          title: 'Zero production dependencies',
          desc: 'Nothing in your supply chain you didn\'t write. The entire control plane — event bus, invariant engine, plugin loader — ships with no runtime deps.',
        },
        {
          title: 'Fail-closed invariants',
          desc: 'Invalid state transitions are always rejected, never partially applied. Register invariants once; they gate every future action until the engine shuts down.',
        },
        {
          title: 'Deterministic replay',
          desc: 'Every event is ordered and stored. Reproduce any system state from the event history — debug incidents, test migrations, or audit governance decisions after the fact.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'modules',
      title: 'Modules & Adapters',
      subtitle: 'Built-in plugins and chain adapters — register what you need, skip the rest.',
      columns: ['Export', 'Purpose'],
      rows: [
        ['createHealthSentinel()', 'Node health monitoring via heartbeats'],
        ['createReleaseVerifier()', 'Software release hash verification'],
        ['createConfigGuardian()', 'Configuration schema validation and migration'],
        ['createSandboxPlugin()', 'Isolated simulation, replay, and amendment engine'],
        ['createGovernorPlugin()', 'Token-based execution, policy enforcement, build queue'],
        ['createXrplAdapter()', 'XRPL chain adapter — ledger queries and transaction dispatch'],
        ['createEthereumAdapter()', 'Ethereum chain adapter'],
        ['createCosmosAdapter()', 'Cosmos chain adapter'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        {
          title: 'Install',
          code: 'npm install @mcptoolshop/consensus-os',
        },
        {
          title: 'Register and boot plugins',
          code: "import { CoreLoader, createHealthSentinel, createConfigGuardian, createXrplAdapter } from '@mcptoolshop/consensus-os';\n\nconst loader = new CoreLoader({\n  configs: { 'health-sentinel': { intervalMs: 10_000 } },\n});\nloader.register(createHealthSentinel());\nloader.register(createConfigGuardian());\nloader.register(createXrplAdapter());\nawait loader.boot();",
        },
        {
          title: 'Check invariants',
          code: "const verdict = await loader.invariants.check({ action: 'deploy' });\nif (!verdict.allowed) {\n  console.error('Blocked:', verdict.reasons);\n}\nawait loader.shutdown(); // Graceful, reverse-boot order",
        },
        {
          title: 'Build a custom plugin',
          code: "import { BasePlugin, ManifestBuilder } from '@mcptoolshop/consensus-os/plugin';\n\nclass MyMonitor extends BasePlugin {\n  readonly manifest = ManifestBuilder.create('my-monitor')\n    .name('My Monitor')\n    .version('1.0.0')\n    .capability('sentinel')\n    .build();\n\n  protected async onStart() {\n    this.on('health.check.completed', (e) => this.log.info('Result', e.data));\n    this.emit('my-monitor.ready', { status: 'online' });\n  }\n}",
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Built for production governance',
      subtitle: 'The full stack from event bus to chain adapter.',
      features: [
        {
          title: 'Frozen Plugin API v1',
          desc: 'A stable contract that won\'t break your integrations. BasePlugin, ManifestBuilder, and validatePlugin() are locked — upgrade the core without touching your plugins.',
        },
        {
          title: 'Resource-bounded execution',
          desc: 'CPU, memory, and time limits enforced via governor tokens. The policy layer rejects work that would exceed budgets before it starts.',
        },
        {
          title: 'Multi-chain out of the box',
          desc: 'XRPL, Ethereum, and Cosmos adapters ship in the package. Each adapter speaks the shared event bus — subscribe to any chain event the same way.',
        },
      ],
    },
  ],
};
