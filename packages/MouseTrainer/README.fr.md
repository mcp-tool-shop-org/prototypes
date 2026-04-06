<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# MouseTrainer

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Entraîneur de dextérité de la souris déterministe – précision, contrôle et fluidité.**

Construit sur .NET 10 MAUI (priorité Windows), avec une simulation à pas fixe entièrement déterministe, des mutateurs de blueprint composables et une identité de session stable, quelle que soit la plateforme. La même graine génère le même niveau, le même score et la même relecture – partout, à chaque fois.

---

## Pourquoi MouseTrainer ?

- **Déterminisme au niveau du bit.** Générateur de nombres aléatoires xorshift32, hachage FNV-1a 64 bits, pas fixe de 60 Hz avec accumulation. Pas de `DateTime.Now`, pas de `System.Random`, pas de nombres à virgule flottante dépendant de la plateforme dans le code critique.
- **Difficulté configurable.** Six mutateurs de blueprint modifient les niveaux générés avant le jeu. Empilez-les, ajustez leurs paramètres, et la combinaison est figée dans le hachage `RunId` pour une reproductibilité parfaite.
- **Vérification de la relecture.** Chaque session enregistre des échantillons d'entrée quantifiés, sérialisés dans un format binaire compact (`.mtr`). La vérification de la relecture simule chaque étape et vérifie le hachage du flux d'événements, le score et la combinaison par rapport à l'original.
- **Monolithe modulaire.** Quatre assemblages avec des dépendances unidirectionnelles. Le domaine est la partie la plus élémentaire, sans aucune dépendance ; MauiHost est la seule racine de composition. Pas de cycles, pas de fuite de la plateforme dans les bibliothèques.
- **Identité de qualité protocolaire.** Le `RunId` est un hachage FNV-1a 64 bits basé sur le mode + la graine + la difficulté + les spécifications du mutateur, avec des paramètres triés de manière canonique. Une fois créé, il est figé pour toujours.

---

## Paquets NuGet

| Paquet | Description |
|---|---|
| **MouseTrainer.Domain** | Générateur de nombres aléatoires xorshift32, hachage FNV-1a 64 bits, encodage LEB128 varint, système d'événements de jeu et primitives d'identité de session. Aucune dépendance. |
| **MouseTrainer.Simulation** | Boucle de jeu déterministe à 60 Hz avec accumulateur, mutateurs de blueprint composables, pipeline de génération de niveaux, enregistrement/vérification de la relecture et gestion de session. Dépend du Domaine. |
| **MouseTrainer.Audio** | Système de signaux audio piloté par des événements avec un jitter de volume/hauteur déterministe via xorshift32, limitation de débit, vérification du manifeste des ressources et lecture en une seule fois ou en boucle. Dépend du Domaine. |

---

## Installation

### Depuis NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### Depuis le code source

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

> **Note :** Le projet hôte MAUI nécessite Visual Studio avec le workload .NET MAUI installé. La commande CLI `dotnet build` peut échouer sur MauiHost en raison de la génération des cibles MrtCore PRI – utilisez Visual Studio pour les compilations complètes.

---

## Premiers pas

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

## Modes de jeu

### ReflexGates

Défi de passage latéral. Ouvertures oscillantes sur des murs verticaux – guidez le curseur à travers chaque passage avant que le défilement ne vous rattrape. Une graine déterministe génère un niveau identique à chaque fois.

| Propriété | Value |
|---|---|
| Champ de jeu | 1920 x 1080 pixels virtuels |
| Nombre de passages | 12 (par défaut) |
| Vitesse de défilement | 70 px/s (environ 83 secondes par parcours réussi) |
| Score | 100 points (centre) à 50 points (bord), combo tous les 3 passages |
| Oscillation | Rampes d'amplitude (40 à 350 px) et de fréquence (0,15 à 1,2 Hz) par passage |
| RNG | xorshift32 initialisé pour chaque session afin de générer un résultat stable, quel que soit le système. |
| Identité | Hachage FNV-1a 64 bits du mode + de la graine + des mutateurs = même `RunId` partout |

---

## Mutateurs de blueprint

Six transformations composables qui modifient les niveaux générés avant le jeu. Appliquées comme un pli ordonné sur `LevelBlueprint` :

| Mutateur | Paramètres clés | Effet |
|---|---|---|
| **NarrowMargin** | `factor` entre [0,1 et 1,0] | Réduit la hauteur des ouvertures – espaces plus étroits |
| **WideMargin** | `factor` entre [1,0 et 3,0] | Augmente la hauteur des ouvertures – espaces plus larges |
| **DifficultyCurve** | `curve` dans l'intervalle [-2.0, 2.0] | Réinterpolation de la courbe de difficulté en fonction de l'index de la porte. |
| **RhythmLock** | `div` dans {2, 3, 4, 6, 8} | Quantifie les phases des portes en N divisions – motifs rythmiques. |
| **GateJitter** | `str` dans [0, 1] | Décalage vertical déterministe via sin(WallX, Phase) – perturbation spatiale. |
| **SegmentBias** | `seg`, `amt`, `shape` | Divise les portes en actes avec un biais de difficulté par segment. |

