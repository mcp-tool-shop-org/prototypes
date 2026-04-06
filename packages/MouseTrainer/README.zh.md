<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# MouseTrainer

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**确定性的鼠标操控训练工具，精确、可控、流畅。**

基于 .NET 10 MAUI 构建（Windows 优先），采用完全确定的固定时间步长模拟，具有可组合的蓝图修改器，以及平台稳定的运行标识。相同的种子会生成相同的关卡、相同的得分和相同的重播——无论在哪里，每次都一样。

---

## 为什么选择 MouseTrainer？

- **完全确定性，精确到每一位。** 使用 xorshift32 随机数生成器，FNV-1a 64 位哈希，固定 60 Hz 的时间步长，并带有累加器。不使用 `DateTime.Now`，不使用 `System.Random`，在关键路径中不使用平台相关的浮点数。
- **可组合的难度。** 六个蓝图修改器在游戏开始前重塑生成的关卡。将它们堆叠起来，调整参数，并将组合结果冻结到 `RunId` 哈希中，以实现完美的重现性。
- **重播验证。** 每次游戏都会记录量化的输入样本，并以紧凑的二进制格式 (`.mtr`) 序列化。重播验证会逐帧地重新模拟，并检查事件流哈希、得分和连击，与原始数据进行比较。
- **模块化整体。** 包含四个程序集，强制单向依赖关系。核心模块没有依赖关系；MauiHost 是唯一的组合根。没有循环，没有平台相关的代码泄漏到库中。
- **协议级别的身份标识。** `RunId` 是一个 FNV-1a 64 位哈希值，基于模式 + 种子 + 难度 + 修改器规格，参数按规范排序。一旦创建，将永久冻结。

---

## NuGet 包

| 包 | 描述 |
|---|---|
| **MouseTrainer.Domain** | 确定性的 xorshift32 随机数生成器，FNV-1a 64 位哈希，LEB128 变长编码，游戏事件系统，以及运行标识的基本组件。没有依赖关系。 |
| **MouseTrainer.Simulation** | 具有累加器的固定 60 Hz 确定性游戏循环，可组合的蓝图修改器，关卡生成流水线，重播记录/验证，以及会话管理。依赖于核心模块。 |
| **MouseTrainer.Audio** | 基于事件驱动的音频提示系统，通过 xorshift32 实现确定性的音量/音调抖动，具有速率限制，资源清单验证，以及单次播放或循环播放功能。依赖于核心模块。 |

---

## 安装

### 从 NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### 从源代码

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

> **注意：** MAUI 主项目需要安装 Visual Studio 及其 .NET MAUI 工作负载。 CLI `dotnet build` 可能会在 MauiHost 上由于 MrtCore PRI 生成目标而失败，请使用 Visual Studio 进行完整的构建。

---

## 快速开始

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

## 游戏模式

### ReflexGates

横向滚动关卡挑战。垂直墙壁上存在振荡的开口——在滚动将你吞噬之前，将光标穿过每个开口。确定性的种子会生成完全相同的关卡。

| 属性 | Value |
|---|---|
| 游戏区域 | 1920 x 1080 像素 |
| 开口数量 | 12 (默认) |
| 滚动速度 | 70 像素/秒 (约 83 秒完成一次) |
| 计分 | 100 分 (中心) 到 50 分 (边缘)，每通过 3 个开口获得连击 |
| 振荡 | 每个开口的振幅范围 (40--350 像素) 和频率范围 (0.15--1.2 Hz) |
| RNG | xorshift32 种子在每次运行中生成，以实现平台稳定的生成 |
| 标识 | 模式 + 种子 + 修改器的 FNV-1a 64 位哈希 = 相同的 `RunId`，无论在哪里 |

---

## 蓝图修改器

六个可组合的转换器，用于在游戏开始前重塑生成的关卡。按顺序应用于 `LevelBlueprint`：

| 修改器 | 关键参数 | 效果 |
|---|---|---|
| **NarrowMargin** | `factor` 在 [0.1, 1.0] 范围内 | 缩小开口高度，使间隙更小 |
| **WideMargin** | `factor` 在 [1.0, 3.0] 范围内 | 扩大开口高度，使间隙更大 |
| **DifficultyCurve** | `curve` 在 [-2.0, 2.0] 范围内 | 通过关卡索引重新插值难度曲线 |
| **RhythmLock** | `div` 在 {2, 3, 4, 6, 8} 范围内 | 将关卡阶段量化为 N 个分段，形成有节奏的模式 |
| **GateJitter** | `str` 在 [0, 1] 范围内 | 通过 `sin(WallX, Phase)` 确定垂直偏移量，实现空间扰动 |
| **SegmentBias** | `seg`, `amt`, `shape` | 将关卡划分为具有分段难度偏差的片段 |

