import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'claude-sfx',
  description: 'Procedural audio feedback for Claude Code — every tool call gets a sound, synthesized from math, not audio files.',
  logoBadge: 'CS',
  brandName: 'claude-sfx',
  repoUrl: 'https://github.com/mcp-tool-shop-org/claude-sfx',
  npmUrl: 'https://www.npmjs.com/package/claude-sfx',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Zero dependencies',
    headline: 'Hear your agent',
    headlineAccent: 'think.',
    description: 'Procedural audio feedback for Claude Code. Every tool call, file edit, search, and git push gets a distinct sound — synthesized from math, not audio files.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install -g claude-sfx' },
      { label: 'Init', code: 'claude-sfx init' },
      { label: 'Demo', code: 'claude-sfx demo' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Audio Feedback?',
      subtitle: 'When an AI agent reads, writes, searches, and deploys on your behalf, you lose visibility. Sound restores awareness.',
      features: [
        { title: 'Accessibility', desc: 'Hear state changes, errors, and completions without watching the terminal scroll.' },
        { title: 'Flow', desc: 'Know a test passed or a push landed without context-switching away from what you\'re doing.' },
        { title: 'Presence', desc: 'The agent feels like a collaborator, not a black box. Sound makes the work feel real.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'the-7-verbs',
      title: 'The 7 Verbs',
      subtitle: 'Every Claude Code action maps to one of 7 core verbs. Modifiers alter the sound without breaking coherence.',
      columns: ['Verb', 'Triggers', 'Sound'],
      rows: [
        ['intake', 'Read, WebFetch, WebSearch', 'Soft rising sine — something coming in'],
        ['transform', 'Edit', 'FM-textured pulse — reshaping'],
        ['commit', 'Write, NotebookEdit, git commit', 'Sharp stamp tone — sealed'],
        ['navigate', 'Grep, Glob', 'Sonar ping — scanning'],
        ['execute', 'Bash, npm test, tsc', 'Noise burst + tone — mechanical action'],
        ['move', 'mv, cp, subagent spawn', 'Wind whoosh — air displacement'],
        ['sync', 'git push, git pull', 'Dramatic whoosh + tonal anchor'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install & init',
          code: 'npm install -g claude-sfx\ncd your-project\nclaude-sfx init       # install hooks\nclaude-sfx demo       # hear all 7 verbs',
        },
        {
          title: 'Modifiers',
          code: 'claude-sfx play navigate --status ok\nclaude-sfx play navigate --status err\nclaude-sfx play sync --direction up\nclaude-sfx play sync --direction down\nclaude-sfx play intake --scope remote',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'profiles',
      title: 'Profiles',
      cards: [
        {
          title: 'Switch palettes',
          code: 'claude-sfx demo --profile retro\nclaude-sfx preview minimal\nclaude-sfx config set profile retro\nclaude-sfx config repo retro',
        },
        {
          title: 'Custom profiles',
          code: '# Copy a built-in profile\ncp profiles/minimal.json my-profile.json\n\n# Edit the synthesis parameters\n# Every number maps to the synth engine\n\nclaude-sfx play navigate \\\n  --profile ./my-profile.json',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'anti-annoyance',
      title: 'Anti-Annoyance',
      subtitle: 'What separates a product from a toy.',
      columns: ['Feature', 'Behavior'],
      rows: [
        ['Debounce', 'Same verb within 200ms → one sound'],
        ['Rate limit', 'Max 8 sounds per 10-second window'],
        ['Quiet hours', 'All sounds suppressed during configured hours'],
        ['Mute', 'Instant toggle, survives session restart'],
        ['Volume', '0–100 gain control'],
        ['Per-verb disable', 'Turn off specific verbs you don\'t want'],
      ],
    },
    {
      kind: 'features',
      id: 'how-it-works',
      title: 'How It Works',
      subtitle: 'Zero audio files. Every sound is synthesized at runtime from math.',
      features: [
        { title: 'Oscillators', desc: 'Sine, square, sawtooth, triangle, and white noise — the building blocks of every sound.' },
        { title: 'FM Synthesis', desc: 'Frequency modulation adds texture and character. Envelopes shape attack, decay, sustain, release.' },
        { title: 'Bandpass Whoosh', desc: 'State-variable filter sweeps through noise for realistic wind and movement sounds.' },
      ],
    },
  ],
};
