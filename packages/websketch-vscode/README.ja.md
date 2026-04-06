<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## 問題

ウェブページのレイアウト、ナビゲーション、インタラクティブな要素、コンテンツの階層構造について、LLM（大規模言語モデル）に推論させたい。しかし、現在の選択肢はどれも不十分です。

| アプローチ | トークン | 失われるもの |
|----------|--------|---------------|
| **Screenshot** | 1,000以上（画像認識） | 小さなテキストが読めない、レイアウトを推測する、インタラクティブな情報がゼロ |
| **Raw HTML** | 50,000～500,000 | `div` 要素の羅列、インラインスタイル、スクリプト、SVGノイズに埋もれる |
| **Readability extract** | 2,000～10,000 | すべての構造が削除される。ナビゲーション、ボタン、フォームがなくなる |
| **DOM dump** | 10,000～100,000 | クラス名、データ属性、フレームワークの痕跡が至る所に存在する |

根本的な問題：**これらはすべて、UI（ユーザーインターフェース）の言語を理解していない**。LLMは `<div class="sc-bdnxRM jJFqsI">` のような記述を必要としない。`NAV`、`BUTTON`、`CARD`、`LIST` のような情報を必要とする。

## 解決策

WebSketch は、23種類の UI の基本要素を使用して、ページを**意味的なツリー構造**に変換します。VS Code でワンクリックするだけで、任意の LLM に貼り付けることができます。

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200～800 トークン**。50,000 トークンではなく、ピクセルグリッドでもありません。あらゆるテキストモデルが推論できる、クリーンなツリー構造です。

### 比較

| 評価項目 | WebSketch | 生の HTML | スクリーンショット |
|--------|-----------|----------|------------|
| **Tokens** | 200～800 | 50,000+ | 1,000以上（画像認識） |
| **Structure** | 完全な意味的なツリー構造 | ネストされた `div` 要素の混沌 | ピクセルグリッド |
| **Text content** | 引用符付きでラベル付け | マークアップの中に埋もれている | OCR（光学文字認識）に依存 |
| **Interactive elements** | `*` でマークされている | 属性の中に隠されている | 不可視 |
| **Heading hierarchy** | `<h1>` から `<h6>` | クラス名の中に紛れている | サイズから推測 |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | DOM（Document Object Model）の知識が必要 | 利用不可 |
| **Works with** | あらゆるテキストベースの LLM | 役に立つ情報なし | 画像認識モデルのみ |

## クイックスタート

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) からインストールするか、次のコマンドを実行します。
```
ext install mcp-tool-shop.websketch-vscode
```
2. コマンドパレット (`Ctrl+Shift+P` / `Cmd+Shift+P`) を開きます。
3. **WebSketch: Capture URL** を実行します。
4. URL を貼り付けて Enter キーを押します。
5. **Copy for LLM** をクリックして、LLM のプロンプトに貼り付けます。

LLM タブがデフォルトの表示です。ワンクリックでツリー構造がクリップボードにコピーされ、あらゆるモデルで使用できます。

## 動作原理

ツリー構造の各行は、情報密度が高く、機械的に解析可能です。

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### 文法

| 記号 | 意味 | 例 |
|--------|---------|---------|
| `*` プレフィックス | ユーザーが操作可能 | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | HTML5/ARIA の意味が保持されている | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | レイアウトの動作 | `{sticky}`, `{scrollable}` |
| `"label"` | 表示されるテキストコンテンツ | `"Sign up free"`, `"Search..."` |
| `(N items)` | リストの項目数 | `LIST (12 items)` |
| インデント | 親子関係 | `HEADER > NAV > LIST > LINK` |

### 23 の役割

| カテゴリ | 役割 |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

これらの 23 の役割は、固定された語彙であり、すべてのウェブサイトで共通です。LLM はこれを一度学習すれば、どのページでも推論できます。

## キャプチャされるもの

WebSketch は、DOM（Document Object Model）をそのまま出力するだけではありません。すべての表示要素に対して、**5 段階の分類器**を実行します。

| 段階 | ソース | 例 |
|------|--------|---------|
| 1. **ARIA 役割** | `role="navigation"` | &rarr; `NAV` |
| 2. **HTML タグ** | `<button>`, `<h1>` | &rarr; `BUTTON`、`TEXT <h1>` |
| 3. **クラスのヒューリスティック** | `.card`, `.modal`, `.toast` | &rarr; `CARD`、`MODAL`、`TOAST` |
| 4. **構造分析** | 同じ役割を持つ要素が 3 つ以上 | &rarr; `LIST` |
| 5. **フォールバック** | テキストのみの要素 | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

その後、不要なものを削除します。

- **透明なテーブルのトラバース:** `TR`/`TD`/`TH`/`LI` 要素はスキップされ、子要素が最上位に昇格されます。
- **コンテンツのない要素の削除:** 空、非インタラクティブ、または非表示の要素が削除されます。
- **ラッパーの統合:** 無意味な単一の子要素を持つ `SECTION` ラッパーが削除されます。
- **連鎖的な削除:** コンテンツのないラッパーの連鎖が完全に削除されます。
- **ラベルの抽出:** リンク、ボタン、見出し、画像、入力フィールドなどから表示されているテキストが抽出されます。

結果：ページの内容を理解するために必要な最小限のノードを持つ、整理されたツリー構造が得られます。

## 利用例

### プロンプトエンジニア向け

