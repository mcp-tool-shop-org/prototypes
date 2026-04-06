# Trace — Product Boundary

---

## What Trace Is

Trace is a deterministic cursor discipline game. The player navigates chaos through precision, not power. Every obstacle trains one skill. Mastery looks calm. The engine is deterministic — same seed, same run, same outcome.

Built on the Deterministic Mouse Training Engine (60Hz fixed timestep, alpha interpolation, virtual coordinate space, pluggable game modes).

## What Trace Is Not

- **Not an aim trainer.** No crosshairs, no flick shots, no FPS mechanics.
- **Not an arcade game.** No lives, no score chasing, no power-ups, no spectacle.
- **Not a power fantasy.** Trace never dominates chaos. Trace navigates it.
- **Not cute.** No exclamation marks, no emoji, no gamification language.

## Who It Is For

Anyone who wants to build real cursor discipline — anticipation, timing, stability, filtering, adaptability — through a system that respects their intelligence.

---

## Design Canon

| Document | Purpose |
|----------|---------|
| [Tone Bible](tone-bible.md) | Voice, UI, animation, and feedback tone rules |
| [Motion Language Spec](motion-language-spec.md) | Movement grammar, path language, force responses |
| [Motion State Machine](motion-state-machine.md) | 5-state FSM with transitions and forbidden paths |
| [Visual Style Guide](visual-style-guide.md) | Trace form, color-by-state, world identity |
| [Renderer Integration (Trace)](renderer-integration-trace.md) | RenderProfile, ForceVector, StabilityScalar, glow/bias/desaturation |
| [Villains & Trace Skills](villains-and-trace-skills.md) | 5 archetypes, 5 skills, consistency contract |
| [Chaos Entity Animation Bible](chaos-entity-animation-bible.md) | Per-archetype motion and animation specs |
| [Chaos Behavior State Machines](chaos-behavior-state-machines.md) | Per-archetype FSMs (enum + transition ready) |
| [Renderer Integration (Chaos)](renderer-integration-chaos.md) | ChaosRenderProfile, per-archetype draw specs |
| [Interaction Rendering Canon](interaction-rendering-canon.md) | Trace-vs-Chaos interaction contract |
| [Sound Design Bible](sound-design-bible.md) | Audio metaphysics, Trace/Chaos sound identity, mastery = silence |
| [Procedural Audio Parameter Map](procedural-audio-parameter-map.md) | Simulation → audio parameter wiring |
| [Audio Engine Architecture](audio-engine-architecture.md) | DSP components, data flow, master bus |
| [Soundscape Moodboard](soundscape-moodboard.md) | Sensory guide to the world's sonic identity |
| [**Soundscape Canon**](soundscape-canon.md) | **Unified audio canon (consolidates all 4 audio docs)** |
| [Sandbox Drift Field v1](sandbox-drift-field-v1.md) | First villain proof (DriftDelivery_B1) |

---

## Villain Roster (5 Archetypes)

| Villain | Verb | Counter-Skill |
|---------|------|---------------|
| Red Orbs | disrupt | Anticipation, calm motion |
| Crushers | constrain | Commitment, timing confidence |
| Drift Fields | destabilize | Grip stability, counterforce |
| Flickers | mislead | Filtering, visual discipline |
| Locks | restrict | Adaptive planning |

## Trace Skills (5 States)

| Skill | Effect | Tradeoff |
|-------|--------|----------|
| Focus | Reduce noise, dampen forces | Narrowed perception |
| Flow State | Reward smooth motion | Penalize stops |
| Anchor | Resist displacement | Slower movement |
| Pulse | Brief clarity spike | No mechanical advantage |
| Recovery | Partial slip correction | Very limited window |

---

## Consistency Contract

- **Legibility:** Every failure explainable in one sentence
- **Skill Alignment:** One obstacle, one skill, no overlap
- **No Power Fantasy:** Trace navigates, never dominates
- **Mastery Plateau:** Stability under pressure, speed is a side effect
- **Boring Is Good:** High-skill play looks calm
- **Sandbox First:** Every idea tested in isolation before integration

---

## Engine Heritage

Forked from [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Shares:

- `IGameSimulation` pluggable mode interface
- `DeterministicLoop` (60Hz fixed timestep + alpha interpolation)
- `DeterministicRng` (xorshift32, seed-reproducible)
- `GameEvent` pipeline
- Replay system (MTR v1 binary format, FNV-1a verification)
- Mutator composition (`LevelBlueprint` pure-function transforms)
- Virtual coordinate space (1920x1080, letterbox scaling)

---

## Deferred

- Progression / unlock systems
- Leaderboards / social
- Additional villain types beyond the core 5
- Additional skill types beyond the core 5
- Mouse trainer integration (carry gamification back to MouseTrainer once Trace ships)
