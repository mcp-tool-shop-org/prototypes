<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**利用されていない機能を、技術的な負債になる前に特定します。**

Feature-Reacherは、製品のドキュメント（リリースノート、ドキュメント、FAQなど）を分析し、ユーザーが発見しない可能性のある機能のリストをランク付けして提示する**導入リスク監査**を作成します。

---

## このツールの概要

このツールは、以下の機能を提供します。
- 製品ドキュメントとリリースノートを読み込みます。
- 機能に関する記述と、その根拠となる情報を抽出します。
- 機能の新規性、可視性、ドキュメントの記述密度に基づいてスコアを算出します。
- 実行可能な導入リスクの診断結果を提供します。

## このツールは、以下の機能は提供しません

- 統計分析プラットフォーム（利用状況データの取り込みは行いません）
- 機能フラグシステム
- コードベースに接続されたダッシュボード
- ユーザーが何を求めているかを推測するAI

これは**説明可能なインテリジェンス**です。すべての診断には、引用元となった情報と明確な根拠が付属しています。

---

## フェーズ1で提供される機能

- **ドキュメントのアップロード**: テキストを貼り付けるか、.txt/.mdファイルをアップロードします。
- **機能の抽出**: 見出し、箇条書き、繰り返されるフレーズを抽出します。
- **スコアリングの基準**: 新規性、可視性、ドキュメントの記述密度を考慮します。
- **診断エンジン**: 6種類の診断を行い、トリガーとなる情報と根拠を提供します。
- **ランク付けされた監査レポート**: 導入リスクに基づいて機能をランク付けします。
- **推奨アクション**: 診断ごとに実行可能なアクションを提示します。
- **エクスポート**: テキスト形式と印刷可能なHTMLレポートを生成します。

## フェーズ2で追加される機能（再現性と継続性）

- **監査履歴**: すべての監査結果をIndexedDBに保存し、閲覧、名前変更、削除が可能です。
- **自動保存機能**: 監査を実行すると自動的に保存されます（または手動で保存することも可能です）。
- **ドキュメントセット**: 繰り返し利用できる監査ワークフローのための名前付きコレクションを作成します。
- **監査比較**: 変更点（新規/解決済みのリスク、診断の変更点）を並べて表示します。
- **機能のトレンド**: リスクの経時変化をグラフで表示します。
- **エグゼクティブサマリー**: パートナーとの共有を目的とした、テンプレートに基づいた要約を作成します（AIは使用しません）。
- **テストスイート**: Jest + ts-jestを使用し、ガードレールテストも実施します。

## フェーズ3で追加される機能（マーケットプレイス対応）

- **公開ランディングページ**: `/landing`に、製品の価値と行動喚起を記載します。
- **デモモード**: `/demo`にアクセスすると、サンプルデータが自動的に読み込まれ、すぐに体験できます。
- **法的情報**: プライバシーポリシー、利用規約、サポート連絡先を掲載します。
- **データ取り扱いパネル**: ローカルストレージの使用状況に関する情報を表示し、削除オプションも提供します。
- **オンボーディングツアー**: 新規ユーザー向けの4ステップのガイダンスを提供します。
- **方法論ページ**: `/methodology`で、スコアリングの仕組みを説明します（AIに関する誇張表現は行いません）。
- **エラーハンドリング**: 予期せぬエラーが発生した場合でも、UXが中断されず、診断結果のエクスポートが可能です。
- **アクセシビリティ**: キーボード操作、ARIAヘルパー、スクリーンリーダーへの対応を行います。
- **マーケットプレイス向けアセット**: 製品紹介文、PDFドキュメント、登録チェックリストを提供します。

## このツールが意図的に行わないこと

- 統計分析プラットフォームとの連携
- GitHub、Jira、その他のツールとの統合
- 機能検出のための機械学習モデルの使用
- リアルタイムの監視機能
- 認証またはアカウントの要求
- ナラティブ生成のためのAIの使用（決定的なテンプレートのみ）

これは意図的な設計です。フェーズ3では、統合機能を追加する前に、マーケットプレイスへの対応を検証します。

---

## 使い始め

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)を開きます。

### クイックテスト

1. リリースノートまたはドキュメントを貼り付けます。
2. 「監査を実行」をクリックします。
3. ランク付けされた機能リストを確認します。
4. 各機能の詳細を表示して、根拠となる情報と推奨事項を確認します。
5. レポートをエクスポートします。

### フェーズ2のワークフロー

**再現性フロー:**
1. 監査を実行 → 履歴に自動保存されます。
2. `/history`にアクセスして、保存された監査結果を閲覧します。
3. 繰り返し実行するためのドキュメントコレクションを保存します。
4. `/compare`で2つの監査結果を比較します。
5. `/trends`でトレンドを表示します。

**パートナーとの共有フロー:**
1. 監査を実行 → 「エクスポート」をクリック → 「エグゼクティブサマリー」を選択します。
2. または、2つの監査結果を比較 → 「比較レポートのエクスポート」を選択します。

---

## プロジェクトの構成

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### 主要ファイル

- `src/domain/feature.ts` - 標準的な機能モデル
- `src/domain/diagnosis.ts` - 診断の種類と深刻度
- `src/analysis/extractor.ts` - 機能抽出のヒューリスティック
- `src/analysis/scoring.ts` - 最新性/可視性スコアリング
- `src/analysis/diagnose.ts` - 診断エンジン
- `src/analysis/ranking.ts` - リスクランキングと監査レポート生成
- `src/analysis/actions.ts` - アクションの推奨
- `src/analysis/export.ts` - レポート生成と概要説明
- `src/analysis/diff.ts` - 監査比較エンジン
- `src/analysis/trend.ts` - 機能のトレンド分析
- `src/storage/types.ts` - 永続化の種類
- `src/storage/indexeddb.ts` - IndexedDBの実装

---

## アーキテクチャ

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### 設計原則

1. **魔法は不要**: すべての診断は、引用された証拠に基づいて説明可能であること
2. **まずヒューリスティック**: ヒューリスティックが不十分であると証明されるまで、機械学習は使用しないこと
3. **決定論的**: 同じ入力は常に同じ出力を生成すること
4. **透明性**: ユーザーは、あらゆる結論を元の情報源まで追跡できること

---

## ライセンス

MIT

---

## リリースタグ

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## テストの実行

```bash
npm test
```

テストは、以下の制限事項を確認します。リスクスコアは0～1の範囲に収まること、監査IDが正しい形式でフォーマットされていること、および例外的なケースを適切に処理すること。
