import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Trace',
  description: 'Deterministic cursor discipline game. Navigate chaos through precision, not power.',
  logoBadge: 'Tr',
  brandName: 'Trace',
  repoUrl: 'https://github.com/mcp-tool-shop-org/Trace',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'deterministic · precision · composure',
    headline: 'Trace',
    headlineAccent: 'navigate chaos through precision.',
    description: 'A cursor discipline game built on a fully deterministic 60Hz simulation. Five motion states, five chaos archetypes, and a rendering engine that is a pure function of state. Mastery looks calm.',
    primaryCta: { href: '#architecture', label: 'Explore' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'State Machine', code: 'Alignment → Commitment → Resistance → Correction → Alignment' },
      { label: 'Rendering', code: 'VisualState = RenderProfile[MotionState]' },
      { label: 'Determinism', code: 'Same seed → same simulation → same score' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'principles',
      title: 'Design Principles',
      subtitle: 'The rules that shape every frame.',
      features: [
        { title: 'Determinism is Constitutional', desc: 'Same seed produces the same simulation, the same score, always. No DateTime.Now, no Random, no platform-dependent floats.' },
        { title: 'Rendering is Pure', desc: 'No animation timelines or sprite sheets. MotionState + ForceVector + StabilityScalar equals visual output.' },
        { title: 'Mastery Looks Calm', desc: 'If high-skill play looks frantic, the system is lying. Composure under chaos is the goal.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'motion-states',
      title: 'Motion State Machine',
      subtitle: 'Trace inhabits exactly one of five states every frame.',
      columns: ['State', 'Identity', 'Visual'],
      rows: [
        ['Alignment', 'Neutral, stable, calm', 'Baseline cyan, minimal glow'],
        ['Commitment', 'Decisive acceleration', 'Forward tint, warm edge'],
        ['Resistance', 'Counterforce lean', 'Amber-shifted edge, increased glow'],
        ['Correction', 'Micro-adjustments', 'Edge brightening, high precision'],
        ['Recovery', 'Brief recoil', 'Desaturation fade (150ms)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'chaos',
      title: 'Chaos Archetypes',
      subtitle: 'Five villains. Deterministic, indifferent, mechanical.',
      columns: ['Archetype', 'Verb', 'Counter-Skill'],
      rows: [
        ['Red Orbs', 'Disrupt', 'Anticipation'],
        ['Crushers', 'Constrain', 'Commitment'],
        ['Drift Fields', 'Destabilize', 'Grip stability'],
        ['Flickers', 'Mislead', 'Filtering'],
        ['Locks', 'Restrict', 'Adaptability'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'architecture',
      title: 'Architecture',
      cards: [
        { title: 'Modular Monolith', code: `Domain        → (nothing)     # Leaf: primitives, RNG, motion states
Simulation    → Domain         # Engine: loop, modes, mutators, replay
Audio         → Domain         # Cue system, asset verification
MauiHost      → all three      # Composition root, renderer` },
        { title: 'Engine Core', code: `IGameSimulation    # Pluggable game mode (2 methods)
DeterministicLoop  # 60Hz fixed timestep + interpolation
DeterministicRng   # xorshift32, seed-reproducible
ReplaySystem       # MTR v1 binary, FNV-1a verification` },
      ],
    },
    {
      kind: 'features',
      id: 'tech',
      title: 'Technology',
      features: [
        { title: '.NET 10 MAUI', desc: 'Windows-first desktop app with MAUI composition root, neon palette renderer, trail buffer, and particle system.' },
        { title: '340 Tests', desc: 'Architecture boundaries, determinism regression, replay verification, mutator correctness, and golden-hash identity tests.' },
        { title: '19 Design Documents', desc: 'From product boundary to soundscape canon — every system has a written spec before implementation.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'build',
      title: 'Build & Test',
      cards: [
        { title: 'Build', code: `# Build simulation library (0 warnings)
dotnet build src/MouseTrainer.Simulation/

# Run MAUI host (Windows)
# Use Visual Studio, set startup to MauiHost` },
        { title: 'Test', code: `# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Categories: Architecture, Determinism,
# Replay, Mutators, Scoring, Motion States` },
      ],
    },
  ],
};
