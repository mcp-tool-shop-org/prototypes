<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# MouseTrainer

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Programma di allenamento per la precisione del mouse -- precisione, controllo e fluidità.**

Basato su .NET 10 MAUI (progettato principalmente per Windows), con una simulazione deterministica a intervallo fisso, modificatori di blueprint componibili e un'identità di esecuzione stabile su diverse piattaforme. Lo stesso seme produce lo stesso livello, lo stesso punteggio e la stessa ripetizione -- ovunque e ogni volta.

---

## Perché MouseTrainer?

- **Determinismo a livello di bit.** Generatore di numeri casuali xorshift32, hashing FNV-1a a 64 bit, intervallo fisso di 60 Hz con accumulo. Nessun utilizzo di `DateTime.Now`, `System.Random` o variabili in virgola mobile dipendenti dalla piattaforma nel codice critico.
- **Difficoltà componibile.** Sei modificatori di blueprint rimodellano i livelli generati prima dell'inizio del gioco. Combinateli, regolate i loro parametri e la combinazione viene "congelata" nell'hash `RunId` per una riproducibilità perfetta.
- **Verifica della ripetizione.** Ogni sessione registra campioni di input quantizzati, serializzati in un formato binario compatto (`.mtr`). La verifica della ripetizione esegue una simulazione tick-by-tick e controlla l'hash del flusso di eventi, il punteggio e la combo rispetto all'originale.
- **Monolite modulare.** Quattro assembly con dipendenze unidirezionali. Il dominio è la parte finale senza dipendenze; MauiHost è l'unico punto di composizione. Nessun ciclo, nessuna dipendenza dalla piattaforma nelle librerie.
- **Identità di livello protocollo.** `RunId` è un hash FNV-1a a 64 bit basato sulla modalità + seme + difficoltà + specifiche del modificatore, con parametri ordinati in modo canonico. Una volta creato, è "congelato" per sempre.

---

## Pacchetti NuGet

| Pacchetto | Descrizione |
|---|---|
| **MouseTrainer.Domain** | Generatore di numeri casuali xorshift32, hashing FNV-1a a 64 bit, codifica varint LEB128, sistema di eventi di gioco e primitive di identità di esecuzione. Nessuna dipendenza. |
| **MouseTrainer.Simulation** | Ciclo di gioco deterministico a 60 Hz con accumulo, modificatori di blueprint componibili, pipeline di generazione dei livelli, registrazione/verifica della ripetizione e gestione delle sessioni. Dipende dal dominio. |
| **MouseTrainer.Audio** | Sistema di segnali audio basato su eventi con jitter deterministico di volume/intonazione tramite xorshift32, limitazione della velocità, verifica del manifest delle risorse e riproduzione a singolo colpo o in loop. Dipende dal dominio. |

---

## Installazione

### Da NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### Da Sorgente

```bash
git clone https://github.com/mcp-tool-shop-org/MouseTrainer.git
cd MouseTrainer

# Build all library projects
dotnet build src/MouseTrainer.Domain/
dotnet build src/MouseTrainer.Simulation/
dotnet build src/MouseTrainer.Audio/

# Run all tests (214 tests across 10 categories)
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows -- use Visual Studio, set startup to MauiHost)
```

> **Nota:** Il progetto host MAUI richiede Visual Studio con il workload .NET MAUI installato. Il comando CLI `dotnet build` potrebbe fallire su MauiHost a causa della generazione dei target PRI di MrtCore; utilizzare Visual Studio per le build complete.

---

## Guida Rapida

```csharp
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Modes.ReflexGates;
using MouseTrainer.Simulation.Mutators;
using MouseTrainer.Simulation.Levels;

// 1. Create a run descriptor (deterministic identity)
var run = RunDescriptor.Create(
    mode: new ModeId("ReflexGates"),
    seed: 42,
    difficulty: DifficultyTier.Standard);

// 2. Generate a level blueprint from the seed
var config = new ReflexGateConfig();
var generator = new ReflexGateGenerator(config);
var blueprint = generator.Generate(run.Seed);

// 3. Optionally reshape the level with composable mutators
var registry = new MutatorRegistry();
registry.Register(new MutatorId("NarrowMargin"), 1, spec => new NarrowMarginMutator(spec));
registry.Register(new MutatorId("RhythmLock"), 1, spec => new RhythmLockMutator(spec));

var pipeline = new MutatorPipeline(registry);
var specs = new[]
{
    MutatorSpec.Create(new MutatorId("NarrowMargin"), 1,
        new[] { new MutatorParam("factor", 0.7f) }),
    MutatorSpec.Create(new MutatorId("RhythmLock"), 1,
        new[] { new MutatorParam("div", 4f) }),
};
blueprint = pipeline.Apply(blueprint, specs);

// 4. Wire up the simulation and deterministic loop
var sim = new ReflexGateSimulation(config);
sim.Reset(blueprint);

var loop = new DeterministicLoop(sim, new DeterministicConfig
{
    FixedHz = 60,
    SessionSeed = run.Seed,
});

// 5. Each frame: step the loop with host time and pointer input
// var result = loop.Step(pointerInput, hostNowTicks, ticksPerSecond);
// result.Events contains GameEvent[] for audio, scoring, and UI
```

