<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Construit sur .NET 10 MAUI (priorité Windows), avec une simulation déterministe à pas de temps fixe, une machine d'état de mouvement à cinq états, et une identité visuelle paramétrique entièrement pilotée par l'état de la simulation.

Trace n'est pas un entraîneur de visée. Trace n'est pas un jeu d'arcade. La maîtrise se manifeste par la sérénité.

---

## Architecture

Monolithe modulaire en quatre modules. Pas de cycles, pas de fuite de plateforme dans les bibliothèques.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

Consultez [`docs/modular.manifesto.md`](docs/modular.manifesto.md) pour le graphe complet des dépendances et les règles constitutionnelles.

---

## Machine d'état de mouvement

Trace se trouve exactement dans l'un des cinq états de mouvement à chaque image :

| État | Identité | Visuel |
|-------|----------|--------|
| **Alignment** | Neutre, stable, calme | Cyan de base, faible luminosité |
| **Commitment** | Accélération décisive | Légère teinte vers l'avant, bord chaud |
| **Resistance** | Inclinaison de contre-force | Bord décalé vers l'ambre, luminosité accrue |
| **Correction** | Micro-ajustements | Luminosité du bord, haute précision |
| **Recovery** | Recul bref | Décoloration (150 ms) |

Les transitions sont imposées par une table de transition compilée. Les transitions interdites renvoient null.

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

Consultez [`docs/motion-state-machine.md`](docs/motion-state-machine.md) pour la machine d'état complète avec les conditions d'entrée/sortie.

---

## Archétypes du chaos (5 antagonistes)

| Archétype | Verbe | Compétence inverse | Comportement |
|-----------|------|---------------|----------|
| **Red Orbs** | Perturber | Anticipation | Dérive dans la région, rebond aux limites |
| **Crushers** | Contenir | Engagement | Cycle fixe : inactif → signalement → actif |
| **Drift Fields** | Déstabiliser | Stabilité de la prise | Force directionnelle constante |
| **Flickers** | Tromper | Filtrage | Flash → image rémanente → invisible |
| **Locks** | Restreindre | Adaptabilité | Contraintes d'axe/de vitesse avec signalement |

Le chaos ne réagit jamais à Trace. Le chaos est déterministe, indifférent, mécanique.

Consultez [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) et [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md).

---

## Rendu

Le rendu de Trace est une fonction pure de l'état. Pas de chronologies d'animation, pas de feuilles de sprites.

```
VisualState = RenderProfile[MotionState]
```

La couleur, en fonction de l'état, contrôle tout : remplissage, bord, intensité de la luminosité, biais directionnel, désaturation. Le moteur de rendu exprime l'identité de Trace avec zéro ressource d'animation.

Consultez [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) et [`docs/visual-style-guide.md`](docs/visual-style-guide.md).

---

## Héritage du moteur

Dérivé de [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Systèmes principaux :

- `IGameSimulation` — interface de mode de jeu remplaçable (2 méthodes)
- `DeterministicLoop` — boucle fixe à 60 Hz + interpolation alpha
- `DeterministicRng` — xorshift32, reproductible par la graine
- Pipeline `GameEvent` — flux d'événements typés
- Système de relecture — format binaire MTR v1, vérification FNV-1a
- Composition de mutateurs — transformations purement fonctionnelles `LevelBlueprint`
- Espace de coordonnées virtuel — 1920×1080, mise à l'échelle avec bordure noire

---

## Structure du projet

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

## Canon de conception

| Document | Objectif |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | Ce qu'est Trace, ce qu'il n'est pas, à qui il est destiné |
| [`tone-bible.md`](docs/tone-bible.md) | Règles de ton, d'interface utilisateur, d'animation et de feedback |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | Grammaire du mouvement, langage de chemin, réponses aux forces |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | Machine d'état FSM à 5 états avec transitions et chemins interdits. |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | Forme de traçage, couleurs par état, identité mondiale. |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | Profil de rendu, vecteur de force, scalaire de stabilité, éclat/biais/désaturation. |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 archétypes, 5 compétences, contrat de cohérence. |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | Spécifications de mouvement et d'animation par archétype. |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | Automates à états (FSM) par archétype (avec énumération et transitions prêtes). |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | Profil de rendu chaotique, spécifications de rendu par archétype. |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | Contrat d'interaction traçage-chaos. |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | Métaphysique audio, identité sonore traçage/chaos, la maîtrise = le silence. |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | Simulation → liaison des paramètres audio. |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | Composants DSP, flux de données, bus principal. |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | Guide sensoriel de l'identité sonore du monde. |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **Canon audio unifié (consolide les 4 documents audio).** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | Premier prototype de méchant (DriftDelivery_B1). |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | Graphe de dépendances + règles constitutionnelles. |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | Fragment de liaison des ressources de la plateforme. |

---

## Construction et tests

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## Principes de conception clés

- **Le déterminisme est constitutionnel.** La même graine → la même simulation → le même score, toujours. Pas de `DateTime.Now`, pas de `Random`, pas de nombres à virgule flottante dépendants de la plateforme dans le code critique.
- **Le rendu est une fonction pure de l'état.** Pas de chronologies d'animation. MotionState + ForceVector + StabilityScalar → résultat visuel.
- **Le chaos est indifférent.** Les obstacles ne réagissent jamais au joueur. Ce sont des systèmes, pas des ennemis.
- **La maîtrise se manifeste par le calme.** Si un jeu de haute compétence semble frénétique, le système est en erreur.
- **Monolithe modulaire.** Quatre assemblages avec des dépendances unidirectionnelles obligatoires. Le domaine est la feuille ; MauiHost est la seule racine de composition.
- **Les avertissements sont des erreurs.** Les projets de bibliothèque utilisent `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Licence

[MIT](LICENSE)

> Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
