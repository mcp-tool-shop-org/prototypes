<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

基于 .NET 10 MAUI（Windows 优先），采用完全确定的固定时间步长模拟，具有五种运动状态的有限状态机，以及完全由模拟状态驱动的参数化视觉效果。

Trace 不是一个瞄准训练工具。Trace 不是一个街机游戏。精通是一种平静的状态。

---

## 架构

四模块的模块化单体结构。没有循环依赖，没有平台相关代码泄漏到库中。

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

请参阅 [`docs/modular.manifesto.md`](docs/modular.manifesto.md) 以获取完整的依赖关系图和宪法规则。

---

## 运动状态机

Trace 在每一帧中，会精确地处于五种运动状态中的一种：

| 状态 | 外观 | 视觉效果 |
|-------|----------|--------|
| **Alignment** | 中立、稳定、平静 | 默认青色，微弱的光晕 |
| **Commitment** | 明显的加速 | 轻微的向前色调，温暖的边缘 |
| **Resistance** | 反向倾斜 | 偏琥珀色的边缘，增强的光晕 |
| **Correction** | 微调 | 边缘提亮，高精度 |
| **Recovery** | 短暂的后坐力 | 颜色饱和度降低（150 毫秒） |

状态转换由编译时转换表强制执行。禁止的转换会返回 null。

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

请参阅 [`docs/motion-state-machine.md`](docs/motion-state-machine.md) 以获取完整的有限状态机，包括进入/退出条件。

---

## 混沌原型（5 个反派）

| 原型 | 动词 | 反技能 | 行为 |
|-----------|------|---------------|----------|
| **Red Orbs** | 扰乱 | 预判 | 在区域内漂移，到达边界时反弹 |
| **Crushers** | 限制 | 承诺 | 固定循环：非活动 → 预示 → 激活 |
| **Drift Fields** | 破坏 | 握持稳定性 | 恒定的方向力 |
| **Flickers** | 欺骗 | 过滤 | 闪烁 → 残影 → 隐形 |
| **Locks** | 约束 | 适应性 | 轴向/速度约束，带有预示 |

混沌永远不会对 Trace 做出反应。混沌是确定的、漠不关心的、机械的。

请参阅 [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) 和 [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md)。

---

## 渲染

Trace 的渲染完全取决于状态。没有动画时间线，也没有精灵图。

```
VisualState = RenderProfile[MotionState]
```

颜色由状态驱动，控制所有内容：填充、边缘、光晕强度、方向偏差、颜色饱和度。渲染器通过零动画资源来表达 Trace 的外观。

请参阅 [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) 和 [`docs/visual-style-guide.md`](docs/visual-style-guide.md)。

---

## 引擎基础

从 [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine) 派生。核心系统：

- `IGameSimulation` — 可插拔的游戏模式接口（2 个方法）
- `DeterministicLoop` — 60Hz 的固定时间步长 + α 插值
- `DeterministicRng` — xorshift32，可重现的种子
- `GameEvent` 流水线 — 具有类型信息的事件流
- 录像系统 — MTR v1 二进制格式，FNV-1a 验证
- 变异组合 — `LevelBlueprint` 纯函数转换
- 虚拟坐标空间 — 1920×1080，带边框的缩放

---

## 项目结构

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

## 设计规范

| 文档 | 目的 |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | Trace 是什么，不是什么，以及它是为谁设计的 |
| [`tone-bible.md`](docs/tone-bible.md) | 语音、UI、动画和反馈音调规则 |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | 运动语法、路径语言、力响应 |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | 五种状态的有限状态机，包括转换和禁止路径 |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | 痕迹效果，按状态着色的颜色，世界身份 |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | 渲染配置文件，力向量，稳定性标量，发光/偏色/饱和度 |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5种原型，5种技能，一致性协议 |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | 每个原型的运动和动画规范 |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | 每个原型的有限状态机（包含枚举和状态转换） |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | 混沌渲染配置文件，每个原型的绘制规范 |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | 痕迹与混沌的交互协议 |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | 音频元物理学，痕迹/混沌的音效身份，精通 = 沉默 |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | 模拟 → 音频参数连接 |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | 数字信号处理组件，数据流，主总线 |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | 感官指南，用于理解世界的音效 |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **统一音频规范（整合所有4个音频文档）** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | 第一个反派原型（DriftDelivery_B1） |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | 依赖关系图 + 宪法规则 |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | 平台资源连接示例 |

---

## 构建与测试

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## 核心设计原则

- **确定性是宪法。** 相同的种子 → 相同的模拟 → 相同的得分，始终如一。 不使用 `DateTime.Now`，不使用 `Random`，在关键路径中不使用平台相关的浮点数。
- **渲染是状态的纯函数。** 没有动画时间线。 运动状态 + 力向量 + 稳定性标量 → 视觉输出。
- **混沌是中立的。** 障碍物永远不会对玩家做出反应。 它们是系统，而不是敌人。
- **精通看起来平静。** 如果高水平的玩法看起来很疯狂，那么系统就是在说谎。
- **模块化整体。** 四个程序集，强制单向依赖关系。 领域是叶节点；MauiHost 是唯一的组合根。
- **警告是错误。** 库项目使用 `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`。

---

## 许可证

[MIT](LICENSE)

> 由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建
