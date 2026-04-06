import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'websketch-mcp',
  description: 'MCP server exposing WebSketch IR tools for LLM agents — validate, render, diff, and fingerprint web captures.',
  logoBadge: 'WS',
  brandName: 'websketch-mcp',
  repoUrl: 'https://github.com/mcp-tool-shop-org/websketch-mcp',
  npmUrl: 'https://www.npmjs.com/package/websketch-mcp',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'MCP Server · npm',
    headline: 'WebSketch IR tools,',
    headlineAccent: 'for LLM agents.',
    description: 'Four MCP tools that give LLM agents structured access to web page captures — validate, render to ASCII wireframe, diff two snapshots, or hash for change detection. Never throws. Always composable.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Install',
        code: 'npm install -g websketch-mcp\n\n# Then add to Claude Desktop:\n# { "mcpServers": { "websketch": { "command": "websketch-mcp" } } }',
      },
      {
        label: 'Validate + render',
        code: '// In your LLM agent — call websketch_validate first\nconst check = await mcp.call("websketch_validate", { capture });\nif (!check.ok) throw new Error(check.error);\n\n// Then render to ASCII wireframe\nconst wireframe = await mcp.call("websketch_render", { capture });\nconsole.log(wireframe.ascii);',
      },
      {
        label: 'Diff + fingerprint',
        code: '// Compare two captures for structural changes\nconst delta = await mcp.call("websketch_diff", { before, after });\nconsole.log(delta.added, delta.removed, delta.changed);\n\n// Deterministic hash for change detection\nconst { hash } = await mcp.call("websketch_fingerprint", { capture });\n// Same page structure → same hash, always',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Four tools. One workflow.',
      subtitle: 'Designed to be called in sequence — validate first, then render, diff, or fingerprint.',
      features: [
        {
          title: 'websketch_validate — call this first',
          desc: 'Preflight check for any WebSketch IR capture. Never throws — always returns `{ ok: true }` or `{ ok: false, error: "..." }`. Gate every other tool behind it.',
        },
        {
          title: 'websketch_render — see the structure',
          desc: 'Renders a validated capture to a compact ASCII wireframe. Gives LLMs a spatial, text-readable representation of any web page without images or HTML.',
        },
        {
          title: 'websketch_diff — detect changes',
          desc: 'Compares two captures and returns added, removed, and changed nodes. Track UI regressions, confirm deployments, or assert layout invariants in agent workflows.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'All four MCP tools',
      subtitle: 'Each tool is a single MCP call with typed input and output.',
      columns: ['Tool', 'Input', 'Output'],
      rows: [
        ['websketch_validate', 'capture: WebSketchIR', '{ ok: boolean, error?: string }'],
        ['websketch_render', 'capture: WebSketchIR', '{ ascii: string }'],
        ['websketch_diff', 'before: WebSketchIR, after: WebSketchIR', '{ added, removed, changed }'],
        ['websketch_fingerprint', 'capture: WebSketchIR', '{ hash: string }'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        {
          title: 'Install globally',
          code: 'npm install -g websketch-mcp\n\n# Or run without installing:\nnpx websketch-mcp',
        },
        {
          title: 'Add to Claude Desktop',
          code: '// claude_desktop_config.json\n{\n  "mcpServers": {\n    "websketch": {\n      "command": "websketch-mcp"\n    }\n  }\n}',
        },
        {
          title: 'Typical agent workflow',
          code: '// 1. Capture a page (via websketch-extension or websketch-ir CLI)\n// 2. Validate before doing anything\nconst { ok } = await mcp.call("websketch_validate", { capture });\n\n// 3. Render for the LLM to understand layout\nconst { ascii } = await mcp.call("websketch_render", { capture });\n\n// 4. After a deploy, diff against the baseline\nconst delta = await mcp.call("websketch_diff", { before: baseline, after: capture });\n\n// 5. Hash for lightweight change detection\nconst { hash } = await mcp.call("websketch_fingerprint", { capture });',
        },
        {
          title: 'Run from source',
          code: 'git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git\ncd websketch-mcp\nnpm ci && npm run build\nnpm link\n\n# Runs as a stdio MCP server\nwebsketch-mcp',
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Built for agent reliability',
      subtitle: 'Designed to fail gracefully and compose cleanly.',
      features: [
        {
          title: 'Never throws',
          desc: 'websketch_validate always returns a result — never an exception. Agents can safely gate downstream tool calls on `ok: true` without try/catch scaffolding.',
        },
        {
          title: 'Deterministic output',
          desc: 'websketch_fingerprint produces the same hash for the same structure, every time. Use it for snapshot testing, cache keys, or regression detection in CI.',
        },
        {
          title: 'Part of the WebSketch ecosystem',
          desc: 'Works with captures from websketch-extension (browser) and websketch-ir (CLI). One IR format across all tools — capture anywhere, process everywhere.',
        },
      ],
    },
  ],
};
