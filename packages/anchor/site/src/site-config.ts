import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Anchor',
  description: 'A drift-prevention engine for serious creative software design',
  logoBadge: 'AN',
  brandName: 'Anchor',
  repoUrl: 'https://github.com/mcp-tool-shop-org/anchor',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Desktop drift-prevention engine',
    headline: 'Anchor:',
    headlineAccent: 'Coherence before code.',
    description: 'A local-first Tauri 2 desktop app that forces constitution-first, fully traceable project design. Nine artifacts, strict ordering, bidirectional traceability, and a readiness gate that blocks export until everything agrees.',
    primaryCta: { href: '#quickstart', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/anchor.git' },
      { label: 'Install', code: 'cd anchor && npm install' },
      { label: 'Run', code: 'npm run tauri dev' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Core Systems',
      subtitle: 'Every system enforces coherence, not just completion.',
      features: [
        {
          title: '9-Artifact Spine',
          desc: 'Constitution through Execution Readiness Gate. Strict ordering — no skipping, no shortcuts. Every artifact must be justified by the one above it.',
        },
        {
          title: 'Bidirectional Traceability',
          desc: 'Six link types (Justifies, DerivesFrom, Implements, DependsOn, ValidatedBy, InvalidatedBy). Every node answers "what justifies this?" and "what depends on this?"',
        },
        {
          title: 'Drift Alarm Engine',
          desc: 'Five alarm categories (Traceability, Constitution, Sequence, Quality, Scope) with rule provenance and remediation paths. Drift is detected, not discovered.',
        },
        {
          title: 'Stale Propagation',
          desc: 'Upstream changes walk the dependency graph and mark downstream artifacts stale. Constitution amendments trigger nuclear invalidation of everything downstream.',
        },
        {
          title: 'Readiness Gate',
          desc: 'Six blocking checks: artifact states, stale artifacts, drift alarms, amendment completion, approval currency, traceability completeness. No export until the gate clears.',
        },
        {
          title: 'Recovery Engine',
          desc: 'For any state, computes "what\'s next?" with priority order, constitutional rule references (section-numbered clauses), and clear explanations.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'Prerequisites',
          code: '# Rust (stable)\ncurl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\n# Node.js 18+\n# https://nodejs.org/\n\n# Tauri 2 system dependencies\n# https://v2.tauri.app/start/prerequisites/',
        },
        {
          title: 'Install & Run',
          code: 'git clone https://github.com/mcp-tool-shop-org/anchor.git\ncd anchor\nnpm install\nnpm run tauri dev',
        },
        {
          title: 'Test & Build',
          code: '# Rust tests (166 tests)\ncd src-tauri && cargo test\n\n# TypeScript type check\nnpx tsc --noEmit\n\n# Production build\nnpm run tauri build',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'artifact-spine',
      title: 'The Artifact Spine',
      subtitle: 'Nine artifacts, worked in strict order. No export until all nine are coherent and approved.',
      columns: ['#', 'Artifact', 'Role'],
      rows: [
        ['1', 'Constitution', 'The throne — promise, fantasy, anti-goals, quality bar, failure condition'],
        ['2', 'User Fantasy + Workflows', 'Narrative + concrete workflow definitions linked to constitution'],
        ['3', 'Feature Map', 'Features with upstream workflow justification and anti-goal conflict checks'],
        ['4', 'System Architecture', 'Systems, responsibilities, boundaries, feature implementation links'],
        ['5', 'UX State Map', 'States, transitions, entry conditions, blocked actions'],
        ['6', 'Phase Roadmap + Contracts', 'Phases with inputs, outputs, invariants, forbidden compromises'],
        ['7', 'Acceptance Checklists', 'Per-phase checklist groups with constitution-linked items'],
        ['8', 'Drift Alarm Definitions', 'Alarm types, trigger conditions, severity, remediation templates'],
        ['9', 'Execution Readiness Gate', 'Computed, not authored — the final judge'],
      ],
    },
    {
      kind: 'data-table',
      id: 'demo-scenarios',
      title: 'Demo Scenarios',
      subtitle: 'Four pre-built projects exercise different failure modes.',
      columns: ['Scenario', 'Theme', 'Demonstrates'],
      rows: [
        ['Forge Quest', 'Crafting RPG', 'Mixed artifact states, gate blocked by draft + unapproved artifacts'],
        ['Crystal Sanctum', 'Puzzle RPG', 'Healthy project — all approved, full traceability, gate ready'],
        ['Shadow Protocol', 'Stealth game', 'Broken traceability — missing trace links, orphan artifacts, drift alarms'],
        ['Ember Saga', 'Narrative RPG', 'Post-amendment fallout — constitution changed, 7 artifacts stale'],
      ],
    },
  ],
};
