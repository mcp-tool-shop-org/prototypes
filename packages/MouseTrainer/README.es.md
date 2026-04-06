<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# MouseTrainer

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Entrenador determinista para la destreza del ratón: precisión, control y fluidez.**

Desarrollado con .NET 10 MAUI (priorizando Windows), con una simulación determinista de paso fijo, modificadores de diseño composables y una identidad de ejecución estable en diferentes plataformas. La misma semilla produce el mismo nivel, la misma puntuación y la misma repetición, en todas partes y en todo momento.

---

## ¿Por qué MouseTrainer?

- **Determinista hasta el último bit.** Generador de números aleatorios xorshift32, hashing FNV-1a de 64 bits, paso fijo de 60 Hz con acumulación. No utiliza `DateTime.Now`, ni `System.Random`, ni números de punto flotante dependientes de la plataforma en el código crítico.
- **Dificultad configurable.** Seis modificadores de diseño que alteran los niveles generados antes de la partida. Combínalos, ajusta sus parámetros, y la combinación se congela en el hash `RunId` para una reproducibilidad perfecta.
- **Verificación de repeticiones.** Cada sesión registra muestras de entrada cuantificadas, serializadas en un formato binario compacto (`.mtr`). La verificación de repeticiones vuelve a simular cada ciclo y comprueba el hash del flujo de eventos, la puntuación y la combinación con el original.
- **Monolito modular.** Cuatro ensamblados con dependencias unidireccionales. El dominio es el componente base sin dependencias; MauiHost es la única raíz de composición. No hay ciclos, ni fugas de la plataforma en las bibliotecas.
- **Identidad de grado de protocolo.** El `RunId` es un hash FNV-1a de 64 bits sobre el modo + semilla + dificultad + especificaciones del modificador, con parámetros ordenados de forma canónica. Una vez creado, se congela permanentemente.

---

## Paquetes NuGet

| Paquete | Descripción |
|---|---|
| **MouseTrainer.Domain** | Generador de números aleatorios xorshift32, hashing FNV-1a de 64 bits, codificación LEB128 varint, sistema de eventos del juego y primitivas de identidad de ejecución. Sin dependencias. |
| **MouseTrainer.Simulation** | Bucle de juego determinista de 60 Hz con acumulador, modificadores de diseño composables, canal de generación de niveles, grabación/verificación de repeticiones y gestión de sesiones. Depende de Domain. |
| **MouseTrainer.Audio** | Sistema de señales de audio basado en eventos con jitter determinista de volumen/tono mediante xorshift32, limitación de velocidad, verificación de manifiesto de recursos y reproducción de un solo disparo o en bucle. Depende de Domain. |

---

## Instalación

### Desde NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### Desde el código fuente

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

> **Nota:** El proyecto de host MAUI requiere Visual Studio con el workload de .NET MAUI instalado. La compilación desde la línea de comandos (`dotnet build`) puede fallar en MauiHost debido a la generación de objetivos PRI de MrtCore; utilice Visual Studio para compilaciones completas.

---

## Primeros pasos

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

## Modos de juego

### ReflexGates

Desafío de puertas con desplazamiento lateral. Aberturas oscilantes en paredes verticales: navega el cursor a través de cada puerta antes de que el desplazamiento te alcance. La semilla determinista produce un nivel idéntico cada vez.

| Propiedad | Value |
|---|---|
| Campo de juego | 1920 x 1080 píxeles virtuales |
| Número de puertas | 12 (por defecto) |
| Velocidad de desplazamiento | 70 píxeles/s (aproximadamente 83 segundos por ejecución limpia) |
| Puntuación | 100 puntos (centro) a 50 puntos (borde), combo cada 3 puertas |
| Oscilación | Rampa de amplitud por puerta (40--350 píxeles) y rampa de frecuencia (0.15--1.2 Hz) |
| RNG | xorshift32 sembrado por ejecución para generación estable en diferentes plataformas. |
| Identidad | Hash FNV-1a de 64 bits del modo + semilla + modificadores = mismo `RunId` en todas partes. |

---

## Modificadores de diseño

Seis transformaciones composables que alteran los niveles generados antes de la partida. Se aplican como una operación ordenada sobre `LevelBlueprint`:

| Modificador | Parámetros clave | Efecto |
|---|---|---|
| **NarrowMargin** | `factor` en [0.1, 1.0] | Reduce la altura de las aberturas: huecos más estrechos. |
| **WideMargin** | `factor` en [1.0, 3.0] | Aumenta la altura de las aberturas: más permisivo. |
| **DifficultyCurve** | `curve` en el rango [-2.0, 2.0] | Reinterpolación de la dificultad mediante la curva de potencia, indexada por puerta. |
| **RhythmLock** | `div` en {2, 3, 4, 6, 8} | Cuantización de las fases de las puertas en N divisiones: patrones rítmicos. |
| **GateJitter** | `str` en [0, 1] | Desplazamiento vertical determinista mediante sin(WallX, Phase): perturbación espacial. |
| **SegmentBias** | `seg`, `amt`, `shape` | Divide las puertas en actos, con un sesgo de dificultad específico para cada segmento. |

