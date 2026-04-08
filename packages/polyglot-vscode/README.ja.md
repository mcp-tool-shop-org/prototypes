<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## **機能**

Polyglotは、ローカルのGPU上で[TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma)を[Ollama](https://ollama.com)を通じて実行します。APIキーは不要で、クラウドサービスも利用せず、データはローカルマシンから一切外部に出ません。

- **選択範囲の翻訳:** テキストを選択し、`Ctrl+Alt+T`キーを押して、翻訳先の言語を選択します。
- **ファイルの翻訳:** ファイル全体を翻訳し、元のファイルと並行して`file.ja.ext`という新しいファイルを作成します。
- **READMEの翻訳:** `README.md`ファイルを7つの言語にまとめて翻訳します。コードブロック、表、バッジなどはそのまま保持されます。
- **サイドバーパネル:** アクティビティバーにグローブアイコンが表示され、アクションボタンとOllamaの状態を表示します。

## **必要条件**

- [Ollama](https://ollama.com)がインストールされ、実行されていること
- モデルを実行するために十分なVRAMを搭載したGPU ( `translategemma:12b`の場合は12GB、 `translategemma:2b`の場合は2GB)
- モデルは初回利用時に自動的にダウンロードされます。

## **始め方**

1. 拡張機能をインストールします。
2. アクティビティバー（左側のサイドバー）にあるグローブアイコンをクリックします。
3. **状態確認**をクリックします。PolyglotはOllamaを起動し、必要に応じてモデルをダウンロードします。
4. テキストを選択し、`Ctrl+Alt+T`キー（Macの場合は`Cmd+Alt+T`）を押します。

## **コマンド**

| コマンド | ショートカット | 説明 |
|---------|----------|-------------|
| **Polyglot: 選択範囲の翻訳** | `Ctrl+Alt+T` | 選択したテキストをその場で翻訳します。 |
| **Polyglot: Translate File** | — | 現在のファイルを新しいファイルに翻訳します。 |
| **Polyglot: READMEの翻訳** | — | `README.md`ファイルを複数の言語にまとめて翻訳します。 |
| **Polyglot: Check Status** | — | Ollamaの接続状態とモデルの利用可能性を確認します。 |
| **Polyglot: Help** | — | 設定、チュートリアル、リンクへのクイックアクセスを提供します。 |

## **アクセス方法**

- **サイドバーパネル:** アクティビティバーにあるグローブアイコン（スタイリッシュなアクションボタン付き）
- **エディタのタイトルバー:** テキストが選択されている場合にグローブアイコンが表示されます。
- **右クリックメニュー:** エディタのコンテキストメニューに「選択範囲の翻訳」が表示されます。
- **コマンドパレット:** `Ctrl+Shift+P` → 「Polyglot」と入力します。
- **キーボードショートカット:** 選択したテキストに対して`Ctrl+Alt+T`キーを押します。

## **設定**

| 設定項目 | デフォルト値 | 説明 |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | OllamaサーバーのURL |
| `polyglot.model` | `translategemma:12b` | 翻訳モデル (VRAMの使用量を減らすために`2b`を試してみてください) |
| `polyglot.defaultSourceLanguage` | `en` | 翻訳元の言語 |
| `polyglot.defaultLanguages` | 7言語 | README翻訳の対象言語 |

## サポートされている言語

アラビア語、ベンガル語、ブルガリア語、カタルーニャ語、中国語（簡体字・繁体字）、クロアチア語、チェコ語、デンマーク語、オランダ語、英語、エストニア語、フィンランド語、フランス語、ドイツ語、ギリシャ語、グジャラート語、ヘブライ語、ヒンディー語、ハンガリー語、インドネシア語、イタリア語、日本語、カナーダ語、韓国語、ラトビア語、リトアニア語、マケドニア語、マレー語、マラヤーラム語、マラーティー語、ノルウェー語、ペルシア語、ポーランド語、ポルトガル語、ルーマニア語、ロシア語、セルビア語、スロバキア語、スロベニア語、スペイン語、スワヒリ語、スウェーデン語、タミル語、テルグ語、タイ語、トルコ語、ウクライナ語、ウルドゥー語、ベトナム語、ウェールズ語。

## **仕組み**

Polyglotは、ローカル翻訳エンジンである[@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp)をラップしています。

1. Ollamaが実行されていない場合は、自動的に起動します。
2. 翻訳モデルは初回利用時に自動的にダウンロードされます。
3. 長いテキストは、段落または文の境界で分割されます。
4. 正確な技術用語のために、ソフトウェア用語集が適用されます。
5. 一般的なモデルの不具合（重複した代替案、末尾のピリオドなど）を修正します。

READMEの翻訳では、インテリジェントなセグメンテーションを使用します。コードブロック、HTMLバッジ、URLは変更されずに保持され、見出し、段落、表の内容は翻訳されます。

## セキュリティとデータ範囲

**アクセスするデータ:** アクティブなエディタ内のテキスト（選択時は読み取り専用、置換時は書き込み）、翻訳ファイル/README ファイルの翻訳に使用するワークスペース内のファイル（オリジナルファイルに加えて新しいファイルが作成されます）。
**アクセスしないデータ:** ワークスペース外のファイル、OS の認証情報、ブラウザのデータは一切アクセスしません。
**ネットワーク:** ローカルの Ollama サーバー（デフォルトでは `localhost:11434`）にのみ接続します。**クラウドへのデータ送信は一切ありません。**
**テレメトリーデータは一切収集または送信しません。**

## ライセンス

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
