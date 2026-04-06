<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

現在、**Unreal Engine 5** を、組み込みの Remote Control API を通じてサポートしています。サードパーティ製のプラグインは不要です。C++ のコンパイルも不要です。API を有効にするだけで、すぐに使い始めることができます。

## どんな感じか？

> **あなた:** テーブルの上にポイントライトを生成し、暖色系の光にしてください。

LLM が `ue_spawn_actor` を呼び出し、トランスフォームを設定し、`ue_set_property` を通じて色温度を調整します。すると、ライトがあなたのビューポートに表示されます。あなたが会話を続けると、システムが処理を続けます。

## クイックスタート

### 1. UE5 での Remote Control API の有効化

1. UE5 プロジェクトを開きます (5.4 以降)。
2. **編集 > プラグイン** → "Remote Control API" を検索 → 有効にする
3. エディターを再起動します。

このプラグインは、すでに UE5 に組み込まれています。単に有効にするだけです。

### 2. インストールと設定

```bash
npx @mcptoolshop/game-dev-mcp
```

MCP クライアントの設定ファイル (例: Claude Desktop の `claude_desktop_config.json`) に以下を追加します。

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

### 3. テスト

LLM に **"Ping Unreal Engine"** と指示します。すると、`ue_ping` が呼び出され、接続が確認されます。

## できること

### アクター (9つのツール)
レベル内のアクターを生成、削除、複製、変換、一覧表示、検索、選択します。あらゆるアクタークラスに対応します。メッシュ、ライト、カメラ、ボリュームなど。

### プロパティ (4つのツール)
あらゆる UObject のあらゆる UPROPERTY を読み書きできます。`ue_describe_object` を使用して、利用可能なものを確認し、必要なものを正確に取得または設定します。

### アセット (8つのツール)
コンテンツブラウザを検索し、ディレクトリを一覧表示し、存在を確認し、アセットを複製、名前変更、削除、保存します。

### レベル (4つのツール)
現在のレベルを保存したり、別のレベルをロードしたり、レベル情報を取得したり、すべての変更されたパッケージを一度に保存したりできます。

### ブループリント (5つのツール)
ブループリントクラスを最初から作成し、コンポーネントを追加し、そのプロパティを設定し、コンパイルし、インスタンスを生成します。すべて会話を通じて行えます。

### エディター (4つのツール)
接続をテストしたり、コンソールコマンドを実行したり、エンジン情報を取得したり、ビューポートを任意のオブジェクトにスナップさせたりできます。

### 知識 (1つのツール)
35 の組み込み UE5 チュートリアルをオンデマンドで検索できます。これにより、LLM が会話中に Nanite の仕組みや、Behavior Tree とは何なのかを調べることができます。

### プロジェクト (7つのツール)
プロジェクト固有の規約、メモ、コンテキストを `.game-dev-mcp/` に保存し、セッション間で永続化します。

### ミッション (2つのツール)
マルチステップ操作中の進捗状況を追跡します。リアルタイム通知のために、[mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) と連携します。

**合計: 44 のツール**

## 知識ライブラリ

サーバーには、35 のチュートリアルが MCP リソースとしてバンドルされています。LLM は、必要な情報が実際に必要になるまで、オンデマンドでそれらを読み込みます。

| カテゴリ | 概要 |
| ---------- | -------- |
| **Getting Started** | セットアップ、最初のコマンド、プロジェクト構造 |
| **Actors** | 生成、変換、型参照、コンポーネント |
| **Assets** | コンテンツブラウザ、検索パターン、インポート |
| **Blueprints** | 基本、作成、コンポーネント設定 |
| **Levels** | 管理、ワールドコンポジション |
| **Materials** | 基本、マテリアルインスタンス |
| **Lighting** | ライトの種類、ワークフロー |
| **Physics** | シミュレーション、コリジョン、制約 |
| **Audio** | サウンドキュー、減衰、空間オーディオ |
| **Animation** | スケルトンメッシュ、AnimBP、モンタージュ |
| **Visual Effects** | Niagara パーティクル、GPU シミュレーション |
| **Rendering** | Nanite、Lumen、仮想シャドウマップ |
| **AI & Navigation** | NavMesh、ビヘイビアツリー、EQS |
| **Cinematics** | シーケンサー、カメラ、フィルムレンダリング |
| **Virtual Assistant** | MetaHuman アシスタント、LLM 統合 |
| **API Reference** | Remote Control API、サブシステム参照 |
| **Patterns** | 一般的なワークフロー、エラー処理、パフォーマンス |

## プロジェクト知識

あなたのLLMは、プロジェクト固有のコンテキストを保存し、呼び出すことができます。

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

`.game-dev-mcp/` に保存され、セッション間で保持されるため、AIはあなたが中断した箇所から処理を再開します。

## 設定

| 変数 | デフォルト値 | 説明 |
| ---------- | --------- | ------------- |
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | ゲームエンジンエディタのホスト名 |
| `GAMEDEV_MCP_PORT` | `30010` | リモートAPIのポート番号 |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | リクエストタイムアウト（ミリ秒） |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | ログレベル（エラー/警告/情報/デバッグ） |

## 要件

- Node.js 18以上
- Remote Control APIプラグインが有効になっているUnreal Engine 5.4以上

## マニュアル

詳細な手順（セットアップ、実践的なパターン、トラブルシューティング、およびすべてのツールの説明）については、**[マニュアル](HANDBOOK.md)** を参照してください。

## ライセンス

MIT — <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> が開発しました。