Los modificadores son funciones puras: `LevelBlueprint -> LevelBlueprint`. Se combinan mediante tuberías (`specs.Aggregate`), se resuelven desde el `MutatorRegistry`, y sus parámetros se congelan en el hash `RunId` para garantizar la reproducibilidad.

### Formas de Sesgo de Segmento

- **Crescendo** (forma=0): Comienzo fácil, final difícil. `d = 2t - 1`
- **Valley** (forma=1): Medio difícil, finales fáciles. `d = 8t(1-t) - 1`
- **Wave** (forma=2): Segmentos fáciles/difíciles alternantes. `d = (-1)^k`

### Exponente de la Curva de Dificultad

El parámetro `curve` se mapea a un exponente de potencia mediante `pow(2, curve)`. Los valores positivos aumentan la dificultad hacia el final (más fácil al principio, más difícil al final). Los valores negativos la aumentan al principio. Cero es el valor por defecto (sin cambios).

---

## Sistema de Repetición

Cada sesión se puede grabar y verificar para garantizar la integridad del sistema anti-trampas y de la tabla de clasificación.

| Componente | Role |
|---|---|
| `ReplayRecorder` | Captura muestras de entrada cuantizadas por cada tick durante el juego. |
| `InputTrace` | Flujo de entrada codificado con codificación de longitud de ejecución para un almacenamiento compacto. |
| `ReplaySerializer` | Formato binario `.mtr`: encabezado mágico, varints LEB128, suma de comprobación FNV-1a. |
| `ReplayVerifier` | Re-simula tick por tick; verifica el hash de eventos + puntuación + coincidencia de combos. |
| `EventStreamHasher` | Cálculo de la suma de comprobación FNV-1a sobre el flujo de eventos de la simulación. |

Formato de cable: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## Sistema de Audio

Audio basado en eventos con selección determinista de señales. El `AudioDirector` mapea eventos de simulación a efectos de sonido con una variación limitada: todo es determinista mediante `DeterministicRng.Mix()`.

| Característica | Detalle |
|---|---|
| Selección de señales | Elección determinista entre activos candidatos por tipo de evento. |
| Volumen | `0.6 + 0.4 * intensidad`, limitado al rango [0, 1]. |
| Variación de tono | [0.97, 1.03] mediante xorshift32, limitado al rango [0.9, 1.1]. |
| Limitación de velocidad | Eventos HitWall limitados a una vez cada 6 ticks (aproximadamente 100 ms a 60 Hz). |
| Modos de reproducción | Reproducción única (impactos, puertas, combos) y bucle (deslizamiento, ambiente). |
| Verificación de activos | El `AssetVerifier` verifica los 13 archivos de audio requeridos al inicio. |

---

## Arquitectura

Monolito modular de cuatro módulos. Sin ciclos, sin filtración de la plataforma en las bibliotecas.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### Referencias Prohibidas (Constitucionales)

- `Audio` nunca debe referenciar a `Simulation`.
- `Simulation` nunca debe referenciar a `Audio`.
- `Domain` nunca debe referenciar a ningún módulo hermano.
- Ningún módulo de biblioteca puede referenciar a `Microsoft.Maui.*` ni a ningún SDK de la plataforma.
- Ningún modo puede hacer referencia cruzada a otro modo.
- Los modificadores solo operan en `LevelBlueprint`: nunca en los componentes internos de un modo.

Consulte [`docs/modular.manifesto.md`](docs/modular.manifesto.md) para ver el gráfico de dependencias completo y las reglas constitucionales.

---

## Principios de Diseño

- **El determinismo es fundamental.** La misma semilla produce la misma simulación y, por lo tanto, la misma puntuación, siempre. No hay `DateTime.Now`, ni `Random`, ni números de punto flotante dependientes de la plataforma en el código crítico.
- **Simulación con paso de tiempo fijo.** 60 Hz con compensación basada en un acumulador. La renderización interpola entre los pasos mediante un factor alfa. El tiempo de simulación se deriva del número de pasos (`tick * dt`), y no del reloj del sistema, para evitar la deriva de los números de punto flotante.
- **Identidad de grado de protocolo.** `MutatorId`, `ModeId` y `RunId` son permanentes; una vez creados, permanecen fijos para siempre. El hashing FNV-1a con serialización canónica de parámetros garantiza que las mismas entradas siempre produzcan la misma identidad.
- **Monolito modular, no microservicios.** Cuatro ensamblados con dependencias unidireccionales obligatorias. El dominio es la capa más baja; `MauiHost` es la única raíz de composición.
- **Las advertencias son errores.** Los proyectos de biblioteca utilizan `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. El host de MAUI opta por no mostrar estas advertencias (advertencias generadas por el SDK). Los tipos de referencia anulables están habilitados en todas partes.
- **Pureza en los modificadores.** Los modificadores de planos son funciones puras que no tienen acceso a generadores de números aleatorios, no tienen efectos secundarios y no hacen referencia a tipos específicos del modo. Solo leen sus parámetros y el plano de entrada.

---

## Estructura del proyecto

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

## Licencia

[MIT](LICENSE)
