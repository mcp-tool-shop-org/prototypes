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

**Treinador determinístico para aprimorar a destreza com o mouse – precisão, controle e fluidez.**

Desenvolvido em .NET 10 MAUI (focado em Windows), com uma simulação determinística de passo fixo, modificadores de blueprint compostáveis e uma identidade de execução estável em diferentes plataformas. A mesma "semente" (seed) gera o mesmo nível, a mesma pontuação e a mesma repetição – em todos os lugares e sempre.

---

## Por que usar o MouseTrainer?

- **Determinístico até o último bit.** RNG xorshift32, hashing FNV-1a de 64 bits, passo fixo de 60 Hz com compensação de atraso. Sem `DateTime.Now`, sem `System.Random`, sem números de ponto flutuante dependentes da plataforma no código crítico.
- **Dificuldade configurável.** Seis modificadores de blueprint remodelam os níveis gerados antes de iniciar o jogo. Combine-os, ajuste seus parâmetros e a combinação é fixada no hash `RunId` para garantir a reprodutibilidade perfeita.
- **Verificação de repetição.** Cada sessão registra amostras de entrada quantizadas, serializadas em um formato binário compacto (`.mtr`). A verificação de repetição re-simula tick a tick e verifica o hash do fluxo de eventos, a pontuação e a combinação em relação ao original.
- **Monolito modular.** Quatro assemblies com dependências unidirecionais. O domínio é a parte mais básica, sem dependências; o MauiHost é a única raiz de composição. Sem ciclos, sem vazamento de informações da plataforma para as bibliotecas.
- **Identidade de nível de protocolo.** O `RunId` é um hash FNV-1a de 64 bits sobre o modo + semente + dificuldade + especificações do modificador, com parâmetros ordenados de forma canônica. Uma vez criado, é fixo para sempre.

---

## Pacotes NuGet

| Pacote | Descrição |
|---|---|
| **MouseTrainer.Domain** | RNG xorshift32 determinístico, hashing FNV-1a de 64 bits, codificação LEB128 varint, sistema de eventos de jogos e primitivas de identidade de execução. Sem dependências. |
| **MouseTrainer.Simulation** | Loop de jogo determinístico de 60 Hz com acumulador, modificadores de blueprint compostáveis, pipeline de geração de níveis, gravação/verificação de repetição e gerenciamento de sessões. Depende do Domínio. |
| **MouseTrainer.Audio** | Sistema de efeitos sonoros orientado a eventos com jitter determinístico de volume/frequência via xorshift32, limitação de taxa, verificação de manifesto de recursos e reprodução única ou em loop. Depende do Domínio. |

---

## Instalação

### Via NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### A partir do código-fonte

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

> **Observação:** O projeto host MAUI requer o Visual Studio com o workload .NET MAUI instalado. A compilação via CLI `dotnet build` pode falhar no MauiHost devido à geração de alvos MrtCore PRI – use o Visual Studio para compilações completas.

---

## Primeiros Passos

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

## Modos de Jogo

### ReflexGates

Desafio de portais em tela lateral. Aberturas oscilantes em paredes verticais – navegue o cursor por cada portal antes que o movimento da tela o alcance. A semente determinística gera o mesmo nível a cada vez.

| Propriedades | Value |
|---|---|
| Campo de Jogo | 1920 x 1080 pixels virtuais |
| Número de portais | 12 (padrão) |
| Velocidade de movimento da tela | 70 px/s (aproximadamente 83 segundos por rodada completa) |
| Pontuação | 100 pontos (centro) a 50 pontos (borda), combo a cada 3 portais |
| Oscilação | Amplitude de oscilação por portal (40--350 px) e frequência de oscilação (0.15--1.2 Hz) |
| RNG | Semente xorshift32 gerada por rodada para geração estável em diferentes plataformas. |
| Identificação | Hash FNV-1a de 64 bits do modo + semente + modificadores = mesmo `RunId` em todos os lugares. |

---

## Modificadores de Blueprint

Seis transformações compostáveis que remodelam os níveis gerados antes de iniciar o jogo. Aplicados como uma operação de redução ordenada sobre o `LevelBlueprint`:

| Modificador | Parâmetros Principais | Efeito |
|---|---|---|
| **NarrowMargin** | `fator` em [0.1, 1.0] | Reduz a altura das aberturas – espaços mais estreitos. |
| **WideMargin** | `fator` em [1.0, 3.0] | Aumenta a altura das aberturas – espaços mais amplos. |
| **DifficultyCurve** | `curve` em [-2.0, 2.0] | Reinterpolação da curva de dificuldade por índice de porta. |
| **RhythmLock** | `div` em {2, 3, 4, 6, 8} | Quantiza as fases das portas em N divisões – padrões rítmicos. |
| **GateJitter** | `str` em [0, 1] | Deslocamento vertical determinístico via sin(WallX, Phase) – perturbação espacial. |
| **SegmentBias** | `seg`, `amt`, `shape` | Divide as portas em atos com viés de dificuldade por segmento. |