Les modificateurs sont des fonctions pures : `LevelBlueprint -> LevelBlueprint`. Ils sont combinés via un pipeline (`specs.Aggregate`), sont résolus à partir du `MutatorRegistry`, et leurs paramètres sont figés dans le hachage `RunId` pour assurer la reproductibilité.

### Formes de biais de segment

- **Crescendo** (shape=0) : Début facile, fin difficile. `d = 2t - 1`
- **Valley** (shape=1) : Milieu difficile, début et fin faciles. `d = 8t(1-t) - 1`
- **Wave** (shape=2) : Segments alternant facile/difficile. `d = (-1)^k`

### Exposant de la courbe de difficulté

Le paramètre `curve` est mappé à un exposant de puissance via `pow(2, curve)`. Les valeurs positives augmentent la difficulté progressivement (plus facile au début, plus difficile à la fin). Les valeurs négatives la diminuent progressivement. Zéro correspond à l'identité (pas de changement).

---

## Système de relecture

Chaque session peut être enregistrée et vérifiée pour lutter contre la triche et garantir l'intégrité du classement.

| Composant. | Role |
|---|---|
| `ReplayRecorder` | Capture les échantillons d'entrée quantifiés par tick pendant le jeu. |
| `InputTrace` | Flux d'entrée encodé en longueur de séquence pour un stockage compact. |
| `ReplaySerializer` | Format binaire `.mtr` : en-tête magique, varints LEB128, checksum FNV-1a. |
| `ReplayVerifier` | Re-simule tick par tick ; vérifie le hachage des événements + le score + la correspondance des combos. |
| `EventStreamHasher` | Hachage FNV-1a incrémental sur le flux d'événements de la simulation. |

Format du fichier : `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## Système audio

Audio piloté par les événements avec une sélection de sons déterministe. L'`AudioDirector` mappe les événements de simulation à des effets sonores avec une variation limitée – tout est déterministe via `DeterministicRng.Mix()`.

| Fonctionnalité. | Détail. |
|---|---|
| Sélection des sons. | Choix déterministe parmi les ressources candidates par type d'événement. |
| Volume. | `0.6 + 0.4 * intensity`, limité à [0, 1]. |
| Variation de la hauteur. | [0.97, 1.03] via xorshift32, limité à [0.9, 1.1]. |
| Limitation du débit. | Les événements `HitWall` sont limités à une fois toutes les 6 ticks (environ 100 ms à 60 Hz). |
| Modes de lecture. | Lecture unique (impacts, portes, combos) et en boucle (glissement, ambiance). |
| Vérification des ressources. | L'`AssetVerifier` vérifie les 13 fichiers audio requis au démarrage. |

---

## Architecture

Monolithe modulaire à quatre modules. Pas de cycles, pas de fuite de la plateforme vers les bibliothèques.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### Références interdites (constitutionnelles)

- `Audio` ne doit jamais faire référence à `Simulation`.
- `Simulation` ne doit jamais faire référence à `Audio`.
- `Domain` ne doit jamais faire référence à un module frère.
- Aucun module de bibliothèque ne peut faire référence à `Microsoft.Maui.*` ou à un SDK de plateforme.
- Aucun mode ne peut faire référence à un autre mode.
- Les modificateurs ne fonctionnent que sur `LevelBlueprint` – jamais sur les détails internes des modes.

Consultez [`docs/modular.manifesto.md`](docs/modular.manifesto.md) pour le graphe de dépendances complet et les règles constitutionnelles.

---

## Principes de conception

- **Déterminisme constitutionnel.** La même graine produit la même simulation, qui génère le même score, toujours. Pas de `DateTime.Now`, pas de `Random`, pas de nombres à virgule flottante dépendant de la plateforme dans le code critique.
- **Simulation avec pas de temps fixe.** 60 Hz avec rattrapage basé sur un accumulateur. Le rendu effectue une interpolation entre les trames en utilisant un facteur alpha. Le temps de simulation est dérivé du nombre de trames (`tick * dt`), et non de l'horloge système, afin d'éviter les dérives des nombres à virgule flottante.
- **Identité de qualité protocolaire.** `MutatorId`, `ModeId` et `RunId` sont permanents : une fois créés, ils sont figés pour toujours. Le hachage FNV-1a avec une sérialisation canonique des paramètres garantit que les mêmes entrées produisent toujours la même identité.
- **Monolithe modulaire, pas microservices.** Quatre assemblages avec des dépendances unidirectionnelles imposées. Le domaine est la partie la plus basse de la hiérarchie ; `MauiHost` est la seule racine de composition.
- **Les avertissements sont traités comme des erreurs.** Les projets de bibliothèque utilisent `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. L'hôte MAUI est exempté (avertissements générés par le SDK). Les types de référence nullable sont activés partout.
- **Pureté dans les mutateurs.** Les mutateurs de blueprint sont des fonctions pures qui n'ont pas accès à un générateur de nombres aléatoires, n'ont pas d'effets secondaires et ne font aucune référence à des types spécifiques au mode. Ils ne lisent que leurs paramètres et le blueprint d'entrée.

---

## Structure du projet

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

## Licence

[MIT](LICENSE)
