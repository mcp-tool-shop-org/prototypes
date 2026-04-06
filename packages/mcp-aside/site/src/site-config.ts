import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'mcp-aside',
  description: 'MCP server that maintains an in-memory interjection inbox with guardrails (TTL, rate-limit, dedupe).',
  logoBadge: 'MA',
  brandName: 'mcp-aside',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-aside',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/mcp-aside',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'MCP Server',
    headline: 'mcp-aside',
    headlineAccent: 'A sticky-note pad for your AI.',
    description: 'Give your AI a place to jot things down mid-conversation — an in-memory interjection inbox with rate-limiting, deduplication, and auto-expiry.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install @mcptoolshop/mcp-aside' },
      { label: 'Config', code: '{ "aside": { "command": "npx", "args": ["-y", "@mcptoolshop/mcp-aside"] } }' },
      { label: 'Push', code: 'aside.push({ text: "revisit error handling", priority: "med" })' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything needed to keep stray thoughts from derailing the conversation.',
      features: [
        {
          title: 'Guardrailed',
          desc: 'TTL caps, per-priority rate limits, and dedupe windows prevent inbox sprawl — all tunable at runtime.',
        },
        {
          title: 'Ephemeral',
          desc: 'In-memory only. No database, no persistence. Restart the server and the inbox is gone — by design.',
        },
        {
          title: 'Real-time',
          desc: 'Clients get notified via MCP resource updates the moment a new interjection lands in the inbox.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Add to your MCP client',
          code: `{
  "mcpServers": {
    "aside": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/mcp-aside"]
    }
  }
}`,
        },
        {
          title: 'Push an interjection',
          code: `// The model calls aside.push with a thought
aside.push({
  text: "revisit error handling later",
  priority: "med",
  reason: "edge case spotted during refactor",
  tags: ["tech-debt"]
})`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'Tools',
      subtitle: 'Four tools exposed over MCP stdio.',
      columns: ['Tool', 'Description'],
      rows: [
        ['aside.push', 'Push an interjection into the inbox. Accepts text, priority (low/med/high), reason, tags, expiresAt, source, and meta.'],
        ['aside.configure', 'Tune guardrails at runtime — TTL caps, rate limits, dedupe windows, notification thresholds.'],
        ['aside.clear', 'Wipe the inbox.'],
        ['aside.status', 'Read-only snapshot of inbox size and current guardrail config.'],
      ],
    },
    {
      kind: 'data-table',
      id: 'guardrails',
      title: 'Guardrails',
      subtitle: 'All configurable via aside.configure at runtime.',
      columns: ['Setting', 'Default', 'Description'],
      rows: [
        ['defaultTtlSeconds', '600 (10 min)', 'How long an interjection lives if no explicit expiry is set.'],
        ['maxTtlSeconds', '3600 (1 hr)', 'Hard cap on TTL, even if the caller asks for more.'],
        ['dedupeWindowSeconds', '300 (5 min)', 'Same priority + text + reason = suppressed within this window.'],
        ['rateLimitMax', 'low: 6, med: 3, high: 1', 'Max pushes per priority per sliding window.'],
        ['notifyAtOrAbove', 'high', 'Only send log notifications at or above this priority.'],
      ],
    },
  ],
};
