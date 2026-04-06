<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Construido sobre .NET 10 MAUI (priorizando Windows), con una simulación determinista de intervalo de tiempo fijo, una máquina de estados de movimiento de cinco estados y una identidad visual paramétrica impulsada completamente por el estado de la simulación.

Trace no es un entrenador de puntería. Trace no es un juego de arcade. La maestría se manifiesta con calma.

---

## Arquitectura

Monolito modular de cuatro módulos. Sin ciclos, sin filtración de la plataforma en las bibliotecas.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

Consulte [`docs/modular.manifesto.md`](docs/modular.manifesto.md) para ver el gráfico de dependencias completo y las reglas constitucionales.

---

## Máquina de Estados de Movimiento

Trace se encuentra exactamente en uno de los cinco estados de movimiento en cada fotograma:

| Estado | Identidad | Visual |
|-------|----------|--------|
| **Alignment** | Neutral, estable, calmado | Cian base, brillo mínimo |
| **Commitment** | Aceleración decisiva | Ligeramente teñido de color, borde cálido |
| **Resistance** | Inclinación de contragolpe | Borde con matiz ámbar, brillo aumentado |
| **Correction** | Microajustes | Brillo del borde, alta precisión |
| **Recovery** | Retroceso breve | Desaturación gradual (150 ms) |

Las transiciones se imponen mediante una tabla de transiciones de compilación. Las transiciones prohibidas devuelven nulo.

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

Consulte [`docs/motion-state-machine.md`](docs/motion-state-machine.md) para ver la máquina de estados finitos (FSM) completa con condiciones de entrada/salida.

---

## Arquetipos del Caos (5 Villanos)

| Arquetipo | Verbo | Contra-Habilidad | Comportamiento |
|-----------|------|---------------|----------|
| **Red Orbs** | Interrumpir | Anticipación | Deriva dentro de la región, rebote en los límites |
| **Crushers** | Restringir | Compromiso | Ciclo fijo: inactivo → señal → activo |
| **Drift Fields** | Desestabilizar | Estabilidad del agarre | Fuerza direccional constante |
| **Flickers** | Engañar | Filtrado | Destello → imagen residual → invisible |
| **Locks** | Limitar | Adaptabilidad | Restricciones de eje/velocidad con señal |

El Caos nunca reacciona a Trace. El Caos es determinista, indiferente, mecánico.

Consulte [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) y [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md).

---

## Renderizado

El renderizado de Trace es una función pura del estado. No hay líneas de tiempo de animación, ni láminas de sprites.

```
VisualState = RenderProfile[MotionState]
```

El color, según el estado, controla todo: relleno, borde, intensidad del brillo, sesgo direccional, desaturación. El renderizador expresa la identidad de Trace con cero activos de animación.

Consulte [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) y [`docs/visual-style-guide.md`](docs/visual-style-guide.md).

---

## Herencia del Motor

Derivado de [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Sistemas principales:

- `IGameSimulation` — interfaz de modo de juego enchufable (2 métodos)
- `DeterministicLoop` — intervalo de tiempo fijo de 60 Hz + interpolación alfa
- `DeterministicRng` — xorshift32, semilla reproducible
- Canal de `GameEvent` — flujo de eventos tipados
- Sistema de repetición — formato binario MTR v1, verificación FNV-1a
- Composición de mutadores — transformaciones de función pura `LevelBlueprint`
- Espacio de coordenadas virtuales — 1920×1080, escalado con barras negras

---

## Estructura del Proyecto

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

## Canon de Diseño

| Documento | Propósito |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | Qué es Trace, qué no es, para quién es |
| [`tone-bible.md`](docs/tone-bible.md) | Reglas de tono de voz, interfaz de usuario, animación y retroalimentación |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | Gramática de movimiento, lenguaje de trayectoria, respuestas de fuerza |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | Máquina de estados finitos (FSM) de 5 estados con transiciones y rutas prohibidas. |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | Forma de trazado, color según estado, identidad mundial. |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | Perfil de renderizado, vector de fuerza, escalar de estabilidad, brillo/sesgo/desaturación. |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 arquetipos, 5 habilidades, contrato de consistencia. |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | Especificaciones de movimiento y animación por arquetipo. |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | Máquinas de estados (FSM) por arquetipo (enumeración + transiciones listas para usar). |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | Perfil de renderizado "Chaos", especificaciones de renderizado por arquetipo. |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | Contrato de interacción entre "Trace" y "Chaos". |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | Metafísica del audio, identidad sonora de "Trace/Chaos", la maestría = silencio. |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | Simulación → conexión de parámetros de audio. |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | Componentes de procesamiento de señales digitales (DSP), flujo de datos, bus principal. |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | Guía sensorial de la identidad sonora del mundo. |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **Canon de audio unificado (consolida los 4 documentos de audio).** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | Primera prueba del villano (DriftDelivery_B1). |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | Gráfico de dependencias + reglas constitucionales. |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | Fragmento de conexión de activos de la plataforma. |

---

## Compilación y pruebas

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## Principios de diseño clave

- **El determinismo es constitucional.** La misma semilla → la misma simulación → la misma puntuación, siempre. No se utiliza `DateTime.Now`, ni `Random`, ni números de punto flotante dependientes de la plataforma en la ruta crítica.
- **El renderizado es una función pura del estado.** No hay líneas de tiempo de animación. MotionState + Vector de fuerza + Escalar de estabilidad → resultado visual.
- **El caos es indiferente.** Los obstáculos nunca reaccionan al jugador. Son sistemas, no enemigos.
- **La maestría se ve tranquila.** Si el juego de alto nivel parece frenético, el sistema está mintiendo.
- **Monolito modular.** Cuatro ensamblados con dependencias unidireccionales obligatorias. El dominio es la hoja; MauiHost es la única raíz de composición.
- **Las advertencias son errores.** Los proyectos de biblioteca utilizan `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Licencia

[MIT](LICENSE)

> Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
