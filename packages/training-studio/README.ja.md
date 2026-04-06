<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# トレーニングスタジオ

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**ブラウザ上で機械学習モデルを直接トレーニングできます。クラウドは不要。データアップロードも不要。Pythonのセットアップも不要です。**

Training Studioは、TensorFlow.jsを基盤とした機械学習トレーニングアプリケーションで、完全にローカルで動作します。あなたのデータはデバイスから一切外部に出ません。

## Training Studioの利点

| 問題点 | 解決策 |
| --------- | ---------- |
| Python環境の煩雑さ | **セットアップ不要** - 開くだけでトレーニング開始 |
| クラウドMLにおけるプライバシーへの懸念 | **100%ローカル** - データはデバイスから一切外部に出ない |
| 複雑な機械学習ツール | **シンプルなワークフロー** - CSVファイルを読み込み、トレーニング済みのモデルを出力 |
| イテレーションの遅さ | **リアルタイムフィードバック** - ライブチャートとメトリクス |

## 機能

### コアトレーニング
- **CSVデータセットの読み込み** - 自動的な特徴量/ラベルの検出
- **MLPモデルの設定** - 隠れ層、活性化関数、ドロップアウト
- **リアルタイムトレーニングチャート** - 損失と精度の可視化
- **早期終了** - 自動的な収束検出
- **GPUアクセラレーション** - WebGPU/WebGLによる高速トレーニング

### 評価と予測
- **混同行列** - 分類性能の可視化
- **クラスごとのメトリクス** - 適合率、再現率、F1スコア
- **単一予測** - 個々のサンプルをテスト
- **バッチ推論** - CSVファイルに対する予測
- **結果のエクスポート** - 予測結果をCSVファイルとしてダウンロード

### データツール
- **前処理** - 正規化、欠損値の処理
- **One-hotエンコーディング** - 自動的なカテゴリ変数の変換
- **訓練/テスト分割** - 設定可能な検証割合
- **トレーニング履歴** - 複数の実行結果を比較し、最適なモデルを見つける

### 本番環境対応
- **283個のテスト** - 包括的なテストカバレッジ
- **アクセシビリティ** - WCAG 2.1 AAに準拠
- **レスポンシブ** - タブレットやモバイルでも動作
- **オフライン対応** - インストール後はインターネット接続不要

## インストール

### ソースコードから

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## クイックスタート

### バンドルの検証 (30秒)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### JSON出力

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### 終了コード

| Code | 意味 |
| ------ | --------- |
| 0 | 有効なバンドル |
| 2 | 警告付きで有効なバンドル |
| 3 | 無効なバンドル |

## バンドル形式

完全なバンドル仕様については、[SPEC.md](SPEC.md) を参照してください。

### ディレクトリ構造

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## クイックスタート (Webアプリケーション)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

その後、ブラウザで http://localhost:5173 を開きます。

### サンプルデータで試す

1. **Dataset** タブをクリック
2. `sample_data/iris.csv` をロード
3. 特徴量を選択: sepal_length, sepal_width, petal_length, petal_width
4. ラベルを選択: species
5. **Model** タブに移動し、デフォルト設定を使用 (64, 32の隠れ層)
6. **Train** タブに移動し、**Start Training** をクリック
7. リアルタイムでチャートが更新されるのを確認！

## デスクトップアプリケーション (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Windows 10 1809 以降、4GB の RAM (8GB 推奨)、WebGL 2.0 または WebGPU をサポートする GPU (オプション、CPU による代替) が必要です。

## 開発

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## ドキュメント

| ドキュメント | 説明 |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | バンドル形式仕様 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 一般的な問題と解決策 |
| [CHANGELOG.md](CHANGELOG.md) | バージョン履歴 |
| [ROADMAP.md](ROADMAP.md) | 開発ロードマップ |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 貢献方法 |

## サンプルデータセット

| File | Task | 機能 | クラス |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | 多クラス分類 | 4 | 3 |
| `sample_data/binary_classification.csv` | 二値分類 | 2 | 2 |

## プライバシーとセキュリティ

- **データはデバイス内に保存** - ユーザーのデータはデバイスから離れません。
- **テレメトリーなし** - 使用状況の追跡は行いません。
- **オフライン対応** - インターネット接続なしで使用できます。
- **オープンソース** - コードを自由に監査できます。

詳細については、[PRIVACY.md](PRIVACY.md) および [SECURITY.md](SECURITY.md) を参照してください。

## ライセンス

MIT - 詳細については、[LICENSE](LICENSE) を参照してください。

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) が作成しました。