修改器是纯函数：`LevelBlueprint -> LevelBlueprint`。 它们通过流水线 (`specs.Aggregate`) 进行组合，从 `MutatorRegistry` 中解析，并且它们的参数被冻结到 `RunId` 哈希中，以确保可重复性。

### 分段偏差形状

- **Crescendo (渐强)** (shape=0): 容易开始，困难结束。 `d = 2t - 1`
- **Valley (山谷)** (shape=1): 困难的中间部分，容易的开头和结尾。 `d = 8t(1-t) - 1`
- **Wave (波浪)** (shape=2): 交替的容易/困难的片段。 `d = (-1)^k`

### 难度曲线指数

`curve` 参数通过 `pow(2, curve)` 映射到幂指数。 正值会使难度在后期增加（早期容易，后期困难）。 负值会使难度在早期增加。 零表示不变。

---

## 回放系统

每个会话都可以被记录和验证，以防止作弊并确保排行榜的完整性。

| 组件 | Role |
|---|---|
| `ReplayRecorder` | 在游戏过程中，每帧捕获量化的输入样本。 |
| `InputTrace` | 用于紧凑存储的变长编码输入流。 |
| `ReplaySerializer` | 二进制 `.mtr` 格式：魔术头，LEB128 变长整数，FNV-1a 校验和。 |
| `ReplayVerifier` | 逐帧重现；验证事件哈希 + 分数 + 连击匹配。 |
| `EventStreamHasher` | 对模拟事件流进行滚动 FNV-1a 哈希计算。 |

数据格式：`[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## 音频系统

基于事件驱动的音频，具有确定性的提示选择。 `AudioDirector` 将模拟事件映射到声音效果，具有可控的变化范围——所有声音效果都通过 `DeterministicRng.Mix()` 确定生成。

| 特性 | 细节 |
|---|---|
| 提示选择 | 在每种事件类型中，从候选资源中进行确定性选择。 |
| 音量 | `0.6 + 0.4 * intensity`，限制在 [0, 1] 范围内。 |
| 音高抖动 | [0.97, 1.03] 通过 xorshift32，限制在 [0.9, 1.1] 范围内。 |
| 速率限制 | `HitWall` 事件限制为每 6 帧触发一次（在 60 Hz 下约为 100 毫秒）。 |
| 播放模式 | 单次播放（命中、关卡、连击）和循环播放（拖动、环境音）。 |
| 资源验证 | `AssetVerifier` 在启动时检查所有 13 个必需的音频文件。 |

---

## 架构

四模块的模块化单体结构。 没有循环依赖，并且平台相关代码不会泄漏到库中。

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### 禁止引用（宪法）

- `Audio` 模块绝不能引用 `Simulation` 模块。
- `Simulation` 模块绝不能引用 `Audio` 模块。
- `Domain` 模块绝不能引用任何兄弟模块。
- 任何库模块都不能引用 `Microsoft.Maui.*` 或任何平台 SDK。
- 任何模式都不能相互引用。
- 修改器只能作用于 `LevelBlueprint`，而不能作用于模式的内部结构。

请参阅 [`docs/modular.manifesto.md`](docs/modular.manifesto.md) 以获取完整的依赖关系图和宪法规则。

---

## 设计原则

- **确定性是设计的基石。** 相同的初始条件会产生相同的模拟结果，从而得到相同的评分，始终如一。 不使用 `DateTime.Now`，也不使用 `Random`，以及在关键路径中不使用平台相关的浮点数。
- **固定时间步长模拟。** 采用 60Hz 的刷新率，并使用累加器进行追赶。 渲染通过 alpha 值在时间步长之间进行插值。 模拟时间是从时间步数 (`tick * dt`) 派生而来，而不是从系统时钟，以避免浮点数误差。
- **协议级别的身份标识。** `MutatorId`、`ModeId` 和 `RunId` 是永久性的——一旦创建，就永远不会改变。 使用 FNV-1a 哈希算法，并采用规范的参数序列化方式，以确保相同的输入始终产生相同的身份标识。
- **模块化的整体架构，而非微服务。** 包含四个组件，并强制执行单向依赖关系。 领域层是底层组件；`MauiHost` 是唯一的组合根。
- **警告视为错误。** 库项目使用 `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`。 MAUI 主程序选择不启用此选项（SDK 生成的警告）。 可空引用类型已在所有地方启用。
- **变异器的纯函数特性。** 蓝图变异器是纯函数，不访问随机数生成器，没有副作用，也不引用特定模式的类型。 它们只读取其参数和输入的蓝图。

---

## 项目结构

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

## 许可证

[MIT](LICENSE)