Os modificadores são funções puras: `LevelBlueprint -> LevelBlueprint`. Eles são combinados por meio de pipeline (`specs.Aggregate`), são resolvidos a partir do `MutatorRegistry`, e seus parâmetros são fixados no hash `RunId` para garantir a reprodutibilidade.

### Formas de Viés de Segmento

- **Crescendo** (shape=0): Início fácil, final difícil. `d = 2t - 1`
- **Valley** (shape=1): Meio difícil, inícios e finais fáceis. `d = 8t(1-t) - 1`
- **Wave** (shape=2): Segmentos alternados de fácil/difícil. `d = (-1)^k`

### Expoente da Curva de Dificuldade

O parâmetro `curve` é mapeado para um expoente de potência via `pow(2, curve)`. Valores positivos aumentam a dificuldade no final (mais fácil no início, mais difícil no final). Valores negativos a aumentam no início. Zero é o valor padrão (sem alteração).

---

## Sistema de Repetição

Cada sessão pode ser gravada e verificada para anti-cheat e integridade da tabela de classificação.

| Componente | Role |
|---|---|
| `ReplayRecorder` | Captura amostras de entrada quantizadas a cada tick durante a jogabilidade. |
| `InputTrace` | Fluxo de entrada codificado por comprimentos de sequência para armazenamento compacto. |
| `ReplaySerializer` | Formato binário `.mtr`: cabeçalho mágico, varints LEB128, checksum FNV-1a. |
| `ReplayVerifier` | Re-simula tick a tick; verifica o hash do evento + pontuação + correspondência de combo. |
| `EventStreamHasher` | Hash FNV-1a rolante sobre o fluxo de eventos de simulação. |

Formato de fio: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## Sistema de Áudio

Áudio orientado a eventos com seleção de cue determinística. O `AudioDirector` mapeia eventos de simulação para efeitos sonoros com variação limitada – tudo determinístico via `DeterministicRng.Mix()`.

| Recurso | Detalhe |
|---|---|
| Seleção de cue | Escolha determinística entre ativos candidatos por tipo de evento. |
| Volume | `0.6 + 0.4 * intensity`, limitado a [0, 1]. |
| Jitter de afinação | [0.97, 1.03] via xorshift32, limitado a [0.9, 1.1]. |
| Limitação de taxa | Eventos HitWall limitados a uma vez a cada 6 ticks (aproximadamente 100 ms a 60 Hz). |
| Modos de reprodução | Reprodução única (hits, gates, combos) e em loop (drag, ambient). |
| Verificação de ativos | O `AssetVerifier` verifica todos os 13 arquivos de áudio necessários na inicialização. |

---

## Arquitetura

Monólito modular de quatro módulos. Sem ciclos, sem vazamento da plataforma para as bibliotecas.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### Referências Proibidas (Constitucional)

- `Audio` nunca deve referenciar `Simulation`.
- `Simulation` nunca deve referenciar `Audio`.
- `Domain` nunca deve referenciar nenhum módulo irmão.
- Nenhum módulo de biblioteca pode referenciar `Microsoft.Maui.*` ou qualquer SDK da plataforma.
- Nenhum modo pode fazer referência cruzada a outro modo.
- Os modificadores operam apenas em `LevelBlueprint` – nunca nos internos do modo.

Consulte [`docs/modular.manifesto.md`](docs/modular.manifesto.md) para o gráfico de dependências completo e as regras constitucionais.

---

## Princípios de Design

- **Determinismo fundamental.** A mesma semente produz a mesma simulação, que resulta na mesma pontuação, sempre. Não há `DateTime.Now`, nem `Random`, nem números de ponto flutuante dependentes da plataforma no caminho crítico.
- **Simulação com intervalo de tempo fixo.** 60 Hz com compensação baseada em acumulador. A renderização interpola entre os intervalos de tempo usando um fator de interpolação. O tempo da simulação é derivado do número de intervalos de tempo (`tick * dt`), e não do relógio do sistema, para evitar desvios nos números de ponto flutuante.
- **Identidade de nível de protocolo.** `MutatorId`, `ModeId` e `RunId` são permanentes – uma vez criados, permanecem fixos para sempre. O hash FNV-1a com serialização canônica dos parâmetros garante que as mesmas entradas sempre produzam a mesma identidade.
- **Monolito modular, não microserviços.** Quatro assemblies com dependências de sentido único impostas. O domínio é a parte mais básica; `MauiHost` é a única raiz de composição.
- **Avisos são tratados como erros.** Projetos de biblioteca usam `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. O host MAUI opta por não tratar os avisos (avisos gerados pelo SDK). Tipos de referência anuláveis habilitados em todos os lugares.
- **Pureza nos modificadores.** Os modificadores de blueprint são funções puras, sem acesso a geradores de números aleatórios, sem efeitos colaterais e sem referências a tipos específicos do modo. Eles leem apenas seus parâmetros e o blueprint de entrada.

---

## Estrutura do Projeto

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

## Licença

[MIT](LICENSE)
