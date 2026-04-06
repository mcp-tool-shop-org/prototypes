<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

.NET 10 MAUI (Windowsを優先)上に構築され、完全に決定論的な固定タイムステップによるシミュレーション、5つの状態を持つモーションステートマシン、そしてシミュレーションの状態によって完全に制御されるパラメータ化された視覚表現を備えています。

Traceは、エイム練習ツールではありません。Traceは、アーケードゲームでもありません。使いこなせるようになるには、落ち着きが必要です。

---

## アーキテクチャ

4つのモジュールで構成されたモノリス。サイクルがなく、ライブラリへのプラットフォーム依存もありません。

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

依存関係グラフと設計原則については、[`docs/modular.manifesto.md`](docs/modular.manifesto.md) を参照してください。

---

## モーションステートマシン

Traceは、毎フレームで常に5つのモーション状態のいずれかに存在します。

| 状態 | アイデンティティ | 視覚表現 |
|-------|----------|--------|
| **Alignment** | ニュートラル、安定、落ち着いた状態 | ベースカラーはシアン、最小限の輝き |
| **Commitment** | 決定的な加速 | わずかな前向きの色合い、暖かいエッジ |
| **Resistance** | カウンターフォースによる傾き | 琥珀色に変化したエッジ、輝度の増加 |
| **Correction** | 微調整 | エッジの明るさの変化、高精度 |
| **Recovery** | 短い反動 | 彩度の低下（150ms） |

状態遷移は、コンパイル時に定義された遷移テーブルによって強制されます。禁止された遷移はnullを返します。

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

完全なFSM（エントリ/エグジット条件付き）については、[`docs/motion-state-machine.md`](docs/motion-state-machine.md) を参照してください。

---

## カオスアーキタイプ（5つの敵）

| アーキタイプ | 動詞 | カウンタースキル | 行動 |
|-----------|------|---------------|----------|
| **Red Orbs** | 妨害 | 予測 | 領域内でのドリフト、境界での跳ね返り |
| **Crushers** | 制限 | コミットメント | 固定サイクル：非アクティブ → 予告 → アクティブ |
| **Drift Fields** | 不安定化 | グリップの安定性 | 一定方向への力 |
| **Flickers** | 欺瞞 | フィルタリング | 点滅 → アフターイメージ → 透明 |
| **Locks** | 制限 | 適応性 | 軸/速度の制約と予告 |

カオスは、Traceに一切反応しません。カオスは、決定論的で、無関心で、機械的です。

[`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) および [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) を参照してください。

---

## レンダリング

Traceのレンダリングは、状態に依存する純粋な関数です。アニメーションタイムラインやスプライトシートはありません。

```
VisualState = RenderProfile[MotionState]
```

色（状態依存）がすべてを決定します。塗りつぶし、エッジ、輝度、方向性、彩度などです。レンダラーは、アニメーションアセットを一切使用せずに、Traceのアイデンティティを表現します。

[`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) および [`docs/visual-style-guide.md`](docs/visual-style-guide.md) を参照してください。

---

## エンジンベース

[DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine) から派生。主要なシステム：

- `IGameSimulation` — プラガブルなゲームモードインターフェース（2つのメソッド）
- `DeterministicLoop` — 60Hzの固定タイムステップ + アルファ補間
- `DeterministicRng` — xorshift32、シード再現可能
- `GameEvent` パイプライン — 型付きイベントストリーム
- リプレイシステム — MTR v1 バイナリ形式、FNV-1a 検証
- ミューテータの組み合わせ — `LevelBlueprint` による純粋関数変換
- 仮想座標空間 — 1920×1080、レターボックスによるスケーリング

---

## プロジェクト構造

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

## 設計原則

| ドキュメント | 目的 |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | Traceとは何か、何ではないのか、誰のためのものか |
| [`tone-bible.md`](docs/tone-bible.md) | ボイス、UI、アニメーション、フィードバックのトーンに関するルール |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | 動きの文法、パス言語、力の応答 |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | 5つの状態を持つFSM、遷移、禁止されたパス |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | トレース形式、状態ごとのカラー設定、ワールドのアイデンティティ |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | レンダープロファイル、フォースベクトル、安定性スカラー、グロー/バイアス/彩度 |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5つのアーキタイプ、5つのスキル、一貫性契約 |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | アーキタイプごとのモーションとアニメーション仕様 |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | アーキタイプごとの有限状態機械 (FSM) (enumと遷移対応) |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | カオスレンダープロファイル、アーキタイプごとの描画仕様 |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | トレースとカオスの相互作用契約 |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | オーディオの哲学、トレース/カオスのサウンドアイデンティティ、習熟＝静寂 |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | シミュレーション → オーディオパラメータの接続 |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | DSPコンポーネント、データフロー、マスターバス |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | 世界のサウンドアイデンティティに関する感覚ガイド |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **統合されたオーディオ規定 (すべての4つのオーディオドキュメントを統合)** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | 最初の敵キャラクターの実装 (DriftDelivery_B1) |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | 依存関係グラフ + 基本ルール |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | プラットフォームアセットの接続に関するサンプルコード |

---

## ビルドとテスト

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## 主要な設計原則

- **決定論は基本原則です。** 同じシード値 → 同じシミュレーション → 同じスコア、常に。 `DateTime.Now`、`Random`、ホットパスにおけるプラットフォーム依存の浮動小数点数は使用しません。
- **レンダリングは状態の純粋な関数です。** アニメーションタイムラインはありません。 MotionState + ForceVector + StabilityScalar → ビジュアル出力。
- **カオスは無関心です。** 障害物はプレイヤーに反応しません。 それらはシステムであり、敵ではありません。
- **習熟は冷静さを表します。** 高度なプレイスタイルが見た目が慌ただしい場合、システムに問題があります。
- **モジュール化されたモノリス。** 一方向の依存関係が強制された4つのアセンブリ。 ドメインが葉であり、MauiHostが唯一のコンポジションルートです。
- **警告はエラーです。** ライブラリプロジェクトでは、`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` が使用されます。

---

## ライセンス

[MIT](LICENSE)

[MCP Tool Shop](https://mcp-tool-shop.github.io/) によって作成されました。
