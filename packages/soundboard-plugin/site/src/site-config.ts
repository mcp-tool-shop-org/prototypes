import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Soundboard Plugin',
  description: 'Give Claude Code a voice. TTS plugin with emotion-aware speech, multi-speaker dialogue, code narration, and workflow notifications.',
  logoBadge: 'SP',
  brandName: 'soundboard-plugin',
  repoUrl: 'https://github.com/mcp-tool-shop-org/soundboard-plugin',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Claude Code Plugin',
    headline: 'Soundboard',
    headlineAccent: ', give Claude a voice.',
    description: 'Emotion-aware TTS, multi-speaker dialogue, code narration, and workflow notifications — all running locally via KokoroSharp.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Speak', code: '/soundboard:speak Hello! I\'m your coding assistant.' },
      { label: 'Narrate', code: '/soundboard:narrate src/server.py' },
      { label: 'Notify', code: '/soundboard:notify Build succeeded with 0 warnings' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Voice synthesis designed for developer workflows.',
      features: [
        { title: '12 Curated Voices', desc: 'Male, female, British, American — each with emotion-aware routing across 8 emotions (joy, anger, sadness, fear, surprise, urgency, calm, neutral).' },
        { title: 'Multi-Speaker Dialogue', desc: 'Auto-casting, stage directions, and speed modifiers. Have Claude narrate conversations between characters.' },
        { title: 'Code Narration', desc: '/soundboard:narrate walks through source files with adaptive pacing. Smart chunking splits at sentence boundaries.' },
        { title: 'SSML-Lite', desc: 'Fine-grained control with pauses, emphasis, pitch, and rate tags. Plus inline SFX like <ding> and <chime>.' },
        { title: 'Security-First', desc: 'Path sandboxing, concurrency gate, WAV validation, structured errors, and secret redaction. No telemetry.' },
        { title: 'Inner Monologue', desc: 'Ambient system with rate limiting and automatic redaction. Claude can think out loud while working.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install',
          code: '# Install the voice engine\ncd voice-soundboard\npip install -e ".[kokoro]"\n\n# Install the plugin\ncd soundboard-plugin\npip install -e .\n\n# Register with Claude Code\nclaude plugin add /path/to/soundboard-plugin',
        },
        {
          title: 'Try it',
          code: '/soundboard:speak Hello! I\'m your assistant.\n/soundboard:narrate src/server.py\n/soundboard:notify Build succeeded\n/soundboard:voices\n/soundboard:voice-status',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Slash Commands',
      columns: ['Command', 'What It Does'],
      rows: [
        ['/soundboard:speak', 'General TTS with emotion detection and SSML support'],
        ['/soundboard:narrate', 'Code walkthrough narration with adaptive pacing'],
        ['/soundboard:notify', 'Spoken workflow notifications (build, test, deploy)'],
        ['/soundboard:voices', 'List available voices and presets'],
        ['/soundboard:voice-status', 'Engine health, backend info, enforced limits'],
      ],
    },
    {
      kind: 'data-table',
      id: 'voices',
      title: 'Voice Library',
      subtitle: '12 curated voices with emotion routing.',
      columns: ['Voice', 'ID', 'Style'],
      rows: [
        ['Fenrir', 'am_fenrir', 'Powerful, authoritative (default)'],
        ['Eric', 'am_eric', 'Energetic, urgent'],
        ['Liam', 'am_liam', 'Warm, conversational'],
        ['Onyx', 'am_onyx', 'Deep, steady'],
        ['Aoede', 'af_aoede', 'Clear, expressive'],
        ['Jessica', 'af_jessica', 'Professional, neutral'],
        ['Sky', 'af_sky', 'Bright, friendly'],
        ['Alice', 'bf_alice', 'British, composed'],
        ['Emma', 'bf_emma', 'British, warm'],
        ['Isabella', 'bf_isabella', 'British, refined'],
        ['George', 'bm_george', 'British, formal'],
        ['Lewis', 'bm_lewis', 'British, measured'],
      ],
    },
    {
      kind: 'data-table',
      id: 'security',
      title: 'Security',
      subtitle: 'Runs entirely on your machine.',
      columns: ['Property', 'Implementation'],
      rows: [
        ['Input bounds', '10,000 char max, clamped speed, chunk/line limits'],
        ['Voice allowlist', '12 pre-approved voices, unknown rejected'],
        ['Path sandboxing', 'WAV output confined to {tempdir}/voice-soundboard/'],
        ['Concurrency', 'Single synthesis at a time (semaphore gate)'],
        ['Error safety', 'Structured JSON errors with trace IDs'],
        ['Secret redaction', 'Paths, tokens, IPs stripped from logs'],
      ],
    },
  ],
};
