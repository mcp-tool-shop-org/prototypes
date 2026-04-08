<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>管理された、二重検証による、決定論的なレジスタで、再現可能な履歴を持ち、オプションで外部の認証機能があります。</strong></p>

---

## Registrumとは何か

Registrumは、**構造化されたレジスタ**です。これは、明示的な制約のもとで状態遷移を記録、検証、順序付けるライブラリであり、構造が解釈可能な状態を維持できるように設計されています。

| 特性 | 意味 |
|----------|---------|
| **Structural** | 意味ではなく、形式に基づいて動作 |
| **Deterministic** | 同じ入力 → 同じ出力、常に |
| **Fail-closed** | 無効な入力は、部分的な復旧ではなく、致命的なエラーを引き起こす |
| **Replayable** | 過去の決定は、完全に同じ結果で再実行可能 |
| **Non-agentic** | 決して、判断したり、最適化したりしない |

**Registrumは、変化が常に理解可能な状態を維持することを保証します。**

---

## なぜRegistrumなのか？

システムは進化し、エントロピーが増加し、構造は劣化します。

多くのツールは、これに対応するために、インテリジェンス（最適化、エージェント、自己修復機能など）を追加します。Registrumは、その逆のアプローチを取り、**制約を追加します。**

- **ライブラリ開発者向け**：状態管理に構造的な保証を組み込み、ユーザーは追加の労力なしに、その可読性を享受できます。
- **監査が重要なシステム向け**：すべての状態遷移は、決定論的で、再現可能であり、独立して検証可能です。
- **複雑さを避けたいチーム向け**：Registrumは、無効な遷移を構造化されたエラーメッセージで拒否し、静かに問題を隠蔽することはありません。

その結果、システム内のID、履歴、順序が、変更の回数に関わらず、常に確認可能です。

---

## 基本原則

> **エントロピーは許容されます。しかし、不可解性は許されません。**

Registrumは、全体としてエントロピーを減少させるものではありません。
代わりに、エントロピーが存在できる場所を制限し、ID、履歴、構造が時間とともに確認可能な状態を維持します。

---

## Registrumではないもの

Registrumは、明示的に以下のものではありません。

- 最適化ツール、エージェント、または意思決定ツール
- コントローラー、レコメンダー、またはインテリジェンス
- 適応型、学習型、または自己修復機能

Registrumは、*何が重要か*という問いに答えることはありません。
Registrumは、その問いが常に答えられる状態を維持するだけです。

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Registrumの動作原理

### 構造化レジスタ

レジスタは、唯一の権限を持つ機関です。

- すべての状態遷移を、**11の構造的な不変条件**に対して検証します。
- ID、履歴、順序に関する制約を適用します。
- 決定論性と追跡可能性を保証します。
- 問題を解決せずに、違反を検出し、エラーを通知します（fail-closed）。

すべてのデータは、このレジスタを経由します。迂回することはできません。

### 11の不変条件

| クラス | カウント | 目的 |
|-------|-------|---------|
| **Identity** | 3 | 一意、不変、コンテンツベースのアドレス |
| **Lineage** | 4 | 有効な親子関係、非循環、追跡可能 |
| **Ordering** | 4 | 単調増加、ギャップなし、決定論的 |

これらの不変条件は、憲法に定められています。変更には、正式な承認が必要です。

---

## 二重の憲法上の検証機関

Registrumは、**2つの独立した不変条件検証エンジン**を維持しています。

| 検証機関 | 役割 | 実装 |
|---------|------|----------------|
| **Registry** | 主要な検証機関 | コンパイルされたDSL (RPEG v1) |
| **Legacy** | 二次的な検証機関 | TypeScriptによる述語 |

Phase H以降、**レジストリがデフォルトの主要な検証機関**となっています。
従来のシステムは、独立した二次的な検証機関として残っています。

### なぜ二重の検証機関なのか？

- **合意が必要**：遷移が有効であるためには、両方の機関が合意する必要があります。
- **意見の不一致は停止**：検証機関間の不一致が発生すると、システムは停止します（fail-closed）。
- **独立性は意図的**：どちらの機関も、もう一方を上書きすることはできません。

これは技術的な負債ではなく、安全性と可読性を高めるための機能です。
デュアルモードは現状維持です。どちらの機能も削除する予定はありません。

### Parity Evidence

274個のテストで、動作の同等性が証明されています。
- すべての不変クラスにおける58個のパリティテスト
- 12個の永続性パリティテスト（時間的な安定性）
- リプレイパリティ：ライブ実行 ≡ リプレイ実行

---

## 履歴、リプレイ、監査可能性

| 機能 | 説明 |
|------------|-------------|
| **Snapshot** | バージョン管理されたスキーマ (`RegistrarSnapshotV1`)、コンテンツアドレス指定ハッシュ、決定論的なシリアライゼーション |
| **Replay** | 新しいレジストラーに対してのみ読み取り専用で再実行を行うことで、時間的な決定論が証明されます。 |
| **Audit** | 構造的な判断はすべて再現可能であり、コンテキストに依存せず、スナップショットを持つすべての関係者が検証できます。 |

