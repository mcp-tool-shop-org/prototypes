import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Game Dev MCP',
  description: 'MCP server giving any LLM control over game engines. Unreal Engine 5 today, more tomorrow.',
  logoBadge: 'GD',
  brandName: 'game-dev-mcp',
  repoUrl: 'https://github.com/mcp-tool-shop-org/game-dev-mcp',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: '44 tools',
    headline: 'Talk to your',
    headlineAccent: 'game engine.',
    description: 'Spawn actors, build levels, tweak properties — all through natural conversation with any LLM. Unreal Engine 5 today, more engines tomorrow.',
    primaryCta: { href: '#get-started', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Run', code: 'npx @mcptoolshop/game-dev-mcp' },
      { label: 'Prompt', code: '"Spawn a point light above the table and make it warm"' },
      { label: 'Result', code: '✓ ue_spawn_actor → PointLight placed at (0, 0, 300)' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Game Dev MCP',
      subtitle: 'Your LLM becomes a game development co-pilot.',
      features: [
        { title: '44 MCP Tools', desc: 'Actors, assets, blueprints, levels, properties, editor controls, and project memory — all accessible through natural language.' },
        { title: 'Knowledge Library', desc: '35 built-in UE5 tutorials your LLM reads on demand. Nanite, Lumen, Behavior Trees — no context wasted until needed.' },
        { title: 'Zero Plugins', desc: 'Uses the Remote Control API that ships with UE5. No third-party plugins. No C++ compilation. Just enable and go.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'get-started',
      title: 'Get Started',
      cards: [
        {
          title: '1. Enable Remote Control API',
          code: '# In UE5 (5.4+):\n# Edit > Plugins → search "Remote Control API" → Enable\n# Restart the editor',
        },
        {
          title: '2. Add to your MCP client',
          code: '{\n  "mcpServers": {\n    "gamedev": {\n      "command": "npx",\n      "args": ["@mcptoolshop/game-dev-mcp"]\n    }\n  }\n}',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'Tool Categories',
      subtitle: '44 tools organized into 9 categories.',
      columns: ['Category', 'Count', 'What it does'],
      rows: [
        ['Actors', '9', 'Spawn, delete, duplicate, transform, list, find, and select actors in the level'],
        ['Properties', '4', 'Read and write any UPROPERTY on any UObject — discover, get, and set'],
        ['Assets', '8', 'Search, list, duplicate, rename, delete, and save assets in the content browser'],
        ['Levels', '4', 'Save, load, get info, and batch-save dirty packages'],
        ['Blueprints', '5', 'Create classes, add components, configure properties, compile, and spawn'],
        ['Editor', '4', 'Ping, console commands, engine info, and viewport snap'],
        ['Knowledge', '1', 'Search 35 built-in UE5 tutorials on demand mid-conversation'],
        ['Project', '7', 'Store conventions, notes, and context that persists across sessions'],
        ['Mission', '2', 'Track multi-step progress with real-time notifications'],
      ],
    },
    {
      kind: 'features',
      id: 'highlights',
      title: 'Built for Real Workflows',
      subtitle: 'Not a demo — a daily driver for game development.',
      features: [
        { title: 'Project Memory', desc: 'Store conventions, level layouts, and naming rules in .game-dev-mcp/ — your LLM picks up where you left off.' },
        { title: 'Mission Tracking', desc: 'Multi-step operations tracked with progress updates. Integrates with mcp-aside for real-time notifications.' },
        { title: 'Configurable', desc: 'Host, port, timeout, and log level — all via environment variables. Works on any network setup.' },
      ],
    },
  ],
};
