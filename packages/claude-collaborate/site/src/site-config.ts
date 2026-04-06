import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'claude-collaborate',
  description: 'Where Human Creativity Meets AI Intelligence — a unified sandbox for real-time human-AI collaboration',
  logoBadge: 'CC',
  brandName: 'claude-collaborate',
  repoUrl: 'https://github.com/mcp-tool-shop-org/claude-collaborate',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Real-time Sandbox',
    headline: 'Human creativity,',
    headlineAccent: 'meets AI intelligence.',
    description: 'A unified sandbox for real-time human-AI collaboration — shared whiteboard, live code editor, chess workshop, and more. All connected through a WebSocket bridge to Claude Code.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Start',
        code: 'git clone https://github.com/mcp-tool-shop-org/claude-collaborate\ncd claude-collaborate\npip install aiohttp\npython server.py\n# → http://localhost:8877',
      },
      {
        label: 'Bridge',
        code: '# Read messages from the UI\ncurl http://localhost:8877/api/ws/messages\n\n# Send a response back\ncurl -X POST http://localhost:8877/api/ws/respond \\\n  -d \'{"content": "Hello from Claude!"}\'',
      },
      {
        label: 'WebSocket',
        code: '// Browser → Claude\n{ "type": "user_message", "content": "Hello!" }\n\n// Claude → Browser\n{ "type": "claude_response", "content": "Hi there!" }',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'One sandbox, everything connected',
      subtitle: 'Six interactive environments, one WebSocket bridge, zero configuration.',
      features: [
        {
          title: '6 built-in environments',
          desc: 'Whiteboard, Code Workshop, Chess Workshop, Capture Viewer, GitHub Toolkit, and Creative Lab — each a self-contained HTML workspace, all accessible from a single sidebar.',
        },
        {
          title: 'WebSocket bridge to Claude Code',
          desc: 'ws_bridge.py connects Claude Code directly to the browser in real time. Claude reads messages, sends responses, and drives the UI — no copy-paste, no polling.',
        },
        {
          title: 'Extensible by design',
          desc: 'Copy template.html, drop it in the root, add one sidebar entry. Your new environment is live. No build step, no framework, no config files.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'environments',
      title: 'Environments',
      subtitle: 'Switch between workspaces instantly from the sidebar.',
      columns: ['Environment', 'What you can do'],
      rows: [
        ['Whiteboard', 'Draw, sketch, and brainstorm visually with Claude'],
        ['Code Workshop', 'HTML/CSS/JS editor with live preview — write and run together'],
        ['Chess Workshop', 'Strategy and tactics playground — discuss moves in real time'],
        ['Capture Viewer', 'Browse screenshots and recordings from your sessions'],
        ['GitHub Toolkit', 'Generate READMEs and marketing content, push directly'],
        ['Creative Lab', 'Interactive experiments and one-off creative explorations'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        {
          title: 'Run the server',
          code: 'pip install aiohttp\npython server.py\n# Open http://localhost:8877',
        },
        {
          title: 'Read messages from Claude Code',
          code: 'curl http://localhost:8877/api/ws/messages',
        },
        {
          title: 'Send a response to the browser',
          code: 'curl -X POST http://localhost:8877/api/ws/respond \\\n  -H "Content-Type: application/json" \\\n  -d \'{"content": "Hello from Claude!"}\'',
        },
        {
          title: 'Create a new environment',
          code: 'cp template.html my-workspace.html\n# Add one <div class="env-item"> to index.html\n# Refresh — done',
        },
      ],
    },
    {
      kind: 'api',
      id: 'api',
      title: 'API endpoints',
      subtitle: 'Lightweight REST interface for Claude Code integration.',
      apis: [
        { signature: 'GET /api/ws/messages', description: 'Read pending messages sent from the browser UI' },
        { signature: 'POST /api/ws/respond', description: 'Send a response from Claude back to the browser' },
        { signature: 'GET /api/ws/status', description: 'Check WebSocket bridge connection status' },
        { signature: 'GET /health', description: 'Server health check' },
        { signature: 'WS /ws', description: 'Direct WebSocket connection for real-time bidirectional messaging' },
      ],
    },
  ],
};
