<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Costruito su .NET 10 MAUI (con priorità per Windows), con una simulazione completamente deterministica a intervallo fisso, una macchina a stati di movimento con cinque stati e un'identità visiva parametrica guidata interamente dallo stato della simulazione.

Trace non è un trainer per migliorare la mira. Trace non è un gioco arcade. La padronanza si manifesta con calma.

---

## Architettura

Monolite modulare composto da quattro moduli. Nessun ciclo, nessuna dipendenza dalla piattaforma nelle librerie.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

Consultare [`docs/modular.manifesto.md`](docs/modular.manifesto.md) per il grafico completo delle dipendenze e le regole costituzionali.

---

## Macchina a Stati di Movimento

Trace si trova esattamente in uno dei cinque stati di movimento ad ogni frame:

| Stato | Identità | Aspetto Visivo |
|-------|----------|--------|
| **Alignment** | Neutro, stabile, calmo | Ciano di base, luminosità minima |
| **Commitment** | Accelerazione decisa | Leggera tinta verso il davanti, bordo caldo |
| **Resistance** | Inclinazione contro-forza | Bordo con tonalità ambrata, luminosità aumentata |
| **Correction** | Micro-aggiustamenti | Aumento della luminosità del bordo, alta precisione |
| **Recovery** | Breve rinculo | Saturazione che diminuisce (150ms) |

Le transizioni sono imposte da una tabella di transizioni compilata. Le transizioni proibite restituiscono null.

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

Consultare [`docs/motion-state-machine.md`](docs/motion-state-machine.md) per la FSM completa con condizioni di ingresso/uscita.

---

## Archetipi del Caos (5 Cattivi)

| Archetipo | Verbo | Contro-abilità | Comportamento |
|-----------|------|---------------|----------|
| **Red Orbs** | interrompere | Anticipazione | Deriva all'interno della regione, rimbalzo ai bordi |
| **Crushers** | limitare | Impegno | Ciclo fisso: inattivo → segnale → attivo |
| **Drift Fields** | destabilizzare | Stabilità della presa | Forza direzionale costante |
| **Flickers** | ingannare | Filtraggio | Flash → immagine residua → invisibile |
| **Locks** | restringere | Adattabilità | Vincoli di asse/velocità con segnale |

Il Caos non reagisce mai a Trace. Il Caos è deterministico, indifferente, meccanico.

Consultare [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) e [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md).

---

## Rendering

Il rendering di Trace è una funzione pura dello stato. Nessuna timeline di animazione, nessuna sprite sheet.

```
VisualState = RenderProfile[MotionState]
```

Il colore, in base allo stato, controlla tutto: riempimento, bordo, intensità della luminosità, bias direzionale, desaturazione. Il renderer esprime l'identità di Trace con zero risorse di animazione.

Consultare [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) e [`docs/visual-style-guide.md`](docs/visual-style-guide.md).

---

## Eredità del Motore

Derivato da [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Sistemi principali:

- `IGameSimulation` — interfaccia del gioco pluggable (2 metodi)
- `DeterministicLoop` — intervallo fisso di 60Hz + interpolazione alfa
- `DeterministicRng` — xorshift32, seme riproducibile
- Pipeline di `GameEvent` — flusso di eventi tipizzati
- Sistema di replay — formato binario MTR v1, verifica FNV-1a
- Composizione di mutatori — trasformazioni pure di `LevelBlueprint`
- Spazio di coordinate virtuale — 1920×1080, ridimensionamento con bordi neri

---

## Struttura del Progetto

```
src/
  MouseTrainer.Domain/          Leaf module — events, input, runs, RNG, motion states
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Motion/                     MotionState, MotionTrigger, MotionTransitionTable
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Scoring/                    ScoreComponentId
    Utility/                    DeterministicRng (xorshift32), Fnv1a, Leb128

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplaySerializer, InputTrace, ReplayVerifier
    Session/                    SessionController, ScoreBreakdown, SessionModels

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest, AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
                                GameRenderer, NeonPalette, TrailBuffer, ParticleSystem,
                                MotionAnalyzer, ScreenShake

tests/
  MouseTrainer.Tests/           340 tests across 11 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, session controller
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event hashing
    Runs/                       RunDescriptor golden hashes + identity
    Scoring/                    Score breakdown
    Utility/                    Leb128 encoding
    MotionStateTests.cs         State machine transitions + forbidden paths

docs/                           19 design documents (see Design Canon below)
```

---

## Canone di Progettazione

| Documento | Scopo |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | Cosa è Trace, cosa non è, a chi è destinato |
| [`tone-bible.md`](docs/tone-bible.md) | Regole di tono, interfaccia utente, animazione e feedback |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | Grammatica del movimento, linguaggio dei percorsi, risposte alle forze |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | FSM a 5 stati con transizioni e percorsi proibiti |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | Tracciabilità, colori per stato, identità globale. |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | Profilo di rendering, vettore di forza, scalare di stabilità, luminosità/bias/desaturazione. |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 archetipi, 5 abilità, contratto di coerenza. |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | Specifiche di movimento e animazione per ogni archetipo. |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | Macchine a stati (FSM) per ogni archetipo (con enumerazione e transizioni pronte). |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | Profilo di rendering "Chaos", specifiche di rendering per ogni archetipo. |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | Contratto di interazione tra "Trace" e "Chaos". |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | Metafisica dell'audio, identità sonora di "Trace/Chaos", la maestria si manifesta nel silenzio. |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | Simulazione → collegamento dei parametri audio. |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | Componenti DSP, flusso dei dati, bus principale. |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | Guida sensoriale all'identità sonora del mondo. |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **Canone audio unificato (consolida tutti e 4 i documenti audio).** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | Prima versione di prova del cattivo (DriftDelivery_B1). |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | Grafico delle dipendenze + regole costituzionali. |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | Snippet di collegamento delle risorse della piattaforma. |

---

## Build e test

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## Principi di progettazione fondamentali

- **Il determinismo è costituzionale.** Lo stesso seme → la stessa simulazione → lo stesso punteggio, sempre. Nessun `DateTime.Now`, nessun `Random`, nessun numero in virgola mobile dipendente dalla piattaforma nel percorso critico.
- **Il rendering è una funzione pura dello stato.** Nessuna timeline di animazione. `MotionState + ForceVector + StabilityScalar → output visivo`.
- **Il caos è indifferente.** Gli ostacoli non reagiscono al giocatore. Sono sistemi, non nemici.
- **La maestria appare calma.** Se il gioco di alto livello sembra frenetico, il sistema sta mentendo.
- **Monolite modulare.** Quattro assembly con dipendenze unidirezionali imposte. Il dominio è la foglia; `MauiHost` è l'unica radice di composizione.
- **Gli avvisi sono errori.** I progetti di libreria utilizzano `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Licenza

[MIT](LICENSE)

> Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