---

## Modalità di Gioco

### ReflexGates

Sfida a scorrimento laterale. Aperture oscillanti su pareti verticali: guida il cursore attraverso ogni porta prima che lo scorrimento ti raggiunga. Un seme deterministico produce lo stesso livello ogni volta.

| Proprietà | Value |
|---|---|
| Area di gioco | 1920 x 1080 pixel virtuali |
| Numero di porte | 12 (predefinito) |
| Velocità di scorrimento | 70 px/s (circa 83 secondi per una singola esecuzione) |
| Punteggio | 100 punti (centro) a 50 punti (bordo), combo ogni 3 porte |
| Oscillazione | Rampa di ampiezza (40--350 px) e rampa di frequenza (0.15--1.2 Hz) per porta |
| RNG | Seme xorshift32 per ogni esecuzione per una generazione stabile su diverse piattaforme |
| Identità | Hash FNV-1a a 64 bit di modalità + seme + modificatori = stesso `RunId` ovunque |

---

## Modificatori di Blueprint

Sei trasformazioni componibili che rimodellano i livelli generati prima dell'inizio del gioco. Applicate come piegatura ordinata su `LevelBlueprint`:

| Modificatore | Parametri Chiave | Effetto |
|---|---|---|
| **NarrowMargin** | `fattore` in [0.1, 1.0] | Riduce l'altezza delle aperture: spazi più stretti |
| **WideMargin** | `fattore` in [1.0, 3.0] | Aumenta l'altezza delle aperture: spazi più larghi |
| **DifficultyCurve** | `curve` in [-2.0, 2.0] | Ricalibrazione della curva di difficoltà in base all'indice del gate. |
| **RhythmLock** | `div` in {2, 3, 4, 6, 8} | Quantizzazione delle fasi dei gate in N divisioni: schemi ritmici. |
| **GateJitter** | `str` in [0, 1] | Offset verticale deterministico tramite sin(WallX, Phase): perturbazione spaziale. |
| **SegmentBias** | `seg`, `amt`, `shape` | Divisione dei gate in atti con bias di difficoltà per segmento. |

I mutatori sono funzioni pure: `LevelBlueprint -> LevelBlueprint`. Vengono combinati tramite pipeline (`specs.Aggregate`), risolti dal `MutatorRegistry`, e i loro parametri vengono inclusi nell'hash `RunId` per garantire la riproducibilità.

### Forme del Segment Bias

- **Crescendo** (shape=0): Inizio facile, finale difficile. `d = 2t - 1`
- **Valley** (shape=1): Difficoltà elevata al centro, facile all'inizio e alla fine. `d = 8t(1-t) - 1`
- **Wave** (shape=2): Segmenti alternati di difficoltà facile/difficile. `d = (-1)^k`

### Esponente della Curva di Difficoltà

