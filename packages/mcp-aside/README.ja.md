<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## なぜですか

LLM（大規模言語モデル）は、時々、思考の糸を失ってしまうことがあります。ふと浮かんだ考え、未だ明確でない懸念、あるいは「これは後で戻って議論すべきだ」という発言が、結局は忘れ去られてしまうこともあります。**mcp-aside**は、モデルに専用の受信箱を提供し、そういった一時的な話題や懸念事項をそこに一時的に保存できるようにします。この受信箱は、送信回数に制限が設けられ、重複した内容は削除され、自動的に期限が切れるため、受信箱自体が問題を引き起こすことはありません。

これは、会話の横に置いた付箋のようなものです。モデルがメモを書き込みます。そして、適切なタイミングで、あなた（またはモデル）がそれらのメモを読みます。

## 動作原理

1. モデルは、優先度とともに内容を付与して、`aside.push`関数を呼び出します。
2. ガードレールは、重複、レート制限、およびTTL（生存期間）の上限を確認します。
3. 確認を通過した場合、その内容はメモリ内の受信箱に格納されます。
4. クライアントは、`notifications/resources/updated`を通じて通知を受け取ります。
5. 誰でも、`interject://inbox`リソースを通じて受信箱の内容を閲覧できます。

データベースも、永続的な保存機能もありません。サーバーが停止すると、受信トレイの内容はすべて消えてしまいます。これは設計上の仕様です。

## クイックスタートガイド

```bash
npm install
npm run build
node build/index.js
```

このサーバーは、標準入出力（stdio）を介してMCPプロトコルを使用しています。 MCPに対応したクライアントをこのサーバーに向けて接続してください。

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## 道具

| 道具。 | その機能・役割. |
| The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) |
| `aside.push` | 受信箱にメッセージを挿入します。以下のパラメータを受け付けます：`text` (メッセージ本文)、`priority` (優先度：低、中、高)、`reason` (理由)、`tags` (タグ)、`expiresAt` (有効期限)、`source` (送信元)、および `meta` (メタデータ)。 |
| `aside.configure` | 実行時に、ガードレールの設定を調整できます。具体的には、TTL（Time To Live）の制限、レート制限、重複排除ウィンドウ、および通知の閾値を設定できます。 |
| `aside.clear` | 受信トレイを空にする。 |
| `aside.status` | 受信トレイのサイズと現在の制限設定に関する、読み取り専用のスナップショットです。 |

## 資源

| URI (Uniform Resource Identifier：一様な資源識別子) | 説明 |
| The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) |
| `interject://inbox` | 保留中の補足情報をJSON形式の配列で表示します。最新のものが最初に表示されます。一度閲覧されたアイテムは、表示から除外されます。 |

## 手すり
護欄
安全柵

すべての設定は、`aside.configure` メソッドを通じて行えます。デフォルト設定は以下の通りです。

| 設定。 | デフォルト設定 | 制御対象. |
| The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。) |
| `defaultTtlSeconds` | 600 (10分) | インタージェクションが、明示的な有効期限が設定されていない場合、どのくらいの期間有効でしょうか。 |
| `maxTtlSeconds` | 3600秒（1時間） | TTL（生存時間）の上限値を厳しく制限し、呼び出し元がより大きな値を要求した場合でも、その上限を超えることはありません。 |
| `dedupeWindowSeconds` | 300 (5分) | 同じ優先順位、テキスト、理由がすべて一致する場合、このウィンドウ内で表示が抑制されます。 |
| `rateLimitWindowSeconds` | 60 | レート制限のためのスライディングウィンドウ方式。 |
| `rateLimitMax` | 低: 6、中: 3、高: 1 | 各優先度、各ウィンドウにつき、最大処理数。 |
| `notifyAtOrAbove` | 高い。 | この優先度以上の重要度を持つ項目に対してのみ、ログ通知を送信します。 |

## 設定

### タイマー起動機能

内蔵されたタイマーは5分ごとに起動し、優先度の低い「何か障害物がないか？」という確認処理を行います。この処理は、手動で実行する処理と同様の制限（重複排除やレート制限など）が適用されます。タイマー機能を無効にするには、`index.ts`ファイル内の`startTimerTrigger`の呼び出し部分をコメントアウトしてください。

### MCP インスペクター

ローカル環境でのテストを行う場合：

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## 備考

- ログは標準エラー出力（stderr）に出力されます。標準出力（stdout）は、MCP JSON-RPC 専用です。
- 受信ボックスは一時的なものです。再起動すると、内容はすべて消去されます。
- メッセージは、新しいものから順に保存されます。期限切れのメッセージは、読み込み時およびメッセージ送信時に削除されます。

## ライセンス

[MITライセンス](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
