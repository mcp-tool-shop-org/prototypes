<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# MouseTrainer

> [MCP Tool Shop](https://mcptoolshop.com) の一部

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**決定論的なマウス操作練習ツール -- 精度、コントロール、そしてスムーズな操作を実現します。**

.NET 10 MAUI (Windows 向け) をベースに構築されており、完全に決定論的な固定タイムステップシミュレーション、組み合わせ可能なブループリント・ミューテーター、およびプラットフォームに依存しない実行IDを備えています。 同じシード値を使用すると、同じレベル、同じスコア、そして同じリプレイ結果が得られます。

---

## MouseTrainer の利点

- **完全に決定論的。** xorshift32 RNG、FNV-1a 64ビットハッシュ、固定60Hzタイムステップ（アキュムレーター付き）。 `DateTime.Now`、`System.Random`、ホットパスにおけるプラットフォーム依存の浮動小数点数を使用していません。
- **組み合わせ可能な難易度調整。** 6つのブループリント・ミューテーターが、ゲーム開始前に生成されたレベルを変化させます。 これらを組み合わせてパラメータを調整することで、完璧な再現性を実現する `RunId` ハッシュに固定されます。
- **リプレイ検証。** 各セッションでは、量子化された入力サンプルが記録され、コンパクトなバイナリ形式（`.mtr`）でシリアライズされます。 リプレイ検証では、ティックごとのシミュレーションを再実行し、イベントストリームのハッシュ、スコア、コンボを元のデータと比較します。
- **モジュール化された単一のアプリケーション。** 依存関係が一方向になるように設計された4つのアセンブリで構成されています。 ドメインは依存関係のない最下位レベルであり、MauiHost は唯一の構成ルートです。 サイクルや、ライブラリへのプラットフォーム依存はありません。
- **プロトコルレベルのID。** `RunId` は、モード + シード + 難易度 + ミューテーター仕様の FNV-1a 64ビットハッシュであり、パラメータは常に正順にソートされます。 作成後は、永久に固定されます。

---

## NuGet パッケージ

| パッケージ | 説明 |
|---|---|
| **MouseTrainer.Domain** | 決定論的な xorshift32 RNG、FNV-1a 64ビットハッシュ、LEB128 可変長エンコード、ゲームイベントシステム、および実行IDの基本機能。 依存関係はありません。 |
| **MouseTrainer.Simulation** | 固定60Hzの決定論的なゲームループ（アキュムレーター付き）、組み合わせ可能なブループリント・ミューテーター、レベル生成パイプライン、リプレイの記録/検証、およびセッション管理。 ドメインに依存します。 |
| **MouseTrainer.Audio** | イベント駆動型のオーディオキューシステム。 xorshift32 を使用した決定論的な音量/ピッチの変動、レート制限、アセットマニフェストの検証、およびワンショットまたはループ再生に対応。 ドメインに依存します。 |

---

## インストール

### NuGet から

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### ソースコードから

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

**注意:** MAUI ホストプロジェクトは、.NET MAUI ワークロードがインストールされた Visual Studio が必要です。 CLI の `dotnet build` コマンドは、MauiHost で MrtCore PRI 生成ターゲットが原因で失敗する場合があります。 完全なビルドには Visual Studio を使用してください。

---

## クイックスタート

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

## ゲームモード

### ReflexGates

サイドスクロール型のゲートチャレンジ。 垂直壁に配置された発光するゲートを、スクロール速度に負けないように通過します。 決定論的なシード値を使用すると、常に同じレベルが生成されます。

| プロパティ | Value |
|---|---|
| プレイフィールド | 1920 x 1080 ピクセル（仮想） |
| ゲート数 | 12 (デフォルト) |
| スクロール速度 | 70 px/s (クリアタイム約 83 秒) |
| スコアリング | 中心：100点、端：50点。 3つのゲートごとにコンボが発生。 |
| 発光 | 各ゲートごとに、振幅（40～350 px）と周波数（0.15～1.2 Hz）がランダムに変化。 |
| RNG | xorshift32 を使用して、プラットフォームに依存しないレベル生成を実現。 |
| ID | モード + シード + ミューテーターの FNV-1a 64ビットハッシュ。 同じ `RunId` が常に生成されます。 |

---

## ブループリント・ミューテーター

ゲーム開始前に生成されたレベルを変化させる、組み合わせ可能な6つの変換。 `LevelBlueprint` に対して、順序付けられた方法で適用されます。

| ミューテーター | 主要パラメータ | 効果 |
|---|---|---|
| **NarrowMargin** | `factor` (0.1～1.0) | 発光口の高さが縮小し、より狭い間隔になります。 |
| **WideMargin** | `factor` (1.0～3.0) | 発光口の高さが拡大し、より寛容な間隔になります。 |
| **DifficultyCurve** | `curve` の値を [-2.0, 2.0] の範囲で設定 | ゲートインデックスによる難易度曲線の再補間 |
| **RhythmLock** | `div` の値を {2, 3, 4, 6, 8} のいずれか | ゲートフェーズを N 個の分割に量子化し、リズムパターンを生成 |
| **GateJitter** | `str` の値を [0, 1] の範囲で設定 | `sin(WallX, Phase)` による決定論的な垂直オフセット -- 空間的な摂動 |
| **SegmentBias** | `seg`, `amt`, `shape` | ゲートをアクに分割し、セグメントごとの難易度バイアスを適用 |

ミューテータは純粋な関数です: `LevelBlueprint -> LevelBlueprint`。これらはパイプライン (`specs.Aggregate`) を介して結合され、`MutatorRegistry` から解決され、パラメータは再現性のために `RunId` ハッシュに固定されます。

### セグメントバイアス形状

- **Crescendo** (shape=0): 序盤は簡単、終盤は難しい。 `d = 2t - 1`
- **Valley** (shape=1): 中盤は難しい、序盤と終盤は簡単。 `d = 8t(1-t) - 1`
- **Wave** (shape=2): 簡単と難しいのセグメントが交互に繰り返される。 `d = (-1)^k`

### 難易度曲線指数

`curve` パラメータは、`pow(2, curve)` を介してべき乗指数にマッピングされます。正の値は難易度を後方にシフトさせ（序盤は簡単、終盤は難しい）、負の値は難易度を前方にシフトさせます。ゼロは変化なし（恒等関数）です。

---

## リプレイシステム

すべてのセッションは記録され、不正行為の防止とリーダーボードの整合性を検証するために使用されます。

| コンポーネント | Role |
|---|---|
| `ReplayRecorder` | ライブプレイ中に、ティックごとの量子化された入力サンプルをキャプチャします。 |
| `InputTrace` | コンパクトなストレージのための、長さ指定付きの入力ストリーム。 |
| `ReplaySerializer` | バイナリ `.mtr` 形式: マジックヘッダー、LEB128 可変長整数、FNV-1a チェックサム |
| `ReplayVerifier` | ティックごとに再シミュレーションを行い、イベントハッシュ、スコア、コンボの一致を検証します。 |
| `EventStreamHasher` | シミュレーションイベントストリームに対するローリング FNV-1a ハッシュ。 |

ワイヤ形式: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## オーディオシステム

イベント駆動型のオーディオで、決定論的なキュー選択を行います。`AudioDirector` は、シミュレーションイベントを、バウンデッドなバリエーションを持つサウンドエフェクトにマッピングします。すべて `DeterministicRng.Mix()` を介して決定論的に行われます。

| 機能 | 詳細 |
|---|---|
| キュー選択 | イベントタイプごとに、候補アセットの中から決定論的に選択 |
| 音量 | `0.6 + 0.4 * intensity`。 [0, 1] の範囲にクリップされます。 |
| ピッチの揺らぎ | xorshift32 を使用して [0.97, 1.03] の範囲で生成され、[0.9, 1.1] の範囲にクリップされます。 |
| レート制限 | `HitWall` イベントは、6ティックごとに1回に制限されます（60 Hz の場合、約 100 ms）。 |
| 再生モード | ワンショット（ヒット、ゲート、コンボ）とループ（ドラッグ、アンビエント） |
| アセットの検証 | `AssetVerifier` は、起動時に必要な 13 個のオーディオファイルをすべてチェックします。 |

---

## アーキテクチャ

4つのモジュールで構成されたモノリス。サイクルがなく、プラットフォーム依存の要素がライブラリに漏洩することはありません。

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### 禁止事項（憲法）

- `Audio` は `Simulation` を参照してはなりません。
- `Simulation` は `Audio` を参照してはなりません。
- `Domain` は、どの兄弟モジュールも参照してはなりません。
- どのライブラリモジュールも `Microsoft.Maui.*` またはプラットフォーム SDK を参照してはなりません。
- どのモードも、別のモードを参照してはなりません。
- ミューテータは `LevelBlueprint` のみで動作し、モードの内部構造には影響を与えません。

完全な依存関係グラフと憲法規則については、[`docs/modular.manifesto.md`](docs/modular.manifesto.md) を参照してください。

---

## 設計原則

- **決定論的動作:** 同じ初期値からは、常に同じシミュレーション結果とスコアが得られます。`DateTime.Now`、`Random`、およびホットパスにおけるプラットフォーム依存の浮動小数点数は使用しません。
- **固定タイムステップによるシミュレーション:** 60Hzで、アキュムレータベースの追従機構を使用します。レンダリングは、ティック間の補間をアルファ値に基づいて行います。シミュレーション時間は、ティック数(`tick * dt`)から計算され、壁時計からの影響を避けることで浮動小数点数のずれを防ぎます。
- **プロトコルレベルの識別子:** `MutatorId`、`ModeId`、`RunId`は永続的であり、一度作成されると変更されることはありません。FNV-1aハッシュと、標準的なパラメータシリアライゼーションにより、同じ入力からは常に同じ識別子が生成されます。
- **モジュール化された単一の構成要素（モノリス）、マイクロサービスではありません。** 依存関係が一方向になるように強制された、4つのアセンブリで構成されています。ドメインが最も下位レベルであり、MauiHostが唯一の構成の起点です。
- **警告はエラーとして扱われます。** ライブラリプロジェクトでは、`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`が使用されます。MAUIホストは、SDKによって生成される警告を除き、この設定を無効にしています。すべての場所で、ヌル許容参照型が有効になっています。
- **ミューテーターの純粋性:** ブループリントミューテーターは、純粋な関数であり、乱数生成機能へのアクセス、副作用、およびモード固有の型への参照はありません。これらは、パラメータと入力ブループリントのみを読み込みます。

---

## プロジェクト構造

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

## ライセンス

[MIT](LICENSE)
