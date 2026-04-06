import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Claude Session Copilot',
  description: 'Session memory for Claude Code. Captures decisions, timelines, and patterns across sessions.',
  logoBadge: 'CS',
  brandName: 'claude-session-copilot',
  repoUrl: 'https://github.com/mcp-tool-shop-org/claude-session-copilot',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'MCP server',
    headline: 'Session memory',
    headlineAccent: 'for Claude Code.',
    description: 'Captures decisions, timelines, and patterns across sessions. Makes context recoverable after /compact — no more lost reasoning.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Handbook' },
    previews: [
      { label: 'Install', code: 'npx @mcptoolshop/claude-session-copilot' },
      { label: '.mcp.json', code: '{\n  "mcpServers": {\n    "session-copilot": {\n      "command": "npx",\n      "args": ["-y",\n        "@mcptoolshop/claude-session-copilot"]\n    }\n  }\n}' },
      { label: 'Resume', code: '/copilot:resume\n# Loads latest snapshot + decisions' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything your sessions forget, copilot remembers.',
      features: [
        { title: 'Decision log', desc: 'Record what you chose, why, and what you rejected. Decisions survive /compact and session boundaries.' },
        { title: 'Hook-driven timeline', desc: 'PostToolUse hook prompts request recording for Bash results, file edits, and task changes. Prompt-based — events may be missed if Claude does not execute the prompt.' },
        { title: 'Pattern detection', desc: 'Alerts on repeated failures, file churn, and long sessions without snapshots. Catches problems before you do.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: '7 Tools',
      subtitle: 'MCP tools for session continuity.',
      columns: ['Tool', 'Purpose'],
      rows: [
        ['copilot.decision', 'Log a decision (what, why, alternatives rejected)'],
        ['copilot.snapshot', 'Save session state for continuity'],
        ['copilot.resume', 'Load latest snapshot + decisions for a new session'],
        ['copilot.timeline_event', 'Record a timeline event'],
        ['copilot.query', 'Search decisions, timeline, and snapshots'],
        ['copilot.pulse', 'Project health dashboard'],
        ['copilot.forget', 'Prune old data'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'Skills (Claude Code)',
          code: '# Pick up where the last session left off\n/copilot:resume\n\n# Save state before /compact\n/copilot:snapshot\n\n# Review the decision log\n/copilot:decisions\n\n# Project health dashboard\n/copilot:pulse',
        },
        {
          title: 'PostToolUse hooks',
          code: '# Hook prompts request recording after:\n# Bash → detects build/test pass/fail\n# Write → records file creation\n# Edit  → records file modification\n# TodoWrite → records task state changes\n\n# Prompt-based — events may be\n# missed if prompt is not followed',
        },
      ],
    },
    {
      kind: 'features',
      id: 'why-claude-code',
      title: 'Claude Code Only',
      subtitle: 'Architecturally dependent on Claude Code primitives.',
      features: [
        { title: 'PostToolUse hooks', desc: 'Auto-timeline depends on hooks that fire after Bash, Write, Edit, and TodoWrite. No other MCP client has this.' },
        { title: 'Skills + CLAUDE.md', desc: 'Slash commands (/copilot:resume) and context injection via CLAUDE.md are Claude Code exclusives.' },
        { title: 'Resource notifications', desc: 'Live dashboards (copilot://pulse, copilot://timeline) rely on resource notification polling.' },
      ],
    },
  ],
};
