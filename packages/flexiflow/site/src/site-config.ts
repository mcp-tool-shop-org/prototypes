import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'FlexiFlow',
  description: 'A lightweight async component engine with events, state machines, and a minimal CLI.',
  logoBadge: 'FF',
  brandName: 'FlexiFlow',
  repoUrl: 'https://github.com/mcp-tool-shop-org/flexiflow',
  footerText: 'MIT Licensed \u2014 built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'FlexiFlow',
    headlineAccent: 'Async components, done right.',
    description: 'A lightweight async component engine with events, state machines, persistence, and a minimal CLI. Under 2,000 lines of pure Python.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install flexiflow' },
      { label: 'Create', code: "engine = FlexiFlowEngine()" },
      { label: 'Run', code: "await engine.handle_message(name, 'start')" },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need, nothing you don\u2019t.',
      features: [
        { title: 'Async Event Bus', desc: 'Priority-based subscriptions with sequential or concurrent delivery and pluggable error policies.' },
        { title: 'State Machines', desc: 'Declarative states with built-in message types. Load custom states via dotted paths or YAML packs.' },
        { title: 'Persistence', desc: 'JSON for dev, SQLite for production. Snapshot history with retention pruning built in.' },
        { title: 'Structured Logging', desc: 'Correlation IDs baked into every log entry. Trace any message through the full pipeline.' },
        { title: 'Config Introspection', desc: 'explain() validates your config and shows what will happen before you run anything.' },
        { title: 'Minimal CLI', desc: 'Register, handle messages, hot-swap rules, and debug \u2014 all from the command line.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Install',
          code: '# Core\npip install flexiflow\n\n# With extras\npip install flexiflow[reload]  # hot-reload\npip install flexiflow[api]     # FastAPI',
        },
        {
          title: 'CLI',
          code: '# Register and start a component\nflexiflow register --config config.yaml --start\n\n# Send messages\nflexiflow handle --config config.yaml confirm',
        },
        {
          title: 'Embedded',
          code: "from flexiflow.engine import FlexiFlowEngine\nfrom flexiflow.config_loader import ConfigLoader\n\nconfig = ConfigLoader.load_component_config('config.yaml')\nengine = FlexiFlowEngine()\ncomponent = engine.create_component(config)\nawait engine.handle_message(component.name, 'start')",
        },
        {
          title: 'Event Bus',
          code: "# Subscribe with priority\nhandle = await bus.subscribe(\n    'my.event', 'my_component', handler, priority=2\n)\n\n# Publish\nawait bus.publish('my.event', data, delivery='sequential')",
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'observability',
      title: 'Observability Events',
      subtitle: 'Built-in events for monitoring your components.',
      columns: ['Event', 'When', 'Payload'],
      rows: [
        ['engine.component.registered', 'Component registered', '{component}'],
        ['component.message.received', 'Message received', '{component, message}'],
        ['state.changed', 'State transition', '{component, from_state, to_state}'],
        ['event.handler.failed', 'Handler exception', '{event_name, component_name, exception}'],
      ],
    },
    {
      kind: 'data-table',
      id: 'persistence',
      title: 'Persistence',
      subtitle: 'Choose the right backend for your use case.',
      columns: ['Feature', 'JSON', 'SQLite'],
      rows: [
        ['History', 'Overwrites', 'Appends'],
        ['Retention', 'N/A', 'prune_snapshots_sqlite()'],
        ['Best for', 'Dev / debugging', 'Production'],
      ],
    },
  ],
};
