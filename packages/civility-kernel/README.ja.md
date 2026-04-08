<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

エージェントの行動を、単に効率を最大化するだけでなく、**優先順位に基づいて制御する**ポリシーレイヤー。

エージェントは、複数の計画候補を生成します。カーネルが、次に何を行うかを決定します。

**生成 → フィルタリング（必須制約）→ スコアリング（重み）→ 選択 または 質問**

必須制約は、変更できません。柔軟な優先順位は、トレードオフをガイドします。不確実性が、「人に確認を求める」状況を引き起こす可能性があります。

---

## インストール

```bash
npm i @mcptoolshop/civility-kernel
```

## クイックスタート

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

カーネルは、制約、スコアリング関数、および意思決定エンジンを、1つの呼び出しで連携させます。I/Oバウンドな制約チェックには、`decideAsync()`を使用します。

## 人間の監視ループ

ポリシーが何をしているかは、常に確認できます。
エージェントは、変更を適用する前に、変更内容を表示する必要があります。
ロールバックが可能です。
何も、黙って更新されることはありません。

ポリシー契約のプレビュー：
```bash
npm run policy:explain
```

更新の提案（差分を表示し、承認を求めます）：
```bash
npm run policy:propose
```

現在のポリシーファイルを、標準化された形式に変換（フォーマットのみの正規化）：
```bash
npm run policy:canonicalize
```

### 自動ロールバックの安全性

変更を適用する際、`policy-check`は、古いポリシーを最初にバックアップできます。

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## ポリシーファイル

推奨される構成：

- `policies/default.json` — アクティブなポリシー
- `policies/previous.json` — 自動ロールバックの対象
- `policies/profiles/*.json` — 名前付きプロファイル（作業用 / 低摩擦 / 安全モード）

## CLIオプション（policy-check）

- `--explain` — 人間が読めるポリシーの概要を表示
- `--propose <file>` — lintを実行し、標準化された差分を表示し、承認を求める
- `--apply` — ポリシーファイルを、標準化された形式で書き換える
- `--write-prev <file>` — 既存のポリシーファイルを上書きする前に、古い標準化されたポリシーをバックアップする
- `--diff short|full` — `short`は主要な変更点のみを表示し、`full`はすべてを表示
- `--prev <file>` — 決定的なCI差分モード

## 公開API

**カーネル（推奨されるエントリポイント）：**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — `decide`、`lint`、`explain`、`diff`、および学習機能を備えた、事前設定されたインターフェース
- `PolicyBuilder` — 検証済みのポリシーを構築するための、チェーン可能なAPI

**ポリシー操作：**

- `lintPolicy(policy, { registry, scorers })` — ポリシーのエラーと警告を検証
- `canonicalizePolicy(policy, registry)` — ポリシーを標準化された形式に変換
- `diffPolicy(a, b, registry?)` — 2つのポリシー間の構造化された差分
- `explainPolicy(policy, registry, opts?)` — 人間が読めるポリシーの概要

**永続化：**

- `loadPolicy(json)` — 不明な入力から、Zodで検証されたポリシーをロード
- `dumpPolicy(policy)` — 決定的なJSONシリアライゼーション（ソートされたキー）
- `PreferencePolicySchema` — 実行時検証のための、エクスポートされたZodスキーマ

**意思決定エンジン：**

- `DecisionEngine` — ポリシーに基づいて、候補となる計画を評価（フィルタリング → スコアリング → 選択 または 質問）
- `decideAsync()` — I/Oバウンドな制約チェックのための、非同期バージョン
- `compileEffectivePolicy(base, context, plans)` — コンテキストルールを適用（`tool:*`のようなglobパターンをサポート）
- `onDecision`フック — 意思決定ごとに、ログやメトリクスを記録するための、オプションのコールバック関数

**レジストリ：**

- `ConstraintRegistry` — 制約を登録および評価（オプションで、Zodパラメータスキーマと非同期サポートあり）
- `ScorerRegistry` — 重みキーのスコアリング関数を登録
- `registerDefaultConstraints(registry)` — 組み込みの制約をロード（`no_irreversible_changes`、`max_spend_without_confirm`、`require_confirm_if`）
- `registerDefaultScorers(registry)` — 組み込みのスコアリング関数をロード（`efficiency`、`low_risk`、`concise`）

**学習ループ：**

- `proposePolicyUpdates(policy, events)`：ユーザーからのフィードバックイベントに基づいて、ポリシーの調整を提案します。
- `applyPolicyProposal(policy, proposal)`：提案をポリシーにマージします（フィードバックループを閉じます）。
- 拡張されたフィードバック：`CONSTRAINT_RELAXED`、`PLAN_EDITED`、`TIMEOUT`、`ABORT`

**MCP連携:**

- `planFromMcpToolCall(call, meta?)`：MCPツールの呼び出しをPlanに変換します。
- `feedbackFromMcpResult(result, planId)`：MCPの結果をFeedbackEventに変換します。

**ユーティリティ:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)`：ステップの内容に基づいて、Planに自動的にタグを付与します。
- `matchesContext(pattern, context)`：グロブに対応したコンテキストパターンマッチングを行います。

## CI

CIの実行内容：
- テスト（17のファイルにまたがる143個のテスト）
- ビルド
- `policy-check --strict` を、テストデータ（`policies/default.json`と`policies/previous.json`）に対して実行

これにより、不具合のあるポリシーや誤解を招く差分がリリースされるのを防ぎます。

## 開発

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## セキュリティとデータ範囲

Civility Kernelは、**純粋なライブラリ**です。ネットワークリクエスト、テレメトリ、および副作用はありません。

- **アクセスするデータ:** ローカルファイルシステムからJSON形式のポリシーファイルを読み込みます。ポリシー文書を検証、標準化し、プロセス内で差分を比較します。すべての操作は決定論的です。
- **アクセスしないデータ:** ネットワークリクエストは行いません。テレメトリも行いません。認証情報の保存も行いません。Kernelはポリシーの制約を評価しますが、エージェントのアクションを監視したり、ログに記録したりしません。
- **必要な権限:** ポリシーJSONファイルのファイルシステムへの読み取り権限。`--apply`オプションが明示的に指定された場合のみ、書き込み権限が必要です。

脆弱性に関する報告は、[SECURITY.md](SECURITY.md) を参照してください。

---

## スコアカード

| カテゴリ | スコア |
|----------|-------|
| セキュリティ | 10/10 |
| エラー処理 | 10/10 |
| オペレーター向けドキュメント | 10/10 |
| リリース時の品質 | 10/10 |
| 認証 | 10/10 |
| **Overall** | **50/50** |

---

## ライセンス

MIT（LICENSEを参照）

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が作成しました。