**「このページのレイアウトを説明してください」:** ツリー構造を貼り付けます。LLM（大規模言語モデル）は、HTML に埋もれることなく、正確な構造、見出し、ナビゲーションを認識できます。ChatGPT、Claude、Gemini、Llama など、あらゆるテキストモデルで使用できます。

**「このページでユーザーは何ができますか？」:** すべてのインタラクティブ要素が `*` でマークされます。リンク、ボタン、入力フィールド、チェックボックスなど、すべてに表示されているテキストがラベルとして付与されます。LLM は、ユーザーが実行できるすべての操作を列挙できます。

**「これらの2つのページを比較してください」:** 2つのツリー構造を並べて表示します。LLM は、構造の違いを検出し、欠落している要素を特定し、ナビゲーションパターンを比較できます。これらはすべて、数百のトークンで完了できます。

### 開発者向け

**「この UI のテスト計画を生成してください」:** ツリー構造は、テスト対象と直接対応します。`*BUTTON "Submit"`、`*INPUT <email> "Enter email"`、`*LINK "Terms"` など、それぞれがテスト可能なインタラクションであり、表示されているラベルが付いています。

**「これを参考に何かを作成してください」:** セマンティックなツリー構造は、コンポーネントの階層構造と近いため、React/Vue/Svelte コンポーネントに直接対応させることができます。LLM は、一致するレイアウトを生成できます。

**「このページのアクセシビリティを監査してください」:** 欠落しているランドマーク、ラベルのない入力フィールド、見出しの階層の不整合など、すべてがツリー構造で確認できます。`<main>`, `<nav>`, `<search>` などのセマンティックなヒントは、存在する（または存在しない） ARIA ロールを示します。

### AI エージェント向け

**MCP 統合:** [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) を使用して、AI エージェントが、ツールチェーンの一部として、任意のウェブページをキャプチャし、理解する機能を付与できます。

**自動監視:** [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) を使用して、ページを定期的にキャプチャし、ツリー構造を比較して、構造的な変更を検出できます。

## 4つのビュー

| タブ | 表示内容 | 最適な用途 |
|-----|---------------|----------|
| **LLM** (default) | ラベル、セマンティクス、フラグが付いたインデントされたセマンティックツリー | LLM プロンプトへの貼り付け |
| **ASCII** | 空間レイアウトを示すボックス描画のワイヤーフレーム | 視覚的なレイアウトの理解 |
| **Tree** | 色分けされたロールバッジを持つ、折りたたみ可能なノードツリー | キャプチャのデバッグ |
| **JSON** | 構文強調表示付きの完全な `WebSketchCapture` IR | プログラムの使用とパイプライン |

## コマンド

| コマンド | 説明 |
|---------|-------------|
| `WebSketch: Capture URL` | URL、キャプチャ、表示を促す |
| `WebSketch: Capture URL from Clipboard` | クリップボードにある URL をキャプチャする |
| `WebSketch: Copy LLM Tree to Clipboard` | ツリー構造をコピーして、ChatGPT、Claude などに直接貼り付ける |
| `WebSketch: Export LLM Tree` | プロンプトライブラリまたはドキュメント用に `.md` 形式で保存する |
| `WebSketch: Export Capture as JSON` | 境界ボックス、ハッシュ、メタデータを含む完全な IR キャプチャ |
| `WebSketch: Export ASCII Wireframe` | ボックス描画レイアウトビュー |

## 設定

| 設定 | デフォルト | 説明 |
|---------|---------|-------------|
| `websketch.chromePath` | 自動検出 | Chrome または Edge の実行可能ファイルへのパス |
| `websketch.viewportWidth` | `1280` | ピクセル単位のビューポート幅 |
| `websketch.viewportHeight` | `800` | ピクセル単位のビューポート高さ |
| `websketch.timeout` | `30000` | ナビゲーションタイムアウト (ms) |
| `websketch.waitAfterLoad` | `1000` | JavaScript のレンダリングのための追加待機時間 (ms) |

## エコシステム

WebSketchは、共通の文法に基づいて構築されたツール群です。

| パッケージ | 機能 |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | コア機能：文法、検証、レンダリング、差分検出、フィンガープリンティング |
| **websketch-vscode** | VS Code拡張機能：エディタからページをキャプチャ（このリポジトリ） |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | コマンドラインによるキャプチャとレンダリング |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | ブラウザ内でのキャプチャを行うChrome拡張機能 |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | LLMエージェント連携のためのMCPサーバー |

すべてのツールは同じ`WebSketchCapture`のIR（中間表現）を生成するため、異なるパイプライン間でも出力が互換性があります。

## 必要条件

- VS Code 1.85以降
- システムにChromeまたはEdgeがインストールされていること

バンドルされたブラウザは含まれていません。ダウンロードサイズは約200MBです。WebSketchは、既存のブラウザと連携するために`puppeteer-core`を使用します。

## セキュリティとデータ範囲

**アクセスされるデータ:** ユーザーが入力したURL（`puppeteer-core`を使用してローカルのChrome/Edgeをヘッドレスモードで操作）、キャプチャされたページのコンテンツをIRツリーに変換したもの、ワークスペースファイルまたはクリップボードに書き込まれるエクスポートデータ。 **アクセスされないデータ:** ワークスペース外のファイル、OSの認証情報、ブラウザのログインセッション（ヘッドレスモードでプロファイルを使用しない）。 **ネットワーク:** ユーザーが指定したURLのみにアクセスします。他の外部リクエストは行いません。 **テレメトリーは収集または送信されません。**

## ライセンス

MITライセンス。詳細は[LICENSE](LICENSE)を参照してください。

---

開発者：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