---

## 外部認証（オプション）

Registrumは、必要に応じて、公開された検証のために、外部の不変の台帳（例えばXRPL）に暗号化された認証情報を送信することができます。

| 特性 | 価値 |
|----------|-------|
| デフォルト | 無効 |
| 権限 | 権限なし（検証のみ） |
| 動作への影響 | なし |

認証情報は、Registrumがどのような決定を下したかを記録します。
Registrumは、何が有効かを決定します。

**権限は内向きに、検証は外向きに機能します。**

参照先：
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — 理由
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — 仕様

---

## はじめに

### インストール

```bash
npm install @mcp-tool-shop/registrum
```

### クイックスタート

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### モード

| モード | エンジン | 使用場面 |
|------|--------|-------------|
| `"legacy"` | TypeScriptによる述語 | 迅速なプロトタイピング、外部依存関係なし |
| `"registry"` (デフォルト) | コンパイルされたRPEG v1 DSL | 完全なデュアル検証機能を使用した本番環境での利用 |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### 実行例

[`examples/`](examples/)ディレクトリには、説明的なデモンストレーションが含まれています（安定したAPIではありません）。
これらは[`tsx`](https://github.com/esbuild-kit/tsx)が必要です。

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## APIクイックリファレンス

### 主要なエクスポート

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| メソッド | 戻り値 | 説明 |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | 状態遷移を検証し、記録します。 |
| `getState(id)` | `State \` | 未定義 | 登録された状態をIDで取得します。 |
| `getHistory()` | `Transition[]` | 受け入れられた遷移の完全な順序付き履歴 |
| `snapshot()` | `RegistrarSnapshotV1` | 決定論的な、コンテンツアドレス指定されたスナップショット |

---

## ガバナンス

Registrumは、**憲法モデル**に基づいて管理されます。

| 原則 | 意味 |
|-----------|---------|
| 動作の保証 > 機能の速度 | 正確性が最優先 |
| 証拠に基づく変更のみ | 証拠なしでの変更は認められない |
| 正式なプロセスが必要 | 提案、成果物、決定 |

### 現在の状況

- **フェーズH**: 完了 (レジストリのデフォルト、認証機能有効)
- **ガバナンス**: 実施中
- **すべての変更**: 正式なガバナンスプロセスが必要

今後のすべての変更は、エンジニアリングタスクではなく、ガバナンスの決定事項となります。

参照先：
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — ガバナンスの存在理由
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — ガバナンスの対象
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — ガバナンスへの移行

---

## プロジェクトの状況

**Registrumは、安定した最終状態に達しています。**

| フェーズ | 状況 | 証拠 |
|-------|--------|----------|
| A–C | 完了 | コアレジストラー、パリティハネス |
| E | 完了 | 永続性、リプレイ、時間的な安定性 |
| G | 完了 | ガバナンスフレームワーク |
| H | 完了 | デフォルト設定、アテステーション機能有効 |

**テストカバレッジ**: 14のテストスイートで、279件のテストが合格

開発は、運用段階へと移行しました。今後の変更には、ガバナンスが必要です。

詳細については、[`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md) を参照してください。

---

## ドキュメント

| ドキュメント | 目的 |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | ID定義 |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | 証拠に基づく正式な主張 |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | 完全な不変条件リファレンス |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | 致命的なエラー条件 |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | 時間的な保証 |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | デュアルウィットネスアーキテクチャのチュートリアル |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | スナップショット形式（構成） |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | デュアルウィットネスポリシー |

---

## 設計思想

- **権力に対する抑制**
- **パフォーマンスよりも可読性**
- **ヒューリスティクスよりも制約**
- **介入よりも検査**
- **無限の拡張よりも停止**

Registrumが成功するのは、退屈で、信頼でき、そして予測可能になる時です。

---

## セキュリティとデータ範囲

| 側面 | 詳細 |
|--------|--------|
| **Data touched** | メモリ内での状態遷移、オプションでローカルファイルシステムへのJSONスナップショット |
| **Data NOT touched** | ネットワークリクエストなし、外部APIなし、データベースなし、ユーザー認証情報なし |
| **Permissions** | 永続化を使用する場合、ユーザーが指定したスナップショットパスへのみ読み書き可能 |
| **Network** | なし。完全にオフラインのライブラリ（XRPLのアテステーション機能はデフォルトで無効） |
| **Telemetry** | 収集も送信も行いません。 |

脆弱性報告については、[SECURITY.md](SECURITY.md) を参照してください。

---

## 貢献

Registrumは、ガバナンスを重視した貢献モデルを採用しています。すべての変更には、証拠に基づく正式な提案が必要です。

詳細な貢献に関する哲学とプロセスについては、[CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

---

## 評価基準

| カテゴリ | 評価 |
|----------|-------|
| A. セキュリティ | 10 |
| B. エラー処理 | 10 |
| C. 運用者向けドキュメント | 10 |
| D. リリースの品質 | 10 |
| E. ID（ソフト） | 10 |
| **Overall** | **50/50** |

> 詳細な監査：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が作成しました。
