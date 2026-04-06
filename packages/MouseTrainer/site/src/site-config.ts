import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'MouseTrainer',
  description: 'Deterministic mouse dexterity trainer — precision, control, and flow. .NET MAUI, fixed-timestep simulation, composable blueprint mutators.',
  logoBadge: 'MT',
  brandName: 'MouseTrainer',
  repoUrl: 'https://github.com/mcp-tool-shop-org/MouseTrainer',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'MouseTrainer',
    headlineAccent: 'Same seed. Same score. Every time.',
    description: 'Deterministic mouse dexterity trainer with fixed-timestep simulation, composable blueprint mutators, and replay verification. Built on .NET MAUI.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'dotnet add package MouseTrainer.Domain' },
      { label: 'Simulate', code: 'dotnet add package MouseTrainer.Simulation' },
      { label: 'Audio', code: 'dotnet add package MouseTrainer.Audio' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Core Features',
      subtitle: 'Determinism is constitutional. No DateTime.Now, no System.Random, no platform-dependent floats.',
      features: [
        { title: 'Deterministic to the Bit', desc: 'xorshift32 RNG, FNV-1a 64-bit hashing, fixed 60 Hz timestep with accumulator catch-up. Same seed = same level = same score.' },
        { title: 'Composable Mutators', desc: 'Six blueprint mutators reshape levels before play. Stack them, tune parameters, and the combination is frozen into the RunId hash.' },
        { title: 'Replay Verification', desc: 'Binary .mtr format with quantized input, run-length encoding, and tick-by-tick re-simulation. Event hash + score + combo verified.' },
        { title: 'Protocol-Grade Identity', desc: 'RunId is an FNV-1a 64-bit hash over mode + seed + difficulty + mutator specs. Once created, frozen forever.' },
        { title: 'Modular Monolith', desc: 'Four assemblies with enforced one-way dependencies. Domain is the leaf with zero deps; MauiHost is the only composition root.' },
        { title: 'Event-Driven Audio', desc: 'AudioDirector maps simulation events to sound cues with deterministic volume/pitch jitter. Rate-limited, asset-verified at startup.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install packages',
          code: '# Core primitives (RNG, hashing, run identity)\ndotnet add package MouseTrainer.Domain\n\n# Simulation engine (game loop, modes, mutators)\ndotnet add package MouseTrainer.Simulation\n\n# Audio cue system\ndotnet add package MouseTrainer.Audio',
        },
        {
          title: 'Create a deterministic run',
          code: 'var run = RunDescriptor.Create(\n    mode: new ModeId("ReflexGates"),\n    seed: 42,\n    difficulty: DifficultyTier.Standard);\n\nvar generator = new ReflexGateGenerator(config);\nvar blueprint = generator.Generate(run.Seed);\n\nvar loop = new DeterministicLoop(sim,\n    new DeterministicConfig { FixedHz = 60 });',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'mutators',
      title: 'Blueprint Mutators',
      columns: ['Mutator', 'Key Params', 'Effect'],
      rows: [
        ['NarrowMargin', 'factor [0.1, 1.0]', 'Scales aperture heights down — tighter gaps'],
        ['WideMargin', 'factor [1.0, 3.0]', 'Scales aperture heights up — more forgiving'],
        ['DifficultyCurve', 'curve [-2.0, 2.0]', 'Power-curve re-interpolation of difficulty by gate index'],
        ['RhythmLock', 'div {2, 3, 4, 6, 8}', 'Quantizes gate phases to N divisions — rhythmic patterns'],
        ['GateJitter', 'str [0, 1]', 'Deterministic vertical offset via sin — spatial perturbation'],
        ['SegmentBias', 'seg, amt, shape', 'Per-segment difficulty bias (crescendo, valley, wave)'],
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'NuGet Packages',
      columns: ['Package', 'Description'],
      rows: [
        ['MouseTrainer.Domain', 'Deterministic xorshift32 RNG, FNV-1a hashing, LEB128 varint, game events, run identity. Zero dependencies.'],
        ['MouseTrainer.Simulation', 'Fixed 60 Hz game loop, composable mutators, level generation, replay recording/verification. Depends on Domain.'],
        ['MouseTrainer.Audio', 'Event-driven audio cues with deterministic volume/pitch jitter, rate limiting, asset verification. Depends on Domain.'],
      ],
    },
    {
      kind: 'data-table',
      id: 'replay',
      title: 'Replay System',
      columns: ['Component', 'Role'],
      rows: [
        ['ReplayRecorder', 'Captures per-tick quantized input samples during live play'],
        ['InputTrace', 'Run-length encoded input stream for compact storage'],
        ['ReplaySerializer', 'Binary .mtr format: magic header, LEB128 varints, FNV-1a checksum'],
        ['ReplayVerifier', 'Re-simulates tick-by-tick; verifies event hash + score + combo'],
        ['EventStreamHasher', 'Rolling FNV-1a hash over the simulation event stream'],
      ],
    },
    {
      kind: 'features',
      id: 'architecture',
      title: 'Architecture',
      subtitle: 'Four-module modular monolith. No cycles, no platform leakage into libraries.',
      features: [
        { title: 'Domain (Leaf)', desc: 'Shared primitives, RNG, hashing, run identity. Zero dependencies — the constitutional foundation.' },
        { title: 'Simulation', desc: 'Deterministic loop, modes, mutators, levels, replay. Depends only on Domain.' },
        { title: 'Audio', desc: 'Event-driven cue system, asset verification. Depends only on Domain. Never references Simulation.' },
      ],
    },
  ],
};