Il parametro `curve` viene mappato a un esponente di potenza tramite `pow(2, curve)`. Valori positivi aumentano la difficoltà verso la fine (più facile all'inizio, più difficile alla fine). Valori negativi la aumentano all'inizio. Lo zero rappresenta l'identità (nessuna modifica).

---

## Sistema di Riproduzione

Ogni sessione può essere registrata e verificata per prevenire imbrogli e garantire l'integrità della classifica.

| Componente. | Role |
|---|---|
| `ReplayRecorder` | Acquisisce campioni di input quantizzati ad ogni tick durante il gioco. |
| `InputTrace` | Flusso di input codificato con run-length per un'archiviazione compatta. |
| `ReplaySerializer` | Formato binario `.mtr`: intestazione magica, varints LEB128, checksum FNV-1a. |
| `ReplayVerifier` | Riesegue tick per tick; verifica l'hash degli eventi + punteggio + corrispondenza delle combo. |
| `EventStreamHasher` | Calcolo dell'hash FNV-1a scorrevole sul flusso di eventi della simulazione. |

Formato del file: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## Sistema Audio

Audio basato su eventi con selezione deterministica dei suoni. L'`AudioDirector` mappa gli eventi di simulazione a effetti sonori con una variazione limitata: tutto deterministico tramite `DeterministicRng.Mix()`.

| Funzionalità. | Dettaglio. |
|---|---|
| Selezione del suono. | Scelta deterministica tra risorse candidate per ogni tipo di evento. |
| Volume. | `0.6 + 0.4 * intensity`, limitato a [0, 1]. |
| Variazione del tono. | [0.97, 1.03] tramite xorshift32, limitato a [0.9, 1.1]. |
| Limitazione della frequenza. | Gli eventi `HitWall` vengono limitati a una volta ogni 6 tick (circa 100 ms a 60 Hz). |
| Modalità di riproduzione. | Singola esecuzione (colpi, gate, combo) e ripetuta (trascinamento, ambiente). |
| Verifica delle risorse. | L'`AssetVerifier` verifica tutti e 13 i file audio richiesti all'avvio. |

---

## Architettura

Monolite modulare composto da quattro moduli. Nessun ciclo, nessuna dipendenza dalla piattaforma nelle librerie.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### Riferimenti Vietati (Costituzionali)

- `Audio` non deve mai fare riferimento a `Simulation`.
- `Simulation` non deve mai fare riferimento a `Audio`.
- `Domain` non deve mai fare riferimento a nessun altro modulo.
- Nessun modulo libreria può fare riferimento a `Microsoft.Maui.*` o a qualsiasi SDK della piattaforma.
- Nessuna modalità può fare riferimento a un'altra modalità.
- I mutatori operano solo su `LevelBlueprint` e non su elementi interni delle modalità.

Consultare [`docs/modular.manifesto.md`](docs/modular.manifesto.md) per il grafico delle dipendenze completo e le regole costituzionali.

---

## Principi di progettazione

- **Il determinismo è fondamentale.** La stessa "seme" produce la stessa simulazione, che genera lo stesso punteggio, sempre. Non ci sono `DateTime.Now`, né `Random`, né numeri in virgola mobile dipendenti dalla piattaforma nel percorso critico.
- **Simulazione a intervallo fisso.** 60 Hz con meccanismo di recupero basato su un accumulatore. Il rendering interpola tra i fotogrammi utilizzando un fattore di interpolazione. Il tempo di simulazione è derivato dal conteggio dei fotogrammi (`tick * dt`), e non dall'orologio di sistema, per evitare derive nei numeri in virgola mobile.
- **Identità di livello protocollo.** `MutatorId`, `ModeId` e `RunId` sono permanenti: una volta creati, rimangono fissi per sempre. L'hashing FNV-1a con la serializzazione canonica dei parametri garantisce che gli stessi input producano sempre la stessa identità.
- **Monolite modulare, non microservizi.** Quattro assembly con dipendenze unidirezionali imposte. Il dominio è la parte più interna; `MauiHost` è l'unico punto di composizione.
- **Gli avvisi sono errori.** I progetti di libreria utilizzano `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. L'host MAUI esclude questa impostazione (avvisi generati dall'SDK). I tipi di riferimento nullable sono abilitati ovunque.
- **Purezza nei mutatori.** I mutatori del blueprint sono funzioni pure, senza accesso a generatori di numeri casuali, senza effetti collaterali e senza riferimenti a tipi specifici della modalità. Leggono solo i loro parametri e il blueprint di input.

---

## Struttura del progetto

```
src/
  Directory.Build.props         Shared build settings (nullable, warnings-as-errors, analysis level)

  MouseTrainer.Domain/          Leaf module -- events, input, runs, RNG
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Utility/                    DeterministicRng (xorshift32), Fnv1a (64-bit), Leb128 (varint)

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, DeterministicConfig, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplayVerifier, ReplaySerializer, InputTrace, EventStreamHasher
    Session/                    SessionController, SessionModels, ScoreBreakdown

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest (13 required files), AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
    GameRenderer.cs             MAUI canvas rendering with neon palette
    GhostPlayback.cs            Replay ghost overlay
    ParticleSystem.cs           Hit/miss particle effects
    ScreenShake.cs              Camera shake on wall hits
    TrailBuffer.cs              Cursor trail rendering
    SessionStore.cs             Local session persistence
    NeonPalette.cs              Color theme

tests/
  MouseTrainer.Tests/           214 tests across 10 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, session controller
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event stream hasher, input trace
    Runs/                       RunDescriptor golden hashes + identity
    Scoring/                    Score breakdown
    Utility/                    LEB128 encoding

tools/
  MouseTrainer.AudioGen/        Audio asset generation tooling

docs/
  modular.manifesto.md          Dependency graph + constitutional rules
  product-boundary.md           Product scope and boundary definition
  MAUI_AssetOpener_Snippet.md   Platform asset wiring snippet
```

---

## Licenza

[MIT](LICENSE)
