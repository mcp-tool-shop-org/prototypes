<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Construído com .NET 10 MAUI (focado em Windows), com uma simulação determinística de passo fixo, uma máquina de estados de movimento com cinco estados e uma identidade visual paramétrica totalmente impulsionada pelo estado da simulação.

Trace não é um treinador de mira. Trace não é um jogo de arcade. A maestria aparenta calma.

---

## Arquitetura

Monólito modular com quatro módulos. Sem ciclos, sem vazamento de plataforma para as bibliotecas.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

Consulte [`docs/modular.manifesto.md`](docs/modular.manifesto.md) para o gráfico de dependências completo e as regras constitucionais.

---

## Máquina de Estados de Movimento

Trace ocupa exatamente um dos cinco estados de movimento a cada quadro:

| Estado | Identidade | Visual |
|-------|----------|--------|
| **Alignment** | Neutro, estável, calmo | Ciano básico, brilho mínimo |
| **Commitment** | Aceleração decisiva | Tonalidade levemente para frente, borda quente |
| **Resistance** | Inclinação de contra-força | Borda com tonalidade âmbar, brilho aumentado |
| **Correction** | Micro-ajustes | Brilho da borda, alta precisão |
| **Recovery** | Recuo breve | Descoloração (150ms) |

As transições são impostas por uma tabela de transição em tempo de compilação. As transições proibidas retornam nulo.

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

Consulte [`docs/motion-state-machine.md`](docs/motion-state-machine.md) para a FSM completa com condições de entrada/saída.

---

## Arquétipos do Caos (5 Vilões)

| Arquétipo | Verbo | Contra-Habilidade | Comportamento |
|-----------|------|---------------|----------|
| **Red Orbs** | Interromper | Antecipação | Desvio dentro da região, pulo nas bordas |
| **Crushers** | Restringir | Comprometimento | Ciclo fixo: inativo → sinalização → ativo |
| **Drift Fields** | Desestabilizar | Estabilidade da pegada | Força direcional constante |
| **Flickers** | Enganar | Filtragem | Flash → imagem residual → invisível |
| **Locks** | Limitar | Adaptabilidade | Restrições de eixo/velocidade com sinalização |

O Caos nunca reage ao Trace. O Caos é determinístico, indiferente, mecânico.

Consulte [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) e [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md).

---

## Renderização

A renderização do Trace é uma função pura do estado. Sem linhas de tempo de animação, sem folhas de sprites.

```
VisualState = RenderProfile[MotionState]
```

A cor, dependendo do estado, controla tudo: preenchimento, borda, intensidade do brilho, viés direcional, descoloração. O renderizador expressa a identidade do Trace com zero recursos de animação.

Consulte [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) e [`docs/visual-style-guide.md`](docs/visual-style-guide.md).

---

## Origem do Motor

Derivado de [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Sistemas principais:

- `IGameSimulation` — interface de modo de jogo plugável (2 métodos)
- `DeterministicLoop` — passo fixo de 60Hz + interpolação alfa
- `DeterministicRng` — xorshift32, reproduzível por semente
- Pipeline de `GameEvent` — fluxo de eventos tipados
- Sistema de replay — formato binário MTR v1, verificação FNV-1a
- Composição de mutadores — transformações de função pura `LevelBlueprint`
- Espaço de coordenadas virtual — 1920x1080, escala letterbox

---

## Estrutura do Projeto

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

## Diretrizes de Design

| Documento | Propósito |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | O que o Trace é, o que não é, para quem é |
| [`tone-bible.md`](docs/tone-bible.md) | Regras de tom de voz, UI, animação e feedback |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | Gramática de movimento, linguagem de caminho, respostas de força |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | FSM de 5 estados com transições e caminhos proibidos |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | Forma de rastreamento, cores por estado, identidade mundial. |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | Perfil de renderização, vetor de força, escalar de estabilidade, brilho/viés/desaturação. |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 arquétipos, 5 habilidades, contrato de consistência. |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | Especificações de movimento e animação por arquétipo. |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | Máquinas de estados (FSM) por arquétipo (enumeração + transições prontas). |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | Perfil de renderização "Chaos", especificações de desenho por arquétipo. |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | Contrato de interação entre "Trace" e "Chaos". |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | Metafísica do áudio, identidade sonora de "Trace/Chaos", maestria = silêncio. |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | Simulação → conexão de parâmetros de áudio. |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | Componentes de processamento de sinal (DSP), fluxo de dados, barramento principal. |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | Guia sensorial da identidade sonora do mundo. |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **Cânone de áudio unificado (consolida todos os 4 documentos de áudio).** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | Primeiro protótipo de vilão (DriftDelivery_B1). |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | Gráfico de dependências + regras constitucionais. |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | Trecho de conexão de recursos da plataforma. |

---

## Construção e Teste

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## Princípios de Design Chave

- **O determinismo é constitucional.** A mesma semente → mesma simulação → mesma pontuação, sempre. Sem `DateTime.Now`, sem `Random`, sem números de ponto flutuante dependentes da plataforma no caminho crítico.
- **A renderização é uma função pura do estado.** Sem linhas de tempo de animação. MotionState + Vetor de Força + Escalar de Estabilidade → saída visual.
- **O "Chaos" é indiferente.** Os obstáculos nunca reagem ao jogador. Eles são sistemas, não inimigos.
- **A maestria aparenta calma.** Se a jogabilidade de alto nível parece frenética, o sistema está enganando.
- **Monolito modular.** Quatro assemblies com dependências de mão única impostas. O domínio é a folha; MauiHost é a única raiz de composição.
- **Avisos são erros.** Projetos de biblioteca usam `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Licença

[MIT](LICENSE)

> Criado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
