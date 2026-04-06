import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'jam-session-plugin',
  description: 'Claude Code plugin for PianoAI — piano player with 100-song library, teaching system, and AI jam sessions',
  logoBadge: 'JS',
  brandName: 'jam-session-plugin',
  repoUrl: 'https://github.com/mcp-tool-shop-org/jam-session-plugin',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Claude Code Plugin',
    headline: 'AI Jam Session,',
    headlineAccent: 'inside Claude Code.',
    description: 'A Claude Code plugin with a 100-song library, structured lessons, and AI jam sessions — plays through your system audio, no external software required.',
    primaryCta: { href: '#install', label: 'Install' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Install',
        code: 'claude plugin add ai-jam-session\n# The MCP server is fetched automatically via npx',
      },
      {
        label: 'Teach',
        code: '/ai-jam-session:teach moonlight-sonata-mvt1\n/ai-jam-session:practice let-it-be beginner\n/ai-jam-session:explore jazz',
      },
      {
        label: 'Jam',
        code: '/ai-jam-session:jam autumn-leaves as blues\n/ai-jam-session:jam jazz\n# Or just talk: "Let\'s jam on some blues."',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'What the plugin adds',
      subtitle: 'Wraps the AI Jam Session MCP server with slash commands, agent personalities, and structured workflows.',
      features: [
        {
          title: '4 slash commands',
          desc: 'teach, practice, explore, and jam — each with a structured workflow that orchestrates the 15 MCP tools automatically. Just type a command and go.',
        },
        {
          title: '2 AI agent personalities',
          desc: 'Switch between the patient piano-teacher who meets students where they are, and the laid-back jam-musician who lives for groove and experimentation.',
        },
        {
          title: '100-song library',
          desc: 'Classical, jazz, pop, blues, rock, R&B, latin, film, ragtime, and new-age — beginner through advanced. Browse by genre, difficulty, or keyword.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'skills',
      title: 'Skills (slash commands)',
      subtitle: 'Each skill orchestrates the MCP tools automatically — no manual tool calls needed.',
      columns: ['Command', 'What it does'],
      rows: [
        ['/ai-jam-session:explore [query]', 'Browse the 100-song library by genre, difficulty, or keyword'],
        ['/ai-jam-session:teach <song>', 'Start a structured teaching session with lesson goals, key moments, and measure-by-measure guidance'],
        ['/ai-jam-session:practice <song> [level]', 'Get a personalized practice plan with tempo ramp-up and mode progression'],
        ['/ai-jam-session:jam <song or genre>', 'Start a jam session — Claude creates its own interpretation and plays it back'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'install',
      title: 'Getting started',
      cards: [
        {
          title: 'Install the plugin',
          code: 'claude plugin add ai-jam-session\n# Requires Node.js 18+ and speakers',
        },
        {
          title: 'Explore the library',
          code: '/ai-jam-session:explore jazz\n/ai-jam-session:explore beginner classical',
        },
        {
          title: 'Learn a song',
          code: '/ai-jam-session:teach moonlight-sonata-mvt1\n/ai-jam-session:practice fur-elise beginner',
        },
        {
          title: 'Jam and create',
          code: '/ai-jam-session:jam autumn-leaves as blues\n# Or just talk naturally:\n"Let\'s jam on some blues."',
        },
      ],
    },
    {
      kind: 'features',
      id: 'agents',
      title: 'Agent personalities',
      subtitle: 'They activate automatically based on context — or summon them by name.',
      features: [
        {
          title: 'piano-teacher',
          desc: 'Patient, pedagogical, meets students where they are. Walks through song structure, key moments, and measure-by-measure fingering. Adjusts depth to match the difficulty level.',
        },
        {
          title: 'jam-musician',
          desc: 'Laid-back, groove-first, encourages experimentation. Thinks in chord maps and melody skeletons, not sheet music. "There are no wrong notes, only unresolved tensions."',
        },
        {
          title: '15 MCP tools underneath',
          desc: 'play_song, song_info, list_songs, teaching_note, practice_setup, ai_jam_session, add_song, and more — all orchestrated by the skills so you never have to call them directly.',
        },
      ],
    },
  ],
};
