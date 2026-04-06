<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

AIピアノプレイヤー。100曲の楽曲ライブラリ、体系的なレッスン、そしてセッション機能が搭載されています。スピーカーから音が出力され、追加のソフトウェアは不要です。

このプラグインは、[AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session)のMCPサーバーをラップし、スラッシュコマンド、エージェントの個性、そして学習とセッションのための構造化されたワークフローを追加します。

## インストール

```bash
claude plugin add ai-jam-session
```

MCPサーバー (`@mcptoolshop/ai-jam-session`) は、npxによって自動的にダウンロードされます。Node.js 18以降が必要です。

## 同梱物

### スキル（スラッシュコマンド）

| コマンド | 説明 |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | 体系的なレッスンを開始します。 |
| `/ai-jam-session:practice <song> [level]` | パーソナライズされた練習プランを取得します。 |
| `/ai-jam-session:explore [query]` | ジャンル、難易度、またはキーワードで100曲の楽曲ライブラリを検索します。 |
| `/ai-jam-session:jam <song or genre>` | セッションを開始します。Claudeが独自の解釈で演奏します。 |

### エージェント

| Agent | 説明 |
| ------- | ------------- |
| `piano-teacher` | 生徒のレベルに合わせて指導する、忍耐強く教育的な先生。 |
| `jam-musician` | リラックスしたセッションバンドのミュージシャン。グルーヴを重視し、実験を奨励します。 |

### MCPツール (15)

楽曲の検索、再生、レッスン、セッション、管理を行います。プラグインのスキルがこれらのツールを自動的に連携させますが、直接使用することも可能です。

## 使い方

スラッシュコマンドを使用します。

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

または、自然な会話をします。エージェントは、文脈に基づいて自動的に起動します。

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## 楽曲ライブラリ

初心者、中級者、上級者のレベルで、クラシック、ジャズ、ポップ、ブルース、ロック、R&B、ラテン、映画音楽、ラグタイム、ニューエイジなど、10のジャンルに分けて100曲の楽曲が内蔵されています。

## 必要条件

- Node.js 18以降
- スピーカー（ピアノの音はシステムオーディオから出力されます）

## リンク

- MCPサーバー: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- ソースコード: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## ライセンス

MIT
