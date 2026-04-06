import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'SoundWeave',
  description: 'Adaptive soundtrack studio for composing, arranging, scoring, and exporting interactive game music',
  logoBadge: 'SW',
  brandName: 'SoundWeave',
  repoUrl: 'https://github.com/mcp-tool-shop-org/soundweave',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Adaptive game music',
    headline: 'SoundWeave',
    headlineAccent: 'composition meets adaptation.',
    description: 'A composition-first workstation for authoring adaptive game soundtracks — clips, cues, scenes, layers, automation — with deterministic runtime logic.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'npm', code: 'npm install @soundweave/schema @soundweave/clip-engine' },
      { label: 'Clone', code: 'git clone https://github.com/mcp-tool-shop-org/soundweave.git' },
      { label: 'Dev', code: 'pnpm install && pnpm build && pnpm dev' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'What It Can Do',
      subtitle: 'A serious creative instrument for adaptive game score authoring.',
      features: [
        { title: 'Compose', desc: 'Clips with notes, multi-oscillator synth (unison/supersaw), sample instruments, LFO modulation, and intensity variants — structured music authoring, not random generation.' },
        { title: 'Score Worlds', desc: 'Motif families, score profiles, cue families, world map entries, and derivation chains for game-wide musical coherence.' },
        { title: 'Mix and Effect', desc: '8 effect types (EQ, delay, reverb, compressor, chorus, distortion, phaser, limiter) with 4 insert FX slots per stem. MIDI import/export. 24/32-bit WAV rendering.' },
      ],
    },
    {
      kind: 'features',
      id: 'more-features',
      title: 'Studio to Runtime',
      subtitle: 'Author in Studio, export for your game engine.',
      features: [
        { title: 'Adaptive Logic', desc: 'Trigger bindings, transitions, and deterministic scene resolution — music responds to game state predictably.' },
        { title: '1,002 Tests', desc: 'Schema validation, synthesis, effects, MIDI, sample operations, world scoring, automation, library management — all tested.' },
        { title: 'Zero Network', desc: 'Runs entirely in the browser. No server, no cloud sync, no telemetry. Your music stays local.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Getting Started',
      cards: [
        { title: 'Setup', code: 'git clone https://github.com/mcp-tool-shop-org/soundweave.git\ncd soundweave\npnpm install\npnpm build' },
        { title: 'Run Studio', code: 'pnpm dev\n# Open http://localhost:3000' },
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'Monorepo Packages',
      columns: ['Package', 'Role'],
      rows: [
        ['@soundweave/schema', 'Canonical types and Zod validation'],
        ['@soundweave/asset-index', 'Pack integrity indexing and auditing'],
        ['@soundweave/audio-engine', 'Sample playback and voice management'],
        ['@soundweave/clip-engine', 'Clip sequencing, transforms, cue scheduling'],
        ['@soundweave/instrument-rack', 'Multi-oscillator synth, drum voice, sample voice, LFO modulation'],
        ['@soundweave/music-theory', 'Scales, chords, motifs, intensity'],
        ['@soundweave/playback-engine', 'Real-time playback, mixing, 8 FX types, MIDI I/O, WAV export'],
        ['@soundweave/sample-lab', 'Trim, slice, kit, instrument helpers'],
        ['@soundweave/score-map', 'Motifs, profiles, cue families, derivation'],
        ['@soundweave/automation', 'Lanes, macros, envelopes, capture'],
        ['@soundweave/library', 'Templates, snapshots, branches, favorites'],
        ['@soundweave/scene-mapper', 'Trigger mapping and scene resolution'],
        ['@soundweave/runtime-pack', 'Runtime export/import'],
        ['@soundweave/review', 'Summaries and audit helpers'],
        ['@soundweave/ui', 'Shared UI components'],
        ['@soundweave/test-kit', 'Fixtures and test utilities'],
      ],
    },
  ],
};
